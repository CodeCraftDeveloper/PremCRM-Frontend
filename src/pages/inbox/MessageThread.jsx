import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  Archive,
  AlertCircle,
  ArrowLeft,
  CheckCheck,
  CheckCircle2,
  Clock,
  Facebook,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  MoreVertical,
  RotateCw,
  Send,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import {
  approveGmailDraft,
  listGmailApprovals,
  rejectGmailDraft,
} from "../../services/inboxApi";
import {
  clearActiveConversation,
  closeConversation,
  createGmailDraft,
  fetchMessages,
  markRead,
  reopenConversation,
  sendMessage as sendMsg,
} from "../../store/slices/inboxSlice";

const CHANNEL_ICONS = {
  gmail: Mail,
  whatsapp: MessageSquare,
  meta: Facebook,
  gmb: MapPin,
};

const CHANNEL_LABELS = {
  gmail: "Gmail",
  whatsapp: "WhatsApp",
  meta: "Meta",
  gmb: "Google Business",
};

const STATUS_ICON = {
  pending: Clock,
  sent: CheckCheck,
  delivered: CheckCheck,
  read: CheckCheck,
  failed: AlertCircle,
  bounced: AlertCircle,
};

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function groupByDate(messages) {
  const groups = [];
  let currentDate = null;

  for (const message of messages) {
    const date = formatDate(message.providerTimestamp || message.createdAt);
    if (date !== currentDate) {
      currentDate = date;
      groups.push({ date, messages: [message] });
    } else {
      groups[groups.length - 1].messages.push(message);
    }
  }

  return groups;
}

function getParticipantLabel(conversation) {
  return (
    conversation.participantName ||
    conversation.contactId?.name ||
    conversation.contactId?.email ||
    conversation.providerThreadId ||
    "Conversation"
  );
}

function getAssigneeLabel(conversation) {
  if (!conversation.assigneeId) return null;
  if (typeof conversation.assigneeId === "string") return "Assigned";
  return conversation.assigneeId.name || conversation.assigneeId.email || "Assigned";
}

