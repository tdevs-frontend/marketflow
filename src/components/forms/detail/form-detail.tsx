"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Code2,
  Eye,
  Inbox,
  MousePointerClick,
  Pause,
  Pencil,
  Percent,
  Play,
  Plus,
  Radio,
  Trash2,
  Zap,
} from "lucide-react";

import { EventPayloadViewer } from "@/components/automation/triggers/event-payload-viewer";
import { BarsChart } from "@/components/dashboard/charts";
import { BRAND_SERIES } from "@/components/dashboard/charts/chart-theme";
import { PageHeader } from "@/components/layout/page-header";
import { SummaryRow } from "@/components/marketing-hub/campaign/shared";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/input";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { Select } from "@/components/ui/select";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { TabCount, TabPanel, Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import {
  FORM_ROUTES,
  FORM_TABS,
  fieldKindMeta,
  formTypeLabel,
  submissionSourceLabel,
  type FormTab,
} from "@/constants/forms";
import { ownerName } from "@/lib/customer-fixtures";
import { formatDate, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import {
  FORM_WEEK_LABELS,
  FORM_WORKFLOWS,
  capturedIdentity,
  formWorkflowById,
  weekIndexOf,
} from "@/lib/form-fixtures";
import {
  countsAsSubmission,
  deleteForm,
  formStats,
  formSubmittedPayload,
  resolveContact,
  setFormStatus,
  updateForm,
  useFormState,
} from "@/lib/form-store";
import type { Form, FormStatus } from "@/types/form";
import { FormStatusBadge, SubmissionStatusBadge } from "../form-badges";
import { FormEmbedDialog, FormPreviewDialog } from "../form-dialogs";
import { FormPreview } from "../form-preview";
import { SubmissionFlow } from "../submission-flow";
import { SubmissionsPanel } from "./submissions-panel";

/**
 * One form: how it is doing, what came in, what it asks, where it leads.
 *
 * A client component reading the form store, rather than a server page reading
 * fixtures, because a form created or duplicated this session has to open here
 * too - the store is the only place that knows about it.
 */


const TAB_LABELS: Record<FormTab, string> = {
  overview: "Overview",
  submissions: "Submissions",
  form: "Form",
  automation: "Automation",
  settings: "Settings",
};

export function FormDetail({ id, initialTab }: { id: string; initialTab: FormTab }) {
  const router = useRouter();
  const toast = useToast();
  const state = useFormState();
  const form = state.forms.find((item) => item.id === id) ?? null;

  const idBase = useId();
  const [tab, setTab] = useState<FormTab>(initialTab);
  const [embedFor, setEmbedFor] = useState<string | null>(null);
  const [previewFor, setPreviewFor] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!form) {
    return (
      <>
        <BackLink />
        <EmptyState
          title="This form does not exist"
          description="It may have been deleted, or it was created in another session - forms made here are kept for the browser session only."
          action={
            <ButtonLink href={FORM_ROUTES.list} size="sm" variant="outline">
              Back to forms
            </ButtonLink>
          }
        />
      </>
    );
  }

  const stats = formStats(form, state.submissions);
  const own = state.submissions.filter((item) => item.formId === form.id);

  function changeStatus(next: FormStatus) {
    if (!form) return;
    setFormStatus(form.id, next);
    toast(next === "active" ? `${form.name} is live` : `${form.name} paused`, "success");
  }

  return (
    <>
      <BackLink />

      <PageHeader
        title={form.name}
        description={[
          formTypeLabel(form.type),
          `${form.fields.length} field${form.fields.length === 1 ? "" : "s"}`,
          form.publishedAt ? `Published ${formatDate(form.publishedAt)}` : "Not published yet",
        ].join(" · ")}
        secondaryActions={
          <>
            <FormStatusBadge status={form.status} />
            <Button variant="outline" size="compact" onClick={() => setPreviewFor(form.id)}>
              <Eye aria-hidden />
              Preview
            </Button>
            <Button variant="outline" size="compact" onClick={() => setEmbedFor(form.id)}>
              <Code2 aria-hidden />
              Embed
            </Button>
          </>
        }
        action={
          <ButtonLink href={FORM_ROUTES.edit(form.id)} size="compact">
            <Pencil aria-hidden />
            Edit Form
          </ButtonLink>
        }
      />

      <Tabs
        tabs={FORM_TABS.map((value) => ({
          value,
          label: TAB_LABELS[value],
          badge: value === "submissions" ? <TabCount value={own.length} /> : undefined,
        }))}
        value={tab}
        onChange={(next) => {
          setTab(next);
          /* Keep the tab in the URL so a refresh or a shared link lands here,
             without adding a history entry per click. */
          router.replace(
            next === "overview" ? FORM_ROUTES.form(form.id) : `${FORM_ROUTES.form(form.id)}?tab=${next}`,
            { scroll: false },
          );
        }}
        label="Form sections"
        idBase={idBase}
        bleed={false}
      />

      <TabPanel idBase={idBase} value={tab} className="space-y-4">
        {tab === "overview" ? (
          <Overview form={form} onViewAll={() => setTab("submissions")} />
        ) : null}

        {tab === "submissions" ? (
          <Card className="p-5">
            <SubmissionsPanel form={form} />
          </Card>
        ) : null}

        {tab === "form" ? <FormTab form={form} /> : null}

        {tab === "automation" ? <AutomationTab form={form} /> : null}

        {tab === "settings" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader
                title="Publishing"
                description="Whether the embed accepts submissions right now."
              />
              <CardBody className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <FormStatusBadge status={form.status} />
                  {form.status === "active" ? (
                    <Button variant="outline" size="sm" onClick={() => changeStatus("paused")}>
                      <Pause aria-hidden />
                      Pause form
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => changeStatus("active")}>
                      <Play aria-hidden />
                      {form.status === "draft" ? "Publish form" : "Resume form"}
                    </Button>
                  )}
                </div>
                <p className="text-sm text-text-secondary">
                  {form.status === "active"
                    ? "Live. Pausing keeps the embed on every page but stops it accepting submissions."
                    : form.status === "paused"
                      ? "Paused. Pages carrying the embed show a “not accepting responses” notice."
                      : "Draft. Nothing is public until you publish."}
                </p>
                <Button variant="outline" size="sm" onClick={() => setEmbedFor(form.id)}>
                  <Code2 aria-hidden />
                  Get embed code
                </Button>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Details" />
              <CardBody>
                <dl className="divide-y divide-border">
                  <SummaryRow label="Form ID" value={<code className="font-mono">{form.id}</code>} />
                  <SummaryRow label="Type" value={formTypeLabel(form.type)} />
                  <SummaryRow label="Owner" value={ownerName(form.ownerId)} />
                  <SummaryRow label="Created" value={formatDateTime(form.createdAt)} />
                  <SummaryRow label="Last edited" value={formatDateTime(form.updatedAt)} />
                  <SummaryRow
                    label="Description"
                    value={form.description || "None"}
                  />
                </dl>
              </CardBody>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader
                title="Delete form"
                description="Removes the form and its submission history. Contacts and leads it created stay in the CRM."
                action={
                  <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                    <Trash2 aria-hidden />
                    Delete
                  </Button>
                }
              />
            </Card>
          </div>
        ) : null}
      </TabPanel>

      <FormEmbedDialog
        formId={embedFor}
        onClose={() => setEmbedFor(null)}
        onPreview={(next) => {
          setEmbedFor(null);
          setPreviewFor(next);
        }}
      />
      <FormPreviewDialog formId={previewFor} onClose={() => setPreviewFor(null)} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteForm(form.id);
          toast(`${form.name} deleted`, "success");
          router.push(FORM_ROUTES.list);
        }}
        title={`Delete ${form.name}?`}
        description={`${stats.submissions} submission${stats.submissions === 1 ? "" : "s"} go with it. Pages carrying the embed stop showing the form.`}
        confirmLabel="Delete form"
      >
        <p className="text-sm text-text-secondary">
          Contacts and leads its submissions created stay in the CRM - deleting a
          form never deletes a customer.
        </p>
      </ConfirmDialog>
    </>
  );
}

