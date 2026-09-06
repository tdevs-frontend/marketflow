import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UserRole = "owner" | "admin" | "manager" | "agent";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  workspaceId: string | null;
  status: "idle" | "authenticating" | "authenticated" | "error";
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  workspaceId: null,
  status: "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authenticating: (state) => {
      state.status = "authenticating";
      state.error = null;
    },
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; token: string; workspaceId?: string }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.workspaceId = action.payload.workspaceId ?? state.workspaceId;
      state.status = "authenticated";
      state.error = null;
    },
    setAuthError: (state, action: PayloadAction<string>) => {
      state.status = "error";
      state.error = action.payload;
    },
    setActiveWorkspace: (state, action: PayloadAction<string>) => {
      state.workspaceId = action.payload;
    },
    logout: () => initialState,
  },
});

export const {
  authenticating,
  setCredentials,
  setAuthError,
  setActiveWorkspace,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
