import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchConversations,
  setActiveConversation,
  setFilters,
} from "../../store/slices/inboxSlice";
import {
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Facebook,
  Mail,
  MapPin,
  MessageSquare,
  Search,
} from "lucide-react";

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

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const timestamp = new Date(dateStr).getTime();
  if (Number.isNaN(timestamp)) return "";

  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;

  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;

  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getParticipantLabel(conversation) {
  return (
    conversation.participantName ||
    conversation.contactId?.name ||
    conversation.contactId?.email ||
    conversation.providerThreadId ||
    "Unknown participant"
  );
}

export default function ConversationList() {
  const dispatch = useDispatch();
  const {
    conversations,
    conversationsLoading,
    conversationsPagination,
    activeConversation,
    filters,
  } = useSelector((state) => state.inbox);
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const filterKey = [
    filters.status || "",
    filters.channel || "",
    filters.assigneeId || "",
    filters.search || "",
  ].join("|");
  const [pageState, setPageState] = useState({ filterKey, page: 1 });
  const page = pageState.filterKey === filterKey ? pageState.page : 1;

  const loadConversations = useCallback(() => {
    dispatch(
      fetchConversations({
        page,
        limit: 25,
        status: filters.status || undefined,
        channel: filters.channel || undefined,
        assigneeId: filters.assigneeId || undefined,
        search: filters.search || undefined,
      }),
    );
  }, [
    dispatch,
    page,
    filters.status,
    filters.channel,
    filters.assigneeId,
    filters.search,
  ]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleSearch = (event) => {
    event.preventDefault();
    dispatch(setFilters({ search: searchInput.trim() }));
  };

  return (
    <div className="flex h-full w-screen max-w-full flex-shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 sm:w-96 lg:w-80 xl:w-96">
      <form
        onSubmit={handleSearch}
        className="border-b border-gray-200 px-3 py-2 dark:border-gray-700"
      >
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
      </form>

      <div className="flex-1 overflow-y-auto">
        {conversationsLoading && conversations.length === 0 ? (
          <div className="space-y-2 p-3">
            {[72, 88, 64, 80, 76, 68].map((width, index) => (
              <div
                key={width}
                className="animate-pulse rounded-lg bg-gray-100 p-3 dark:bg-gray-800"
              >
                <div
                  className="mb-2 h-3 rounded bg-gray-200 dark:bg-gray-700"
                  style={{ width: `${width}%` }}
                />
                <div
                  className="h-2 rounded bg-gray-200 dark:bg-gray-700"
                  style={{ width: `${index % 2 === 0 ? 96 : 82}%` }}
                />
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16">
            <Mail className="mb-2 h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-gray-400">No conversations</p>
            <p className="mt-0.5 text-xs text-gray-300 dark:text-gray-500">
              {filters.search ? "Try a different search" : "Conversations will appear here"}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {conversations.map((conversation) => {
              const isActive = activeConversation?._id === conversation._id;
              const Icon = CHANNEL_ICONS[conversation.channel] || Mail;
              const isUnread = conversation.unreadCount > 0;
              const participant = getParticipantLabel(conversation);
              const snippet =
                conversation.lastMessageSnippet ||
                conversation.providerThreadId ||
                "No messages yet";

              return (
                <li key={conversation._id}>
                  <button
                    type="button"
                    onClick={() => dispatch(setActiveConversation(conversation))}
                    className={`flex w-full gap-3 px-3 py-2.5 text-left transition-colors ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                        isActive
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`truncate text-xs ${
                            isUnread
                              ? "font-bold text-gray-900 dark:text-white"
                              : "font-medium text-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {participant}
                        </span>
                        <span className="flex-shrink-0 text-[10px] text-gray-400">
                          {timeAgo(conversation.lastMessageAt || conversation.updatedAt)}
                        </span>
                      </div>
                      <p
                        className={`mt-0.5 truncate text-[11px] leading-snug ${
                          isUnread
                            ? "text-gray-700 dark:text-gray-300"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {snippet}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[9px] font-semibold uppercase text-gray-400">
                          {CHANNEL_LABELS[conversation.channel] || conversation.channel}
                        </span>
                        {isUnread && (
                          <span className="flex items-center gap-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400">
                            <Circle className="h-1.5 w-1.5 fill-current" />
                            {conversation.unreadCount}
                          </span>
                        )}
                        {conversation.status === "snoozed" && (
                          <Clock className="h-3 w-3 text-amber-400" />
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {conversationsPagination?.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-3 py-1.5 dark:border-gray-700">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() =>
              setPageState((current) => ({
                filterKey,
                page: Math.max(
                  (current.filterKey === filterKey ? current.page : 1) - 1,
                  1,
                ),
              }))
            }
            className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
            title="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] text-gray-400">
            {page} / {conversationsPagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= conversationsPagination.totalPages}
            onClick={() =>
              setPageState((current) => ({
                filterKey,
                page: Math.min(
                  (current.filterKey === filterKey ? current.page : 1) + 1,
                  conversationsPagination.totalPages,
                ),
              }))
            }
            className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
            title="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
