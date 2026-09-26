"use client";

import { useState } from "react";
import {
  ExternalLink,
  MessageSquareOff,
  Plus,
  Star,
  Trash2,
} from "lucide-react";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Menu } from "@/components/ui/menu";
import { Select } from "@/components/ui/select";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { INTEGRATION_ROUTES } from "@/constants/integrations";
import {
  SMS_COUNTRIES,
  SMS_SENDERS,
  SMS_SENDER_TYPES,
} from "@/lib/sms-fixtures";
import { formatNumber } from "@/lib/format";
import { canReceiveReplies } from "@/types/sms";
import type { SmsSenderId, SmsSenderStatus, SmsSenderType } from "@/types/sms";

/**
 * Sender IDs.
 *
 * Every SMS campaign picks one, and until this page existed the only place to
 * change one was a single text field on the gateway integration - which meant
 * the workspace could offer three senders in a dropdown and manage none of
 * them. This is the smallest thing that closes that gap: one table, the four
 * facts that decide which sender a campaign should use, and a default.
 *
 * Deliberately not a module. There is no detail page, no per-sender analytics
 * and no throughput panel, because the questions a sender raises are answered
 * in one row each: can I use it (status), what will it look like on a handset
 * (the value and its type), can people answer it (a consequence of the type),
 * and is anything going out on it (usage). The credentials underneath stay on
 * Integrations → SMS, where they already live - offering a gateway key here
 * too would mean two places to rotate one secret and one of them silently
 * stale.
 *
 * The type column carries the whole decision, so it says out loud what it
 * implies: an alphanumeric sender is the only one that can show a brand name
 * and the only one with no number for a reply to arrive at, which rules it out
 * of every campaign that ends "reply STOP" and expects to hear anything.
 */

const STATUS_TONES: Record<SmsSenderStatus, BadgeVariant> = {
  active: "success",
  pending: "warning",
  blocked: "error",
};

const STATUS_LABELS: Record<SmsSenderStatus, string> = {
  active: "Active",
  pending: "Pending",
  blocked: "Blocked",
};

const typeLabel = (type: SmsSenderType) =>
  SMS_SENDER_TYPES.find((item) => item.value === type)?.label ?? type;

