"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { Check, Laptop, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { ServiceNotice } from "./service-notice";

/**
 * The account's locks — and, where there is no lock yet, a clear statement of
 * that rather than a picture of one.
 *
 * This panel is a rewrite rather than a polish, because what it showed was not
 * true. It offered a Turn on button for two-factor authentication that flipped
 * a `useState` boolean and toasted "Two-factor authentication turned on"; a
 * Recovery codes button that downloaded nothing; and a list of three signed-in
 * devices in Dubai and London, invented in a module-level array, each with a
 * Sign out button that raised a toast and ended no session.
 *
 * A merchant reading that screen would conclude their workspace had a second
 * factor on it. It does not, and cannot: enabling TOTP means a server minting
 * a shared secret, storing it against the account and verifying a code against
 * it, and there is no server — `env.apiBaseUrl` falls back to `/api`, there
 * are no route handlers, and nothing dispatches `setCredentials`. Of every
 * false state in this product, that one has the highest cost, because it is
 * the one someone relies on by doing nothing.
 *
 * So: the password form keeps its validation, which is genuinely client-side
 * and genuinely useful, and stops at the submit. Two-factor explains itself
 * and offers no switch. The session list shows the one session that can be
 * observed from here — this browser — and says why it is the only one.
 */

/* -------------------------------------------------------------------------- */
/* Password strength                                                          */
/* -------------------------------------------------------------------------- */

const MIN_LENGTH = 12;

interface Rule {
  label: string;
  test: (value: string) => boolean;
}

/**
 * Four rules, each one a thing the reader can act on.
 *
 * Length first and weighted hardest, because it is the only one that reliably
 * matters. The character-class rules are here because people expect them and
 * they do no harm, not because "at least one symbol" is what makes a
 * passphrase hard to guess.
 */
