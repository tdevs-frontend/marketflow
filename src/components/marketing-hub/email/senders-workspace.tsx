"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  MailCheck,
  Pencil,
  Plus,
  Send,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { PanelCard } from "@/components/ui/chart-card";
import { Field, Input } from "@/components/ui/input";
import { MeterRow } from "@/components/ui/progress";
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
import { formatNumber, formatPercent, formatRelativeTime } from "@/lib/format";
import { isValidEmail } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { EmailSenderIdentity, SenderStatus } from "@/types/email";

/**
 * Sender settings.
 *
 * Two things live on this page and they are not the same thing. An *identity*
 * is what a recipient reads — a name, an address, and a mailbox that replies
 * land in — and choosing it is a marketing decision. The *provider* is the
 * transport underneath every identity, and it is infrastructure.
 *
 * So the provider panel here is a reading, not a form: host, port, quota and
 * connection state, with one link to Integrations → Email where the credentials
 * actually live. Re-offering a host and a password field on this page would
 * mean two places to change the same secret and one of them silently stale.
 *
 * Domain authentication is shown per identity rather than per domain, because
 * that is the granularity someone fixes it at — a DKIM record that has not
 * propagated stops one address from sending, not the workspace.
 */

const STATUS_TONES: Record<SenderStatus, BadgeTone> = {
  verified: "success",
  pending: "warning",
  failed: "danger",
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

export function EmailSendersWorkspace() {
  const toast = useToast();

  const [senders, setSenders] = useState(EMAIL_SENDER_IDENTITIES);
  const [editing, setEditing] = useState<EmailSenderIdentity | null>(null);
  /* Set when the dialog is adding rather than editing — the two differ in
     their title, their button and whether the address can still be changed. */
  const [isNew, setIsNew] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<EmailSenderIdentity | null>(null);

  const quotaUsed = (EMAIL_PROVIDER.sentToday / EMAIL_PROVIDER.dailyLimit) * 100;
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
        ? `${saved.email} added — check your DNS to finish verifying it`
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
            <Badge tone={EMAIL_PROVIDER.connected ? "success" : "danger"}>
              {EMAIL_PROVIDER.connected ? "Connected" : "Disconnected"}
            </Badge>
            <Badge tone="neutral">{EMAIL_PROVIDER.mode.toUpperCase()}</Badge>
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

          <div className="mt-5 space-y-4 border-t border-border pt-4">
            <MeterRow
              label="Daily quota"
              value={quotaUsed}
              display={`${formatNumber(EMAIL_PROVIDER.sentToday)} of ${formatNumber(
                EMAIL_PROVIDER.dailyLimit,
              )}`}
              tone="bg-email"
              hint="Resets at midnight UTC"
            />
            <MeterRow
              label="Send rate"
              value={62}
              display={`25 of ${EMAIL_PROVIDER.rateLimit} per second`}
              tone="bg-accent"
              hint="Peak over the last hour"
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
              onClick={() => toast("Test email sent — check your inbox")}
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

          <div className="mt-4 space-y-4 border-t border-border pt-4">
            {verified.map((sender) => (
              <MeterRow
                key={sender.id}
                label={sender.email}
                value={sender.deliveryRate}
                display={formatPercent(sender.deliveryRate)}
                tone="bg-email"
                hint={`${formatNumber(sender.sent30d)} sent`}
              />
            ))}
          </div>

          <p className="mt-4 rounded-panel bg-email-soft px-3 py-2.5 text-sm text-email-dark">
            Reputation is earned per address, not per domain. A new identity
            sends best if you ramp it over a week rather than opening on a full
            list.
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
                      <p className="font-bold text-text-primary">{sender.name}</p>
                      {sender.isDefault ? <Badge tone="brand">Default</Badge> : null}
                    </div>
                    <p className="text-sm text-text-muted">{sender.email}</p>
                  </TD>

                  <TD className="text-text-secondary">{sender.replyTo}</TD>

                  <TD>
                    <AuthChecks sender={sender} />
                  </TD>

                  <TD align="right" className="tabular-nums">
                    {sender.sent30d === 0 ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      formatNumber(sender.sent30d)
                    )}
                  </TD>

                  <TD align="right" className="tabular-nums">
                    {sender.deliveryRate === 0 ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      formatPercent(sender.deliveryRate)
                    )}
                  </TD>

                  <TD>
                    <Badge tone={STATUS_TONES[sender.status]}>
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
                <Badge tone={STATUS_TONES[sender.status]}>
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
            <Button variant="outline" size="compact" onClick={() => setEditing(null)}>
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
                placeholder="MarketFlow Sales"
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
                placeholder="sales@yourdomain.com"
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
                placeholder={editing.email || "support@yourdomain.com"}
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
