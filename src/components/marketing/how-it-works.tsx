import type { ReactNode } from "react";
import { ArrowRight, Settings } from "lucide-react";

import { BrandIcon } from "@/components/ui/brand-icon";
import { cn } from "@/lib/utils";
import { SectionEyebrow } from "@/components/marketing/section-eyebrow";

/**
 * How it works - one customer, eight steps, from the campaign click to the
 * revenue line, with the module that owns each step.
 *
 * Four across from `lg`, two from `sm`, one column on a phone. The dashed
 * connector and its arrow run from every step to the one on its right - see
 * `CONNECTOR_VISIBILITY`. A phone's single column has no step to the right,
 * so it has no connectors.
 *
 * Colour is per step and carries the module's identity, not decoration: green
 * for the lead and the WhatsApp conversation, blue for records and analytics,
 * violet for campaigns and automation, orange for commerce, pink for
 * templates. Violet, blue and green are the design system's own `secondary`,
 * `email` and `whatsapp-brand`; orange and pink have no ramp of their own, so
 * their two faces are written out here once, in `TONES`.
 *
 * The icons are drawn duotone - a soft fill under the stroke - which Lucide
 * cannot do, so they are inline SVG. They take `currentColor`, so a tone's ink
 * is the only thing that paints them.
 */

/* -------------------------------------------------------------------------- */
/* Tones                                                                      */
/* -------------------------------------------------------------------------- */

type Tone = "violet" | "green" | "blue" | "orange" | "pink";

interface ToneFaces {
  /** The main circle and the module tag's ground. */
  soft: string;
  /** Icon ink inside the main circle. */
  ink: string;
  /** The filled number chip. */
  chip: string;
  /** The module tag's label. */
  tag: string;
}

const TONES: Record<Tone, ToneFaces> = {
  violet: {
    soft: "bg-secondary/12",
    ink: "text-secondary",
    chip: "bg-secondary",
    tag: "text-secondary-dark",
  },
  green: {
    soft: "bg-whatsapp-brand/14",
    ink: "text-whatsapp-brand",
    chip: "bg-whatsapp-brand",
    tag: "text-whatsapp-dark",
  },
  blue: {
    soft: "bg-email/12",
    ink: "text-email",
    chip: "bg-email",
    tag: "text-email-dark",
  },
  orange: {
    soft: "bg-[#fef0e1]",
    ink: "text-[#f59e0b]",
    chip: "bg-[#f59e0b]",
    tag: "text-tint-orange-ink",
  },
  pink: {
    soft: "bg-[#fde6ee]",
    ink: "text-[#ec4899]",
    chip: "bg-[#e11d48]",
    tag: "text-[#e11d48]",
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

function ChatIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path d="M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5v-3.5H5A1.5 1.5 0 0 1 3.5 15V6A1.5 1.5 0 0 1 5 4.5z" />
      <path d="M8 9.5h8M8 12.5h5" />
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
      <rect x="9" y="2.5" width="6" height="5" rx="1.2" fill="currentColor" fillOpacity=".22" />
      <rect x="2.5" y="16.5" width="6" height="5" rx="1.2" fill="currentColor" fillOpacity=".22" />
      <rect x="15.5" y="16.5" width="6" height="5" rx="1.2" fill="currentColor" fillOpacity=".22" />
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

function BoltIcon(props: IconProps) {
  return (
    <Stroke {...props}>
      <path
        d="M13.5 2L4.5 13.5h7L10.5 22l9-11.5h-7L13.5 2z"
        fill="currentColor"
        fillOpacity=".22"
      />
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
      <path d="M13.8 2v4.7a1.5 1.5 0 0 0 1.5 1.5H20" fill="#fff" fillOpacity=".4" />
      <path d="M8 12.5h8M8 16.5h8" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function BarsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <rect x="3" y="11" width="4.6" height="11" rx="2" fill="currentColor" />
      <rect x="9.7" y="2.5" width="4.6" height="19.5" rx="2" fill="currentColor" />
      <rect x="16.4" y="7" width="4.6" height="15" rx="2" fill="currentColor" fillOpacity=".55" />
    </svg>
  );
}

function BoxIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path d="M12 2l9 4.6v10.8L12 22l-9-4.6V6.6L12 2z" fill="currentColor" />
      <path d="M3 6.6L12 11l9-4.4M12 11v11M7.5 4.3l9 4.5v3" stroke="#fff" strokeOpacity=".75" strokeWidth="1.3" fill="none" />
    </svg>
  );
}

