"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Eye,
  Link2,
  Tag as TagIcon,
  Target,
  UserCheck,
  UserPlus,
} from "lucide-react";

import { EventPayloadViewer } from "@/components/automation/triggers/event-payload-viewer";
import { WorkflowStatusBadge } from "@/components/automation/automation-badges";
import { StageBadge, TagBadges } from "@/components/customers/customer-badges";
import { SummaryRow } from "@/components/marketing-hub/campaign/shared";
import { ServiceNotice } from "@/components/settings/service-notice";
import { AvatarLabel } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { Menu, type MenuItem } from "@/components/ui/menu";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import { TABLE_PAGE_SIZE } from "@/constants/app";
import {
  SUBMISSION_SOURCES,
  SUBMISSION_STATUSES,
  submissionSourceLabel,
} from "@/constants/forms";
import { CONSENT_CHANNELS, ownerName, stageLabel } from "@/lib/customer-fixtures";
import { formatDateTime } from "@/lib/format";
import { capturedIdentity } from "@/lib/form-fixtures";
import {
  formSubmittedPayload,
  listeningWorkflow,
  resolveContact,
  resolveLead,
  useFormState,
  type FormState,
} from "@/lib/form-store";
import type { Form, FormSubmission, SubmissionValue } from "@/types/form";
import { ConsentBadge, SubmissionStatusBadge } from "../form-badges";
import {
  AddTagDialog,
  AssignLeadDialog,
  contactHref,
  leadHref,
  useSubmissionActions,
} from "./submission-links";

/**
 * A form's submissions, and what each one became in the CRM.
 *
 * The Contact and Lead columns are the point of the table. A linked row prints
 * the contact's own name and a link into Customers; an unlinked one says so and
 * offers to link it - which matches before it creates, so the action is safe
 * to press on somebody who is already a customer.
 */

interface Row {
  submission: FormSubmission;
  name: string;
  email?: string;
  phone?: string;
  contact: ReturnType<typeof resolveContact>;
  lead: ReturnType<typeof resolveLead>;
}

function rowFor(state: FormState, form: Form, submission: FormSubmission): Row {
  const contact = resolveContact(state, submission.contactId);
  const captured = capturedIdentity(form, submission);
  const typed = [captured.firstName, captured.lastName].filter(Boolean).join(" ");

  return {
    submission,
    /* The CRM's name wins once linked - see `resolveContact`. */
    name: contact?.name ?? (typed || captured.email || captured.phone || "Anonymous"),
    email: contact?.email ?? captured.email,
    phone: contact?.phone ?? captured.phone,
    contact,
    lead: resolveLead(state, submission.leadId),
  };
}

const PER_PAGE = TABLE_PAGE_SIZE;

