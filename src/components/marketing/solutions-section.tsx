import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  CheckCircle2,
  GraduationCap,
  HeartPulse,
  LayoutGrid,
  Mail,
  MessageCircle,
  ShoppingBag,
  Store,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import { BrandIcon } from "@/components/ui/brand-icon";
import { ButtonLink } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

/**
 * The industry grid: who MarketFlow is for, one card per industry.
 *
 * Six cards, each tinted from the `tint-*` identity family the dashboard's own
 * tiles use — one hue per industry, so a reader scanning for their own
 * business finds it by colour before they read a title. The beds are the 50s
 * and the ink is the 700, the same pairing everywhere else in the product, so
 * this grid is six shades of the existing system rather than six new colours.
 *
 * Each card carries a small product still beside its copy: the order
 * confirmation an e-commerce merchant sends, the channel list an SMB manages,
 * the client roster an agency watches. They are illustrations, not screenshots
 * — `aria-hidden`, built from spans, with nothing in them that looks like a
 * control a reader could press.
 *
 * The still is hidden in the two-column range and shown either side of it. At
 * `md` the container gives each card about 300px of content, and a 145px still
 * beside a four-item checklist leaves the text wrapping every other word; at
 * `sm` the card has the full width and from `lg` it has half of a much wider
 * container, and in both the pair sits comfortably.
 *
 * "Learn more" points at the route the footer already advertises for that
 * industry. None of the six is built yet — the same arrangement the footer's
 * columns have had since before the pages behind them existed, and the links
 * are correct the day they land.
 */

type Tint = "lime" | "indigo" | "blue" | "orange" | "fuchsia" | "teal";

interface Industry {
  title: string;
  description: string;
  icon: LucideIcon;
  tint: Tint;
  points: string[];
  visual: VisualKind;
  href: string;
}

/**
 * Whole class strings per hue, not `bg-tint-${tint}-soft`. Tailwind reads the
 * source for literals, and an assembled class compiles to no colour at all.
 */
const TINTS: Record<Tint, { card: string; icon: string; check: string }> = {
  lime: {
    card: "bg-tint-lime-soft border-tint-lime-ink/15",
    icon: "bg-tint-lime-ink/10 text-tint-lime-ink",
    check: "text-tint-lime-ink",
  },
  indigo: {
    card: "bg-tint-indigo-soft border-tint-indigo-ink/15",
    icon: "bg-tint-indigo-ink/10 text-tint-indigo-ink",
    check: "text-tint-indigo-ink",
  },
  blue: {
    card: "bg-tint-blue-soft border-tint-blue-ink/15",
    icon: "bg-tint-blue-ink/10 text-tint-blue-ink",
    check: "text-tint-blue-ink",
  },
  orange: {
    card: "bg-tint-orange-soft border-tint-orange-ink/15",
    icon: "bg-tint-orange-ink/10 text-tint-orange-ink",
    check: "text-tint-orange-ink",
  },
  fuchsia: {
    card: "bg-tint-fuchsia-soft border-tint-fuchsia-ink/15",
    icon: "bg-tint-fuchsia-ink/10 text-tint-fuchsia-ink",
    check: "text-tint-fuchsia-ink",
  },
  teal: {
    card: "bg-tint-teal-soft border-tint-teal-ink/15",
    icon: "bg-tint-teal-ink/10 text-tint-teal-ink",
    check: "text-tint-teal-ink",
  },
};

const INDUSTRIES: Industry[] = [
  {
    title: "E-commerce",
    description:
      "Turn conversations into customers and grow your online store.",
    icon: ShoppingBag,
    tint: "lime",
    points: [
      "Recover abandoned carts",
      "Send order updates automatically",
      "Drive repeat purchases",
      "Sync with your store",
    ],
    visual: "order",
    href: "/solutions/ecommerce",
  },
  {
    title: "Small & Medium Business",
    description:
      "Grow your local business, engage customers and drive more sales.",
    icon: Store,
    tint: "indigo",
    points: [
      "Capture leads from multiple channels",
      "Automate follow-ups",
      "Manage customers in one place",
      "Save time and boost sales",
    ],
    visual: "channels",
    href: "/solutions/small-business",
  },
  {
    title: "Marketing Agencies",
    description: "Manage multiple clients and campaigns with ease.",
    icon: Users,
    tint: "blue",
    points: [
      "Handle multiple workspaces",
      "Create and manage campaigns",
      "Track performance for all clients",
      "Deliver real results",
    ],
    visual: "clients",
    href: "/solutions/agencies",
  },
  {
    title: "Real Estate",
    description:
      "Capture more inquiries, nurture leads and close deals faster.",
    icon: Building2,
    tint: "orange",
    points: [
      "Capture property inquiries",
      "Automate follow-ups",
      "Schedule property visits",
      "Manage leads and pipelines",
    ],
    visual: "property",
    href: "/solutions/real-estate",
  },
  {
    title: "Education",
    description: "Engage students from inquiry to enrollment.",
    icon: GraduationCap,
    tint: "fuchsia",
    points: [
      "Capture student inquiries",
      "Send automated updates",
      "Host info sessions and reminders",
      "Track enrollment pipeline",
    ],
    visual: "students",
    href: "/solutions/education",
  },
  {
    title: "Healthcare",
    description:
      "Simplify communication and provide better customer experiences.",
    icon: HeartPulse,
    tint: "teal",
    points: [
      "Appointment reminders",
      "Customer follow-ups",
      "Share updates and notifications",
      "Improve customer engagement",
    ],
    visual: "appointment",
    href: "/solutions/clinics-and-salons",
  },
];

