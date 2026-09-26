"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Gauge,
  Info,
  Mail,
  MailCheck,
  Pencil,
  Plus,
  Send,
  Star,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { PanelCard } from "@/components/ui/chart-card";
import { Field, Input } from "@/components/ui/input";
import { KPI_TONES, type KpiTone } from "@/components/ui/kpi-tones";
import { Menu } from "@/components/ui/menu";
import { MiniStat } from "@/components/ui/stats-card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { INTEGRATION_ROUTES } from "@/constants/integrations";
import {
  EMAIL_PROVIDER,
  EMAIL_SENDER_IDENTITIES,
  senderLabel,
} from "@/lib/email-fixtures";
import {
  formatCount,
  formatNumber,
  formatPercent,
  formatRelativeTime,
} from "@/lib/format";
import { isValidEmail } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { EmailSenderIdentity, SenderStatus } from "@/types/email";

/**
 * Sender settings.
 *
 * Two things live on this page and they are not the same thing. An *identity*
 * is what a recipient reads - a name, an address, and a mailbox that replies
 * land in - and choosing it is a marketing decision. The *provider* is the
 * transport underneath every identity, and it is infrastructure.
 *
 * So the provider panel here is a reading, not a form: host, port, quota and
 * connection state, with one link to Integrations → Email where the credentials
 * actually live. Re-offering a host and a password field on this page would
 * mean two places to change the same secret and one of them silently stale.
 *
 * The two panels are built to look unlike each other, because they answer
 * unlike questions. Provider is a configuration read-out - monospace facts and
 * two counters. Deliverability is a reputation list - one row per address, each
 * scored and banded. Both used to be stacks of horizontal meters, which made a
 * quota, a throughput ceiling and three delivery rates look like five readings
 * of the same kind of thing when only the last three are comparable at all.
 * Neither panel draws a bar now: a percentage of a daily quota is not a
 * measurement anyone acts on, and a delivery rate between 98.0 and 98.8 is a
 * band, not a length.
 *
 * Domain authentication is shown per identity rather than per domain, because
 * that is the granularity someone fixes it at - a DKIM record that has not
 * propagated stops one address from sending, not the workspace.
 */

const STATUS_TONES: Record<SenderStatus, BadgeVariant> = {
  verified: "success",
  pending: "warning",
  failed: "error",
};

const STATUS_LABELS: Record<SenderStatus, string> = {
  verified: "Verified",
  pending: "Pending",
  failed: "Failed",
};

/** An empty identity for the Add path. New senders always start unverified. */
const blankSender = (): EmailSenderIdentity => ({
  id: `sender-${Date.now()}`,
  name: "",
  email: "",
  replyTo: "",
  status: "pending",
  spf: false,
  dkim: false,
  dmarc: false,
  isDefault: false,
  sent30d: 0,
  deliveryRate: 0,
  createdAt: "2026-09-08T00:00:00Z",
});

/**
 * SPF, DKIM and DMARC as three ticks.
 *
 * Shown as what is *missing* rather than as a single "authenticated" flag: all
 * three are separate DNS records published in separate places, and the one that
 * is absent is the whole of the fix.
 */
