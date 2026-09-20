import type { MerchantRole } from "@/constants/roles";
import type { MemberStatus } from "@/types/workspace";

/**
 * The Settings module's contract with the account service.
 *
 * Everything Settings reads or writes about *a person* is described here, and
 * nothing else describes it. That matters more than usual in this module: the
 * six Settings pages are the product's only surface where a wrong answer is
 * silently acted on — a merchant who reads "Two-factor: Enabled" stops worrying
 * about their password, and a merchant who reads "Saved" stops re-checking.
 *
 * These are deliberately *service* shapes rather than component props. When an
 * account API is stood up, `lib/account-service` is the only file that changes;
 * these types are what it must satisfy, and every panel is already written
 * against them.
 *
 * Read `types/workspace` alongside this. The split is the whole information
 * architecture of the module:
 *
 *   AccountUser / UserNotificationPreferences / SecurityState
 *       → belong to whoever is signed in, and follow them between workspaces
 *
 *   WorkspaceSettings / WorkspaceNotificationPolicy / Subscription
 *       → belong to the workspace, and are the same for everybody in it
 *
 * Anything that cannot be placed on one side of that line is usually two
 * settings wearing one name.
 */

/* -------------------------------------------------------------------------- */
/* The person                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The signed-in person, as the account service returns them.
 *
 * Split into what the person may change and what the workspace decides about
 * them, because the Profile page renders the two differently and needs to know
 * which is which without carrying a list of field names in the component.
 */
export interface AccountUser {
  id: string;

  /* -- editable by the person -------------------------------------------- */
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
  /** Object URL or remote URL. `null` means "render initials". */
  avatarUrl: string | null;

  /* -- identity, changed only through a verified flow --------------------- */
  /**
   * The sign-in address.
   *
   * Read-only to this module on purpose: changing it needs a round trip that
   * proves the new address can receive mail, and a field that accepts a new
   * one without that changes who the dashboard says you are on the strength of
   * a keystroke.
   */
  readonly email: string;

  /* -- granted by the workspace, read-only here --------------------------- */
  readonly roleId: string;
  readonly role: MerchantRole;
  readonly roleName: string;
  readonly workspaceId: string;
  readonly workspaceName: string;
  readonly status: MemberStatus;
  /** ISO. `null` for an invitation that has never been accepted. */
  readonly joinedAt: string | null;
  /** ISO. `null` for someone who has never signed in. */
  readonly lastActiveAt: string | null;
}

/** Exactly the fields Profile is allowed to submit. */
export type ProfilePatch = Pick<
  AccountUser,
  "firstName" | "lastName" | "phone" | "jobTitle"
>;

