"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Code2,
  Copy,
  Download,
  Eye,
  Inbox,
  Pause,
  Pencil,
  Percent,
  Play,
  Plus,
  Radio,
  Trash2,
  Upload,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import {
  ActiveFilterChips,
  type FilterChip,
} from "@/components/customers/customer-toolbar";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import type { MenuItem } from "@/components/ui/menu";
import { Menu } from "@/components/ui/menu";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { SortableTH, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import {
  FORM_ROUTES,
  FORM_STATUSES,
  FORM_TYPES,
  formTypeLabel,
} from "@/constants/forms";
import { useDebounce } from "@/hooks/useDebounce";
import { useTableState } from "@/hooks/useTableState";
import { formatDate, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { FORM_WORKFLOWS, formWorkflowById } from "@/lib/form-fixtures";
import {
  countsAsSubmission,
  deleteForm,
  duplicateForm,
  exportDefinitions,
  formStats,
  importDefinitions,
  setFormStatus,
  useFormState,
} from "@/lib/form-store";
import { WORKSPACE_NOW_MS } from "@/lib/workspace-clock";
import type { Form } from "@/types/form";
import { FormStatusBadge } from "./form-badges";
import { FormEmbedDialog, FormPreviewDialog } from "./form-dialogs";

/**
 * The forms list: what exists, what is live, and how each is converting.
 *
 * The same composition as every workspace in the dashboard - `KpiStrip`, then
 * one `Card` holding a `FilterBar` and the shared `Table`, with a stacked card
 * list taking over below `lg`. Filters live in the URL through
 * `useTableState`, run before pagination, and every change goes back to page
 * one, so a filtered view is linkable and never lands on an empty page three.
 */

const FILTERS = ["status", "type", "workflow", "date"] as const;
type FilterKey = (typeof FILTERS)[number];
type SortField = "name" | "submissions" | "conversion" | "last" | "created";

const DATE_RANGES = [
  { value: "7", label: "Created in the last 7 days" },
  { value: "30", label: "Created in the last 30 days" },
  { value: "90", label: "Created in the last 90 days" },
  { value: "older", label: "Created over 90 days ago" },
];

const NOT_CONNECTED = "none";

export function FormsWorkspace() {
  const router = useRouter();
  const toast = useToast();
  const table = useTableState<FilterKey>(FILTERS);
  const { forms, submissions } = useFormState();

  const [searchDraft, setSearchDraft] = useState(table.search);
  const debounced = useDebounce(searchDraft, 250);
  const [lastPushed, setLastPushed] = useState(table.search);
  if (debounced !== lastPushed) {
    setLastPushed(debounced);
    table.setSearch(debounced);
  }

  const [embedFor, setEmbedFor] = useState<string | null>(null);
  const [previewFor, setPreviewFor] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Form | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const { filters } = table;

  const stats = useMemo(
    () => new Map(forms.map((form) => [form.id, formStats(form, submissions)])),
    [forms, submissions],
  );

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    const days = Number(filters.date);

    const rows = forms.filter((form) => {
      if (term) {
        const haystack = `${form.name} ${form.description} ${formTypeLabel(form.type)}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (filters.status !== "all" && form.status !== filters.status) return false;
      if (filters.type !== "all" && form.type !== filters.type) return false;
      if (filters.workflow !== "all") {
        const linked = form.automation.workflowId;
        if (filters.workflow === NOT_CONNECTED ? linked : linked !== filters.workflow) {
          return false;
        }
      }
      if (filters.date !== "all") {
        const age = (WORKSPACE_NOW_MS - new Date(form.createdAt).getTime()) / 86_400_000;
        if (filters.date === "older" ? age <= 90 : age > days) return false;
      }
      return true;
    });

    const field = (table.sortField ?? "created") as SortField;
    const factor = table.sortDirection === "asc" ? 1 : -1;
    const time = (value?: string) => (value ? new Date(value).getTime() : 0);

    return [...rows].sort((a, b) => {
      const sa = stats.get(a.id);
      const sb = stats.get(b.id);
      switch (field) {
        case "name":
          return a.name.localeCompare(b.name) * factor;
        case "submissions":
          return ((sa?.submissions ?? 0) - (sb?.submissions ?? 0)) * factor;
        case "conversion":
          return ((sa?.conversion ?? 0) - (sb?.conversion ?? 0)) * factor;
        case "last":
          return (time(sa?.lastSubmissionAt) - time(sb?.lastSubmissionAt)) * factor;
        default:
          return (time(a.createdAt) - time(b.createdAt)) * factor;
      }
    });
  }, [forms, debounced, filters, stats, table.sortField, table.sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / table.pageSize));
  const current = Math.min(table.page, totalPages);
  const rows = filtered.slice((current - 1) * table.pageSize, current * table.pageSize);

  /* ------------------------------------------------------------- KPIs */

  const kpis = useMemo<Kpi[]>(() => {
    const active = forms.filter((form) => form.status === "active");
    const counted = submissions.filter(
      (item) => countsAsSubmission(item) && forms.some((form) => form.id === item.formId),
    );
    const views = forms.reduce((sum, form) => sum + form.views, 0);
    const week = counted.filter(
      (item) => WORKSPACE_NOW_MS - new Date(item.submittedAt).getTime() <= 7 * 86_400_000,
    );

    return [
      {
        label: "Total Forms",
        value: formatNumber(forms.length),
        icon: ClipboardList,
        tone: "brand",
        hint: `${forms.filter((form) => form.status === "draft").length} in draft`,
      },
      {
        label: "Active Forms",
        value: formatNumber(active.length),
        icon: Radio,
        tone: "success",
        hint: `${forms.filter((form) => form.status === "paused").length} paused`,
      },
      {
        label: "Total Submissions",
        value: formatNumber(counted.length),
        icon: Inbox,
        tone: "info",
        hint: `${week.length} in the last 7 days`,
      },
      {
        label: "Conversion Rate",
        value: formatPercent(views ? (counted.length / views) * 100 : 0),
        icon: Percent,
        tone: "warning",
        hint: `${formatNumber(views)} form views`,
        info: "Submissions divided by form views, across every form. Spam and preview tests are not counted.",
      },
    ];
  }, [forms, submissions]);

  /* ---------------------------------------------------------- Actions */

  function exportForms() {
    const source = filtered.length ? filtered : forms;
    const blob = new Blob([JSON.stringify(exportDefinitions(source), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `marketflow-forms-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast(`${source.length} form definition${source.length === 1 ? "" : "s"} exported`, "success");
  }

  async function importForms(file: File) {
    try {
      const result = importDefinitions(JSON.parse(await file.text()), "own-1");
      if ("error" in result) {
        toast(result.error, "error");
        return;
      }
      table.clearAll();
      setSearchDraft("");
      toast(
        `${result.imported} form${result.imported === 1 ? "" : "s"} imported as draft${result.imported === 1 ? "" : "s"}`,
        "success",
      );
    } catch {
      toast("That file could not be read as JSON.", "error");
    }
  }

  const rowActions = (form: Form): MenuItem[] => [
    {
      label: "Edit",
      icon: <Pencil className="size-4" />,
      onSelect: () => router.push(FORM_ROUTES.edit(form.id)),
    },
    {
      label: "Preview",
      icon: <Eye className="size-4" />,
      onSelect: () => setPreviewFor(form.id),
    },
    {
      label: "View submissions",
      icon: <Inbox className="size-4" />,
      onSelect: () => router.push(`${FORM_ROUTES.form(form.id)}?tab=submissions`),
    },
    {
      label: "Embed",
      icon: <Code2 className="size-4" />,
      onSelect: () => setEmbedFor(form.id),
    },
    {
      label: "Duplicate",
      icon: <Copy className="size-4" />,
      onSelect: () => {
        const copy = duplicateForm(form.id);
        if (copy) toast(`${copy.name} created as a draft`, "success");
      },
    },
    form.status === "active"
      ? {
          label: "Pause",
          icon: <Pause className="size-4" />,
          onSelect: () => {
            setFormStatus(form.id, "paused");
            toast(`${form.name} paused`, "success");
          },
        }
      : {
          label: form.status === "draft" ? "Publish" : "Activate",
          icon: <Play className="size-4" />,
          onSelect: () => {
            setFormStatus(form.id, "active");
            toast(`${form.name} is live`, "success");
          },
        },
    {
      label: "Delete",
      icon: <Trash2 className="size-4" />,
      onSelect: () => setDeleting(form),
      destructive: true,
    },
  ];

  /* ---------------------------------------------------------- Filters */

  const workflowOptions = [
    { value: "all", label: "Any workflow" },
    { value: NOT_CONNECTED, label: "Not connected" },
    ...FORM_WORKFLOWS.map((workflow) => ({ value: workflow.id, label: workflow.name })),
  ];

  const labelIn = (list: { value: string; label: string }[], value: string) =>
    list.find((item) => item.value === value)?.label ?? value;

  const chips: FilterChip[] = [
    filters.status !== "all"
      ? { key: "status", label: "Status", value: labelIn(FORM_STATUSES, filters.status) }
      : null,
    filters.type !== "all"
      ? { key: "type", label: "Type", value: labelIn(FORM_TYPES, filters.type) }
      : null,
    filters.workflow !== "all"
      ? { key: "workflow", label: "Workflow", value: labelIn(workflowOptions, filters.workflow) }
      : null,
    filters.date !== "all"
      ? { key: "date", label: "Date", value: labelIn(DATE_RANGES, filters.date) }
      : null,
  ].filter((chip): chip is FilterChip => chip !== null);

  function clearEverything() {
    setSearchDraft("");
    table.clearAll();
  }

  const filtersOn = chips.length > 0 || debounced.trim().length > 0;

  return (
    <>
      <PageHeader
        title="Forms"
        description="Create embeddable forms to capture leads and trigger automated workflows."
        secondaryActions={
          <>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void importForms(file);
              }}
            />
            <Button variant="outline" onClick={() => fileInput.current?.click()}>
              <Upload className="size-4" />
              Import
            </Button>
            <Button
              variant="outline"
              onClick={exportForms}
              disabled={forms.length === 0}
              className="max-sm:hidden"
            >
              <Download className="size-4" />
              Export
            </Button>
          </>
        }
        action={
          <ButtonLink href={FORM_ROUTES.create}>
            <Plus className="size-4" />
            Create Form
          </ButtonLink>
        }
      />

      {forms.length === 0 ? (
        <EmptyState
          title="Create your first form"
          description="Capture leads from your website and connect every submission to MarketFlow CRM and automation."
          action={
            <ButtonLink href={FORM_ROUTES.create} size="sm">
              <Plus className="size-4" />
              Create Form
            </ButtonLink>
          }
        />
      ) : (
        <>
          <KpiStrip items={kpis} />

          <Card className="p-5">
            <FilterBar
              search={searchDraft}
              onSearchChange={setSearchDraft}
              placeholder="Search forms…"
              activeCount={chips.length}
              onReset={clearEverything}
            >
              <Select
                label="Filter by status"
                size="sm"
                value={filters.status}
                onChange={(next) => table.setFilter("status", next)}
                options={[{ value: "all", label: "All statuses" }, ...FORM_STATUSES]}
                className="lg:w-36"
              />
              <Select
                label="Filter by type"
                size="sm"
                value={filters.type}
                onChange={(next) => table.setFilter("type", next)}
                options={[{ value: "all", label: "All types" }, ...FORM_TYPES]}
                className="lg:w-40"
              />
              <Select
                label="Filter by connected workflow"
                size="sm"
                value={filters.workflow}
                onChange={(next) => table.setFilter("workflow", next)}
                options={workflowOptions}
                className="lg:w-48"
              />
              <Select
                label="Filter by created date"
                size="sm"
                value={filters.date}
                onChange={(next) => table.setFilter("date", next)}
                options={[{ value: "all", label: "Any date" }, ...DATE_RANGES]}
                className="lg:w-44"
              />
            </FilterBar>

            <ActiveFilterChips
              chips={chips}
              onRemove={(key) => table.clearFilter(key as FilterKey)}
              onClearAll={clearEverything}
              className="mt-3"
            />

            {rows.length === 0 ? (
              <EmptyState
                className="mt-4"
                title={filtersOn ? "No forms match those filters" : "No forms yet"}
                description={
                  filtersOn
                    ? "Try a different search term, or clear the filters to see every form."
                    : "Create a form to start capturing leads."
                }
                action={
                  <Button size="sm" variant="outline" onClick={clearEverything}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <>
                <Table minWidth="68rem" className="mt-4 max-lg:hidden">
                  <THead>
                    <SortableTH
                      field="name"
                      activeField={table.sortField}
                      direction={table.sortDirection}
                      onSort={table.toggleSort}
                    >
                      Form Name
                    </SortableTH>
                    <TH>Type</TH>
                    <TH>Status</TH>
                    <SortableTH
                      field="submissions"
                      activeField={table.sortField}
                      direction={table.sortDirection}
                      onSort={table.toggleSort}
                      align="right"
                    >
                      Submissions
                    </SortableTH>
                    <SortableTH
                      field="conversion"
                      activeField={table.sortField}
                      direction={table.sortDirection}
                      onSort={table.toggleSort}
                      align="right"
                    >
                      Conversion Rate
                    </SortableTH>
                    <TH>Connected Workflow</TH>
                    <SortableTH
                      field="last"
                      activeField={table.sortField}
                      direction={table.sortDirection}
                      onSort={table.toggleSort}
                    >
                      Last Submission
                    </SortableTH>
                    <SortableTH
                      field="created"
                      activeField={table.sortField}
                      direction={table.sortDirection}
                      onSort={table.toggleSort}
                    >
                      Created
                    </SortableTH>
                    <TH align="right" />
                  </THead>
                  <TBody>
                    {rows.map((form) => {
                      const row = stats.get(form.id);
                      return (
                        <TR key={form.id}>
                          <TD className="max-w-64">
                            <button
                              type="button"
                              onClick={() => router.push(FORM_ROUTES.form(form.id))}
                              className="block max-w-full rounded-btn text-left focus-visible:shadow-focus focus-visible:outline-none"
                            >
                              <span className="block truncate font-semibold text-text-primary hover:text-primary">
                                {form.name}
                              </span>
                              <span className="block truncate text-sm font-normal text-text-muted">
                                {form.fields.length} field{form.fields.length === 1 ? "" : "s"}
                              </span>
                            </button>
                          </TD>
                          <TD className="whitespace-nowrap text-text-secondary">
                            {formTypeLabel(form.type)}
                          </TD>
                          <TD>
                            <FormStatusBadge status={form.status} />
                          </TD>
                          <TD align="right" className="text-text-primary tabular-nums">
                            {formatNumber(row?.submissions ?? 0)}
                          </TD>
                          <TD align="right" className="text-text-primary tabular-nums">
                            {form.views ? formatPercent(row?.conversion ?? 0) : "-"}
                          </TD>
                          <TD className="max-w-48">
                            <WorkflowCell workflowId={form.automation.workflowId} />
                          </TD>
                          <TD className="whitespace-nowrap text-text-muted">
                            {row?.lastSubmissionAt ? formatDateTime(row.lastSubmissionAt) : "Never"}
                          </TD>
                          <TD className="whitespace-nowrap text-text-muted">
                            {formatDate(form.createdAt)}
                          </TD>
                          <TD align="right">
                            <Menu items={rowActions(form)} label={`Actions for ${form.name}`} />
                          </TD>
                        </TR>
                      );
                    })}
                  </TBody>
                </Table>

                {/* Below `lg`, one card per form: name, status, the two
                    numbers that matter, and the same actions. */}
                <ul className="mt-4 space-y-2.5 lg:hidden">
                  {rows.map((form) => {
                    const row = stats.get(form.id);
                    return (
                      <li key={form.id} className="rounded-panel border border-border p-3.5">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => router.push(FORM_ROUTES.form(form.id))}
                            className="min-w-0 flex-1 rounded-btn text-left focus-visible:shadow-focus focus-visible:outline-none"
                          >
                            <span className="block truncate text-sm font-semibold text-text-primary">
                              {form.name}
                            </span>
                            <span className="block text-sm text-text-muted">
                              {formTypeLabel(form.type)}
                            </span>
                          </button>
                          <Menu items={rowActions(form)} label={`Actions for ${form.name}`} />
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <FormStatusBadge status={form.status} />
                          <span className="text-sm text-text-secondary tabular-nums">
                            {formatNumber(row?.submissions ?? 0)} submissions
                          </span>
                          {form.views ? (
                            <span className="text-sm text-text-secondary tabular-nums">
                              {formatPercent(row?.conversion ?? 0)} conversion
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 text-sm text-text-muted">
                          <WorkflowCell workflowId={form.automation.workflowId} />
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <Pagination
                  page={current}
                  totalPages={totalPages}
                  total={filtered.length}
                  perPage={table.pageSize}
                  onChange={table.setPage}
                  noun="forms"
                />
              </>
            )}
          </Card>
        </>
      )}

      <FormEmbedDialog
        formId={embedFor}
        onClose={() => setEmbedFor(null)}
        onPreview={(id) => {
          setEmbedFor(null);
          setPreviewFor(id);
        }}
      />
      <FormPreviewDialog formId={previewFor} onClose={() => setPreviewFor(null)} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          deleteForm(deleting.id);
          toast(`${deleting.name} deleted`, "success");
        }}
        title={deleting ? `Delete ${deleting.name}?` : "Delete form?"}
        description="The form and its submission history are removed. Pages carrying its embed code stop showing it."
        confirmLabel="Delete form"
      >
        <p className="text-sm text-text-secondary">
          Contacts and leads its submissions created stay in the CRM - deleting
          a form never deletes a customer.
        </p>
      </ConfirmDialog>
    </>
  );
}

/** The connected workflow, linked into Automation, or a quiet "None". */
export function WorkflowCell({ workflowId }: { workflowId?: string }) {
  const workflow = formWorkflowById(workflowId);
  if (!workflow) return <span className="text-text-muted">Not connected</span>;

  return (
    <ButtonLink
      href={AUTOMATION_ROUTES.workflow(workflow.id)}
      variant="text"
      size="inline"
      className="max-w-full"
    >
      <span className="truncate">{workflow.name}</span>
    </ButtonLink>
  );
}
