import type { Contact, ContactChannel, ContactStatus } from "@/types/contact";
import type { Lead, LeadSource, LeadStage } from "@/types/lead";

/**
 * The Customers module's sample data.
 *
 * One file for all five pages on purpose: contacts, leads, tags and journeys
 * are the same people seen from four angles, and the module's whole claim is
 * that they join up. Split across four fixture files they drift, and a lead
 * ends up owned by someone who is not on the team while its contact has a
 * different company. Every cross-reference here is an id into another export
 * in this file, so a rename breaks the build rather than the story.
 *
 * Replace with the real endpoints — see the per-export notes for which.
 */

/* -------------------------------------------------------------------------- */
/* Team                                                                       */
/* -------------------------------------------------------------------------- */

export interface Owner {
  id: string;
  name: string;
}

/** `GET /team/members`. Lead owners and journey assignees resolve through this. */
export const OWNERS: Owner[] = [
  { id: "own-1", name: "Amara Okafor" },
  { id: "own-2", name: "Daniel Reyes" },
  { id: "own-3", name: "Priya Nair" },
  { id: "own-4", name: "Tomás Silva" },
];

export const ownerName = (id?: string) =>
  OWNERS.find((owner) => owner.id === id)?.name ?? "Unassigned";

/* -------------------------------------------------------------------------- */
/* Tags                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * A tag's colour is picked from a fixed set, never free-form.
 *
 * Six swatches drawn from tokens the product already owns, so a tag can never
 * introduce a hue the rest of the dashboard does not use — which is what a
 * colour picker with a full spectrum always eventually does. `dot` and `pill`
 * are separate because the same tag is a 6px dot in a table cell and a tinted
 * pill in a contact row, and the pill needs ink that clears AA on its own
 * ground.
 */
export type TagColor =
  "indigo" | "violet" | "green" | "amber" | "blue" | "slate";

export const TAG_COLORS: Record<
  TagColor,
  { label: string; dot: string; pill: string }
> = {
  indigo: {
    label: "Indigo",
    dot: "bg-primary",
    pill: "bg-primary-soft text-primary-dark",
  },
  violet: {
    label: "Violet",
    dot: "bg-secondary",
    pill: "bg-sms-soft text-sms-dark",
  },
  green: {
    label: "Green",
    dot: "bg-success",
    pill: "bg-success-soft text-success-text",
  },
  amber: {
    label: "Amber",
    dot: "bg-warning",
    pill: "bg-warning-soft text-warning-text",
  },
  blue: { label: "Blue", dot: "bg-info", pill: "bg-info-soft text-info-text" },
  slate: {
    label: "Slate",
    dot: "bg-border-strong",
    pill: "bg-surface-secondary text-text-secondary",
  },
};

export const TAG_COLOR_KEYS = Object.keys(TAG_COLORS) as TagColor[];

export interface CustomerTag {
  id: string;
  name: string;
  color: TagColor;
  description?: string;
  createdAt: string;
  lastUsedAt?: string;
  /** Dependants, which is what makes deleting a tag a decision. */
  usedBySegments: number;
  usedByAutomations: number;
  usedByCampaigns: number;
}

/** `GET /tags`. Counts come from the join tables, not stored on the tag. */
export const CUSTOMER_TAGS: CustomerTag[] = [
  {
    id: "tag-vip",
    name: "VIP",
    color: "amber",
    description: "Top 5% by lifetime spend. Gets first access to launches.",
    createdAt: "2025-11-04T09:00:00Z",
    lastUsedAt: "2026-09-10T08:12:00Z",
    usedBySegments: 2,
    usedByAutomations: 3,
    usedByCampaigns: 4,
  },
  {
    id: "tag-hot-lead",
    name: "Hot Lead",
    color: "green",
    description: "Replied within an hour and asked about pricing.",
    createdAt: "2025-12-18T11:30:00Z",
    lastUsedAt: "2026-09-10T07:40:00Z",
    usedBySegments: 1,
    usedByAutomations: 2,
    usedByCampaigns: 1,
  },
  {
    id: "tag-newsletter",
    name: "Newsletter",
    color: "blue",
    description: "Opted in to the weekly email.",
    createdAt: "2025-09-02T14:00:00Z",
    lastUsedAt: "2026-09-09T16:05:00Z",
    usedBySegments: 3,
    usedByAutomations: 1,
    usedByCampaigns: 6,
  },
  {
    id: "tag-returning",
    name: "Returning Customer",
    color: "indigo",
    description: "Two or more completed orders.",
    createdAt: "2025-10-21T10:15:00Z",
    lastUsedAt: "2026-09-08T12:20:00Z",
    usedBySegments: 2,
    usedByAutomations: 2,
    usedByCampaigns: 3,
  },
  {
    id: "tag-enterprise",
    name: "Enterprise",
    color: "violet",
    description: "Company size above 200 seats.",
    createdAt: "2026-01-09T08:45:00Z",
    lastUsedAt: "2026-09-07T09:30:00Z",
    usedBySegments: 1,
    usedByAutomations: 1,
    usedByCampaigns: 2,
  },
  {
    id: "tag-wholesale",
    name: "Wholesale",
    color: "slate",
    description: "Buys at trade pricing.",
    createdAt: "2026-02-14T13:20:00Z",
    lastUsedAt: "2026-08-30T11:00:00Z",
    usedBySegments: 1,
    usedByAutomations: 0,
    usedByCampaigns: 1,
  },
  {
    id: "tag-trial",
    name: "Trial",
    color: "blue",
    description: "In a 14-day trial that has not converted.",
    createdAt: "2026-03-30T09:10:00Z",
    lastUsedAt: "2026-09-06T15:45:00Z",
    usedBySegments: 1,
    usedByAutomations: 2,
    usedByCampaigns: 0,
  },
  {
    id: "tag-churn-risk",
    name: "Churn Risk",
    color: "amber",
    description: "No activity in 60 days after a purchase.",
    createdAt: "2026-05-11T16:00:00Z",
    usedBySegments: 0,
    usedByAutomations: 0,
    usedByCampaigns: 0,
  },
];

export const tagByName = (name: string) =>
  CUSTOMER_TAGS.find((tag) => tag.name === name);

/** Every tag a contact list actually uses, for the filter dropdown. */
export const TAG_NAMES = CUSTOMER_TAGS.map((tag) => tag.name);

/* -------------------------------------------------------------------------- */
/* Contacts                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Where a contact came from. Wider than `LeadSource` because a contact can
 * arrive by import or by hand without ever being a lead.
 */
export type ContactSource =
  "whatsapp" | "website" | "campaign" | "import" | "manual" | "referral";

/** Deliverability, for the Status filter and the edit form. */
export const CONTACT_STATUSES: { value: ContactStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "unsubscribed", label: "Unsubscribed" },
  { value: "bounced", label: "Bounced" },
  { value: "blocked", label: "Blocked" },
];

/** The three channels consent is tracked per, for the Consent filter. */
export const CONSENT_CHANNELS: { value: ContactChannel; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
];

export const CONTACT_SOURCES: { value: ContactSource; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "website", label: "Website" },
  { value: "campaign", label: "Campaign" },
  { value: "import", label: "Import" },
  { value: "manual", label: "Manual" },
  { value: "referral", label: "Referral" },
];

/**
 * The lifecycle position the module is organised around.
 *
 * Distinct from `ContactStatus` in `types/contact`, which is about
 * deliverability — a contact can be a paying `customer` whose email has
 * `bounced`. Two axes, two fields; collapsing them is how "unsubscribed
 * customer" becomes unrepresentable.
 */
export type Lifecycle =
  "subscriber" | "lead" | "qualified" | "customer" | "repeat" | "churned";

export const LIFECYCLES: { value: Lifecycle; label: string }[] = [
  { value: "subscriber", label: "Subscriber" },
  { value: "lead", label: "Lead" },
  { value: "qualified", label: "Qualified" },
  { value: "customer", label: "Customer" },
  { value: "repeat", label: "Repeat customer" },
  { value: "churned", label: "Churned" },
];

/** A contact, plus the CRM columns the base `Contact` type does not carry. */
export interface CustomerContact extends Contact {
  lifecycle: Lifecycle;
  source: ContactSource;
  /** Lifetime spend in minor-unit-free dollars, matching `formatCurrency`. */
  lifetimeValue: number;
  orders: number;
  lastOrderAt?: string;
  segmentIds: string[];
  ownerId?: string;
}

const contact = (
  id: string,
  firstName: string,
  lastName: string,
  extra: Partial<CustomerContact> &
    Pick<CustomerContact, "lifecycle" | "source">,
): CustomerContact => ({
  id,
  firstName,
  lastName,
  status: "active",
  tags: [],
  optedInChannels: ["email"],
  customFields: {},
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-09-01T00:00:00Z",
  lifetimeValue: 0,
  orders: 0,
  segmentIds: [],
  ...extra,
});

/**
 * `GET /contacts`. Twenty-four rows — enough that pagination, multi-select and
 * every filter combination have something to act on, which a six-row fixture
 * cannot demonstrate.
 */
