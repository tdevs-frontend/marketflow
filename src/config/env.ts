/**
 * Client-safe environment values. Only `NEXT_PUBLIC_*` variables belong here —
 * server-only secrets must be read directly from `process.env` in server code.
 */
export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  isProduction: process.env.NODE_ENV === "production",
} as const;
