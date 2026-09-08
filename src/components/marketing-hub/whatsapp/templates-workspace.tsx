"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { channelCrumbs } from "@/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { FilterBar } from "@/components/commerce/filter-bar";
import {
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_LANGUAGES,
  TEMPLATE_STATUSES,
  TEMPLATE_USE_CASES,
} from "@/lib/whatsapp-fixtures";
import type {
  TemplateCategory,
  TemplateStatus,
  TemplateUseCase,
  WhatsAppTemplate,
} from "@/types/marketing";
import { TemplateCard } from "./template-card";
import { TemplateFormDialog, TemplatePreviewDialog } from "./template-dialogs";

const ALL = "all";

export function TemplatesWorkspace() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<TemplateCategory | typeof ALL>(ALL);
  const [status, setStatus] = useState<TemplateStatus | typeof ALL>(ALL);
  const [language, setLanguage] = useState<string>(ALL);
  /* The library shelf, separate from the Meta category — see
     `TEMPLATE_USE_CASES`. */
  const [useCase, setUseCase] = useState<TemplateUseCase | typeof ALL>(ALL);

  const [previewing, setPreviewing] = useState<WhatsAppTemplate | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WhatsAppTemplate | null>(null);
  const [deleting, setDeleting] = useState<WhatsAppTemplate | null>(null);

  const activeFilters =
    (category === ALL ? 0 : 1) +
    (useCase === ALL ? 0 : 1) +
    (status === ALL ? 0 : 1) +
    (language === ALL ? 0 : 1);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return TEMPLATES.filter((template) => {
      if (
        term &&
        !template.name.toLowerCase().includes(term) &&
        !template.body.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (category !== ALL && template.category !== category) return false;
      if (useCase !== ALL && template.useCase !== useCase) return false;
      if (status !== ALL && template.status !== status) return false;
      if (language !== ALL && template.language !== language) return false;
      return true;
    });
  }, [search, category, useCase, status, language]);

  function resetFilters() {
    setCategory(ALL);
    setUseCase(ALL);
    setStatus(ALL);
    setLanguage(ALL);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  return (
    <>
      {/* The header lives here because its action opens a dialog. */}
      <PageHeader
        title="WhatsApp Templates"
        description="Create and manage reusable WhatsApp message templates."
        breadcrumb={channelCrumbs("whatsapp", "Templates")}
        action={
          <Button size="compact" onClick={openCreate}>
            <Plus aria-hidden />
            Create Template
          </Button>
        }
      />

      <Card className="p-5">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search templates…"
          activeCount={activeFilters}
          onReset={resetFilters}
        >
          <Select
            label="Filter by category"
            size="sm"
            value={category}
            onChange={(next) => setCategory(next as TemplateCategory | typeof ALL)}
            options={[{ value: ALL, label: "All categories" }, ...TEMPLATE_CATEGORIES]}
            className="lg:w-44"
          />

          <Select
            label="Filter by use case"
            size="sm"
            value={useCase}
            onChange={(next) => setUseCase(next as TemplateUseCase | typeof ALL)}
            options={[{ value: ALL, label: "All use cases" }, ...TEMPLATE_USE_CASES]}
            className="lg:w-40"
          />

          <Select
            label="Filter by status"
            size="sm"
            value={status}
            onChange={(next) => setStatus(next as TemplateStatus | typeof ALL)}
            options={[{ value: ALL, label: "All statuses" }, ...TEMPLATE_STATUSES]}
            className="lg:w-40"
          />

          <Select
            label="Filter by language"
            size="sm"
            value={language}
            onChange={setLanguage}
            options={[{ value: ALL, label: "All languages" }, ...TEMPLATE_LANGUAGES]}
            className="lg:w-44"
          />
        </FilterBar>

        <p className="mt-4 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "template" : "templates"}
          {activeFilters > 0 || search ? " match your filters" : " in this workspace"}.
        </p>

        {filtered.length === 0 ? (
          <EmptyState
            title={
              activeFilters > 0 || search
                ? "No templates match those filters"
                : "No templates yet"
            }
            description={
              activeFilters > 0 || search
                ? "Try a different search term, or clear the filters."
                : "Create your first template to start sending WhatsApp campaigns."
            }
            action={
              activeFilters > 0 || search ? (
                <Button size="sm" variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button size="sm" onClick={openCreate}>
                  <Plus aria-hidden />
                  Create Template
                </Button>
              )
            }
          />
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onPreview={() => setPreviewing(template)}
                onEdit={() => {
                  setEditing(template);
                  setFormOpen(true);
                }}
                onDuplicate={() => toast(`${template.name} duplicated`)}
                onDelete={() => setDeleting(template)}
              />
            ))}
          </div>
        )}
      </Card>

      <TemplatePreviewDialog
        template={previewing}
        onClose={() => setPreviewing(null)}
      />

      <TemplateFormDialog
        open={formOpen}
        template={editing}
        onClose={() => setFormOpen(false)}
      />

      <Dialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete template?"
        description={deleting?.name}
        footer={
          <>
            <Button variant="outline" size="compact" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="compact"
              onClick={() => {
                setDeleting(null);
                toast("Template deleted successfully");
              }}
            >
              Delete template
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Campaigns already using this template keep sending. New campaigns will no
          longer be able to select it.
        </p>
      </Dialog>
    </>
  );
}
