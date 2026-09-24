import type { ReactNode } from "react";
import { ArrowRight, Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * How it works - one customer, eight steps, from the campaign click to the
 * revenue line, with the module that owns each step.
 *
 * Four across from `lg`, two from `sm`, one column on a phone. The dashed
 * connector and its arrow run from every step to the one on its right - see
 * `CONNECTOR_VISIBILITY`. A phone's single column has no step to the right,
 * so it has no connectors.
 *
 * Colour is per step, and no two steps share one, so the row reads as a
 * progression rather than as three colours on repeat. Each step names its
 * `accent` and `ACCENTS` maps it to the badge, the circle and the icon ink;
 * the title, the description, the connectors and the arrows stay neutral.
 * Every accent is a design-system token - `secondary`, `success`, `email`,
 * `whatsapp-brand`, `tint-indigo`, `tint-orange`, `tint-cobalt` - except rose,
 * which has no ramp of its own and is written out here once.
 *
 * The icons are drawn duotone - a soft fill under the stroke - which Lucide
 * cannot do, so they are inline SVG. They take `currentColor`, so an accent's ink
 * is the only thing that paints them.
 */

/* -------------------------------------------------------------------------- */
/* Accents                                                                    */
/* -------------------------------------------------------------------------- */

type Accent =
  | "purple"
  | "green"
  | "blue"
  | "whatsapp"
  | "indigo"
  | "orange"
  | "rose"
  | "royalBlue";

interface AccentFaces {
  /** The main circle: a light tint of the accent. */
  soft: string;
  /** Icon ink inside the main circle. */
  ink: string;
  /** The filled number badge. */
  chip: string;
}

const ACCENTS: Record<Accent, AccentFaces> = {
  purple: {
    soft: "bg-secondary/12",
    ink: "text-secondary",
    chip: "bg-secondary",
  },
  green: { soft: "bg-success/12", ink: "text-success", chip: "bg-success" },
  blue: { soft: "bg-email/12", ink: "text-email", chip: "bg-email" },
  whatsapp: {
    soft: "bg-whatsapp-brand/14",
    ink: "text-whatsapp-brand",
    chip: "bg-whatsapp-brand",
  },
  indigo: {
    soft: "bg-tint-indigo-ink/12",
    ink: "text-tint-indigo-ink",
    chip: "bg-tint-indigo-ink",
  },
  orange: {
    soft: "bg-tint-orange-ink/12",
    ink: "text-tint-orange-ink",
    chip: "bg-tint-orange-ink",
  },
  rose: { soft: "bg-[#fde6ee]", ink: "text-[#ec4899]", chip: "bg-[#e11d48]" },
  royalBlue: {
    soft: "bg-tint-cobalt-soft",
    ink: "text-tint-cobalt-ink",
    chip: "bg-tint-cobalt-ink",
  },
};

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

interface IconProps {
  className?: string;
  strokeWidth?: number;
}

function Stroke({
  children,
  className,
  strokeWidth = 2,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

function MegaphoneIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path
        d="M3.5 9.5h3.5l8-5v15l-8-5H3.5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z"
        fill="currentColor"
        fillOpacity=".22"
      />
      <path d="M7 14.5l1.2 5a1.2 1.2 0 0 0 1.2.9h.6a1 1 0 0 0 1-1.2L10 14.8" />
      <path d="M18 9.5a3 3 0 0 1 0 5" />
    </Stroke>
  );
}

function CaptureIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path
        d="M3.5 13.5h4.5l1.5 2.5h5l1.5-2.5h4.5V19a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"
        fill="currentColor"
        fillOpacity=".22"
      />
      <path d="M12 3v9.5M8 9l4 4 4-4" />
    </Stroke>
  );
}

function PersonIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <circle cx="12" cy="7.5" r="4" fill="currentColor" fillOpacity=".18" />
      <path
        d="M4.5 20.5v-.8a5.5 5.5 0 0 1 5.5-5.5h4a5.5 5.5 0 0 1 5.5 5.5v.8a.8.8 0 0 1-.8.8H5.3a.8.8 0 0 1-.8-.8z"
        fill="currentColor"
        fillOpacity=".18"
      />
    </Stroke>
  );
}

function WhatsAppOutlineIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M3.5 20.5l1.3-4.2A8.7 8.7 0 1 1 8 19.3z" />
      <path
        d="M9.1 8.1c.2-.4.5-.5.8-.5h.5c.2 0 .4.1.5.4l.7 1.7c.1.2 0 .5-.1.7l-.5.6c-.1.2-.1.4 0 .5a6 6 0 0 0 2.6 2.4c.2.1.4.1.5-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.3.4.5v.5c0 .4-.2.8-.6 1-.7.4-1.6.5-2.4.2a9.6 9.6 0 0 1-5.3-5.1c-.3-.9-.2-1.9.1-2.8z"
        fill="currentColor"
        stroke="none"
      />
    </Stroke>
  );
}

function HierarchyIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <rect
        x="9"
        y="2.5"
        width="6"
        height="5"
        rx="1.2"
        fill="currentColor"
        fillOpacity=".22"
      />
      <rect
        x="2.5"
        y="16.5"
        width="6"
        height="5"
        rx="1.2"
        fill="currentColor"
        fillOpacity=".22"
      />
      <rect
        x="15.5"
        y="16.5"
        width="6"
        height="5"
        rx="1.2"
        fill="currentColor"
        fillOpacity=".22"
      />
      <path d="M12 7.5V12M5.5 16.5V12h13v4.5" />
    </Stroke>
  );
}

function CartIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path
        d="M6.2 6.5H21l-1.8 7.6a1.5 1.5 0 0 1-1.5 1.1H8.6"
        fill="currentColor"
        fillOpacity=".2"
      />
      <path d="M2 3h3l2.3 11.3a1.3 1.3 0 0 0 1.3 1h9.6" />
      <path d="M6.2 6.5H21l-1.8 7.6" />
      <circle cx="9.5" cy="19.5" r="1.5" />
      <circle cx="17.5" cy="19.5" r="1.5" />
    </Stroke>
  );
}

function DocumentIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M6.5 2h7.3L20 8.2V20a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
        fill="currentColor"
      />
      <path
        d="M13.8 2v4.7a1.5 1.5 0 0 0 1.5 1.5H20"
        className="fill-white"
        fillOpacity=".4"
      />
      <path
        d="M8 12.5h8M8 16.5h8"
        className="stroke-white"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BarsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <rect x="3" y="11" width="4.6" height="11" rx="2" fill="currentColor" />
      <rect
        x="9.7"
        y="2.5"
        width="4.6"
        height="19.5"
        rx="2"
        fill="currentColor"
      />
      <rect
        x="16.4"
        y="7"
        width="4.6"
        height="15"
        rx="2"
        fill="currentColor"
        fillOpacity=".55"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Steps                                                                      */
/* -------------------------------------------------------------------------- */

interface Step {
  title: string;
  description: string;
  module: string;
  accent: Accent;
  icon: ReactNode;
}

const STEP_ICON = "size-9";

const STEPS: Step[] = [
  {
    title: "A customer clicks your campaign",
    description: "They see your ad or message and click to learn more.",
    module: "Campaigns",
    accent: "purple",
    icon: <MegaphoneIcon className={STEP_ICON} />,
  },
  {
    title: "The lead is captured",
    description:
      "Their information is collected from forms, WhatsApp or other channels.",
    module: "Leads",
    accent: "green",
    icon: <CaptureIcon className={STEP_ICON} />,
  },
  {
    title: "A contact record is created",
    description:
      "The lead is added as a contact in your workspace with all details in one place.",
    module: "Contacts",
    accent: "blue",
    icon: <PersonIcon className={STEP_ICON} />,
  },
  {
    title: "A WhatsApp conversation opens",
    description:
      "You can chat with the customer directly from the unified WhatsApp inbox.",
    module: "WhatsApp Inbox",
    accent: "whatsapp",
    icon: <WhatsAppOutlineIcon className={STEP_ICON} />,
  },
  {
    title: "Automation sends the follow-up",
    description:
      "Workflows automatically send personalized messages via WhatsApp, Email, SMS or Social Media.",
    module: "Workflows",
    accent: "indigo",
    icon: <HierarchyIcon className={STEP_ICON} />,
  },
  {
    title: "They place an order",
    description:
      "The customer completes a purchase from your store or catalog.",
    module: "Orders",
    accent: "orange",
    icon: <CartIcon className={STEP_ICON} />,
  },
  {
    title: "A post-purchase message goes out",
    description:
      "A confirmation or follow-up message is sent using your saved templates.",
    module: "Templates",
    accent: "rose",
    icon: <DocumentIcon className={STEP_ICON} />,
  },
  {
    title: "Revenue is attributed to the campaign",
    description:
      "Track the full journey and see which campaigns drive real revenue.",
    module: "Analytics",
    accent: "royalBlue",
    icon: <BarsIcon className={STEP_ICON} />,
  },
];

