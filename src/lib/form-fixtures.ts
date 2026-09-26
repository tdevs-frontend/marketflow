import { DEFAULT_BEHAVIOR, DEFAULT_DESIGN } from "@/constants/forms";
import { CONTACTS, LEADS, contactById } from "@/lib/customer-fixtures";
import { WORKFLOWS } from "@/lib/workflow-fixtures";
import { WORKSPACE_NOW_MS } from "@/lib/workspace-clock";
import type {
  ConsentState,
  Form,
  FormField,
  FormFieldKind,
  FormSubmission,
  SessionContact,
  SubmissionSource,
  SubmissionStatus,
  SubmissionValue,
} from "@/types/form";

/**
 * The Forms module's sample data.
 *
 * Every submission that is linked points at a real record: its `contactId`
 * resolves in `CONTACTS`, its `leadId` in `LEADS`, and the identity it
 * captured is read *from* that contact rather than typed beside it - so the
 * name on a submission and the name on the contact cannot disagree. Where the
 * customer timeline already records a form ("Submitted pilot request",
 * "Requested a trade account"), the submission here is that same event, at the
 * same minute.
 *
 * The people who are not in the CRM are exactly the ones a real form would
 * leave unlinked: newsletter sign-ups still waiting on their double opt-in, a
 * quote form that routes to a salesperson before creating anything, and spam.
 * Nothing here implies a contact the Customers module does not have.
 *
 * `GET /forms` and `GET /forms/:id/submissions`, when the API exists.
 */

/* -------------------------------------------------------------------------- */
/* Clock                                                                      */
/* -------------------------------------------------------------------------- */

/** Weeks of history the trend charts cover. */
export const FORM_TREND_WEEKS = 8;

const WEEK_MS = 7 * 86_400_000;

/** The start of each trend week, oldest first, ending in the current week. */
export const FORM_WEEK_STARTS: number[] = Array.from(
  { length: FORM_TREND_WEEKS },
  (_, index) => WORKSPACE_NOW_MS - (FORM_TREND_WEEKS - index) * WEEK_MS,
);

export const FORM_WEEK_LABELS = FORM_WEEK_STARTS.map((start) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(start),
  ),
);

/** Which trend week an instant falls in, or -1 when it is older than the chart. */
export function weekIndexOf(at: string): number {
  const time = new Date(at).getTime();
  for (let index = FORM_TREND_WEEKS - 1; index >= 0; index -= 1) {
    if (time >= FORM_WEEK_STARTS[index]) return index;
  }
  return -1;
}

/* -------------------------------------------------------------------------- */
/* Forms                                                                      */
/* -------------------------------------------------------------------------- */

const field = (
  id: string,
  kind: FormFieldKind,
  label: string,
  required = false,
  extra: Partial<FormField> = {},
): FormField => ({ id, kind, label, required, ...extra });

const CONSENT_EMAIL =
  "I agree to receive emails from MarketFlow. Unsubscribe at any time.";

