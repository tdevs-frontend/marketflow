import type { Metadata } from "next";

import { LegalDocument } from "@/components/marketing/legal";
import { APP_ROUTES } from "@/constants";
import { TERMS_OF_SERVICE } from "@/constants/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of MarketFlow - accounts and workspaces, messaging, customer data, billing, and each party's responsibilities.",
};

/** The Terms of Service. Content is `TERMS_OF_SERVICE` in `constants/legal.ts`. */
export default function TermsPage() {
  return (
    <LegalDocument
      document={TERMS_OF_SERVICE}
      related={{ label: "Read the Privacy Policy", href: APP_ROUTES.legalPrivacy }}
    />
  );
}
