"use client";

import { useSyncExternalStore } from "react";

import { DEFAULT_BEHAVIOR, DEFAULT_DESIGN } from "@/constants/forms";
import { contactById } from "@/lib/customer-fixtures";
import {
  FORMS,
  FORM_SUBMISSIONS,
  capturedIdentity,
  formWorkflowById,
  leadById,
  matchContact,
  openLeadForContact,
  optInsOf,
} from "@/lib/form-fixtures";
import type { LeadStage } from "@/types/lead";
import type {
  Form,
  FormField,
  FormStatus,
  FormSubmission,
  SessionContact,
  SessionLead,
  SubmissionValue,
} from "@/types/form";

/**
 * The Forms module's records, plus whatever has changed this session.
 *
 * The same shape as `lib/social-post-store` and `lib/webhook-store`: one
 * module-level snapshot behind a `useSyncExternalStore` subscription, so the
 * list, the builder, the detail page and the Automation trigger picker all
 * read one set of forms. Pausing a form on its detail page pauses it in the
 * list, because both are looking at the same object.
 *
 * Session-scoped, and the UI says so. There is no forms service yet; a reload
 * starts from the fixtures again. That includes the CRM records a submission
 * can create - see `SessionContact` in `types/form` for why they live here
 * rather than being passed off as written to Customers.
 */

export interface FormState {
  forms: Form[];
  submissions: FormSubmission[];
  contacts: SessionContact[];
  leads: SessionLead[];
  /**
   * Owners assigned from a submission, by lead id. Kept apart from the lead
   * records because the Leads board reads the CRM's own - see the session
   * notice on the Submissions tab.
   */
  assignments: Record<string, string>;
}

const INITIAL: FormState = {
  forms: FORMS,
  submissions: FORM_SUBMISSIONS,
  contacts: [],
  leads: [],
  assignments: {},
};

/* The server renders the fixtures, so the first client snapshot has to be the
   identical object or hydration disagrees with itself. */
let snapshot: FormState = INITIAL;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: Partial<FormState>) {
  snapshot = { ...snapshot, ...next };
  for (const listener of listeners) listener();
}

/** Everything, for a surface that joins forms to submissions. */
export function useFormState(): FormState {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => INITIAL,
  );
}

export function useForms(): Form[] {
  return useFormState().forms;
}

export function useForm(id: string): Form | null {
  return useForms().find((form) => form.id === id) ?? null;
}

/* -------------------------------------------------------------------------- */
/* Ids and time                                                               */
/* -------------------------------------------------------------------------- */

let sequence = 0;

/** Minted in handlers only - with the API, the server owns ids. */
function mintId(prefix: string) {
  sequence += 1;
  return `${prefix}-session-${Date.now().toString(36)}-${sequence}`;
}

const now = () => new Date().toISOString();

/* -------------------------------------------------------------------------- */
/* Forms                                                                      */
/* -------------------------------------------------------------------------- */

/** What the builder edits. Views and timestamps are the service's to set. */
export type FormDraft = Pick<
  Form,
  | "name"
  | "description"
  | "type"
  | "status"
  | "fields"
  | "design"
  | "behavior"
  | "automation"
  | "ownerId"
>;

export function createForm(draft: FormDraft): Form {
  const at = now();
  const form: Form = {
    ...draft,
    id: mintId("fm"),
    views: 0,
    weeklyViews: [0, 0, 0, 0, 0, 0, 0, 0],
    createdAt: at,
    updatedAt: at,
    publishedAt: draft.status === "draft" ? undefined : at,
  };

  commit({ forms: [form, ...snapshot.forms] });
  return form;
}

export function updateForm(id: string, draft: FormDraft): Form | null {
  const current = snapshot.forms.find((form) => form.id === id);
  if (!current) return null;

  const at = now();
  const updated: Form = {
    ...current,
    ...draft,
    id,
    updatedAt: at,
    /* The first publish is a date worth keeping; later ones are not. */
    publishedAt:
      current.publishedAt ?? (draft.status === "draft" ? undefined : at),
  };

  commit({
    forms: snapshot.forms.map((form) => (form.id === id ? updated : form)),
  });
  return updated;
}

