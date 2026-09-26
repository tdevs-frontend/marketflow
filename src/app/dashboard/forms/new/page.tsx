import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";

import { FormBuilder } from "@/components/forms";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { FORM_ROUTES } from "@/constants/forms";

export const metadata: Metadata = { title: "Create form" };

/**
 * The builder as a route rather than a dialog, like Create Campaign and
 * Create Automation - six steps with a live preview is more than a modal holds.
 * A static segment, so it wins over the sibling `[id]` route.
 */
export default function NewFormPage() {
  return (
    <>
      <ButtonLink href={FORM_ROUTES.list} variant="subtle" size="inline" className="w-fit text-[15px]">
        <ChevronLeft aria-hidden />
        Back to forms
      </ButtonLink>

      <PageHeader
        title="Create Form"
        description="Build it, decide what a submission does in the CRM, and connect it to a workflow."
      />

      <FormBuilder />
    </>
  );
}