export const CONTACTS: CustomerContact[] = [
  contact("con-1", "Sarah", "Ahmed", {
    email: "sarah@brightretail.co",
    phone: "+971 50 118 4420",
    whatsappNumber: "+971 50 118 4420",
    company: "Bright Retail",
    jobTitle: "Head of Growth",
    lifecycle: "qualified",
    source: "whatsapp",
    tags: ["VIP", "Hot Lead"],
    optedInChannels: ["whatsapp", "email"],
    lifetimeValue: 4820,
    orders: 3,
    lastOrderAt: "2026-08-28T10:00:00Z",
    segmentIds: ["seg-vip"],
    ownerId: "own-1",
    lastContactedAt: "2026-09-10T08:12:00Z",
    createdAt: "2026-06-02T09:20:00Z",
  }),
  contact("con-2", "Maria", "Gomez", {
    email: "maria@casaverde.mx",
    phone: "+52 55 8890 2210",
    whatsappNumber: "+52 55 8890 2210",
    company: "Casa Verde",
    jobTitle: "Owner",
    lifecycle: "repeat",
    source: "website",
    tags: ["Returning Customer", "Newsletter"],
    optedInChannels: ["whatsapp", "email", "sms"],
    lifetimeValue: 9240,
    orders: 7,
    lastOrderAt: "2026-09-05T14:30:00Z",
    segmentIds: ["seg-vip", "seg-high-engagement"],
    ownerId: "own-2",
    lastContactedAt: "2026-09-09T16:05:00Z",
    createdAt: "2025-11-18T11:00:00Z",
  }),
  contact("con-3", "David", "Chen", {
    email: "david@chenstudio.com",
    phone: "+65 8221 9040",
    company: "Chen Studio",
    jobTitle: "Founder",
    lifecycle: "lead",
    source: "campaign",
    tags: ["Trial"],
    optedInChannels: ["email"],
    segmentIds: ["seg-new-leads"],
    ownerId: "own-1",
    lastContactedAt: "2026-09-08T09:15:00Z",
    createdAt: "2026-08-21T13:40:00Z",
  }),
  contact("con-4", "Elena", "Rossi", {
    email: "elena@rossiatelier.it",
    phone: "+39 340 552 1180",
    whatsappNumber: "+39 340 552 1180",
    company: "Rossi Atelier",
    jobTitle: "Creative Director",
    lifecycle: "customer",
    source: "referral",
    tags: ["VIP", "Enterprise"],
    optedInChannels: ["whatsapp", "email"],
    lifetimeValue: 6410,
    orders: 4,
    lastOrderAt: "2026-08-14T09:00:00Z",
    segmentIds: ["seg-vip"],
    ownerId: "own-3",
    lastContactedAt: "2026-09-07T11:20:00Z",
    createdAt: "2026-03-11T10:05:00Z",
  }),
  contact("con-5", "Rahul", "Verma", {
    email: "rahul@vermatutors.in",
    phone: "+91 98330 44120",
    company: "Verma Tutors",
    lifecycle: "lead",
    source: "website",
    tags: ["Trial", "Newsletter"],
    optedInChannels: ["email", "sms"],
    segmentIds: ["seg-new-leads", "seg-high-engagement"],
    ownerId: "own-4",
    lastContactedAt: "2026-09-06T15:45:00Z",
    createdAt: "2026-08-30T08:30:00Z",
  }),
  contact("con-6", "John", "Smith", {
    email: "john@smithagency.io",
    phone: "+1 415 220 8890",
    company: "Smith Agency",
    jobTitle: "Partner",
    lifecycle: "qualified",
    source: "campaign",
    tags: ["Enterprise", "Hot Lead"],
    optedInChannels: ["email"],
    lifetimeValue: 1200,
    orders: 1,
    segmentIds: [],
    ownerId: "own-2",
    lastContactedAt: "2026-09-09T10:00:00Z",
    createdAt: "2026-07-14T12:00:00Z",
  }),
  contact("con-7", "Tomás", "Silva", {
    email: "tomas@silvamoveis.br",
    phone: "+55 11 94422 1180",
    whatsappNumber: "+55 11 94422 1180",
    company: "Silva Móveis",
    lifecycle: "repeat",
    source: "whatsapp",
    tags: ["Returning Customer", "Wholesale"],
    optedInChannels: ["whatsapp"],
    lifetimeValue: 12480,
    orders: 11,
    lastOrderAt: "2026-09-02T10:30:00Z",
    segmentIds: ["seg-vip", "seg-wholesale"],
    ownerId: "own-4",
    lastContactedAt: "2026-09-08T14:10:00Z",
    createdAt: "2025-08-04T09:00:00Z",
  }),
  contact("con-8", "Omar", "Haddad", {
    email: "omar@haddadtrading.ae",
    phone: "+971 55 220 9910",
    whatsappNumber: "+971 55 220 9910",
    company: "Haddad Trading",
    lifecycle: "customer",
    source: "referral",
    tags: ["VIP", "Wholesale"],
    optedInChannels: ["whatsapp", "sms"],
    lifetimeValue: 7860,
    orders: 5,
    lastOrderAt: "2026-08-19T16:00:00Z",
    segmentIds: ["seg-vip", "seg-wholesale"],
    ownerId: "own-1",
    lastContactedAt: "2026-09-05T08:40:00Z",
    createdAt: "2026-02-27T15:30:00Z",
  }),
  contact("con-9", "Noah", "Bennett", {
    email: "noah@bennettco.com",
    lifecycle: "subscriber",
    source: "import",
    tags: ["Newsletter"],
    optedInChannels: ["email"],
    segmentIds: ["seg-high-engagement"],
    createdAt: "2026-04-18T07:00:00Z",
  }),
  contact("con-10", "Aisha", "Bello", {
    email: "aisha@bellofoods.ng",
    phone: "+234 803 441 2280",
    whatsappNumber: "+234 803 441 2280",
    company: "Bello Foods",
    lifecycle: "qualified",
    source: "whatsapp",
    tags: ["Hot Lead"],
    optedInChannels: ["whatsapp", "email"],
    segmentIds: [],
    ownerId: "own-3",
    lastContactedAt: "2026-09-10T07:40:00Z",
    createdAt: "2026-08-12T10:20:00Z",
  }),
  contact("con-11", "Lukas", "Meyer", {
    email: "lukas@meyerbau.de",
    phone: "+49 151 2280 4410",
    company: "Meyer Bau",
    jobTitle: "Procurement",
    lifecycle: "lead",
    source: "website",
    tags: ["Enterprise"],
    optedInChannels: ["email"],
    segmentIds: [],
    ownerId: "own-2",
    createdAt: "2026-09-01T11:15:00Z",
  }),
  contact("con-12", "Yuki", "Tanaka", {
    email: "yuki@tanakacraft.jp",
    company: "Tanaka Craft",
    lifecycle: "customer",
    source: "campaign",
    tags: ["Returning Customer"],
    optedInChannels: ["email"],
    lifetimeValue: 2340,
    orders: 2,
    lastOrderAt: "2026-07-22T09:00:00Z",
    segmentIds: [],
    ownerId: "own-4",
    createdAt: "2026-01-30T08:00:00Z",
  }),
  contact("con-13", "Grace", "Mwangi", {
    email: "grace@mwangiwellness.ke",
    phone: "+254 722 118 440",
    whatsappNumber: "+254 722 118 440",
    lifecycle: "subscriber",
    source: "whatsapp",
    tags: ["Newsletter"],
    optedInChannels: ["whatsapp", "email"],
    segmentIds: ["seg-high-engagement"],
    createdAt: "2026-06-25T13:00:00Z",
  }),
  contact("con-14", "Peter", "Novak", {
    email: "peter@novakparts.cz",
    company: "Novak Parts",
    lifecycle: "churned",
    source: "import",
    status: "unsubscribed",
    tags: ["Churn Risk"],
    optedInChannels: [],
    lifetimeValue: 1840,
    orders: 2,
    lastOrderAt: "2026-02-11T10:00:00Z",
    segmentIds: [],
    createdAt: "2025-10-09T09:30:00Z",
  }),
  contact("con-15", "Fatima", "Zahra", {
    email: "fatima@zahrabeauty.ma",
    phone: "+212 661 220 118",
    whatsappNumber: "+212 661 220 118",
    company: "Zahra Beauty",
    lifecycle: "repeat",
    source: "referral",
    tags: ["VIP", "Returning Customer"],
    optedInChannels: ["whatsapp", "email", "sms"],
    lifetimeValue: 5620,
    orders: 6,
    lastOrderAt: "2026-08-31T12:00:00Z",
    segmentIds: ["seg-vip"],
    ownerId: "own-3",
    lastContactedAt: "2026-09-04T09:00:00Z",
    createdAt: "2025-12-05T10:00:00Z",
  }),
  contact("con-16", "Andres", "Morales", {
    email: "andres@moralescafe.co",
    phone: "+57 310 442 8890",
    company: "Morales Café",
    lifecycle: "lead",
    source: "manual",
    tags: [],
    optedInChannels: ["email"],
    segmentIds: [],
    ownerId: "own-1",
    createdAt: "2026-09-03T15:00:00Z",
  }),
  contact("con-17", "Chloe", "Dubois", {
    email: "chloe@duboisfleurs.fr",
    phone: "+33 6 22 40 11 80",
    company: "Dubois Fleurs",
    lifecycle: "customer",
    source: "website",
    tags: ["Newsletter"],
    optedInChannels: ["email", "sms"],
    lifetimeValue: 980,
    orders: 1,
    lastOrderAt: "2026-06-18T11:00:00Z",
    segmentIds: ["seg-high-engagement"],
    ownerId: "own-2",
    createdAt: "2026-05-02T08:20:00Z",
  }),
  contact("con-18", "Ibrahim", "Yusuf", {
    email: "ibrahim@yusuflogistics.ng",
    phone: "+234 806 220 4410",
    whatsappNumber: "+234 806 220 4410",
    company: "Yusuf Logistics",
    jobTitle: "Operations Lead",
    lifecycle: "qualified",
    source: "campaign",
    tags: ["Enterprise", "Hot Lead"],
    optedInChannels: ["whatsapp", "email"],
    segmentIds: [],
    ownerId: "own-4",
    lastContactedAt: "2026-09-09T13:30:00Z",
    createdAt: "2026-07-29T09:45:00Z",
  }),
  contact("con-19", "Hannah", "Berg", {
    email: "hannah@bergdesign.se",
    lifecycle: "subscriber",
    source: "import",
    status: "bounced",
    tags: ["Newsletter"],
    optedInChannels: ["email"],
    segmentIds: ["seg-high-engagement"],
    createdAt: "2026-04-01T07:30:00Z",
  }),
  contact("con-20", "Marco", "Bianchi", {
    email: "marco@bianchisport.it",
    phone: "+39 333 118 2240",
    company: "Bianchi Sport",
    lifecycle: "customer",
    source: "whatsapp",
    tags: ["Wholesale"],
    optedInChannels: ["whatsapp"],
    lifetimeValue: 3210,
    orders: 3,
    lastOrderAt: "2026-08-08T14:00:00Z",
    segmentIds: ["seg-wholesale"],
    ownerId: "own-1",
    createdAt: "2026-02-08T12:10:00Z",
  }),
  contact("con-21", "Zainab", "Khan", {
    email: "zainab@khantextiles.pk",
    phone: "+92 300 442 1180",
    whatsappNumber: "+92 300 442 1180",
    company: "Khan Textiles",
    lifecycle: "lead",
    source: "referral",
    tags: ["Hot Lead", "Wholesale"],
    optedInChannels: ["whatsapp", "email"],
    segmentIds: ["seg-wholesale"],
    ownerId: "own-3",
    lastContactedAt: "2026-09-10T06:50:00Z",
    createdAt: "2026-09-04T10:30:00Z",
  }),
  contact("con-22", "Oliver", "Wright", {
    email: "oliver@wrightbooks.co.uk",
    lifecycle: "churned",
    source: "campaign",
    tags: ["Churn Risk"],
    optedInChannels: ["email"],
    lifetimeValue: 640,
    orders: 1,
    lastOrderAt: "2026-01-19T09:00:00Z",
    segmentIds: [],
    createdAt: "2025-12-22T14:00:00Z",
  }),
  contact("con-23", "Lucia", "Santos", {
    email: "lucia@santosjoias.br",
    phone: "+55 21 98844 2210",
    whatsappNumber: "+55 21 98844 2210",
    company: "Santos Jóias",
    lifecycle: "repeat",
    source: "whatsapp",
    tags: ["VIP", "Returning Customer", "Newsletter"],
    optedInChannels: ["whatsapp", "email"],
    lifetimeValue: 8140,
    orders: 8,
    lastOrderAt: "2026-09-07T15:30:00Z",
    segmentIds: ["seg-vip", "seg-high-engagement"],
    ownerId: "own-2",
    lastContactedAt: "2026-09-08T10:15:00Z",
    createdAt: "2025-09-15T11:00:00Z",
  }),
  contact("con-24", "Samuel", "Adeyemi", {
    email: "samuel@adeyemifarms.ng",
    phone: "+234 802 118 4420",
    company: "Adeyemi Farms",
    lifecycle: "subscriber",
    source: "website",
    tags: [],
    optedInChannels: ["email"],
    segmentIds: [],
    createdAt: "2026-08-27T09:00:00Z",
  }),
];

