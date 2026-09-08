import type { MarketingChannel } from "@/types/marketing";
import type { SocialPlatform } from "@/types/social";

/**
 * Per-channel visual identity.
 *
 * The design system is shared, so what separates a WhatsApp page from an Email
 * page is this table and nothing else: one accent, one icon, one set of metric
 * words. Everything a channel page renders — stat cards, chart series, chips,
 * empty states — reads its colour from here rather than hard-coding a class,
 * which is what keeps four modules consistent without making them identical.
 *
 * WhatsApp maps onto the brand ramp because it is the product's lead channel;
 * the rest have their own tokens in `styles/variables.css`.
 */

/** Social is a channel for reporting, but has no campaigns of its own. */
export type Channel = MarketingChannel | "social";

export interface ChannelTheme {
  key: Channel;
  label: string;
  /** Lucide key resolved by `components/ui/icon`. */
  icon: string;
  /** Solid accent — chart-free surfaces, dots, bars. */
  accent: string;
  /** Text on a light ground. */
  text: string;
  /** Tinted ground, for icon tiles and soft chips. */
  soft: string;
  /** Border matching `soft`, one step stronger. */
  border: string;
  /** Filled treatment: accent ground, white ink. */
  solid: string;
  /** Literal hex for ApexCharts, which cannot read a CSS variable. */
  hex: string;
  /** Route prefix for this channel's module. */
  base: string;
}

export const CHANNEL_THEME: Record<Channel, ChannelTheme> = {
  whatsapp: {
    key: "whatsapp",
    label: "WhatsApp",
    icon: "message-circle",
    accent: "bg-primary",
    text: "text-primary",
    soft: "bg-primary-soft",
    border: "border-primary-border",
    solid: "bg-primary text-white",
    hex: "#128c7e",
    base: "/dashboard/marketing/whatsapp",
  },
  email: {
    key: "email",
    label: "Email",
    icon: "mail",
    accent: "bg-email",
    text: "text-email",
    soft: "bg-email-soft",
    border: "border-email-border",
    solid: "bg-email text-white",
    hex: "#2563eb",
    base: "/dashboard/marketing/email",
  },
  sms: {
    key: "sms",
    label: "SMS",
    icon: "smartphone",
    accent: "bg-sms",
    text: "text-sms",
    soft: "bg-sms-soft",
    border: "border-sms-border",
    solid: "bg-sms text-white",
    hex: "#7c3aed",
    base: "/dashboard/marketing/sms",
  },
  social: {
    key: "social",
    label: "Social",
    icon: "calendar-days",
    accent: "bg-social",
    text: "text-social",
    soft: "bg-social-soft",
    border: "border-social-border",
    solid: "bg-social text-white",
    hex: "#64748b",
    base: "/dashboard/marketing/social",
  },
};

/** Display order everywhere a channel comparison is rendered. */
export const CHANNEL_ORDER: Channel[] = ["whatsapp", "email", "sms", "social"];

export const CHANNEL_HEXES = CHANNEL_ORDER.map((key) => CHANNEL_THEME[key].hex);

/* -------------------------------------------------------------------------- */
/* Social platforms                                                           */
/* -------------------------------------------------------------------------- */

export interface PlatformTheme {
  key: SocialPlatform;
  label: string;
  /** Brand-icon key resolved by `components/ui/brand-icon`. */
  icon: string;
  /** Foreground for the mark, on a light ground. */
  text: string;
  soft: string;
  solid: string;
  /**
   * Solid background, for legend swatches and dots.
   *
   * Spelled out rather than built as `bg-${key}`: Tailwind scans source for
   * literal class strings, so an interpolated one is never generated.
   */
  swatch: string;
  hex: string;
}

export const PLATFORM_THEME: Record<SocialPlatform, PlatformTheme> = {
  instagram: {
    key: "instagram",
    label: "Instagram",
    icon: "instagram",
    text: "text-instagram",
    soft: "bg-instagram/8",
    solid: "bg-instagram text-white",
    swatch: "bg-instagram",
    hex: "#d62976",
  },
  facebook: {
    key: "facebook",
    label: "Facebook",
    icon: "facebook",
    text: "text-facebook",
    soft: "bg-facebook/8",
    solid: "bg-facebook text-white",
    swatch: "bg-facebook",
    hex: "#1877f2",
  },
  linkedin: {
    key: "linkedin",
    label: "LinkedIn",
    icon: "linkedin",
    text: "text-linkedin",
    soft: "bg-linkedin/8",
    solid: "bg-linkedin text-white",
    swatch: "bg-linkedin",
    hex: "#0a66c2",
  },
  x: {
    key: "x",
    label: "X",
    icon: "x",
    text: "text-x",
    soft: "bg-x/8",
    solid: "bg-x text-white",
    swatch: "bg-x",
    hex: "#17212b",
  },
};

export const PLATFORM_ORDER: SocialPlatform[] = [
  "instagram",
  "facebook",
  "linkedin",
  "x",
];

export const PLATFORM_HEXES = PLATFORM_ORDER.map((key) => PLATFORM_THEME[key].hex);