/**
 * Publish, pause or resume.
 *
 * A form goes back to Draft only by editing it, never from here: unpublishing
 * a form that is embedded on live pages is a pause, and "draft" would suggest
 * the embed had somehow been taken down.
 */
export function setFormStatus(id: string, status: FormStatus) {
  const at = now();
  commit({
    forms: snapshot.forms.map((form) =>
      form.id === id
        ? {
            ...form,
            status,
            updatedAt: at,
            publishedAt: form.publishedAt ?? (status === "active" ? at : undefined),
          }
        : form,
    ),
  });
}

/**
 * A copy as a fresh draft - fields, design and behaviour, none of the history.
 * Carrying the original's views would put invented traffic on a form nobody
 * has seen, and a draft copy is not embedded anywhere yet.
 */
export function duplicateForm(id: string): Form | null {
  const source = snapshot.forms.find((form) => form.id === id);
  if (!source) return null;

  return createForm({
    name: `${source.name} (copy)`,
    description: source.description,
    type: source.type,
    status: "draft",
    fields: source.fields.map((item) => ({ ...item })),
    design: { ...source.design },
    behavior: { ...source.behavior },
    automation: { ...source.automation },
    ownerId: source.ownerId,
  });
}

/**
 * Deletes a form and its submissions.
 *
 * The contacts and leads those submissions resolved to stay - they belong to
 * the CRM, and deleting a form must never delete a customer.
 */
export function deleteForm(id: string) {
  commit({
    forms: snapshot.forms.filter((form) => form.id !== id),
    submissions: snapshot.submissions.filter((item) => item.formId !== id),
  });
}

/* -------------------------------------------------------------------------- */
/* Import / export                                                            */
/* -------------------------------------------------------------------------- */

export const EXPORT_FORMAT = "marketflow.forms/v1";

/** The definitions only - never submissions, which are personal data. */
export function exportDefinitions(forms: Form[]) {
  return {
    format: EXPORT_FORMAT,
    exportedAt: now(),
    forms: forms.map((form) => ({
      name: form.name,
      description: form.description,
      type: form.type,
      fields: form.fields,
      design: form.design,
      behavior: form.behavior,
    })),
  };
}

const FIELD_KINDS = new Set<string>([
  "first_name",
  "last_name",
  "email",
  "phone",
  "company",
  "message",
  "text",
  "textarea",
  "dropdown",
  "checkbox",
  "radio",
  "consent",
]);

const FORM_TYPE_KEYS = new Set<string>([
  "lead_capture",
  "contact",
  "newsletter",
  "quote",
  "registration",
  "custom",
]);

/**
 * Reads an export file back in, as drafts.
 *
 * Every form arrives as a draft with no automation link: a file from another
 * workspace names workflows this one does not have, and an imported form going
 * live before anybody has looked at it is how a stranger's lead form ends up on
 * the pricing page.
 */
export function importDefinitions(
  raw: unknown,
  ownerId: string,
): { imported: number } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "That file is not a forms export." };
  const file = raw as { format?: unknown; forms?: unknown };
  if (file.format !== EXPORT_FORMAT || !Array.isArray(file.forms)) {
    return { error: "That file is not a MarketFlow forms export." };
  }

  const created: Form[] = [];
  for (const entry of file.forms as Record<string, unknown>[]) {
    const name = typeof entry?.name === "string" ? entry.name.trim() : "";
    const fields = Array.isArray(entry?.fields) ? (entry.fields as FormField[]) : [];
    const validFields = fields.filter(
      (item) =>
        item &&
        typeof item.label === "string" &&
        typeof item.kind === "string" &&
        FIELD_KINDS.has(item.kind),
    );
    if (!name || validFields.length === 0) continue;

    const at = now();
    created.push({
      id: mintId("fm"),
      name,
      description: typeof entry.description === "string" ? entry.description : "",
      type:
        typeof entry.type === "string" && FORM_TYPE_KEYS.has(entry.type)
          ? (entry.type as Form["type"])
          : "custom",
      status: "draft",
      fields: validFields.map((item) => ({
        id: mintId("fld"),
        kind: item.kind,
        label: item.label,
        required: Boolean(item.required),
        helpText: typeof item.helpText === "string" ? item.helpText : undefined,
        options: Array.isArray(item.options)
          ? item.options.filter((option): option is string => typeof option === "string")
          : undefined,
      })),
      design: { ...DEFAULT_DESIGN, ...(entry.design as object) },
      behavior: { ...DEFAULT_BEHAVIOR, ...(entry.behavior as object) },
      automation: {},
      ownerId,
      views: 0,
      weeklyViews: [0, 0, 0, 0, 0, 0, 0, 0],
      createdAt: at,
      updatedAt: at,
    });
  }

  if (created.length === 0) {
    return { error: "No forms in that file had a name and at least one field." };
  }

  commit({ forms: [...created, ...snapshot.forms] });
  return { imported: created.length };
}

