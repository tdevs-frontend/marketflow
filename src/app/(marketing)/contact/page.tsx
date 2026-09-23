import type { Metadata } from "next";

import {
  ContactForm,
  ContactHero,
  ContactInfo,
  FinalCta,
} from "@/components/marketing";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to the MarketFlow team - call us, email support or sales, or find us on the map.",
};

/**
 * The Contact route.
 *
 * The header's Contact item has pointed here since before the page existed.
 * Three bands, in the order every other marketing route uses them: the hero
 * with the page's `h1` and its trail, the content, and the closing panel.
 *
 * `ContactHero` is built from `BlogHero`, so the ground, the grid, the bloom
 * and the breadcrumb are the same ones `/blog` opens with.
 */
export default function ContactPage() {
  return (
    <>
      <ContactHero />

      <ContactInfo />

      <ContactForm />

      <FinalCta />
    </>
  );
}
