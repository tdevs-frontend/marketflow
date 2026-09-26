"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Mail } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { isValidEmail } from "@/lib/validation";
import {
  SEAT_LIMIT,
  WORKSPACE_ROLES,
  grantCount,
  memberTotals,
  permissionsLost,
  roleById,
  roleName,
} from "@/lib/workspace-fixtures";
import type { WorkspaceMember } from "@/types/workspace";

/**
 * Inviting, re-roling and removing a member.
 *
 * Every one of these is a permission change in disguise, so each says what it
 * will actually do before it does it - the role change lists what the member
 * loses, and the removal lists what they own. Both are computed from the data
 * rather than written as copy, which is the only way they stay true.
 */

const ROLE_OPTIONS = WORKSPACE_ROLES.map((role) => ({
  value: role.id,
  label: role.name,
  hint: role.description,
}));

/* -------------------------------------------------------------------------- */
/* Invite                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The invite form.
 *
 * Validation is specific by design. "Something went wrong" on an invitation is
 * the worst possible error, because every cause has a different fix: a typo, a
 * person who is already here, an invitation already in flight, or a plan that
 * has run out of seats. Each gets its own sentence.
 *
 * State is mount-scoped - the caller renders this only while it is open - so a
 * cancelled invitation leaves nothing behind for the next one.
 */
