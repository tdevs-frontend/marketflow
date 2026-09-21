import { ChevronDown } from "lucide-react";

/**
 * The questions a prospect actually types before signing up.
 *
 * Product questions with product answers — every one of them is answerable from
 * a section above, and each answer names the real surface rather than
 * restating the pitch. A FAQ whose answers are marketing copy is a second CTA
 * with a chevron on it.
 *
 * `<details>` rather than a JavaScript accordion. The open and closed state is
 * a browser primitive: it is keyboard-operable, it is in the accessibility tree
 * correctly, it survives hydration failing, and it costs nothing to ship.
 * Nothing here needs to be a client component.
 *
 * The first one is open, so the pattern is obvious without anyone clicking.
 */

const FAQS = [
  {
    q: "What channels does MarketFlow support?",
    a: "WhatsApp, email, SMS and social. Each has its own campaigns, templates and analytics, and all four write back to the same contact record — so a customer you reached on WhatsApp and emailed a week later is one person, not two.",
  },
  {
    q: "Can I automate WhatsApp conversations?",
    a: "Yes. The automation builder triggers on inbound messages, lead events, orders and form submissions, and its steps include WhatsApp messages, waits, conditions, tags and CRM updates. Your team can take over any conversation from the shared inbox at any point.",
  },
  {
    q: "Can I manage leads and customers in MarketFlow?",
    a: "Contacts, leads, segments, tags and customer journeys are built in. Leads move through a drag-and-drop pipeline, and every conversation, campaign and order attaches to the contact it belongs to.",
  },
  {
    q: "Can MarketFlow manage products and orders?",
    a: "Yes — products, categories, catalog, inventory, orders and discounts. Because commerce and marketing share a workspace, an order can trigger a follow-up and revenue can be attributed back to the campaign that earned it.",
  },
  {
    q: "Can I connect external tools?",
    a: "MarketFlow connects WhatsApp Business, email providers, SMS gateways, social accounts, Shopify and Google Analytics, plus outbound webhooks and a REST API for anything not on that list. The integrations page shows the health of each connection and tells you when one breaks.",
  },
  {
    q: "Does MarketFlow support team collaboration?",
    a: "The inbox is shared, and roles and permissions control who can send campaigns, see billing or export data. Workspace activity records who changed what.",
  },
  {
    q: "Can I track campaign performance?",
    a: "Every campaign reports reach, engagement and conversions, and the analytics module rolls those up into revenue by channel and a conversion funnel across the whole workspace.",
  },
];

export function FeaturesFaq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="section-space-py scroll-mt-32 bg-background"
    >
      <div className="custom-container">
        <header className="section-title-space mx-auto max-w-2xl text-center">
          <h2 id="faq-title" className="section-title text-balance">
            Questions, answered.
          </h2>
        </header>

        <div className="mx-auto max-w-3xl space-y-2.5">
          {FAQS.map((faq, index) => (
            <details
              key={faq.q}
              open={index === 0}
              className="group rounded-card border border-border bg-surface px-5 shadow-card transition-colors open:border-border-strong"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold text-text-primary focus-visible:shadow-focus focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                {faq.q}
                <ChevronDown
                  className="size-4 shrink-0 text-text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  aria-hidden
                />
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-text-secondary text-pretty">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
