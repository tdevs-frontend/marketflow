"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";

import { IconButton } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format";
import { INTEGRATIONS_NOW_MS } from "@/lib/integration-fixtures";
import { cn } from "@/lib/utils";
import type { CredentialSpec, CredentialValue } from "@/types/integration";

/**
 * Credentials, entered and displayed.
 *
 * The rule this file is built around: a saved secret is masked at the source.
 * `CredentialValue.value` is what the API returns, and for a token that is
 * already `••••••••••92AX` — the raw string is not in the client, in the store,
 * or in any fixture, so there is nothing for a "reveal" button to reveal.
 *
 * `revealValue` is the deliberate exception, and it is opt-in per field. Some
 * secrets genuinely are re-readable by their owner — a webhook signing secret
 * is the standard example, because verifying a signature requires having it —
 * and for those the reveal is real, temporary, and rewinds itself. A provider
 * access token is not one of those: it gets Rotate, not Reveal.
 */

/** How long a revealed secret stays on screen before it hides itself again. */
const REVEAL_MS = 15_000;

function useClipboard() {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return {
    copied,
    async copy(value: string, label: string) {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 2000);
        toast(`${label} copied to clipboard`, "success");
      } catch {
        toast("Could not copy — your browser blocked clipboard access", "error");
      }
    },
  };
}

/** Copy button sized for a value row. Its own component so all of them match. */
export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  /** Names the thing being copied, for the tooltip and the toast. */
  label: string;
  className?: string;
}) {
  const { copied, copy } = useClipboard();

  return (
    <Tooltip content={copied ? "Copied" : `Copy ${label.toLowerCase()}`}>
      <IconButton
        label={`Copy ${label}`}
        size="sm"
        onClick={() => copy(value, label)}
        className={className}
      >
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      </IconButton>
    </Tooltip>
  );
}

/* -------------------------------------------------------------------------- */
/* Display                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * One saved credential, read-only.
 *
 * Monospace on the value: these are strings that get compared character by
 * character, and a proportional font makes two different keys with the same
 * tail look like the same key.
 */
export function CredentialField({
  credential,
  revealValue,
  actions,
  className,
}: {
  credential: CredentialValue;
  /**
   * The real value, where the backend can legitimately return it. Enables the
   * temporary reveal; omit it and the field stays masked with no way to open
   * it, which is the right default for a provider token.
   */
  revealValue?: string;
  /** Rotate, Replace, Regenerate — whatever this particular secret supports. */
  actions?: ReactNode;
  className?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const secret = credential.kind === "secret";
  const canReveal = secret && Boolean(revealValue);
  const shown = revealed && revealValue ? revealValue : credential.value;

  function toggleReveal() {
    window.clearTimeout(timer.current);
    setRevealed((open) => {
      if (open) return false;
      /* Rewinds itself, so a secret cannot be left on a shared screen. */
      timer.current = window.setTimeout(() => setRevealed(false), REVEAL_MS);
      return true;
    });
  }

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-text-primary">{credential.label}</p>
        {credential.updatedAt ? (
          <p className="shrink-0 text-meta text-text-muted">
            Updated {formatRelativeTime(credential.updatedAt, INTEGRATIONS_NOW_MS)}
          </p>
        ) : null}
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <p
          className={cn(
            "min-w-0 flex-1 truncate rounded-field border border-border bg-surface-secondary px-3.5 py-2.5 text-sm text-text-secondary",
            secret && "font-mono",
          )}
        >
          {shown}
        </p>

        {canReveal ? (
          <IconButton
            label={revealed ? `Hide ${credential.label}` : `Reveal ${credential.label}`}
            size="sm"
            onClick={toggleReveal}
          >
            {revealed ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          </IconButton>
        ) : null}

        {/* Copying a mask copies nothing useful, so secrets only offer it once
            they are revealed — and non-secrets always do. */}
        {!secret || revealed ? (
          <CopyButton value={shown} label={credential.label} />
        ) : null}

        {actions}
      </div>

      {credential.hint ? (
        <p className="mt-1.5 text-meta font-medium text-text-muted">{credential.hint}</p>
      ) : null}
    </div>
  );
}

/** The stack a settings section renders. */
export function CredentialList({
  credentials,
  className,
}: {
  credentials: CredentialValue[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {credentials.map((credential) => (
        <CredentialField key={credential.key} credential={credential} />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Entry                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The form control for one `CredentialSpec`.
 *
 * Generated from the spec rather than written per provider — that is what lets
 * the same drawer configure Meta Cloud API, SMTP and a custom SMS gateway
 * without knowing anything about any of them. A provider whose form this cannot
 * express means `CredentialKind` needs another member, not that the drawer
 * needs a special case.
 */
export function CredentialInput({
  spec,
  value,
  onChange,
  error,
  idPrefix,
}: {
  spec: CredentialSpec;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Keeps ids unique when two forms are mounted at once. */
  idPrefix: string;
}) {
  const [visible, setVisible] = useState(false);
  const id = `${idPrefix}-${spec.key}`;

  if (spec.kind === "select") {
    return (
      <Field
        label={spec.label}
        htmlFor={id}
        hint={spec.hint}
        error={error}
      >
        <Select
          id={id}
          label={spec.label}
          hideLabel={false}
          value={value}
          onChange={onChange}
          options={spec.options ?? []}
          error={Boolean(error)}
        />
      </Field>
    );
  }

  return (
    <Field
      label={spec.optional ? `${spec.label} (optional)` : spec.label}
      htmlFor={id}
      hint={spec.hint}
      error={error}
    >
      <div className="relative">
        <Input
          id={id}
          /* `type="password"` rather than a CSS mask, so a password manager
             recognises the field and the value never lands in autofill history. */
          type={
            spec.kind === "secret" && !visible
              ? "password"
              : spec.kind === "number"
                ? "number"
                : spec.kind === "url"
                  ? "url"
                  : "text"
          }
          value={value}
          onChange={(event) => onChange(event.target.value)}
          error={Boolean(error)}
          autoComplete={spec.kind === "secret" ? "new-password" : "off"}
          spellCheck={false}
          className={cn(spec.kind === "secret" && "pr-11 font-mono")}
          aria-describedby={
            error ? `${id}-error` : spec.hint ? `${id}-hint` : undefined
          }
        />
        {spec.kind === "secret" ? (
          <button
            type="button"
            onClick={() => setVisible((open) => !open)}
            aria-label={visible ? `Hide ${spec.label}` : `Show ${spec.label}`}
            className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-btn text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
          >
            {visible ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
    </Field>
  );
}

/**
 * A secret shown exactly once — a new API key, a regenerated webhook secret.
 *
 * Deliberately loud and deliberately temporary: the merchant has one chance to
 * copy it, and the panel says so rather than letting them discover it by
 * closing the dialog.
 */
export function OneTimeSecret({
  secret,
  label,
  note,
}: {
  secret: string;
  label: string;
  note?: string;
}) {
  return (
    <div className="rounded-panel border border-border-strong bg-surface-secondary p-3.5">
      <p className="text-sm font-semibold text-text-primary">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto rounded-btn border border-border bg-surface px-3 py-2.5 font-mono text-meta whitespace-nowrap text-text-primary">
          {secret}
        </code>
        <CopyButton value={secret} label={label} />
      </div>
      <p className="mt-2 text-meta text-text-secondary">
        {note ??
          "Copy it now — this is the only time it will be shown. After you close this it is stored hashed and cannot be recovered."}
      </p>
    </div>
  );
}

/** The row of buttons under a settings section. Kept here so all of them match. */
export function SettingsFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border px-5 py-4">
      {children}
    </div>
  );
}

