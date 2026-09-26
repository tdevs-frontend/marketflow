import { env } from "@/config";

/**
 * The payment methods MarketFlow knows how to take money through.
 *
 * A catalogue, not a menu. Every entry here is a method the checkout has a real
 * branch for; what changes between deployments is whether the credentials
 * behind one exist, and that is `configured`. Keeping the two apart is the
 * whole point of the file:
 *
 *   A gateway the product cannot use still appears in the selector, named and
 *   described, marked *Not connected*. Hiding it would leave a merchant
 *   wondering whether MarketFlow takes cards at all; listing it as though it
 *   worked would let them reach a payment step that cannot charge anything.
 *   Neither is acceptable, and "here, but not switched on" is the only honest
 *   third answer.
 *
 * `configured` is derived from the environment rather than hand-set, so
 * connecting Stripe is a key in `.env` and not an edit here. No publishable key
 * is present in any build of this app today, which is why the automatic methods
 * are all off and the checkout's automatic branch stops at a stated boundary.
 *
 * Manual payment needs no third party - it is a merchant telling an
 * administrator what they sent and attaching proof - so it is the one method
 * that is always available, and the one the flow can carry end to end.
 */

export type PaymentMethodKind = "automatic" | "manual";

export interface PaymentGatewayDef {
  id: string;
  kind: PaymentMethodKind;
  name: string;
  /** One line under the name, in the selector. */
  description: string;
  /** Credentials exist and the method can actually be used. */
  configured: boolean;
  /** Said at the point of use when `configured` is false. */
  unavailableReason?: string;
  /**
   * The method's image, served from `public/payment-methods` - stored
   * locally, never hotlinked. Stripe's and PayPal's are their official marks
   * (stripeassets.com, paypalobjects.com). Manual payment has no brand, so it
   * uses a bank icon: Fluent UI System Icons "Building Bank" (Microsoft, MIT),
   * recoloured with the brand gradient so it sits with the product's palette.
   * A method without one falls back to its icon in the selector.
   */
  logo?: string;
}

/**
 * Publishable keys, read once.
 *
 * `NEXT_PUBLIC_*` because a publishable key is meant to reach the browser - it
 * identifies the account, it does not authorise a charge. The secret key never
 * appears in this file, in `config/env`, or anywhere else the client bundles:
 * a charge is created server-side against a token, which is also why the
 * checkout below never asks for a card number. See `payForPlan`.
 */
const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

const NOT_CONNECTED =
  "Payment provider is not connected. Add its keys to the environment to enable this method.";

export const PAYMENT_GATEWAYS: PaymentGatewayDef[] = [
  {
    id: "stripe",
    kind: "automatic",
    name: "Stripe",
    description:
      "Pay by card through Stripe's secure checkout. Card details go to Stripe, never to MarketFlow.",
    configured: STRIPE_KEY.length > 0,
    unavailableReason: NOT_CONNECTED,
    logo: "/payment-methods/stripe.svg",
  },
  {
    id: "paypal",
    kind: "automatic",
    name: "PayPal",
    description: "Approve the subscription from your PayPal balance or card.",
    configured: PAYPAL_CLIENT_ID.length > 0,
    unavailableReason: NOT_CONNECTED,
    logo: "/payment-methods/paypal.svg",
  },
  {
    id: "manual",
    kind: "manual",
    name: "Manual payment",
    description:
      "Pay by bank transfer and submit the reference. An administrator verifies it before the plan starts.",
    /* No third party to connect. The form, the upload and the pending record
       are all this method needs, and all three exist. */
    configured: true,
    logo: "/payment-methods/bank-transfer.svg",
  },
];

/** The ways a manual payment can have been sent, for the form's first field. */
export const MANUAL_PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "wire", label: "International wire" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
] as const;

export type ManualPaymentMethod = (typeof MANUAL_PAYMENT_METHODS)[number]["value"];

/**
 * What a payment proof may be, and how large.
 *
 * Mirrors `AVATAR_RULES` in shape so the two uploads in Settings refuse a file
 * the same way. PDFs are first because a bank's receipt usually is one.
 */
export const PAYMENT_PROOF_RULES = {
  accept: ["application/pdf", "image/png", "image/jpeg", "image/webp"],
  maxBytes: 8 * 1024 * 1024,
  label: "PDF, PNG, JPG or WebP, up to 8MB",
} as const;

/** Whether any automatic method could be used in this deployment. */
export const HAS_AUTOMATIC_GATEWAY = PAYMENT_GATEWAYS.some(
  (gateway) => gateway.kind === "automatic" && gateway.configured,
);

/**
 * Tax, as the review step reports it.
 *
 * Zero, and shown rather than hidden, because a total that silently equals the
 * plan price leaves a merchant unsure whether tax is included or simply not
 * calculated yet. No tax engine is connected; when one is, this is where its
 * answer arrives.
 */
export const TAX_RATE = 0;

/** Kept beside the rate so nothing else has to know the rate is a fraction. */
export const taxOn = (amount: number) => Math.round(amount * TAX_RATE * 100) / 100;

/** True when this build talks to no billing backend at all. See `SESSION_MODE`. */
export const BILLING_IS_LOCAL = env.apiBaseUrl === "/api";
