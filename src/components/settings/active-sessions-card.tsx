"use client";

import { useCallback, useState } from "react";
import {
  Loader2,
  LogOut,
  Monitor,
  RotateCcw,
  Smartphone,
  Tablet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CAPABILITIES,
  UNAVAILABLE_REASON,
  listSessions,
  revokeOtherSessions,
  revokeSession,
} from "@/lib/account-service";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { deviceDetail, deviceSummary } from "@/lib/user-agent";
import { cn } from "@/lib/utils";
import type { AccountSession, DeviceKind } from "@/types/account";

import { ServiceNotice } from "./service-notice";
import {
  SettingsRow,
  SettingsSection,
  useSaveState,
  useServiceQuery,
} from "./settings-section";

/**
 * Active sessions — where this account is signed in.
 *
 * The section answers one question, "is anything signed in that should not
 * be", and the answer has to be trustworthy or the section is worse than
 * absent. So it lists exactly what is known and states the edge of that
 * plainly.
 *
 * What is known today is this browser. Its device, its time zone and the
 * instant it started are all things it can observe about itself, so the row
 * carrying the "Current session" badge is real — a merchant can check it
 * against the laptop in front of them and find it correct. What is not known
 * is every other device, because a token issued to a phone is known only to
 * whatever issued it. A row for that phone would have to be invented, and the
 * invented version of this panel — three plausible devices in three cities,
 * each with a Sign out button that ends nothing — is precisely the thing that
 * would make a merchant stop believing the true row as well.
 *
 * So "Sign out other sessions" is rendered and disabled, with the reason
 * beside it, which is the rule the module holds to everywhere: a control
 * works, or it is off and says why. The list rendering is not a placeholder
 * either — it takes as many sessions as the service returns, badges the
 * current one, and signs the others out individually. When `remoteSessions`
 * opens, nothing here changes shape; more rows simply arrive.
 */

const DEVICE_ICON: Record<DeviceKind, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: Monitor,
};

export function ActiveSessionsCard() {
  /* Stable across renders: `useServiceQuery` fetches on mount, and a loader
     rebuilt each render would refetch every time a dialog opened. */
  const load = useCallback(() => listSessions(), []);
  const { state, reload, update } = useServiceQuery(load);

  const sessions = state.data ?? [];
  const others = sessions.filter((session) => !session.current);

  const [confirming, setConfirming] = useState<AccountSession | null>(null);
  const [confirmingAll, setConfirmingAll] = useState(false);
  const { state: action, run } = useSaveState();

  const busy = action.status === "saving";

  function signOut(session: AccountSession) {
    void run(async () => {
      const result = await revokeSession(session.id);
      /* Dropped from the list on success rather than read back: the service
         has just said this session is gone, and asking it again to be told the
         same thing is a request whose answer is already in hand. */
      if (result.ok) {
        update((current) => current.filter((row) => row.id !== session.id));
      }
      return result;
    });
  }

  function signOutOthers() {
    void run(async () => {
      const result = await revokeOtherSessions();
      if (result.ok) update((current) => current.filter((row) => row.current));
      return result;
    });
  }

  return (
    <SettingsSection
      id="sessions"
      title="Active sessions"
      description="The devices your account is currently signed in on."
      action={
        state.status === "ready" ? (
          <Badge tone="neutral" className="whitespace-nowrap">
            {sessions.length} {sessions.length === 1 ? "device" : "devices"}
          </Badge>
        ) : null
      }
      bodyClassName="p-0"
      footer={
        <>
          <Button
            variant="outline"
            size="compact"
            disabled={!CAPABILITIES.remoteSessions || busy || others.length === 0}
            aria-busy={busy || undefined}
            onClick={() => setConfirmingAll(true)}
          >
            {busy ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <LogOut aria-hidden />
            )}
            Sign out other sessions
          </Button>

          <p
            role="status"
            aria-live="polite"
            className={cn(
              "min-w-0 basis-full text-sm sm:flex-1",
              action.status === "error"
                ? "font-medium text-error-text"
                : "text-text-muted",
            )}
          >
            {action.status === "error"
              ? action.message
              : !CAPABILITIES.remoteSessions
                ? /* The button's own reason, short, because the note above the
                     footer already carries the long version and two copies of
                     one sentence reads as a bug rather than as emphasis. */
                  "Ending sessions elsewhere needs the account service."
                : others.length === 0
                  ? "This is the only session on your account."
                  : `Ends ${others.length} other ${
                      others.length === 1 ? "session" : "sessions"
                    }. This one stays signed in.`}
          </p>
        </>
      }
    >
      {state.status === "loading" ? <SessionSkeleton /> : null}

      {state.status === "error" ? (
        <SectionError
          message={state.error.message}
          onRetry={() => void reload()}
        />
      ) : null}

      {state.status === "ready"
        ? sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              busy={busy}
              onSignOut={() => setConfirming(session)}
            />
          ))
        : null}

      {state.status === "ready" && !CAPABILITIES.remoteSessions ? (
        <div className="border-t border-border p-5">
          <ServiceNotice
            tone="unavailable"
            title="Only this browser can be listed"
          >
            {UNAVAILABLE_REASON.remoteSessions} The session above is read from
            this device itself, so it is accurate — but there may be others
            that nothing here can see.
          </ServiceNotice>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) signOut(confirming);
        }}
        title="Sign out this device?"
        description={
          confirming
            ? `${deviceSummary(confirming.device)} will need to sign in again.`
            : undefined
        }
        confirmLabel="Sign out"
      >
        <p className="text-sm text-text-secondary">
          Anything unsaved in that session is lost. The session you are reading
          this in is not affected.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmingAll}
        onClose={() => setConfirmingAll(false)}
        onConfirm={signOutOthers}
        title="Sign out other sessions?"
        description={`${others.length} other ${
          others.length === 1 ? "session" : "sessions"
        } will end immediately.`}
        confirmLabel="Sign out others"
      >
        <p className="text-sm text-text-secondary">
          You stay signed in here. Every other device will need your password
          again — which is the point, after losing one.
        </p>
      </ConfirmDialog>
    </SettingsSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Row                                                                        */
