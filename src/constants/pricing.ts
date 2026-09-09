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
