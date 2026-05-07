import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as inboxApi from "../../services/inboxApi";

export const fetchSummary = createAsyncThunk(
  "inbox/fetchSummary",
  async (_, { rejectWithValue }) => {
    try {
      return await inboxApi.fetchInboxSummary();
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load inbox summary",
      );
    }
  },
);

export const fetchChannels = createAsyncThunk(
  "inbox/fetchChannels",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await inboxApi.listChannelAccounts(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load channels",
      );
    }
  },
);

export const fetchConversations = createAsyncThunk(
  "inbox/fetchConversations",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await inboxApi.listConversations(params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load conversations",
      );
    }
  },
);

export const fetchConversation = createAsyncThunk(
  "inbox/fetchConversation",
  async (id, { rejectWithValue }) => {
    try {
      return await inboxApi.getConversation(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load conversation",
      );
    }
  },
);

export const fetchMessages = createAsyncThunk(
  "inbox/fetchMessages",
  async ({ conversationId, params = {} }, { rejectWithValue }) => {
    try {
      return await inboxApi.listMessages(conversationId, params);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load messages",
      );
    }
  },
);

export const sendMessage = createAsyncThunk(
  "inbox/sendMessage",
  async ({ conversationId, payload }, { rejectWithValue }) => {
    try {
      return await inboxApi.sendMessage(conversationId, payload);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send message",
      );
    }
  },
);

export const markRead = createAsyncThunk(
  "inbox/markRead",
  async (id, { rejectWithValue }) => {
    try {
      return await inboxApi.markConversationRead(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark as read",
      );
    }
  },
);

export const markUnread = createAsyncThunk(
  "inbox/markUnread",
  async (id, { rejectWithValue }) => {
    try {
      return await inboxApi.markConversationUnread(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark as unread",
      );
    }
  },
);

export const closeConversation = createAsyncThunk(
  "inbox/closeConversation",
  async (id, { rejectWithValue }) => {
    try {
      return await inboxApi.closeConversation(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to close conversation",
      );
    }
  },
);

export const reopenConversation = createAsyncThunk(
  "inbox/reopenConversation",
  async (id, { rejectWithValue }) => {
    try {
      return await inboxApi.reopenConversation(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reopen conversation",
      );
    }
  },
);

export const assignConversation = createAsyncThunk(
  "inbox/assignConversation",
  async ({ id, assigneeId }, { rejectWithValue }) => {
    try {
      return await inboxApi.assignConversation(id, assigneeId);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign conversation",
      );
    }
  },
);

const initialState = {
  summary: null,
  summaryLoading: false,

  channels: [],
  channelsLoading: false,

  conversations: [],
  conversationsTotal: 0,
  conversationsPagination: null,
  conversationsLoading: false,

  activeConversation: null,
  activeConversationLoading: false,

  messages: [],
  messagesTotal: 0,
  messagesPagination: null,
  messagesLoading: false,
  messageSending: false,

  filters: {
    status: "open",
    channel: null,
    assigneeId: null,
    search: "",
  },

  error: null,
};

function conversationMatchesFilters(conversation, filters) {
  if (!conversation) return false;
  if (filters.status && conversation.status !== filters.status) return false;
  if (filters.channel && conversation.channel !== filters.channel) return false;
  return true;
}

function mergeConversation(existing, incoming) {
  if (!existing) return incoming;
  return { ...existing, ...incoming };
}

function updateConversationInState(state, conversation) {
  if (!conversation?._id) return;

  if (state.activeConversation?._id === conversation._id) {
    state.activeConversation = mergeConversation(
      state.activeConversation,
      conversation,
    );
  }

  const index = state.conversations.findIndex(
    (item) => item._id === conversation._id,
  );

  if (index === -1) return;

  const merged = mergeConversation(state.conversations[index], conversation);
  if (conversationMatchesFilters(merged, state.filters)) {
    state.conversations[index] = merged;
  } else {
    state.conversations.splice(index, 1);
  }
}

const inboxSlice = createSlice({
  name: "inbox",
  initialState,
  reducers: {
    setActiveConversation(state, action) {
      state.activeConversation = action.payload;
      state.messages = [];
      state.messagesTotal = 0;
      state.messagesPagination = null;
    },

    clearActiveConversation(state) {
      state.activeConversation = null;
      state.messages = [];
      state.messagesTotal = 0;
      state.messagesPagination = null;
    },

    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },

    resetFilters(state) {
      state.filters = { ...initialState.filters };
    },

    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummary.pending, (state) => {
        state.summaryLoading = true;
        state.error = null;
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload || null;
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchChannels.pending, (state) => {
        state.channelsLoading = true;
        state.error = null;
      })
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.channelsLoading = false;
        state.channels = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchChannels.rejected, (state, action) => {
        state.channelsLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchConversations.pending, (state) => {
        state.conversationsLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        const pagination = action.payload?.pagination || null;
        state.conversationsLoading = false;
        state.conversations = action.payload?.data || [];
        state.conversationsTotal = pagination?.totalDocs || 0;
        state.conversationsPagination = pagination;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.conversationsLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchConversation.pending, (state) => {
        state.activeConversationLoading = true;
        state.error = null;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.activeConversationLoading = false;
        state.activeConversation = action.payload;
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.activeConversationLoading = false;
        state.error = action.payload;
      })

      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const pagination = action.payload?.pagination || null;
        state.messagesLoading = false;
        state.messages = action.payload?.data || [];
        state.messagesTotal = pagination?.totalDocs || 0;
        state.messagesPagination = pagination;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false;
        state.error = action.payload;
      })

      .addCase(sendMessage.pending, (state) => {
        state.messageSending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        state.messageSending = false;
        if (message) state.messages.push(message);

        if (state.activeConversation?._id === message?.conversationId) {
          const snippet = (message.body || "").slice(0, 300) || "[attachment]";
          const patch = {
            _id: state.activeConversation._id,
            messageCount: (state.activeConversation.messageCount || 0) + 1,
            lastMessageAt: message.createdAt,
            lastMessageSnippet: snippet,
            lastMessageDirection: "outbound",
          };
          updateConversationInState(state, patch);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.messageSending = false;
        state.error = action.payload;
      })

      .addCase(markRead.fulfilled, (state, action) => {
        updateConversationInState(state, action.payload);
      })
      .addCase(markUnread.fulfilled, (state, action) => {
        updateConversationInState(state, action.payload);
      })
      .addCase(closeConversation.fulfilled, (state, action) => {
        updateConversationInState(state, action.payload);
      })
      .addCase(reopenConversation.fulfilled, (state, action) => {
        updateConversationInState(state, action.payload);
      })
      .addCase(assignConversation.fulfilled, (state, action) => {
        updateConversationInState(state, action.payload);
      });
  },
});

export const {
  setActiveConversation,
  clearActiveConversation,
  setFilters,
  resetFilters,
  clearError,
} = inboxSlice.actions;

export default inboxSlice.reducer;
