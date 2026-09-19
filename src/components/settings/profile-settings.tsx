"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { APP_ROUTES } from "@/constants/app";
import { AVATAR_RULES, PROFILE_LANGUAGES } from "@/constants/settings";
import { isValidPhone } from "@/lib/validation";
import {
  fullNameOf,
  setAccountAvatar,
  updateAccountProfile,
  useAccountAvatar,
  useAccountProfile,
} from "@/lib/settings-store";
import { CURRENT_MEMBER, roleName } from "@/lib/workspace-fixtures";

import { ServiceNotice } from "./service-notice";

/**
 * The signed-in person, as opposed to the workspace.
 *
 * Reads and writes `lib/settings-store` rather than holding its own
 * `useState`. That is not a refactor for tidiness: Settings is a tab strip
 * that unmounts the panel you leave, so every edit made here used to be
 * discarded on the way to Notifications while a toast said "Profile saved".
 *
 * Two things here deliberately do not work, and say so instead of pretending:
 * the email address, which is the account's identity and cannot be changed
 * without a verification round-trip, and the role, which only an owner can
 * grant. The old panel had a "Request a change" button for the second one that
 * raised a toast and notified nobody.
 */

export function ProfileSettings() {
  const id = useId();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const saved = useAccountProfile();
  const avatar = useAccountAvatar();

  /* The form is a draft over the store: typing should not re-render every
     surface reading the profile, and Cancel has to have something to go back
     to. Save is the commit. */
  const [draft, setDraft] = useState(saved);
  const [touched, setTouched] = useState(false);

  const patch = (next: Partial<typeof draft>) =>
    setDraft((current) => ({ ...current, ...next }));

  const phoneError =
    draft.phone.trim() && !isValidPhone(draft.phone)
      ? "Enter a valid phone number, or leave it empty."
      : undefined;

  const dirty =
    draft.firstName !== saved.firstName ||
    draft.lastName !== saved.lastName ||
    draft.phone !== saved.phone ||
    draft.jobTitle !== saved.jobTitle ||
    draft.language !== saved.language;

  const nameError =
    touched && !draft.firstName.trim() ? "Enter your first name." : undefined;

  function save() {
    setTouched(true);
    if (!draft.firstName.trim() || phoneError) return;

    updateAccountProfile({
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      phone: draft.phone.trim(),
      jobTitle: draft.jobTitle.trim(),
      language: draft.language,
    });
    setTouched(false);
    toast("Profile updated", "success");
  }

  function pickPhoto(file: File | undefined) {
    if (!file) return;

    if (!AVATAR_RULES.accept.includes(file.type)) {
      toast("Choose a PNG, JPG or WebP image", "error");
      return;
    }
    if (file.size > AVATAR_RULES.maxBytes) {
      toast("That image is over 2 MB", "error");
      return;
    }

    setAccountAvatar(URL.createObjectURL(file));
    toast("Photo updated", "success");
  }

  return (
    <div className="space-y-6">
      <ServiceNotice tone="session" title="Signed in as a demo account">
        There is no account service connected yet, so what you change here is
        kept for this browser session and starts fresh on reload. The details
        are seeded from {CURRENT_MEMBER.name}, the same record the Team table
        and the activity log read.
      </ServiceNotice>

      <Card>
        <CardHeader
          title="Your photo"
          description="Shown beside your name in the inbox, on assignments and in activity logs."
        />
        <CardBody className="flex flex-wrap items-center gap-4">
          <Avatar name={fullNameOf(draft)} src={avatar ?? undefined} size="lg" />

          <div className="flex flex-wrap gap-2.5">
            {/* The input is the control; the button is its label. A styled
                `<label for>` would work too, but this keeps the focus ring and
                the keyboard behaviour the rest of the product's buttons have. */}
            <input
              ref={fileInput}
              type="file"
              className="sr-only"
              accept={AVATAR_RULES.accept.join(",")}
              onChange={(event) => {
                pickPhoto(event.target.files?.[0]);
                /* Clearing it means picking the same file twice still fires. */
                event.target.value = "";
              }}
            />
            <Button
              variant="outline"
              size="compact"
              onClick={() => fileInput.current?.click()}
            >
              {avatar ? "Replace photo" : "Upload photo"}
            </Button>

            {avatar ? (
              <Button
                variant="ghost"
                size="compact"
                onClick={() => {
                  setAccountAvatar(null);
                  toast("Photo removed", "info");
                }}
              >
                Remove
              </Button>
            ) : null}
          </div>

          <p className="w-full text-sm text-text-muted">{AVATAR_RULES.hint}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Your details"
          description="How you appear to the rest of the workspace."
        />
        <CardBody className="max-w-lg space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor={`${id}-first`} error={nameError}>
              <Input
                id={`${id}-first`}
                value={draft.firstName}
                error={Boolean(nameError)}
                onChange={(event) => patch({ firstName: event.target.value })}
              />
            </Field>

            <Field label="Last name" htmlFor={`${id}-last`}>
              <Input
                id={`${id}-last`}
                value={draft.lastName}
                onChange={(event) => patch({ lastName: event.target.value })}
              />
            </Field>
          </div>

          {/*
            Read-only, not disabled-with-a-button.

            The sign-in address is the account's identity. Letting the field
            accept a new one would change who the dashboard says you are
            without anything having checked that you can receive mail there,
            and a "Change email" button that opens a dialog explaining the
            verification cannot be sent is a dead control with extra steps.
          */}
          <Field
            label="Email address"
            htmlFor={`${id}-email`}
            hint="Used to sign in. Changing it needs email verification, which arrives with the account service."
          >
            <Input
              id={`${id}-email`}
              type="email"
              value={saved.email}
              readOnly
              className="cursor-not-allowed bg-surface-secondary text-text-secondary"
            />
          </Field>

          <Field
            label="Phone"
            htmlFor={`${id}-phone`}
            hint="Optional. Where a support agent would reach you."
            error={phoneError}
          >
            <Input
              id={`${id}-phone`}
              type="tel"
              value={draft.phone}
              error={Boolean(phoneError)}
              onChange={(event) => patch({ phone: event.target.value })}
            />
          </Field>

          <Field label="Job title" htmlFor={`${id}-title`}>
            <Input
              id={`${id}-title`}
              value={draft.jobTitle}
              onChange={(event) => patch({ jobTitle: event.target.value })}
            />
          </Field>

          <Field
            label="Language"
            htmlFor={`${id}-language`}
            hint="Changes the dashboard only — it does not affect what you send."
          >
            <Select
              id={`${id}-language`}
              hideLabel={false}
              label="Language"
              value={draft.language}
              onChange={(value) => patch({ language: value })}
              options={PROFILE_LANGUAGES}
            />
          </Field>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button onClick={save} disabled={!dirty}>
              Save changes
            </Button>

            {dirty ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setDraft(saved);
                  setTouched(false);
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Role"
          description="What you can reach in this workspace."
          action={<Badge tone="brand">{roleName(CURRENT_MEMBER.roleId)}</Badge>}
        />
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-text-secondary">
            Roles are granted by an owner, not requested here. Team and roles
            has the full permission matrix and who else holds which role.
          </p>

          <Link
            href={APP_ROUTES.workspaceTeam}
            className={buttonVariants({ variant: "outline", size: "compact" })}
          >
            Team and roles
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
