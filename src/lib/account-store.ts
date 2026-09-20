"use client";

import { useSyncExternalStore } from "react";

import {
  CURRENT_ACCOUNT,
  DEFAULT_NOTIFICATION_POLICY,
  SUBSCRIPTION,
  defaultNotificationPreferences,
} from "@/lib/account-fixtures";
import type {
  AccountUser,
  SecurityState,
  Subscription,
  TwoFactorEnrollment,
  UserNotificationPreferences,
  WorkspaceNotificationPolicy,
} from "@/types/account";

/**
 * One record of the signed-in account, shared by every surface that reads it.
 *
 * The same shape as `lib/media-store` and `lib/social-post-store`: a
 * module-level snapshot behind `useSyncExternalStore`, so the Profile form, the
 * avatar in the dashboard header and the name on the Security page all re-render
 * off one value.
 *
 * That was the original defect, and it is worth naming precisely because it is
 * easy to reintroduce. Every Settings panel used to hold its form in local
 * `useState` and raise a toast on save — inside a tab strip that unmounted the
 * panel you left. So "Profile saved" was a message with nothing behind it: the
 * edit was gone before the toast finished animating, and the header went on
 * saying "Guest User" regardless.
 *
 * Session-scoped, and the UI says so. Deliberately *not* `localStorage`: a
 * profile that survives a reload reads as an account, and the first thing a
 * real account service would do is disagree with it. The pretence would cost
 * more than the convenience is worth.
 *
 * Writes do not happen here. `lib/account-service` is the only caller of the
 * mutators below, because every change to this record is an operation that a
 * server will one day have to accept or reject, and code that writes straight
 * to the snapshot is code that will not survive that.
 */

/* -------------------------------------------------------------------------- */
/* Snapshot                                                                   */
/* -------------------------------------------------------------------------- */

interface Snapshot {
  user: AccountUser;
  policy: WorkspaceNotificationPolicy;
  preferences: UserNotificationPreferences;
  security: SecurityState;
  subscription: Subscription;
  /**
   * The enrolment in flight, held here rather than in the dialog's state so
   * that closing the dialog and reopening it does not mint a second secret
   * while the first is already half-entered on somebody's phone.
   */
  enrollment: TwoFactorEnrollment | null;
  /** The secret in force once two-factor is on. `null` while it is off. */
  totpSecret: string | null;
  /** Unused recovery codes. Shown once, at activation, and never again. */
  recoveryCodes: string[];
}

const INITIAL: Snapshot = {
  user: CURRENT_ACCOUNT,
  policy: DEFAULT_NOTIFICATION_POLICY,
  preferences: defaultNotificationPreferences(),
  security: {
    twoFactor: "disabled",
    twoFactorEnabledAt: null,
    recoveryCodesRemaining: null,
    passwordChangedAt: null,
  },
  subscription: SUBSCRIPTION,
  enrollment: null,
  totpSecret: null,
  recoveryCodes: [],
};

let snapshot: Snapshot = INITIAL;

const listeners = new Set<() => void>();

function commit(next: Snapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The server renders from `INITIAL`, so the first client snapshot has to be
 * that identical object or hydration disagrees with itself.
 */
function useSnapshot(): Snapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => INITIAL,
  );
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export function useAccount(): AccountUser {
  return useSnapshot().user;
}

export function useNotificationPolicy(): WorkspaceNotificationPolicy {
  return useSnapshot().policy;
}

export function useNotificationPreferences(): UserNotificationPreferences {
  return useSnapshot().preferences;
}

export function useSecurityState(): SecurityState {
  return useSnapshot().security;
}

export function useSubscription(): Subscription {
  return useSnapshot().subscription;
}

export function useTwoFactorEnrollment(): TwoFactorEnrollment | null {
  return useSnapshot().enrollment;
}

/* -------------------------------------------------------------------------- */
/* Writes — for `lib/account-service` only                                    */
/* -------------------------------------------------------------------------- */

export const readSnapshot = (): Snapshot => snapshot;

export function writeUser(patch: Partial<AccountUser>) {
  commit({ ...snapshot, user: { ...snapshot.user, ...patch } });
}

/**
 * Swaps in a photo chosen this session.
 *
 * Revokes whatever was there first: an object URL holds the file alive until
 * the document unloads, so a merchant trying three photos would otherwise leave
 * three images pinned in memory for the rest of the visit.
 */
export function writeAvatar(url: string | null) {
  const previous = snapshot.user.avatarUrl;
  if (previous?.startsWith("blob:")) URL.revokeObjectURL(previous);
  writeUser({ avatarUrl: url });
}

export function writePreferences(next: UserNotificationPreferences) {
  commit({ ...snapshot, preferences: next });
}

export function writePolicy(next: WorkspaceNotificationPolicy) {
  commit({ ...snapshot, policy: next });
}

export function writeSecurity(patch: Partial<SecurityState>) {
  commit({ ...snapshot, security: { ...snapshot.security, ...patch } });
}

/**
 * The subscription, after the billing service has accepted a change.
 *
 * A patch rather than a whole record: a plan change alters `planId` and the
 * amount, a cancellation alters `status`, and neither of them knows anything
 * about the payment method — so neither should be able to clear it.
 */
export function writeSubscription(patch: Partial<Subscription>) {
  commit({ ...snapshot, subscription: { ...snapshot.subscription, ...patch } });
}

export function writeEnrollment(enrollment: TwoFactorEnrollment | null) {
  commit({ ...snapshot, enrollment });
}

export function writeTwoFactorActive(secret: string, codes: string[], at: string) {
  commit({
    ...snapshot,
    enrollment: null,
    totpSecret: secret,
    recoveryCodes: codes,
    security: {
      ...snapshot.security,
      twoFactor: "enabled",
      twoFactorEnabledAt: at,
      recoveryCodesRemaining: codes.length,
    },
  });
}

export function writeTwoFactorOff() {
  commit({
    ...snapshot,
    enrollment: null,
    totpSecret: null,
    recoveryCodes: [],
    security: {
      ...snapshot.security,
      twoFactor: "disabled",
      twoFactorEnabledAt: null,
      recoveryCodesRemaining: null,
    },
  });
}

export function writeRecoveryCodes(codes: string[]) {
  commit({
    ...snapshot,
    recoveryCodes: codes,
    security: { ...snapshot.security, recoveryCodesRemaining: codes.length },
  });
}