/* -------------------------------------------------------------------------- */
/* The stills                                                                 */
/* -------------------------------------------------------------------------- */

type VisualKind =
  | "order"
  | "channels"
  | "clients"
  | "property"
  | "students"
  | "appointment";

/** The panel every still is built on: one white card, one shadow, one radius. */
function Still({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden
      className="w-37 rounded-card border border-border bg-surface p-3 shadow-card"
    >
      {children}
    </div>
  );
}

function SolutionVisual({ kind }: { kind: VisualKind }) {
  if (kind === "order") {
    return (
      <Still>
        <div className="mb-2 flex justify-center">
          <span className="grid size-11 place-items-center rounded-panel bg-tint-lime-soft">
            <BrandIcon name="shopify" className="size-6 text-[#5e8e3e]" />
          </span>
        </div>

        <span className="block h-14 rounded-panel bg-surface-secondary" />

        <p className="mt-2.5 text-center text-xs font-semibold text-text-primary">
          Order Confirmed
        </p>
        <p className="mt-1 text-center text-[9px] text-text-muted">
          Your order is on the way
        </p>

        <span className="mt-2.5 block rounded-full bg-tint-lime-ink py-1.5 text-center text-[9px] font-semibold text-white">
          View Order
        </span>
      </Still>
    );
  }

  if (kind === "channels") {
    const rows: { icon: LucideIcon | null; brand?: string; tone: string }[] = [
      { icon: UserRound, tone: "bg-surface-secondary text-text-muted" },
      { icon: null, brand: "whatsapp", tone: "bg-whatsapp-soft text-whatsapp" },
      { icon: Mail, tone: "bg-tint-blue-soft text-tint-blue-ink" },
      {
        icon: MessageCircle,
        tone: "bg-tint-indigo-soft text-tint-indigo-ink",
      },
    ];

    return (
      <Still>
        <div className="space-y-3 py-1">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full",
                  row.tone,
                )}
              >
                {row.brand ? (
                  <BrandIcon name={row.brand} className="size-4" />
                ) : row.icon ? (
                  <row.icon className="size-4" strokeWidth={2} />
                ) : null}
              </span>
              <span className="h-2 flex-1 rounded-full bg-surface-secondary" />
            </div>
          ))}
        </div>
      </Still>
    );
  }

  if (kind === "clients") {
    return (
      <Still>
        <p className="text-[10px] font-medium text-text-muted">Total Clients</p>

        <div className="mt-1 flex items-end justify-between">
          <span className="text-2xl font-bold text-text-primary">12</span>
          <span className="flex items-end gap-1">
            {[10, 16, 22, 28].map((height) => (
              <span
                key={height}
                className="w-1.5 rounded-t-sm bg-tint-blue-ink"
                style={{ height }}
              />
            ))}
          </span>
        </div>

        <p className="mt-1 text-[9px] font-semibold text-success">↑ 24%</p>

        <div className="mt-3 space-y-2">
          {["Client A", "Client B", "Client C"].map((client, index) => (
            <div
              key={client}
              className="flex items-center justify-between text-[9px] text-text-secondary"
            >
              <span className="flex items-center gap-1.5">
                <span className="grid size-5 place-items-center rounded-full bg-tint-blue-soft text-[8px] font-semibold text-tint-blue-ink">
                  {String.fromCharCode(65 + index)}
                </span>
                {client}
              </span>
              <span className="flex items-center gap-1 text-success">
                <span className="size-1 rounded-full bg-success" />
                Active
              </span>
            </div>
          ))}
        </div>
      </Still>
    );
  }

  if (kind === "property") {
    return (
      <Still>
        <span className="block h-18 rounded-panel bg-[linear-gradient(135deg,var(--color-surface-secondary),var(--color-tint-orange-soft))]" />

        <p className="mt-2 text-[11px] font-semibold text-text-primary">
          New Inquiry
        </p>
        <p className="mt-1 text-[9px] text-text-muted">
          Interested in this property.
        </p>

        <div className="mt-3 space-y-1.5">
          <span className="block h-2 rounded-full bg-surface-secondary" />
          <span className="block h-2 w-3/4 rounded-full bg-surface-secondary" />
        </div>
      </Still>
    );
  }

  if (kind === "students") {
    const rows = [
      ["S", "Sarah Khan", "Inquiry"],
      ["A", "Ahmed R.", "Interested"],
      ["F", "Fatima J.", "Enrolled"],
    ];

    return (
      <Still>
        <p className="text-[10px] font-semibold text-text-primary">
          New Application
        </p>

        <div className="mt-3 space-y-3">
          {rows.map(([initial, name, status]) => (
            <div key={name} className="flex items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-tint-fuchsia-soft text-[11px] font-semibold text-tint-fuchsia-ink">
                {initial}
              </span>

              <span className="block">
                <span className="block text-[9px] font-semibold text-text-primary">
                  {name}
                </span>
                <span className="block text-[8px] text-text-muted">
                  {status}
                </span>
              </span>
            </div>
          ))}
        </div>
      </Still>
    );
  }

  return (
    <Still>
      <span className="mx-auto grid size-10 place-items-center rounded-panel bg-tint-teal-soft">
        <CalendarCheck className="size-5 text-tint-teal-ink" />
      </span>

      <p className="mt-2.5 text-center text-[10px] font-semibold text-text-primary">
        Upcoming Appointment
      </p>
      <p className="mt-1 text-center text-[9px] text-text-muted">
        Tomorrow, 10:00 AM
      </p>

      <div className="mt-3 space-y-1.5 text-[9px]">
        <p className="flex items-center gap-1.5 text-text-secondary">
          <span className="size-1 rounded-full bg-success" />
          Reminder sent
        </p>
        <p className="flex items-center gap-1.5 text-text-secondary">
          <span className="size-1 rounded-full bg-success" />
          Customer confirmed
        </p>
        <p className="flex items-center gap-1.5 text-text-muted">
          <span className="size-1 rounded-full bg-border-strong" />
          Follow-up scheduled
        </p>
      </div>
    </Still>
  );
}

