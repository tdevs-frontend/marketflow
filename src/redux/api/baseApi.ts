import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";

import { env } from "@/config";
import { logout } from "@/redux/features/auth/authSlice";
import type { RootState } from "@/redux/store";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const { token, workspaceId } = (getState() as RootState).auth;
    if (token) headers.set("authorization", `Bearer ${token}`);
    if (workspaceId) headers.set("x-workspace-id", workspaceId);
    return headers;
  },
});

/** Clears the session when the API reports the token is no longer valid. */
const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    api.dispatch(logout());
  }
  return result;
};

export const TAG_TYPES = [
  "Contact",
  "Lead",
  "Pipeline",
  "Campaign",
  "Template",
  "WhatsAppConversation",
  "WhatsAppMessage",
  "WhatsAppAccount",
  "Automation",
  "Analytics",
] as const;

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  tagTypes: TAG_TYPES,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