export function InviteMemberDialog({
  open,
  onClose,
  members,
  onInvite,
}: {
  open: boolean;
  onClose: () => void;
  members: WorkspaceMember[];
  onInvite: (input: { email: string; roleId: string; message: string }) => void;
}) {
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("role_sales");
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState(false);

  const totals = memberTotals(members);
  const seatsLeft = totals.seatLimit - totals.seatsUsed;

  const error = useMemo(() => {
    const value = email.trim().toLowerCase();
    if (!value) return "Enter the email address to invite.";
    if (!isValidEmail(value)) return "That does not look like a valid email address.";

    const existing = members.find(
      (member) => member.email.toLowerCase() === value,
    );
    if (existing?.status === "invited") {
      return `${existing.name} already has an invitation pending. Resend it from the members table instead.`;
    }
    if (existing?.status === "suspended") {
      return `${existing.name} is already in this workspace but suspended. Reactivate them instead of inviting again.`;
    }
    if (existing) {
      return `${existing.name} is already a member of this workspace.`;
    }
    if (seatsLeft <= 0) {
      return `All ${SEAT_LIMIT} seats on your plan are in use. Remove a member or upgrade before inviting.`;
    }
    return null;
  }, [email, members, seatsLeft]);

  const role = roleById(roleId);

  function submit() {
    setTouched(true);
    if (error) return;
    onInvite({ email: email.trim().toLowerCase(), roleId, message: message.trim() });
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Invite member"
      description="They receive an email with a link to join this workspace."
      footer={
        <>
          <Button variant="cancel" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button size="compact" onClick={submit}>
            <Mail aria-hidden />
            Send Invite
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label="Email address"
          htmlFor="invite-email"
          hint="They will be asked to set a password when they accept."
          error={touched ? (error ?? undefined) : undefined}
        >
          <Input
            id="invite-email"
            type="email"
            value={email}
            error={touched && Boolean(error)}
            autoComplete="off"
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>

        <Field
          label="Role"
          htmlFor="invite-role"
          hint="You can change this at any time after they join."
        >
          <Select
            id="invite-role"
            label="Role"
            hideLabel={false}
            value={roleId}
            onChange={setRoleId}
            options={ROLE_OPTIONS}
          />
        </Field>

        {role ? (
          <p className="rounded-panel border border-border bg-surface-secondary px-3.5 py-3 text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">{role.name}</span> grants{" "}
            {grantCount(role.grants)} permissions across{" "}
            {Object.keys(role.grants).length} areas of the workspace.
          </p>
        ) : null}

        <Field
          label="Message (optional)"
          htmlFor="invite-message"
          hint="Included in the invitation email."
        >
          <Textarea
            id="invite-message"
            value={message}
            maxLength={280}
            onChange={(event) => setMessage(event.target.value)}
          />
        </Field>

        <p className="text-meta font-medium text-text-muted">
          {seatsLeft > 0
            ? `${seatsLeft} of ${SEAT_LIMIT} seats remaining on your plan.`
            : `All ${SEAT_LIMIT} seats are in use.`}
        </p>
      </div>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Change role                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Moving someone between roles.
 *
 * The panel that matters is the one listing what they lose. A merchant moving a
 * Marketing Manager to Viewer is usually thinking "less access" in the
 * abstract; naming the four things that stop working is what turns that into an
 * informed decision. It is computed by differencing the two grant maps, so it
 * cannot drift from the roles themselves.
 */
export function ChangeRoleDialog({
  member,
  open,
  onClose,
  onConfirm,
}: {
  member: WorkspaceMember | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (member: WorkspaceMember, roleId: string) => void;
}) {
  const [roleId, setRoleId] = useState(member?.roleId ?? "role_viewer");

  const lost = useMemo(
    () => (member && roleId !== member.roleId ? permissionsLost(member.roleId, roleId) : []),
    [member, roleId],
  );

  if (!member) return null;

  const changed = roleId !== member.roleId;
  const owner = member.roleId === "role_owner";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Change role for ${member.name}`}
      description={member.email}
      footer={
        <>
          <Button variant="cancel" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="compact"
            disabled={!changed || owner}
            onClick={() => {
              onConfirm(member, roleId);
              onClose();
            }}
          >
            Confirm Role Change
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/*
         * The Owner cannot be re-roled from here.
         *
         * Demoting the only Owner would leave a workspace nobody can administer,
         * and handing ownership to someone else is a different decision with
         * different consequences - it belongs in its own explicit flow.
         */}
        {owner ? (
          <p className="flex items-start gap-2.5 rounded-panel border border-warning-soft bg-warning-soft px-3.5 py-3 text-sm text-warning-text">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            The Owner role cannot be changed here. Transferring ownership is a
            separate step, so a workspace is never left without an owner by
            accident.
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 rounded-panel border border-border px-3.5 py-3">
            <p className="text-meta font-medium text-text-muted">Current role</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-text-primary">
              {roleName(member.roleId)}
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-text-muted" aria-hidden />
          <div className="min-w-0 flex-1 rounded-panel border border-primary bg-primary-soft px-3.5 py-3">
            <p className="text-meta font-medium text-primary-dark">New role</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-primary-dark">
              {roleName(roleId)}
            </p>
          </div>
        </div>

        <Field label="New role" htmlFor="change-role">
          <Select
            id="change-role"
            label="New role"
            hideLabel={false}
            value={roleId}
            onChange={setRoleId}
            disabled={owner}
            options={ROLE_OPTIONS.filter((option) => option.value !== "role_owner")}
          />
        </Field>

        {changed && lost.length > 0 ? (
          <div className="rounded-panel border border-warning-soft bg-warning-soft px-3.5 py-3">
            <p className="text-sm font-semibold text-warning-text">
              Changing {member.name.split(" ")[0]} to {roleName(roleId)} will
              remove:
            </p>
            <ul className="mt-2 space-y-1">
              {lost.slice(0, 8).map((line) => (
                <li key={line} className="text-sm text-warning-text">
                  • {line}
                </li>
              ))}
            </ul>
            {lost.length > 8 ? (
              <p className="mt-2 text-meta text-warning-text">
                …and {lost.length - 8} more.
              </p>
            ) : null}
          </div>
        ) : null}

        {changed && lost.length === 0 ? (
          <p className="rounded-panel border border-success-soft bg-success-soft px-3.5 py-3 text-sm text-success-text">
            {roleName(roleId)} keeps everything {member.name.split(" ")[0]} can
            already do and adds to it. Nothing will stop working.
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Remove                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Removing a member, and deciding what happens to their work.
 *
 * The reassignment select is the point of this dialog. A member who owns
 * thirty-four leads cannot simply be deleted - those records would be
 * ownerless, which in practice means invisible to every list filtered by owner.
 * So the dialog counts what they hold and insists on a destination.
 */
export function RemoveMemberDialog({
  member,
  members,
  open,
  onClose,
  onConfirm,
}: {
  member: WorkspaceMember | null;
  members: WorkspaceMember[];
  open: boolean;
  onClose: () => void;
  onConfirm: (member: WorkspaceMember, reassignToId: string | null) => void;
}) {
  const [reassignTo, setReassignTo] = useState("");

  if (!member) return null;

  const owned = [
    { label: "leads", count: member.ownership.leads },
    { label: "campaigns", count: member.ownership.campaigns },
    { label: "workflows", count: member.ownership.workflows },
    { label: "contacts", count: member.ownership.contacts },
  ].filter((row) => row.count > 0);

  const needsReassign = owned.length > 0;

  const candidates = members.filter(
    (candidate) =>
      candidate.id !== member.id &&
      candidate.status === "active",
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Remove ${member.name} from this workspace?`}
      description={
        needsReassign
          ? "Decide where their work goes before they are removed."
          : "They lose access immediately."
      }
      footer={
        <>
          <Button variant="cancel" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="compact"
            disabled={needsReassign && !reassignTo}
            onClick={() => {
              onConfirm(member, reassignTo || null);
              onClose();
            }}
          >
            Remove Member
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {needsReassign ? (
          <>
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">
                {member.name}
              </span>{" "}
              currently owns:
            </p>

            <ul className="space-y-1.5">
              {owned.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between gap-3 rounded-panel bg-surface-secondary px-3 py-2"
                >
                  <span className="text-sm font-medium text-text-primary capitalize">
                    {row.label}
                  </span>
                  <span className="text-sm font-bold text-text-primary tabular-nums">
                    {row.count}
                  </span>
                </li>
              ))}
            </ul>

            <Field
              label="Reassign owned resources to"
              htmlFor="reassign-to"
              hint="Required. Unowned records disappear from every list filtered by owner."
            >
              <Select
                id="reassign-to"
                label="Reassign owned resources to"
                hideLabel={false}
                value={reassignTo}
                onChange={setReassignTo}
                options={candidates.map((candidate) => ({
                  value: candidate.id,
                  label: candidate.name,
                  hint: roleName(candidate.roleId),
                }))}
              />
            </Field>
          </>
        ) : (
          <p className="text-sm text-text-secondary">
            {member.name} does not own any leads, campaigns or workflows, so
            nothing needs reassigning.
          </p>
        )}

        <p className="text-sm text-text-secondary">
          Their audit history is kept - removing someone does not erase what they
          did. You can invite them again later.
        </p>
      </div>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Small confirmations                                                        */
/* -------------------------------------------------------------------------- */

export function SuspendMemberDialog({
  member,
  open,
  onClose,
  onConfirm,
}: {
  member: WorkspaceMember | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!member) return null;

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Suspend ${member.name}?`}
      description="They are signed out and cannot sign back in until reactivated."
      confirmLabel="Suspend Member"
    >
      <p className="text-sm text-text-secondary">
        Their role, their owned records and their history are all kept - this is
        a pause, not a removal, and it frees their seat while they are away.
        Anything assigned to them stays assigned.
      </p>
    </ConfirmDialog>
  );
}

export function CancelInviteDialog({
  member,
  open,
  onClose,
  onConfirm,
}: {
  member: WorkspaceMember | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!member) return null;

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Cancel this invitation?"
      description={`The link sent to ${member.email} stops working immediately.`}
      confirmLabel="Cancel Invitation"
    >
      <p className="text-sm text-text-secondary">
        Nothing is lost - you can invite {member.email} again at any time, and
        the seat is freed as soon as the invitation is cancelled.
      </p>
    </ConfirmDialog>
  );
}

/** The role chip used in the members drawer and the role list. */
export function RoleChip({ roleId }: { roleId: string }) {
  const role = roleById(roleId);
  if (!role) return null;

  return (
    <Badge variant={role.type === "custom" ? "primary" : "default"} casing="none">
      {role.name}
    </Badge>
  );
}
