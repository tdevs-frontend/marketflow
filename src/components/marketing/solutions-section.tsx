import {
  GraduationCap,
  HeartPulse,
  House,
  LayoutGrid,
  ShoppingBag,
  Store,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { CommonTextButton } from "@/components/ui/common-text-button";

/* ------------------------------------------------------------------ tokens */

const INK = "#0F1626";
const BODY = "#667085";
const ITEM = "#344054";
const VIOLET = "#6D3EF0";

/* -------------------------------------------------------------- primitives */

function Check({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      className="shrink-0"
      style={{ marginTop: 1 }}
    >
      <circle cx="10" cy="10" r="10" fill={color} />
      <path
        d="M5.9 10.3l2.6 2.6 5.6-5.8"
        fill="none"
        stroke="#fff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------- card side panels */

/* -------------------------------------------------------------- card data */
export interface SolutionCardData {
  title: string;
  desc: string;
  href: string;
  bullets: string[];
  bg: string;
  border: string;
  tile: string;
  check: string;
  Icon: LucideIcon;
  iconColor: string;
}

export const SOLUTION_CARDS: SolutionCardData[] = [
  {
    title: "E-commerce",
    desc: "Turn conversations into customers and grow your online store.",
    href: "/solutions/ecommerce",
    bullets: [
      "Recover abandoned carts",
      "Send order updates automatically",
      "Drive repeat purchases",
      "Sync with your store",
    ],
    bg: "linear-gradient(140deg, #ECFAF1 0%, #F4FBF7 42%, #FFFFFF 78%)",
    border: "#DDF0E4",
    tile: "#C8EED9",
    check: "#22C55E",
    Icon: ShoppingBag,
    iconColor: "#16A34A",
  },
  {
    title: "Small & Medium Business",
    desc: "Grow your local business, engage customers and drive more sales.",
    href: "/solutions/small-business",
    bullets: [
      "Capture leads from multiple channels",
      "Automate follow-ups",
      "Manage customers in one place",
      "Save time and boost sales",
    ],
    bg: "linear-gradient(140deg, #F3F0FF 0%, #F8F6FF 42%, #FFFFFF 78%)",
    border: "#E7E2FB",
    tile: "#DED5FF",
    check: "#6D4AF5",
    Icon: Store,
    iconColor: VIOLET,
  },
  {
    title: "Marketing Agencies",
    desc: "Manage multiple clients and campaigns with ease.",
    href: "/solutions/agencies",
    bullets: [
      "Handle multiple workspaces",
      "Create and manage campaigns",
      "Track performance for all clients",
      "Deliver real results",
    ],
    bg: "linear-gradient(140deg, #EDF5FF 0%, #F5F9FF 42%, #FFFFFF 78%)",
    border: "#DFEAFA",
    tile: "#D2E6FF",
    check: "#2F80ED",
    Icon: UsersRound,
    iconColor: "#2F80ED",
  },
  {
    title: "Real Estate",
    desc: "Capture more inquiries, nurture leads and close deals faster.",
    href: "/solutions/real-estate",
    bullets: [
      "Capture property inquiries",
      "Automate follow-ups",
      "Schedule property visits",
      "Manage leads and pipelines",
    ],
    bg: "linear-gradient(140deg, #FFF6EB 0%, #FFFAF3 42%, #FFFFFF 78%)",
    border: "#F9EBD9",
    tile: "#FFE1C4",
    check: "#F97316",
    Icon: House,
    iconColor: "#F97316",
  },
  {
    title: "Education",
    desc: "Engage students from inquiry to enrollment.",
    href: "/solutions/education",
    bullets: [
      "Capture student inquiries",
      "Send automated updates",
      "Host info sessions and reminders",
      "Track enrollment pipeline",
    ],
    bg: "linear-gradient(140deg, #FFF0F6 0%, #FFF7FA 42%, #FFFFFF 78%)",
    border: "#FBE1EC",
    tile: "#FFD5E5",
    check: "#E8386B",
    Icon: GraduationCap,
    iconColor: "#EC4899",
  },
  {
    title: "Healthcare",
    desc: "Simplify communication and provide better patient experiences.",
    href: "/solutions/clinics-and-salons",
    bullets: [
      "Appointment reminders",
      "Patient follow-ups",
      "Share updates and notifications",
      "Improve patient engagement",
    ],
    bg: "linear-gradient(140deg, #EBF9F6 0%, #F4FBFA 42%, #FFFFFF 78%)",
    border: "#DAF0EC",
    tile: "#C6EBE4",
    check: "#10B981",
    Icon: HeartPulse,
    iconColor: "#0D9488",
  },
];

/* --------------------------------------------------------------- one card */

export function SolutionCard({ card }: { card: SolutionCardData }) {
  return (
    <article
      className="relative flex h-full flex-col overflow-hidden py-12.5 px-8 rounded-[30px] border-3 border-white transition-shadow duration-300"
      style={{ borderColor: card.border, background: card.bg }}
    >
      <span
        className="flex h-[58px] w-[58px] items-center justify-center rounded-[18px]"
        style={{ background: card.tile }}
      >
        <card.Icon
          size={28}
          strokeWidth={1.75}
          color={card.iconColor}
          aria-hidden
        />
      </span>

      <div className="flex w-full flex-1 flex-col">
        <h3 className="mt-6 text-[20px] font-extrabold" style={{ color: INK }}>
          {card.title}
        </h3>
        <p
          className="mt-1.5 text-[14.5px] font-medium leading-[1.5]"
          style={{ color: BODY }}
        >
          {card.desc}
        </p>

        <ul className="mt-6 grid gap-3.5">
          {card.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2">
              <Check color={card.check} />
              <span
                className="text-sm font-medium leading-[1.5]"
                style={{ color: ITEM }}
              >
                {b}
              </span>
            </li>
          ))}
        </ul>

        <CommonTextButton
          label="Learn More"
          href={card.href}
          size="md"
          color="text-text-primary"
          className="mt-auto pt-4.5"
        />
      </div>
    </article>
  );
}

/* ------------------------------------------------------------ the section */

export function SolutionsSection({
  eyebrow = "Solutions",
  headingLead = "Built for businesses",
  headingRest = "every size and industry",
  subheading = "No matter your industry, MarketFlow gives you the tools to attract, engage and retain customers - all from one powerful platform.",
  cards = SOLUTION_CARDS,
}: {
  eyebrow?: string;
  headingLead?: string;
  headingRest?: string;
  subheading?: string;
  cards?: SolutionCardData[];
}) {
  return (
    <section
      id="industries"
      aria-labelledby="industries-title"
      className="section-space-py font-sans bg-white"
    >
      <div className="custom-container">
        <header className="section-title-space mx-auto max-w-3xl text-center">
          <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-3.5 pl-3 text-text-secondary shadow-card">
            <LayoutGrid className="size-4 text-primary" aria-hidden />
            {eyebrow}
          </p>

          <h2 id="industries-title" className="section-title mt-5 text-balance">
            {headingLead} of{" "}
            <span className="brand-gradient-text">{headingRest}</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-[1.7] text-text-secondary text-pretty">
            {subheading}
          </p>
        </header>

        {/* card grid */}
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <SolutionCard key={c.title} card={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default SolutionsSection;
