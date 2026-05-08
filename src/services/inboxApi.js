import api from "./api";

const BASE = "/inbox";

export async function fetchInboxSummary() {
  const res = await api.get(`${BASE}/summary`);
  return res.data.data;
}

export async function listChannelAccounts(params = {}) {
  const res = await api.get(`${BASE}/channels`, { params });
  return res.data.data;
}

export async function listWhatsappAccountHealth() {
  const res = await api.get("/integrations/whatsapp/accounts/health");
  return res.data.data;
}

export async function reconnectWhatsappAccount(id, payload) {
  const res = await api.post(
    `/integrations/whatsapp/accounts/${id}/reconnect`,
    payload,
  );
  return res.data.data;
}

export async function getChannelAccount(id) {
  const res = await api.get(`${BASE}/channels/${id}`);
  return res.data.data;
}

export async function createChannelAccount(payload) {
  const res = await api.post(`${BASE}/channels`, payload);
  return res.data.data;
}

export async function updateChannelAccount(id, payload) {
  const res = await api.put(`${BASE}/channels/${id}`, payload);
  return res.data.data;
}

export async function deleteChannelAccount(id) {
  const res = await api.delete(`${BASE}/channels/${id}`);
  return res.data;
}

export async function listConversations(params = {}) {
  const res = await api.get(`${BASE}/conversations`, { params });
  return res.data;
}

export async function getConversation(id) {
  const res = await api.get(`${BASE}/conversations/${id}`);
  return res.data.data;
}

export async function updateConversation(id, payload) {
  const res = await api.put(`${BASE}/conversations/${id}`, payload);
  return res.data.data;
}

export async function assignConversation(id, assigneeId) {
  const res = await api.patch(`${BASE}/conversations/${id}/assign`, {
    assigneeId,
  });
  return res.data.data;
}

export async function markConversationRead(id) {
  const res = await api.patch(`${BASE}/conversations/${id}/read`);
  return res.data.data;
}

export async function markConversationUnread(id) {
  const res = await api.patch(`${BASE}/conversations/${id}/unread`);
  return res.data.data;
}

export async function closeConversation(id) {
  const res = await api.patch(`${BASE}/conversations/${id}/close`);
  return res.data.data;
}

export async function reopenConversation(id) {
  const res = await api.patch(`${BASE}/conversations/${id}/reopen`);
  return res.data.data;
}

export async function snoozeConversation(id, until) {
  const res = await api.patch(`${BASE}/conversations/${id}/snooze`, { until });
  return res.data.data;
}

export async function deleteConversation(id) {
  const res = await api.delete(`${BASE}/conversations/${id}`);
  return res.data;
}

export async function listMessages(conversationId, params = {}) {
  const res = await api.get(`${BASE}/conversations/${conversationId}/messages`, {
    params,
  });
  return res.data;
}

export async function getMessage(id) {
  const res = await api.get(`${BASE}/messages/${id}`);
  return res.data.data;
}

export async function sendMessage(conversationId, payload) {
  const res = await api.post(
    `${BASE}/conversations/${conversationId}/messages`,
    payload,
  );
  return res.data.data;
}

export async function createGmailDraft(conversationId, payload) {
  const res = await api.post(
    `${BASE}/gmail/conversations/${conversationId}/draft`,
    payload,
  );
  return res.data.data;
}

export async function listGmailApprovals(params = {}) {
  const res = await api.get(`${BASE}/gmail/approvals`, { params });
  return res.data;
}

export async function approveGmailDraft(approvalRequestId, payload = {}) {
  const res = await api.post(
    `${BASE}/gmail/approvals/${approvalRequestId}/approve`,
    payload,
  );
  return res.data.data;
}

export async function rejectGmailDraft(approvalRequestId, payload = {}) {
  const res = await api.post(
    `${BASE}/gmail/approvals/${approvalRequestId}/reject`,
    payload,
  );
  return res.data.data;
}

export async function listContactIdentities(params = {}) {
  const res = await api.get(`${BASE}/identities`, { params });
  return res.data.data;
}

export async function linkIdentityToContact(identityId, contactId) {
  const res = await api.patch(`${BASE}/identities/${identityId}/link`, {
    contactId,
  });
  return res.data.data;
}
