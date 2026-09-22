import { BadgeCheck, Star } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The testimonial wall: three columns of reviews, drifting.
 *
 * Dark on purpose. It sits between the platform grid and the pricing table —
 * the seam where a reader stops learning what the product does and starts
 * deciding whether to pay for it — and a dark band there is the page drawing
 * a breath before the prices. The ground is a literal rather than a token for
 * the same reason the footer's navies are: it is one ramp belonging to one
 * panel, and pulling `--color-dark` toward it would drag every dark surface in
 * the product with it.
 *
 * The three columns scroll at three speeds that share no common factor, so
 * they never fall into step and the wall never looks like one block moving.
 * Each column renders its three reviews twice and travels exactly half its own
 * height, which is what makes the loop seamless — at the end of the cycle the
 * second copy is where the first began. The keyframes live in `globals.css`
 * beside the page's other animations, and all three stop under
 * `prefers-reduced-motion`.
 *
 * Both fades are `pointer-events-none` and sit above the columns: a marquee
 * that ends in a hard edge reads as a clipped list rather than as a wall that
 * continues.
 */

interface Testimonial {
  name: string;
  role: string;
  initials: string;
  rating: string;
  text: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Sarah Ahmed",
    role: "E-commerce Owner",
    initials: "SA",
    rating: "5.0",
    text: "MarketFlow helped us automate WhatsApp follow-ups and recover customers we were previously losing. Our team can now manage conversations and campaigns from one place.",
  },
  {
    name: "Daniel Rahman",
    role: "Marketing Manager",
    initials: "DR",
    rating: "5.0",
    text: "The biggest improvement for us was having customer data, campaigns and automation connected together. We spend much less time switching between different tools.",
  },
  {
    name: "Maria Gomez",
    role: "Agency Owner",
    initials: "MG",
    rating: "5.0",
    text: "Managing multiple client campaigns became much easier. The workspace structure and automation tools give our team a clear view of what is happening.",
  },
  {
    name: "Ahmed Khan",
    role: "Business Owner",
    initials: "AK",
    rating: "5.0",
    text: "We started with WhatsApp automation and quickly expanded into campaigns and customer segmentation. MarketFlow gives us everything we need to follow the customer journey.",
  },
  {
    name: "Nadia Karim",
    role: "Growth Lead",
    initials: "NK",
    rating: "5.0",
    text: "The automation builder is simple enough for our marketing team to use while still giving us control over complex customer journeys.",
  },
  {
    name: "James Wilson",
    role: "Retail Business Owner",
    initials: "JW",
    rating: "5.0",
    text: "Orders, customers and marketing finally feel connected. We can see where customers came from and continue the conversation without losing context.",
  },
  {
    name: "Priya Nair",
    role: "Marketing Specialist",
    initials: "PN",
    rating: "5.0",
    text: "The combination of CRM, WhatsApp campaigns and automated follow-ups has made our daily marketing workflow significantly easier.",
  },
  {
    name: "Michael Brown",
    role: "Founder",
    initials: "MB",
    rating: "5.0",
    text: "MarketFlow gives our team a much clearer picture of leads, conversations and conversions. Everything important is available from one workspace.",
  },
  {
    name: "Fatima Rahman",
    role: "E-commerce Manager",
    initials: "FR",
    rating: "5.0",
    text: "We can now segment customers, send targeted campaigns and automatically follow up with interested buyers. It has made our customer engagement much more organized.",
  },
];

/** Three columns of three, in the order the list declares them. */
const COLUMNS = [
  TESTIMONIALS.slice(0, 3),
  TESTIMONIALS.slice(3, 6),
  TESTIMONIALS.slice(6, 9),
];

/** One per column — see the note above on why the three differ. */
const DRIFT = [
  "animate-testimonial-up",
  "animate-testimonial-down",
  "animate-testimonial-up-slow",
];

function ReviewCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <article className="rounded-card border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full brand-gradient-accent text-sm font-semibold text-white">
          {testimonial.initials}
        </span>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-white">
              {testimonial.name}
            </h3>
            <BadgeCheck
              className="size-3.5 shrink-0 text-emerald-400"
              fill="currentColor"
              aria-hidden
            />
          </div>

          <p className="text-xs text-white/50">{testimonial.role}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1">
        <span className="flex gap-0.5" aria-hidden>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className="size-3.5 text-amber-400"
              fill="currentColor"
            />
          ))}
        </span>

        <span className="ml-1 text-xs font-medium text-white/70">
          {testimonial.rating}
        </span>

        <span className="ml-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
          Verified
        </span>
      </div>

      <p className="mt-4 text-[15px] leading-6 text-white/70">
        “{testimonial.text}”
      </p>
    </article>
  );
}

export function TestimonialSection() {
  return (
    <section
      aria-labelledby="testimonials-title"
      className="relative isolate overflow-hidden bg-[#080622] py-24 text-white"
    >
      {/* Violet bloom behind the heading. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -z-10 h-105 w-175 -translate-x-1/2 rounded-full bg-purple-600/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 -right-20 h-48 w-48 rotate-45 bg-gradient-to-br from-purple-500/20 to-transparent blur-sm"
      />

      <div className="custom-container">
        <header className="section-title-space mx-auto max-w-2xl text-center">
          <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white/80 backdrop-blur">
            <Star
              className="size-4 text-amber-400"
              fill="currentColor"
              aria-hidden
            />
            4.9/5 customer rating
          </p>

          <h2
            id="testimonials-title"
            className="section-title mt-7 text-balance text-white"
          >
            Loved by teams{" "}
            <span className="lavender-gradient-text">
              growing with MarketFlow
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-[1.7] text-white/60 text-pretty">
            See how businesses use MarketFlow to manage customers, automate
            conversations, run campaigns and turn more interactions into growth.
          </p>
        </header>

        <div className="relative mx-auto mt-16 overflow-hidden">
          {/* The wall continues past both edges rather than being cut off. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-[#080622] to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-t from-[#080622] to-transparent"
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 max-h-[80vh] overflow-hidden">
            {COLUMNS.map((column, columnIndex) => (
              <div
                key={columnIndex}
                className={cn(
                  "flex flex-col gap-5",
                  columnIndex === 1 && "md:-translate-y-16",
                )}
              >
                {/* Rendered twice: the loop travels half this stack's height,
                    so the second copy lands exactly where the first started. */}
                <div className={cn("flex flex-col gap-5", DRIFT[columnIndex])}>
                  {[...column, ...column].map((testimonial, index) => (
                    <ReviewCard
                      key={`${testimonial.name}-${index}`}
                      testimonial={testimonial}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
