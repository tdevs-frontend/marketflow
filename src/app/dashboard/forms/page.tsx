import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Forms" };

/**
 * Forms had a sidebar link under Growth and no route behind it - a 404 from
 * the navigation. The link moved to Marketing in the cleanup; this makes it
 * resolve.
 */
export default function FormsPage() {
  return (
    <ModulePlaceholder
      title="Forms"
      description="Capture leads from your site and route them straight into a workflow."
      summary="Forms will let you build a capture form, embed it, and have every submission raise the Form Submitted trigger. Until then, the trigger already exists and any workflow can listen for it."
      action={
        <ButtonLink
          href="/dashboard/automation/triggers/trg-form-submitted"
          size="sm"
          variant="outline"
        >
          See the Form Submitted trigger
        </ButtonLink>
      }
    />
  );
}