export function SubmissionsPanel({ form }: { form: Form }) {
  const router = useRouter();
  const state = useFormState();
  const actions = useSubmissionActions();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tagFor, setTagFor] = useState<Row | null>(null);
  const [assignFor, setAssignFor] = useState<Row["lead"]>(null);

  const rows = useMemo(
    () =>
      state.submissions
        .filter((item) => item.formId === form.id)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
        .map((item) => rowFor(state, form, item)),
    [state, form],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== "all" && row.submission.status !== status) return false;
      if (source !== "all" && row.submission.source !== source) return false;
      if (term) {
        const haystack = `${row.name} ${row.email ?? ""} ${row.phone ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [rows, search, status, source]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const open = rows.find((row) => row.submission.id === openId) ?? null;

  const activeCount = (status !== "all" ? 1 : 0) + (source !== "all" ? 1 : 0);

  const menuFor = (row: Row): MenuItem[] => {
    const items: MenuItem[] = [
      {
        label: "View submission",
        icon: <Eye className="size-4" />,
        onSelect: () => setOpenId(row.submission.id),
      },
    ];

    if (row.contact && !row.contact.session) {
      items.push({
        label: "Open contact",
        icon: <UserCheck className="size-4" />,
        onSelect: () => router.push(contactHref(row.contact!)),
      });
    } else if (!row.contact && row.submission.status !== "spam") {
      items.push({
        label: "Create contact",
        icon: <UserPlus className="size-4" />,
        onSelect: () => actions.createContact(row.submission.id, row.name),
      });
    }

    if (row.lead && !row.lead.session) {
      items.push({
        label: "Open lead",
        icon: <Target className="size-4" />,
        onSelect: () => router.push(leadHref(row.lead!)),
      });
    } else if (!row.lead && row.contact) {
      items.push({
        label: "Create lead",
        icon: <Target className="size-4" />,
        onSelect: () => actions.createLead(row.submission.id),
      });
    }

    items.push(
      {
        label: "Add tag",
        icon: <TagIcon className="size-4" />,
        onSelect: () => setTagFor(row),
        disabled: !row.contact,
      },
      {
        label: "Assign lead",
        icon: <Link2 className="size-4" />,
        onSelect: () => setAssignFor(row.lead),
        disabled: !row.lead,
      },
    );

    return items;
  };

  return (
    <div className="space-y-4">
      <ServiceNotice tone="session" title="Linking works for this session">
        Links to existing contacts and leads are real. Contacts, leads, tags and
        owners you create or change from here are kept in this browser session -
        Customers and Leads read the CRM directly and will show them once the
        CRM API is connected.
      </ServiceNotice>

      <FilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        placeholder="Search by name, email or phone…"
        activeCount={activeCount}
        onReset={() => {
          setStatus("all");
          setSource("all");
          setPage(1);
        }}
      >
        <Select
          label="Filter by status"
          size="sm"
          value={status}
          onChange={(next) => {
            setStatus(next);
            setPage(1);
          }}
          options={[{ value: "all", label: "All statuses" }, ...SUBMISSION_STATUSES]}
          className="lg:w-44"
        />
        <Select
          label="Filter by source"
          size="sm"
          value={source}
          onChange={(next) => {
            setSource(next);
            setPage(1);
          }}
          options={[{ value: "all", label: "All sources" }, ...SUBMISSION_SOURCES]}
          className="lg:w-40"
        />
      </FilterBar>

      {pageRows.length === 0 ? (
        <EmptyState
          title={rows.length === 0 ? "No submissions yet" : "No submissions match those filters"}
          description={
            rows.length === 0
              ? form.status === "active"
                ? "They appear here as visitors send the form. Use Preview to send a test one."
                : "Publish the form to start collecting them, or use Preview to send a test one."
              : "Try a different search, or clear the filters."
          }
        />
      ) : (
        <>
          <Table minWidth="78rem" className="max-lg:hidden">
            <THead>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Phone</TH>
              <TH>Source</TH>
              <TH>Consent</TH>
              <TH>Lead Status</TH>
              <TH>Contact</TH>
              <TH>Lead</TH>
              <TH>Submitted At</TH>
              <TH align="right" />
            </THead>
            <TBody>
              {pageRows.map((row) => (
                <TR key={row.submission.id}>
                  <TD className="max-w-48">
                    <button
                      type="button"
                      onClick={() => setOpenId(row.submission.id)}
                      className="block max-w-full rounded-btn text-left focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <span className="block truncate font-semibold text-text-primary hover:text-primary">
                        {row.name}
                      </span>
                      <span className="mt-0.5 block">
                        <SubmissionStatusBadge status={row.submission.status} />
                      </span>
                    </button>
                  </TD>
                  <TD className="max-w-52 truncate text-text-secondary">{row.email ?? "-"}</TD>
                  <TD className="whitespace-nowrap text-text-secondary">{row.phone ?? "-"}</TD>
                  <TD className="whitespace-nowrap text-text-secondary">
                    {submissionSourceLabel(row.submission.source)}
                  </TD>
                  <TD>
                    <ConsentBadge consent={row.submission.consent} />
                  </TD>
                  <TD>
                    {row.lead ? (
                      <StageBadge stage={row.lead.stage} label={stageLabel(row.lead.stage)} />
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </TD>
                  <TD>
                    <ContactCell row={row} />
                  </TD>
                  <TD className="max-w-48">
                    <LeadCell row={row} />
                  </TD>
                  <TD className="whitespace-nowrap text-text-muted">
                    {formatDateTime(row.submission.submittedAt)}
                  </TD>
                  <TD align="right">
                    <Menu items={menuFor(row)} label={`Actions for ${row.name}'s submission`} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>

          <ul className="space-y-2.5 lg:hidden">
            {pageRows.map((row) => (
              <li key={row.submission.id} className="rounded-panel border border-border p-3.5">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(row.submission.id)}
                    className="min-w-0 flex-1 rounded-btn text-left focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <AvatarLabel name={row.name} secondary={row.email ?? row.phone} size="sm" />
                  </button>
                  <Menu items={menuFor(row)} label={`Actions for ${row.name}'s submission`} />
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <SubmissionStatusBadge status={row.submission.status} />
                  <ConsentBadge consent={row.submission.consent} />
                  {row.lead ? (
                    <StageBadge stage={row.lead.stage} label={stageLabel(row.lead.stage)} />
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-text-muted">
                  {submissionSourceLabel(row.submission.source)} ·{" "}
                  {formatDateTime(row.submission.submittedAt)}
                </p>
              </li>
            ))}
          </ul>

          <Pagination
            page={current}
            totalPages={totalPages}
            total={filtered.length}
            perPage={PER_PAGE}
            onChange={setPage}
            noun="submissions"
          />
        </>
      )}

      <SubmissionDrawer
        form={form}
        row={open}
        state={state}
        onClose={() => setOpenId(null)}
        onAddTag={() => open && setTagFor(open)}
        onAssign={() => open && setAssignFor(open.lead)}
      />

      <AddTagDialog
        submissionId={tagFor?.submission.id ?? null}
        existing={[...(tagFor?.submission.tags ?? []), ...(tagFor?.contact?.tags ?? [])]}
        onClose={() => setTagFor(null)}
      />
      <AssignLeadDialog lead={assignFor} onClose={() => setAssignFor(null)} />
    </div>
  );
}