export default function MessageThread() {
  const dispatch = useDispatch();
  const {
    activeConversation,
    messages,
    messagesLoading,
    messageSending,
    gmailDraftCreating,
  } = useSelector((state) => state.inbox);

  const [body, setBody] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [gmailApprovals, setGmailApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalActionId, setApprovalActionId] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const isGmailConversation = activeConversation?.channel === "gmail";

  useEffect(() => {
    if (!activeConversation?._id) return;

    dispatch(fetchMessages({ conversationId: activeConversation._id }));
    if (activeConversation.unreadCount > 0) {
      dispatch(markRead(activeConversation._id));
    }
  }, [dispatch, activeConversation?._id, activeConversation?.unreadCount]);

  useEffect(() => {
    let cancelled = false;

    async function loadGmailApprovals() {
      if (!activeConversation?._id || !isGmailConversation) {
        setGmailApprovals([]);
        return;
      }

      setApprovalsLoading(true);
      try {
        const response = await listGmailApprovals({
          status: "pending",
          conversationId: activeConversation._id,
          limit: 100,
        });
        if (!cancelled) setGmailApprovals(response?.data || []);
      } catch {
        if (!cancelled) setGmailApprovals([]);
      } finally {
        if (!cancelled) setApprovalsLoading(false);
      }
    }

    loadGmailApprovals();

    return () => {
      cancelled = true;
    };
  }, [activeConversation?._id, isGmailConversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const dateGroups = useMemo(() => groupByDate(messages), [messages]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!body.trim() || !activeConversation?._id || activeConversation.status === "closed") {
      return;
    }

    try {
      if (isGmailConversation) {
        const result = await dispatch(
          createGmailDraft({
            conversationId: activeConversation._id,
            payload: {
              body: body.trim(),
              autoApprove: false,
            },
          }),
        ).unwrap();
        if (result?.approvalRequest) {
          setGmailApprovals((current) => [
            result.approvalRequest,
            ...current.filter((item) => item._id !== result.approvalRequest._id),
          ]);
        }
        toast.success("Gmail draft created for approval");
      } else {
        await dispatch(
          sendMsg({
            conversationId: activeConversation._id,
            payload: { contentType: "text", body: body.trim() },
          }),
        ).unwrap();
      }
      setBody("");
      inputRef.current?.focus();
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Failed to send message");
    }
  };

  const handleClose = async () => {
    try {
      await dispatch(closeConversation(activeConversation._id)).unwrap();
      toast.success("Conversation closed");
    } catch {
      toast.error("Failed to close conversation");
    }
    setShowActions(false);
  };

  const handleApproveGmail = async (approvalId) => {
    setApprovalActionId(approvalId);
    try {
      await approveGmailDraft(approvalId);
      setGmailApprovals((current) =>
        current.filter((approval) => approval._id !== approvalId),
      );
      toast.success("Gmail draft approved and queued");
      if (activeConversation?._id) {
        dispatch(fetchMessages({ conversationId: activeConversation._id }));
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to approve Gmail draft",
      );
    } finally {
      setApprovalActionId(null);
    }
  };

  const handleRejectGmail = async (approvalId) => {
    const decisionReason = window.prompt("Reason for rejecting this draft");
    if (!decisionReason?.trim()) return;

    setApprovalActionId(approvalId);
    try {
      await rejectGmailDraft(approvalId, {
        decisionReason: decisionReason.trim(),
      });
      setGmailApprovals((current) =>
        current.filter((approval) => approval._id !== approvalId),
      );
      toast.success("Gmail draft rejected");
      if (activeConversation?._id) {
        dispatch(fetchMessages({ conversationId: activeConversation._id }));
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to reject Gmail draft",
      );
    } finally {
      setApprovalActionId(null);
    }
  };

  const handleReopen = async () => {
    try {
      await dispatch(reopenConversation(activeConversation._id)).unwrap();
      toast.success("Conversation reopened");
    } catch {
      toast.error("Failed to reopen conversation");
    }
    setShowActions(false);
  };

  if (!activeConversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20">
          <Mail className="h-10 w-10 text-blue-300 dark:text-blue-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-400 dark:text-gray-500">
          Select a conversation
        </h3>
        <p className="mt-1 text-sm text-gray-300 dark:text-gray-600">
          Choose a thread from the list to view messages.
        </p>
      </div>
    );
  }

  const Icon = CHANNEL_ICONS[activeConversation.channel] || Mail;
  const participant = getParticipantLabel(activeConversation);
  const assignee = getAssigneeLabel(activeConversation);
  const composeDisabled = activeConversation.status === "closed";
  const sending = messageSending || gmailDraftCreating;

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-2.5 dark:border-gray-700">
        <button
          type="button"
          onClick={() => dispatch(clearActiveConversation())}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
          title="Back to conversations"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
            {participant}
          </h3>
          <p className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400">
            <span>{CHANNEL_LABELS[activeConversation.channel] || activeConversation.channel}</span>
            <span>/</span>
            <span
              className={`capitalize ${
                activeConversation.status === "open"
                  ? "text-emerald-500"
                  : activeConversation.status === "closed"
                    ? "text-gray-400"
                    : "text-amber-500"
              }`}
            >
              {activeConversation.status}
            </span>
            {assignee && (
              <>
                <span>/</span>
                <User className="h-2.5 w-2.5" />
                <span>{assignee}</span>
              </>
            )}
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowActions((visible) => !visible)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Conversation actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {showActions && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10 cursor-default"
                aria-label="Close conversation actions"
                onClick={() => setShowActions(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {activeConversation.status !== "closed" ? (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Close
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReopen}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    Reopen
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {messagesLoading && messages.length === 0 ? (
          <div className="space-y-4 py-8">
            {[42, 68, 52, 74].map((width, index) => (
              <div key={width} className={`flex ${index % 2 === 0 ? "" : "justify-end"}`}>
                <div
                  className="h-12 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
                  style={{ width: `${width}%` }}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
            <p className="text-xs text-gray-400">No messages yet</p>
          </div>
        ) : (
          dateGroups.map((group) => (
            <div key={group.date || "unknown-date"}>
              <div className="my-3 flex items-center gap-3">
                <div className="flex-1 border-t border-gray-100 dark:border-gray-800" />
                <span className="text-[10px] font-medium text-gray-400">
                  {group.date || "Undated"}
                </span>
                <div className="flex-1 border-t border-gray-100 dark:border-gray-800" />
              </div>
              {group.messages.map((message) => {
                const isOutbound = message.direction === "outbound";
                const StatusIcon = STATUS_ICON[message.status] || Clock;
                const timestamp = message.providerTimestamp || message.createdAt;

                return (
                  <div
                    key={message._id}
                    className={`mb-2 flex ${isOutbound ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                        isOutbound
                          ? "rounded-br-md bg-blue-600 text-white"
                          : "rounded-bl-md bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {message.subject && (
                        <p className="mb-1 text-[11px] font-semibold opacity-80">
                          {message.subject}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
                        {message.body || "[No message text]"}
                      </p>
                      {message.attachments?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((attachment) => (
                            <div
                              key={attachment.storageKey || attachment.providerMediaId || attachment.filename}
                              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] ${
                                isOutbound ? "bg-blue-500/40" : "bg-white dark:bg-gray-700"
                              }`}
                            >
                              <FileText className="h-3 w-3" />
                              <span className="truncate">
                                {attachment.filename || attachment.mimeType || "Attachment"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                          isOutbound ? "text-blue-200" : "text-gray-400"
                        }`}
                      >
                        <span>{formatTime(timestamp)}</span>
                        {isOutbound && (
                          <StatusIcon
                            className={`h-3 w-3 ${
                              message.status === "failed" || message.status === "bounced"
                                ? "text-red-300"
                                : ""
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="border-t border-gray-200 px-4 py-3 dark:border-gray-700"
      >
        {isGmailConversation && (
          <div className="mb-3 border-b border-gray-100 pb-3 dark:border-gray-800">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                Pending approval
              </span>
              {approvalsLoading && (
                <span className="text-[10px] text-gray-400">Checking</span>
              )}
            </div>
            {gmailApprovals.length > 0 ? (
              <div className="space-y-2">
                {gmailApprovals.map((approval) => (
                  <div
                    key={approval._id}
                    className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 dark:border-amber-900/60 dark:bg-amber-950/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-amber-900 dark:text-amber-100">
                        {approval.summary || "Gmail draft awaiting approval"}
                      </p>
                      <p className="text-[10px] text-amber-700/80 dark:text-amber-200/70">
                        {approval.aiGenerated ? "AI draft" : "Human draft"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApproveGmail(approval._id)}
                      disabled={approvalActionId === approval._id}
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
                      title="Approve and queue"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectGmail(approval._id)}
                      disabled={approvalActionId === approval._id}
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
                      title="Reject draft"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400">
                Gmail replies are saved for approval before sending.
              </p>
            )}
          </div>
        )}
        {composeDisabled && (
          <p className="mb-2 text-xs text-gray-400">
            Reopen this conversation before sending a reply.
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={body}
            disabled={composeDisabled}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend(event);
              }
            }}
            placeholder={
              composeDisabled
                ? "Conversation is closed"
                : isGmailConversation
                  ? "Write a Gmail draft..."
                  : "Type a message..."
            }
            rows={1}
            className="max-h-36 flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
          <button
            type="submit"
            disabled={!body.trim() || sending || composeDisabled}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
            title={isGmailConversation ? "Create draft for approval" : "Send message"}
          >
            <Send className={`h-4 w-4 ${sending ? "animate-pulse" : ""}`} />
          </button>
        </div>
      </form>
    </div>
  );
}
