"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, PlugZap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { providersFor } from "@/constants/integrations";
import { cn } from "@/lib/utils";
import type { Integration, IntegrationProvider } from "@/types/integration";
import {
  ConnectionTestResult,
  evaluateCredentials,
  useConnectionTest,
} from "./connection-test";
import { CredentialInput } from "./credential-field";
import { ProviderSelector } from "./provider-selector";

/**
 * The guided connect flow: provider → credentials → test → save.
 *
 * Four steps in a drawer rather than a form on a page, for one reason: step
 * three has to happen before step four. A flat form invites Save, and saving a
 * token the provider has already rejected produces an integration that looks
 * connected and silently drops every message — which is the single worst
 * outcome this module can have.
 *
 * Saving after a failed test is still possible, because a merchant who knows
 * their firewall is blocking the test needs a way through. It is a warned,
 * demoted action: the primary button steps back to Test, and saving anyway is
 * the secondary that says what it is doing.
 *
 * State is mount-scoped: callers render this only while it is open, so every
 * visit starts on step one with empty fields. A drawer that remembers a
 * half-typed token from the last attempt saves the wrong credential eventually.
 */

const STEPS = ["Provider", "Credentials", "Test", "Save"] as const;
type StepIndex = 0 | 1 | 2 | 3;