function AuthChecks({ sender }: { sender: EmailSenderIdentity }) {
  const checks = [
    { label: "SPF", ok: sender.spf },
    { label: "DKIM", ok: sender.dkim },
    { label: "DMARC", ok: sender.dmarc },
  ];

  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {checks.map((check) => (
        <li
          key={check.label}
          className={cn(
            "inline-flex items-center gap-1 rounded-btn border px-1.5 py-0.5 text-sm font-medium",
            check.ok
              ? "border-success-border bg-success-soft text-success-text"
              : "border-border bg-surface-secondary text-text-muted",
          )}
        >
          {check.ok ? (
            <CheckCircle2 className="size-3" aria-hidden />
          ) : (
            <XCircle className="size-3" aria-hidden />
          )}
          {check.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * Messages per second going out right now.
 *
 * A reading the provider record does not carry - `EMAIL_PROVIDER` stores the
 * ceiling, not the current throughput, which a live implementation would poll.
 * It was already a literal inside the meter's label; it is named here so the
 * three figures on the rate tile are visibly one sum.
 */
const CURRENT_SEND_RATE = 25;

/**
 * One provider counter: a number, what it is out of, and two facts under it.
 *
 * Deliberately not a meter. The quota is 12% used with thirteen hours left in
 * the window, and a bar drawn at 12% invites reading that as a problem - what
 * an operator actually wants is the headroom as a figure they can weigh against
 * the send they are about to queue. The tile's job is to make three related
 * numbers legible at once, not to rank one of them on a scale.
 */
function ProviderTile({
  icon: Icon,
  tone,
  label,
  value,
  unit,
  facts,
}: {
  icon: typeof Gauge;
  tone: KpiTone;
  label: string;
  /** The headline figure, pre-formatted. */
  value: string;
  /** The muted line under it - what the figure is out of, or when it was taken. */
  unit: string;
  /** Exactly two, so the pair of tiles keeps one baseline grid. */
  facts: [{ label: string; value: string }, { label: string; value: string }];
}) {
  return (
    <div className="rounded-panel border border-border p-3.5">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-panel border",
            KPI_TONES[tone],
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <p className="text-sm font-medium text-text-secondary">{label}</p>
      </div>

      <p className="mt-3 text-2xl leading-none font-bold text-text-primary tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-sm text-text-muted">{unit}</p>

      <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
        {facts.map((fact) => (
          <div key={fact.label} className="min-w-0">
            <dt className="text-sm font-medium text-text-muted">{fact.label}</dt>
            <dd className="mt-0.5 truncate text-sm font-bold text-text-primary tabular-nums">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Delivery rate as a band rather than a length.
 *
 * Every verified identity on a healthy account sits between 98.0% and 98.8%,
 * which is three bars of visually identical length and no information at all.
 * The band is the part someone acts on: Excellent needs nothing, Watch means go
 * and look at the list, Poor means stop sending from that address today.
 *
 * Ordered highest first, so the first match wins and a rate cannot fall into
 * two bands.
 */
const HEALTH_BANDS: { min: number; label: string; tone: KpiTone }[] = [
  { min: 98, label: "Excellent", tone: "success" },
  /* `info` rather than `email`: this blue is a state. The channel blue on the
     same row would be saying "this is the Email module" a third time. */
  { min: 95, label: "Healthy", tone: "info" },
  { min: 90, label: "Watch", tone: "warning" },
  { min: 0, label: "Poor", tone: "danger" },
];

const healthFor = (deliveryRate: number) =>
  HEALTH_BANDS.find((band) => deliveryRate >= band.min) ?? HEALTH_BANDS[3];

/** One identity's reputation: who it is on the left, how it is doing on the right. */
function SenderHealthRow({ sender }: { sender: EmailSenderIdentity }) {
  const health = healthFor(sender.deliveryRate);

  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-panel border",
          KPI_TONES[health.tone],
        )}
      >
        <Mail className="size-4" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {sender.email}
        </p>
        <p className="text-sm text-text-muted tabular-nums">
          {formatNumber(sender.sent30d)} sent
        </p>
      </div>

      <div className="shrink-0 text-right">
        <span
          className={cn(
            "inline-flex rounded-btn border px-2 py-0.5 text-sm font-bold tabular-nums",
            KPI_TONES[health.tone],
          )}
        >
          {formatPercent(sender.deliveryRate)}
        </span>
        <p className="mt-1 text-sm font-medium text-text-muted">{health.label}</p>
      </div>
    </li>
  );
}

export function EmailSendersWorkspace() {
  const toast = useToast();

  const [senders, setSenders] = useState(EMAIL_SENDER_IDENTITIES);
  const [editing, setEditing] = useState<EmailSenderIdentity | null>(null);
  /* Set when the dialog is adding rather than editing - the two differ in
     their title, their button and whether the address can still be changed. */
  const [isNew, setIsNew] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<EmailSenderIdentity | null>(null);

  const remaining = EMAIL_PROVIDER.dailyLimit - EMAIL_PROVIDER.sentToday;
  const headroom = EMAIL_PROVIDER.rateLimit - CURRENT_SEND_RATE;
  const verified = senders.filter((sender) => sender.status === "verified");

  function openAdd() {
    setEditing(blankSender());
    setIsNew(true);
    setErrors({});
  }

  function openEdit(sender: EmailSenderIdentity) {
    setEditing(sender);
    setIsNew(false);
    setErrors({});
  }

  /** Validates, then adds or replaces. The address must be one we can send to. */
  function save() {
    if (!editing) return;

    const next: Record<string, string> = {};
    if (!editing.name.trim()) next.name = "Give the sender a display name.";
    if (!isValidEmail(editing.email)) next.email = "Enter a valid email address.";
    /* Reply-to is optional and falls back to the sending address, but a typed
       one that is malformed is a mistake rather than a choice. */
    if (editing.replyTo.trim() && !isValidEmail(editing.replyTo)) {
      next.replyTo = "Enter a valid reply-to address, or leave it empty.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const saved: EmailSenderIdentity = {
      ...editing,
      name: editing.name.trim(),
      email: editing.email.trim(),
      replyTo: editing.replyTo.trim() || editing.email.trim(),
    };

    setSenders((prev) =>
      isNew
        ? [...prev, saved]
        : prev.map((item) => (item.id === saved.id ? saved : item)),
    );
    setEditing(null);
    toast(
      isNew
        ? `${saved.email} added - check your DNS to finish verifying it`
        : `${saved.email} updated`,
      "success",
    );
  }

  /** Exactly one default, so setting one clears the rest in the same pass. */
  function makeDefault(sender: EmailSenderIdentity) {
    setSenders((prev) =>
      prev.map((item) => ({ ...item, isDefault: item.id === sender.id })),
    );
    toast(`New campaigns now start from ${sender.email}`);
  }

  function remove(sender: EmailSenderIdentity) {
    setSenders((prev) => prev.filter((item) => item.id !== sender.id));
    toast(`${sender.email} removed`);
  }

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-3">
        <PanelCard
          title="Sending Provider"
          description="The transport every identity below goes out over."
          className="xl:col-span-2"
          action={
            <ButtonLink
              href={INTEGRATION_ROUTES.email}
              variant="outline"
              size="sm"
            >
              Manage connection
              <ExternalLink aria-hidden />
            </ButtonLink>
          }
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-base font-bold text-text-primary">
              {EMAIL_PROVIDER.name}
            </p>
            <Badge variant={EMAIL_PROVIDER.connected ? "success" : "error"}>
              {EMAIL_PROVIDER.connected ? "Connected" : "Disconnected"}
            </Badge>
            <Badge variant="default">{EMAIL_PROVIDER.mode.toUpperCase()}</Badge>
            <span className="text-sm text-text-muted">
              Checked {formatRelativeTime(EMAIL_PROVIDER.lastCheckedAt)}
            </span>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-text-muted">Host</dt>
              <dd className="mt-0.5 truncate font-mono text-sm text-text-secondary">
                {EMAIL_PROVIDER.host}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-muted">Port</dt>
              <dd className="mt-0.5 font-mono text-sm text-text-secondary tabular-nums">
                {EMAIL_PROVIDER.port}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-text-muted">Encryption</dt>
              <dd className="mt-0.5 font-mono text-sm text-text-secondary">
                {EMAIL_PROVIDER.encryption}
              </dd>
            </div>
          </dl>

          {/* `formatCount` on the two headline figures and `formatNumber` on
              the ceilings: a quota you are spending is read exactly, and the
              limit it is measured against is a round number you only need the
              size of. */}
          <div className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
            <ProviderTile
              icon={Gauge}
              tone="email"
              label="Daily Usage"
              value={formatCount(EMAIL_PROVIDER.sentToday)}
              unit={`of ${formatNumber(EMAIL_PROVIDER.dailyLimit)}`}
              facts={[
                { label: "Remaining", value: formatCount(remaining) },
                { label: "Reset", value: "Midnight UTC" },
              ]}
            />
            <ProviderTile
              icon={Zap}
              tone="accent"
              label="Send Rate"
              value={`${CURRENT_SEND_RATE}/sec`}
              unit="Peak over the last hour"
              facts={[
                { label: "Limit", value: `${EMAIL_PROVIDER.rateLimit}/sec` },
                { label: "Available", value: `${headroom}/sec` },
              ]}
            />
          </div>
        </PanelCard>

        <PanelCard
          title="Deliverability"
          description="Across every identity, over the last 30 days."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast("Test email sent - check your inbox")}
            >
              <MailCheck aria-hidden />
              Send test
            </Button>
          }
        >
          <div className="grid grid-cols-2 gap-2">
            <MiniStat
              label="Identities"
              value={String(senders.length)}
              hint={`${verified.length} verified`}
            />
            <MiniStat
              label="Sent"
              value={formatNumber(
                senders.reduce((total, sender) => total + sender.sent30d, 0),
              )}
              hint="last 30 days"
            />
          </div>

          {/* Verified only. An identity that cannot send has no reputation
              yet, and a 0% score beside it would read as a failure rather than
              as an absence - the table below is where its pending state is
              reported. */}
          <ul className="mt-4 divide-y divide-border border-t border-border pt-3">
            {verified.map((sender) => (
              <SenderHealthRow key={sender.id} sender={sender} />
            ))}
          </ul>

          <p className="mt-4 flex items-start gap-2.5 rounded-panel border border-border bg-surface-secondary px-3.5 py-3 text-sm text-text-secondary">
            <Info className="mt-0.5 size-4 shrink-0 text-text-muted" aria-hidden />
            <span>
              Reputation is earned per address, not per domain. A new identity
              sends best if you ramp it over a week rather than opening on a full
              list.
            </span>
          </p>
        </PanelCard>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg">Sender Identities</h2>
            <p className="mt-1 text-sm font-medium text-text-secondary">
              The &ldquo;from&rdquo; line a campaign can go out on. Only verified
              identities are offered in the wizard.
            </p>
          </div>
          <Button size="compact" onClick={openAdd}>
            <Plus aria-hidden />
            Add Sender
          </Button>
        </div>

        {/* Desktop */}
        <div className="mt-4 max-lg:hidden">
          <Table minWidth="64rem">
            <THead>
              <TH>Sender</TH>
              <TH>Reply-to</TH>
              <TH>Authentication</TH>
              <TH align="right">Sent (30d)</TH>
              <TH align="right">Delivery</TH>
              <TH>Status</TH>
              <TH align="right">Actions</TH>
            </THead>

            <TBody>
              {senders.map((sender) => (
                <TR key={sender.id}>
                  <TD>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-text-primary">{sender.name}</p>
                      {sender.isDefault ? <Badge variant="primary">Default</Badge> : null}
                    </div>
                    <p className="text-sm text-text-muted">{sender.email}</p>
                  </TD>

                  <TD className="text-text-secondary">{sender.replyTo}</TD>

                  <TD>
                    <AuthChecks sender={sender} />
                  </TD>

                  <TD align="right" className="tabular-nums">
                    {sender.sent30d === 0 ? (
                      <span className="text-text-muted">-</span>
                    ) : (
                      formatNumber(sender.sent30d)
                    )}
                  </TD>

                  <TD align="right" className="tabular-nums">
                    {sender.deliveryRate === 0 ? (
                      <span className="text-text-muted">-</span>
                    ) : (
                      formatPercent(sender.deliveryRate)
                    )}
                  </TD>

                  <TD>
                    <Badge variant={STATUS_TONES[sender.status]}>
                      {STATUS_LABELS[sender.status]}
                    </Badge>
                  </TD>

                  <TD align="right">
                    <Menu
                      label={`Actions for ${sender.email}`}
                      items={[
                        {
                          label: "Edit sender",
                          icon: <Pencil className="size-4" />,
                          onSelect: () => openEdit(sender),
                        },
                        {
                          label: "Set as default",
                          icon: <Star className="size-4" />,
                          onSelect: () => makeDefault(sender),
                          /* An unverified identity cannot send, so it cannot be
                             what new campaigns start on. */
                          disabled: sender.isDefault || sender.status !== "verified",
                        },
                        {
                          label: "Send test email",
                          icon: <Send className="size-4" />,
                          onSelect: () => toast(`Test sent from ${sender.email}`),
                          disabled: sender.status !== "verified",
                        },
                        {
                          label: "Remove",
                          icon: <Trash2 className="size-4" />,
                          onSelect: () => setPendingDelete(sender),
                          destructive: true,
                          disabled: sender.isDefault,
                        },
                      ]}
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>

        {/* Mobile */}
        <ul className="mt-4 space-y-2.5 lg:hidden">
          {senders.map((sender) => (
            <li key={sender.id} className="rounded-panel border border-border p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {sender.name}
                  </p>
                  <p className="truncate text-sm text-text-muted">{sender.email}</p>
                </div>
                <Badge variant={STATUS_TONES[sender.status]}>
                  {STATUS_LABELS[sender.status]}
                </Badge>
              </div>

              <p className="mt-2 text-sm text-text-muted">
                Replies to{" "}
                <span className="text-text-secondary">{sender.replyTo}</span>
              </p>

              <div className="mt-2.5">
                <AuthChecks sender={sender} />
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEdit(sender)}
                >
                  <Pencil aria-hidden />
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  disabled={sender.isDefault || sender.status !== "verified"}
                  onClick={() => makeDefault(sender)}
                >
                  <Star aria-hidden />
                  {sender.isDefault ? "Default" : "Set default"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={isNew ? "Add sender identity" : `Edit ${editing?.name ?? "sender"}`}
        description={
          isNew
            ? "A new address has to prove it is yours before it can send."
            : "Changes apply to campaigns sent from this identity from now on."
        }
        footer={
          <>
            <Button variant="cancel" size="compact" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button size="compact" onClick={save}>
              {isNew ? "Add sender" : "Save changes"}
            </Button>
          </>
        }
      >
        {editing ? (
          <div className="space-y-5">
            <Field
              label="Sender name"
              htmlFor="sender-name"
              hint="What an inbox shows above the subject line."
              error={errors.name}
            >
              <Input
                id="sender-name"
                value={editing.name}
                error={Boolean(errors.name)}
                onChange={(event) =>
                  setEditing({ ...editing, name: event.target.value })
                }
              />
            </Field>

            <Field
              label="Email address"
              htmlFor="sender-email"
              hint="Must be on a domain you can add DNS records to."
              error={errors.email}
            >
              <Input
                id="sender-email"
                type="email"
                value={editing.email}
                error={Boolean(errors.email)}
                onChange={(event) =>
                  setEditing({ ...editing, email: event.target.value })
                }
              />
            </Field>

            <Field
              label="Reply-to"
              htmlFor="sender-replyto"
              hint="Where replies land. Leave empty to use the sending address."
              error={errors.replyTo}
            >
              <Input
                id="sender-replyto"
                type="email"
                value={editing.replyTo}
                error={Boolean(errors.replyTo)}
                onChange={(event) =>
                  setEditing({ ...editing, replyTo: event.target.value })
                }
              />
            </Field>

            {isNew ? (
              <p className="rounded-panel border border-border bg-surface-secondary px-3.5 py-3 text-sm text-text-secondary">
                After adding it, publish the SPF, DKIM and DMARC records shown in
                Integrations → Email. Verification usually completes within an
                hour of the records resolving.
              </p>
            ) : null}
          </div>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove(pendingDelete)}
        title={`Remove ${pendingDelete?.name}?`}
        confirmLabel="Remove sender"
      >
        <p className="text-sm text-text-secondary">
          {pendingDelete ? (
            <>
              Campaigns already sent from {senderLabel(pendingDelete)} keep their
              reports. Scheduled ones using it will fail until another identity
              is picked.
            </>
          ) : null}
        </p>
      </ConfirmDialog>
    </>
  );
}
