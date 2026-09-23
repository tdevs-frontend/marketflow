import type { Metadata } from "next";

import { LegalDocument } from "@/components/marketing/legal";
import { APP_ROUTES } from "@/constants";
import { PRIVACY_POLICY } from "@/constants/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How MarketFlow collects, uses, shares and protects information about its users and about the customers and leads businesses manage in MarketFlow.",
};

/** The Privacy Policy. Content is `PRIVACY_POLICY` in `constants/legal.ts`. */
export default function PrivacyPage() {
  return (
    <LegalDocument
      document={PRIVACY_POLICY}
      related={{ label: "Read the Terms of Service", href: APP_ROUTES.legalTerms }}
    />
  );
}
