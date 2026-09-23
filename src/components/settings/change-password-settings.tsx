"use client";

import { PageHeader } from "@/components/layout/page-header";

import { ChangePasswordCard } from "./change-password-card";

/**
 * Change Password - a route of its own in the Settings rail.
 *
 * The page frame around `ChangePasswordCard`: a title, a description, and
 * nothing else. The card is untouched and still carries its own heading, its
 * own save bar and its own `#password` anchor, so the two places it renders
 * cannot drift apart - there is one form, one validator and one service call
 * behind both.
 *
 * Worth knowing: the same card is still the first section of the Security
 * page, which is where it has always been. Two entries in the rail now reach
 * it, and that is a deliberate call rather than an oversight - see the note in
 * the summary for this change. If the duplication is unwanted, the fix is to
 * drop `<ChangePasswordCard />` from `security-settings`; nothing else has to
 * move, because the card was never coupled to that page.
 */
export function ChangePasswordSettings() {
  return (
    <>
      <PageHeader
        title="Change Password"
        description="Rotate the credential you sign in with."
      />

      <div className="space-y-6">
        <ChangePasswordCard />
      </div>
    </>
  );
}
