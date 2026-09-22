/**
 * SolutionsSection.jsx
 * ---------------------------------------------------------------------------
 * Standalone React + Tailwind CSS component (pixel-faithful rebuild).
 *
 * Requirements
 *  1. Tailwind CSS v3 (arbitrary values like text-[13.5px] are used).
 *  2. Font "Plus Jakarta Sans" (closest free match to the original geometric
 *     sans). Add to index.html:
 *       <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
 *     and to tailwind.config.js:
 *       theme: { extend: { fontFamily: { sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'] } } }
 *  3. No other dependencies — all icons/illustrations are inline SVG.
 *
 * Usage:  import SolutionsSection from "./SolutionsSection";
 *         <SolutionsSection />
 *
 * Note: the sneaker + house illustrations are hand-drawn SVG placeholders.
 * Swap <Sneaker /> and <HousePhoto /> for real <img> tags in production.
 * ---------------------------------------------------------------------------
 */

import type { CSSProperties, ComponentType, ReactNode } from "react";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";

/* ------------------------------------------------------------------ tokens */

const INK = "#0F1626";
const BODY = "#667085";
const ITEM = "#344054";
const VIOLET = "#6D3EF0";
const FAINT = "#98A2B3";

const PANEL_SHADOW =
  "0 10px 26px -8px rgba(16,24,40,0.16), 0 2px 6px -2px rgba(16,24,40,0.06)";

/* -------------------------------------------------------------- primitives */