function ContactCell({ row }: { row: Row }) {
  if (!row.contact) return <span className="text-text-muted">Not linked</span>;

  return (
    <span className="flex flex-col items-start gap-0.5 whitespace-nowrap">
      {row.contact.session ? (
        <span className="text-sm font-medium text-text-primary">This session</span>
      ) : (
        <Link
          href={contactHref(row.contact)}
          className="rounded-btn text-sm font-medium text-primary hover:text-primary-dark focus-visible:shadow-focus focus-visible:outline-none"
        >
          Open contact
        </Link>
      )}
      <span className="text-sm text-text-muted">
        {row.submission.contactCreated ? "Created" : "Matched existing"}
      </span>
    </span>
  );
}

function LeadCell({ row }: { row: Row }) {
  if (!row.lead) return <span className="text-text-muted">No lead</span>;

  return row.lead.session ? (
    <span className="block truncate text-sm font-medium text-text-primary">{row.lead.title}</span>
  ) : (
    <Link
      href={leadHref(row.lead)}
      className="block truncate rounded-btn text-sm font-medium text-primary hover:text-primary-dark focus-visible:shadow-focus focus-visible:outline-none"
    >
      {row.lead.title}
    </Link>
  );
}

const printValue = (value: SubmissionValue | undefined) =>
  value === undefined
    ? "-"
    : typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : Array.isArray(value)
        ? value.join(", ") || "-"
        : value || "-";

