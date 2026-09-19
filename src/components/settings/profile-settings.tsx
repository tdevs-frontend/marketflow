"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2, Upload } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { APP_ROUTES } from "@/constants/app";
import { AVATAR_RULES } from "@/constants/settings";
import { CAPABILITIES, SESSION_MODE, removeAvatar, updateProfile, uploadAvatar } from "@/lib/account-service";
import { useAccount } from "@/lib/account-store";
import { isValidPhone } from "@/lib/validation";
import { displayName } from "@/types/account";

import { ServiceNotice } from "./service-notice";
import {
  SaveBar,
  SettingsSection,
  useSaveState,
} from "./settings-section";

/**
 * Profile — the person, as opposed to the workspace.
 *
 * Everything on this page is about whoever is signed in and nobody else. The
 * workspace name, timezone and currency are one route away under General, and
 * keeping the two apart is what makes either page answerable at a glance:
 * *who am I* here, *what is this workspace* there.
 *
 * The user is real. It is `CURRENT_MEMBER` — the person the Team table marks as
 * you, the one the audit trail attributes changes to, the owner named in
 * Workspace Settings — reached through `lib/account-service`. This page used to
 * greet everybody as "Guest User" with a made-up role, because it read
 * `auth.user`, which is `null` and always has been: there are no route handlers
 * under `app/`, no server actions, and nothing that ever dispatches
 * `setCredentials`. Five screens agreed on who was signed in and one did not,
 * so the one changed.
 *
 * Two blocks: the photo, and the details. Both are things you can change.
 *
 * There was a third — an "Account information" panel listing workspace, role,
 * account status, joined date, last active and user id as read-only facts — and
 * it is gone. Every one of those either already appears where it is actually
 * used or answers a question nobody asks on this page: role is on the details
 * form beside Job title, where the contrast between the two is the point;
 * workspace and status are the same for the whole team and belong to Workspace
 * Settings; a joined date and a last-active time are somebody else's view of
 * you, which is the Team directory's job. A settings page earns its length by
 * being editable, and a panel of facts at the bottom of it is where the eye
 * stops going.
 */

