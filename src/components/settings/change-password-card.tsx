"use client";

import { useId, useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";

import { IconButton } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress";
import {
  PASSWORD_RULES,
  PASSWORD_STRENGTH,
  passwordScore,
} from "@/constants/settings";
import { CAPABILITIES, UNAVAILABLE_REASON, changePassword } from "@/lib/account-service";
import { useSecurityState } from "@/lib/account-store";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ServiceNotice } from "./service-notice";
import { SaveBar, SettingsSection, useSaveState } from "./settings-section";

/**
 * Change password.
 *
 * Every piece of validation here is genuinely client-side work: length and
 * character classes, the new password matching its confirmation, and the new
 * one differing from the current one. All of that is worth doing in the browser
 * and none of it needs a server.
 *
 * What does need a server is the one check that matters - that the current
 * password is actually the current password. Nothing in this browser knows the
 * stored hash, nothing should, and a comparison against a seeded demo value
 * would be a security control made of theatre. So the submit calls the service,
 * the service reports `service_unavailable`, and the form prints that.
 *
 * It would have been easy to toast "Password changed successfully" and let the
 * screen look finished. That is the single worst lie this module could tell: a
 * person who believes they have rotated a password after a scare stops doing
 * the thing that would have actually protected them. The notice above the form
 * says so before they type, rather than after they press the button.
 *
 * No password is logged, echoed into a URL, or kept after the call returns.
 */

export function ChangePasswordCard() {
  const id = useId();
  const security = useSecurityState();
  const { state, run, setError, reset } = useSaveState();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);

  const score = passwordScore(next);
  const strength = PASSWORD_STRENGTH[score] ?? PASSWORD_STRENGTH[0];
  const weak = next.length > 0 && score < PASSWORD_RULES.length;

  const mismatch = confirm.length > 0 && confirm !== next;
  const reused = next.length > 0 && next === current;

  const canSubmit =
    current.length > 0 && next.length > 0 && confirm.length > 0;

  function submit() {
    setTouched(true);

    if (!canSubmit) {
      setError("Fill in all three fields.");
      return;
    }
    if (weak) {
      setError("Choose a password that meets every requirement below.");
      return;
    }
    if (reused) {
      setError("The new password must be different from the current one.");
      return;
    }
    if (next !== confirm) {
      setError("The new passwords do not match.");
      return;
    }

    void run(async () => {
      const result = await changePassword({
        currentPassword: current,
        newPassword: next,
      });

      if (result.ok) {
        /* Cleared on success so the values do not sit in the DOM afterwards. */
        setCurrent("");
        setNext("");
        setConfirm("");
        setTouched(false);
      }
      return result;
    });
  }

  return (
    <SettingsSection
      id="password"
      title="Change password"
      description="A passphrase of four unrelated words beats a short complicated one."
      bodyClassName="max-w-lg space-y-4"
      footer={
        <SaveBar
          state={state}
          onSave={submit}
          dirty={canSubmit}
          label="Change password"
          savingLabel="Changing…"
          savedLabel="Password changed"
        />
      }
    >
      {!CAPABILITIES.password ? (
        <ServiceNotice tone="security" title="Passwords cannot be changed yet">
          {UNAVAILABLE_REASON.password} The form below validates everything it
          legitimately can and then tells you exactly that - your password is
          unchanged, and nothing was sent.
        </ServiceNotice>
      ) : security.passwordChangedAt ? (
        <p className="text-sm font-medium text-text-muted">
          Last changed {formatDate(security.passwordChangedAt)}.
        </p>
      ) : null}

      <PasswordField
        id={`${id}-current`}
        label="Current password"
        autoComplete="current-password"
        value={current}
        onChange={(value) => {
          setCurrent(value);
          if (state.status === "error") reset();
        }}
      />

      <div className="space-y-2">
        <PasswordField
          id={`${id}-next`}
          label="New password"
          autoComplete="new-password"
          value={next}
          error={touched && reused ? "Choose something different." : undefined}
          onChange={(value) => {
            setNext(value);
            if (state.status === "error") reset();
          }}
        />

        {next.length > 0 ? (
          <>
            <div className="flex items-center gap-3">
              <ProgressBar
                value={(score / PASSWORD_RULES.length) * 100}
                label="Password strength"
                tone={strength.tone}
                className="flex-1"
              />
              <span className="shrink-0 text-sm font-semibold text-text-secondary">
                {strength.label}
              </span>
            </div>

            {/* The checklist is `aria-live` so somebody using a screen reader
                hears requirements being met as they type, rather than only on
                submit. Polite, so it waits for a pause in typing. */}
            <ul aria-live="polite" className="space-y-1">
              {PASSWORD_RULES.map((rule) => {
                const met = rule.test(next);

                return (
                  <li
                    key={rule.label}
                    className={cn(
                      "flex items-center gap-2 text-sm",
                      met ? "text-success-text" : "text-text-muted",
                    )}
                  >
                    {met ? (
                      <Check className="size-4 shrink-0" aria-hidden />
                    ) : (
                      <X className="size-4 shrink-0" aria-hidden />
                    )}
                    {rule.label}
                    <span className="sr-only">{met ? " - met" : " - not met"}</span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </div>

      <PasswordField
        id={`${id}-confirm`}
        label="Confirm new password"
        autoComplete="new-password"
        value={confirm}
        error={mismatch ? "These passwords do not match." : undefined}
        onChange={(value) => {
          setConfirm(value);
          if (state.status === "error") reset();
        }}
      />
    </SettingsSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Field                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A password input with a reveal toggle.
 *
 * The toggle is a real button with a label that changes - "Show password" /
 * "Hide password" - rather than an icon with a fixed name, because the thing a
 * screen reader user needs is the *state*, and an eye glyph called "toggle
 * password" tells them nothing about which way it currently is.
 *
 * `aria-pressed` carries the same fact for assistive tech that reports it, and
 * the input keeps its `autoComplete` so password managers still work - turning
 * that off is a common instinct on a change-password form and it just pushes
 * people towards passwords they can retype from memory.
 */
function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  error?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Field label={label} htmlFor={id} error={error}>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          error={Boolean(error)}
          className="pe-12"
          onChange={(event) => onChange(event.target.value)}
        />

        <IconButton
          label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          variant="ghost"
          size="sm"
          className="absolute end-1.5 top-1/2 -translate-y-1/2"
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </IconButton>
      </div>
    </Field>
  );
}