/* -------------------------------------------------------------------------- */
/* Submissions and the CRM                                                    */
/* -------------------------------------------------------------------------- */

function patchSubmission(id: string, patch: Partial<FormSubmission>) {
  commit({
    submissions: snapshot.submissions.map((item) =>
      item.id === id ? { ...item, ...patch } : item,
    ),
  });
}

export type ContactLinkResult =
  | { outcome: "matched"; contactId: string; session: boolean }
  | { outcome: "created"; contactId: string }
  | { outcome: "missing-identity" };

/**
 * Resolves a submission to a contact - matching first, creating only if
 * nothing matches.
 *
 * This is the one place a form can add a person, and it will not add one the
 * CRM already has: `matchContact` checks email and then phone against
 * Customers, and then against contacts made earlier this session. A submission
 * with neither an email nor a phone cannot be deduplicated, so it is refused
 * rather than turned into an anonymous record.
 */
export function linkContact(submissionId: string): ContactLinkResult {
  const submission = snapshot.submissions.find((item) => item.id === submissionId);
  const form = snapshot.forms.find((item) => item.id === submission?.formId);
  if (!submission) return { outcome: "missing-identity" };

  const identity = capturedIdentity(form, submission);
  if (!identity.email && !identity.phone) return { outcome: "missing-identity" };

  const match = matchContact(identity, snapshot.contacts);
  const status =
    submission.status === "new" ? ("processed" as const) : submission.status;

  if (match) {
    patchSubmission(submissionId, {
      contactId: match.id,
      contactCreated: false,
      status,
    });
    return { outcome: "matched", contactId: match.id, session: match.session };
  }

  const contact: SessionContact = {
    id: mintId("con"),
    firstName: identity.firstName || identity.email?.split("@")[0] || "Unknown",
    lastName: identity.lastName,
    email: identity.email,
    phone: identity.phone,
    company: identity.company,
    tags: [...submission.tags],
    createdAt: now(),
  };

  snapshot = { ...snapshot, contacts: [contact, ...snapshot.contacts] };
  patchSubmission(submissionId, {
    contactId: contact.id,
    contactCreated: true,
    status,
  });
  return { outcome: "created", contactId: contact.id };
}

export type LeadLinkResult =
  | { outcome: "existing"; leadId: string }
  | { outcome: "created"; leadId: string }
  | { outcome: "no-contact" };

/**
 * Opens a lead for a submission's contact - or links the one already open.
 *
 * A lead belongs to a contact, so a submission has to be linked first. And a
 * contact with an open deal gets that deal, not a second card in the same
 * column of the pipeline.
 */
export function linkLead(submissionId: string): LeadLinkResult {
  const submission = snapshot.submissions.find((item) => item.id === submissionId);
  const form = snapshot.forms.find((item) => item.id === submission?.formId);
  if (!submission?.contactId) return { outcome: "no-contact" };

  const existing =
    openLeadForContact(submission.contactId) ??
    snapshot.leads.find((lead) => lead.contactId === submission.contactId);

  if (existing) {
    patchSubmission(submissionId, { leadId: existing.id });
    return { outcome: "existing", leadId: existing.id };
  }

  const identity = capturedIdentity(form, submission);
  const who =
    identity.company ||
    [identity.firstName, identity.lastName].filter(Boolean).join(" ") ||
    "New contact";

  const lead: SessionLead = {
    id: mintId("led"),
    contactId: submission.contactId,
    title: `${who} - ${form?.name ?? "Form"}`,
    source: form?.behavior.leadSource ?? "website",
    stage: form?.behavior.leadStage ?? "new",
    createdAt: now(),
  };

  snapshot = { ...snapshot, leads: [lead, ...snapshot.leads] };
  patchSubmission(submissionId, { leadId: lead.id });
  return { outcome: "created", leadId: lead.id };
}

