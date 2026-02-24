import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { usersService } from "../../services";

const initialState = {
  users: [],
  marketingUsers: [],
  selectedUser: null,
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
export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await usersService.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users",
      );
    }
  },
);

export const fetchUser = createAsyncThunk(
  "users/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const response = await usersService.getOne(id);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user",
      );
    }
  },
);

export const fetchMarketingUsers = createAsyncThunk(
  "users/fetchMarketing",
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersService.getMarketingUsers();
      return response.data.users;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch marketing users",
      );
    }
  },
);

export const createUser = createAsyncThunk(
  "users/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await usersService.create(data);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create user",
      );
    }
  },
);

export const updateUser = createAsyncThunk(
  "users/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await usersService.update(id, data);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update user",
      );
    }
  },
);

export const deleteUser = createAsyncThunk(
  "users/delete",
  async (id, { rejectWithValue }) => {
    try {
      await usersService.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete user",
      );
    }
  },
);

export const resetUserPassword = createAsyncThunk(
  "users/resetPassword",
  async ({ id, newPassword }, { rejectWithValue }) => {
    try {
      await usersService.resetPassword(id, newPassword);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reset password",
      );
    }
  },
);

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.data || [];
        state.pagination = {
          page: action.payload.pagination?.page || 1,
          limit: action.payload.pagination?.limit || 10,
          total: action.payload.pagination?.totalDocs || 0,
          totalPages: action.payload.pagination?.totalPages || 0,
        };
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Single User
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Marketing Users
      .addCase(fetchMarketingUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMarketingUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.marketingUsers = action.payload;
      })
      .addCase(fetchMarketingUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create User
      .addCase(createUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update User
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.users.findIndex(
          (u) => u._id === action.payload._id,
        );
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.selectedUser?._id === action.payload._id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = state.users.filter((u) => u._id !== action.payload);
        state.pagination.total -= 1;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Reset Password
      .addCase(resetUserPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resetUserPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resetUserPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSelectedUser, setPage } = usersSlice.actions;
export default usersSlice.reducer;
