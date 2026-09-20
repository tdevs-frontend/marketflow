"use client";

import { useCallback } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { listSignInActivity } from "@/lib/account-service";
import { deviceSummary } from "@/lib/user-agent";
import type { DeviceKind, ServiceResult, SignInEvent } from "@/types/account";
import { ok } from "@/types/account";

import { SectionError } from "./active-sessions-card";
import { ServiceNotice } from "./service-notice";
import { SettingsRow, SettingsSection, useServiceQuery } from "./settings-section";

/**
 * Login activity — who has tried to get in, and whether they managed it.
 *
 * A compact list, deliberately. It is checked in a particular mood, usually
 * after something has gone wrong, and what it has to support is a single scan
 * down the left edge for a day or a device that does not belong. A chart of
 * sign-ins per week answers a question nobody has ever asked their own account
 * page.
 *
 * The failed attempts are the reason the section exists, so they are in the
 * same list as the successes rather than behind a filter, and a failure inside
 * the alert window raises the notice at the top of the card. That alert is
 * *derived*, entirely — it counts rows the service returned. There is no
 * branch anywhere that can raise a security warning without a failed sign-in
 * behind it, which is the only way a warning on this page is worth anything.
 *
 * Today the service reports `service_unavailable` and this card says so. A
 * sign-in log is a record of events that happened elsewhere, at times this
 * browser was not running; the front end cannot reconstruct one, and an empty
 * list would be a different claim and a false one — that nobody has ever
 * signed into this account. The stated boundary gets no Try again button,
 * because there is nothing on the other side of it to retry.
 */

/** How far back a failure still deserves a banner rather than a row. */
const ALERT_WINDOW_DAYS = 30;

const DEVICE_ICON: Record<DeviceKind, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: Monitor,
};

/** The list, plus the one thing about it worth a banner. */
interface ActivityView {
  events: SignInEvent[];
  /** Failed attempts inside the alert window, counted when the list was read. */
  recentFailures: number;
}

export function LoginActivityCard() {
  /*
   * The window is measured where the list is fetched rather than where it is
   * drawn. Two reasons, and the second is the real one: the moment the service
   * answered is the moment "in the last 30 days" refers to, and a clock read
   * during render is an impurity that makes every row re-derive on any parent
   * update.
   */
  const load = useCallback(async (): Promise<ServiceResult<ActivityView>> => {
    const result = await listSignInActivity();
    if (!result.ok) return result;

    const cutoff = Date.now() - ALERT_WINDOW_DAYS * 86_400_000;

    return ok({
      events: result.data,
      recentFailures: result.data.filter(
        (event) =>
          event.outcome === "failed" && new Date(event.at).getTime() >= cutoff,
      ).length,
    });
  }, []);

  const { state, reload } = useServiceQuery(load);

  const events = state.data?.events ?? [];
  const recentFailures = state.data?.recentFailures ?? 0;

  const unavailable =
    state.status === "error" && state.error.code === "service_unavailable";

  return (
    <SettingsSection
      id="login-activity"
      title="Login activity"
      description="Recent sign-in attempts on your account, successful and not."
      action={
        state.status === "ready" && events.length > 0 ? (
          <Badge
            tone={recentFailures > 0 ? "warning" : "neutral"}
            className="whitespace-nowrap"
          >
            {events.length} recent
          </Badge>
        ) : null
      }
      bodyClassName="-mx-5"
    >
      {recentFailures > 0 ? (
        <div className="p-5 pb-0">
          <ServiceNotice tone="security" title="A sign-in attempt failed">
            {recentFailures === 1
              ? `One attempt in the last ${ALERT_WINDOW_DAYS} days did not succeed.`
              : `${recentFailures} attempts in the last ${ALERT_WINDOW_DAYS} days did not succeed.`}{" "}
            If none of them were you, change your password and turn on
            two-factor authentication.
          </ServiceNotice>
        </div>
      ) : null}

      {state.status === "loading" ? <ActivitySkeleton /> : null}

      {unavailable ? (
        <div className="p-5">
          <ServiceNotice tone="unavailable" title="No sign-in history yet">
            {state.status === "error" ? state.error.message : null} Once one
            is, sign-ins appear here newest first, with the failures marked.
          </ServiceNotice>
        </div>
      ) : null}

      {state.status === "error" && !unavailable ? (
        <SectionError
          message={state.error.message}
          onRetry={() => void reload()}
        />
      ) : null}

      {state.status === "ready" ? (
        events.length === 0 ? (
          <div className="p-5">
            <EmptyState
              compact
              title="Nothing recorded yet"
              description="Sign-in attempts on your account will be listed here, newest first."
            />
          </div>
        ) : (
          events.map((event) => <ActivityRow key={event.id} event={event} />)
        )
      ) : null}
    </SettingsSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Row                                                                        */
/* -------------------------------------------------------------------------- */

function ActivityRow({ event }: { event: SignInEvent }) {
  const Icon = DEVICE_ICON[event.device.kind];
  const failed = event.outcome === "failed";

  return (
    <SettingsRow
      className="border-b border-border last:border-b-0"
      actions={
        <Badge tone={failed ? "danger" : "success"} size="sm">
          {failed ? "Failed" : "Successful"}
        </Badge>
      }
    >
      <div className="flex min-w-0 items-start gap-3.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-secondary">
          <Icon className="size-4.5" aria-hidden />
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">
            {whenLabel(event.at)}
          </p>
          <p className="mt-0.5 truncate text-sm text-text-secondary">
            {deviceSummary(event.device)}
            {event.location ? ` · ${event.location}` : null}
          </p>
        </div>
      </div>
    </SettingsRow>
  );
}

/**
 * "Today · 09:42 AM", then "Yesterday", then a date.
 *
 * Relative for the two days somebody can hold in their head, absolute after
 * that. "3 days ago" reads as precision it is not: the question this list
 * answers is whether a particular evening was you, and that needs a date.
 *
 * Calendar days, not elapsed hours — 11pm and 1am are yesterday and today even
 * though two hours separate them, and an elapsed-time comparison gets that
 * backwards exactly when somebody is checking a late-night sign-in.
 */
function whenLabel(at: string): string {
  const date = new Date(at);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

  const days = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / 86_400_000,
  );

  if (days === 0) return `Today · ${time}`;
  if (days === 1) return `Yesterday · ${time}`;

  const day = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);

  return `${day} · ${time}`;
}

/* -------------------------------------------------------------------------- */
/* Loading                                                                    */
/* -------------------------------------------------------------------------- */

function ActivitySkeleton() {
  return (
    <div aria-hidden>
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="flex items-center gap-3.5 border-b border-border px-5 py-3.5 last:border-b-0"
        >
          <Skeleton className="size-9 rounded-btn" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-36 rounded-full" />
            <Skeleton className="h-3 w-48 max-w-full rounded-full" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
      <span className="sr-only">Loading your recent sign-in activity…</span>
    </div>
  );
}