export function SmsSendersWorkspace() {
  const toast = useToast();

  const [addOpen, setAddOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SmsSenderId | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [draftType, setDraftType] = useState<SmsSenderType>("alphanumeric");
  const [draftCountry, setDraftCountry] = useState(SMS_COUNTRIES[0]);

  const senders = [...SMS_SENDERS].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    return b.sent30d - a.sent30d;
  });

  const menuFor = (sender: SmsSenderId) => [
    {
      label: "Make default",
      icon: <Star className="size-4" />,
      onSelect: () => toast(`${sender.value} is now the default sender`),
      disabled: sender.isDefault || sender.status !== "active",
    },
    {
      label: "Remove",
      icon: <Trash2 className="size-4" />,
      onSelect: () => setPendingDelete(sender),
      destructive: true,
      disabled: sender.isDefault,
    },
  ];

  return (
    <>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg">Registered senders</h2>
            <p className="mt-1 text-sm font-medium text-text-secondary">
              What the handset shows in the from line. The gateway credentials
              behind them live on the integration.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <ButtonLink
              href={INTEGRATION_ROUTES.sms}
              variant="outline"
              size="compact"
            >
              Gateway settings
              <ExternalLink aria-hidden />
            </ButtonLink>
            <Button size="compact" onClick={() => setAddOpen(true)}>
              <Plus aria-hidden />
              Add Sender ID
            </Button>
          </div>
        </div>

        {/* Desktop */}
        <div className="mt-4 max-lg:hidden">
          <Table minWidth="58rem">
            <THead>
              <TH>Sender ID</TH>
              <TH>Type</TH>
              <TH>Status</TH>
              <TH>Registered in</TH>
              <TH align="right">Usage</TH>
              <TH align="right">Actions</TH>
            </THead>

            <TBody>
              {senders.map((sender) => (
                <TR key={sender.id}>
                  <TD>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-semibold text-text-primary">
                        {sender.value}
                      </span>
                      {sender.isDefault ? (
                        <Badge variant="primary" size="sm">
                          Default
                        </Badge>
                      ) : null}
                    </div>
                    {sender.note ? (
                      <p className="mt-0.5 max-w-64 text-sm text-text-muted">
                        {sender.note}
                      </p>
                    ) : null}
                  </TD>

                  <TD>
                    <p className="text-text-secondary">{typeLabel(sender.type)}</p>
                    {canReceiveReplies(sender.type) ? null : (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-warning-text">
                        <MessageSquareOff className="size-3.5 shrink-0" aria-hidden />
                        Cannot receive replies
                      </p>
                    )}
                  </TD>

                  <TD>
                    <Badge variant={STATUS_TONES[sender.status]}>
                      {STATUS_LABELS[sender.status]}
                    </Badge>
                  </TD>

                  <TD className="text-text-secondary">
                    {sender.countries.join(", ")}
                  </TD>

                  <TD align="right" className="tabular-nums">
                    <span className="font-bold text-text-primary">
                      {formatNumber(sender.sent30d)}
                    </span>
                    <span className="block text-sm text-text-muted">
                      sent in 30 days
                    </span>
                  </TD>

                  <TD align="right">
                    <Menu
                      label={`Actions for ${sender.value}`}
                      items={menuFor(sender)}
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
                  <p className="truncate font-mono text-sm font-bold text-text-primary">
                    {sender.value}
                  </p>
                  <p className="mt-0.5 text-sm text-text-muted">
                    {typeLabel(sender.type)} · {formatNumber(sender.sent30d)} sent
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge variant={STATUS_TONES[sender.status]} size="sm">
                    {STATUS_LABELS[sender.status]}
                  </Badge>
                  <Menu
                    label={`Actions for ${sender.value}`}
                    items={menuFor(sender)}
                  />
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {sender.isDefault ? (
                  <Badge variant="primary" size="sm">
                    Default
                  </Badge>
                ) : null}
                {canReceiveReplies(sender.type) ? null : (
                  <Badge variant="warning" size="sm">
                    No replies
                  </Badge>
                )}
              </div>

              <p className="mt-2 text-sm text-text-muted">
                {sender.note ?? sender.countries.join(", ")}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      {/* ---------------------------------------------------------- Add */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add sender ID"
        description="New senders start pending until the carriers confirm the registration."
        footer={
          <>
            <Button variant="cancel" size="compact" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              size="compact"
              onClick={() => {
                setAddOpen(false);
                toast(
                  `${draftValue || "Sender ID"} submitted for registration in ${draftCountry}`,
                );
              }}
            >
              Submit for registration
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Sender ID"
            htmlFor="sender-value"
            hint="Alphanumeric senders are capped at 11 characters and cannot contain spaces."
          >
            <Input
              id="sender-value"
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              maxLength={11}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" htmlFor="sender-type">
              <Select
                id="sender-type"
                hideLabel={false}
                label="Type"
                value={draftType}
                onChange={setDraftType}
                options={SMS_SENDER_TYPES}
              />
            </Field>

            <Field label="Register in" htmlFor="sender-country">
              <Select
                id="sender-country"
                hideLabel={false}
                label="Register in"
                value={draftCountry}
                onChange={setDraftCountry}
                options={SMS_COUNTRIES.map((item) => ({
                  value: item,
                  label: item,
                }))}
              />
            </Field>
          </div>

          {canReceiveReplies(draftType) ? null : (
            <p className="rounded-panel bg-warning-soft px-3.5 py-3 text-sm text-warning-text">
              An alphanumeric sender is one-way. Campaigns that ask for a reply -
              including anything ending &ldquo;reply STOP&rdquo; - need a long or
              short code, or the answers go nowhere.
            </p>
          )}
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => toast(`${pendingDelete?.value} removed`)}
        title={`Remove ${pendingDelete?.value}?`}
        confirmLabel="Remove sender ID"
      >
        <p className="text-sm text-text-secondary">
          Campaigns and automations still pointing at this sender fall back to the
          default one at send time. Re-registering the same ID with the carriers
          takes several working days, so removing it is not quick to undo.
        </p>
      </ConfirmDialog>
    </>
  );
}
