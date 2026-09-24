import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";

import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { SectionEyebrow } from "@/components/marketing/section-eyebrow";
import { FAQ_ITEMS, type FaqEntry } from "@/constants/faq";
import { cn } from "@/lib/utils";

const DEFAULT_SUBTITLE =
  "Find answers to common questions about MarketFlow, customer management, marketing automation, campaigns, WhatsApp, workflows, commerce and analytics.";

/**
 * The product FAQ as a centred section: heading, subtitle, then the
 * accordion on a reading measure.
 *
 * With no props it renders every question in `FAQ_ITEMS`, which is what
 * `/faq` shows - drop `<FaqSection />` on another page and it is the same
 * content, not a copy of it.
 *
 * `title={null}` drops the eyebrow and the heading and keeps the subtitle, for
 * a page whose hero already carries the "Frequently Asked Questions" `<h1>`;
 * the section is then labelled by the subtitle instead, so it still has an
 * accessible name.
 *
 * `max-w-3xl` holds a question to one line at desktop and keeps an answer
 * under ~90 characters a line. Below that the list is simply the container's
 * width, which is what gives the rows full-width touch targets on a phone.
 */
export function FaqSection({
  id = "faq",
  title = "Frequently Asked Questions",
  subtitle = DEFAULT_SUBTITLE,
  items = FAQ_ITEMS,
  className,
}: {
  id?: string;
  title?: ReactNode | null;
  subtitle?: ReactNode;
  items?: readonly FaqEntry[];
  /** The ground, e.g. `bg-background`. White (the page canvas) when omitted. */
  className?: string;
}) {
  const titleId = `${id}-title`;
  const subtitleId = `${id}-subtitle`;

  return (
    <section
      id={id}
      aria-labelledby={title === null ? subtitleId : titleId}
      className={cn("section-space-py scroll-mt-32", className)}
    >
      <div className="custom-container">
        <div className="mx-auto max-w-3xl">
          <header className="mx-auto max-w-2xl text-center">
            {title !== null && (
              <>
                <SectionEyebrow text="FAQ" icon={CircleHelp} />
                <h2 id={titleId} className="section-title mt-5 text-balance">
                  {title}
                </h2>
              </>
            )}

            <p
              id={subtitleId}
              className={cn("section-subtitle", title === null && "mt-0")}
            >
              {subtitle}
            </p>
          </header>

          <FaqAccordion items={items} className="mt-10 lg:mt-12" />
        </div>
      </div>
    </section>
  );
}
