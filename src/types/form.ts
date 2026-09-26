import type { ContactChannel } from "./contact";
import type { LeadSource, LeadStage } from "./lead";

/**
 * The Forms & Lead Capture module's data model.
 *
 * A form is the front door of the CRM, not a second CRM. Nothing here stores a
 * person: a submission records what was typed and then *points at* the
 * contact and lead it matched or created, by id into the Customers module's
 * records. That is what keeps "Sarah Ahmed" one person whether she is read on
 * a submission, a lead card or a segment - the name on a linked submission is
 * always resolved from the contact, never from the copy the form captured.
 *
 * Shaped like the API responses it will eventually be - ids rather than
 * embedded objects, ISO timestamps, aggregates the server would compute - so
 * swapping `lib/form-fixtures` for a fetch is the only change the UI needs.
 */

/* -------------------------------------------------------------------------- */
/* Form                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Three states, because a form is either not yet public, public, or public and
 * deliberately refusing submissions. Paused rather than deleted is what a
 * merchant wants when a campaign ends but the embed is still on forty pages.
 */
export type FormStatus = "draft" | "active" | "paused";

export type FormType =
  | "lead_capture"
  | "contact"
  | "newsletter"
  | "quote"
  | "registration"
  | "custom";

/**
 * Field kinds, as two families.
 *
 * The first six are *identity and CRM* fields: they map onto a contact
 * property, so a submission can be matched against Customers and written into
 * it. The rest are *generic* inputs whose answers are kept on the submission.
 * `consent` is its own kind rather than a checkbox with a label, because it is
 * the one answer that changes what the workspace is allowed to send.
 */
export type FormFieldKind =
  | "first_name"
  | "last_name"
  | "email"
  | "phone"
  | "company"
  | "message"
  | "text"
  | "textarea"
  | "dropdown"
  | "checkbox"
  | "radio"
  | "consent";

export interface FormField {
  id: string;
  kind: FormFieldKind;
  label: string;
  required: boolean;
  helpText?: string;
  /** Dropdown, radio and checkbox-group choices. */
  options?: string[];
  /**
   * The one channel a consent box grants.
   *
   * Consent is per channel, never blanket: a visitor who ticks "email me" has
   * not agreed to WhatsApp, and a form that subscribes them to every channel
   * off one box is exactly the thing the WhatsApp and SMS policies forbid. A
   * form that asks for two channels has two consent fields.
   */
  consentChannel?: ContactChannel;
}

export type FormLayout = "stacked" | "two_column";
export type FormButtonStyle = "primary" | "dark" | "outline";
export type FormRadius = "square" | "rounded" | "pill";
export type FormSpacing = "compact" | "comfortable" | "spacious";

/**
 * What the embedded form looks like - deliberately a short list.
 *
 * A form sits inside somebody else's page, so it takes that page's width and
 * background and only these few choices of its own. Anything beyond them - a
 * colour picker, a font, a hero image - is a landing page builder, which this
 * is not.
 */
export interface FormDesign {
  layout: FormLayout;
  buttonLabel: string;
  buttonStyle: FormButtonStyle;
  radius: FormRadius;
  spacing: FormSpacing;
  successMessage: string;
}

/**
 * What happens to a submission once it lands.
 *
 * The CRM steps here are the fixed, always-on part of lead capture - match or
 * create the contact, open a lead, tag it, drop it in a segment. Anything
 * conditional or delayed ("and three days later, if they have not replied")
 * belongs to the connected workflow in Automation, not to a second rule engine
 * living inside Forms.
 */
export interface FormBehavior {
  onSuccess: "message" | "redirect";
  /** Used when `onSuccess` is `redirect`. */
  redirectUrl?: string;
  /** Match by email, then phone; create the contact only when nothing matches. */
  createContact: boolean;
  createLead: boolean;
  /** Written on the lead, for attribution in the pipeline. */
  leadSource: LeadSource;
  /** The pipeline stage a new lead opens in. */
  leadStage: LeadStage;
  /** Tag names from Customers → Tags. */
  tags: string[];
  /** Segment ids from Customers → Segments. */
  segmentIds: string[];
  /**
   * A repeat submission from someone already matched.
   *
   * `update` records it and updates the contact; `ignore` records it as a
   * duplicate and runs nothing, for forms people tend to double-submit.
   * Neither ever creates a second contact - dedupe is by identity, always.
   */
  duplicates: "update" | "ignore";
  /**
   * Email double opt-in: the contact is not subscribed until they click the
   * confirmation link, and the submission waits in `awaiting_confirmation`.
   */
  doubleOptIn: boolean;
}

