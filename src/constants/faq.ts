export interface FaqEntry {
  q: string;
  a: string;
}

/**
 * The product FAQ, the one copy of it. `/faq` renders all of it and
 * `/features` renders the questions named in `FEATURES_FAQ_IDS`, so an answer
 * edited here changes on both pages at once.
 *
 * Every answer names a module that exists in the dashboard - Contacts, Leads,
 * Customer Journey, Social Planner, the automation builder, Products and
 * Orders - and nothing that does not. Billing questions are not here; they
 * live in `PRICING_FAQS`, beside the plans they are about.
 *
 * Keyed by a stable id rather than by position, so the Features page's
 * selection survives a reorder or a reworded question.
 */
export const FAQ_ITEMS = [
  {
    id: "what-is-marketflow",
    q: "What is MarketFlow?",
    a: "MarketFlow is a connected workspace for managing customers, conversations, marketing campaigns, automation, commerce and analytics in one place.",
  },
  {
    id: "use-cases",
    q: "What can I use MarketFlow for?",
    a: "Use it to keep contacts and leads in one CRM, reach customers on WhatsApp, Email, SMS and Social, automate follow-ups, sell products and track orders, and measure what each campaign returns.",
  },
  {
    id: "channels",
    q: "Which channels can I use with MarketFlow?",
    a: "MarketFlow supports WhatsApp, Email, SMS and Social channels, so you can manage customer communication and campaigns from one workspace.",
  },
  {
    id: "whatsapp-automation",
    q: "Can I automate WhatsApp conversations?",
    a: "Yes. MarketFlow lets you create automated workflows using triggers, conditions, delays, messages and follow-up actions.",
  },
  {
    id: "contacts-leads",
    q: "Can I manage contacts and leads in MarketFlow?",
    a: "Yes. Contacts, leads, segments, tags and customer journeys can be managed together, so your team has a complete view of each customer.",
  },
  {
    id: "follow-ups",
    q: "Can I create automated customer follow-ups?",
    a: "Yes. The automation builder starts a workflow from a trigger, waits for a set time, date or event, then sends a WhatsApp, Email or SMS message and can tag the contact, move the lead to a new stage or assign an owner.",
  },
  {
    id: "email-sms-campaigns",
    q: "Can I create Email and SMS campaigns?",
    a: "Yes. You can create campaigns, manage reusable templates and monitor delivery and engagement from the Email and SMS modules.",
  },
  {
    id: "social",
    q: "Can I manage social media posts from MarketFlow?",
    a: "Yes. Social Planner lets you plan, create, schedule and review social content across connected social accounts.",
  },
  {
    id: "campaigns",
    q: "Can I create and manage campaigns?",
    a: "Yes. The campaign builder takes you through details, audience, content, sender and schedule, with a review before anything is sent. Every campaign is tracked from draft to scheduled to sent.",
  },
  {
    id: "integrations",
    q: "Can MarketFlow connect with my store and other tools?",
    a: "Yes. MarketFlow includes integrations for services such as Shopify, analytics tools, Webhooks and API access.",
  },
  {
    id: "customer-journeys",
    q: "Can MarketFlow track customer journeys and conversions?",
    a: "Yes. Customer Journey follows each contact from subscriber to lead to customer, with a timeline of the messages, campaigns, automations, lead changes and orders along the way.",
  },
  {
    id: "commerce",
    q: "Can I manage products and orders?",
    a: "Yes. The commerce modules cover products, categories, inventory, orders and discounts, so what you sell sits in the same workspace as the customers buying it.",
  },
  {
    id: "performance",
    q: "Can I track campaign performance and revenue?",
    a: "Yes. MarketFlow analytics helps you understand campaign activity, customer engagement, conversions, orders and revenue.",
  },
  {
    id: "who-for",
    q: "Which businesses can use MarketFlow?",
    a: "MarketFlow is built for e-commerce stores, small and medium businesses, marketing agencies, real estate, education and healthcare teams: any business that sells to customers it talks to.",
  },
] as const satisfies readonly (FaqEntry & { id: string })[];

export type FaqId = (typeof FAQ_ITEMS)[number]["id"];

/** The eight questions `/features` has always shown, in the order it shows them. */
export const FEATURES_FAQ_IDS: readonly FaqId[] = [
  "what-is-marketflow",
  "channels",
  "whatsapp-automation",
  "contacts-leads",
  "email-sms-campaigns",
  "social",
  "integrations",
  "performance",
];

export function pickFaqs(ids: readonly FaqId[]): FaqEntry[] {
  return ids.map((id) => FAQ_ITEMS.find((item) => item.id === id)!);
}