export function ConnectDrawer({
  integration,
  open,
  onClose,
  onConnected,
}: {
  integration: Integration;
  open: boolean;
  onClose: () => void;
  /** Hands back the chosen adapter so the page can update its own state. */
  onConnected: (provider: IntegrationProvider) => void;
}) {
  const toast = useToast();
  const providers = useMemo(() => providersFor(integration.id), [integration.id]);

  const [step, setStep] = useState<StepIndex>(0);
  const [providerId, setProviderId] = useState<string | null>(
    integration.provider?.id ?? providers.find((item) => item.recommended)?.id ?? null,
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const { state: test, run, reset } = useConnectionTest();

  const provider = providers.find((item) => item.id === providerId) ?? null;

  /* Changing provider invalidates everything downstream of it. */
  function chooseProvider(id: string) {
    setProviderId(id);
    setValues({});
    reset();
  }

  const missing = provider
    ? provider.fields.filter((field) => !field.optional && !values[field.key]?.trim())
    : [];

  function next() {
    if (step === 1 && provider) {
      /* Testing is the point of step three, so entering it starts the test
         rather than waiting for a second click on a button that says Test. */
      setStep(2);
      run(() => evaluateCredentials(provider.fields, values));
      return;
    }
    setStep((current) => Math.min(current + 1, 3) as StepIndex);
  }

  function save() {
    if (!provider) return;
    onConnected(provider);
    toast(`${integration.name} connected through ${provider.name}`, "success");
    onClose();
  }

  const canAdvance =
    step === 0
      ? Boolean(provider)
      : step === 1
        ? missing.length === 0
        : step === 2
          ? test.status === "success" || test.status === "error"
          : true;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Connect ${integration.name}`}
      description="Four steps. Nothing is saved until the last one."
      footer={
        <div className="flex items-center justify-between gap-2.5">
          <Button
            variant="ghost"
            size="compact"
            onClick={() => (step === 0 ? onClose() : setStep((s) => (s - 1) as StepIndex))}
          >
            {step === 0 ? "Cancel" : <ArrowLeft aria-hidden />}
            {step === 0 ? null : "Back"}
          </Button>

          <div className="flex items-center gap-2.5">
            {step === 2 && test.status === "error" ? (
              <Button variant="outline" size="compact" onClick={() => setStep(3)}>
                Save anyway
              </Button>
            ) : null}

            {step === 3 ? (
              <Button size="compact" onClick={save}>
                <Check aria-hidden />
                Save connection
              </Button>
            ) : step === 2 && test.status === "error" ? (
              <Button
                size="compact"
                onClick={() => {
                  setStep(1);
                  reset();
                }}
              >
                Edit credentials
              </Button>
            ) : (
              <Button size="compact" onClick={next} disabled={!canAdvance}>
                {step === 1 ? "Test connection" : "Continue"}
                <ArrowRight aria-hidden />
              </Button>
            )}
          </div>
        </div>
      }
    >
      <StepRail current={step} />

      <div className="mt-5 space-y-4">
        {step === 0 ? (
          providers.length === 0 ? (
            <p className="text-sm text-text-secondary">
              This integration has no configurable provider — it is enabled from
              the workspace settings instead.
            </p>
          ) : (
            <>
              <p className="text-sm text-text-secondary">
                Choose the service that will carry {integration.name.toLowerCase()}.
                You can change it later without losing your history.
              </p>
              <ProviderSelector
                providers={providers}
                value={providerId}
                onChange={chooseProvider}
                name={`connect-${integration.id}`}
                className="sm:grid-cols-1"
              />
            </>
          )
        ) : null}

        {step === 1 && provider ? (
          <>
            <p className="text-sm text-text-secondary">
              {provider.docsLabel
                ? `Find these in ${provider.docsLabel}.`
                : `Enter the credentials ${provider.name} issued for this workspace.`}
            </p>
            {provider.fields.map((field) => (
              <CredentialInput
                key={field.key}
                spec={field}
                idPrefix={`connect-${integration.id}`}
                value={values[field.key] ?? ""}
                onChange={(value) =>
                  setValues((current) => ({ ...current, [field.key]: value }))
                }
              />
            ))}
            <p className="text-meta text-text-muted">
              Secrets are encrypted on save and shown masked from then on.
            </p>
          </>
        ) : null}

        {step === 2 && provider ? (
          <>
            <p className="text-sm text-text-secondary">
              MarketFlow is authenticating against {provider.name} with the
              details you entered.
            </p>
            <ConnectionTestResult state={test} />
            {test.status === "error" ? (
              <p className="rounded-panel border border-warning-soft bg-warning-soft px-3.5 py-3 text-sm text-warning-text">
                Saving now will store credentials the provider rejected. Messages
                sent through this connection will fail until it is fixed.
              </p>
            ) : null}
          </>
        ) : null}

        {step === 3 && provider ? (
          <>
            <div className="flex items-start gap-3 rounded-panel border border-border bg-surface-secondary px-3.5 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-btn bg-surface text-primary">
                <PlugZap className="size-4.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">
                  {integration.name} via {provider.name}
                </p>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {test.status === "success"
                    ? "Connection verified. Saving will make it live immediately."
                    : "Not verified. You can save and fix the credentials later."}
                </p>
              </div>
            </div>

            <dl className="space-y-2.5">
              {provider.fields.map((field) => (
                <div key={field.key} className="flex items-baseline justify-between gap-3">
                  <dt className="text-sm text-text-muted">{field.label}</dt>
                  <dd className="min-w-0 truncate text-sm font-medium text-text-primary">
                    {field.kind === "secret"
                      ? `••••••••${(values[field.key] ?? "").slice(-4)}`
                      : values[field.key] || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}
      </div>
    </Drawer>
  );
}

/**
 * The four steps, as a rail.
 *
 * `aria-current` rather than colour alone carries which one is live; the
 * numbers become ticks as they are cleared so the reader can see how much is
 * left without counting.
 */
function StepRail({ current }: { current: StepIndex }) {
  return (
    <ol className="flex items-center gap-1.5">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;

        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className="flex min-w-0 flex-1 items-center gap-1.5"
          >
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full text-[0.6875rem] font-bold transition-colors",
                done
                  ? "bg-primary text-white"
                  : active
                    ? "bg-primary-soft text-primary-dark"
                    : "bg-surface-secondary text-text-muted",
              )}
            >
              {done ? <Check className="size-3" aria-hidden /> : index + 1}
            </span>
            <span
              className={cn(
                "truncate text-meta font-medium",
                active ? "text-text-primary" : "text-text-muted",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