export const contactName = (item: Contact) =>
  `${item.firstName} ${item.lastName}`;

export const contactById = (id: string) =>
  CONTACTS.find((item) => item.id === id);

/** Channels a contact has consented to, as a lookup the drawer can read. */
export const hasConsent = (item: CustomerContact, channel: ContactChannel) =>
  item.optedInChannels.includes(channel);

/* -------------------------------------------------------------------------- */
/* Leads                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The board's columns.
 *
 * `LeadStage` in `types/lead` is the contract and is not changed here; this is
 * only the display order and the labels the board shows. `lost` is deliberately
 * absent from the board and reachable from a lead's own actions — a Lost column
 * beside Won turns a pipeline into a scoreboard, and it is the one column
 * nobody wants to look at every day.
 */
/**
 * The pipelines a lead can belong to.
 *
 * Two, so the selector is a real control rather than a decorative one — a
 * single-pipeline dropdown teaches the reader nothing about what it does.
 * Most leads sit on `pipe-sales` and four on `pipe-partner`, so switching
 * pipelines visibly changes the board, its counters and its value.
 */
export const PIPELINES: { id: string; name: string }[] = [
  { id: "pipe-sales", name: "Sales Pipeline" },
  { id: "pipe-partner", name: "Partnerships" },
];

export const PIPELINE_STAGES: { stage: LeadStage; label: string }[] = [
  { stage: "new", label: "New Lead" },
  { stage: "contacted", label: "Contacted" },
  { stage: "negotiation", label: "Interested" },
  { stage: "qualified", label: "Qualified" },
  { stage: "proposal", label: "Proposal" },
  { stage: "won", label: "Won" },
];

export const stageLabel = (stage: LeadStage) =>
  PIPELINE_STAGES.find((item) => item.stage === stage)?.label ??
  (stage === "lost" ? "Lost" : stage);

export const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "website", label: "Website" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "campaign", label: "Campaign" },
  { value: "referral", label: "Referral" },
  { value: "manual", label: "Manual" },
  { value: "import", label: "Import" },
];

/** A lead, plus the denormalised fields the board reads on every card. */
export interface PipelineLead extends Lead {
  /** Tags live on the contact; copied here so a card renders without a join. */
  tags: string[];
  lastActivityAt: string;
  lastActivity: string;
}

const lead = (
  id: string,
  contactId: string,
  title: string,
  stage: LeadStage,
  value: number,
  extra: Partial<PipelineLead> &
    Pick<PipelineLead, "source" | "lastActivity" | "lastActivityAt">,
): PipelineLead => ({
  id,
  contactId,
  title,
  stage,
  value,
  currency: "USD",
  score: 50,
  probability: 40,
  pipelineId: "pipe-sales",
  tags: [],
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-09-09T00:00:00Z",
  ...extra,
});

