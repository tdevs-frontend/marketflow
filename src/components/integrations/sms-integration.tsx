"use client";

import { useState } from "react";
import { AlertTriangle, CheckCheck, Send, Smartphone, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { MeterRow } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { isValidPhone } from "@/lib/validation";
import { requireIntegration } from "@/lib/integration-fixtures";
import { CredentialField } from "./credential-field";
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
 * The SMS provider page.
 *
 * This is the module's worked example of a broken connection, and the page is
 * arranged around getting out of it: the failure is named at the top of the
 * rail with the button that fixes it, the credential whose rotation is overdue
 * carries the reason in its own hint, and the queue depth says what is waiting
 * on the repair. A page that only rendered a red badge would be accurate and
 * useless.
 *
 * Like Email, it is written against the provider abstraction — Twilio, Vonage
 * and a custom HTTP gateway all render from the same saved credential list.
 */

const COUNTRIES = [
  { value: "BD", label: "Bangladesh (+880)" },
  { value: "IN", label: "India (+91)" },
  { value: "AE", label: "United Arab Emirates (+971)" },
  { value: "GB", label: "United Kingdom (+44)" },
  { value: "US", label: "United States (+1)" },
];

const BALANCE = 148.2;
const BALANCE_FLOOR = 500;

export function SmsIntegration() {
  const integration = requireIntegration("sms");
  const toast = useToast();

  const [senderId, setSenderId] = useState("MRKTFLOW");
  const [country, setCountry] = useState("BD");
  const [rateLimit, setRateLimit] = useState("20");
  const [dirty, setDirty] = useState(false);

  const [testNumber, setTestNumber] = useState("");
  const { state: testState, run: runTest } = useConnectionTest();

  const edit = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setDirty(true);
  };

  const identifiers = integration.credentials.filter(
    (credential) => credential.kind !== "secret",
  );
  const secrets = integration.credentials.filter(
    (credential) => credential.kind === "secret",
  );

  const apiCheck = integration.health.find((check) => check.id === "api");
  const broken = apiCheck?.status === "error";

  /**
   * The test send.
   *
   * It fails for the reason the connection is actually failing rather than
   * inventing a second one — a merchant who sees "invalid number" while their
   * token is expired goes looking in the wrong place.
   */
  function runConnectionTest(): TestOutcome {
    if (broken) {
      return {
        ok: false,
        message: "Authentication failed. Please verify your API token.",
        detail: `${integration.provider?.name ?? "The provider"} rejected the request with 401 Unauthorized. Rotate the auth token in your provider console, then reconnect.`,
      };
    }
    return {
      ok: true,
      message: "Connection successful.",
      detail: `${integration.provider?.name ?? "The gateway"} accepted the credentials and reported the account as active.`,
    };
  }

  function runTestSms(): TestOutcome {
    if (!isValidPhone(testNumber)) {
      return {
        ok: false,
        message: "That is not a valid phone number.",
        detail: "Use international format, including the country code — for example +8801712345678.",
      };
    }
    if (broken) {
      return {
        ok: false,
        message: "Authentication failed. Please verify your API token.",
        detail: `${integration.provider?.name ?? "The provider"} rejected the request with 401 Unauthorized. Rotate the auth token and reconnect.`,
      };
    }
    return {
      ok: true,
      message: `Test message sent to ${testNumber}.`,
      detail: "Accepted by the provider and queued for delivery.",
    };
  }

  const facts: SummaryFact[] = [
    { label: "Provider", value: integration.provider?.name ?? "Not selected" },
    { label: "Sender ID", value: senderId },
    { label: "Default Country", value: COUNTRIES.find((c) => c.value === country)?.label ?? "—" },
    {
      label: "Balance",
      value: `$${BALANCE.toFixed(2)}`,
      hint: "≈ 4 days at the current rate",
    },
  ];

  return (
    <IntegrationDetailShell
      integration={integration}
      title="SMS Integration"
      description="Configure the gateway MarketFlow uses for transactional and marketing SMS."
      emptyDescription="Connect a gateway to send transactional and marketing SMS worldwide."
      facts={facts}
      kpis={[
        { label: "Messages Today", value: "612", icon: Smartphone, tone: "brand", hint: "Before the outage" },
        { label: "Delivery Rate", value: "94.2%", icon: CheckCheck, hint: "Last 24 hours" },
        { label: "Balance", value: "$148.20", icon: Wallet, tone: "warning", hint: "Top up to keep sending" },
        { label: "Queued", value: "214", icon: AlertTriangle, tone: "warning", hint: "Held until this is fixed" },
      ]}
      onTest={runConnectionTest}
      rail={
        <>
          {broken ? (
            /* The one loud element on the page, and it earns it: without a
               working token nothing else on this screen matters. */
            <Card className="border-error-soft">
              <CardBody className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-btn bg-error-soft text-error">
                  <AlertTriangle className="size-4.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">
                    Action required
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {integration.activity.lastError}
                  </p>
                  <p className="mt-1.5 text-meta text-text-muted">
                    214 messages are queued and will send once the token is valid.
                  </p>
                </div>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              title="Account Balance"
              description="What the provider has left on this account."
            />
            <CardBody>
              <MeterRow
                label="Balance"
                value={(BALANCE / BALANCE_FLOOR) * 100}
                display={`$${BALANCE.toFixed(2)}`}
                tone="bg-warning"
                hint={`Below the $${BALANCE_FLOOR} top-up threshold`}
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                onClick={() => toast("Opening the provider's billing page…", "info")}
              >
                Top up balance
              </Button>
            </CardBody>
          </Card>
        </>
      }
    >
      <SettingsSection
        title="Credentials"
        description={`How MarketFlow authenticates with ${integration.provider?.name ?? "your gateway"}. Secrets are shown masked.`}
      >
        {identifiers
          .filter((credential) => credential.key !== "senderId")
          .map((credential) => (
            <CredentialField key={credential.key} credential={credential} />
          ))}

        {secrets.map((credential) => (
          <CredentialField
            key={credential.key}
            credential={credential}
            actions={
              <Button variant="outline" size="sm" onClick={() => toast("Reconnect to replace this secret", "info")}>
                Replace
              </Button>
            }
          />
        ))}
      </SettingsSection>

      <SettingsSection
        title="Sender & Routing"
        description="Who the message comes from, and where it is routed by default."
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
                toast("SMS routing settings saved", "success");
              }}
            >
              Save changes
            </Button>
          </>
        }
      >
        <Field
          label="Sender ID"
          htmlFor="sms-sender-id"
          hint="Alphanumeric IDs are not supported in every country — numeric senders are used as a fallback."
        >
          <Input
            id="sms-sender-id"
            value={senderId}
            maxLength={11}
            onChange={(event) => edit(setSenderId)(event.target.value.toUpperCase())}
          />
        </Field>

        <Field
          label="Default Country"
          htmlFor="sms-country"
          hint="Applied to contacts stored without a country code."
        >
          <Select
            id="sms-country"
            label="Default Country"
            hideLabel={false}
            value={country}
            onChange={edit(setCountry)}
            options={COUNTRIES}
          />
        </Field>

        <Field
          label="Rate Limit"
          htmlFor="sms-rate-limit"
          hint="Messages per second. Above the gateway's ceiling, sends are rejected rather than queued."
        >
          <Input
            id="sms-rate-limit"
            type="number"
            min={1}
            value={rateLimit}
            onChange={(event) => edit(setRateLimit)(event.target.value)}
          />
        </Field>

        <SettingRow
          label="Registered routes"
          hint="Sender ID approved for Bangladesh and India."
          value={<span className="text-sm font-semibold text-text-primary">2 countries</span>}
        />
      </SettingsSection>

      <SettingsSection
        title="Test SMS"
        description="Sends one real message through this gateway. It is billed like any other."
      >
        <Field
          label="Recipient number"
          htmlFor="sms-test-number"
          hint="International format, including the country code."
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <Input
              id="sms-test-number"
              type="tel"
              placeholder="+8801712345678"
              value={testNumber}
              onChange={(event) => setTestNumber(event.target.value)}
              className="min-w-56 flex-1"
            />
            <Button
              variant="secondary"
              onClick={() => runTest(runTestSms)}
              disabled={testState.status === "testing"}
            >
              <Send aria-hidden />
              Send Test SMS
            </Button>
          </div>
        </Field>

        <ConnectionTestResult state={testState} />
      </SettingsSection>
    </IntegrationDetailShell>
  );
}