const RULES: Rule[] = [
  { label: `At least ${MIN_LENGTH} characters`, test: (v) => v.length >= MIN_LENGTH },
  { label: "An upper and a lower case letter", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: "A number", test: (v) => /\d/.test(v) },
  { label: "A symbol", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const STRENGTH = [
  { label: "Too short", tone: "bg-error" },
  { label: "Weak", tone: "bg-error" },
  { label: "Fair", tone: "bg-warning" },
  { label: "Good", tone: "bg-info" },
  { label: "Strong", tone: "bg-success" },
];

/* -------------------------------------------------------------------------- */
/* This browser                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The current browser and platform, read from the user agent.
 *
 * Coarse on purpose. The point is "this is the device you are reading on", not
 * a forensic fingerprint, and a long parser here would be a lot of regex
 * standing in for a field the auth service will send once it exists.
 */
function describeBrowser(): string {
  const ua = navigator.userAgent;

  const browser =
    /Edg\//.test(ua) ? "Edge"
    : /OPR\//.test(ua) ? "Opera"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari"
    : "This browser";

  const platform =
    /Windows/.test(ua) ? "Windows"
    : /Android/.test(ua) ? "Android"
    : /iPhone|iPad/.test(ua) ? "iOS"
    : /Mac OS X/.test(ua) ? "macOS"
    : /Linux/.test(ua) ? "Linux"
    : null;

  return platform ? `${browser} on ${platform}` : browser;
}

/** Never fires: a user agent is fixed for the life of the document. */
const NO_SUBSCRIBE = () => () => {};

/** What the server renders, before any browser is known. */
const SERVER_SNAPSHOT = () => "This browser";

/* -------------------------------------------------------------------------- */

export function SecuritySettings() {
  const id = useId();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  /*
   * `navigator` does not exist during the server render, and reading it
   * inline would hydrate to different text than the server produced.
   *
   * `useSyncExternalStore` is the shape for that: a value that exists on the
   * client and not on the server, with an explicit server snapshot. The
   * subscribe function returns an unsubscribe and never fires, because a user
   * agent does not change while the page is open. Reading it in an effect
   * would work too, and is a setState in an effect body — a cascading render
   * for a string that was available the moment the client took over.
   */
  const browser = useSyncExternalStore(NO_SUBSCRIBE, describeBrowser, SERVER_SNAPSHOT);

  const passed = RULES.filter((rule) => rule.test(next)).length;
  const score = next.length === 0 ? 0 : next.length < MIN_LENGTH ? Math.min(passed, 1) : passed;
  const strength = STRENGTH[score] ?? STRENGTH[0];

  const mismatch = confirm.length > 0 && confirm !== next;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Password"
          description="A passphrase of four unrelated words beats a short complicated one."
        />
        <CardBody className="max-w-lg space-y-4">
          <ServiceNotice tone="security" title="Passwords cannot be changed yet">
            Changing a password means a server verifying the current one and
            storing a new hash. There is no account service connected, so this
            form validates what you type and stops there — nothing is sent, and
            your password is unchanged.
          </ServiceNotice>

          <Field label="Current password" htmlFor={`${id}-current`}>
            <Input
              id={`${id}-current`}
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
          </Field>

          <Field label="New password" htmlFor={`${id}-new`}>
            <Input
              id={`${id}-new`}
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(event) => setNext(event.target.value)}
            />
          </Field>

          {next.length > 0 ? (
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-text-secondary">
                  Password strength
                </p>
                <p className="text-sm font-bold text-text-primary">
                  {strength.label}
                </p>
              </div>

              <ProgressBar
                value={(score / RULES.length) * 100}
                label="Password strength"
                tone={strength.tone}
                size="sm"
              />

              <ul className="space-y-1.5">
                {RULES.map((rule) => {
                  const ok = rule.test(next);
                  const Icon = ok ? Check : X;

                  return (
                    <li
                      key={rule.label}
                      className={cn(
                        "flex items-center gap-2 text-sm font-medium",
                        ok ? "text-success-text" : "text-text-muted",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <Field
            label="Confirm new password"
            htmlFor={`${id}-confirm`}
            error={mismatch ? "These do not match." : undefined}
          >
            <Input
              id={`${id}-confirm`}
              type="password"
              autoComplete="new-password"
              value={confirm}
              error={mismatch}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </Field>

          {/* Disabled rather than absent: the form is the architecture this
              screen will keep, and a button that is visibly unavailable says
              more about why than a missing one does. */}
          <Button disabled title="Available once the account service is connected">
            Update password
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Two-factor authentication"
          description="A code from your phone on top of your password."
          action={<Badge tone="warning">Not set up</Badge>}
        />
        <CardBody className="space-y-4">
          <p className="max-w-2xl text-sm text-text-secondary">
            Without a second factor, a leaked password is enough to read every
            conversation in this workspace. It is the single highest-value
            control on this page, which is why there is no switch here
            pretending to be one.
          </p>

          <ServiceNotice
            tone="security"
            title="Two-factor authentication is not available"
          >
            Turning it on means a server generating a shared secret, storing it
            against your account and checking a code against it on every sign
            in. None of that can happen in the browser, so there is no setup
            flow, no QR code and no recovery codes here — recovery codes that
            unlock nothing are worse than none, because they get saved and
            trusted.
          </ServiceNotice>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Where you are signed in"
          description="Sessions this workspace can see."
        />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-panel border border-border bg-surface-secondary px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-btn bg-surface text-text-muted">
              <Laptop className="size-4" aria-hidden />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">
                  {browser}
                </span>
                <Badge tone="brand" size="sm">
                  This device
                </Badge>
              </span>
              <span className="block text-sm text-text-muted">
                The session you are reading this in.
              </span>
            </span>
          </div>

          <ServiceNotice title="Other sessions cannot be listed">
            A device list comes from the server that issued the tokens. This
            page previously showed three invented devices with Sign out buttons
            that ended nothing — so it now shows the one session it can
            actually observe, and no controls it cannot honour.
          </ServiceNotice>
        </CardBody>
      </Card>
    </div>
  );
}