/** `GET /leads?pipelineId=`. Every `contactId` resolves in `CONTACTS`. */
export const LEADS: PipelineLead[] = [
  lead("led-1", "con-1", "Bright Retail — 3 locations", "qualified", 2400, {
    source: "whatsapp",
    score: 88,
    probability: 70,
    ownerId: "own-1",
    expectedCloseDate: "2026-09-24T00:00:00Z",
    tags: ["VIP", "Hot Lead"],
    lastActivity: "Replied on WhatsApp",
    lastActivityAt: "2026-09-10T08:12:00Z",
  }),
  lead("led-2", "con-10", "Bello Foods — pilot", "qualified", 1800, {
    source: "whatsapp",
    score: 81,
    probability: 65,
    ownerId: "own-3",
    expectedCloseDate: "2026-09-30T00:00:00Z",
    tags: ["Hot Lead"],
    lastActivity: "Asked about pricing",
    lastActivityAt: "2026-09-10T07:40:00Z",
  }),
  lead(
    "led-3",
    "con-18",
    "Yusuf Logistics — fleet rollout",
    "proposal",
    12400,
    {
      source: "campaign",
      score: 92,
      probability: 80,
      ownerId: "own-4",
      expectedCloseDate: "2026-09-18T00:00:00Z",
      tags: ["Enterprise", "Hot Lead"],
      lastActivity: "Proposal sent",
      lastActivityAt: "2026-09-09T13:30:00Z",
    },
  ),
  lead("led-4", "con-6", "Smith Agency — retainer", "proposal", 7600, {
    pipelineId: "pipe-partner",
    source: "campaign",
    score: 74,
    probability: 60,
    ownerId: "own-2",
    expectedCloseDate: "2026-10-02T00:00:00Z",
    tags: ["Enterprise"],
    lastActivity: "Reviewing with legal",
    lastActivityAt: "2026-09-09T10:00:00Z",
  }),
  lead("led-5", "con-21", "Khan Textiles — wholesale", "negotiation", 5200, {
    source: "referral",
    score: 69,
    probability: 50,
    ownerId: "own-3",
    expectedCloseDate: "2026-10-08T00:00:00Z",
    tags: ["Hot Lead", "Wholesale"],
    lastActivity: "Requested trade pricing",
    lastActivityAt: "2026-09-10T06:50:00Z",
  }),
  lead("led-6", "con-11", "Meyer Bau — procurement", "contacted", 9800, {
    source: "website",
    score: 58,
    probability: 30,
    ownerId: "own-2",
    tags: ["Enterprise"],
    lastActivity: "Left voicemail",
    lastActivityAt: "2026-09-08T11:00:00Z",
  }),
  lead("led-7", "con-3", "Chen Studio — team plan", "contacted", 1400, {
    source: "campaign",
    score: 52,
    probability: 25,
    ownerId: "own-1",
    tags: ["Trial"],
    lastActivity: "Trial started",
    lastActivityAt: "2026-09-08T09:15:00Z",
  }),
  lead("led-8", "con-5", "Verma Tutors — annual", "new", 2200, {
    source: "website",
    score: 41,
    probability: 15,
    ownerId: "own-4",
    tags: ["Trial", "Newsletter"],
    lastActivity: "Filled pricing form",
    lastActivityAt: "2026-09-06T15:45:00Z",
  }),
  lead("led-9", "con-16", "Morales Café — single store", "new", 600, {
    pipelineId: "pipe-partner",
    source: "manual",
    score: 34,
    probability: 10,
    ownerId: "own-1",
    lastActivity: "Added by Amara",
    lastActivityAt: "2026-09-03T15:00:00Z",
  }),
  lead("led-10", "con-24", "Adeyemi Farms — enquiry", "new", 1100, {
    source: "website",
    score: 29,
    probability: 10,
    lastActivity: "Downloaded guide",
    lastActivityAt: "2026-08-27T09:00:00Z",
  }),
  lead("led-11", "con-4", "Rossi Atelier — expansion", "negotiation", 6800, {
    source: "referral",
    score: 77,
    probability: 55,
    ownerId: "own-3",
    expectedCloseDate: "2026-09-26T00:00:00Z",
    tags: ["VIP", "Enterprise"],
    lastActivity: "Second call booked",
    lastActivityAt: "2026-09-07T11:20:00Z",
  }),
  lead("led-12", "con-8", "Haddad Trading — restock", "won", 4200, {
    source: "referral",
    score: 90,
    probability: 100,
    ownerId: "own-1",
    tags: ["VIP", "Wholesale"],
    lastActivity: "Signed",
    lastActivityAt: "2026-09-05T08:40:00Z",
  }),
  lead("led-13", "con-7", "Silva Móveis — Q4 order", "won", 8600, {
    pipelineId: "pipe-partner",
    source: "whatsapp",
    score: 94,
    probability: 100,
    ownerId: "own-4",
    tags: ["Returning Customer", "Wholesale"],
    lastActivity: "Invoice paid",
    lastActivityAt: "2026-09-02T10:30:00Z",
  }),
  lead("led-14", "con-23", "Santos Jóias — festive range", "won", 3400, {
    source: "whatsapp",
    score: 86,
    probability: 100,
    ownerId: "own-2",
    tags: ["VIP", "Returning Customer"],
    lastActivity: "Order placed",
    lastActivityAt: "2026-09-07T15:30:00Z",
  }),
  lead("led-15", "con-20", "Bianchi Sport — kit deal", "contacted", 2900, {
    source: "whatsapp",
    score: 55,
    probability: 30,
    ownerId: "own-1",
    tags: ["Wholesale"],
    lastActivity: "Sent catalogue",
    lastActivityAt: "2026-09-04T09:20:00Z",
  }),
  lead("led-16", "con-15", "Zahra Beauty — salon bundle", "negotiation", 3100, {
    pipelineId: "pipe-partner",
    source: "referral",
    score: 72,
    probability: 50,
    ownerId: "own-3",
    expectedCloseDate: "2026-10-12T00:00:00Z",
    tags: ["VIP", "Returning Customer"],
    lastActivity: "Comparing tiers",
    lastActivityAt: "2026-09-04T09:00:00Z",
  }),
  lead("led-17", "con-17", "Dubois Fleurs — subscription", "qualified", 1500, {
    source: "website",
    score: 66,
    probability: 55,
    ownerId: "own-2",
    expectedCloseDate: "2026-09-29T00:00:00Z",
    tags: ["Newsletter"],
    lastActivity: "Demo completed",
    lastActivityAt: "2026-09-06T13:00:00Z",
  }),
  lead("led-18", "con-12", "Tanaka Craft — reorder", "lost", 1900, {
    source: "campaign",
    score: 38,
    probability: 0,
    ownerId: "own-4",
    lostReason: "Went with an in-house build",
    tags: ["Returning Customer"],
    lastActivity: "Marked lost",
    lastActivityAt: "2026-08-30T16:00:00Z",
  }),
];

export const leadsForContact = (contactId: string) =>
  LEADS.filter((item) => item.contactId === contactId);

/** `GET /leads/:id/notes`. Newest first is applied at read time. */
export interface LeadNote {
  id: string;
  leadId: string;
  authorId: string;
  body: string;
  at: string;
}

export const LEAD_NOTES: LeadNote[] = [
  {
    id: "lnote-1",
    leadId: "led-1",
    authorId: "own-1",
    body: "Wants all three locations live before the Eid campaign. Needs a per-branch inbox.",
    at: "2026-09-09T11:20:00Z",
  },
  {
    id: "lnote-2",
    leadId: "led-1",
    authorId: "own-1",
    body: "Sent the WhatsApp template pack. Asked to compare Growth vs Premium.",
    at: "2026-09-10T08:20:00Z",
  },
  {
    id: "lnote-3",
    leadId: "led-3",
    authorId: "own-4",
    body: "Procurement needs a signed DPA. Legal review runs about a week.",
    at: "2026-09-09T14:05:00Z",
  },
  {
    id: "lnote-4",
    leadId: "led-4",
    authorId: "own-2",
    body: "Retainer scope agreed verbally. Waiting on their legal team.",
    at: "2026-09-09T10:30:00Z",
  },
  {
    id: "lnote-5",
    leadId: "led-5",
    authorId: "own-3",
    body: "Pushing for 15% off on an annual commitment. Approved up to 10%.",
    at: "2026-09-08T16:40:00Z",
  },
];

export const notesForLead = (leadId: string) =>
  LEAD_NOTES.filter((item) => item.leadId === leadId).sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

/**
 * The fixture clock.
 *
 * Every date in this file is written relative to it, and anything that has to
 * decide whether a date has passed — an overdue task, for one — compares
 * against this rather than `Date.now()`. A real clock read during render
 * differs between the server render and hydration, and would also make the
 * seeded data drift into the past as the demo ages.
 */
export const FIXTURE_NOW = "2026-09-10T09:00:00Z";

/** `GET /leads/:id/tasks`. Soonest due first is applied at read time. */
export interface LeadTask {
  id: string;
  leadId: string;
  title: string;
  dueAt: string;
  ownerId?: string;
  done: boolean;
}

export const LEAD_TASKS: LeadTask[] = [
  {
    id: "ltask-1",
    leadId: "led-1",
    title: "Send the Premium quote",
    dueAt: "2026-09-11T09:00:00Z",
    ownerId: "own-1",
    done: false,
  },
  {
    id: "ltask-2",
    leadId: "led-1",
    title: "Confirm branch count",
    dueAt: "2026-09-08T09:00:00Z",
    ownerId: "own-1",
    done: true,
  },
  {
    id: "ltask-3",
    leadId: "led-2",
    title: "Follow up on pricing question",
    dueAt: "2026-09-12T09:00:00Z",
    ownerId: "own-3",
    done: false,
  },
  {
    id: "ltask-4",
    leadId: "led-3",
    title: "Chase the signed DPA",
    dueAt: "2026-09-15T09:00:00Z",
    ownerId: "own-4",
    done: false,
  },
  {
    id: "ltask-5",
    leadId: "led-4",
    title: "Call after legal review",
    dueAt: "2026-09-16T09:00:00Z",
    ownerId: "own-2",
    done: false,
  },
  {
    id: "ltask-6",
    leadId: "led-5",
    title: "Send revised discount terms",
    dueAt: "2026-09-09T09:00:00Z",
    ownerId: "own-3",
    done: false,
  },
];

export const tasksForLead = (leadId: string) =>
  LEAD_TASKS.filter((item) => item.leadId === leadId).sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
  );

/* -------------------------------------------------------------------------- */
/* Segments                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The condition vocabulary a Customers segment is built from.
 *
 * Deliberately narrower than `SegmentField` in `segment-fixtures`: every field
 * here can actually be evaluated against a contact record, which is what lets
 * the rule builder show a real audience count while somebody is still editing
 * the rules. "Campaign behaviour" cannot be answered from the contact table, so
 * it is not offered.
 */
export type ConditionField =
  | "tag"
  | "status"
  | "lifecycle"
  | "source"
  | "channel"
  | "lifetimeValue"
  | "orders"
  | "lastActivity"
  | "company"
  | "owner";

