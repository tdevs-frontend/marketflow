import type { ReactNode } from "react";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";

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
  icon: ReactNode;
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
    icon: (
      <svg viewBox="0 0 24 24" width="27" height="27" fill="#16A34A">
        <path d="M6.2 7h11.6a2 2 0 0 1 2 1.8l.9 9.4A2.4 2.4 0 0 1 18.3 21H5.7a2.4 2.4 0 0 1-2.4-2.8l.9-9.4A2 2 0 0 1 6.2 7Z" />
        <path
          d="M8.6 8.4V6.6a3.4 3.4 0 0 1 6.8 0v1.8"
          fill="none"
          stroke="#16A34A"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
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
    icon: (
      <svg viewBox="0 0 24 24" width="27" height="27" fill={VIOLET}>
        <path d="M3.4 4.2h17.2a1 1 0 0 1 .95 1.3l-.8 2.6a1 1 0 0 1-.96.7H4.2a1 1 0 0 1-.96-.7l-.8-2.6a1 1 0 0 1 .96-1.3Z" />
        <path d="M4.6 10.2h14.8v8.6a1.2 1.2 0 0 1-1.2 1.2H5.8a1.2 1.2 0 0 1-1.2-1.2v-8.6Z" />
        <rect x="8.2" y="13" width="7.6" height="4.4" rx="1" fill="#fff" />
      </svg>
    ),
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
    icon: (
      <svg viewBox="0 0 24 24" width="27" height="27" fill="#2F80ED">
        <circle cx="9" cy="8" r="3.6" />
        <circle cx="16.8" cy="9.2" r="2.8" />
        <path d="M2.6 19.4c0-3.4 2.9-5.6 6.4-5.6s6.4 2.2 6.4 5.6a.8.8 0 0 1-.8.8H3.4a.8.8 0 0 1-.8-.8Z" />
        <path d="M16.6 14c2.8.15 4.8 1.9 4.8 4.5a.8.8 0 0 1-.8.7h-3.3c.1-2-.4-3.7-1.4-5 .2-.1.4-.2.7-.2Z" />
      </svg>
    ),
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
    icon: (
      <svg viewBox="0 0 24 24" width="27" height="27" fill="#F97316">
        <path d="M11.3 2.9a1.1 1.1 0 0 1 1.4 0l8.6 7.2c.5.4.2 1.2-.45 1.2H19v8a1.4 1.4 0 0 1-1.4 1.4h-3.1v-5.2h-3v5.2H8.4A1.4 1.4 0 0 1 7 19.3v-8H4.15c-.65 0-.95-.8-.45-1.2l8.6-7.2Z" />
      </svg>
    ),
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
    icon: (
      <svg viewBox="0 0 24 24" width="27" height="27" fill="#EC4899">
        <path d="M11.5 3.2a1.2 1.2 0 0 1 1 0l8.2 3.9c.6.3.6 1.2 0 1.5l-8.2 3.9a1.2 1.2 0 0 1-1 0L3.3 8.6c-.6-.3-.6-1.2 0-1.5l8.2-3.9Z" />
        <path d="M6 11.4l5.5 2.6c.32.15.68.15 1 0L18 11.4v4.3c0 2-2.7 3.5-6 3.5s-6-1.5-6-3.5v-4.3Z" />
        <path
          d="M20.4 10.2v5.2"
          stroke="#EC4899"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
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
    icon: (
      <svg viewBox="0 0 24 24" width="27" height="27" fill="#0D9488">
        <path d="M9.8 2.6h4.4c.66 0 1.2.54 1.2 1.2v4.6h4.6c.66 0 1.2.54 1.2 1.2v4.4c0 .66-.54 1.2-1.2 1.2h-4.6v4.6c0 .66-.54 1.2-1.2 1.2H9.8c-.66 0-1.2-.54-1.2-1.2v-4.6H4c-.66 0-1.2-.54-1.2-1.2V9.6c0-.66.54-1.2 1.2-1.2h4.6V3.8c0-.66.54-1.2 1.2-1.2Z" />
      </svg>
    ),
  },
];

/* --------------------------------------------------------------- one card */

function ArrowIcon({ size = 15 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform duration-200 group-hover:translate-x-[3px] motion-reduce:transition-none"
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

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
        {card.icon}
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

        <Link
          href={card.href}
          className="group mt-auto inline-flex items-center gap-1.5 self-start rounded-sm pt-4.5 text-base font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#6D3EF0] focus-visible:ring-offset-2"
          style={{ color: VIOLET }}
        >
          Learn More
          <ArrowIcon />
        </Link>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------ the section */

export function SolutionsSection({
  eyebrow = "Solutions",
  headingLead = "Built for businesses",
  headingRest = "every size and industry",
  subheading = "No matter your industry, MarketFlow gives you the tools to attract, engage and retain customers — all from one powerful platform.",
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
      className="section-space-py font-sans bg-[#F6F6F6]"
    >
      <div className="custom-container">
        <header className="section-title-space mx-auto max-w-3xl text-center">
          <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-3.5 pl-3 text-text-secondary shadow-card">
            <LayoutGrid className="size-4 text-primary" aria-hidden />
            {eyebrow}
          </p>

          <h2 id="industries-title" className="section-title mt-5 text-balance">
            {headingLead} of{" "}
            <span className="brand-gradient-text">{headingRest}</span>.
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
