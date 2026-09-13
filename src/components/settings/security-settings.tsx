"use client";

import { useId, useState } from "react";
import { Laptop, Smartphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format";

/**
 * The account's locks.
 *
 * Kept to what a merchant can actually act on: the password, the second
 * factor, and the list of places still signed in. Anything that belongs to the
 * workspace rather than the person — API keys, webhook secrets — stays under
 * API & Developer, which is why that one is still its own sidebar row.
 *
 * Signing another session out is destructive from the other device's point of
 * view, so both of those go through the product's `ConfirmDialog` rather than
 * firing on click.
 */

interface Session {
  id: string;
  device: string;
  where: string;
  lastActive: string;
  current: boolean;
  mobile: boolean;
}

/** Replace with `GET /account/sessions`; the shape is already right. */
const SESSIONS: Session[] = [
  {
    id: "ses-1",
    device: "Chrome on Windows",
    where: "Dubai, United Arab Emirates",
    lastActive: new Date(Date.now() - 2 * 60_000).toISOString(),
    current: true,
    mobile: false,
  },
  {
    id: "ses-2",
    device: "Safari on iPhone",
    where: "Dubai, United Arab Emirates",
    lastActive: new Date(Date.now() - 6 * 3_600_000).toISOString(),
    current: false,
    mobile: true,
  },
  {
    id: "ses-3",
    device: "Chrome on macOS",
    where: "London, United Kingdom",
    lastActive: new Date(Date.now() - 4 * 86_400_000).toISOString(),
    current: false,
    mobile: false,
  },
];

export function SecuritySettings() {
  const id = useId();
  const toast = useToast();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);

  const [twoFactor, setTwoFactor] = useState(false);
  const [signOutAll, setSignOutAll] = useState(false);
  const [endSession, setEndSession] = useState<Session | null>(null);

  const tooShort = next.length > 0 && next.length < 12;
  const mismatch = confirm.length > 0 && confirm !== next;
  const invalid =
    current.length === 0 || next.length < 12 || confirm !== next;

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Password"
            description="Twelve characters or more. A passphrase beats a short complicated one."
          />
          <CardBody className="max-w-lg space-y-4">
            <Field label="Current password" htmlFor={`${id}-current`}>
              <Input
                id={`${id}-current`}
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
              />
            </Field>

            <Field
              label="New password"
              htmlFor={`${id}-new`}
              error={touched && tooShort ? "Use at least 12 characters." : undefined}
            >
              <Input
                id={`${id}-new`}
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(event) => setNext(event.target.value)}
                error={touched && tooShort}
              />
            </Field>

            <Field
              label="Confirm new password"
              htmlFor={`${id}-confirm`}
              error={touched && mismatch ? "These do not match." : undefined}
            >
              <Input
                id={`${id}-confirm`}
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                error={touched && mismatch}
              />
            </Field>

            <Button
              onClick={() => {
                setTouched(true);
                if (invalid) return;
                setCurrent("");
                setNext("");
                setConfirm("");
                setTouched(false);
                toast("Password updated", "success");
              }}
            >
              Update password
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Two-factor authentication"
            description="A code from your phone on top of your password."
            action={
              twoFactor ? (
                <Badge tone="success">On</Badge>
              ) : (
                <Badge tone="warning">Off</Badge>
              )
            }
          />
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-text-secondary">
              {twoFactor
                ? "Codes come from your authenticator app. Keep your recovery codes somewhere you can reach without this device."
                : "Without it, a leaked password is enough to read every conversation in this workspace."}
            </p>

            <div className="flex flex-wrap gap-2.5">
              {twoFactor ? (
                <Button
                  variant="outline"
                  size="compact"
                  onClick={() => toast("Recovery codes downloaded", "success")}
                >
                  Recovery codes
                </Button>
              ) : null}
              <Button
                variant={twoFactor ? "outline" : "primary"}
                size="compact"
                onClick={() => {
                  setTwoFactor((value) => !value);
                  toast(
                    twoFactor
                      ? "Two-factor authentication turned off"
                      : "Two-factor authentication turned on",
                    twoFactor ? "info" : "success",
                  );
                }}
              >
                {twoFactor ? "Turn off" : "Turn on"}
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Where you are signed in"
            description="End anything you do not recognise."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSignOutAll(true)}
              >
                Sign out everywhere else
              </Button>
            }
          />
          <CardBody>
            <ul className="divide-y divide-border">
              {SESSIONS.map((session) => {
                const Icon = session.mobile ? Smartphone : Laptop;

                return (
                  <li
                    key={session.id}
                    className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-muted">
                      <Icon className="size-4" aria-hidden />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          {session.device}
                        </span>
                        {session.current ? (
                          <Badge tone="brand">This device</Badge>
                        ) : null}
                      </span>
                      <span className="block truncate text-sm text-text-muted">
                        {session.where} · active{" "}
                        {formatRelativeTime(session.lastActive)}
                      </span>
                    </span>

                    {session.current ? null : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEndSession(session)}
                      >
                        Sign out
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={signOutAll}
        onClose={() => setSignOutAll(false)}
        onConfirm={() => {
          setSignOutAll(false);
          toast("Signed out of every other device", "success");
        }}
        title="Sign out everywhere else?"
        description="You stay signed in on this device."
        confirmLabel="Sign out everywhere else"
        tone="danger"
      >
        <p className="text-sm text-text-secondary">
          Every other browser and phone will have to sign in again. Do this if
          you have lost a device or think somebody else has your password —
          change the password too.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(endSession)}
        onClose={() => setEndSession(null)}
        onConfirm={() => {
          toast(`${endSession?.device} signed out`, "success");
          setEndSession(null);
        }}
        title={`Sign out ${endSession?.device ?? "this device"}?`}
        description="It will need to sign in again."
        confirmLabel="Sign out"
        tone="danger"
      />
    </>
  );
}