/**
 * Where a step's connector shows, by its position in the row.
 *
 * A connector is drawn whenever the next step sits to the right, and never on
 * a row's last step. In two columns that is the left column (1st and 3rd of
 * every four); in four columns it is every step but the 4th. So the 1st and
 * 3rd show from `sm` on, the 2nd only once the row is four wide, and the 4th
 * never.
 */
const CONNECTOR_VISIBILITY = [
  "sm:block",
  "lg:block",
  "sm:block",
  null,
] as const;

function StepItem({ step, index }: { step: Step; index: number }) {
  const accent = ACCENTS[step.accent];
  const number = String(index + 1).padStart(2, "0");
  const connector = CONNECTOR_VISIBILITY[index % CONNECTOR_VISIBILITY.length];

  return (
    <li className="relative">
      {/* The icon cluster: the step number, sitting on the main circle's
          top-left edge. `z-1` keeps it above the circle it overlaps. */}
      <div aria-hidden className="relative h-25 w-38">
        <span
          className={cn(
            "absolute top-3.25 left-3.25 z-1 grid size-7.5 place-items-center rounded-full text-sm leading-none font-semibold text-white",
            accent.chip,
          )}
        >
          {number}
        </span>

        <span
          className={cn(
            "absolute top-3.5 left-7 grid size-21.5 place-items-center rounded-full",
            accent.soft,
            accent.ink,
          )}
        >
          {step.icon}
        </span>
      </div>

      {/* The connector to the next step: from the main circle's right edge to
          the far side of the gutter, at the circle's centre line. */}
      {connector ? (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-14.25 left-30.5 -right-8 hidden xl:-right-10",
            connector,
          )}
        >
          <span className="absolute inset-x-0 top-0 h-0.5 -translate-y-1/2 bg-[linear-gradient(to_right,var(--color-primary-border)_0_8px,transparent_8px_14px)] bg-size-[14px_2px] mask-[linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]" />
          <span className="absolute top-0 left-1/2 grid size-8.5 -translate-1/2 place-items-center rounded-full border-[1.5px] border-sms-border bg-primary-subtle text-secondary shadow-[0_0_0_4px_rgba(237,233,254,0.55)]">
            <ArrowRight className="size-4" strokeWidth={2.6} />
          </span>
        </div>
      ) : null}

      <div className="pl-6">
        <h3 className="mt-4 text-lg leading-snug font-bold tracking-tight text-text-primary text-balance">
          <span className="sr-only">Step {number}: </span>
          {step.title}
        </h3>
        <p className="mt-2 max-w-72 text-base leading-[1.5] text-text-secondary text-pretty">
          {step.description}
        </p>
      </div>
    </li>
  );
}

export function HowItWorks() {
  return (
    <section
      id="journey"
      aria-labelledby="how-it-works-title"
      className="section-space-py relative isolate scroll-mt-32 overflow-hidden bg-background"
    >
      {/* Three soft discs in the corners, as in the reference. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <span className="absolute -top-75 -left-65 size-155 rounded-full bg-primary-subtle/45" />
        <span className="absolute -right-65 -bottom-95 size-155 rounded-full bg-primary-subtle/45" />
      </div>

      <div className="custom-container">
        {/* Same header as `SolutionsSection` directly above it - pill, ramp,
            gradient phrase and subheading - so the two read as one page. */}
        <header className="section-title-space mx-auto max-w-3xl text-center">
          <Badge
            as="p"
            variant="primary-outline"
            size="lg"
            casing="none"
            icon={<Settings aria-hidden />}
          >
            How it works
          </Badge>

          <h2
            id="how-it-works-title"
            className="section-title mt-5 text-balance"
          >
            From first click to{" "}
            <span className="brand-gradient-text">real revenue</span>
          </h2>

          <p className="section-subtitle mx-auto max-w-2xl">
            See how a customer moves through MarketFlow - from a campaign click
            to a completed order and revenue tracked, all in one connected
            workflow.
          </p>
        </header>
      </div>

      {/* The steps get the wider container, so four columns have room for
          their titles without crowding the connectors between them. */}
      <div className="custom-container-wide">
        <ol className="grid gap-y-11 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:gap-y-12 xl:gap-x-12">
          {STEPS.map((step, index) => (
            <StepItem key={step.module} step={step} index={index} />
          ))}
        </ol>
      </div>
    </section>
  );
}
