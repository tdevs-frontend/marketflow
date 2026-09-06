"use client";

import { useAppSelector } from "./useRedux";

export function useAuth() {
  const auth = useAppSelector((state) => state.auth);

  return {
    ...auth,
    isAuthenticated: Boolean(auth.token && auth.user),
    isLoading: auth.status === "authenticating",
  };
}
