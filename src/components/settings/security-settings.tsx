"use client";

import { useId } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabPanel, type TabItem } from "@/components/ui/tabs";
import { APP_ROUTES } from "@/constants/app";

import { ActiveSessionsCard } from "./active-sessions-card";
import { LoginActivityCard } from "./login-activity-card";
import { TwoFactorCard } from "./two-factor-card";

/**
 * Security - three tabs, one question each.
 *
 *   **Two-factor authentication**  is a stolen password enough on its own
 *   **Active sessions**            what is signed in right now
 *   **Login activity**             has anyone else tried
 *
 * They were three cards stacked on one page under a strip of jump links that
 * scrolled between them. Tabs rather than that strip for two reasons: a page
 * sitting beside a navigation rail does not want a second set of links that
 * only move the scrollbar, and each of these sections is long enough that the
 * other two were pushed off the screen anyway. The strip was a table of
 * contents for a page you could not see the contents of.
 *
 * The same `Tabs` the Notifications and Billing pages use, so the three tabbed
 * Settings screens look and behave identically - same height, weight, active
 * rule and keyboard handling. Nothing here draws a tab of its own.
 *
 * Changing a password is deliberately *not* a fourth tab. It has its own rail
 * item and its own route; it is a form somebody came to submit, where these
 * three are states somebody came to check. It used to be the first card on this
 * page as well, which meant one form reachable from two places in the rail and
 * two headings for one thing.
 *
 * There is no Danger Zone. Deleting an account is a server-side cascade across
 * a workspace, its members and its billing relationship; nothing here can
 * perform it, and a delete button that opens a dialog to explain that would be
 * a loaded gun aimed at a wall. It belongs on this page on the day the service
 * can honour it.
 *
 * The honesty in the bottom two tabs is load-bearing and unchanged. A sessions
 * list is the classic thing to fake - three plausible devices in three cities,
 * each with a Sign out button that ends nothing - and faking it would poison
 * the two-factor tab, which is real. So Active sessions lists the one session
 * it can genuinely observe, this browser, and says plainly that the others need
 * the account service; Login activity says it has no history rather than
 * showing an empty list, because "nothing recorded" and "nobody has ever signed
 * in" are different claims.
 */

type SecurityTab = "2fa" | "sessions" | "login-activity";

const TABS: TabItem<SecurityTab>[] = [
  { value: "2fa", label: "Two-Factor Authentication" },
  { value: "sessions", label: "Active Sessions" },
  { value: "login-activity", label: "Login Activity" },
];

/** `?tab=` is anybody's to type, so it is checked against the strip itself. */
const isSecurityTab = (value: string | null): value is SecurityTab =>
  TABS.some((item) => item.value === value);

export function SecuritySettings() {
  const router = useRouter();
  const params = useSearchParams();
  const idBase = useId();

  /*
   * The tab lives in the URL, so "here is my two-factor state" and "here is
   * what is signed in" are two links somebody can send - which matters more on
   * this page than most, because those are the links a support reply contains.
   *
   * Validated against `TABS` rather than compared to one string, so `?tab=`
   * anything unrecognised falls back to Two-Factor instead of rendering an
   * empty panel. The default drops the parameter rather than writing
   * `?tab=2fa`, so the clean URL and the explicit one land in the same place.
   */
  const requested = params.get("tab");
  const tab: SecurityTab = isSecurityTab(requested) ? requested : "2fa";

  /*
   * `push`, not `replace`. Each tab is a place the reader navigated to, and
   * Back should return them to the one they came from rather than dropping
   * them out of Settings from the middle of the module.
   */
  const setTab = (value: SecurityTab) => {
    const next = new URLSearchParams(params.toString());
    if (value === "2fa") next.delete("tab");
    else next.set("tab", value);

    const query = next.toString();
    const base = APP_ROUTES.settingsSecurity;
    router.push(query ? `${base}?${query}` : base, { scroll: false });
  };

  return (
    <>
      <PageHeader
        title="Security"
        description="Protect your account and manage authentication."
      />

      {/* `bleed={false}`: the strip sits on the page, not inside a card, and
          the −20px pull is measured against a `CardBody`'s padding. */}
      <Tabs
        tabs={TABS}
        value={tab}
        onChange={setTab}
        label="Security sections"
        idBase={idBase}
        bleed={false}
      />

      {tab === "2fa" ? (
        <TabPanel idBase={idBase} value="2fa" className="space-y-6">
          <TwoFactorCard />
        </TabPanel>
      ) : tab === "sessions" ? (
        <TabPanel idBase={idBase} value="sessions" className="space-y-6">
          <ActiveSessionsCard />
        </TabPanel>
      ) : (
        <TabPanel idBase={idBase} value="login-activity" className="space-y-6">
          <LoginActivityCard />
        </TabPanel>
      )}
    </>
  );
}
