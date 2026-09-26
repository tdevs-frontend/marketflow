"use client";

import { ChevronLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FORM_ROUTES } from "@/constants/forms";
import { useForm } from "@/lib/form-store";
import { FormBuilder } from "./form-builder";

/**
 * The builder, opened on an existing form.
 *
 * Resolved from the store on the client, like the detail page, so a form
 * created or duplicated this session can be edited too. `key` remounts the
 * builder if the id changes under it, so a draft never carries over between
 * two forms.
 */
export function FormEditor({ id }: { id: string }) {
  const form = useForm(id);

  return (
    <>
      <ButtonLink
        href={form ? FORM_ROUTES.form(form.id) : FORM_ROUTES.list}
        variant="subtle"
        size="inline"
        className="w-fit text-[15px]"
      >
        <ChevronLeft aria-hidden />
        {form ? `Back to ${form.name}` : "Back to forms"}
      </ButtonLink>

      {form ? (
        <>
          <PageHeader
            title={`Edit ${form.name}`}
            description="Changes apply to every page carrying this form's embed code."
          />
          <FormBuilder key={form.id} form={form} />
        </>
      ) : (
        <EmptyState
          title="This form does not exist"
          description="It may have been deleted, or it was created in another session - forms made here are kept for the browser session only."
          action={
            <ButtonLink href={FORM_ROUTES.list} size="sm" variant="outline">
              Back to forms
            </ButtonLink>
          }
        />
      )}
    </>
  );
}