/* -------------------------------------------------------------------------- */
/* The section                                                                */
/* -------------------------------------------------------------------------- */

export function SolutionsSection() {
  return (
    <section
      id="industries"
      aria-labelledby="industries-title"
      className="section-space-py scroll-mt-32 bg-background"
    >
      <div className="custom-container">
        <header className="section-title-space mx-auto max-w-3xl text-center">
          <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-3.5 pl-3 text-text-secondary shadow-card">
            <LayoutGrid className="size-4 text-primary" aria-hidden />
            Solutions
          </p>

          <h2 id="industries-title" className="section-title mt-5 text-balance">
            Built for businesses of{" "}
            <span className="brand-gradient-text">
              every size and industry
            </span>
            .
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-[1.7] text-text-secondary text-pretty">
            No matter your industry, MarketFlow gives you the tools to attract,
            engage and retain customers — all from one powerful platform.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2 lg:gap-6">
          {INDUSTRIES.map((industry) => {
            const tint = TINTS[industry.tint];

            return (
              <article
                key={industry.title}
                className={cn(
                  "group rounded-card border p-6 transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-card-hover motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                  tint.card,
                )}
              >
                <span
                  className={cn(
                    "grid size-12 place-items-center rounded-panel",
                    tint.icon,
                  )}
                >
                  <industry.icon className="size-6" aria-hidden />
                </span>

                <div className="mt-5 flex items-start justify-between gap-5">
                  <div className="min-w-0">
                    <h3 className="text-xl leading-tight font-bold text-text-primary">
                      {industry.title}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      {industry.description}
                    </p>

                    <ul className="mt-5 space-y-2">
                      {industry.points.map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-2 text-sm text-text-secondary"
                        >
                          <CheckCircle2
                            className={cn("mt-0.5 size-4 shrink-0", tint.check)}
                            aria-hidden
                          />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={industry.href}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
                    >
                      Learn more
                      <ArrowRight
                        className="size-4 transition-[translate] duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                        aria-hidden
                      />
                    </Link>
                  </div>

                  {/* Hidden across the cramped two-column range — see the note
                      at the top of the file. */}
                  <div className="hidden shrink-0 sm:block md:hidden lg:block">
                    <SolutionVisual kind={industry.visual} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center">
          <ButtonLink href={APP_ROUTES.pricing} size="lg" className="group">
            Find the right solution for you
            <ArrowRight
              className="size-4 transition-[translate] group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
              aria-hidden
            />
          </ButtonLink>

          <p className="mt-4 text-sm text-text-muted">
            Different businesses. Same growth engine.
          </p>
        </div>
      </div>
    </section>
  );
}
