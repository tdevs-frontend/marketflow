import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type WorkspacePlan = "free" | "starter" | "growth" | "enterprise";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: WorkspacePlan;
  logoUrl?: string;
  timezone: string;
  memberCount: number;
}

export interface WorkspaceState {
  current: Workspace | null;
  available: Workspace[];
  isSwitching: boolean;
}

const initialState: WorkspaceState = {
  current: null,
  available: [],
  isSwitching: false,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setWorkspaces: (state, action: PayloadAction<Workspace[]>) => {
      state.available = action.payload;
      state.current ??= action.payload[0] ?? null;
    },
    setCurrentWorkspace: (state, action: PayloadAction<Workspace>) => {
      state.current = action.payload;
      state.isSwitching = false;
    },
    switchingWorkspace: (state, action: PayloadAction<boolean>) => {
      state.isSwitching = action.payload;
    },
    clearWorkspaces: () => initialState,
  },
});

export const {
  setWorkspaces,
  setCurrentWorkspace,
  switchingWorkspace,
  clearWorkspaces,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
