"use client";

import Link from "next/link";
import { ChevronRight, MailCheck, XCircle } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { APP_ROUTES } from "@/constants/app";
import { WORKSPACE_ROUTES } from "@/constants/workspace";
import { formatDate, formatDateTime, formatRelativeTime } from "@/lib/format";
import { WORKSPACE_NOW_MS } from "@/lib/workspace-clock";
import { cn } from "@/lib/utils";
import {
  WORKSPACE_AUDIT,
  accessPreview,
  grantCount,
  memberById,
  roleById,
  roleName,
} from "@/lib/workspace-fixtures";
import type { WorkspaceMember } from "@/types/workspace";
import { MemberStatusBadge } from "./workspace-badges";

/**
 * One member, in full.
 *
 * Scoped hard to workspace *access*. There is no phone number, no job title and
 * no start date here — this is not an HR record, and a drawer that drifts that
 * way becomes a directory nobody maintains. What it answers is: who let them
 * in, what can they reach, what do they own, and what have they been doing.
 *
 * The ownership rows link into the modules that hold the records, so "12 leads"
 * is checkable rather than a number to be taken on trust — and it is the same
 * count the removal dialog warns about.
 */
export function MemberDetailDrawer({
  member,
  open,
  onClose,
  onChangeRole,
  onResend,
  onCancelInvite,
  canManage,
}: {
  member: WorkspaceMember | null;
  open: boolean;
  onClose: () => void;
  onChangeRole: (member: WorkspaceMember) => void;
  onResend: (member: WorkspaceMember) => void;
  onCancelInvite: (member: WorkspaceMember) => void;
  canManage: boolean;
}) {
  if (!member) return null;

  const role = roleById(member.roleId);
  const access = accessPreview(role?.grants ?? {});
  const invitedBy = member.invitedById ? memberById(member.invitedById) : null;

  /* This member's own rows from the workspace audit trail — the same source the
     Activity page reads, filtered to them. */
  const recent = WORKSPACE_AUDIT.filter(
    (event) => event.actorId === member.id,
  ).slice(0, 5);

  const owns = [
    {
      label: "Assigned leads",
      count: member.ownership.leads,
      href: APP_ROUTES.leads,
      icon: "target",
    },
    {
      label: "Owned campaigns",
      count: member.ownership.campaigns,
      href: APP_ROUTES.marketingCampaigns,
      icon: "megaphone",
    },
    {
      label: "Managed workflows",
      count: member.ownership.workflows,
      href: APP_ROUTES.automation,
      icon: "workflow",
    },
    {
      label: "Contacts created",
      count: member.ownership.contacts,
      href: APP_ROUTES.contacts,
      icon: "users",
    },
  ].filter((row) => row.count > 0);

  const facts = [
    { label: "Status", value: <MemberStatusBadge status={member.status} /> },
    { label: "Role", value: roleName(member.roleId) },
    {
      label: "Permissions",
      value: role ? `${grantCount(role.grants)} granted` : "—",
    },
    {
      label: "Joined",
      value: member.joinedAt ? formatDate(member.joinedAt) : "Not yet accepted",
    },
    {
      label: "Last active",
      value: member.lastActiveAt
        ? formatRelativeTime(member.lastActiveAt, WORKSPACE_NOW_MS)
        : "Never signed in",
    },
    {
      label: "Invited",
      value: formatRelativeTime(member.invitedAt, WORKSPACE_NOW_MS),
    },
    { label: "Invited by", value: invitedBy?.name ?? "Workspace owner" },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={member.name}
      description={member.email}
      footer={
        canManage && !member.isCurrentUser && member.status !== "invited" ? (
          <Button
            variant="outline"
            size="compact"
            className="w-full"
            onClick={() => onChangeRole(member)}
          >
            Change role
          </Button>
        ) : undefined
      }
    >
      <div className="flex items-center gap-3">
        <Avatar
          name={member.name}
          size="lg"
          tone={member.isCurrentUser ? "bg-primary-soft text-primary-dark" : undefined}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">
            {member.name}
            {member.isCurrentUser ? (
              <span className="ml-1.5 font-normal text-text-muted">(you)</span>
            ) : null}
          </p>
          <p className="truncate text-sm text-text-muted">{member.email}</p>
        </div>
      </div>

      <dl className="mt-5 space-y-3">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="flex items-baseline justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <dt className="shrink-0 text-sm text-text-muted">{fact.label}</dt>
            <dd className="min-w-0 truncate text-sm font-medium text-text-primary">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>

      {role ? (
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-text-primary">Access</h3>
          <p className="mt-1 text-sm text-text-secondary font-medium">{role.description}</p>

          {/*
           * Effective access, not the permission list.
           *
           * A member drawer is the wrong place for 105 checkboxes — the reader
           * is asking "roughly what can this person do", and the answer is
           * module names. The link below goes to the role for the detail.
           */}
          <dl className="mt-3 space-y-2">
            {[
              { label: "Can access", items: access.full, tone: "text-success-text" },
              { label: "Limited", items: access.limited, tone: "text-warning-text" },
            ]
              .filter((row) => row.items.length > 0)
              .map((row) => (
                <div key={row.label} className="flex flex-wrap gap-x-3 gap-y-1">
                  <dt className={cn("w-24 shrink-0 text-meta font-semibold", row.tone)}>
                    {row.label}
                  </dt>
                  <dd className="min-w-0 flex-1 text-sm text-text-secondary">
                    {row.items.join(" · ")}
                  </dd>
                </div>
              ))}
          </dl>
          <Link
            href={WORKSPACE_ROUTES.roles}
            className="mt-2 inline-flex items-center gap-1 rounded-btn text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:shadow-focus focus-visible:outline-none"
          >
            View {role.name} permissions
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </section>
      ) : null}

      {/*
       * Invitation state, for someone who has not accepted yet.
       *
       * An invited member has no join date, no activity and nothing owned, so
       * the panels below render empty for them. This is what they have instead:
       * when it was sent, when it lapses, and the two actions that apply.
       */}
      {member.status === "invited" ? (
        <section className="mt-6 rounded-panel border border-info-soft bg-info-soft/40 px-3.5 py-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Invitation pending
          </h3>

          <dl className="mt-2.5 space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-text-muted">Sent</dt>
              <dd className="text-sm font-medium text-text-primary">
                {formatDateTime(member.invitedAt)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-text-muted">Expires</dt>
              <dd className="text-sm font-medium text-text-primary">
                {formatDateTime(invitationExpiry(member.invitedAt))}
                <span className="ml-2 text-meta font-normal text-text-muted">
                  {formatRelativeTime(invitationExpiry(member.invitedAt), WORKSPACE_NOW_MS)}
                </span>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-text-muted">Invited by</dt>
              <dd className="text-sm font-medium text-text-primary">
                {invitedBy?.name ?? "Workspace owner"}
              </dd>
            </div>
          </dl>

          {canManage ? (
            <div className="mt-3 flex flex-wrap gap-2.5">
              <Button variant="outline" size="sm" onClick={() => onResend(member)}>
                <MailCheck aria-hidden />
                Resend Invite
              </Button>
              <Button variant="outline" size="sm" onClick={() => onCancelInvite(member)}>
                <XCircle aria-hidden />
                Cancel Invite
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {owns.length > 0 ? (
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-text-primary">
            Owned in this workspace
          </h3>
          <p className="mt-1 text-sm text-text-secondary font-medium">
            What would need reassigning if they left.
          </p>

          <ul className="mt-2.5 space-y-1">
            {owns.map((row) => (
              <li key={row.label}>
                <Link
                  href={row.href}
                  className="flex items-center gap-3 rounded-panel px-3 py-2.5 transition-colors hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-secondary">
                    <Icon name={row.icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium text-text-primary">
                    {row.label}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
                    {row.count}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-text-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-text-primary">
          Recent workspace activity
        </h3>

        {recent.length === 0 ? (
          <EmptyState
            compact
            className="mt-2.5"
            title="Nothing recorded yet"
            description={
              member.status === "invited"
                ? "They have not accepted the invitation."
                : "Their workspace actions will appear here."
            }
          />
        ) : (
          <ul className="mt-2.5 divide-y divide-border">
            {recent.map((event) => (
              <li key={event.id} className="py-2.5 first:pt-0 last:pb-0">
                <p className="text-sm text-text-primary">
                  {event.actionLabel}
                  <span className="text-text-muted"> — {event.resourceName}</span>
                </p>
                <p className="mt-0.5 text-meta text-text-muted">
                  {formatRelativeTime(event.createdAt, WORKSPACE_NOW_MS)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <Link
          href={`${WORKSPACE_ROUTES.activity}?member=${member.id}`}
          className="mt-3 inline-flex items-center gap-1 rounded-btn text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:shadow-focus focus-visible:outline-none"
        >
          View all activity by {member.name.split(" ")[0]}
          <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </section>
    </Drawer>
  );
}

/**
 * When an invitation lapses.
 *
 * Seven days from sending, which is the window the invitation email states.
 * Derived rather than stored so the fixture cannot drift from the copy; a real
 * backend supplies `expiresAt` on the invitation record and this goes away.
 */
function invitationExpiry(invitedAt: string): string {
  return new Date(new Date(invitedAt).getTime() + 7 * 86_400_000).toISOString();
}