export type ConditionOperator =
  | "is"
  | "is_not"
  | "contains"
  | "gt"
  | "lt"
  | "in_last_days"
  | "not_in_last_days"
  | "is_set"
  | "is_not_set";

/** How a condition's value is entered — the builder picks the control from this. */
export type ConditionInput = "select" | "number" | "text" | "none";

export interface ConditionFieldMeta {
  value: ConditionField;
  label: string;
  operators: ConditionOperator[];
  input: ConditionInput;
  /** Options for `input: "select"`, resolved lazily so tag edits are picked up. */
  options?: () => { value: string; label: string }[];
  /** Shown beside a number or text input, e.g. "days" or "USD". */
  unit?: string;
}

export const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
  is: "is",
  is_not: "is not",
  contains: "contains",
  gt: "is more than",
  lt: "is less than",
  in_last_days: "in the last",
  not_in_last_days: "not in the last",
  is_set: "is set",
  is_not_set: "is empty",
};

export const CONDITION_FIELDS: ConditionFieldMeta[] = [
  {
    value: "tag",
    label: "Tag",
    operators: ["is", "is_not"],
    input: "select",
    options: () => TAG_NAMES.map((name) => ({ value: name, label: name })),
  },
  {
    value: "status",
    label: "Status",
    operators: ["is", "is_not"],
    input: "select",
    options: () => CONTACT_STATUSES.map((item) => ({ ...item })),
  },
  {
    value: "lifecycle",
    label: "Lifecycle stage",
    operators: ["is", "is_not"],
    input: "select",
    options: () => LIFECYCLES.map((item) => ({ ...item })),
  },
  {
    value: "source",
    label: "Source",
    operators: ["is", "is_not"],
    input: "select",
    options: () => CONTACT_SOURCES.map((item) => ({ ...item })),
  },
  {
    value: "channel",
    label: "Consent",
    operators: ["is_set", "is_not_set"],
    input: "select",
    options: () => CONSENT_CHANNELS.map((item) => ({ ...item })),
  },
  {
    value: "lifetimeValue",
    label: "Lifetime value",
    operators: ["gt", "lt"],
    input: "number",
    unit: "USD",
  },
  {
    value: "orders",
    label: "Orders",
    operators: ["gt", "lt", "is"],
    input: "number",
  },
  {
    value: "lastActivity",
    label: "Last activity",
    operators: ["in_last_days", "not_in_last_days"],
    input: "number",
    unit: "days",
  },
  {
    value: "company",
    label: "Company",
    operators: ["contains", "is_set", "is_not_set"],
    input: "text",
  },
  {
    value: "owner",
    label: "Owner",
    operators: ["is", "is_not"],
    input: "select",
    options: () => OWNERS.map((item) => ({ value: item.id, label: item.name })),
  },
];

export const conditionField = (field: ConditionField) =>
  CONDITION_FIELDS.find((item) => item.value === field) ?? CONDITION_FIELDS[0];

export interface Condition {
  id: string;
  field: ConditionField;
  operator: ConditionOperator;
  value: string;
}

/**
 * A group of conditions, and optionally nested groups.
 *
 * `match` is the group's own connective, so "ALL of these, and ANY of those"
 * is one root group with a nested one — the shape every CRM audience builder
 * settles on, because a flat rule list cannot express it at all.
 */
export interface RuleGroup {
  id: string;
  match: "all" | "any";
  conditions: Condition[];
  groups: RuleGroup[];
}

export const emptyGroup = (
  id: string,
  match: RuleGroup["match"] = "all",
): RuleGroup => ({
  id,
  match,
  conditions: [],
  groups: [],
});

const group = (
  match: RuleGroup["match"],
  conditions: [ConditionField, ConditionOperator, string][],
  groups: RuleGroup[] = [],
  id = "g-root",
): RuleGroup => ({
  id,
  match,
  conditions: conditions.map(([field, operator, value], index) => ({
    id: `${id}-c${index + 1}`,
    field,
    operator,
    value,
  })),
  groups,
});

/** Total conditions in a group and everything nested under it. */
export const countConditions = (rule: RuleGroup): number =>
  rule.conditions.length +
  rule.groups.reduce((sum, child) => sum + countConditions(child), 0);

const daysSince = (iso?: string) =>
  iso
    ? (new Date(FIXTURE_NOW).getTime() - new Date(iso).getTime()) / 86_400_000
    : Infinity;

/** One condition against one contact. The whole evaluator in one place. */
function matchesCondition(
  contact: CustomerContact,
  condition: Condition,
): boolean {
  const { field, operator, value } = condition;
  const number = Number(value);

  switch (field) {
    case "tag": {
      const has = contact.tags.includes(value);
      return operator === "is_not" ? !has : has;
    }
    case "status":
      return operator === "is_not"
        ? contact.status !== value
        : contact.status === value;
    case "lifecycle":
      return operator === "is_not"
        ? contact.lifecycle !== value
        : contact.lifecycle === value;
    case "source":
      return operator === "is_not"
        ? contact.source !== value
        : contact.source === value;
    case "channel": {
      const granted = contact.optedInChannels.includes(value as ContactChannel);
      return operator === "is_not_set" ? !granted : granted;
    }
    case "lifetimeValue":
      if (!value) return true;
      return operator === "lt"
        ? contact.lifetimeValue < number
        : contact.lifetimeValue > number;
    case "orders":
      if (!value) return true;
      if (operator === "lt") return contact.orders < number;
      if (operator === "is") return contact.orders === number;
      return contact.orders > number;
    case "lastActivity": {
      if (!value) return true;
      const within = daysSince(contact.lastContactedAt) <= number;
      return operator === "not_in_last_days" ? !within : within;
    }
    case "company": {
      const company = contact.company ?? "";
      if (operator === "is_set") return company.length > 0;
      if (operator === "is_not_set") return company.length === 0;
      return company.toLowerCase().includes(value.toLowerCase());
    }
    case "owner":
      return operator === "is_not"
        ? contact.ownerId !== value
        : contact.ownerId === value;
    default:
      return true;
  }
}

/**
 * Does this contact match the group?
 *
 * An empty group matches everybody, which is what makes a half-built rule show
 * the whole database rather than zero — a count of 0 while somebody is still
 * choosing their first field reads as "broken", not "empty".
 */
export function matchesGroup(
  contact: CustomerContact,
  rule: RuleGroup,
): boolean {
  const results = [
    ...rule.conditions.map((condition) => matchesCondition(contact, condition)),
    ...rule.groups.map((child) => matchesGroup(contact, child)),
  ];
  if (results.length === 0) return true;
  return rule.match === "all" ? results.every(Boolean) : results.some(Boolean);
}

/** `POST /segments/preview` — the live count under the rule builder. */
export const matchContacts = (rule: RuleGroup) =>
  CONTACTS.filter((contact) => matchesGroup(contact, rule));

export type SegmentType = "dynamic" | "static";

export interface SegmentUsage {
  campaigns: string[];
  automations: string[];
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  /**
   * Dynamic segments re-evaluate their rules on every read; static ones hold a
   * fixed list. The distinction matters enough to be a column: a static segment
   * that looks dynamic is how a campaign silently misses everyone who joined
   * after the list was built.
   */
  type: SegmentType;
  rule: RuleGroup;
  /** Set on static segments — the frozen membership. */
  memberIds?: string[];
  usage: SegmentUsage;
  /** Built in and not editable, e.g. "All Contacts". */
  system?: boolean;
  createdBy?: string;
  updatedAt: string;
}

/**
 * `GET /segments`.
 *
 * Ids and names match `SEGMENTS` in `segment-fixtures`, which the Marketing
 * module reads, so a segment is the same segment wherever it is named. What is
 * added here is the part Customers needs and Marketing does not: the condition
 * tree in an evaluable vocabulary, dynamic vs static, and what each segment is
 * currently used by — which is what makes a delete warning possible.
 *
 * Member counts come from evaluating the rules against `CONTACTS`, so the
 * number in the table is the number of rows you get when you open it. The
 * Marketing cards report the production audience size from the same endpoint.
 */
