"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2, Upload } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { AvatarPhoto } from "@/components/ui/avatar-photo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { APP_ROUTES } from "@/constants/app";
import { AVATAR_RULES } from "@/constants/settings";
import { MEMBER_STATUS_LABEL } from "@/constants/workspace";
import { CAPABILITIES, SESSION_MODE, removeAvatar, updateProfile, uploadAvatar } from "@/lib/account-service";
import { useAccount } from "@/lib/account-store";
import { formatDate } from "@/lib/format";
import { isValidPhone } from "@/lib/validation";
import { displayName } from "@/types/account";

import { ServiceNotice } from "./service-notice";
import {
  DetailList,
  SaveBar,
  SettingsSection,
  useSaveState,
} from "./settings-section";

/**
 * Profile — the person, as opposed to the workspace.
 *
 * Everything on this page is about whoever is signed in and nobody else. The
 * workspace name, timezone and currency belong to Workspace Settings, and
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
 * Two blocks: the photo, and Your Details.
 *
 * Your Details holds both halves of "who am I here" — the fields you can change
 * on top, and what the workspace has granted you below a rule. They are one
 * card because they are one answer; the read-only half was briefly a third card
 * at the bottom of the page, which is where the eye stops going.
 *
 * The visual difference between the halves is deliberate and does the work no
 * sentence would: real inputs above, a description list below. A row of greyed
 * fields would say "you could edit this, but not now" and send somebody hunting
 * for the unlock.
 *
 * Last-active and the user id are not here. Both are somebody else's view of
 * you rather than something you manage, and the Team directory already shows
 * them next to everyone else's for comparison, which is the only context in
 * which either means anything.
 */

export function ProfileSettings() {
  const user = useAccount();

  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your personal account information."
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
      /* Named precisely rather than generously. The dashboard header and the
         overview greeting are the two places that read this record, and both
         re-render from it the moment it changes. Promising the inbox and
         assignment lists as well would be a promise about other people's rows,
         which carry contacts and agents rather than you. */
      description="Shown beside your name in the dashboard header and on your overview."
      bodyClassName="flex flex-wrap items-center gap-5"
    >
      {/* `AvatarPhoto`, like the header chip and the account menu: this is the
          one photo in the product that is *supplied* rather than fixtured — an
          upload, or a path the account service last returned — so it is the one
          that can stop resolving. Plain `Avatar` would render the broken-image
          glyph; this falls back to the initials it would have shown anyway. */}
      <AvatarPhoto name={displayName(user)} src={user.avatarUrl} size="lg" />

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

      <AccountInformation />
    </SettingsSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Account information                                                        */
/* -------------------------------------------------------------------------- */

/**
 * What the workspace has decided about you, inside the same card.
 *
 * It sits below the editable fields, behind a rule and under its own heading,
 * rather than in a card of its own at the bottom of the page. Two reasons.
 * These *are* your details — the same card should answer "who am I here" in
 * full — and a separate card of read-only facts at the end of a settings page
 * is where the eye stops going.
 *
 * A description list, not disabled inputs. A greyed-out field says "you could
 * edit this, but not now" and sends somebody hunting for the unlock; a role
 * granted by an owner and a joined date are not things anybody edits, and
 * dressing them as fields invites the question. That contrast — real inputs
 * above, plain facts below — is what makes the boundary legible without a
 * sentence explaining it.
 *
 * Role carries the link to the screen that governs it, because "how do I change
 * this?" is the one question this block does provoke.
 */
function AccountInformation() {
  const user = useAccount();

  return (
    <div className="space-y-3 border-t border-border pt-5">
      <div>
        <h3 className="text-sm font-semibold text-text-primary">
          Account information
        </h3>
        <p className="mt-0.5 text-sm text-text-muted">
          Granted by the workspace. Not editable here.
        </p>
      </div>

      <DetailList
        columns={2}
        items={[
          {
            label: "Role",
            value: (
              <span className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">{user.roleName}</Badge>
                <Link
                  href={APP_ROUTES.workspaceTeam}
                  className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
                >
                  Team and roles
                </Link>
              </span>
            ),
          },
          { label: "Workspace", value: user.workspaceName },
          {
            label: "Status",
            value: (
              <Badge tone={user.status === "active" ? "success" : "warning"}>
                {MEMBER_STATUS_LABEL[user.status]}
              </Badge>
            ),
          },
          {
            label: "Joined",
            value: user.joinedAt
              ? formatDate(user.joinedAt)
              : "Invitation not yet accepted",
          },
        ]}
      />
    </div>
  );
}

