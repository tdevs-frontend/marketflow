export const siteConfig = {
  name: "MarketFlow",
  description:
    "Multi-channel marketing automation and CRM — WhatsApp, email, and SMS campaigns in one workspace.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  links: {
    docs: "/docs",
    support: "mailto:support@marketflow.app",
  },
} as const;

export type SiteConfig = typeof siteConfig;