export const CUSTOMER_SEGMENTS: CustomerSegment[] = [
  {
    id: "seg-all",
    name: "All Contacts",
    description: "Everyone with a valid opt-in on at least one channel.",
    type: "dynamic",
    rule: group("all", [["status", "is", "active"]], [], "g-all"),
    usage: { campaigns: ["Monthly newsletter"], automations: [] },
    system: true,
    createdBy: "own-1",
    updatedAt: "2026-09-08T09:00:00Z",
  },
  {
    id: "seg-vip",
    name: "VIP Customers",
    description: "Top spenders with a repeat-order history.",
    type: "dynamic",
    rule: group(
      "all",
      [
        ["lifetimeValue", "gt", "2000"],
        ["orders", "gt", "2"],
      ],
      [group("any", [["tag", "is", "VIP"]], [], "g-vip-any")],
      "g-vip",
    ),
    usage: {
      campaigns: ["VIP early access", "Eid gifting preview"],
      automations: ["VIP welcome"],
    },
    createdBy: "own-1",
    updatedAt: "2026-09-06T11:20:00Z",
  },
  {
    id: "seg-new-leads",
    name: "New Leads",
    description: "Captured recently and not yet worked.",
    type: "dynamic",
    rule: group(
      "all",
      [
        ["lifecycle", "is", "lead"],
        ["lastActivity", "in_last_days", "14"],
      ],
      [],
      "g-new",
    ),
    usage: { campaigns: [], automations: ["Lead nurture", "First reply SLA"] },
    createdBy: "own-3",
    updatedAt: "2026-09-09T08:30:00Z",
  },
  {
    id: "seg-high-engagement",
    name: "High Engagement",
    description: "Replies on WhatsApp and opens most campaigns.",
    type: "dynamic",
    rule: group(
      "all",
      [
        ["channel", "is_set", "whatsapp"],
        ["lastActivity", "in_last_days", "7"],
      ],
      [],
      "g-eng",
    ),
    usage: { campaigns: ["Flash sale"], automations: [] },
    createdBy: "own-2",
    updatedAt: "2026-09-07T15:10:00Z",
  },
  {
    id: "seg-inactive",
    name: "Inactive Customers",
    description: "Bought before, but nothing for a while.",
    type: "dynamic",
    rule: group(
      "all",
      [
        ["orders", "gt", "0"],
        ["lastActivity", "not_in_last_days", "30"],
      ],
      [],
      "g-inactive",
    ),
    usage: { campaigns: ["Win-back"], automations: ["Win-back series"] },
    createdBy: "own-2",
    updatedAt: "2026-09-04T10:00:00Z",
  },
  {
    id: "seg-recent-purchasers",
    name: "Recent Purchasers",
    description: "Ordered in the last month — good for cross-sell.",
    type: "dynamic",
    rule: group(
      "all",
      [
        ["orders", "gt", "0"],
        ["lastActivity", "in_last_days", "30"],
      ],
      [],
      "g-recent",
    ),
    usage: {
      campaigns: ["Accessory cross-sell"],
      automations: ["Review request"],
    },
    createdBy: "own-4",
    updatedAt: "2026-09-09T12:45:00Z",
  },
  {
    id: "seg-wholesale",
    name: "Wholesale Accounts",
    description: "Trade buyers on wholesale pricing.",
    type: "dynamic",
    rule: group("all", [["tag", "is", "Wholesale"]], [], "g-wholesale"),
    usage: { campaigns: ["Trade price list"], automations: [] },
    createdBy: "own-3",
    updatedAt: "2026-09-05T09:20:00Z",
  },
  {
    id: "seg-abandoned",
    name: "Abandoned Checkouts",
    description: "Started a checkout in the last week and did not finish.",
    type: "dynamic",
    rule: group(
      "all",
      [
        ["orders", "is", "0"],
        ["lastActivity", "in_last_days", "7"],
      ],
      [],
      "g-abandoned",
    ),
    usage: { campaigns: [], automations: ["Cart recovery"] },
    createdBy: "own-1",
    updatedAt: "2026-09-10T06:15:00Z",
  },
  {
    id: "seg-dhaka",
    name: "Dhaka Contacts",
    description: "For local events and store openings.",
    type: "static",
    rule: emptyGroup("g-dhaka"),
    memberIds: ["con-9", "con-13", "con-19"],
    usage: { campaigns: ["Store opening invite"], automations: [] },
    createdBy: "own-3",
    updatedAt: "2026-08-28T13:00:00Z",
  },
  {
    id: "seg-webinar",
    name: "Webinar Registrants",
    description: "Signed up for the September product webinar.",
    type: "static",
    rule: emptyGroup("g-webinar"),
    memberIds: ["con-2", "con-5", "con-14", "con-22"],
    usage: {
      campaigns: ["Webinar reminder"],
      automations: ["Webinar follow-up"],
    },
    createdBy: "own-4",
    updatedAt: "2026-09-02T16:40:00Z",
  },
  {
    id: "seg-sunset",
    name: "Sunset Candidates",
    description: "No engagement in six months — review before removing.",
    type: "dynamic",
    rule: group(
      "any",
      [
        ["status", "is", "unsubscribed"],
        ["lastActivity", "not_in_last_days", "180"],
      ],
      [],
      "g-sunset",
    ),
    usage: { campaigns: [], automations: [] },
    createdBy: "own-2",
    updatedAt: "2026-08-20T11:00:00Z",
  },
];

export const segmentById = (id: string) =>
  CUSTOMER_SEGMENTS.find((segment) => segment.id === id);

/** The contacts in a segment: evaluated for dynamic, listed for static. */
export function segmentMembers(segment: CustomerSegment): CustomerContact[] {
  if (segment.type === "static") {
    return (segment.memberIds ?? [])
      .map((id) => contactById(id))
      .filter((contact): contact is CustomerContact => Boolean(contact));
  }
  return matchContacts(segment.rule);
}

export const segmentUsageCount = (segment: CustomerSegment) =>
  segment.usage.campaigns.length + segment.usage.automations.length;

/* -------------------------------------------------------------------------- */
/* Activity                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * One thing that happened to a contact.
 *
 * `kind` drives the icon and its tint, and the channel kinds keep their channel
 * identity rather than the brand indigo — a WhatsApp reply in a timeline is
 * green wherever it appears, which is what makes a mixed-channel timeline
 * scannable at all.
 */
export type ActivityKind =
  | "whatsapp"
  | "email"
  | "sms"
  | "social"
  | "note"
  | "stage"
  | "automation"
  | "campaign"
  | "order"
  | "web"
  | "form"
  | "score";

export interface CustomerActivity {
  id: string;
  contactId: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  at: string;
  /** Set where the event came from a campaign or automation, for the link out. */
  sourceName?: string;
}

