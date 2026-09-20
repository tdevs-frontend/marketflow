"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { APP_ROUTES } from "@/constants/app";
import { useWorkspaceSettings } from "@/lib/workspace-settings-store";

import { DetailList, SettingsSection } from "../settings-section";

/**
 * Who an invoice would be addressed to — read from the record that owns it.
 *
 * The legal name, support address and business address live in Workspace
 * Settings under Business, and they stay there. This is the third place in the
 * module to make that call, and for the same reason each time: two editors for
 * one value is not a convenience, it is a question about which screen is
 * telling the truth, and the merchant has no way to answer it. So the control
 * here is a link to the editor, not a second copy of it.
 *
 * The billing address is part of this card rather than a section of its own.
 * It is two lines of the same record, entered in the same form, and a heading
 * over it would promise a separate thing to manage — the brief's own rule
 * against fields added for visual completeness applies to headings too.
 */
export function BillingContact() {
  const { business } = useWorkspaceSettings();

  const address = [business.address, business.country].filter(Boolean).join(", ");

  return (
    <SettingsSection
      title="Billing contact"
      description="Taken from the workspace business details, where invoices would be addressed."
      action={
        <Link
          href={APP_ROUTES.workspaceSettings}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Edit billing information
          <ArrowUpRight aria-hidden />
        </Link>
      }
    >
      <DetailList
        columns={3}
        items={[
          { label: "Billing name", value: business.legalName || "Not recorded" },
          {
            label: "Billing email",
            value: business.supportEmail || "Not recorded",
          },
          { label: "Billing address", value: address || "Not recorded" },
        ]}
      />
    </SettingsSection>
  );
}
