import type {
  ConsentState,
  FormButtonStyle,
  FormDesign,
  FormBehavior,
  FormFieldKind,
  FormLayout,
  FormRadius,
  FormSpacing,
  FormStatus,
  FormType,
  SubmissionSource,
  SubmissionStatus,
} from "@/types/form";

/**
 * The Forms module's vocabulary.
 *
 * Labels live here rather than beside the components that print them, because
 * four surfaces - the list, the builder, the detail page and the Automation
 * trigger picker - all say "Request a Quote" and have to say it the same way.
 */

/** The detail page's tabs. Here, not in the client component, so the server
    page can validate `?tab=` against the real list. */
export const FORM_TABS = ["overview", "submissions", "form", "automation", "settings"] as const;
export type FormTab = (typeof FORM_TABS)[number];

export const FORM_ROUTES = {
  list: "/dashboard/forms",
  create: "/dashboard/forms/new",
  form: (id: string) => `/dashboard/forms/${id}`,
  edit: (id: string) => `/dashboard/forms/${id}/edit`,
} as const;

/**
 * Where the hosted form and its embed script will be served from.
 *
 * One constant, because it is the one thing the backend decides. There is no
 * form host behind it yet - the embed dialog says so - and when there is,
 * this is the line that changes.
 */
export const FORMS_EMBED_ORIGIN = "https://forms.marketflow.app";

export const FORM_STATUSES: { value: FormStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "draft", label: "Draft" },
];

export const FORM_TYPES: { value: FormType; label: string; hint: string }[] = [
  {
    value: "lead_capture",
    label: "Lead Capture",
    hint: "Qualify interest and open a lead in the pipeline.",
  },
  {
    value: "contact",
    label: "Contact",
    hint: "A general enquiry that should reach a person.",
  },
  {
    value: "newsletter",
    label: "Newsletter",
    hint: "An email address and a consent box, nothing more.",
  },
  {
    value: "quote",
    label: "Request a Quote",
    hint: "Volume, timing and budget for a sales follow-up.",
  },
  {
    value: "registration",
    label: "Registration",
    hint: "Sign-ups for an event, a webinar or a waitlist.",
  },
  {
    value: "custom",
    label: "Custom",
    hint: "Start from the email field and build the rest.",
  },
];

export const formTypeLabel = (type: FormType) =>
  FORM_TYPES.find((item) => item.value === type)?.label ?? type;

export const SUBMISSION_STATUSES: { value: SubmissionStatus; label: string }[] = [
  { value: "processed", label: "Processed" },
  { value: "new", label: "Needs review" },
  { value: "awaiting_confirmation", label: "Awaiting opt-in" },
  { value: "duplicate", label: "Duplicate" },
  { value: "spam", label: "Spam" },
];

export const submissionStatusLabel = (status: SubmissionStatus) =>
  SUBMISSION_STATUSES.find((item) => item.value === status)?.label ?? status;

export const SUBMISSION_SOURCES: { value: SubmissionSource; label: string }[] = [
  { value: "website", label: "Website embed" },
  { value: "landing_page", label: "Landing page" },
  { value: "whatsapp_link", label: "WhatsApp link" },
  { value: "qr_code", label: "QR code" },
  { value: "preview", label: "Preview test" },
];

export const submissionSourceLabel = (source: SubmissionSource) =>
  SUBMISSION_SOURCES.find((item) => item.value === source)?.label ?? source;

export const CONSENT_LABEL: Record<ConsentState, string> = {
  granted: "Granted",
  not_given: "Not given",
  pending: "Pending opt-in",
};

/* -------------------------------------------------------------------------- */
/* Field palette                                                              */
/* -------------------------------------------------------------------------- */

export interface FieldKindMeta {
  kind: FormFieldKind;
  label: string;
  /** The contact property the answer is written to, when it maps to one. */
  crmProperty?: string;
  /** Whether the kind takes a list of choices. */
  hasOptions?: boolean;
  /** Only one per form - two email fields cannot both be the identity. */
  unique?: boolean;
  group: "contact" | "input";
}

export const FIELD_KINDS: FieldKindMeta[] = [
  { kind: "first_name", label: "First Name", crmProperty: "First name", unique: true, group: "contact" },
  { kind: "last_name", label: "Last Name", crmProperty: "Last name", unique: true, group: "contact" },
  { kind: "email", label: "Email", crmProperty: "Email", unique: true, group: "contact" },
  { kind: "phone", label: "Phone", crmProperty: "Phone", unique: true, group: "contact" },
  { kind: "company", label: "Company", crmProperty: "Company", unique: true, group: "contact" },
  { kind: "message", label: "Message", crmProperty: "Lead notes", unique: true, group: "contact" },
  { kind: "text", label: "Text", group: "input" },
  { kind: "textarea", label: "Textarea", group: "input" },
  { kind: "dropdown", label: "Dropdown", hasOptions: true, group: "input" },
  { kind: "radio", label: "Radio", hasOptions: true, group: "input" },
  { kind: "checkbox", label: "Checkbox", hasOptions: true, group: "input" },
  /* Not unique: consent is per channel, so a form asking for email and
     WhatsApp carries one box for each. */
  { kind: "consent", label: "Consent Checkbox", group: "input" },
];

export const fieldKindMeta = (kind: FormFieldKind) =>
  FIELD_KINDS.find((item) => item.kind === kind) ?? FIELD_KINDS[6];

/* -------------------------------------------------------------------------- */
/* Design and behaviour                                                       */
/* -------------------------------------------------------------------------- */

export const FORM_LAYOUTS: { value: FormLayout; label: string; hint: string }[] = [
  { value: "stacked", label: "Stacked", hint: "One field per row. Best for narrow sidebars." },
  { value: "two_column", label: "Two columns", hint: "Short fields pair up on wide screens." },
];

export const BUTTON_STYLES: { value: FormButtonStyle; label: string }[] = [
  { value: "primary", label: "Brand gradient" },
  { value: "dark", label: "Solid dark" },
  { value: "outline", label: "Outline" },
];

export const FORM_RADII: { value: FormRadius; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "pill", label: "Pill" },
];

export const FORM_SPACINGS: { value: FormSpacing; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
];

export const DUPLICATE_RULES: {
  value: FormBehavior["duplicates"];
  label: string;
  hint: string;
}[] = [
  {
    value: "update",
    label: "Update the existing contact",
    hint: "Record the repeat and refresh the contact with the new answers.",
  },
  {
    value: "ignore",
    label: "Ignore repeat submissions",
    hint: "Record it as a duplicate and run nothing - for forms people double-submit.",
  },
];

export const DEFAULT_DESIGN: FormDesign = {
  layout: "stacked",
  buttonLabel: "Submit",
  buttonStyle: "primary",
  radius: "rounded",
  spacing: "comfortable",
  successMessage: "Thanks - we have your details and will be in touch shortly.",
};

export const DEFAULT_BEHAVIOR: FormBehavior = {
  onSuccess: "message",
  createContact: true,
  createLead: false,
  leadSource: "website",
  leadStage: "new",
  tags: [],
  segmentIds: [],
  duplicates: "update",
  doubleOptIn: false,
};
