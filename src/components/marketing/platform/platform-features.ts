import {
  ChartNoAxesCombined,
  Mail,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Package,
  Plug,
  Smartphone,
  Target,
  TrendingUp,
  UserPlus,
  UsersRound,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * The platform ecosystem's content, in one place.
 *
 * The rails, the orbit nodes, the connectors and the workflow bar all read from
 * here, so a feature is described once and the hub's satellite, its card and
 * the dot on its connector always agree.
 */

/* -------------------------------------------------------------------------- */
/* Tones                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Icon tints, drawn from the token ramps rather than invented per card.
 *
 * The rule is the design system's own: a feature that *is* a channel wears that
 * channel's colour, and everything else stays on the brand pair. That caps the
 * section at six hues, which is what keeps eight cards from reading as a
 * rainbow — see the channel-identity notes in `styles/variables.css`.
 *
 * Four faces per tone, because the same hue has four jobs in this section:
 *
 *   chip  the card's icon tile — soft ground plus its ink.
 *   ink   the orbit node's icon, which sits on white so it needs the ink alone.
 *   dot   the status pill's bullet and the connector's endpoint node.
 *   glow  the halo the card's icon tile picks up on hover. Literal rgba rather
 *         than a token, since a colour-mix in a shadow is not worth the
 *         indirection for six one-line values — the hexes are the ramp's own.
 */
export type Tone = "whatsapp" | "email" | "sms" | "primary" | "secondary" | "amber";

export interface ToneFaces {
  chip: string;
  ink: string;
  dot: string;
  glow: string;
}

export const TONES: Record<Tone, ToneFaces> = {
  whatsapp: {
    chip: "bg-whatsapp-soft text-whatsapp",
    ink: "text-whatsapp",
    dot: "bg-whatsapp",
    glow: "group-hover:shadow-[0_0_0_4px_rgba(5,150,105,0.10)]",
  },
  email: {
    chip: "bg-email-soft text-email",
    ink: "text-email",
    dot: "bg-email",
    glow: "group-hover:shadow-[0_0_0_4px_rgba(37,99,235,0.10)]",
  },
  sms: {
    chip: "bg-sms-soft text-sms",
    ink: "text-sms",
    dot: "bg-sms",
    glow: "group-hover:shadow-[0_0_0_4px_rgba(147,51,234,0.10)]",
  },
  primary: {
    chip: "bg-primary-soft text-primary",
    ink: "text-primary",
    dot: "bg-primary",
    glow: "group-hover:shadow-[0_0_0_4px_rgba(79,70,229,0.10)]",
  },
  secondary: {
    chip: "bg-primary-subtle text-secondary",
    ink: "text-secondary",
    dot: "bg-secondary",
    glow: "group-hover:shadow-[0_0_0_4px_rgba(124,58,237,0.10)]",
  },
  /* Named for the hue, not `warning` — nothing here is a warning. It borrows
     that ramp's ink because it clears contrast on the soft amber. */
  amber: {
    chip: "bg-warning-soft text-warning-text",
    ink: "text-warning-text",
    dot: "bg-warning",
    glow: "group-hover:shadow-[0_0_0_4px_rgba(245,158,11,0.14)]",
  },
};

/* -------------------------------------------------------------------------- */
/* Features                                                                   */
/* -------------------------------------------------------------------------- */

export interface PlatformFeature {
  title: string;
  body: string;
  /** The small pill under the description — a live-ish reading, not a label. */
  status: string;
  icon: LucideIcon;
  tone: Tone;
}

/** Left rail — how a customer arrives and what the business sells them. */
export const INBOUND_FEATURES: PlatformFeature[] = [
  {
    title: "WhatsApp Automation",
    body: "Automate conversations & follow-ups",
    status: "Active",
    icon: MessageCircle,
    tone: "whatsapp",
  },
  {
    title: "Products & Orders",
    body: "Manage catalog, orders and inventory",
    status: "In One Place",
    icon: Package,
    tone: "primary",
  },
  {
    title: "CRM & Leads",
    body: "Capture, organize & convert leads",
    status: "1,248 Leads",
    icon: UsersRound,
    tone: "email",
  },
  {
    title: "Campaigns",
    body: "Launch targeted campaigns",
    status: "12 Active",
    icon: Megaphone,
    tone: "secondary",
  },
];

/** Right rail — how the platform reaches back out and reports. */
export const OUTBOUND_FEATURES: PlatformFeature[] = [
  {
    title: "Email Marketing",
    body: "Create & send email campaigns",
    status: "Ready",
    icon: Mail,
    tone: "email",
  },
  {
    title: "SMS Marketing",
    body: "Reach customers instantly",
    status: "Multi-channel",
    icon: Smartphone,
    tone: "sms",
  },
  {
    title: "Analytics & Reports",
    body: "Measure what drives growth",
    status: "Live",
    icon: ChartNoAxesCombined,
    tone: "primary",
  },
  {
    title: "Integrations",
    body: "Connect your favorite tools",
    status: "50+ Integrations",
    icon: Plug,
    tone: "amber",
  },
];

/** Both rails, clockwise from the top — the order the satellites orbit in. */
export const ORBIT_FEATURES: PlatformFeature[] = [
  INBOUND_FEATURES[0], // WhatsApp, at twelve o'clock
  OUTBOUND_FEATURES[1], // SMS
  OUTBOUND_FEATURES[2], // Analytics
  OUTBOUND_FEATURES[3], // Integrations
  INBOUND_FEATURES[3], // Campaigns, at six o'clock
  INBOUND_FEATURES[2], // CRM
  INBOUND_FEATURES[1], // Products
  OUTBOUND_FEATURES[0], // Email
];

/* -------------------------------------------------------------------------- */
/* Workflow                                                                   */
/* -------------------------------------------------------------------------- */

export interface WorkflowStep {
  label: string;
  icon: LucideIcon;
  /**
   * Wears the brand gradient instead of the soft tile. Exactly one step does:
   * automation is the differentiator the whole section is arguing for, and a
   * bar where every step is emphasised emphasises nothing.
   */
  accent?: boolean;
}

/** The customer journey the platform covers end to end. */
export const WORKFLOW_STEPS: WorkflowStep[] = [
  { label: "Capture", icon: UserPlus },
  { label: "Engage", icon: MessagesSquare },
  { label: "Automate", icon: Zap, accent: true },
  { label: "Convert", icon: Target },
  { label: "Grow", icon: TrendingUp },
];

/* -------------------------------------------------------------------------- */
/* Geometry                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Where a rail's cards sit vertically, as a percentage of the rail.
 *
 * The rails are a four-row grid with no gap — each card gets its breathing room
 * from its own vertical padding instead — so the rows are exactly equal and a
 * card's centre lands on `(i + 0.5) / 4`. `ConnectionLines` anchors its curves
 * and endpoint dots to the same numbers, which is what keeps a dot on its
 * card's centre line at every width without measuring anything.
 */
export const RAIL_ROWS = [12.5, 37.5, 62.5, 87.5];

/**
 * Distance from the hub's centre to a satellite's centre, as a percentage of
 * the hub's square container.
 *
 * The dashed ring is drawn at the same radius (`inset-[8%]` gives a circle of
 * 84% diameter, so 42% radius), which is what makes the satellites read as
 * sitting *on* the orbit rather than floating near it.
 *
 * 42 is also the smallest radius that clears the core's caption at the narrow
 * end of the range: the two satellites on the lower diagonals pass either side
 * of "Marketing Operating System", and at 40 they clip it on a 320px phone.
 */
export const ORBIT_RADIUS = 42;
