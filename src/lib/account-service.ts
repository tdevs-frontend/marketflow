"use client";

import { env } from "@/config";
import { TOTP_CONFIG } from "@/constants/settings";
import {
  readSnapshot,
  writeAvatar,
  writeEnrollment,
  writePolicy,
  writePreferences,
  writeRecoveryCodes,
  writeSecurity,
  writeTwoFactorActive,
  writeTwoFactorOff,
  writeUser,
} from "@/lib/account-store";
import {
  buildOtpauthUri,
  generateRecoveryCodes,
  generateTotpSecret,
  verifyTotp,
} from "@/lib/totp";
import { describeThisDevice, deviceTimeZone } from "@/lib/user-agent";
import type {
  AccountSession,
  AccountUser,
  ProfilePatch,
  SecurityState,
  ServiceResult,
  SignInEvent,
  TwoFactorActivation,
  TwoFactorEnrollment,
  UserNotificationPreferences,
  WorkspaceNotificationPolicy,
} from "@/types/account";
import { fail, ok } from "@/types/account";

/**
 * The seam between the Settings module and an account service.
 *
 * Every panel in Settings calls these functions and nothing else. They are
 * async, they return `ServiceResult` rather than throwing, and they never
 * report a success they did not perform — which together are the whole design.
 * A component written against this is already written against the HTTP client
 * that will replace the body of each function.
 *
 * Two questions this file exists to answer honestly.
 *
 * *Is there a backend?* No. `env.apiBaseUrl` falls back to `/api`, there are no
 * route handlers under `app/`, there are no server actions, and nothing in the
 * product ever dispatches `setCredentials` — `auth.user` is permanently `null`.
 * `SESSION_MODE` is how the UI knows that without each panel re-deriving it.
 *
 * *So what actually works?* `CAPABILITIES`, exactly. Anything `true` there is
 * genuinely performed and genuinely persists for the session; anything `false`
 * is a control the UI must disable with a stated reason rather than run into a
 * failure. The rule the module holds to throughout: a control works, or it is
 * disabled and says why. There is no third option where it raises a toast.
 *
 * Two-factor is the interesting entry. It is `true`, and the verification is
 * real RFC 6238 — see `lib/totp` — so a mistyped setup key is rejected here
 * rather than at a sign-in three weeks later. What it cannot do is protect that
 * sign-in, because protecting it means a server holding the secret. The Security
 * page states that where it cannot be missed; being able to *test* an
 * authenticator setup and being *defended* by it are different claims, and the
 * UI makes exactly the one that is true.
 *
 * Passwords are `false` for the mirror-image reason. Verifying a current
 * password requires something that knows the old hash. Nothing in the browser
 * does, or should, so the form validates everything it legitimately can and the
 * submit reports `service_unavailable` — a real outcome, not a failed success.
 *
 * Sessions split down the same line, and the split is worth stating because it
 * is not obvious from the section headings. `listSessions` returns one genuine
 * row — this browser, described from its own user-agent and clock — because
 * that much a client can observe. `remoteSessions` is `false` because the
 * other devices holding a token are known only to whatever issued the tokens,
 * and `signInActivity` is `false` because a sign-in log is a record of things
 * that happened while this browser was not running. One is answerable here and
 * two are not, so one is answered and two say so.
 */

/* -------------------------------------------------------------------------- */
/* Environment                                                                */
/* -------------------------------------------------------------------------- */

/**
 * True when no account API is configured, which today is always.
 *
 * Derived rather than hard-coded so that pointing `NEXT_PUBLIC_API_BASE_URL` at
 * a real host is the single change that flips the module over — the notices
 * disappear, the capability gates open, and the functions below become the
 * place to put `fetch`.
 */
export const SESSION_MODE = env.apiBaseUrl === "/api";

export interface AccountCapabilities {
  /** Editing your own name, phone and job title. */
  profile: boolean;
  /** Choosing a profile photo. */
  avatar: boolean;
  /** Personal notification preferences. */
  notifications: boolean;
  /** Workspace-level notification configuration, for administrators. */
  notificationPolicy: boolean;
  /** Changing your password. Needs a server that holds the current hash. */
  password: boolean;
  /** Enrolling an authenticator and verifying its codes. */
  twoFactor: boolean;
  /** Whether enabling two-factor actually gates sign-in. */
  twoFactorEnforced: boolean;
  /**
   * Listing sessions on this account's *other* devices, and ending them.
   *
   * Separate from describing the current one, which this browser can do by
   * itself and always can. Knowing that a phone in another country holds a
   * valid token is knowledge only the thing that issued the token has.
   */
  remoteSessions: boolean;
  /** Recent sign-in attempts, successful and failed. Recorded server-side. */
  signInActivity: boolean;
  /** Adding or changing a card. Needs a payment provider. */
  payment: boolean;
  /** Downloadable invoices. Issued by the payment provider, so: no. */
  invoices: boolean;
  /** Creating and revoking API keys. */
  apiKeys: boolean;
}