export const FORMS: Form[] = [
  {
    id: "fm-demo",
    name: "Request a Demo",
    description: "Pricing page. Books a walkthrough and opens a qualified lead.",
    type: "lead_capture",
    status: "active",
    fields: [
      field("first", "first_name", "First name", true),
      field("last", "last_name", "Last name", true),
      field("email", "email", "Work email", true),
      field("phone", "phone", "Phone", false, {
        helpText: "Include your country code so we can reach you on WhatsApp.",
      }),
      field("company", "company", "Company", true),
      field("team", "dropdown", "Team size", true, {
        options: ["1-5", "6-20", "21-50", "51+"],
      }),
      field("channel", "radio", "How should we reach you?", false, {
        options: ["WhatsApp", "Email", "Phone call"],
      }),
      field("consent", "consent", CONSENT_EMAIL, true),
    ],
    design: {
      ...DEFAULT_DESIGN,
      layout: "two_column",
      buttonLabel: "Book my demo",
      successMessage:
        "Thanks - a product specialist will message you within one working day.",
    },
    behavior: {
      ...DEFAULT_BEHAVIOR,
      createLead: true,
      tags: ["Hot Lead"],
      segmentIds: ["seg-new-leads"],
      duplicates: "ignore",
      consentChannels: ["email", "whatsapp"],
    },
    automation: { workflowId: "wf-landing-lead" },
    ownerId: "own-3",
    views: 145,
    weeklyViews: [12, 14, 16, 18, 20, 19, 22, 24],
    createdAt: "2026-06-10T09:00:00Z",
    updatedAt: "2026-09-02T14:10:00Z",
    publishedAt: "2026-06-12T08:30:00Z",
  },
  {
    id: "fm-newsletter",
    name: "Newsletter Signup",
    description: "Blog footer and sidebar. Double opt-in, tags as Newsletter.",
    type: "newsletter",
    status: "active",
    fields: [
      field("email", "email", "Email", true),
      field("first", "first_name", "First name"),
      field("consent", "consent", CONSENT_EMAIL, true),
    ],
    design: {
      ...DEFAULT_DESIGN,
      buttonLabel: "Subscribe",
      radius: "pill",
      spacing: "compact",
      successMessage:
        "Almost there - check your inbox and confirm your subscription.",
    },
    behavior: {
      ...DEFAULT_BEHAVIOR,
      tags: ["Newsletter"],
      duplicates: "ignore",
      doubleOptIn: true,
    },
    automation: { workflowId: "wf-newsletter-welcome" },
    ownerId: "own-2",
    views: 276,
    weeklyViews: [28, 31, 26, 35, 38, 33, 41, 44],
    createdAt: "2026-04-02T10:00:00Z",
    updatedAt: "2026-08-19T09:30:00Z",
    publishedAt: "2026-04-02T12:00:00Z",
  },
  {
    id: "fm-product-inquiry",
    name: "Product Inquiry",
    description: "Contact page. Every enquiry becomes a lead for the sales team.",
    type: "contact",
    status: "active",
    fields: [
      field("first", "first_name", "First name", true),
      field("last", "last_name", "Last name", true),
      field("email", "email", "Email", true),
      field("phone", "phone", "Phone"),
      field("company", "company", "Company"),
      field("interest", "dropdown", "What are you interested in?", true, {
        options: ["Starter plan", "Growth plan", "Enterprise", "Not sure yet"],
      }),
      field("message", "message", "How can we help?", true),
      field("consent", "consent", CONSENT_EMAIL),
    ],
    design: { ...DEFAULT_DESIGN, buttonLabel: "Send enquiry" },
    behavior: {
      ...DEFAULT_BEHAVIOR,
      createLead: true,
      segmentIds: ["seg-new-leads"],
    },
    automation: { workflowId: "wf-inquiry-routing" },
    ownerId: "own-1",
    views: 146,
    weeklyViews: [14, 16, 15, 19, 18, 21, 20, 23],
    createdAt: "2026-05-14T11:20:00Z",
    updatedAt: "2026-09-05T16:00:00Z",
    publishedAt: "2026-05-14T15:00:00Z",
  },
  {
    id: "fm-quote",
    name: "Wholesale Quote Request",
    description:
      "Trade page. Sales reviews every request before a contact is created.",
    type: "quote",
    status: "active",
    fields: [
      field("first", "first_name", "First name", true),
      field("last", "last_name", "Last name", true),
      field("email", "email", "Business email", true),
      field("phone", "phone", "Phone", true),
      field("company", "company", "Company", true),
      field("volume", "text", "Estimated monthly order volume", true, {
        helpText: "Units or spend per month - a rough figure is fine.",
      }),
      field("country", "dropdown", "Delivery country", false, {
        options: ["United Arab Emirates", "Nigeria", "Pakistan", "Brazil", "Other"],
      }),
      field("notes", "textarea", "Anything else we should know?"),
    ],
    design: {
      ...DEFAULT_DESIGN,
      layout: "two_column",
      buttonLabel: "Request a quote",
      buttonStyle: "dark",
      successMessage: "Thanks - our trade team will send your quote within 48 hours.",
    },
    behavior: {
      ...DEFAULT_BEHAVIOR,
      createContact: false,
      tags: ["Wholesale"],
      segmentIds: ["seg-wholesale"],
    },
    automation: { workflowId: "wf-inquiry-routing" },
    ownerId: "own-4",
    views: 92,
    weeklyViews: [8, 9, 11, 10, 12, 14, 13, 15],
    createdAt: "2026-07-01T08:00:00Z",
    updatedAt: "2026-09-10T10:40:00Z",
    publishedAt: "2026-07-01T09:00:00Z",
  },
  {
    id: "fm-whatsapp-lead",
    name: "WhatsApp Lead Form",
    description:
      "Linked from the WhatsApp catalogue. Paused while the summer offer is off.",
    type: "lead_capture",
    status: "paused",
    fields: [
      field("first", "first_name", "First name", true),
      field("phone", "phone", "WhatsApp number", true, {
        helpText: "We reply on WhatsApp, usually within the hour.",
      }),
      field("interest", "dropdown", "What would you like to know?", false, {
        options: ["Pricing", "Delivery times", "Wholesale", "Something else"],
      }),
      field(
        "consent",
        "consent",
        "I agree to receive WhatsApp messages from MarketFlow.",
        true,
      ),
    ],
    design: {
      ...DEFAULT_DESIGN,
      buttonLabel: "Message me on WhatsApp",
      spacing: "compact",
      successMessage: "Thanks - look out for our WhatsApp message.",
    },
    behavior: {
      ...DEFAULT_BEHAVIOR,
      createLead: true,
      consentChannels: ["whatsapp"],
    },
    automation: {},
    ownerId: "own-1",
    views: 125,
    weeklyViews: [22, 25, 27, 24, 18, 9, 0, 0],
    createdAt: "2026-06-20T10:00:00Z",
    updatedAt: "2026-09-01T09:00:00Z",
    publishedAt: "2026-06-21T08:00:00Z",
  },
  {
    id: "fm-webinar",
    name: "Webinar Registration",
    description: "September automation webinar. Adds registrants to the segment.",
    type: "registration",
    status: "active",
    fields: [
      field("first", "first_name", "First name", true),
      field("last", "last_name", "Last name", true),
      field("email", "email", "Email", true),
      field("company", "company", "Company"),
      field("sessions", "checkbox", "Which sessions will you attend?", false, {
        options: ["Automation basics", "WhatsApp at scale", "Live Q&A"],
      }),
      field("consent", "consent", CONSENT_EMAIL),
    ],
    design: {
      ...DEFAULT_DESIGN,
      buttonLabel: "Save my seat",
      successMessage: "You're registered - the joining link is on its way.",
    },
    behavior: { ...DEFAULT_BEHAVIOR, segmentIds: ["seg-webinar"] },
    automation: {},
    ownerId: "own-3",
    views: 99,
    weeklyViews: [0, 0, 0, 6, 21, 24, 22, 26],
    createdAt: "2026-08-15T09:00:00Z",
    updatedAt: "2026-08-28T12:00:00Z",
    publishedAt: "2026-08-15T11:00:00Z",
  },
  {
    id: "fm-feedback",
    name: "Customer Feedback",
    description: "Post-delivery survey. Not published yet - copy under review.",
    type: "custom",
    status: "draft",
    fields: [
      field("first", "first_name", "First name"),
      field("email", "email", "Email", true, {
        helpText: "The address you ordered with, so we can find your order.",
      }),
      field("score", "radio", "How likely are you to recommend us?", true, {
        options: ["Very likely", "Likely", "Not sure", "Unlikely"],
      }),
      field("better", "textarea", "What could we do better?"),
      field("followup", "checkbox", "Follow-up", false, {
        options: ["You may contact me about my answer"],
      }),
    ],
    design: { ...DEFAULT_DESIGN, buttonLabel: "Send feedback" },
    behavior: {
      ...DEFAULT_BEHAVIOR,
      createContact: false,
      tags: ["Returning Customer"],
    },
    automation: {},
    ownerId: "own-2",
    views: 0,
    weeklyViews: [0, 0, 0, 0, 0, 0, 0, 0],
    createdAt: "2026-09-11T15:00:00Z",
    updatedAt: "2026-09-12T09:20:00Z",
  },
];