function BackLink() {
  return (
    <ButtonLink
      href={FORM_ROUTES.list}
      variant="subtle"
      size="inline"
      className="w-fit text-[15px]"
    >
      <ChevronLeft aria-hidden />
      Back to forms
    </ButtonLink>
  );
}

/* -------------------------------------------------------------------------- */
/* Overview                                                                   */
/* -------------------------------------------------------------------------- */

function Overview({ form, onViewAll }: { form: Form; onViewAll: () => void }) {
  const state = useFormState();
  const stats = formStats(form, state.submissions);

  const recent = useMemo(
    () =>
      state.submissions
        .filter((item) => item.formId === form.id)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
        .slice(0, 5),
    [state.submissions, form.id],
  );

  /* Weekly submissions, counted the same way as the KPI - spam and preview
     tests left out - against the views the embed reported for each week. */
  const weekly = useMemo(() => {
    const counts = FORM_WEEK_LABELS.map(() => 0);
    for (const item of state.submissions) {
      if (item.formId !== form.id || !countsAsSubmission(item)) continue;
      const index = weekIndexOf(item.submittedAt);
      if (index >= 0) counts[index] += 1;
    }
    return counts;
  }, [state.submissions, form.id]);

  const kpis: Kpi[] = [
    {
      label: "Views",
      value: formatNumber(form.views),
      icon: MousePointerClick,
      tone: "brand",
      hint: "Reported by the embed",
    },
    {
      label: "Submissions",
      value: formatNumber(stats.submissions),
      icon: Inbox,
      tone: "info",
      hint: `${stats.contacts} contact${stats.contacts === 1 ? "" : "s"} · ${stats.leads} lead${stats.leads === 1 ? "" : "s"}`,
    },
    {
      label: "Conversion Rate",
      value: form.views ? formatPercent(stats.conversion) : "-",
      icon: Percent,
      tone: "success",
      hint: "Submissions ÷ views",
      info: "Spam and preview tests are not counted as submissions.",
    },
    {
      label: "Status",
      value: form.status === "active" ? "Active" : form.status === "paused" ? "Paused" : "Draft",
      icon: Radio,
      tone: form.status === "active" ? "success" : form.status === "paused" ? "warning" : "neutral",
      hint: stats.lastSubmissionAt
        ? `Last submission ${formatDateTime(stats.lastSubmissionAt)}`
        : "No submissions yet",
    },
  ];

  return (
    <>
      <KpiStrip items={kpis} />

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Submission trend"
          description={`Submissions per week, over the last ${FORM_WEEK_LABELS.length} weeks.`}
          legend={[{ label: "Submissions", swatch: "bg-primary" }]}
          className="xl:col-span-2"
        >
          {/* Bars, not a line: these are whole submissions in whole weeks,
              and a smoothed curve would draw fractions between them. */}
          <BarsChart
            categories={FORM_WEEK_LABELS}
            series={[{ name: "Submissions", data: weekly }]}
            colors={BRAND_SERIES}
            unit="submissions"
            height={260}
          />
        </ChartCard>

        <PanelCard
          title="Recent submissions"
          description="The latest five, newest first."
          action={
            recent.length ? (
              <Button variant="text" size="inline" onClick={onViewAll}>
                View all
              </Button>
            ) : undefined
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              compact
              title="Nothing yet"
              description="Submissions appear here as they arrive."
            />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((item) => {
                const contact = resolveContact(state, item.contactId);
                const captured = capturedIdentity(form, item);
                const name =
                  contact?.name ??
                  ([captured.firstName, captured.lastName].filter(Boolean).join(" ") ||
                    captured.email ||
                    "Anonymous");
                return (
                  <li key={item.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-text-primary">{name}</span>
                      <span className="block text-sm text-text-muted">
                        {submissionSourceLabel(item.source)} · {formatDateTime(item.submittedAt)}
                      </span>
                    </span>
                    <SubmissionStatusBadge status={item.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </PanelCard>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Form                                                                       */
/* -------------------------------------------------------------------------- */

function FormTab({ form }: { form: Form }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <Card>
        <CardHeader
          title="Fields"
          description="In the order visitors see them."
          action={
            <ButtonLink href={FORM_ROUTES.edit(form.id)} variant="outline" size="sm">
              <Pencil aria-hidden />
              Edit fields
            </ButtonLink>
          }
        />
        <CardBody>
          <Table minWidth="36rem">
            <THead>
              <TH>Label</TH>
              <TH>Type</TH>
              <TH>Writes to</TH>
              <TH>Required</TH>
            </THead>
            <TBody>
              {form.fields.map((item) => {
                const meta = fieldKindMeta(item.kind);
                return (
                  <TR key={item.id}>
                    <TD className="max-w-72">
                      <span className="block truncate text-text-primary">{item.label}</span>
                      {item.helpText ? (
                        <span className="block truncate text-sm font-normal text-text-muted">{item.helpText}</span>
                      ) : null}
                    </TD>
                    <TD className="whitespace-nowrap text-text-secondary">{meta.label}</TD>
                    <TD className="whitespace-nowrap text-text-secondary">
                      {item.kind === "consent"
                        ? `${(item.consentChannel ?? "email").replace(/^./, (c) => c.toUpperCase())} opt-in`
                        : (meta.crmProperty ?? "Submission only")}
                    </TD>
                    <TD className="text-text-secondary">{item.required ? "Yes" : "No"}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </CardBody>
      </Card>

      <div>
        <p className="mb-2 text-sm font-bold text-text-secondary">As visitors see it</p>
        <FormPreview
          fields={form.fields}
          design={form.design}
          behavior={form.behavior}
          note="Nothing was saved. Use Preview at the top to record a test submission."
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Automation                                                                 */
/* -------------------------------------------------------------------------- */

const NONE = "none";

function AutomationTab({ form }: { form: Form }) {
  const toast = useToast();
  const state = useFormState();
  const workflow = formWorkflowById(form.automation.workflowId);

  /* The newest real submission, so the payload shown is one this form sent. */
  const latest = state.submissions
    .filter((item) => item.formId === form.id && item.status === "processed")
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];

  function connect(next: string) {
    updateForm(form.id, {
      name: form.name,
      description: form.description,
      type: form.type,
      status: form.status,
      fields: form.fields,
      design: form.design,
      behavior: form.behavior,
      automation: next === NONE ? {} : { workflowId: next },
      ownerId: form.ownerId,
    });
    toast(
      next === NONE
        ? "Workflow disconnected"
        : `Connected to ${formWorkflowById(next)?.name ?? "the workflow"}`,
      "success",
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <div className="space-y-4">
        <Card>
          <CardHeader
            title="Connected workflow"
            description="Each submission raises Form Submitted. This is the workflow that acts on it."
          />
          <CardBody className="space-y-4">
            <Field
              label="Workflow"
              htmlFor="detail-workflow"
              hint="Only workflows whose trigger is Form Submitted are listed."
            >
              <Select
                id="detail-workflow"
                label="Workflow"
                hideLabel={false}
                value={form.automation.workflowId ?? NONE}
                onChange={connect}
                options={[
                  { value: NONE, label: "None" },
                  ...FORM_WORKFLOWS.map((item) => ({
                    value: item.id,
                    label: item.name,
                    hint: item.description,
                  })),
                ]}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <ButtonLink
                href={`${AUTOMATION_ROUTES.create}?event=form.submitted&form=${encodeURIComponent(form.id)}`}
                variant="outline"
                size="sm"
              >
                <Plus aria-hidden />
                Create new workflow
              </ButtonLink>
              <ButtonLink
                href={AUTOMATION_ROUTES.trigger("trg-form-submitted")}
                variant="outline"
                size="sm"
              >
                <Zap aria-hidden />
                Form Submitted trigger
              </ButtonLink>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Event payload"
            description={
              latest
                ? `What Automation received for the latest submission, ${formatDateTime(latest.submittedAt)}.`
                : "Appears once the form has a processed submission."
            }
          />
          <CardBody>
            {latest ? (
              <EventPayloadViewer payload={formSubmittedPayload(state, latest)} />
            ) : (
              <EmptyState
                compact
                title="No event yet"
                description="Send a test from Preview to see the payload a workflow receives."
              />
            )}
          </CardBody>
        </Card>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-text-secondary">What a submission does</p>
        <SubmissionFlow formName={form.name} behavior={form.behavior} workflow={workflow} />
      </div>
    </div>
  );
}