function SubmissionDrawer({
  form,
  row,
  state,
  onClose,
  onAddTag,
  onAssign,
}: {
  form: Form;
  row: Row | null;
  state: FormState;
  onClose: () => void;
  onAddTag: () => void;
  onAssign: () => void;
}) {
  const actions = useSubmissionActions();
  const submission = row?.submission;
  const workflow = submission ? listeningWorkflow(state, submission) : null;

  return (
    <Drawer
      open={Boolean(row)}
      onClose={onClose}
      title={row ? row.name : "Submission"}
      description={submission ? `${form.name} · ${formatDateTime(submission.submittedAt)}` : undefined}
    >
      {row && submission ? (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-1.5">
            <SubmissionStatusBadge status={submission.status} />
            <ConsentBadge consent={submission.consent} />
          </div>

          <section>
            <h3 className="text-sm font-bold text-text-primary">Answers</h3>
            <dl className="mt-1 divide-y divide-border">
              {form.fields.map((item) => (
                <SummaryRow
                  key={item.id}
                  label={item.kind === "consent" ? "Consent" : item.label}
                  value={printValue(submission.values[item.id])}
                />
              ))}
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-bold text-text-primary">Contact</h3>
            {row.contact ? (
              <div className="mt-2 space-y-2.5 rounded-panel border border-border p-3.5">
                <AvatarLabel name={row.contact.name} secondary={row.contact.email ?? row.contact.phone} size="sm" />
                <p className="text-sm text-text-secondary">
                  {submission.contactCreated
                    ? "Created by this submission."
                    : "Matched an existing contact by email or phone - nobody was duplicated."}
                  {row.contact.session ? " Held for this session." : ""}
                </p>
                {row.contact.tags.length ? <TagBadges tags={row.contact.tags} max={4} /> : null}
                <div className="flex flex-wrap gap-2">
                  {!row.contact.session ? (
                    <ButtonLink href={contactHref(row.contact)} variant="outline" size="sm">
                      Open contact
                    </ButtonLink>
                  ) : null}
                  <Button variant="outline" size="sm" onClick={onAddTag}>
                    <TagIcon aria-hidden />
                    Add tag
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-2.5 rounded-panel border border-dashed border-border-strong p-3.5">
                <p className="text-sm text-text-secondary">
                  {submission.status === "spam"
                    ? "Marked as spam, so it is never linked."
                    : submission.status === "awaiting_confirmation"
                      ? "Waiting for the email confirmation before a contact is created."
                      : "Not linked yet. Linking matches Customers by email, then phone, and only creates a contact if nobody matches."}
                </p>
                {submission.status !== "spam" ? (
                  <Button
                    size="sm"
                    onClick={() => actions.createContact(submission.id, row.name)}
                  >
                    <UserPlus aria-hidden />
                    Create or link contact
                  </Button>
                ) : null}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-bold text-text-primary">Lead</h3>
            {row.lead ? (
              <div className="mt-2 space-y-2.5 rounded-panel border border-border p-3.5">
                <p className="text-sm font-semibold text-text-primary">{row.lead.title}</p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                  <StageBadge stage={row.lead.stage} label={stageLabel(row.lead.stage)} />
                  Owner: {ownerName(row.lead.ownerId)}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!row.lead.session ? (
                    <ButtonLink href={leadHref(row.lead)} variant="outline" size="sm">
                      Open lead
                    </ButtonLink>
                  ) : null}
                  <Button variant="outline" size="sm" onClick={onAssign}>
                    Assign lead
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-2.5 rounded-panel border border-dashed border-border-strong p-3.5">
                <p className="text-sm text-text-secondary">
                  {row.contact
                    ? "No lead for this submission. A contact with an open lead gets that lead rather than a second one."
                    : "A lead belongs to a contact - link the contact first."}
                </p>
                {row.contact ? (
                  <Button variant="outline" size="sm" onClick={() => actions.createLead(submission.id)}>
                    <Target aria-hidden />
                    Create lead
                  </Button>
                ) : null}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-bold text-text-primary">Source and consent</h3>
            <dl className="mt-1 divide-y divide-border">
              <SummaryRow label="Source" value={submissionSourceLabel(submission.source)} />
              {submission.pageUrl ? (
                <SummaryRow label="Page" value={<span className="break-all">{submission.pageUrl}</span>} />
              ) : null}
              {submission.utm ? (
                <SummaryRow
                  label="Campaign"
                  value={`${submission.utm.campaign} · ${submission.utm.source} / ${submission.utm.medium}`}
                />
              ) : null}
              <SummaryRow
                label="Opted in to"
                value={
                  submission.optIns.length
                    ? submission.optIns
                        .map((channel) => CONSENT_CHANNELS.find((item) => item.value === channel)?.label ?? channel)
                        .join(", ")
                    : "No channels"
                }
              />
              <SummaryRow
                label="Tags applied"
                value={submission.tags.length ? submission.tags.join(", ") : "None"}
              />
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-bold text-text-primary">Automation</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
              {workflow ? (
                <>
                  <Badge variant="outline" casing="none">form.submitted</Badge>
                  is picked up by
                  <ButtonLink href={AUTOMATION_ROUTES.workflow(workflow.id)} variant="text" size="inline">
                    {workflow.name}
                    <ExternalLink aria-hidden />
                  </ButtonLink>
                  <WorkflowStatusBadge status={workflow.status} />
                </>
              ) : (
                <span>
                  {submission.status === "spam" || submission.status === "duplicate"
                    ? "No event - spam and ignored repeats raise nothing."
                    : submission.status === "awaiting_confirmation"
                      ? "The event is raised once the opt-in is confirmed."
                      : "Raised form.submitted. No workflow is connected to this form."}
                </span>
              )}
            </div>
            <p className="mt-3 mb-1.5 text-sm font-medium text-text-muted">Event payload</p>
            <EventPayloadViewer payload={formSubmittedPayload(state, submission)} />
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}
