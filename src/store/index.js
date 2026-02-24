import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import usersReducer from "./slices/usersSlice";
import eventsReducer from "./slices/eventsSlice";
import clientsReducer from "./slices/clientsSlice";
import dashboardReducer from "./slices/dashboardSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    events: eventsReducer,
    clients: clientsReducer,
    dashboard: dashboardReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
  devTools: import.meta.env.DEV,
});

export default store;
