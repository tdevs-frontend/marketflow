"use client";

import type { ReactNode } from "react";
import { History, KeyRound, MonitorSmartphone, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { useSecurityState } from "@/lib/account-store";
import { cn } from "@/lib/utils";

import { ActiveSessionsCard } from "./active-sessions-card";
import { ChangePasswordCard } from "./change-password-card";
import { LoginActivityCard } from "./login-activity-card";
import { TwoFactorCard } from "./two-factor-card";

/**
 * Security — one page, four answers.
 *
 * The questions a person actually arrives with, in the order they arrive in:
 *
 *   Change password    can I rotate my credential
 *   Two-factor         is a stolen password enough on its own
 *   Active sessions    what is signed in right now
 *   Login activity     has anyone else tried
 *
 * One route rather than four, because they are read together. Somebody who
 * comes here after a scare wants all four answers in one scroll, and a person
 * who has to navigate between them will check the first and assume the rest.
 * Four cards on a page is also the shape every mature account-security screen
 * has settled on, which is worth something on its own — this is not a screen
 * to be inventive on.
 *
 * The bottom two are new, and they are the reason this page stopped being two
 * cards. They are also where honesty costs the most. A sessions list is the
 * classic thing to fake — three plausible devices in three cities, each with a
 * Sign out button that ends nothing — and faking it would poison the two cards
 * above, which are real. So Active Sessions lists the one session it can
 * genuinely observe, this browser, and says plainly that the others need the
 * account service; Login Activity says it has no history rather than showing
 * an empty list, because "nothing recorded" and "nobody has ever signed in"
 * are different claims. Each card carries the argument in full.
 *
 * Stacked, not two columns. The password form is a tall column of fields, and
 * a two-up layout would put the 2FA actions off the bottom of a laptop screen
 * beside a form somebody is halfway through.
 *
 * There is no Danger Zone. Deleting an account is a server-side cascade across
 * a workspace, its members and its billing relationship; nothing here can
 * perform it, and a delete button that opens a dialog to explain that would be
 * a loaded gun aimed at a wall. It belongs at the bottom of this page on the
 * day the service can honour it.
 */

export function SecuritySettings() {
  const security = useSecurityState();
  const twoFactorOn = security.twoFactor === "enabled";

  return (
    <>
      <PageHeader
        title="Security"
        description="Protect your account and manage authentication."
      />

      <div className="space-y-6">
        {/*
          Jump links, which is the whole of the "Security contains four
          sections" structure. Real anchors rather than nested routes: the
          sections are on this page, and a route per card would turn the
          navigation rail into a table of contents.
        */}
        <nav aria-label="Security sections" className="flex flex-wrap gap-2.5">
          <SectionLink href="#password" icon={KeyRound}>
            Change password
          </SectionLink>

          <SectionLink href="#two-factor" icon={ShieldCheck}>
            Two-factor authentication
            <Badge tone={twoFactorOn ? "success" : "neutral"} size="sm">
              {twoFactorOn ? "On" : "Off"}
            </Badge>
          </SectionLink>

          <SectionLink href="#sessions" icon={MonitorSmartphone}>
            Active sessions
          </SectionLink>

          <SectionLink href="#login-activity" icon={History}>
            Login activity
          </SectionLink>
        </nav>

        <ChangePasswordCard />
        <TwoFactorCard />
        <ActiveSessionsCard />
        <LoginActivityCard />
      </div>
    </>
  );
}

function SectionLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof KeyRound;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-btn border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-text-secondary transition-colors",
        "hover:border-border-strong hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none",
      )}
    >
      <Icon className="size-4 text-text-muted" aria-hidden />
      {children}
    </a>
  );
}
