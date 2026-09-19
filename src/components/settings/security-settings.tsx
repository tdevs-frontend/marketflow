"use client";

import type { ReactNode } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { useSecurityState } from "@/lib/account-store";
import { cn } from "@/lib/utils";

import { ChangePasswordCard } from "./change-password-card";
import { TwoFactorCard } from "./two-factor-card";

/**
 * Security — the account's locks, both of them, on one page.
 *
 * Two sections and no more. Change Password and Two-Factor Authentication are
 * the two halves of one question — *is my account safe* — and they are read
 * together; putting a route between them would mean nobody ever sees both
 * answers at once. Everything else that could be argued onto a security page
 * (active sessions, sign-in history, trusted devices) needs a server to be
 * anything other than a drawing of itself, and a list of invented devices in
 * cities the merchant has never visited, each with a Sign out button that ends
 * no session, is exactly the kind of thing this rebuild exists to delete.
 *
 * Stacked rather than side by side. They are read top to bottom in order of how
 * often they are needed, the password form is a tall column of fields, and a
 * two-column layout would put the 2FA card's actions off the bottom of a
 * laptop screen next to a form somebody is halfway through.
 */

export function SecuritySettings() {
  const security = useSecurityState();

  return (
    <>
      <PageHeader
        title="Security"
        description="Protect your account and manage authentication."
      />

      <div className="space-y-6">
        {/*
          Two jump links, which is the whole of the "Security contains Change
          Password and Two-Factor" structure. Real anchors rather than nested
          routes: the sections are on this page, and a route per card would make
          the sidebar a table of contents.
        */}
        <nav aria-label="Security sections" className="flex flex-wrap gap-2.5">
          <SectionLink href="#password" icon={KeyRound}>
            Change password
          </SectionLink>
          <SectionLink href="#two-factor" icon={ShieldCheck}>
            Two-factor authentication
            <Badge
              tone={security.twoFactor === "enabled" ? "success" : "neutral"}
              size="sm"
            >
              {security.twoFactor === "enabled" ? "On" : "Off"}
            </Badge>
          </SectionLink>
        </nav>

        <ChangePasswordCard />
        <TwoFactorCard />
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