/** Hands a submission's lead to a team member. */
export function assignLead(leadId: string, ownerId: string) {
  commit({
    leads: snapshot.leads.map((lead) =>
      lead.id === leadId ? { ...lead, ownerId } : lead,
    ),
    assignments: { ...snapshot.assignments, [leadId]: ownerId },
  });
}

/** Tags a submission applied. Mirrored onto a session contact it created. */
export function addSubmissionTags(submissionId: string, tags: string[]) {
  const submission = snapshot.submissions.find((item) => item.id === submissionId);
  if (!submission) return;

  const merged = [...new Set([...submission.tags, ...tags])];

  snapshot = {
    ...snapshot,
    contacts: snapshot.contacts.map((contact) =>
      contact.id === submission.contactId
        ? { ...contact, tags: [...new Set([...contact.tags, ...tags])] }
        : contact,
    ),
  };
  patchSubmission(submissionId, { tags: merged });
}

/**
 * A submission made from the preview.
 *
 * It runs the form's own behaviour for real - match or create the contact,
 * open the lead, apply the tags - so a merchant can watch one submission go
 * through the pipeline before the form is live. It is recorded as a Preview
 * test and kept out of the conversion figures, because nobody visited a page
 * to make it.
 */
export function recordPreviewSubmission(
  formId: string,
  values: Record<string, SubmissionValue>,
): FormSubmission | null {
  const form = snapshot.forms.find((item) => item.id === formId);
  if (!form) return null;

  const consentGiven = form.fields.some(
    (item) => item.kind === "consent" && values[item.id] === true,
  );

  const submission: FormSubmission = {
    id: mintId("sub"),
    formId,
    submittedAt: now(),
    source: "preview",
    values,
    status: form.behavior.createContact ? "processed" : "new",
    consent: !consentGiven
      ? "not_given"
      : form.behavior.doubleOptIn
        ? "pending"
        : "granted",
    optIns: [],
    tags: form.behavior.createContact ? [...form.behavior.tags] : [],
  };
  submission.optIns = optInsOf(form, values, submission.consent);

  if (form.behavior.createContact && form.behavior.doubleOptIn && consentGiven) {
    submission.status = "awaiting_confirmation";
    submission.tags = [];
  }

  commit({ submissions: [submission, ...snapshot.submissions] });

  if (submission.status === "processed") {
    const linked = linkContact(submission.id);
    if (linked.outcome === "missing-identity") {
      patchSubmission(submission.id, { status: "new", tags: [] });
    } else if (form.behavior.createLead) {
      linkLead(submission.id);
    }
  }

  return snapshot.submissions.find((item) => item.id === submission.id) ?? null;
}

/* -------------------------------------------------------------------------- */
/* Resolving links                                                            */
/* -------------------------------------------------------------------------- */

export interface ResolvedContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  tags: string[];
  /** Made from a submission this session, rather than read from Customers. */
  session: boolean;
}

/**
 * The contact a submission points at, read from the CRM first.
 *
 * This is what the submission table prints as the person's name, which is the
 * point: a linked submission shows the contact's identity, not the copy the
 * form captured, so a name corrected in Customers is corrected here too.
 */
export function resolveContact(state: FormState, id?: string): ResolvedContact | null {
  if (!id) return null;

  const crm = contactById(id);
  if (crm) {
    return {
      id,
      name: `${crm.firstName} ${crm.lastName}`.trim(),
      email: crm.email,
      phone: crm.phone,
      company: crm.company,
      tags: crm.tags,
      session: false,
    };
  }

  const made = state.contacts.find((item) => item.id === id);
  return made
    ? {
        id,
        name: `${made.firstName} ${made.lastName}`.trim(),
        email: made.email,
        phone: made.phone,
        company: made.company,
        tags: made.tags,
        session: true,
      }
    : null;
}

