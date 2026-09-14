"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  SOCIAL_CAPABILITY_DETAIL,
  SOCIAL_CAPABILITY_LABEL,
  SOCIAL_CAPABILITY_SCOPES,
  SOCIAL_PROVIDERS,
} from "@/constants/integrations";
import { cn } from "@/lib/utils";
import type { SocialProvider } from "@/types/social";
import { CodeText } from "../integration-badges";
import { ProviderIcon } from "./provider-icon";

/**
 * Connecting a social account: platform → authorise → resource → permissions →
 * done.
 *
 * The shape of this flow is dictated by OAuth, not by preference. There is no
 * credential form anywhere in it, because a merchant must never type a social
 * password into MarketFlow — they authorise on the provider and we receive a
 * token. Step two is therefore a hand-off, and it says so.
 *
 * Step three exists because providers return *collections*: a Facebook login
 * can grant access to six Pages and picking the wrong one publishes a campaign
 * to the wrong audience. A flow that silently took the first result would be
 * shorter and occasionally catastrophic.
 *
 * State is mount-scoped — callers render this only while it is open — so every
 * connection starts from step one rather than resuming someone else's.
 */

const STEPS = ["Platform", "Authorize", "Account", "Permissions", "Done"] as const;
type StepIndex = 0 | 1 | 2 | 3 | 4;

/** How long the mock authorisation hand-off takes. Real OAuth replaces this. */
const AUTHORIZE_MS = 1600;

/**
 * What each provider hands back once authorised.
 *
 * In a real build this is the resource list from the provider's API. It lives
 * here as a fixture so the account-selection step has something honest to show
 * — the point being that the step is driven by what came back, not by a
 * hard-coded pair of options per vendor.
 */
const DISCOVERED: Record<string, { id: string; name: string; detail: string }[]> = {
  facebook: [
    { id: "fb-1", name: "MarketFlow Store", detail: "102938475610293 · 32,140 followers" },
    { id: "fb-2", name: "MarketFlow Bangladesh", detail: "884910337712004 · 6,420 followers" },
  ],
  instagram: [
    { id: "ig-1", name: "MarketFlow Official", detail: "@marketflow · Business account" },
    { id: "ig-2", name: "MarketFlow Studio", detail: "@marketflowstudio · Creator account" },
  ],
  linkedin: [
    { id: "li-1", name: "MarketFlow", detail: "Company Page · 18,940 followers" },
  ],
  x: [{ id: "x-1", name: "MarketFlow", detail: "@marketflow · Profile" }],
  tiktok: [],
};