/* -------------------------------------------------------------------------- */
/* Submissions                                                                */
/* -------------------------------------------------------------------------- */

interface Person {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
}

/** Someone who is not in the CRM - only ever on an unlinked submission. */
const stranger = (
  firstName: string,
  lastName: string,
  email: string,
  extra: Partial<Person> = {},
): Person => ({ firstName, lastName, email, ...extra });

const fromContact = (contactId: string): Person => {
  const record = contactById(contactId);
  if (!record) throw new Error(`form-fixtures: unknown contact ${contactId}`);
  return {
    firstName: record.firstName,
    lastName: record.lastName,
    email: record.email,
    phone: record.phone,
    company: record.company,
  };
};

/**
 * The answers a form would have captured from this person.
 *
 * Identity fields are filled from the person, so a linked submission carries
 * the contact's own email and phone; everything else comes from `answers`. A
 * field the form does not have is simply not answered - a newsletter form
 * never captured a company.
 */
function valuesFor(
  formId: string,
  person: Person,
  consent: ConsentState,
  answers: Record<string, SubmissionValue> = {},
): Record<string, SubmissionValue> {
  const form = FORMS.find((item) => item.id === formId);
  if (!form) throw new Error(`form-fixtures: unknown form ${formId}`);

  const values: Record<string, SubmissionValue> = {};
  for (const item of form.fields) {
    const identity: Partial<Record<FormFieldKind, string | undefined>> = {
      first_name: person.firstName,
      last_name: person.lastName,
      email: person.email,
      phone: person.phone,
      company: person.company,
    };

    if (item.kind in identity) {
      const value = identity[item.kind];
      if (value) values[item.id] = value;
    } else if (item.kind === "consent") {
      values[item.id] = consent !== "not_given";
    } else if (answers[item.id] !== undefined) {
      values[item.id] = answers[item.id];
    }
  }
  return values;
}