function Panel({
  className = "",
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative rounded-[14px] bg-white ring-1 ring-black/[0.045] ${className}`}
      style={{ boxShadow: PANEL_SHADOW, ...style }}
    >
      {children}
    </div>
  );
}

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

function Bars({
  widths = ["72%", "46%"],
  h = 5,
  gap = 4,
}: {
  widths?: string[];
  h?: number;
  gap?: number;
}) {
  return (
    <div className="flex-1" style={{ display: "grid", rowGap: gap }}>
      {widths.map((w, i) => (
        <span
          key={i}
          className="block rounded-full bg-[#EDF0F4]"
          style={{ width: w, height: h }}
        />
      ))}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-2">
      <span className="h-[15px] w-[15px] shrink-0 rounded-full bg-[#EDF0F4]" />
      <Bars />
    </div>
  );
}

function StatusDot({ color }: { color: string }) {
  return (
    <span
      className="mr-1 inline-block h-[4px] w-[4px] rounded-full align-middle"
      style={{ background: color }}
    />
  );
}

/* ------------------------------------------------------------- brand marks */

function WhatsApp({ size = 36 }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "#25D366",
        boxShadow: "0 6px 16px -4px rgba(37,211,102,.55)",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.58}
        height={size * 0.58}
        fill="#fff"
      >
        <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.94.53 3.75 1.46 5.3L2 22l4.98-1.6a9.84 9.84 0 0 0 5.06 1.4c5.44 0 9.84-4.4 9.84-9.84S17.48 2 12.04 2Zm5.7 13.9c-.24.68-1.4 1.3-1.93 1.35-.5.05-1.1.07-3.03-.83-2.3-1.07-3.72-3.5-3.83-3.66-.11-.16-.9-1.25-.9-2.38 0-1.13.6-1.69.81-1.92.21-.23.46-.29.62-.29h.44c.14 0 .33-.05.5.39.19.47.64 1.63.7 1.75.06.12.1.26.02.42-.08.16-.15.26-.29.41-.14.15-.3.33-.43.45-.14.13-.29.27-.13.54.16.27.7 1.17 1.5 1.9 1.04.94 1.45 1.1 1.72 1.22.27.12.43.1.59-.06.16-.16.66-.77.84-1.03.18-.27.35-.22.59-.13.24.09 1.5.71 1.76.84.26.13.43.19.5.3.06.12.06.68-.18 1.36Z" />
      </svg>
    </span>
  );
}

function MailBadge({ size = 36 }) {
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        background: "#2F80ED",
        boxShadow: "0 6px 16px -4px rgba(47,128,237,.55)",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.55}
        height={size * 0.55}
        fill="none"
        stroke="#fff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    </span>
  );
}

function ChatBadge({ size = 34 }) {
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.34,
        background: "#3B82F6",
        boxShadow: "0 6px 16px -4px rgba(59,130,246,.5)",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.56}
        height={size * 0.56}
        fill="#fff"
      >
        <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      </svg>
    </span>
  );
}

function ShopifyMark() {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[12px] bg-white"
      style={{
        width: 40,
        height: 40,
        boxShadow: "0 8px 20px -6px rgba(16,24,40,.28)",
      }}
    >
      <svg viewBox="0 0 40 46" width="21" height="24">
        <path
          d="M31.6 9.6c0-.3-.3-.5-.5-.5-.2 0-4.2-.3-4.2-.3s-2.8-2.8-3.1-3.1c-.3-.3-.9-.2-1.1-.1 0 0-.6.2-1.5.5-.9-2.6-2.5-3.9-4.6-3.9-2.6 0-4.7 2.7-5.6 6.4-1.2.4-2.1.7-2.2.7-1.2.4-1.2.4-1.4 1.6C7.3 12 4 37.4 4 37.4L29.3 42l6.3-1.6s-4-30.5-4-30.8ZM20.8 6.7c-.7.2-1.5.5-2.3.7.6-2.4 1.8-3.6 2.8-4 .3.8.4 1.9-.5 3.3Zm-2.1-4.1c.2 0 .4.1.6.2-1.4.7-2.9 2.3-3.5 5.6-1.2.4-2.4.7-3.5 1.1.7-2.5 2.5-6.9 6.4-6.9Zm-2.1 17.5c.2 2.4 6.4 2.9 6.7 8.4.3 4.3-2.3 7.3-6 7.5-4.5.3-6.9-2.4-6.9-2.4l1-4.1s2.5 1.9 4.5 1.7c1.3-.1 1.8-1.1 1.7-1.9-.2-2.4-5.2-2.3-5.5-7.3-.3-4.2 2.5-8.5 8.7-8.9 2.4-.2 3.6.5 3.6.5l-1.4 5.3s-1.6-.7-3.5-.6c-2.7.2-2.9 1.6-2.8 2.4l-.1-.6Z"
          fill="#95BF47"
        />
        <path
          d="M31.1 9.1c-.2 0-4.2-.3-4.2-.3s-2.8-2.8-3.1-3.1a.8.8 0 0 0-.4-.2V42l12.2-3s-4-30.5-4-30.8c0-.3-.3-.5-.5-.5Z"
          fill="#5E8E3E"
        />
      </svg>
    </span>
  );
}

/* -------------------------------------------------------- illustrations */

function Sneaker() {
  return (
    <svg viewBox="0 0 150 76" className="w-[82px]">
      <path
        d="M14 50c0-6.5 5.4-10.3 12.6-14L44 27c5-2.6 8.4-7 11.6-11.2 2.6-3.4 7.4-3.7 10.4-.8l6.6 6.3c3.7 3.5 8.6 5.4 13.7 5.4h20.9c15.2 0 26.3 8.4 27.6 19.1l.3 4.2H14Z"
        fill="#1F2937"
      />
      <path
        d="M44 27c3.6 2.6 7.3 4.8 11.3 6.6M56 18.7c3.4 3 7 5.5 11 7.4"
        stroke="#4B5563"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M10 50h130c5.5 0 8.9 3.6 8.4 7.6-.4 3.4-3.4 5.9-6.9 5.9H17c-4.4 0-7-2.8-7-7.1V50Z"
        fill="#F9FAFB"
        stroke="#E4E7EC"
        strokeWidth="1.2"
      />
      <path d="M120 50v13" stroke="#E4E7EC" strokeWidth="1.2" />
    </svg>
  );
}

function HousePhoto() {
  return (
    <svg
      viewBox="0 0 160 86"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="mf-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BCD9F2" />
          <stop offset="100%" stopColor="#EAF3FB" />
        </linearGradient>
        <linearGradient id="mf-wall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7F8EA3" />
          <stop offset="100%" stopColor="#60708A" />
        </linearGradient>
      </defs>
      <rect width="160" height="86" fill="url(#mf-sky)" />
      <circle cx="132" cy="16" r="26" fill="#fff" opacity=".35" />
      <rect y="66" width="160" height="20" fill="#9CB68A" />
      <rect y="66" width="160" height="4" fill="#87A276" />
      <path d="M34 34l30-18 30 18v34H34z" fill="url(#mf-wall)" />
      <path d="M30 35L64 14l34 21-2.5 4.2L64 19.6 32.5 39.2z" fill="#2E3A49" />
      <rect x="41" y="40" width="11" height="10" rx="1.4" fill="#E9F2FA" />
      <rect x="58.5" y="40" width="11" height="10" rx="1.4" fill="#E9F2FA" />
      <rect x="76" y="40" width="11" height="10" rx="1.4" fill="#E9F2FA" />
      <rect x="41" y="56" width="11" height="12" rx="1.4" fill="#D8E6F2" />
      <rect x="58" y="54" width="12" height="14" rx="1.6" fill="#3B4757" />
      <rect x="76" y="56" width="11" height="12" rx="1.4" fill="#D8E6F2" />
      <path d="M96 44h30v24H96z" fill="#6E7D93" />
      <path d="M94 45l16-10 18 10-1.6 3.4L110 39l-14.4 9.4z" fill="#2E3A49" />
      <rect x="103" y="52" width="17" height="16" rx="1.4" fill="#CBD8E5" />
      <path d="M58 68h14l6 18H52z" fill="#D9D3C6" />
      <circle cx="26" cy="64" r="8" fill="#6F9160" />
      <rect x="24.6" y="64" width="2.8" height="7" fill="#7A6A52" />
      <circle cx="138" cy="62" r="7" fill="#6F9160" />
      <rect x="136.8" y="62" width="2.4" height="7" fill="#7A6A52" />
    </svg>
  );
}

/* ------------------------------------------------------- card side panels */

function EcommerceVisual() {
  return (
    <Panel className="px-[11px] pb-[11px] pt-[15px]">
      <div className="absolute -top-[19px] left-1/2 -translate-x-1/2">
        <ShopifyMark />
      </div>
      <div className="flex h-[78px] items-center justify-center rounded-[10px] bg-[#F2F4F7]">
        <Sneaker />
      </div>
      <p
        className="mt-[9px] text-center text-[11.5px] font-bold tracking-[-0.01em]"
        style={{ color: INK }}
      >
        Order Confirmed
      </p>
      <p
        className="mt-[2px] text-center text-[8.5px] font-medium"
        style={{ color: FAINT }}
      >
        Your order is on the way!
      </p>
      <div
        className="mt-[10px] flex h-[24px] items-center justify-center rounded-[7px] text-[9.5px] font-semibold text-white"
        style={{ background: "#22A45D" }}
      >
        View Order
      </div>
    </Panel>
  );
}

function SmbVisual() {
  return (
    <Panel className="h-[208px] overflow-hidden px-[13px] py-[14px]">
      <div className="grid gap-[15px]">
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
      <div className="absolute left-[24px] top-[22px]">
        <WhatsApp size={37} />
      </div>
      <div className="absolute left-[78px] top-[53px]">
        <MailBadge size={37} />
      </div>
      <div className="absolute left-[60px] top-[98px]">
        <ChatBadge size={37} />
      </div>
    </Panel>
  );
}

function AgencyVisual() {
  const clients = [
    { letter: "A", name: "Client A", color: "#3B82F6" },
    { letter: "B", name: "Client B", color: "#8B5CF6" },
    { letter: "C", name: "Client C", color: "#F59E0B" },
  ];
  const bars = [
    { h: 9, c: "#BBD4FB" },
    { h: 13, c: "#A6C8FA" },
    { h: 18, c: "#78ACF7" },
    { h: 23, c: "#5093F4" },
    { h: 28, c: "#2F80ED" },
  ];

  return (
    <Panel className="px-[13px] py-[13px]">
      <p className="text-[9px] font-semibold" style={{ color: BODY }}>
        Total Clients
      </p>
      <div className="mt-[3px] flex items-end justify-between">
        <div>
          <p
            className="text-[23px] font-extrabold leading-none tracking-[-0.03em]"
            style={{ color: INK }}
          >
            12
          </p>
          <p
            className="mt-[5px] text-[8px] font-semibold"
            style={{ color: "#2F80ED" }}
          >
            ↑ 24%
          </p>
        </div>
        <div className="flex items-end gap-[3px] pb-[2px]">
          {bars.map((b, i) => (
            <span
              key={i}
              className="block w-[5px] rounded-[2px]"
              style={{ height: b.h, background: b.c }}
            />
          ))}
        </div>
      </div>
      <div className="mt-[11px] grid gap-[9px]">
        {clients.map((c) => (
          <div key={c.letter} className="flex items-center">
            <span
              className="flex h-[17px] w-[17px] items-center justify-center rounded-full text-[8px] font-bold text-white"
              style={{ background: c.color }}
            >
              {c.letter}
            </span>
            <span
              className="ml-[6px] text-[9px] font-semibold"
              style={{ color: ITEM }}
            >
              {c.name}
            </span>
            <span
              className="ml-auto text-[8px] font-medium"
              style={{ color: "#12B76A" }}
            >
              <StatusDot color="#12B76A" />
              Active
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RealEstateVisual() {
  return (
    <Panel className="px-[11px] pb-[13px] pt-[11px]">
      <div className="relative h-[74px] overflow-hidden rounded-[10px]">
        <HousePhoto />
      </div>
      <div className="absolute right-[4px] top-[62px]">
        <WhatsApp size={25} />
      </div>
      <p
        className="mt-[10px] text-[10px] font-bold tracking-[-0.01em]"
        style={{ color: INK }}
      >
        New Inquiry
      </p>
      <p className="mt-[2px] text-[8px] font-medium" style={{ color: FAINT }}>
        Interested in this property.
      </p>
      <div className="mt-[12px] grid gap-[11px]">
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </Panel>
  );
}

function EducationVisual() {
  const people = [
    {
      letter: "S",
      name: "Sarah Khan",
      status: "Inquiry",
      avatar: "#D0D5DD",
      dot: "#2F80ED",
    },
    {
      letter: "A",
      name: "Ahmed R.",
      status: "Interested",
      avatar: "#F0A93B",
      dot: "#F0A93B",
    },
    {
      letter: "B",
      name: "Fatima J.",
      status: "Enrolled",
      avatar: "#3B82F6",
      dot: "#12B76A",
    },
  ];

  return (
    <Panel className="px-[13px] py-[13px]">
      <p
        className="text-[10px] font-bold tracking-[-0.01em]"
        style={{ color: INK }}
      >
        New Application
      </p>
      <div className="mt-[11px] grid gap-[11px]">
        {people.map((p) => (
          <div key={p.letter} className="flex items-center gap-[7px]">
            <span
              className="flex h-[21px] w-[21px] items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: p.avatar }}
            >
              {p.letter}
            </span>
            <span>
              <span
                className="block text-[9px] font-semibold leading-[1.25]"
                style={{ color: INK }}
              >
                {p.name}
              </span>
              <span
                className="block text-[8px] font-medium leading-[1.4]"
                style={{ color: BODY }}
              >
                <StatusDot color={p.dot} />
                {p.status}
              </span>
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function HealthcareVisual() {
  const steps = [
    { label: "Reminder Sent", done: true },
    { label: "Patient Confirmed", done: true },
    { label: "Follow-up Scheduled", done: false },
  ];

  return (
    <Panel className="px-[13px] py-[13px]">
      <span
        className="mx-auto flex h-[34px] w-[34px] items-center justify-center rounded-[11px]"
        style={{ background: "#EFEAFF" }}
      >
        <svg
          viewBox="0 0 24 24"
          width="19"
          height="19"
          fill="none"
          stroke={VIOLET}
          strokeWidth="2"
          strokeLinecap="round"
        >
          <rect x="3" y="4.5" width="18" height="16" rx="3" />
          <path d="M3 9.5h18M8 3v3M16 3v3" />
          <path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2" />
        </svg>
      </span>
      <p
        className="mt-[9px] text-center text-[9.5px] font-bold tracking-[-0.01em]"
        style={{ color: INK }}
      >
        Upcoming Appointment
      </p>
      <p
        className="mt-[2px] text-center text-[8px] font-medium"
        style={{ color: FAINT }}
      >
        10:00 AM, 12 Sep 2026
      </p>
      <div className="mt-[13px] grid gap-[10px]">
        {steps.map((s) => (
          <div key={s.label} className="flex items-center gap-[7px]">
            {s.done ? (
              <Check color="#12B76A" size={15} />
            ) : (
              <span className="h-[15px] w-[15px] shrink-0 rounded-full bg-[#EDF0F4] ring-1 ring-inset ring-[#E4E7EC]" />
            )}
            <span
              className="text-[8.5px] font-semibold"
              style={{ color: s.done ? ITEM : FAINT }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------- card data */

/**
 * One industry card.
 *
 * The colours stay literal hex here rather than becoming `tint-*` tokens:
 * each card is a three-stop gradient bed with its own border and tile, which
 * the two-value tint family cannot express. `Visual` is the still that sits
 * beside the copy — a component, so a card carries its own illustration
 * instead of the grid switching on a name.
 */
export interface SolutionCardData {
  title: string;
  desc: string;
  href: string;
  bullets: string[];
  bg: string;
  border: string;
  tile: string;
  check: string;
  Visual: ComponentType;
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
    Visual: EcommerceVisual,
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
    Visual: SmbVisual,
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
    Visual: AgencyVisual,
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
    Visual: RealEstateVisual,
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
    Visual: EducationVisual,
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
    Visual: HealthcareVisual,
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
  const { Visual } = card;

  return (
    <article
      className="relative overflow-hidden py-12.5 px-7.5 rounded-[30px] border-3 border-white shadow-[0px_1px_2px_0px_rgba(10,28,58,0.1)] transition-shadow duration-300 hover:shadow-[0_18px_44px_-24px_rgba(16,24,40,0.22)]"
      style={{ borderColor: card.border, background: card.bg }}
    >
      <span
        className="flex h-[58px] w-[58px] items-center justify-center rounded-[18px]"
        style={{ background: card.tile }}
      >
        {card.icon}
      </span>

      <div className="md:max-w-[263px]">
        <h3
          className="mt-[17px] text-[20px] font-extrabold tracking-[-0.025em]"
          style={{ color: INK }}
        >
          {card.title}
        </h3>
        <p
          className="mt-[6px] text-[14.5px] font-medium leading-[1.5]"
          style={{ color: BODY }}
        >
          {card.desc}
        </p>

        <ul className="mt-[17px] grid gap-[9px]">
          {card.bullets.map((b) => (
            <li key={b} className="flex items-start gap-[9px]">
              <Check color={card.check} />
              <span
                className="text-[13.5px] font-medium leading-[1.35]"
                style={{ color: ITEM }}
              >
                {b}
              </span>
            </li>
          ))}
        </ul>

        <Link
          href={card.href}
          className="group mt-[18px] inline-flex items-center gap-[7px] rounded-sm text-[14.5px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#6D3EF0] focus-visible:ring-offset-2"
          style={{ color: VIOLET }}
        >
          Learn more
          <ArrowIcon />
        </Link>
      </div>

      <div className="mt-7 w-[152px] md:absolute md:right-5 md:top-[67px] md:mt-0">
        <Visual />
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
