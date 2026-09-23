/**
 * The instant the demo workspace is frozen at.
 *
 * Every module whose fixtures carry relative timestamps measures against this
 * one value. A fixed instant rather than `Date.now()` because rendering is
 * meant to be pure: a "2 min ago" computed on the server and again on the
 * client is a hydration mismatch waiting for a slow response, and a fixture
 * anchored to the real clock drifts further every day nobody touches it.
 *
 * It lives in its own module so that the Integrations fixtures and the Social
 * Planner fixtures can share it without importing each other - Integrations
 * reads `SOCIAL_ACCOUNTS` from the Planner's file, so a clock exported from
 * either side would close a cycle.
 */
export const WORKSPACE_NOW = "2026-09-14T10:42:00.000Z";
export const WORKSPACE_NOW_MS = new Date(WORKSPACE_NOW).getTime();

export const minutesAgo = (minutes: number) =>
  new Date(WORKSPACE_NOW_MS - minutes * 60_000).toISOString();
export const hoursAgo = (hours: number) => minutesAgo(hours * 60);
export const daysAgo = (days: number) => minutesAgo(days * 60 * 24);
/** For a token expiry, which is the one timestamp that points forward. */
export const daysAhead = (days: number) =>
  new Date(WORKSPACE_NOW_MS + days * 86_400_000).toISOString();