export const CAPABILITIES: AccountCapabilities = {
  profile: true,
  avatar: true,
  notifications: true,
  notificationPolicy: true,
  password: !SESSION_MODE,
  twoFactor: true,
  twoFactorEnforced: !SESSION_MODE,
  remoteSessions: !SESSION_MODE,
  signInActivity: !SESSION_MODE,
  payment: !SESSION_MODE,
  invoices: !SESSION_MODE,
  apiKeys: true,
};

/**
 * The sentence an unavailable control explains itself with.
 *
 * One phrasing per capability, written once, so a merchant who meets two of
 * them recognises a boundary rather than two unrelated bugs. Each one names the
 * missing piece — "no payment provider", "no account service" — because "not
 * available" without a reason reads as a fault.
 */
export const UNAVAILABLE_REASON: Record<keyof AccountCapabilities, string> = {
  profile: "",
  avatar: "",
  notifications: "",
  notificationPolicy: "",
  password:
    "Changing a password needs an account service to verify the current one. None is connected.",
  twoFactor: "",
  twoFactorEnforced:
    "Enrolment is verified here, but sign-in is not yet gated by it — that needs the account service.",
  remoteSessions:
    "Sessions on your other devices are held by the account service. None is connected, so only this browser can be listed.",
  signInActivity:
    "Sign-in attempts are recorded by the account service. None is connected, so there is no history to show.",
  payment:
    "No payment provider is connected, so no card can be stored against this workspace.",
  invoices:
    "Invoices are issued by the payment provider. None is connected, so there are none to list.",
  apiKeys: "",
};

/**
 * A short, deliberate pause on every call.
 *
 * Not decoration and not a fake delay to look busy: the panels implement a real
 * three-state machine — idle, in flight, settled — and that machine has to be
 * written and exercised now, because a network adapter will drive exactly the
 * same one. A store write that resolves synchronously would let a `Saving…`
 * state be skipped and then never be reached again until the day a real request
 * makes it matter.
 */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 420));

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

/** `GET /account` */
export async function getAccount(): Promise<ServiceResult<AccountUser>> {
  return ok(readSnapshot().user);
}

/** `PATCH /account` */
export async function updateProfile(
  patch: ProfilePatch,
): Promise<ServiceResult<AccountUser>> {
  await settle();

  if (!patch.firstName.trim()) {
    return fail("validation", "Enter your first name.");
  }

  writeUser({
    firstName: patch.firstName.trim(),
    lastName: patch.lastName.trim(),
    phone: patch.phone.trim(),
    jobTitle: patch.jobTitle.trim(),
  });

  return ok(readSnapshot().user);
}

/**
 * `POST /account/avatar`
 *
 * Takes the `File` rather than a URL because that is what the real endpoint
 * takes, and because the object URL is this adapter's implementation detail —
 * a component that built the URL itself would be a component that has to be
 * rewritten when the upload becomes multipart.
 */
export async function uploadAvatar(
  file: File,
): Promise<ServiceResult<AccountUser>> {
  await settle();

  writeAvatar(URL.createObjectURL(file));
  return ok(readSnapshot().user);
}