export function ProfileSettings() {
  const user = useAccount();

  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your personal information and account details."
      />

      <div className="space-y-6">
        {SESSION_MODE ? (
          <ServiceNotice tone="session" title="Changes are kept for this session">
            No account service is connected yet, so what you save here lives in
            this browser tab and starts fresh on reload. Your details are read
            from {user.email} — the same record the team directory and the
            activity log use.
          </ServiceNotice>
        ) : null}

        <ProfilePhoto />
        <YourDetails />
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Photo                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The photo, with the upload's real states.
 *
 * "Uploading…" is shown while the call is in flight and "Photo updated" once it
 * resolves, because those are the two moments a person needs told apart. The
 * file is validated before anything is sent — type and size — so the common
 * rejection happens instantly and locally rather than after a wait.
 */
function ProfilePhoto() {
  const user = useAccount();
  const input = useRef<HTMLInputElement>(null);
  const { state, run, setError, reset } = useSaveState();

  /* Which operation the receipt belongs to. Both resolve into the same `saved`
     state, and "Photo updated" after a removal is a small lie of the kind that
     accumulates into a screen nobody reads. */
  const [action, setAction] = useState<"upload" | "remove">("upload");

  const busy = state.status === "saving";

  function choose(file: File | undefined) {
    if (!file) return;

    if (!AVATAR_RULES.accept.includes(file.type)) {
      setError("Choose a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > AVATAR_RULES.maxBytes) {
      setError("That image is over 2 MB. Choose a smaller one.");
      return;
    }

    setAction("upload");
    void run(() => uploadAvatar(file));
  }

  return (
    <SettingsSection
      title="Profile photo"
      description="Shown beside your name in the inbox, on assignments and in activity logs."
      bodyClassName="flex flex-wrap items-center gap-5"
    >
      <Avatar
        name={displayName(user)}
        src={user.avatarUrl ?? undefined}
        size="lg"
      />

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap gap-2.5">
          {/* The input is the control and the button is its label. A styled
              `<label for>` would work too; this keeps the focus ring and the
              keyboard behaviour every other button in the product has. */}
          <input
            ref={input}
            type="file"
            className="sr-only"
            accept={AVATAR_RULES.accept.join(",")}
            disabled={!CAPABILITIES.avatar || busy}
            onChange={(event) => {
              choose(event.target.files?.[0]);
              /* Cleared so picking the same file twice still fires a change. */
              event.target.value = "";
            }}
          />

          <Button
            variant="outline"
            size="compact"
            disabled={!CAPABILITIES.avatar || busy}
            aria-busy={busy || undefined}
            onClick={() => {
              reset();
              input.current?.click();
            }}
          >
            {busy ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Upload aria-hidden />
            )}
            {busy
              ? "Uploading…"
              : user.avatarUrl
                ? "Change photo"
                : "Upload photo"}
          </Button>

          {user.avatarUrl ? (
            <Button
              variant="ghost"
              size="compact"
              disabled={busy}
              onClick={() => {
                setAction("remove");
                void run(removeAvatar);
              }}
            >
              <Trash2 aria-hidden />
              Remove
            </Button>
          ) : null}
        </div>

        <p role="status" aria-live="polite" className="text-sm text-text-muted">
          {state.status === "error" ? (
            <span className="font-medium text-error-text">{state.message}</span>
          ) : state.status === "saved" ? (
            <span className="font-medium text-success-text">
              {action === "remove" ? "Photo removed." : "Photo updated."}
            </span>
          ) : (
            AVATAR_RULES.hint
          )}
        </p>
      </div>
    </SettingsSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Editable details                                                           */
/* -------------------------------------------------------------------------- */

function YourDetails() {
  const id = useId();
  const user = useAccount();
  const { state, run, setError } = useSaveState();

  /* A draft over the store rather than a second source of truth: typing should
     not re-render the dashboard header on every keystroke, and Cancel needs
     something to go back to. Save is the commit. */
  const [draft, setDraft] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    jobTitle: user.jobTitle,
  });
  const [touched, setTouched] = useState(false);

  const patch = (next: Partial<typeof draft>) =>
    setDraft((current) => ({ ...current, ...next }));

  const nameError =
    touched && !draft.firstName.trim() ? "Enter your first name." : undefined;

  const phoneError =
    draft.phone.trim() && !isValidPhone(draft.phone)
      ? "Enter a valid phone number, or leave it empty."
      : undefined;

  const dirty =
    draft.firstName !== user.firstName ||
    draft.lastName !== user.lastName ||
    draft.phone !== user.phone ||
    draft.jobTitle !== user.jobTitle;

  function save() {
    setTouched(true);

    if (!draft.firstName.trim()) {
      setError("Enter your first name.");
      return;
    }
    if (phoneError) {
      setError(phoneError);
      return;
    }

    void run(async () => {
      const result = await updateProfile(draft);
      if (result.ok) {
        setDraft({
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          phone: result.data.phone,
          jobTitle: result.data.jobTitle,
        });
        setTouched(false);
      }
      return result;
    });
  }

  return (
    <SettingsSection
      title="Your details"
      description="How you appear to the rest of the workspace."
      bodyClassName="max-w-2xl space-y-4"
      footer={
        <SaveBar
          state={state}
          dirty={dirty}
          disabled={!CAPABILITIES.profile}
          onSave={save}
          onCancel={() => {
            setDraft({
              firstName: user.firstName,
              lastName: user.lastName,
              phone: user.phone,
              jobTitle: user.jobTitle,
            });
            setTouched(false);
          }}
        />
      }
    >
      {/* Two columns from `sm` up, stacked below it. Every pair here is two
          halves of one fact — a first and last name, a way to reach you — so
          they sit on one line where there is room for one. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor={`${id}-first`} error={nameError}>
          <Input
            id={`${id}-first`}
            autoComplete="given-name"
            value={draft.firstName}
            error={Boolean(nameError)}
            onChange={(event) => patch({ firstName: event.target.value })}
          />
        </Field>

        <Field label="Last name" htmlFor={`${id}-last`}>
          <Input
            id={`${id}-last`}
            autoComplete="family-name"
            value={draft.lastName}
            onChange={(event) => patch({ lastName: event.target.value })}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/*
          Read-only, not disabled-with-a-button.

          The sign-in address is the account's identity. A field that accepted a
          new one would change who the dashboard says you are without anything
          having checked that you can receive mail there, and a "Change email"
          button opening a dialog that explains the verification cannot be sent
          is a dead control with extra steps.
        */}
        <Field
          label="Email address"
          htmlFor={`${id}-email`}
          hint="Used to sign in. Changing it needs email verification."
        >
          <Input
            id={`${id}-email`}
            type="email"
            value={user.email}
            readOnly
            aria-readonly
            className="cursor-not-allowed bg-surface-secondary text-text-secondary"
          />
        </Field>

        <Field
          label="Phone number"
          htmlFor={`${id}-phone`}
          error={phoneError}
          hint="Optional. Where a support agent would reach you."
        >
          <Input
            id={`${id}-phone`}
            type="tel"
            autoComplete="tel"
            value={draft.phone}
            error={Boolean(phoneError)}
            onChange={(event) => patch({ phone: event.target.value })}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Job title"
          htmlFor={`${id}-title`}
          hint="Free text. Shown in the team directory."
        >
          <Input
            id={`${id}-title`}
            autoComplete="organization-title"
            value={draft.jobTitle}
            onChange={(event) => patch({ jobTitle: event.target.value })}
          />
        </Field>

        {/*
          Role sits beside Job title on purpose, as the pairing the spec asks
          for — and it is deliberately not a field. Job title is what you call
          yourself; role is what you are allowed to do, and only an owner
          grants it. Rendering it as a badge with the route that governs it
          makes the difference visible without a sentence explaining it.
        */}
        <div className="space-y-1.5">
          <p className="block text-sm font-bold text-text-secondary">Role</p>
          <div className="flex h-11 items-center gap-2.5">
            <Badge tone="brand">{user.roleName}</Badge>
            <Link
              href={APP_ROUTES.workspaceTeam}
              className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
            >
              Team and roles
            </Link>
          </div>
          <p className="text-sm font-medium text-text-muted">
            Granted by a workspace owner, not requested here.
          </p>
        </div>
      </div>
    </SettingsSection>
  );
}

