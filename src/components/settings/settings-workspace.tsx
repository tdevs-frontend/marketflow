"use client";

import { useId, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/tabs";

import { GeneralSettings } from "./general-settings";
import { NotificationSettings } from "./notification-settings";
import { ProfileSettings } from "./profile-settings";
import { SecuritySettings } from "./security-settings";

/**
 * Settings, as four tabs on one page.
 *
 * Profile, Notifications and Security used to be three more sidebar rows,
 * which made Settings the longest section in the product and asked a merchant
 * to pick between four things before knowing what was in any of them. They are
 * all *this page* — one screen, four readings.
 *
 * General is a reading, not a form. Every field it used to offer — workspace
 * name, timezone, from name, reply-to — already had an owner elsewhere, so it
 * now shows the live values and links to the screens that own them rather
 * than standing as a second editor for four settings that each had one.
 *
 * Billing keeps its own route: it is the company's money rather than a
 * preference belonging to whoever is signed in, and it is long enough to want
 * a page to itself. API & Developer is not here at all — that module already
 * exists under Integrations, and General links across to it.
 *
 * `Tabs` is the component the rest of the dashboard already uses — the same
 * underline strip as the workflow detail screen, with the same `role="tablist"`
 * semantics and arrow-key movement. Nothing new was drawn for this.
 */

type TabValue = "general" | "profile" | "notifications" | "security";

const TABS: TabItem<TabValue>[] = [
  { value: "general", label: "General" },
  { value: "profile", label: "Profile" },
  { value: "notifications", label: "Notifications" },
  { value: "security", label: "Security" },
];

export function SettingsWorkspace() {
  const idBase = useId();
  const [tab, setTab] = useState<TabValue>("general");

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your workspace, your own account and how MarketFlow reaches you."
      />

      {/* `bleed={false}` — the strip sits on the page, not inside a card, so
          it lines up with the header above it and the panels below. */}
      <Tabs
        tabs={TABS}
        value={tab}
        onChange={setTab}
        label="Settings sections"
        idBase={idBase}
        bleed={false}
      />

      {/* Only the open panel renders. Each one holds its own form state, and
          mounting all four would put three untouched forms in the tree for
          every visit. */}
      {tab === "general" ? (
        <TabPanel idBase={idBase} value="general">
          <GeneralSettings />
        </TabPanel>
      ) : null}

      {tab === "profile" ? (
        <TabPanel idBase={idBase} value="profile">
          <ProfileSettings />
        </TabPanel>
      ) : null}

      {tab === "notifications" ? (
        <TabPanel idBase={idBase} value="notifications">
          <NotificationSettings />
        </TabPanel>
      ) : null}

      {tab === "security" ? (
        <TabPanel idBase={idBase} value="security">
          <SecuritySettings />
        </TabPanel>
      ) : null}
    </>
  );
}