/** `GET /contacts/:id/activity`. Newest first is applied at read time. */
export const ACTIVITY: CustomerActivity[] = [
  {
    id: "act-1",
    contactId: "con-1",
    kind: "web",
    title: "Visited pricing page",
    at: "2026-09-01T09:10:00Z",
  },
  {
    id: "act-2",
    contactId: "con-1",
    kind: "web",
    title: "Viewed Premium plan",
    at: "2026-09-01T09:14:00Z",
  },
  {
    id: "act-3",
    contactId: "con-1",
    kind: "whatsapp",
    title: "Asked about the premium plan",
    detail: "“Hi, I'm interested in the premium plan.”",
    at: "2026-09-02T10:24:00Z",
  },
  {
    id: "act-4",
    contactId: "con-1",
    kind: "automation",
    title: "Entered Premium flow",
    sourceName: "Premium flow",
    at: "2026-09-02T10:24:30Z",
  },
  {
    id: "act-5",
    contactId: "con-1",
    kind: "whatsapp",
    title: "Automated reply sent",
    detail: "Premium plan details and pricing",
    sourceName: "Premium flow",
    at: "2026-09-02T10:25:00Z",
  },
  {
    id: "act-6",
    contactId: "con-1",
    kind: "email",
    title: "Opened “Your premium walkthrough”",
    sourceName: "Premium onboarding",
    at: "2026-09-04T08:30:00Z",
  },
  {
    id: "act-7",
    contactId: "con-1",
    kind: "score",
    title: "Lead score +20",
    detail: "Opened two emails and replied on WhatsApp",
    at: "2026-09-05T11:00:00Z",
  },
  {
    id: "act-8",
    contactId: "con-1",
    kind: "stage",
    title: "Moved to Qualified",
    detail: "By Amara Okafor",
    at: "2026-09-07T14:20:00Z",
  },
  {
    id: "act-9",
    contactId: "con-1",
    kind: "note",
    title: "Note added",
    detail: "Wants a walkthrough for three store managers before signing.",
    at: "2026-09-09T09:00:00Z",
  },
  {
    id: "act-10",
    contactId: "con-1",
    kind: "whatsapp",
    title: "Replied about the walkthrough",
    at: "2026-09-10T08:12:00Z",
  },

  {
    id: "act-11",
    contactId: "con-2",
    kind: "order",
    title: "Order #4821 completed",
    detail: "$1,240",
    at: "2026-09-05T14:30:00Z",
  },
  {
    id: "act-12",
    contactId: "con-2",
    kind: "email",
    title: "Opened “September picks”",
    sourceName: "Newsletter",
    at: "2026-09-09T16:05:00Z",
  },
  {
    id: "act-13",
    contactId: "con-2",
    kind: "campaign",
    title: "Received “Returning customer offer”",
    sourceName: "Returning customer offer",
    at: "2026-09-08T10:00:00Z",
  },

  {
    id: "act-14",
    contactId: "con-10",
    kind: "whatsapp",
    title: "First message",
    at: "2026-08-12T10:20:00Z",
  },
  {
    id: "act-15",
    contactId: "con-10",
    kind: "form",
    title: "Submitted pilot request",
    at: "2026-09-09T12:00:00Z",
  },
  {
    id: "act-16",
    contactId: "con-10",
    kind: "whatsapp",
    title: "Asked about pricing",
    at: "2026-09-10T07:40:00Z",
  },

  {
    id: "act-17",
    contactId: "con-18",
    kind: "campaign",
    title: "Clicked “Fleet automation”",
    sourceName: "Fleet automation",
    at: "2026-08-29T09:00:00Z",
  },
  {
    id: "act-18",
    contactId: "con-18",
    kind: "email",
    title: "Proposal sent",
    at: "2026-09-09T13:30:00Z",
  },
  {
    id: "act-19",
    contactId: "con-18",
    kind: "stage",
    title: "Moved to Proposal",
    at: "2026-09-09T13:35:00Z",
  },

  {
    id: "act-20",
    contactId: "con-7",
    kind: "whatsapp",
    title: "Reorder confirmed",
    at: "2026-09-02T10:30:00Z",
  },
  {
    id: "act-21",
    contactId: "con-7",
    kind: "order",
    title: "Order #4790 completed",
    detail: "$2,180",
    at: "2026-09-02T11:00:00Z",
  },
  {
    id: "act-22",
    contactId: "con-21",
    kind: "whatsapp",
    title: "Requested trade pricing",
    at: "2026-09-10T06:50:00Z",
  },
  {
    id: "act-23",
    contactId: "con-3",
    kind: "automation",
    title: "Entered Trial nurture",
    sourceName: "Trial nurture",
    at: "2026-08-21T13:45:00Z",
  },
  {
    id: "act-24",
    contactId: "con-3",
    kind: "email",
    title: "Opened “Getting started”",
    sourceName: "Trial nurture",
    at: "2026-09-08T09:15:00Z",
  },
  {
    id: "act-25",
    contactId: "con-21",
    kind: "web",
    title: "Visited wholesale pricing",
    at: "2026-09-04T10:30:00Z",
  },
  {
    id: "act-26",
    contactId: "con-21",
    kind: "form",
    title: "Requested a trade account",
    at: "2026-09-04T10:52:00Z",
  },
  {
    id: "act-27",
    contactId: "con-21",
    kind: "score",
    title: "Lead score +25",
    detail: "Wholesale intent",
    at: "2026-09-04T10:53:00Z",
  },
  {
    id: "act-28",
    contactId: "con-21",
    kind: "email",
    title: "Sent the trade price list",
    sourceName: "Trade onboarding",
    at: "2026-09-05T09:10:00Z",
  },
  {
    id: "act-29",
    contactId: "con-21",
    kind: "stage",
    title: "Moved to Interested",
    at: "2026-09-08T11:05:00Z",
  },
  {
    id: "act-30",
    contactId: "con-21",
    kind: "note",
    title: "Pushing for 15% on an annual commitment.",
    at: "2026-09-08T16:40:00Z",
  },
  {
    id: "act-31",
    contactId: "con-23",
    kind: "whatsapp",
    title: "Asked about the festive range",
    detail: "“Do you have the gold set back in stock?”",
    at: "2025-09-15T11:00:00Z",
  },
  {
    id: "act-32",
    contactId: "con-23",
    kind: "order",
    title: "Order #2841 placed",
    detail: "$1,240 · 6 items",
    at: "2025-10-02T14:20:00Z",
  },
  {
    id: "act-33",
    contactId: "con-23",
    kind: "campaign",
    title: "Received Eid gifting preview",
    sourceName: "Eid gifting preview",
    at: "2026-08-28T09:00:00Z",
  },
  {
    id: "act-34",
    contactId: "con-23",
    kind: "order",
    title: "Order #4126 placed",
    detail: "$3,400 · 14 items",
    at: "2026-09-01T10:40:00Z",
  },
  {
    id: "act-35",
    contactId: "con-23",
    kind: "automation",
    title: "Entered Review request",
    sourceName: "Review request",
    at: "2026-09-03T10:00:00Z",
  },
  {
    id: "act-36",
    contactId: "con-23",
    kind: "whatsapp",
    title: "Left a 5-star review",
    sourceName: "Review request",
    at: "2026-09-08T10:15:00Z",
  },
  {
    id: "act-37",
    contactId: "con-4",
    kind: "web",
    title: "Visited the pricing page",
    at: "2026-03-11T10:05:00Z",
  },
  {
    id: "act-38",
    contactId: "con-4",
    kind: "form",
    title: "Booked a demo",
    at: "2026-03-11T10:31:00Z",
  },
  {
    id: "act-39",
    contactId: "con-4",
    kind: "email",
    title: "Demo confirmation sent",
    sourceName: "Demo booking",
    at: "2026-03-11T10:32:00Z",
  },
  {
    id: "act-40",
    contactId: "con-4",
    kind: "order",
    title: "Order #3092 placed",
    detail: "$2,180 · Growth plan",
    at: "2026-03-20T09:15:00Z",
  },
  {
    id: "act-41",
    contactId: "con-4",
    kind: "stage",
    title: "Moved to Negotiation",
    at: "2026-09-02T14:00:00Z",
  },
  {
    id: "act-42",
    contactId: "con-4",
    kind: "note",
    title: "Wants a second seat for their Milan studio.",
    at: "2026-09-05T09:40:00Z",
  },
  {
    id: "act-43",
    contactId: "con-4",
    kind: "sms",
    title: "Second call booked",
    at: "2026-09-07T11:20:00Z",
  },
  {
    id: "act-44",
    contactId: "con-5",
    kind: "web",
    title: "Read the automation guide",
    at: "2026-08-30T08:30:00Z",
  },
  {
    id: "act-45",
    contactId: "con-5",
    kind: "form",
    title: "Filled the pricing form",
    at: "2026-08-30T08:47:00Z",
  },
  {
    id: "act-46",
    contactId: "con-5",
    kind: "automation",
    title: "Entered Trial nurture",
    sourceName: "Trial nurture",
    at: "2026-08-30T08:48:00Z",
  },
  {
    id: "act-47",
    contactId: "con-5",
    kind: "email",
    title: "Opened “Set up your first flow”",
    sourceName: "Trial nurture",
    at: "2026-09-02T07:20:00Z",
  },
  {
    id: "act-48",
    contactId: "con-5",
    kind: "campaign",
    title: "Received September webinar invite",
    sourceName: "Webinar reminder",
    at: "2026-09-04T09:00:00Z",
  },
  {
    id: "act-49",
    contactId: "con-5",
    kind: "email",
    title: "Clicked the webinar link",
    sourceName: "Webinar reminder",
    at: "2026-09-06T15:45:00Z",
  },
  {
    id: "act-50",
    contactId: "con-6",
    kind: "campaign",
    title: "Clicked the agency partner ad",
    sourceName: "Agency partners",
    at: "2026-07-14T12:00:00Z",
  },
  {
    id: "act-51",
    contactId: "con-6",
    kind: "form",
    title: "Requested a partner call",
    at: "2026-07-14T12:26:00Z",
  },
  {
    id: "act-52",
    contactId: "con-6",
    kind: "whatsapp",
    title: "Discovery call agreed",
    at: "2026-07-16T10:10:00Z",
  },
  {
    id: "act-53",
    contactId: "con-6",
    kind: "stage",
    title: "Moved to Proposal",
    at: "2026-08-28T15:30:00Z",
  },
  {
    id: "act-54",
    contactId: "con-6",
    kind: "email",
    title: "Retainer proposal sent",
    at: "2026-08-28T15:40:00Z",
  },
  {
    id: "act-55",
    contactId: "con-6",
    kind: "note",
    title: "Scope agreed verbally. Waiting on their legal team.",
    at: "2026-09-09T10:00:00Z",
  },
  {
    id: "act-56",
    contactId: "con-15",
    kind: "whatsapp",
    title: "Referred by Bright Retail",
    at: "2025-12-05T10:00:00Z",
  },
  {
    id: "act-57",
    contactId: "con-15",
    kind: "order",
    title: "Order #1904 placed",
    detail: "$820 · salon bundle",
    at: "2025-12-19T13:05:00Z",
  },
  {
    id: "act-58",
    contactId: "con-15",
    kind: "campaign",
    title: "Received the spring range",
    sourceName: "Spring range",
    at: "2026-04-02T09:00:00Z",
  },
  {
    id: "act-59",
    contactId: "con-15",
    kind: "order",
    title: "Order #3355 placed",
    detail: "$1,460 · 9 items",
    at: "2026-04-11T11:25:00Z",
  },
  {
    id: "act-60",
    contactId: "con-15",
    kind: "automation",
    title: "Entered Reorder reminder",
    sourceName: "Reorder reminder",
    at: "2026-08-30T09:00:00Z",
  },
  {
    id: "act-61",
    contactId: "con-15",
    kind: "sms",
    title: "Replied “send the list”",
    sourceName: "Reorder reminder",
    at: "2026-09-04T09:00:00Z",
  },
  {
    id: "act-62",
    contactId: "con-3",
    kind: "web",
    title: "Compared Growth and Premium",
    at: "2026-08-21T13:40:00Z",
  },
  {
    id: "act-63",
    contactId: "con-3",
    kind: "note",
    title: "Team plan for 12 seats. Decision in October.",
    at: "2026-09-02T10:15:00Z",
  },
  {
    id: "act-64",
    contactId: "con-7",
    kind: "order",
    title: "Order #2210 placed",
    detail: "$1,980 · 11 items",
    at: "2026-05-14T10:30:00Z",
  },
  {
    id: "act-65",
    contactId: "con-7",
    kind: "campaign",
    title: "Received Q4 catalogue",
    sourceName: "Q4 catalogue",
    at: "2026-09-01T09:00:00Z",
  },
  {
    id: "act-66",
    contactId: "con-7",
    kind: "note",
    title: "Asked for a quote on 40 units.",
    at: "2026-09-08T14:10:00Z",
  },
];