/** `DELETE /account/avatar` */
export async function removeAvatar(): Promise<ServiceResult<AccountUser>> {
  await settle();

  writeAvatar(null);
  return ok(readSnapshot().user);
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

/** `PUT /account/notification-preferences` */
export async function updateNotificationPreferences(
  next: UserNotificationPreferences,
): Promise<ServiceResult<UserNotificationPreferences>> {
  await settle();

  writePreferences({ ...next, emailAddress: next.emailAddress.trim() });
  return ok(readSnapshot().preferences);
}

/**
 * `PUT /workspaces/{id}/notification-policy`
 *
 * Separate from the call above, and separately permitted. This is the whole
 * admin/member split expressed in the API surface: a member changing their own
 * delivery preferences and an administrator changing what the workspace offers
 * are different requests with different authorisation, and collapsing them into
 * one "save notifications" endpoint is how a support agent ends up able to
 * switch off everybody's failure alerts.
 */
export async function updateNotificationPolicy(
  next: WorkspaceNotificationPolicy,
): Promise<ServiceResult<WorkspaceNotificationPolicy>> {
  await settle();

  writePolicy(next);
  return ok(readSnapshot().policy);
}

/* -------------------------------------------------------------------------- */
/* Password                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * `POST /account/password`
 *
 * Returns `service_unavailable` today, and the form renders that as the plain
 * fact it is. It deliberately does not pretend to check `currentPassword`:
 * there is nothing in the browser that knows the old hash, nothing that should,
 * and a client-side comparison against a seeded demo password would be a
 * security control made of theatre.
 *
 * Nothing here is logged, and neither password is retained beyond the call.
 */
export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ServiceResult<SecurityState>> {
  await settle();

  /* Re-checked at the boundary even though the form checks it: a rule the
     server will also enforce belongs in the layer that speaks to the server,
     or the day a second caller appears it is enforced nowhere. */
  if (input.currentPassword === input.newPassword) {
    return fail(
      "validation",
      "The new password must be different from the current one.",
    );
  }

  if (!CAPABILITIES.password) {
    return fail("service_unavailable", UNAVAILABLE_REASON.password);
  }

  /* The real implementation posts `input` and lets the server answer. It is
     the server that decides `invalid_credentials`; the client never guesses. */
  writeSecurity({ passwordChangedAt: new Date().toISOString() });
  return ok(readSnapshot().security);
}

/* -------------------------------------------------------------------------- */
/* Two-factor                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * `POST /account/2fa/enroll`
 *
 * Mints a secret and returns it with the URI the QR code encodes. Reuses an
 * enrolment already in flight: reopening the dialog must not issue a second
 * secret while the first is half-typed into somebody's phone.
 */
export async function startTwoFactorEnrollment(): Promise<
  ServiceResult<TwoFactorEnrollment>
> {
  await settle();

  const existing = readSnapshot().enrollment;
  if (existing) return ok(existing);

  const user = readSnapshot().user;
  const secret = generateTotpSecret();

  const enrollment: TwoFactorEnrollment = {
    secret,
    otpauthUri: buildOtpauthUri({ secret, account: user.email }),
    issuer: TOTP_CONFIG.issuer,
    account: user.email,
  };

  writeEnrollment(enrollment);
  return ok(enrollment);
}

/**
 * `POST /account/2fa/verify`
 *
 * Genuinely verifies. A wrong code is rejected, a code from a different secret
 * is rejected, and a code that has rolled over by more than one step is
 * rejected — which is the entire reason this step exists. An enrolment flow
 * that accepts any six digits has confirmed nothing and has told the merchant
 * it confirmed something.
 */
export async function verifyTwoFactorEnrollment(
  code: string,
): Promise<ServiceResult<TwoFactorActivation>> {
  const enrollment = readSnapshot().enrollment;
  if (!enrollment) {
    return fail("validation", "Start the setup again — this enrolment expired.");
  }

  await settle();

  const valid = await verifyTotp(enrollment.secret, code);
  if (!valid) {
    return fail(
      "invalid_code",
      "That code is not right. Check your authenticator and try the current one.",
    );
  }

  const codes = generateRecoveryCodes();
  writeTwoFactorActive(enrollment.secret, codes, new Date().toISOString());

  return ok({ security: readSnapshot().security, recoveryCodes: codes });
}

/** Abandons an enrolment. The secret is discarded, not parked. */
export async function cancelTwoFactorEnrollment(): Promise<ServiceResult<null>> {
  writeEnrollment(null);
  return ok(null);
}

/**
 * `DELETE /account/2fa`
 *
 * Requires a current code, the same as a real service would. Turning off a
 * second factor is exactly as security-sensitive as turning it on, and a
 * confirm dialog alone only proves somebody has the open tab.
 */
export async function disableTwoFactor(
  code: string,
): Promise<ServiceResult<SecurityState>> {
  const { totpSecret, recoveryCodes } = readSnapshot();
  if (!totpSecret) {
    return fail("validation", "Two-factor authentication is already off.");
  }

  await settle();

  const entered = code.trim().toUpperCase();
  const usedRecoveryCode = recoveryCodes.includes(entered);
  const valid = usedRecoveryCode || (await verifyTotp(totpSecret, code));

  if (!valid) {
    return fail(
      "invalid_code",
      "That code is not right. Use your authenticator, or one of your recovery codes.",
    );
  }

  writeTwoFactorOff();
  return ok(readSnapshot().security);
}

/**
 * `POST /account/2fa/recovery-codes`
 *
 * Re-authenticated with a current code, and it replaces the whole set rather
 * than topping it up — codes a person may have written down have to stop
 * working, or regenerating them has bought nothing.
 */
export async function regenerateRecoveryCodes(
  code: string,
): Promise<ServiceResult<string[]>> {
  const { totpSecret } = readSnapshot();
  if (!totpSecret) {
    return fail("validation", "Two-factor authentication is not enabled.");
  }

  await settle();

  if (!(await verifyTotp(totpSecret, code))) {
    return fail(
      "invalid_code",
      "That code is not right. Check your authenticator and try the current one.",
    );
  }

  const codes = generateRecoveryCodes();
  writeRecoveryCodes(codes);
  return ok(codes);
}

/* -------------------------------------------------------------------------- */
/* Sessions                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The id the current session answers to.
 *
 * A constant rather than something minted per call, because the panel compares
 * ids to decide which row may not be signed out — and a row whose identity
 * changes between a render and a click is a row that eventually ends the wrong
 * session.
 */
export const CURRENT_SESSION_ID = "session_current";

/**
 * This browser, described from what this browser genuinely knows.
 *
 * Everything on it is observed rather than chosen. The device comes from the
 * user-agent, the time zone from `Intl`, and `startedAt` from
 * `performance.timeOrigin` — the instant this document began, which with no
 * sign-in flow in the product is the honest answer to "since when has this
 * browser been holding a session". `location` stays `null`: the coarse region
 * is derived from the request address by whatever receives it, and there is
 * nothing here that receives anything.
 */
function currentSession(): AccountSession {
  const now = Date.now();

  const startedAt =
    typeof performance !== "undefined" && performance.timeOrigin
      ? new Date(performance.timeOrigin).toISOString()
      : new Date(now).toISOString();

  return {
    id: CURRENT_SESSION_ID,
    device: describeThisDevice(),
    timeZone: deviceTimeZone(),
    location: null,
    startedAt,
    lastActiveAt: new Date(now).toISOString(),
    current: true,
  };
}

/**
 * `GET /account/sessions`
 *
 * Returns one session today, and it is a real one: the browser reading the
 * page. That is the part of "where am I signed in" a client can answer on its
 * own, and answering it is worth more than it sounds — somebody checking this
 * page after a scare wants to confirm the device in front of them is the
 * device the list describes.
 *
 * The other devices are the part that needs a service, and the panel says so
 * rather than padding the list out. Inventing a Safari on an iPhone in a city
 * the merchant has never visited, each row carrying a Sign out button that
 * ends nothing, would turn the one screen whose job is to be trusted into the
 * one screen that cannot be. When `remoteSessions` opens, the body of this
 * function becomes a `fetch` and the panel renders whatever comes back — it
 * already renders a list.
 */
export async function listSessions(): Promise<ServiceResult<AccountSession[]>> {
  await settle();
  return ok([currentSession()]);
}

/**
 * `DELETE /account/sessions/{id}`
 *
 * Refuses the current session before it checks anything else. Signing yourself
 * out is a legitimate thing to want and it is what the header's Sign out is
 * for; reaching it by accident from a list of devices, because your own row
 * looked like the others, is not. The guard is here rather than only in the UI
 * because it is the kind of rule that has to survive the second caller.
 */
export async function revokeSession(
  sessionId: string,
): Promise<ServiceResult<null>> {
  if (sessionId === CURRENT_SESSION_ID) {
    return fail(
      "forbidden",
      "This is the session you are using. Sign out from the account menu instead.",
    );
  }

  await settle();

  if (!CAPABILITIES.remoteSessions) {
    return fail("service_unavailable", UNAVAILABLE_REASON.remoteSessions);
  }

  return ok(null);
}

/**
 * `DELETE /account/sessions`
 *
 * Ends every session except this one and reports how many it ended, which is
 * the only receipt worth giving: "signed out 3 other devices" is checkable
 * against what the person expected, and a bare success is not.
 */
export async function revokeOtherSessions(): Promise<ServiceResult<number>> {
  await settle();

  if (!CAPABILITIES.remoteSessions) {
    return fail("service_unavailable", UNAVAILABLE_REASON.remoteSessions);
  }

  return ok(0);
}

/* -------------------------------------------------------------------------- */
/* Sign-in activity                                                           */
/* -------------------------------------------------------------------------- */

/**
 * `GET /account/sign-in-activity`
 *
 * Fails with `service_unavailable`, and that is the entire honest answer: a
 * sign-in log is a record of events that happened somewhere else, at times
 * this browser was not running, and nothing in it can be reconstructed from
 * the client. There is no version of this list the front end could produce
 * that would not be fiction.
 *
 * It is written as a failing call rather than left out because the failure is
 * the useful artefact. The panel renders it as a stated boundary — no retry
 * button, because there is nothing to retry — and the same panel renders real
 * rows, with real failed attempts and the alert they raise, the moment the
 * capability opens. The alternative, an empty list, would say something
 * different and false: that the account has never been signed into.
 */
export async function listSignInActivity(): Promise<
  ServiceResult<SignInEvent[]>
> {
  await settle();

  if (!CAPABILITIES.signInActivity) {
    return fail("service_unavailable", UNAVAILABLE_REASON.signInActivity);
  }

  return ok([]);
}
