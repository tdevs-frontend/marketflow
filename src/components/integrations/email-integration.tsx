"use client";

import { useState } from "react";
import { CheckCheck, Mail, Send, TrendingDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { MeterRow } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { isValidEmail } from "@/lib/validation";
import { requireIntegration } from "@/lib/integration-fixtures";
import { CredentialField } from "./credential-field";
import { HealthBadge } from "./integration-badges";
import {
  ConnectionTestResult,
  useConnectionTest,
  type TestOutcome,
} from "./connection-test";
import {
  IntegrationDetailShell,
  SettingRow,
  SettingsSection,
} from "./integration-detail-shell";
import type { SummaryFact } from "./connection-summary";

/**
 * The Email provider page.
 *
 * Written against the provider abstraction rather than against SMTP. The
 * credential rows are rendered from whatever the connected adapter saved, so
 * the same page shows a host and a port for SMTP and a region and an API key
 * for SES without a branch anywhere — the only email-specific thing on it is
 * the part that genuinely is: sender identity, sending limits, and proving a
 * message actually arrives.
 */

const DAILY_LIMIT = 20_000;
const SENT_TODAY = 2480;

export function EmailIntegration() {
  const integration = requireIntegration("email");
  const toast = useToast();

  const [fromName, setFromName] = useState("MarketFlow");
  const [fromEmail, setFromEmail] = useState("hello@marketflow.app");
  const [replyTo, setReplyTo] = useState("support@marketflow.app");
  const [dailyLimit, setDailyLimit] = useState(String(DAILY_LIMIT));
  const [rateLimit, setRateLimit] = useState("40");
  const [dirty, setDirty] = useState(false);

  const [testAddress, setTestAddress] = useState("");
  const { state: sendState, run: sendTest } = useConnectionTest();

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

  const senderCheck = integration.health.find((check) => check.id === "sender");
  const connectionCheck = integration.health.find((check) => check.id === "api");

  const invalidFrom = fromEmail.length > 0 && !isValidEmail(fromEmail);

  /** The test send. Validates the address first — a 422 from our own form is noise. */
  function runTestSend(): TestOutcome {
    if (!isValidEmail(testAddress)) {
      return {
        ok: false,
        message: "That is not a valid email address.",
        detail: "Enter an inbox you can check, such as you@company.com.",
      };
    }
    return {
      ok: true,
      message: `Test email sent to ${testAddress}.`,
      detail: "Accepted by the provider in 340 ms. Check spam if it has not arrived in a minute.",
    };
  }

  const facts: SummaryFact[] = [
    { label: "Provider", value: integration.provider?.name ?? "Not selected" },
    { label: "Sender", value: fromEmail },
    { label: "Reply-To", value: replyTo },
    {
      label: "Daily Quota",
      value: `${SENT_TODAY.toLocaleString("en-US")} / ${DAILY_LIMIT.toLocaleString("en-US")}`,
      hint: "Resets at midnight UTC",
    },
  ];

  return (
    <IntegrationDetailShell
      integration={integration}
      title="Email Integration"
      description="Configure the provider MarketFlow uses for campaigns and automated email."
      emptyDescription="Connect a provider to send campaign and automated email from your own domain."
      facts={facts}
      kpis={[
        { label: "Emails Today", value: "2,480", icon: Mail, tone: "brand", hint: "Campaign and automated" },
        { label: "Delivery Rate", value: "98.4%", icon: CheckCheck, tone: "success", hint: "Last 24 hours" },
        { label: "Bounce Rate", value: "1.2%", icon: TrendingDown, hint: "Hard and soft" },
        { label: "Complaint Rate", value: "0.02%", icon: TrendingDown, hint: "Spam reports" },
      ]}
      rail={
        <Card>
          <CardHeader
            title="Sending Volume"
            description="Against the quota this provider allows."
          />
          <CardBody className="space-y-4">
            <MeterRow
              label="Daily quota"
              value={(SENT_TODAY / DAILY_LIMIT) * 100}
              display={`${SENT_TODAY.toLocaleString("en-US")} of ${DAILY_LIMIT.toLocaleString("en-US")}`}
              hint="12% used with 13 hours left in the window"
            />
            <MeterRow
              label="Send rate"
              value={62}
              display="25 / 40 per sec"
              hint="Peak over the last hour"
            />
          </CardBody>
        </Card>
      }
    >
      <SettingsSection
        title="Connection"
        description={`How MarketFlow reaches ${integration.provider?.name ?? "your provider"}.`}
      >
        {connection.map((credential) => (
          <CredentialField key={credential.key} credential={credential} />
        ))}
      </SettingsSection>

      <SettingsSection
        title="Authentication"
        description="Stored encrypted and shown masked. Replace it by reconnecting the provider."
      >
        {secrets.map((credential) => (
          <CredentialField key={credential.key} credential={credential} />
        ))}
      </SettingsSection>

      <SettingsSection
        title="Sender Identity"
        description="What recipients see, and where their replies go."
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
              disabled={!dirty || invalidFrom}
              onClick={() => {
                setDirty(false);
                toast("Sender identity saved", "success");
              }}
            >
              Save changes
            </Button>
          </>
        }
      >
        <Field label="From Name" htmlFor="email-from-name">
          <Input
            id="email-from-name"
            value={fromName}
            onChange={(event) => edit(setFromName)(event.target.value)}
          />
        </Field>

        <Field
          label="From Email"
          htmlFor="email-from-address"
          hint="Must be on a domain this provider is authorised to send for."
          error={invalidFrom ? "Enter a valid email address." : undefined}
        >
          <Input
            id="email-from-address"
            type="email"
            value={fromEmail}
            error={invalidFrom}
            onChange={(event) => edit(setFromEmail)(event.target.value)}
          />
        </Field>

        <Field
          label="Reply-To"
          htmlFor="email-reply-to"
          hint="Where replies land. Often a shared inbox rather than the sender."
        >
          <Input
            id="email-reply-to"
            type="email"
            value={replyTo}
            onChange={(event) => edit(setReplyTo)(event.target.value)}
          />
        </Field>
      </SettingsSection>

      <SettingsSection
        title="Sending"
        description="Ceilings MarketFlow enforces so a large campaign cannot trip the provider's own limits."
        footer={
          <Button
            size="compact"
            disabled={!dirty}
            onClick={() => {
              setDirty(false);
              toast("Sending limits saved", "success");
            }}
          >
            Save changes
          </Button>
        }
      >
        <Field
          label="Daily Limit"
          htmlFor="email-daily-limit"
          hint="Messages per 24 hours. Sends beyond it queue for the next window."
        >
          <Input
            id="email-daily-limit"
            type="number"
            min={100}
            value={dailyLimit}
            onChange={(event) => edit(setDailyLimit)(event.target.value)}
          />
        </Field>

        <Field
          label="Rate Limit"
          htmlFor="email-rate-limit"
          hint="Messages per second. Keep it under what your provider allows."
        >
          <Input
            id="email-rate-limit"
            type="number"
            min={1}
            value={rateLimit}
            onChange={(event) => edit(setRateLimit)(event.target.value)}
          />
        </Field>
      </SettingsSection>

      <SettingsSection
        title="Verification"
        description="Prove the connection works and that mail from this domain is trusted."
      >
        <SettingRow
          label="Connection Test"
          hint={connectionCheck?.detail}
          value={
            connectionCheck ? <HealthBadge status={connectionCheck.status} size="sm" /> : null
          }
        />

        <SettingRow
          label="Sender Verification"
          hint={senderCheck?.detail}
          value={senderCheck ? <HealthBadge status={senderCheck.status} size="sm" /> : null}
        />

        <div className="border-t border-border pt-4">
          <Field
            label="Send a test email"
            htmlFor="email-test-address"
            hint="Delivers a real message through this provider so you can check rendering and placement."
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <Input
                id="email-test-address"
                type="email"
                placeholder="you@company.com"
                value={testAddress}
                onChange={(event) => setTestAddress(event.target.value)}
                className="min-w-56 flex-1"
              />
              <Button
                variant="secondary"
                onClick={() => sendTest(runTestSend)}
                disabled={sendState.status === "testing"}
              >
                <Send aria-hidden />
                Send Test Email
              </Button>
            </div>
          </Field>

          <ConnectionTestResult state={sendState} className="mt-3" />
        </div>
      </SettingsSection>
    </IntegrationDetailShell>
  );
}