interface SubmissionSeed {
  id: string;
  formId: string;
  at: string;
  /** A contact id to link, or a stranger. */
  who: string | Person;
  status?: SubmissionStatus;
  source?: SubmissionSource;
  pageUrl?: string;
  consent?: ConsentState;
  leadId?: string;
  /** The submission created the contact rather than matching it. */
  created?: boolean;
  answers?: Record<string, SubmissionValue>;
}

const PAGES: Record<string, string> = {
  "fm-demo": "https://marketflow.app/pricing",
  "fm-newsletter": "https://marketflow.app/blog",
  "fm-product-inquiry": "https://marketflow.app/contact",
  "fm-quote": "https://marketflow.app/wholesale",
  "fm-whatsapp-lead": "https://wa.me/c/971501184420",
  "fm-webinar": "https://marketflow.app/webinars/automation-september",
};

const SEEDS: SubmissionSeed[] = [
  /* Request a Demo */
  { id: "sub-101", formId: "fm-demo", at: "2026-07-14T12:26:00Z", who: "con-6", leadId: "led-4", answers: { team: "6-20", channel: "Phone call" } },
  { id: "sub-102", formId: "fm-demo", at: "2026-08-24T10:05:00Z", who: "con-3", leadId: "led-7", source: "landing_page", pageUrl: "https://marketflow.app/lp/summer-growth", answers: { team: "1-5", channel: "Email" } },
  { id: "sub-103", formId: "fm-demo", at: "2026-08-27T09:00:00Z", who: "con-24", leadId: "led-10", created: true, answers: { team: "6-20", channel: "WhatsApp" } },
  { id: "sub-104", formId: "fm-demo", at: "2026-08-30T08:47:00Z", who: "con-5", leadId: "led-8", answers: { team: "21-50", channel: "WhatsApp" } },
  { id: "sub-105", formId: "fm-demo", at: "2026-08-30T08:52:00Z", who: "con-5", status: "duplicate", answers: { team: "21-50", channel: "WhatsApp" } },
  { id: "sub-106", formId: "fm-demo", at: "2026-09-01T11:15:00Z", who: "con-11", leadId: "led-6", created: true, answers: { team: "51+", channel: "Email" } },
  { id: "sub-107", formId: "fm-demo", at: "2026-09-12T03:14:00Z", who: stranger("Test", "Test", "test@mailinator.com", { company: "asdf" }), status: "spam", consent: "not_given", answers: { team: "1-5" } },

  /* Newsletter Signup */
  { id: "sub-201", formId: "fm-newsletter", at: "2026-07-22T19:10:00Z", who: "con-2" },
  { id: "sub-202", formId: "fm-newsletter", at: "2026-07-30T07:40:00Z", who: "con-9" },
  { id: "sub-203", formId: "fm-newsletter", at: "2026-08-06T12:15:00Z", who: "con-19" },
  { id: "sub-204", formId: "fm-newsletter", at: "2026-08-18T18:30:00Z", who: "con-17" },
  { id: "sub-205", formId: "fm-newsletter", at: "2026-08-25T08:55:00Z", who: "con-25" },
  { id: "sub-206", formId: "fm-newsletter", at: "2026-09-02T13:05:00Z", who: "con-13", source: "qr_code" },
  { id: "sub-207", formId: "fm-newsletter", at: "2026-09-05T20:20:00Z", who: "con-5" },
  { id: "sub-208", formId: "fm-newsletter", at: "2026-09-08T09:12:00Z", who: "con-2", status: "duplicate" },
  { id: "sub-209", formId: "fm-newsletter", at: "2026-09-10T02:48:00Z", who: stranger("asdf", "qwer", "x9x9@tempmail.dev"), status: "spam", consent: "not_given" },
  { id: "sub-210", formId: "fm-newsletter", at: "2026-09-11T21:40:00Z", who: stranger("Anya", "Petrova", "anya.petrova@outlook.com"), status: "awaiting_confirmation", consent: "pending" },
  { id: "sub-211", formId: "fm-newsletter", at: "2026-09-13T08:05:00Z", who: stranger("Ben", "Carter", "ben.carter@gmail.com"), status: "awaiting_confirmation", consent: "pending" },
  { id: "sub-212", formId: "fm-newsletter", at: "2026-09-14T07:30:00Z", who: stranger("Mei", "Lin", "mei@linteahouse.sg"), status: "awaiting_confirmation", consent: "pending" },

  /* Product Inquiry */
  { id: "sub-301", formId: "fm-product-inquiry", at: "2026-08-11T14:20:00Z", who: "con-17", leadId: "led-17", answers: { interest: "Growth plan", message: "We'd like to move our flower subscriptions onto WhatsApp reminders." } },
  { id: "sub-302", formId: "fm-product-inquiry", at: "2026-08-19T10:35:00Z", who: "con-20", leadId: "led-15", answers: { interest: "Enterprise", message: "Looking for bulk messaging for 40 club shops before the season." } },
  { id: "sub-303", formId: "fm-product-inquiry", at: "2026-09-04T09:12:00Z", who: "con-16", leadId: "led-9", answers: { interest: "Starter plan", message: "One café, want to send the weekly specials on WhatsApp." } },
  { id: "sub-304", formId: "fm-product-inquiry", at: "2026-09-09T12:00:00Z", who: "con-10", leadId: "led-2", source: "landing_page", pageUrl: "https://marketflow.app/lp/food-brands", answers: { interest: "Growth plan", message: "Can we run a four-week pilot across two of our brands?" } },
  { id: "sub-305", formId: "fm-product-inquiry", at: "2026-09-13T04:02:00Z", who: stranger("SEO", "Services", "rank1@seo-boost.biz", { company: "SEO Boost" }), status: "spam", consent: "not_given", answers: { interest: "Not sure yet", message: "We can get you to page one of Google in 7 days!!!" } },

  /* Wholesale Quote Request - reviewed by sales before anything is created */
  { id: "sub-401", formId: "fm-quote", at: "2026-07-28T09:30:00Z", who: "con-7", leadId: "led-13", answers: { volume: "Around 1,200 units", country: "Brazil", notes: "Q4 restock for three showrooms." } },
  { id: "sub-402", formId: "fm-quote", at: "2026-08-14T15:45:00Z", who: "con-8", leadId: "led-12", answers: { volume: "$18k per month", country: "United Arab Emirates" } },
  { id: "sub-403", formId: "fm-quote", at: "2026-09-04T10:52:00Z", who: "con-21", leadId: "led-5", answers: { volume: "3,000 metres of fabric", country: "Pakistan", notes: "Need a trade account before the autumn range." } },
  { id: "sub-404", formId: "fm-quote", at: "2026-09-10T13:20:00Z", who: stranger("Kwame", "Mensah", "kwame@mensahprint.gh", { phone: "+233 24 555 0198", company: "Mensah Print" }), status: "new", answers: { volume: "500 units", country: "Other", notes: "Printed packaging for a retail chain in Accra." } },
  { id: "sub-405", formId: "fm-quote", at: "2026-09-12T10:05:00Z", who: stranger("Leila", "Farouk", "leila@farouk-events.com", { phone: "+971 55 402 7781", company: "Farouk Events" }), status: "new", answers: { volume: "$6k per month", country: "United Arab Emirates" } },
  /* Already a contact - linking this one matches Marco rather than creating
     a second record for him. */
  { id: "sub-406", formId: "fm-quote", at: "2026-09-13T11:30:00Z", who: "con-20", status: "new", answers: { volume: "60 team kits", country: "Other", notes: "Second order for the youth league." } },

  /* WhatsApp Lead Form - paused since Sep 1 */
  { id: "sub-501", formId: "fm-whatsapp-lead", at: "2026-07-24T17:05:00Z", who: "con-1", leadId: "led-1", source: "whatsapp_link", answers: { interest: "Pricing" } },
  { id: "sub-502", formId: "fm-whatsapp-lead", at: "2026-08-09T11:40:00Z", who: "con-23", leadId: "led-14", source: "whatsapp_link", answers: { interest: "Wholesale" } },
  { id: "sub-503", formId: "fm-whatsapp-lead", at: "2026-08-20T16:25:00Z", who: "con-15", leadId: "led-16", source: "qr_code", answers: { interest: "Delivery times" } },

  /* Webinar Registration */
  { id: "sub-601", formId: "fm-webinar", at: "2026-08-20T08:10:00Z", who: "con-18", answers: { sessions: ["Automation basics", "Live Q&A"] } },
  { id: "sub-602", formId: "fm-webinar", at: "2026-08-22T12:40:00Z", who: "con-12", answers: { sessions: ["WhatsApp at scale"] } },
  { id: "sub-603", formId: "fm-webinar", at: "2026-08-28T09:25:00Z", who: "con-27", answers: { sessions: ["Automation basics"] } },
  { id: "sub-604", formId: "fm-webinar", at: "2026-09-01T14:00:00Z", who: "con-19", consent: "not_given", answers: { sessions: ["Live Q&A"] } },
  { id: "sub-605", formId: "fm-webinar", at: "2026-09-07T10:50:00Z", who: "con-9", answers: { sessions: ["Automation basics", "WhatsApp at scale", "Live Q&A"] } },
];

