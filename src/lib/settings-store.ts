"use client";

import { useSyncExternalStore } from "react";

import { ALL_NOTIFICATION_EVENTS } from "@/constants/settings";
import { CURRENT_MEMBER } from "@/lib/workspace-fixtures";

/**
 * The signed-in person's settings, and whatever has been changed this session.
 *
 * The same shape as `lib/media-store` and `lib/social-post-store`: one
 * module-level snapshot behind a `useSyncExternalStore` subscription, so every
 * surface reading it re-renders together. Switching from the Profile tab to
 * Notifications and back shows the edits still there, because both are reading
 * one record rather than each holding their own `useState`.
 *
 * That was the actual defect. Every panel in Settings kept its form in local
 * state and announced a toast on save, so "Profile saved" was a message with
 * nothing behind it — the values were gone the moment the tab unmounted, which
 * is the same tab strip that unmounts a panel the instant you leave it.
 *
 * Session-scoped, and the UI says so. There is no account service behind this:
 * `env.apiBaseUrl` falls back to `/api`, there are no route handlers under
 * `app/`, and nothing in the product ever dispatches `setCredentials`, so
 * `auth.user` is permanently `null`. Persisting to `localStorage` would only
 * move the lie — a profile that survives a reload reads as an account, and the
 * first thing a real backend would do is disagree with it.
 *
 * What is *not* in here is as deliberate as what is. No password, no
 * two-factor secret, no payment method, no session list for other devices.
 * Each of those needs a server to be true, and a client-side imitation of one
 * is worse than an empty state, because it teaches a merchant that a lock is
 * on when nothing is holding it.
 *
 * No API keys either, for a different reason: the product already has that
 * module. `components/integrations/api` is a full developer surface —
 * key table, one-time secret dialog, scopes, usage and a request log — behind
 * `/dashboard/integrations/api`. A second key store here would be the
 * duplication this restructure exists to remove.
 */

/* -------------------------------------------------------------------------- */
/* Shapes                                                                     */
/* -------------------------------------------------------------------------- */

export interface AccountProfile {
  firstName: string;
  lastName: string;
  /**
   * Read-only to this store on purpose. The sign-in address is the account's
   * identity and changing it needs a verification round-trip; writing a new
   * one here would change who the UI says you are without anything having
   * checked that you can receive mail there.
   */
  readonly email: string;
  phone: string;
  jobTitle: string;
  language: string;
}

export interface NotificationPrefs {
  /** Keyed by `NotificationEvent.key`. */
  events: Record<string, boolean>;
  channel: string;
  quiet: string;
  /** Optional override for where mail goes. Empty means "use my address". */
  address: string;
}

interface Snapshot {
  profile: AccountProfile;
  /** Object URL for a photo chosen this session, or `null`. */
  avatar: string | null;
  notifications: NotificationPrefs;
}

/* -------------------------------------------------------------------------- */
/* Defaults                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Seeded from `CURRENT_MEMBER` rather than from `auth.user`.
 *
 * `auth.user` is `null` and always has been, which is why Profile used to
 * greet everyone as "Guest User" while the Team table, the audit log and
 * Workspace Settings all agreed the signed-in person is Nabila Rahman. One of
 * those had to give, and the fixtures are the product's own answer to "who am
 * I" — the same record every other module reads. When a real session exists,
 * this is the one line that changes.
 */
const defaultProfile = (): AccountProfile => {
  const [first, ...rest] = CURRENT_MEMBER.name.split(" ");

  return {
    firstName: first ?? "",
    lastName: rest.join(" "),
    email: CURRENT_MEMBER.email,
    phone: "",
    jobTitle: "",
    language: "en",
  };
};

export const defaultNotificationPrefs = (): NotificationPrefs => ({
  events: Object.fromEntries(
    ALL_NOTIFICATION_EVENTS.map((event) => [event.key, event.defaultOn]),
  ),
  channel: "both",
  quiet: "night",
  address: "",
});

const initial: Snapshot = {
  profile: defaultProfile(),
  avatar: null,
  notifications: defaultNotificationPrefs(),
};

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

let snapshot: Snapshot = initial;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: Snapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

/* The server renders from `initial`, so the first client snapshot has to be
   that identical object or hydration disagrees with itself. */
function useSnapshot(): Snapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => initial,
  );
}

/* ------------------------------------------------------------------ profile */

export function useAccountProfile(): AccountProfile {
  return useSnapshot().profile;
}

/** Patches the editable fields. `email` is absent from the patch type. */
export function updateAccountProfile(
  patch: Partial<Omit<AccountProfile, "email">>,
) {
  commit({ ...snapshot, profile: { ...snapshot.profile, ...patch } });
}

export function useAccountAvatar(): string | null {
  return useSnapshot().avatar;
}

/**
 * Swaps in a photo chosen this session.
 *
 * Revokes whatever was there first: object URLs hold the file alive until the
 * document unloads, and a merchant trying three photos would otherwise leave
 * three images pinned in memory for the rest of the visit.
 */
export function setAccountAvatar(url: string | null) {
  if (snapshot.avatar) URL.revokeObjectURL(snapshot.avatar);
  commit({ ...snapshot, avatar: url });
}

/** The person's display name, or the fallback the fixtures agree on. */
export function fullNameOf(profile: AccountProfile): string {
  return `${profile.firstName} ${profile.lastName}`.trim() || CURRENT_MEMBER.name;
}

/* ------------------------------------------------------------ notifications */

export function useNotificationPrefs(): NotificationPrefs {
  return useSnapshot().notifications;
}

export function updateNotificationPrefs(patch: Partial<NotificationPrefs>) {
  commit({
    ...snapshot,
    notifications: { ...snapshot.notifications, ...patch },
  });
}

export function resetNotificationPrefs() {
  commit({ ...snapshot, notifications: defaultNotificationPrefs() });
}