export const activityForContact = (contactId: string) =>
  ACTIVITY.filter((item) => item.contactId === contactId).sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

/* -------------------------------------------------------------------------- */
/* Journey                                                                    */
/* -------------------------------------------------------------------------- */

export interface JourneyStage {
  key: string;
  label: string;
  count: number;
  /** Share of the first stage, so every bar is comparable. */
  hint?: string;
}

/**
 * `GET /analytics/lifecycle`. Counts descend, which the funnel relies on —
 * a stage larger than the one before it would draw a bar wider than its
 * parent and quietly misreport the drop-off.
 */
export const JOURNEY_STAGES: JourneyStage[] = [
  { key: "visitor", label: "Visitor", count: 48200 },
  { key: "lead", label: "Lead", count: 12480 },
  { key: "engaged", label: "Engaged", count: 9640 },
  { key: "qualified", label: "Qualified", count: 4820 },
  { key: "customer", label: "Customer", count: 2140 },
  { key: "repeat", label: "Repeat", count: 880 },
  { key: "advocate", label: "Advocate", count: 240 },
];

export interface DropOff {
  from: string;
  to: string;
  rate: number;
  lost: number;
  note: string;
}

/** The transitions worth fixing, worst first. */
export const DROP_OFFS: DropOff[] = [
  {
    from: "Customer",
    to: "Repeat",
    rate: 58.9,
    lost: 1260,
    note: "No post-purchase follow-up runs after day 7.",
  },
  {
    from: "Product viewed",
    to: "Checkout",
    rate: 42.4,
    lost: 3180,
    note: "Cart abandonment recovery is off for WhatsApp.",
  },
  {
    from: "Lead",
    to: "Qualified",
    rate: 36.1,
    lost: 4510,
    note: "Leads with no reply in 48h are never re-contacted.",
  },
  {
    from: "Engaged",
    to: "Qualified",
    rate: 50.0,
    lost: 4820,
    note: "Scoring counts opens but not replies.",
  },
];

export interface Touchpoint {
  key: string;
  label: string;
  kind: ActivityKind;
  count: number;
  share: number;
}

/** Ordered as a customer meets them, not by volume. */
export const TOUCHPOINTS: Touchpoint[] = [
  { key: "web", label: "Website visit", kind: "web", count: 48200, share: 100 },
  {
    key: "form",
    label: "Form submitted",
    kind: "form",
    count: 12480,
    share: 25.9,
  },
  {
    key: "whatsapp",
    label: "WhatsApp conversation",
    kind: "whatsapp",
    count: 9840,
    share: 20.4,
  },
  {
    key: "email",
    label: "Email opened",
    kind: "email",
    count: 8620,
    share: 17.9,
  },
  {
    key: "automation",
    label: "Follow-up automation",
    kind: "automation",
    count: 6240,
    share: 12.9,
  },
  { key: "sms", label: "SMS delivered", kind: "sms", count: 3180, share: 6.6 },
  {
    key: "social",
    label: "Social engagement",
    kind: "social",
    count: 2410,
    share: 5.0,
  },
  {
    key: "order",
    label: "Order completed",
    kind: "order",
    count: 2140,
    share: 4.4,
  },
];

export interface CustomerJourney {
  contactId: string;
  stage: string;
  entrySource: ContactSource;
  touchpoints: number;
  /** Days between first seen and now. */
  durationDays: number;
  firstSeenAt: string;
  lastActivityAt: string;
}

/** `GET /analytics/journeys`. Every `contactId` resolves in `CONTACTS`. */
export const JOURNEYS: CustomerJourney[] = [
  {
    contactId: "con-1",
    stage: "Qualified",
    entrySource: "whatsapp",
    touchpoints: 10,
    durationDays: 9,
    firstSeenAt: "2026-09-01T09:10:00Z",
    lastActivityAt: "2026-09-10T08:12:00Z",
  },
  {
    contactId: "con-10",
    stage: "Qualified",
    entrySource: "whatsapp",
    touchpoints: 6,
    durationDays: 29,
    firstSeenAt: "2026-08-12T10:20:00Z",
    lastActivityAt: "2026-09-10T07:40:00Z",
  },
  {
    contactId: "con-21",
    stage: "Lead",
    entrySource: "referral",
    touchpoints: 4,
    durationDays: 6,
    firstSeenAt: "2026-09-04T10:30:00Z",
    lastActivityAt: "2026-09-10T06:50:00Z",
  },
  {
    contactId: "con-2",
    stage: "Repeat",
    entrySource: "website",
    touchpoints: 18,
    durationDays: 296,
    firstSeenAt: "2025-11-18T11:00:00Z",
    lastActivityAt: "2026-09-09T16:05:00Z",
  },
  {
    contactId: "con-18",
    stage: "Qualified",
    entrySource: "campaign",
    touchpoints: 9,
    durationDays: 43,
    firstSeenAt: "2026-07-29T09:45:00Z",
    lastActivityAt: "2026-09-09T13:30:00Z",
  },
  {
    contactId: "con-23",
    stage: "Repeat",
    entrySource: "whatsapp",
    touchpoints: 22,
    durationDays: 360,
    firstSeenAt: "2025-09-15T11:00:00Z",
    lastActivityAt: "2026-09-08T10:15:00Z",
  },
  {
    contactId: "con-7",
    stage: "Repeat",
    entrySource: "whatsapp",
    touchpoints: 27,
    durationDays: 402,
    firstSeenAt: "2025-08-04T09:00:00Z",
    lastActivityAt: "2026-09-08T14:10:00Z",
  },
  {
    contactId: "con-3",
    stage: "Lead",
    entrySource: "campaign",
    touchpoints: 5,
    durationDays: 20,
    firstSeenAt: "2026-08-21T13:40:00Z",
    lastActivityAt: "2026-09-08T09:15:00Z",
  },
  {
    contactId: "con-4",
    stage: "Customer",
    entrySource: "referral",
    touchpoints: 14,
    durationDays: 182,
    firstSeenAt: "2026-03-11T10:05:00Z",
    lastActivityAt: "2026-09-07T11:20:00Z",
  },
  {
    contactId: "con-5",
    stage: "Lead",
    entrySource: "website",
    touchpoints: 4,
    durationDays: 11,
    firstSeenAt: "2026-08-30T08:30:00Z",
    lastActivityAt: "2026-09-06T15:45:00Z",
  },
  {
    contactId: "con-6",
    stage: "Qualified",
    entrySource: "campaign",
    touchpoints: 8,
    durationDays: 58,
    firstSeenAt: "2026-07-14T12:00:00Z",
    lastActivityAt: "2026-09-09T10:00:00Z",
  },
  {
    contactId: "con-15",
    stage: "Repeat",
    entrySource: "referral",
    touchpoints: 16,
    durationDays: 279,
    firstSeenAt: "2025-12-05T10:00:00Z",
    lastActivityAt: "2026-09-04T09:00:00Z",
  },
];

export const journeyForContact = (contactId: string) =>
  JOURNEYS.find((journey) => journey.contactId === contactId);

/**
 * The event groups the journey timeline filters by.
 *
 * Coarser than `ActivityKind` on purpose: somebody reading one customer's
 * history wants "show me the messages", not "show me the SMS but not the
 * WhatsApp". The channel is still visible on every row.
 */
export type JourneyEventGroup =
  "messages" | "campaigns" | "automation" | "leads" | "orders" | "notes";

export const JOURNEY_EVENT_GROUPS: {
  value: JourneyEventGroup;
  label: string;
}[] = [
  { value: "messages", label: "Messages" },
  { value: "campaigns", label: "Campaigns" },
  { value: "automation", label: "Automation" },
  { value: "leads", label: "Leads" },
  { value: "orders", label: "Orders" },
  { value: "notes", label: "Notes" },
];

const ACTIVITY_GROUPS: Record<ActivityKind, JourneyEventGroup> = {
  whatsapp: "messages",
  email: "messages",
  sms: "messages",
  social: "messages",
  campaign: "campaigns",
  automation: "automation",
  /* Page views, form fills, stage moves and score changes are all the lead
     record changing shape, so they read as one group rather than four. */
  web: "leads",
  form: "leads",
  stage: "leads",
  score: "leads",
  order: "orders",
  note: "notes",
};

export const activityGroup = (kind: ActivityKind): JourneyEventGroup =>
  ACTIVITY_GROUPS[kind];

/** The lifecycle a contact walks through, in order, for the stage tracker. */
export const LIFECYCLE_PATH: Lifecycle[] = [
  "subscriber",
  "lead",
  "qualified",
  "customer",
  "repeat",
];