export const FORM_SUBMISSIONS: FormSubmission[] = SEEDS.map((seed) => {
  const form = FORMS.find((item) => item.id === seed.formId);
  const status = seed.status ?? "processed";
  const consent = seed.consent ?? "granted";
  const person = typeof seed.who === "string" ? fromContact(seed.who) : seed.who;

  /* Only a processed or duplicate submission is linked. `new` is linked by a
     person on review, and the rest never are. */
  const linked =
    typeof seed.who === "string" &&
    (status === "processed" || status === "duplicate");

  return {
    id: seed.id,
    formId: seed.formId,
    submittedAt: seed.at,
    source: seed.source ?? "website",
    pageUrl:
      seed.pageUrl ?? (seed.source === "qr_code" ? undefined : PAGES[seed.formId]),
    values: valuesFor(seed.formId, person, consent, seed.answers),
    status,
    consent,
    contactId: linked ? (seed.who as string) : undefined,
    contactCreated: linked ? Boolean(seed.created) : undefined,
    leadId: seed.leadId,
    /* A duplicate ran nothing, so it tagged nothing. */
    tags: status === "processed" ? [...(form?.behavior.tags ?? [])] : [],
  };
});

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

/** The workflows a form can connect to: those listening for `form.submitted`. */
export const FORM_WORKFLOWS = WORKFLOWS.filter(
  (workflow) =>
    workflow.triggerKey === "form.submitted" && workflow.status !== "archived",
);