/* -------------------------------------------------------------------------- */

function SessionRow({
  session,
  busy,
  onSignOut,
}: {
  session: AccountSession;
  busy: boolean;
  onSignOut: () => void;
}) {
  const Icon = DEVICE_ICON[session.device.kind];

  /*
   * Location, at the coarsest resolution each source honestly supports.
   *
   * The service's region when there is one, this device's own time zone
   * otherwise — and labelled as the time zone, because that is what it is. A
   * city guessed from a browser setting would be new personal data invented to
   * fill a column.
   */
  const where =
    session.location ??
    (session.timeZone
      ? `${session.timeZone.replace(/_/g, " ")} (device time zone)`
      : null);

  return (
    <SettingsRow
      className={cn(
        "border-b border-border last:border-b-0",
        busy && "opacity-60",
      )}
      actions={
        session.current ? (
          <Badge tone="success" size="sm">
            Current session
          </Badge>
        ) : (
          <Button
            variant="ghost"
            size="compact"
            disabled={busy}
            onClick={onSignOut}
          >
            <LogOut aria-hidden />
            Sign out
          </Button>
        )
      }
    >
      <div className="flex min-w-0 items-start gap-3.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-secondary">
          <Icon className="size-4.5" aria-hidden />
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">
            {deviceSummary(session.device)}
          </p>
          <p className="mt-0.5 truncate text-sm text-text-secondary">
            {deviceDetail(session.device)}
          </p>
          <p className="mt-0.5 text-sm text-text-muted">
            {session.current
              ? `Active now · signed in since ${formatDateTime(session.startedAt)}`
              : `Last active ${formatRelativeTime(session.lastActiveAt)}`}
            {where ? ` · ${where}` : null}
          </p>
        </div>
      </div>
    </SettingsRow>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading and failure                                                        */
/* -------------------------------------------------------------------------- */

/** Two rows at the real row height, so the card does not resize when they land. */
function SessionSkeleton() {
  return (
    <div aria-hidden>
      {[0, 1].map((row) => (
        <div
          key={row}
          className="flex items-center gap-3.5 border-b border-border px-5 py-3.5 last:border-b-0"
        >
          <Skeleton className="size-9 rounded-btn" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40 rounded-full" />
            <Skeleton className="h-3 w-56 max-w-full rounded-full" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      ))}
      <span className="sr-only">Loading your active sessions…</span>
    </div>
  );
}

/**
 * A failed read, with the one control that can do anything about it.
 *
 * Only reached for failures a retry could plausibly fix. `service_unavailable`
 * is not one of those, and the panels that can meet it render a
 * `ServiceNotice` instead — a Try again button against a service that does not
 * exist is a loop with a button on it.
 */
export function SectionError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
      <p className="max-w-sm text-sm font-medium text-text-secondary">
        {message}
      </p>
      <Button variant="outline" size="compact" onClick={onRetry}>
        <RotateCcw aria-hidden />
        Try again
      </Button>
    </div>
  );
}
