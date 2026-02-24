import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { eventsService } from "../../services";

const initialState = {
  events: [],
  activeEvents: [],
  selectedEvent: null,
  eventStats: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchEvents = createAsyncThunk(
  "events/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await eventsService.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch events",
      );
    }
  },
);

export const fetchActiveEvents = createAsyncThunk(
  "events/fetchActive",
  async (_, { rejectWithValue }) => {
    try {
      const response = await eventsService.getActive();
      return response.data.events;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch active events",
      );
    }
  },
);

export const fetchEvent = createAsyncThunk(
  "events/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const response = await eventsService.getOne(id);
      return response.data.event;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch event",
      );
    }
  },
);

export const fetchEventStats = createAsyncThunk(
  "events/fetchStats",
  async (id, { rejectWithValue }) => {
    try {
      const response = await eventsService.getStats(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch event stats",
      );
    }
  },
);

export const createEvent = createAsyncThunk(
  "events/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await eventsService.create(data);
      return response.data.event;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create event",
      );
    }
  },
);

export const updateEvent = createAsyncThunk(
  "events/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await eventsService.update(id, data);
      return response.data.event;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update event",
      );
    }
  },
);

export const deleteEvent = createAsyncThunk(
  "events/delete",
  async (id, { rejectWithValue }) => {
    try {
      await eventsService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete event",
      );
    }
  },
);

const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedEvent: (state) => {
      state.selectedEvent = null;
      state.eventStats = null;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Events
      .addCase(fetchEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload.data || [];
        state.pagination = {
          page: action.payload.pagination?.page || 1,
          limit: action.payload.pagination?.limit || 10,
          total: action.payload.pagination?.totalDocs || 0,
          totalPages: action.payload.pagination?.totalPages || 0,
        };
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Active Events
      .addCase(fetchActiveEvents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchActiveEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeEvents = action.payload;
      })
      .addCase(fetchActiveEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Single Event
      .addCase(fetchEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedEvent = action.payload;
      })
      .addCase(fetchEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Event Stats
      .addCase(fetchEventStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchEventStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.eventStats = action.payload;
      })
      .addCase(fetchEventStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Event
      .addCase(createEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Event
      .addCase(updateEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.events.findIndex(
          (e) => e._id === action.payload._id,
        );
        if (index !== -1) {
          state.events[index] = action.payload;
        }
        if (state.selectedEvent?._id === action.payload._id) {
          state.selectedEvent = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete Event
      .addCase(deleteEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = state.events.filter((e) => e._id !== action.payload);
        state.pagination.total -= 1;
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSelectedEvent, setPage } = eventsSlice.actions;
export default eventsSlice.reducer;
