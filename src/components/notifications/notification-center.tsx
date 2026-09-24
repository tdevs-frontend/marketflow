"use client";

import { useId } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { NotificationSettings } from "@/components/settings";
import { Button } from "@/components/ui/button";
import { Tabs, TabPanel, type TabItem } from "@/components/ui/tabs";
import { APP_ROUTES } from "@/constants/app";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { markAllRead } from "@/redux/features/notification/notificationSlice";

import { NotificationsWorkspace } from "./notifications-workspace";

/**
 * Settings › Notifications - two tabs, and the split between them is the point.
 *
 *   **Activity** is the feed: what happened, newest first, with search, an
 *   unread filter and pages. The same list the header bell shows, at the length
 *   a panel cannot hold.
 *
 *   **Preferences** is the catalogue: fifty-odd events across every module,
 *   and which of them should reach you on which channel.
 *
 * They were two pages at two routes, and one route now, because a merchant who
 * arrives at "Notifications" wants one of two things and cannot be expected to
 * know which URL holds which. The tab strip is the question - "what happened"
 * or "what do I want to hear about" - asked where they are already standing.
 *
 * What the split is *not* is cosmetic. The feed is a record of occurrences; the
 * catalogue is a set of switches. Merging them into one list would give the
 * reader a page where some rows are events they can act on and others are
 * settings they can toggle, which is the shape of a page nobody can scan.
 *
 * The header belongs to this shell rather than to either panel, so the title
 * does not change when the tab does - and "Mark all as read" sits in its action
 * slot, rendered only on the tab where it means something.
 */

type NotificationTab = "activity" | "preferences";

const TABS: TabItem<NotificationTab>[] = [
  { value: "activity", label: "Activity" },
  { value: "preferences", label: "Preferences" },
];

/** `?tab=` is anybody's to type, so it is checked against the strip itself. */
const isTab = (value: string | null): value is NotificationTab =>
  TABS.some((item) => item.value === value);

export function NotificationCenter() {
  const router = useRouter();
  const params = useSearchParams();
  const idBase = useId();

  const dispatch = useAppDispatch();
  const unread = useAppSelector(
    (state) => state.notification.items.filter((item) => !item.read).length,
  );

  /*
   * The tab lives in the URL, so "here is what happened" and "here is what I
   * subscribe to" are two links somebody can send. Validated against `TABS`
   * rather than compared to one string, so an unrecognised `?tab=` falls back
   * to Activity instead of rendering an empty panel. The default drops the
   * parameter rather than writing `?tab=activity`, so the clean URL and the
   * explicit one land in the same place.
   */
  const requested = params.get("tab");
  const tab: NotificationTab = isTab(requested) ? requested : "activity";

  const setTab = (value: NotificationTab) => {
    const next = new URLSearchParams(params.toString());
    if (value === "activity") next.delete("tab");
    else next.set("tab", value);

    const query = next.toString();
    const base = APP_ROUTES.settingsNotifications;
    router.push(query ? `${base}?${query}` : base, { scroll: false });
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Stay up to date with orders, leads, campaigns, automations, messages, and account activity."
        action={
          /* Only on Activity, and only when there is something to mark. A
             permanently visible "Mark all as read" on an already-read feed is
             a control that teaches the reader their click did nothing - and on
             the Preferences tab it would act on a list that is not even in
             view. */
          tab === "activity" && unread > 0 ? (
            <Button
              type="button"
              onClick={() => dispatch(markAllRead())}
              variant="link"
              size="inline"
              className="font-semibold"
            >
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {/* `bleed={false}`: the strip sits on the page, not inside a card, and
          the −20px pull is measured against a `CardBody`'s padding. */}
      <Tabs
        tabs={TABS}
        value={tab}
        onChange={setTab}
        label="Notification sections"
        idBase={idBase}
        bleed={false}
      />

      {tab === "activity" ? (
        <TabPanel idBase={idBase} value="activity" className="space-y-6">
          <NotificationsWorkspace />
        </TabPanel>
      ) : (
        <TabPanel idBase={idBase} value="preferences" className="space-y-6">
          <NotificationSettings />
        </TabPanel>
      )}
    </>
  );
}