export function OAuthConnectionDialog({
  open,
  onClose,
  onConnected,
}: {
  open: boolean;
  onClose: () => void;
  onConnected: (provider: SocialProvider, resourceName: string) => void;
}) {
  const toast = useToast();

  const [step, setStep] = useState<StepIndex>(0);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [resourceId, setResourceId] = useState<string | null>(null);
  const [authorizing, setAuthorizing] = useState(false);
  const [showScopes, setShowScopes] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const provider = SOCIAL_PROVIDERS.find((item) => item.id === providerId) ?? null;
  const resources = provider ? (DISCOVERED[provider.id] ?? []) : [];
  const resource = resources.find((item) => item.id === resourceId) ?? null;

  /** The hand-off. A real build opens the provider's consent screen here. */
  function authorize() {
    if (!provider) return;
    setAuthorizing(true);
    timer.current = window.setTimeout(() => {
      setAuthorizing(false);
      const discovered = DISCOVERED[provider.id] ?? [];
      /* One result needs no choice — skipping straight past a list of one is
         the difference between a step and an obstacle. */
      setResourceId(discovered.length === 1 ? discovered[0].id : null);
      setStep(discovered.length === 1 ? 3 : 2);
    }, AUTHORIZE_MS);
  }

  function finish() {
    if (!provider || !resource) return;
    onConnected(provider, resource.name);
    toast(`${resource.name} connected on ${provider.label}`, "success");
    setStep(4);
  }

  const canContinue =
    step === 0
      ? Boolean(provider && provider.availability === "available")
      : step === 2
        ? Boolean(resource)
        : true;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Connect a social account"
      description="You authorise on the platform. MarketFlow never sees your password."
      footer={
        step === 4 ? (
          <Button size="compact" onClick={onClose}>
            Done
          </Button>
        ) : (
          <div className="flex w-full items-center justify-between gap-2.5">
            <Button
              variant="ghost"
              size="compact"
              disabled={authorizing}
              onClick={() =>
                step === 0 ? onClose() : setStep((s) => (s - 1) as StepIndex)
              }
            >
              {step === 0 ? "Cancel" : <ArrowLeft aria-hidden />}
              {step === 0 ? null : "Back"}
            </Button>

            {step === 1 ? (
              <Button size="compact" onClick={authorize} disabled={authorizing}>
                {authorizing ? (
                  <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden />
                ) : (
                  <ExternalLink aria-hidden />
                )}
                {authorizing ? "Waiting for authorization…" : `Continue to ${provider?.label}`}
              </Button>
            ) : step === 3 ? (
              <Button size="compact" onClick={finish}>
                <Check aria-hidden />
                Connect account
              </Button>
            ) : (
              <Button
                size="compact"
                disabled={!canContinue}
                onClick={() => setStep((s) => (s + 1) as StepIndex)}
              >
                Continue
                <ArrowRight aria-hidden />
              </Button>
            )}
          </div>
        )
      }
    >
      <StepRail current={step} />

      <div className="mt-5">
        {step === 0 ? (
          <PlatformStep value={providerId} onChange={setProviderId} />
        ) : null}

        {step === 1 && provider ? (
          <AuthorizeStep provider={provider} authorizing={authorizing} />
        ) : null}

        {step === 2 && provider ? (
          <ResourceStep
            provider={provider}
            resources={resources}
            value={resourceId}
            onChange={setResourceId}
          />
        ) : null}

        {step === 3 && provider ? (
          <PermissionsStep
            provider={provider}
            resourceName={resource?.name ?? ""}
            showScopes={showScopes}
            onToggleScopes={() => setShowScopes((open) => !open)}
          />
        ) : null}

        {step === 4 && provider && resource ? (
          <CompleteStep provider={provider} resourceName={resource.name} />
        ) : null}
      </div>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Steps                                                                      */
/* -------------------------------------------------------------------------- */

function PlatformStep({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <>
      <p className="text-sm text-text-secondary">
        Choose where you want to publish. You can connect more than one account
        per platform.
      </p>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {SOCIAL_PROVIDERS.map((provider) => {
          const available = provider.availability === "available";
          const selected = provider.id === value;

          return (
            <label
              key={provider.id}
              className={cn(
                "relative flex items-start gap-3 rounded-panel border p-3.5 transition-all focus-within:shadow-focus",
                available
                  ? selected
                    ? "cursor-pointer border-primary bg-primary-soft"
                    : "cursor-pointer border-border bg-surface hover:border-border-strong hover:bg-surface-secondary"
                  : /* Not a disabled-looking button that still invites a click:
                       it is visibly a preview row and the radio is inert. */
                    "cursor-not-allowed border-border bg-surface-secondary/60",
              )}
            >
              <input
                type="radio"
                name="social-provider"
                value={provider.id}
                checked={selected}
                disabled={!available}
                onChange={() => onChange(provider.id)}
                className="sr-only"
              />

              <ProviderIcon provider={provider} size="md" />

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      available ? "text-text-primary" : "text-text-muted",
                    )}
                  >
                    {provider.label}
                  </span>
                  {available ? null : (
                    <Badge size="sm" className="normal-case">
                      Coming Soon
                    </Badge>
                  )}
                </span>
                <span className="mt-0.5 block text-sm text-text-secondary">
                  {provider.description}
                </span>
              </span>

              {available && selected ? (
                <span
                  aria-hidden
                  className="grid size-4.5 shrink-0 place-items-center rounded-full bg-primary text-white"
                >
                  <Check className="size-3" />
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </>
  );
}

function AuthorizeStep({
  provider,
  authorizing,
}: {
  provider: SocialProvider;
  authorizing: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-panel border border-border bg-surface-secondary px-3.5 py-3">
        <ProviderIcon provider={provider} size="lg" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary">
            Authorize on {provider.label}
          </p>
          <p className="mt-0.5 text-sm text-text-secondary">
            {authorizing
              ? `Waiting for you to finish on ${provider.label}. This window stays open.`
              : `A ${provider.label} window opens where you sign in and approve access. You are brought straight back here.`}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-panel border border-border px-3.5 py-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">
            MarketFlow never sees your password.
          </span>{" "}
          {provider.label} returns an access token scoped to the permissions you
          approve, and you can revoke it from {provider.label} at any time.
        </p>
      </div>
    </div>
  );
}

function ResourceStep({
  provider,
  resources,
  value,
  onChange,
}: {
  provider: SocialProvider;
  resources: { id: string; name: string; detail: string }[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <>
      <p className="text-sm text-text-secondary">
        Your {provider.label} account has access to more than one{" "}
        {provider.resourceNoun.toLowerCase()}. Choose the one MarketFlow should
        publish to.
      </p>

      <div className="mt-4 space-y-2.5">
        {resources.map((item) => {
          const selected = item.id === value;

          return (
            <label
              key={item.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-panel border p-3.5 transition-all focus-within:shadow-focus",
                selected
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-surface hover:border-border-strong hover:bg-surface-secondary",
              )}
            >
              <input
                type="radio"
                name="social-resource"
                value={item.id}
                checked={selected}
                onChange={() => onChange(item.id)}
                className="sr-only"
              />
              <ProviderIcon provider={provider} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-text-primary">
                  {item.name}
                </span>
                <span className="block truncate text-sm text-text-muted">
                  {item.detail}
                </span>
              </span>
              <span
                aria-hidden
                className={cn(
                  "grid size-4.5 shrink-0 place-items-center rounded-full border",
                  selected
                    ? "border-primary bg-primary text-white"
                    : "border-border-strong bg-surface",
                )}
              >
                {selected ? <Check className="size-3" /> : null}
              </span>
            </label>
          );
        })}
      </div>
    </>
  );
}

function PermissionsStep({
  provider,
  resourceName,
  showScopes,
  onToggleScopes,
}: {
  provider: SocialProvider;
  resourceName: string;
  showScopes: boolean;
  onToggleScopes: () => void;
}) {
  const scopes = SOCIAL_CAPABILITY_SCOPES[provider.id] ?? {};

  return (
    <>
      <p className="text-sm text-text-secondary">
        MarketFlow is asking {provider.label} for these permissions on{" "}
        <span className="font-semibold text-text-primary">{resourceName}</span>.
      </p>

      <ul className="mt-4 space-y-2">
        {provider.capabilities.map((key) => (
          <li
            key={key}
            className="flex items-start gap-3 rounded-panel border border-border px-3.5 py-3"
          >
            <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">
                {SOCIAL_CAPABILITY_LABEL[key]}
              </p>
              <p className="mt-0.5 text-sm text-text-secondary">
                {SOCIAL_CAPABILITY_DETAIL[key]}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/*
       * The raw scopes, behind a disclosure.
       *
       * A merchant deciding whether to grant access needs "Publish Content";
       * an agency auditing what was granted needs `pages_manage_posts`. Both
       * are legitimate, and only one of them belongs in the default view.
       */}
      <div className="mt-4">
        <button
          type="button"
          onClick={onToggleScopes}
          aria-expanded={showScopes}
          className="inline-flex items-center gap-1.5 rounded-btn text-sm font-medium text-text-muted transition-colors hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
        >
          <ChevronDown
            className={cn("size-4 transition-transform", showScopes && "rotate-180")}
            aria-hidden
          />
          Advanced — provider scopes
        </button>

        {showScopes ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {provider.capabilities.map((key) => (
              <li key={key}>
                <CodeText>{scopes[key] ?? key}</CodeText>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );
}

function CompleteStep({
  provider,
  resourceName,
}: {
  provider: SocialProvider;
  resourceName: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-panel border border-success-soft bg-success-soft px-3.5 py-3">
        <Check className="mt-0.5 size-4 shrink-0 text-success-text" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-success-text">
            Connected successfully
          </p>
          <p className="mt-0.5 text-sm text-success-text/90">
            {resourceName} is now available to Social Planner as a publish target.
          </p>
        </div>
      </div>

      <dl className="space-y-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm text-text-muted">Account</dt>
          <dd className="min-w-0 truncate text-sm font-semibold text-text-primary">
            {resourceName}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm text-text-muted">{provider.resourceNoun}</dt>
          <dd className="text-sm font-semibold text-text-primary">{provider.label}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="shrink-0 text-sm text-text-muted">Capabilities</dt>
          <dd className="flex min-w-0 flex-wrap justify-end gap-1.5">
            {provider.capabilities.map((key) => (
              <Badge key={key} tone="success" size="sm" className="normal-case">
                {SOCIAL_CAPABILITY_LABEL[key]}
              </Badge>
            ))}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm text-text-muted">Last sync</dt>
          <dd className="text-sm font-semibold text-text-primary">Just now</dd>
        </div>
      </dl>
    </div>
  );
}

/** The five steps, as a rail. Matches the connect drawer's on the other pages. */
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