/**
 * The Automation link.
 *
 * A form does not run workflows - it raises `form.submitted`, and the workflow
 * listening for it does the rest. This records which workflow that is. With
 * the API, connecting writes the workflow's trigger filter (`start.formId`);
 * here the form carries the link so both screens can read it.
 */
export interface FormAutomation {
  workflowId?: string;
}

export interface Form {
  id: string;
  name: string;
  /** Internal only - never rendered on the public form. */
  description: string;
  type: FormType;
  status: FormStatus;
  fields: FormField[];
  design: FormDesign;
  behavior: FormBehavior;
  automation: FormAutomation;
  ownerId: string;
  /** Form impressions, reported by the embed script. */
  views: number;
  /** The same views, per week, oldest first - for the trend chart. */
  weeklyViews: number[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

/* -------------------------------------------------------------------------- */
/* Submissions                                                                */
/* -------------------------------------------------------------------------- */

/**
 * - `processed`: the CRM steps ran - contact matched or created, lead opened.
 * - `new`: received but not yet linked, because the form does not create
 *   contacts on its own. Somebody reviews it and links it by hand.
 * - `duplicate`: a repeat the form is set to ignore. Recorded, nothing ran.
 * - `awaiting_confirmation`: double opt-in, waiting on the email link.
 * - `spam`: caught by the honeypot. Kept for audit, never linked.
 */
export type SubmissionStatus =
  | "processed"
  | "new"
  | "duplicate"
  | "awaiting_confirmation"
  | "spam";

export type SubmissionSource =
  | "website"
  | "landing_page"
  | "whatsapp_link"
  | "qr_code"
  | "preview";

export type ConsentState = "granted" | "not_given" | "pending";

/** An answer, as the form captured it. */
export type SubmissionValue = string | boolean | string[];

export interface FormSubmission {
  id: string;
  formId: string;
  submittedAt: string;
  source: SubmissionSource;
  /** The page it was submitted from, where the embed reported one. */
  pageUrl?: string;
  /**
   * The UTM parameters on that page's URL, which the embed forwards - the same
   * three the campaign wizard writes onto its links, so a campaign's clicks
   * and the leads they produced carry one campaign name.
   */
  utm?: { source: string; medium: string; campaign: string };
  /** Keyed by `FormField.id`. */
  values: Record<string, SubmissionValue>;
  status: SubmissionStatus;
  /** Marketing consent overall: granted, pending double opt-in, or not given. */
  consent: ConsentState;
  /**
   * The channels this submission opted in to, from its consent boxes. Email
   * is left out while a double opt-in is still pending.
   */
  optIns: ContactChannel[];
  /**
   * The contact this submission resolved to. Unset until it is linked.
   * `contactCreated` says whether this submission made the record or matched
   * one that already existed - the difference between "new lead" and "a
   * customer asked again".
   */
  contactId?: string;
  contactCreated?: boolean;
  leadId?: string;
  /** Tags this submission applied, so the drawer can say where they came from. */
  tags: string[];
}

/**
 * A CRM record created from a submission in this browser session.
 *
 * Customers and Leads read the CRM's own records; until the CRM API exists a
 * contact made here has nowhere durable to go. It is kept beside the
 * submission, deduplicated by email and phone like any other contact, and the
 * UI labels it as session-scoped rather than pretending it reached Customers.
 */
export interface SessionContact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  tags: string[];
  createdAt: string;
}

export interface SessionLead {
  id: string;
  contactId: string;
  title: string;
  source: LeadSource;
  stage: LeadStage;
  ownerId?: string;
  createdAt: string;
}