/** The person's display name, or their email when they have set no name. */
export function displayName(user: AccountUser): string {
  return `${user.firstName} ${user.lastName}`.trim() || user.email;
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Where a notification can land.
 *
 * Two, not five. SMS and WhatsApp are things this product *sends to customers*;
 * routing an operational alert down a billed channel is a different feature
 * with a different cost model, and listing it here as an unchecked box is a
 * promise of something nothing implements.
 */
export type NotificationChannel = "in_app" | "email";

/**
 * The six areas the notification catalogue is grouped under.
 *
 * `messaging` covers WhatsApp, email and SMS as one group rather than three.
 * The question a merchant is answering is "do I want to hear about WhatsApp",
 * not "do I want inbound messages but not sender verification", and the split
 * version produced nine rows that were always set identically.
 */
export type NotificationCategory =
  | "campaigns"
  | "leads"
  | "messaging"
  | "automations"
  | "orders"
  | "security";

/**
 * One thing the product can tell you about.
 *
 * `source` names the module that raises it and is never rendered. It exists so
 * the catalogue can be *checked* rather than trusted: a preference for an event
 * nothing emits is a switch that silently does nothing, and the merchant only
 * discovers it by not being told something.
 */
export interface NotificationEventDef {
  key: string;
  category: NotificationCategory;
  title: string;
  description: string;
  /** Every channel this event could ever use. */
  channels: NotificationChannel[];
  /** What a new member gets before they touch anything. */
  defaultChannels: NotificationChannel[];
  /**
   * Security notices the person may not switch off.
   *
   * "Your password changed" is how someone finds out it was not them. A
   * product that lets that be muted has built the attacker a quiet room.
   */
  mandatory?: boolean;
  /** The module that raises it. For auditing the catalogue, not for display. */
  source: string;
}

/**
 * What the workspace allows — the administrator's half of the split.
 *
 * An event absent from `enabled`, or present as `false`, is off for everybody
 * and does not appear in a normal member's list at all. `channels` narrows what
 * an event may use: a workspace that has not connected an email sender can
 * leave every event in-app only, and no member can opt into mail that would
 * never arrive.
 */
export interface WorkspaceNotificationPolicy {
  /** Event key → available to members of this workspace. */
  enabled: Record<string, boolean>;
  /** Event key → the channels this workspace permits for it. */
  channels: Record<string, NotificationChannel[]>;
}

/** The member's half: what they personally want, within what the policy allows. */
export interface UserNotificationPreferences {
  /** Event key → the channels this person wants it on. Empty means muted. */
  channels: Record<string, NotificationChannel[]>;
  /** Optional override for where mail goes. Empty means "my account address". */
  emailAddress: string;
  quietHours: QuietHours;
}

export type QuietHours = "off" | "night" | "night_weekend";

/* -------------------------------------------------------------------------- */
/* Security                                                                   */
/* -------------------------------------------------------------------------- */

export type TwoFactorStatus = "disabled" | "enabled";

export interface SecurityState {
  twoFactor: TwoFactorStatus;
  /** ISO, or `null` while disabled. */
  twoFactorEnabledAt: string | null;
  /** How many unused recovery codes remain. `null` when 2FA is off. */
  recoveryCodesRemaining: number | null;
  /** ISO of the last password change, or `null` if it has never been changed. */
  passwordChangedAt: string | null;
}

/**
 * An enrolment in flight.
 *
 * Handed out by `startTwoFactorEnrollment` and valid until it is verified or
 * abandoned. The secret is in it because the QR code and the manual setup key
 * are both renderings of that one value — there is no second, "displayable"
 * form of a TOTP secret.
 */
export interface TwoFactorEnrollment {
  /** Base32, unpadded — what an authenticator app expects. */
  secret: string;
  /** `otpauth://totp/...`, the string the QR code encodes. */
  otpauthUri: string;
  issuer: string;
  /** The label shown inside the authenticator app. */
  account: string;
}

/** Returned once, at the moment 2FA is switched on. Never retrievable after. */
export interface TwoFactorActivation {
  security: SecurityState;
  recoveryCodes: string[];
}

/* -------------------------------------------------------------------------- */
/* Sessions and sign-in history                                               */
/* -------------------------------------------------------------------------- */

export type DeviceKind = "desktop" | "mobile" | "tablet" | "unknown";

/**
 * A device, as far as a user-agent string can describe one.
 *
 * Parsed in `lib/user-agent` and never stored: it is what makes a row
 * recognisable to the person reading it, not what identifies the session. Two
 * identical laptops produce identical descriptions, and a user-agent is
 * trivially forged, so the session id is the only thing either half of the
 * system keys on.
 */
export interface DeviceInfo {
  browser: string;
  /** Major version only. `null` when the string does not carry one. */
  browserVersion: string | null;
  /** "Windows", "macOS", "iOS" — no release number. See `lib/user-agent`. */
  os: string;
  kind: DeviceKind;
}

/**
 * One place the account is signed in.
 *
 * `current` is the session doing the reading, and it is the field the whole
 * panel turns on: it is what earns the "Current session" badge, and it is what
 * stops a Sign out button from quietly ending the session somebody is using to
 * press it.
 *
 * Location is two fields on purpose, and neither is a city.
 *
 * `timeZone` is what the browser itself knows — `Europe/Lisbon` — and is
 * available for the current session without asking anybody anything.
 * `location` is the coarse region a service derives from the request address,
 * and stays `null` until one does. Keeping them apart is what stops the panel
 * presenting a browser setting as though the server had observed where the
 * device was.
 */
export interface AccountSession {
  id: string;
  device: DeviceInfo;
  /** IANA zone reported by that device, e.g. `Europe/Lisbon`. */
  timeZone: string | null;
  /** Coarse region, from the service. Never finer than a city. */
  location: string | null;
  /** ISO. When this session began. */
  startedAt: string;
  /** ISO. */
  lastActiveAt: string;
  current: boolean;
}

export type SignInOutcome = "success" | "failed";

/**
 * One sign-in attempt, successful or not.
 *
 * The failures are the point. A list of successes tells a person what they
 * already know; an attempt from a device they do not recognise is the thing
 * this section exists to put in front of them, and it is why `outcome` is on
 * every row rather than the list being filtered to the ones that worked.
 */
export interface SignInEvent {
  id: string;
  /** ISO. */
  at: string;
  device: DeviceInfo;
  location: string | null;
  outcome: SignInOutcome;
}

/* -------------------------------------------------------------------------- */
/* Billing                                                                    */
/* -------------------------------------------------------------------------- */

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled";

export type BillingPeriod = "monthly" | "yearly";

export interface Subscription {
  planId: string;
  status: SubscriptionStatus;
  period: BillingPeriod;
  /** Whole currency units, for the period above. */
  amount: number;
  currency: string;
  /** ISO. When the current period ends and the next charge is due. */
  renewsAt: string;
  startedAt: string;
  /** Set only while `status` is `trialing`. */
  trialEndsAt: string | null;
  /**
   * What the workspace will be charged against.
   *
   * `null` is the honest value here and it is load-bearing: no payment
   * provider is integrated, so inventing a card ending in 4242 would tell a
   * merchant their service cannot lapse.
   */
  paymentMethod: PaymentMethod | null;
}

export interface PaymentMethod {
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
}

/**
 * One charge, and everything a merchant needs to recognise it.
 *
 * The billing module used to keep two histories — a list of plan periods and a
 * list of invoices — and they were the same events described twice. A merchant
 * reconciling a statement had to hold both open and match them by date, which
 * is work the product was in a better position to do. This is the merged
 * record: one row per time money was taken, carrying the tier it bought.
 *
 * `PlanPeriod` is still the thing that is *stored*, because a period is what a
 * plan change creates and what a cancellation ends. A `Purchase` is derived
 * from it — see `listPurchaseHistory` — which is what keeps the two from ever
 * disagreeing. There is one history, viewed at the resolution a merchant reads
 * it: charges.
 *
 * Two statuses, because there are genuinely two facts and merging them loses
 * one. `planState` is what became of the subscription this charge bought —
 * still running, superseded by an upgrade, cancelled. `paymentState` is what
 * became of the money. A row can be `ended` and `paid` (an old period, settled)
 * or `active` and `pending` (a manual payment for the tier being moved to,
 * awaiting verification), and collapsing those into one word would make the
 * second indistinguishable from a plan the merchant already has.
 */
export interface Purchase {
  id: string;
  planId: string;
  planName: string;
  period: BillingPeriod;
  /** Whole currency units, for the one charge. */
  amount: number;
  currency: string;
  /** ISO. When the charge was taken, or the payment submitted. */
  purchasedAt: string;
  planState: PurchasePlanState;
  paymentState: PurchasePaymentState;
  /**
   * The provider's human-readable number, e.g. `INV-1024`.
   *
   * `null` for a payment nothing has invoiced yet — a manual transfer waiting
   * on verification is a claim, and an invoice number against it would imply a
   * document somebody could ask for.
   */
  invoiceNumber: string | null;
  /**
   * The provider-hosted PDF. `null` when none has been issued.
   *
   * Nullable rather than a route this app could serve: a "View invoice" that
   * points at a PDF nothing generates is the billing page's version of a dead
   * link, and the one place a merchant is most likely to need the file is an
   * audit.
   */
  invoiceUrl: string | null;
}

/** What the plan a charge bought is doing now. */
export type PurchasePlanState = "active" | "ended" | "cancelled" | "pending";

/** What became of the money. */
export type PurchasePaymentState = "paid" | "pending" | "failed" | "refunded";

/**
 * One period the workspace has spent on a plan.
 *
 * What the store holds, and what every row of Purchased History is derived
 * from. It is a *history* rather than a list of tiers: a workspace that moved Starter → Growth → Growth billed yearly has
 * three entries, because each one was charged separately and each one is a
 * separate answer to "what was I paying in March".
 *
 * `endedAt` is `null` for exactly one entry — the period running now, which is
 * also the only one whose `status` is `active`. An open period has no end date,
 * and filling it with the next renewal date would state as settled something
 * that has not been charged yet.
 *
 * `planName` is carried on the entry rather than looked up from
 * `constants/pricing`. A tier that is renamed or retired must not silently
 * rewrite what a past period was for, and a row that resolves to nothing is
 * worse than one quoting the name the merchant actually bought.
 */
export interface PlanPeriod {
  id: string;
  planId: string;
  planName: string;
  period: BillingPeriod;
  /** Whole currency units, for one `period`. */
  amount: number;
  currency: string;
  /** ISO. */
  startedAt: string;
  /** ISO. `null` while this is the period currently running. */
  endedAt: string | null;
  status: PlanPeriodStatus;
}

/**
 * A *period's* state, which is not a subscription's.
 *
 * Two values, because a closed period only ever answers one question — is this
 * the one running, or is it over. `SubscriptionStatus` describes the agreement
 * as it stands today (trialing, past due, cancelled); a period that ended
 * fourteen months ago when the workspace moved up a tier was none of those, and
 * labelling it `cancelled` would tell a merchant they once quit.
 */
export type PlanPeriodStatus = "active" | "ended";

/** One metered allowance on the plan. */
export interface UsageMetric {
  key: string;
  label: string;
  /** What this workspace has used in the current period. */
  used: number;
  /** The plan's allowance, or `null` for an unmetered entitlement. */
  limit: number | null;
  /** The noun, already plural: "contacts", "messages". */
  unit: string;
  hint: string;
}

/* -------------------------------------------------------------------------- */
/* Checkout                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A payment method as the checkout offers it.
 *
 * `PaymentGatewayDef` from `constants/billing` describes what the product can
 * do; this is what the *service* says is true right now, which is the same
 * record plus whatever a backend would add to it. The selector renders this
 * one, so a gateway list that later arrives over HTTP needs no component
 * change.
 */
export interface PaymentGateway {
  id: string;
  kind: "automatic" | "manual";
  name: string;
  description: string;
  /** Usable. `false` still renders — marked, and refused at the point of use. */
  configured: boolean;
  /** Shown where the method is chosen and again where it would be charged. */
  unavailableReason?: string;
}

/** Exactly what the manual payment form submits. */
export interface ManualPaymentInput {
  planId: string;
  period: BillingPeriod;
  amount: number;
  currency: string;
  /** How it was sent — bank transfer, wire, cheque. See `MANUAL_PAYMENT_METHODS`. */
  method: string;
  /** The bank's reference for the transfer. What an administrator matches on. */
  reference: string;
  /** `yyyy-mm-dd`, straight from a native date input. */
  paidAt: string;
  /** The account or name the money came from. */
  sender: string;
  note: string;
  /**
   * The receipt's file name, and only its name.
   *
   * The bytes are held by the browser until an upload endpoint exists; putting
   * a base64 receipt in a session store would be a copy of somebody's bank
   * statement living in a tab with no way to clear it. The record says what was
   * attached so the merchant can see their own submission is complete.
   */
  proofName: string | null;
}

export type PaymentRequestStatus = "pending" | "verified" | "rejected";

/**
 * A payment awaiting a human.
 *
 * The record a manual submission creates, and the reason manual payment can be
 * honest where automatic payment cannot: nothing here claims money moved. It
 * says a merchant *states* they sent it, on which date, under which reference,
 * and that an administrator has not yet agreed.
 *
 * Which is why submitting one does **not** touch `Subscription`. The plan
 * starts when the payment is verified, and a tier that goes active on the
 * strength of a typed reference number is a subscription anybody can grant
 * themselves.
 */
export interface PaymentRequest {
  id: string;
  reference: string;
  planId: string;
  planName: string;
  period: BillingPeriod;
  amount: number;
  currency: string;
  gatewayId: string;
  gatewayName: string;
  /** ISO. When it was submitted here. */
  submittedAt: string;
  /** `yyyy-mm-dd`. When the merchant says they sent it. */
  paidAt: string;
  status: PaymentRequestStatus;
  proofName: string | null;
  note: string;
}

/* -------------------------------------------------------------------------- */
/* Service results                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Why an operation could not be performed.
 *
 * `service_unavailable` is the one that matters and the reason this is a union
 * rather than a thrown string: it means "nothing was attempted, because there
 * is nothing to attempt it against", and the UI must render it as plainly as
 * that. It is not a network blip and it must never be retried into a success.
 */
export type ServiceErrorCode =
  | "service_unavailable"
  | "invalid_credentials"
  | "invalid_code"
  | "validation"
  | "forbidden";

export interface ServiceError {
  code: ServiceErrorCode;
  message: string;
}

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError };

export const ok = <T,>(data: T): ServiceResult<T> => ({ ok: true, data });

export const fail = <T,>(
  code: ServiceErrorCode,
  message: string,
): ServiceResult<T> => ({ ok: false, error: { code, message } });