export interface ResolvedLead {
  id: string;
  title: string;
  stage: LeadStage;
  ownerId?: string;
  session: boolean;
}

export function resolveLead(state: FormState, id?: string): ResolvedLead | null {
  if (!id) return null;

  const crm = leadById(id);
  if (crm) {
    return {
      id,
      title: crm.title,
      stage: crm.stage,
      ownerId: state.assignments[id] ?? crm.ownerId,
      session: false,
    };
  }

  const made = state.leads.find((item) => item.id === id);
  return made
    ? { id, title: made.title, stage: made.stage, ownerId: made.ownerId, session: true }
    : null;
}

/**
 * The `form.submitted` event, as Automation receives it.
 *
 * One builder, so the payload a merchant inspects on a submission is the
 * payload the trigger registry documents and a workflow's variables read. It
 * is raised after the form's CRM steps, which is why `contact_id` and
 * `lead_id` are already resolved: the workflow listening for it acts on a
 * known person rather than creating one. Field answers are keyed by field
 * label, lower-snake-cased, since that is what a merchant writes a condition
 * against.
 */
export function formSubmittedPayload(state: FormState, submission: FormSubmission) {
  const form = state.forms.find((item) => item.id === submission.formId);
  const fields: Record<string, SubmissionValue> = {};
  for (const item of form?.fields ?? []) {
    if (item.kind === "consent" || submission.values[item.id] === undefined) continue;
    const key = item.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    fields[key || item.id] = submission.values[item.id];
  }

  return {
    event: "form.submitted",
    form_id: submission.formId,
    form_name: form?.name ?? null,
    form_type: form?.type ?? null,
    submission_id: submission.id,
    submitted_at: submission.submittedAt,
    contact_id: submission.contactId ?? null,
    contact_created: submission.contactCreated ?? false,
    lead_id: submission.leadId ?? null,
    source: submission.source,
    page_url: submission.pageUrl ?? null,
    utm: submission.utm ?? null,
    fields,
    tags: submission.tags,
    consent: submission.consent,
    opt_in: {
      email: submission.optIns.includes("email"),
      whatsapp: submission.optIns.includes("whatsapp"),
      sms: submission.optIns.includes("sms"),
    },
  };
}

/**
 * The workflow a submission's event is delivered to, if any.
 *
 * Spam and duplicates raise nothing - a duplicate the form ignores must not
 * re-enrol someone into the journey they are already on - and neither does a
 * submission still waiting on its double opt-in.
 */
export function listeningWorkflow(state: FormState, submission: FormSubmission) {
  if (submission.status !== "processed" && submission.status !== "new") return null;
  const form = state.forms.find((item) => item.id === submission.formId);
  return formWorkflowById(form?.automation.workflowId) ?? null;
}

/* -------------------------------------------------------------------------- */
/* Derived figures                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Whether a submission counts toward a form's figures.
 *
 * Spam is not a lead and a preview test is not a visitor, so neither is a
 * conversion. Duplicates do count: somebody did submit, and hiding repeats
 * would make a double-submitted form look less effective than it is.
 */
export const countsAsSubmission = (item: FormSubmission) =>
  item.status !== "spam" && item.source !== "preview";

export function formStats(form: Form, submissions: FormSubmission[]) {
  const own = submissions.filter((item) => item.formId === form.id);
  const counted = own.filter(countsAsSubmission);
  const latest = own.reduce<string | undefined>(
    (max, item) => (!max || item.submittedAt > max ? item.submittedAt : max),
    undefined,
  );

  return {
    submissions: counted.length,
    conversion: form.views > 0 ? (counted.length / form.views) * 100 : 0,
    lastSubmissionAt: latest,
    contacts: new Set(counted.map((item) => item.contactId).filter(Boolean)).size,
    leads: new Set(counted.map((item) => item.leadId).filter(Boolean)).size,
  };
}