export const formWorkflowById = (id?: string) =>
  id ? WORKFLOWS.find((workflow) => workflow.id === id) : undefined;

/** The identity a submission captured, read off its fields by kind. */
export function capturedIdentity(form: Form | undefined, submission: FormSubmission) {
  const byKind = (kind: FormFieldKind) => {
    const item = form?.fields.find((candidate) => candidate.kind === kind);
    const value = item ? submission.values[item.id] : undefined;
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  };

  return {
    firstName: byKind("first_name") ?? "",
    lastName: byKind("last_name") ?? "",
    email: byKind("email"),
    phone: byKind("phone"),
    company: byKind("company"),
  };
}

/**
 * An existing contact with this email or phone, if there is one.
 *
 * Email first, because it is the identity field people type most carefully;
 * phone second, normalised to digits so "+971 50 118 4420" and "971501184420"
 * are the same person. This is the rule that stops a form from ever creating a
 * second record for somebody the CRM already knows.
 */
export function matchContact(
  identity: { email?: string; phone?: string },
  extra: SessionContact[] = [],
): { id: string; session: boolean } | null {
  const email = identity.email?.toLowerCase();
  const digits = identity.phone?.replace(/\D/g, "");

  const byEmail = (value?: string) => Boolean(email && value?.toLowerCase() === email);
  const byPhone = (value?: string) =>
    Boolean(digits && digits.length >= 7 && value?.replace(/\D/g, "") === digits);

  const crm =
    CONTACTS.find((item) => byEmail(item.email)) ??
    CONTACTS.find((item) => byPhone(item.phone) || byPhone(item.whatsappNumber));
  if (crm) return { id: crm.id, session: false };

  const session =
    extra.find((item) => byEmail(item.email)) ??
    extra.find((item) => byPhone(item.phone));
  return session ? { id: session.id, session: true } : null;
}

export const leadById = (id?: string) =>
  id ? LEADS.find((lead) => lead.id === id) : undefined;

/** An open lead the contact already has - linking to it beats opening another. */
export const openLeadForContact = (contactId: string) =>
  LEADS.find(
    (lead) => lead.contactId === contactId && lead.stage !== "won" && lead.stage !== "lost",
  );
