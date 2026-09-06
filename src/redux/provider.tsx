"use client";

import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";

import { makeStore } from "./store";

export function ReduxProvider({ children }: { children: ReactNode }) {
  // A per-request store instance keeps server-rendered state from leaking
  // between users; the lazy initialiser builds it exactly once per mount.
  const [store] = useState(makeStore);

  return <Provider store={store}>{children}</Provider>;
}
