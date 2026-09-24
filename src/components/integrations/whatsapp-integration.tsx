"use client";

import { useState } from "react";
import { AlertTriangle, CheckCheck, Eye, RotateCcw, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format";
import { INTEGRATIONS_NOW_MS, requireIntegration } from "@/lib/integration-fixtures";
import { CodeText, HealthBadge } from "./integration-badges";
import { CopyButton, CredentialField } from "./credential-field";
import {
  IntegrationDetailShell,
  SettingRow,
  SettingsSection,
} from "./integration-detail-shell";
import type { SummaryFact } from "./connection-summary";

/**
 * The WhatsApp provider page.
 *
 * Everything here is about the *connection*, not about messaging: the numbers
 * that identify the account, the credentials behind it, the callback Meta posts
 * to, and the sending defaults that belong to the channel rather than to any
 * one campaign. Campaigns, templates and the inbox live in the Marketing
 * module and are linked from the "Used by" rail, which is the seam between the
 * two - this page says whether WhatsApp works, that module says what it sends.
 */

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "en_GB", label: "English (UK)" },
  { value: "bn", label: "Bengali" },
  { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" },
];

const WEBHOOK_URL = "https://app.marketflow.io/api/webhooks/whatsapp/wsp_8f21c4";

export function WhatsAppIntegration() {
  const integration = requireIntegration("whatsapp");
  const toast = useToast();

  const [language, setLanguage] = useState("en");
  const [senderName, setSenderName] = useState("MarketFlow Demo");
  const [rateLimit, setRateLimit] = useState("80");
  const [dirty, setDirty] = useState(false);

  /* One handler per field would be four identical closures; this keeps the
     dirty flag honest without repeating it. */
  const edit = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setDirty(true);
  };

  const connection = integration.credentials.filter(
    (credential) => credential.kind !== "secret",
  );
  const secrets = integration.credentials.filter(
    (credential) => credential.kind === "secret",
  );

  const webhookCheck = integration.health.find((check) => check.id === "webhook");

  const facts: SummaryFact[] = [
    { label: "Phone Number", value: integration.account ?? "-" },
    { label: "Provider", value: integration.provider?.name ?? "Not selected" },
    { label: "Business Account", value: "MarketFlow Demo" },
    {
      label: "Last Webhook",
      value: integration.activity.lastSyncAt
        ? formatRelativeTime(integration.activity.lastSyncAt, INTEGRATIONS_NOW_MS)
        : "Never",
      hint: "Inbound events and delivery receipts",
    },
  ];

  return (
    <IntegrationDetailShell
      integration={integration}
      title="WhatsApp Integration"
      description="Connect and monitor your WhatsApp messaging provider."
      emptyDescription="Connect WhatsApp to start sending messages and powering automation."
      facts={facts}
      kpis={[
        { label: "Messages Today", value: "1,284", icon: Send, tone: "brand", hint: "Sent and received" },
        { label: "Delivery Rate", value: "97.8%", icon: CheckCheck, tone: "success", hint: "Last 24 hours" },
        { label: "Read Rate", value: "82.1%", icon: Eye, hint: "Of delivered messages" },
        { label: "Failed", value: "28", icon: AlertTriangle, hint: "Mostly invalid numbers" },
      ]}
    >
      <SettingsSection
        title="Connection"
        description="The identifiers Meta issued for this number. Changing them re-points the whole channel."
      >
        {connection.map((credential) => (
          <CredentialField key={credential.key} credential={credential} />
        ))}
        <SettingRow
          label="Provider"
          hint="Switch providers from Reconnect - credentials do not carry across."
          value={
            <Badge variant="primary" casing="none">
              {integration.provider?.name ?? "Not selected"}
            </Badge>
          }
        />
      </SettingsSection>

      <SettingsSection
        title="Credentials"
        description="Stored encrypted. Shown masked - a saved token is never returned in full."
      >
        {secrets.map((credential) => (
          <CredentialField
            key={credential.key}
            credential={credential}
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast(`Rotating ${credential.label.toLowerCase()}…`, "info")}
              >
                <RotateCcw aria-hidden />
                Rotate
              </Button>
            }
          />
        ))}
      </SettingsSection>

      <SettingsSection
        title="Webhook"
        description="Where Meta posts inbound messages and delivery receipts."
      >
        <div>
          <p className="text-sm font-medium text-text-primary">Webhook URL</p>
          <div className="mt-1.5 flex items-center gap-2">
            <p className="min-w-0 flex-1 overflow-x-auto rounded-field border border-border bg-surface-secondary px-3.5 py-2.5 font-mono text-meta whitespace-nowrap text-text-secondary">
              {WEBHOOK_URL}
            </p>
            <CopyButton value={WEBHOOK_URL} label="Webhook URL" />
          </div>
          <p className="mt-1.5 text-meta text-text-muted">
            Paste this into Meta → WhatsApp → Configuration → Webhooks.
          </p>
        </div>

        <SettingRow
          label="Verification Status"
          hint="Meta re-verifies the callback every 24 hours."
          value={
            webhookCheck ? (
              <HealthBadge status={webhookCheck.status} size="sm" />
            ) : (
              <Badge size="sm">Unknown</Badge>
            )
          }
        />

        <SettingRow
          label="Last Received Event"
          hint={webhookCheck?.detail}
          value={
            <span className="text-sm font-semibold text-text-primary">
              {formatRelativeTime(
                integration.activity.lastSuccessAt ?? integration.activity.lastSyncAt ?? "",
                INTEGRATIONS_NOW_MS,
              )}
            </span>
          }
        />

        <SettingRow
          label="Subscribed Fields"
          value={
            <span className="flex flex-wrap justify-end gap-1.5">
              {["messages", "message_status", "message_template_status"].map((field) => (
                <CodeText key={field}>{field}</CodeText>
              ))}
            </span>
          }
        />
      </SettingsSection>

      <SettingsSection
        title="Messaging"
        description="Defaults applied to every WhatsApp send unless a campaign overrides them."
        footer={
          <>
            <Button
              variant="outline"
              size="compact"
              disabled={!dirty}
              onClick={() => setDirty(false)}
            >
              Discard
            </Button>
            <Button
              size="compact"
              disabled={!dirty}
              onClick={() => {
                setDirty(false);
                toast("WhatsApp messaging settings saved", "success");
              }}
            >
              Save changes
            </Button>
          </>
        }
      >
        <Field
          label="Default Language"
          htmlFor="wa-language"
          hint="Used when a template has no match for the contact's own language."
        >
          <Select
            id="wa-language"
            label="Default Language"
            hideLabel={false}
            value={language}
            onChange={edit(setLanguage)}
            options={LANGUAGES}
          />
        </Field>

        <Field
          label="Default Sender"
          htmlFor="wa-sender"
          hint="The business name recipients see above the message."
        >
          <Input
            id="wa-sender"
            value={senderName}
            onChange={(event) => edit(setSenderName)(event.target.value)}
          />
        </Field>

        <Field
          label="Rate Limit"
          htmlFor="wa-rate"
          hint="Messages per second. Meta throttles above your tier's ceiling."
        >
          <Input
            id="wa-rate"
            type="number"
            min={1}
            max={250}
            value={rateLimit}
            onChange={(event) => edit(setRateLimit)(event.target.value)}
          />
        </Field>

        <SettingRow
          label="Queue Status"
          hint="No backlog. 12 messages in flight."
          value={<HealthBadge status="healthy" size="sm" />}
        />
      </SettingsSection>
    </IntegrationDetailShell>
  );
}