/** The small filled square some module tags carry their icon on. */
function TagTile({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "grid size-6 place-items-center rounded-[7px] text-white",
        TONES[tone].chip,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Steps                                                                      */
/* -------------------------------------------------------------------------- */

interface Step {
  title: string;
  description: string;
  module: string;
  tone: Tone;
  icon: ReactNode;
  tagIcon: ReactNode;
}

const STEP_ICON = "size-10.5";

const STEPS: Step[] = [
  {
    title: "A customer clicks your campaign",
    description: "They see your ad or message and click to learn more.",
    module: "Campaigns",
    tone: "violet",
    icon: <MegaphoneIcon className={STEP_ICON} />,
    tagIcon: <MegaphoneIcon className="size-5.5 text-secondary" />,
  },
  {
    title: "The lead is captured",
    description:
      "Their information is collected from forms, WhatsApp or other channels.",
    module: "Leads",
    tone: "green",
    icon: <CaptureIcon className={STEP_ICON} />,
    tagIcon: (
      <TagTile tone="green">
        <CaptureIcon className="size-3.75" strokeWidth={2.6} />
      </TagTile>
    ),
  },
  {
    title: "A contact record is created",
    description:
      "The lead is added as a contact in your workspace with all details in one place.",
    module: "Contacts",
    tone: "blue",
    icon: <PersonIcon className={STEP_ICON} />,
    tagIcon: (
      <TagTile tone="blue">
        <ChatIcon className="size-3.75" strokeWidth={2.4} />
      </TagTile>
    ),
  },
  {
    title: "A WhatsApp conversation opens",
    description:
      "You can chat with the customer directly from the unified WhatsApp inbox.",
    module: "WhatsApp Inbox",
    tone: "green",
    icon: <WhatsAppOutlineIcon className={STEP_ICON} />,
    tagIcon: (
      <TagTile tone="green">
        <BrandIcon name="whatsapp" className="size-4" />
      </TagTile>
    ),
  },
  {
    title: "Automation sends the follow-up",
    description:
      "Workflows automatically send personalized messages via WhatsApp, Email, SMS or Social Media.",
    module: "Workflows",
    tone: "violet",
    icon: <HierarchyIcon className={STEP_ICON} />,
    tagIcon: <BoltIcon className="size-5.5 text-secondary" />,
  },
  {
    title: "They place an order",
    description:
      "The customer completes a purchase from your store or catalog.",
    module: "Orders",
    tone: "orange",
    icon: <CartIcon className={STEP_ICON} />,
    tagIcon: <BoxIcon className="size-6 text-[#f59e0b]" />,
  },
  {
    title: "A post-purchase message goes out",
    description:
      "A confirmation or follow-up message is sent using your saved templates.",
    module: "Templates",
    tone: "pink",
    icon: <DocumentIcon className={STEP_ICON} />,
    tagIcon: <DocumentIcon className="size-5.5 text-[#ec4899]" />,
  },
  {
    title: "Revenue is attributed to the campaign",
    description:
      "Track the full journey and see which campaigns drive real revenue.",
    module: "Analytics",
    tone: "blue",
    icon: <BarsIcon className={STEP_ICON} />,
    tagIcon: <BarsIcon className="size-5.5 text-email" />,
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
const CONNECTOR_VISIBILITY = ["sm:block", "lg:block", "sm:block", null] as const;

function StepItem({ step, index }: { step: Step; index: number }) {
  const tone = TONES[step.tone];
  const number = String(index + 1).padStart(2, "0");
  const connector = CONNECTOR_VISIBILITY[index % CONNECTOR_VISIBILITY.length];

  return (
    <li className="relative">
      {/* The icon cluster: the step number, sitting on the main circle's
          top-left edge. `z-1` keeps it above the circle it overlaps. */}
      <div aria-hidden className="relative h-27 w-38">
        <span
          className={cn(
            "absolute top-3.25 left-3.25 z-1 grid size-7.5 place-items-center rounded-full text-sm leading-none font-semibold text-white",
            tone.chip,
          )}
        >
          {number}
        </span>

        <span
          className={cn(
            "absolute top-3.5 left-7 grid size-24 place-items-center rounded-full",
            tone.soft,
            tone.ink,
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
            "pointer-events-none absolute top-15.5 left-33 -right-8 hidden xl:-right-10",
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
        <h3 className="mt-3 text-lg leading-snug font-bold tracking-tight text-text-primary text-balance">
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
        <span className="absolute -top-82 -right-45 size-160 rounded-full bg-primary-subtle/45" />
        <span className="absolute -right-65 -bottom-95 size-155 rounded-full bg-primary-subtle/45" />
      </div>

      <div className="custom-container">
        {/* Same header as `SolutionsSection` directly above it - pill, ramp,
            gradient phrase and subheading - so the two read as one page. */}
        <header className="section-title-space mx-auto max-w-3xl text-center">
          <SectionEyebrow icon={Settings}>How it works</SectionEyebrow>

          <h2 id="how-it-works-title" className="section-title mt-5 text-balance">
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
