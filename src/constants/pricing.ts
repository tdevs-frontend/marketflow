/**
 * Pricing plans and the capability blocks beneath them.
 *
 * Data lives here rather than in the page so the tiers can be read and edited
 * without touching layout, and so the yearly price is *derived* from the
 * monthly one — a hand-written second number is how a pricing page ends up
 * advertising a discount it does not actually give.
 */

export type PlanTier = "starter" | "growth" | "business" | "enterprise";

export interface Plan {
  id: PlanTier;
  name: string;
  /** Who the tier is for. One line, under the name. */
  audience: string;
  /**
   * Monthly price in whole currency units, or `null` for a quoted plan. The
   * yearly figure is computed from this — see `yearlyMonthly`.
   */
  monthly: number | null;
  features: string[];
  cta: string;
  /** The one visually dominant tier. Exactly one plan should set this. */
  featured?: boolean;
}

/** The yearly discount, applied to every priced tier. */
export const YEARLY_DISCOUNT = 0.2;

/**
 * What a plan costs per month when billed yearly. Rounded to a whole unit so
 * the card never shows a price like $39.20.
 */
export const yearlyMonthly = (monthly: number) =>
  Math.round(monthly * (1 - YEARLY_DISCOUNT));

/**
 * What one billing period of a tier costs — the number that is charged.
 *
 * Distinct from `yearlyMonthly`, which is the *per-month figure a yearly plan
 * is advertised at*: the card says "$39 / month, billed yearly" and the charge
 * is $468. Both numbers are true and only one of them is an amount of money
 * anybody pays, so the two have separate names and the checkout, the service
 * and the plan history all call this one.
 *
 * `null` for a quoted tier. There is no price to charge, which is why
 * Enterprise is a conversation and not a button.
 */
export const planPrice = (
  plan: Plan,
  period: "monthly" | "yearly",
): number | null => {
  if (plan.monthly === null) return null;
  return period === "yearly" ? yearlyMonthly(plan.monthly) * 12 : plan.monthly;
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    audience: "For small businesses getting started.",
    monthly: 19,
    features: [
      "1 Workspace",
      "1,000 Contacts",
      "2,500 WhatsApp Messages",
      "5 Campaigns",
      "Basic CRM",
      "Product Catalog",
      "Basic Analytics",
      "Email Support",
    ],
    cta: "Start Free",
  },
  {
    id: "growth",
    name: "Growth",
    audience:
      "For growing businesses ready to scale with automation",
    monthly: 49,
    features: [
      "3 Workspaces",
      "10,000 Contacts",
      "15,000 WhatsApp Messages",
      "Unlimited Campaigns",
      "CRM & Lead Management",
      "Automation Workflows",
      "Customer Segmentation",
      "Product Management",
      "Orders & Discounts",
      "Marketing Analytics",
    ],
    cta: "Start Growing",
    featured: true,
  },
  {
    id: "business",
    name: "Business",
    audience: "For established businesses managing larger customer journeys.",
    monthly: 99,
    features: [
      "10 Workspaces",
      "50,000 Contacts",
      "50,000 WhatsApp Messages",
      "Advanced Automation",
      "Advanced CRM",
      "Multi-channel Campaigns",
      "Product & Order Management",
      "Advanced Analytics",
      "Team Collaboration",
      "Priority Support",
    ],
    cta: "Start Business",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    audience: "For larger organizations with custom requirements.",
    monthly: null,
    features: [
      "Unlimited Contacts",
      "Custom Message Volume",
      "Unlimited Workspaces",
      "Advanced Automation",
      "Custom Integrations",
      "Dedicated Support",
      "Data & Security Controls",
      "Custom Onboarding",
    ],
    cta: "Contact Sales",
  },
];

/**
 * The four capability areas every tier draws from — the same four the sidebar
 * is organised around, so the pricing page and the product agree on what
 * MarketFlow is.
 */
export interface Capability {
  /** Lucide key resolved by `components/ui/icon`. */
  icon: string;
  title: string;
  description: string;
}

export const CAPABILITIES: Capability[] = [
  {
    icon: "users",
    title: "CRM & Leads",
    description:
      "Every contact, lead stage and segment in one record you can act on.",
  },
  {
    icon: "message-circle",
    title: "WhatsApp Automation",
    description:
      "Templates, campaigns and follow-up flows on the Business API.",
  },
  {
    icon: "megaphone",
    title: "Marketing Campaigns",
    description:
      "WhatsApp, email and SMS from one audience and one set of numbers.",
  },
  {
    icon: "shopping-cart",
    title: "Commerce & Sales",
    description:
      "Products, catalogues, orders and discounts tied back to revenue.",
  },
];

/** Compact reassurance under the plans. Claims we can actually stand behind. */
export const PRICING_ASSURANCES = [
  "No setup complexity",
  "Upgrade anytime",
  "Secure & self-hosted",
  "Built for growing businesses",
];

/**
 * The questions a buyer asks between reading the prices and entering a card.
 *
 * Billing questions only. "What can MarketFlow do" is answered on `/features`
 * and by the plan cards above this section, and a pricing FAQ that re-pitches
 * the product is a second CTA with a chevron on it.
 *
 * Every answer is checkable against something on this page: the discount is
 * `YEARLY_DISCOUNT`, the tiers are `PLANS`, and the quoted tier is quoted
 * because `monthly` is `null`. Nothing here invents a trial length, a refund
 * window or a payment processor the product has not committed to.
 */
export const PRICING_FAQS = [
  {
    q: "Can I change plans later?",
    a: "Yes. You can move up or down a tier at any point from workspace billing, and the change takes effect on your next invoice — you are never locked into the plan you started on.",
  },
  {
    q: "How much does yearly billing save?",
    a: "Yearly billing is 20% cheaper than paying monthly. The card shows the discounted per-month figure, and the amount actually charged is that figure for twelve months, in one invoice.",
  },
  {
    q: "What happens if I outgrow my plan?",
    a: "Nothing stops working. You will see the limit in your workspace before you reach it, and upgrading takes effect immediately — your contacts, conversations, campaigns and history carry across untouched.",
  },
  {
    q: "What is included in every plan?",
    a: "The workspace itself: contacts and leads, the shared inbox, campaigns, automation, templates and analytics. The tiers differ in volume, team size and the depth of the commerce and integration features, not in whether the product works.",
  },
  {
    q: "Why is Enterprise quoted rather than priced?",
    a: "Because the things Enterprise customers need — volume commitments, multiple workspaces, security review, onboarding — are not the same for any two of them. A number on this page would be a guess, so it is a conversation instead.",
  },
  {
    q: "Can I cancel at any time?",
    a: "Yes. Cancelling stops the next renewal and leaves your workspace usable until the end of the period you have already paid for. You can export your contacts and campaign history at any point before or after.",
  },
];
