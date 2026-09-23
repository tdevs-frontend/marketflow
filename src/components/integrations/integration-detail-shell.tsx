"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { PlugZap, RefreshCw, Unplug, Zap } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { useToast } from "@/components/ui/toast";
import {
  connectedRecord,
  disconnectedRecord,
} from "@/lib/integration-fixtures";
import { cn } from "@/lib/utils";
import type { Integration } from "@/types/integration";
import { ConnectDrawer } from "./connect-drawer";
import { ConnectionActivityPanel } from "./connection-activity";
import { ConnectionHealth } from "./connection-health";
import {
  ConnectionTestResult,
  defaultConnectionTest,
  useConnectionTest,
  type TestOutcome,
} from "./connection-test";
import { ConnectionSummary, type SummaryFact } from "./connection-summary";
import { DisconnectDialog } from "./disconnect-dialog";
import { IntegrationUsageList } from "./integration-usage-list";

/**
 * The frame the three provider pages share.
 *
 * What is identical between WhatsApp, Email and SMS is the *shell*: a header
 * with the same three connection actions, a summary card, a KPI row, and a
 * right-hand rail carrying health, dependants and the activity timeline. What
 * differs is the settings column, and that is passed in as `children`.
 *
 * Drawing the line there is deliberate. A shell shallow enough that each page
 * still writes its own body keeps the three pages from becoming the same page
 * with different nouns - which the brief asks for and which is also the only
 * reason to have three pages at all.
 */
export function IntegrationDetailShell({
  integration,
  title,
  description,
  facts,
  kpis,
  /** The page's own settings sections. */
  children,
  /** Extra panels for the right rail, above health. */
  rail,
  /** What "Test Connection" does. Defaults to a check against current health. */
  onTest,
  /** Overrides the copy in the not-connected state. */
  emptyDescription,
}: {
  integration: Integration;
  title: string;
  description: string;
  facts: SummaryFact[];
  kpis: Kpi[];
  children: ReactNode;
  rail?: ReactNode;
  onTest?: () => TestOutcome;
  emptyDescription?: string;
}) {
  const toast = useToast();
  const { state: test, run, reset } = useConnectionTest();

  /*
   * One record for the whole page, so the summary card, the health rail, the
   * activity timeline and the disconnect warning can never disagree about what
   * state this thing is in.
   *
   * Every action replaces the record wholesale through the transitions in the
   * fixtures, which is what keeps a reconnect from leaving the 401 that caused
   * it sitting in the health rail under a green badge.
   */
  const [current, setCurrent] = useState<Integration>(integration);
  const [reconnecting, setReconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const live = current.status === "connected" || current.status === "issue";

  function disconnect() {
    setCurrent(disconnectedRecord(current));
    reset();
    toast(`${integration.name} disconnected`, "info");
  }

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        secondaryActions={
          <>
            <Button
              variant="outline"
              onClick={() => run(onTest ?? (() => defaultConnectionTest(current)))}
              disabled={test.status === "testing"}
            >
              <Zap aria-hidden />
              Test Connection
            </Button>
            <Button variant="outline" onClick={() => setReconnecting(true)}>
              {live ? <RefreshCw aria-hidden /> : <PlugZap aria-hidden />}
              {live ? "Reconnect" : "Connect"}
            </Button>
          </>
        }
        action={
          live ? (
            <Button variant="danger" onClick={() => setConfirmDisconnect(true)}>
              <Unplug aria-hidden />
              Disconnect
            </Button>
          ) : undefined
        }
      />

      <ConnectionTestResult state={test} />

      <ConnectionSummary integration={current} facts={facts} />

      {live ? (
        kpis.length > 0 ? <KpiStrip items={kpis} /> : null
      ) : (
        /*
         * Not connected.
         *
         * It replaces the KPI row rather than the settings below it, because
         * the settings still hold the saved configuration - disconnecting keeps
         * credentials so that reconnecting is one click, and blanking the page
         * would hide the very values a merchant came to check.
         */
        <EmptyState
          title={`No ${integration.name} connection`}
          description={emptyDescription ?? `Connect ${integration.name} to start sending and to power automation.`}
          action={
            <Button size="sm" onClick={() => setReconnecting(true)}>
              <PlugZap aria-hidden />
              Connect {integration.name}
            </Button>
          }
        />
      )}

      {/*
       * Settings on the left, state on the right.
       *
       * The rail is 22rem - wide enough for a health row's label, detail line
       * and badge without the badge wrapping - and it drops under the settings
       * column below `xl`, where a two-column split would squeeze both.
       */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">{children}</div>

        <aside className="min-w-0 space-y-6">
          {rail}
          <ConnectionHealth
            checks={current.health}
            onFix={(check) => {
              if (check.id === "api") {
                setReconnecting(true);
                return;
              }
              toast(`Opening the fix for ${check.label.toLowerCase()}…`, "info");
            }}
          />
          <IntegrationUsageList usage={current.usage} />
          <ConnectionActivityPanel activity={current.activity} />
        </aside>
      </div>

      {/* Mounted only while open, so every visit starts on step one with an
          empty form rather than remembering a half-typed token. */}
      {reconnecting ? (
        <ConnectDrawer
          integration={current}
          open
          onClose={() => setReconnecting(false)}
          onConnected={(next, saved) => {
            setCurrent((record) => connectedRecord(record, next, saved));
            reset();
          }}
        />
      ) : null}

      <DisconnectDialog
        integration={current}
        open={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
        onConfirm={disconnect}
      />
    </>
  );
}

/**
 * One block of settings.
 *
 * A `Card` with a divided footer, because every settings group on these pages
 * ends in the same place - a Save that is disabled until something changes. Its
 * own component so the padding and the footer rule match across three pages
 * rather than being retyped nine times.
 */
export function SettingsSection({
  title,
  description,
  footer,
  className,
  children,
}: {
  title: string;
  description?: string;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader title={title} description={description} />
      <CardBody className="space-y-4">{children}</CardBody>
      {footer ? (
        <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border px-5 py-4">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}

/**
 * A label/value pair inside a settings section, for configuration that is read
 * rather than edited - a webhook callback URL, a verification state, a quota.
 */
export function SettingRow({
  label,
  hint,
  value,
  action,
}: {
  label: string;
  hint?: string;
  value: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {hint ? <p className="mt-0.5 text-meta text-text-muted">{hint}</p> : null}
      </div>
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        {value}
        {action}
      </div>
    </div>
  );
}
