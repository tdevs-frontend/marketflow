"use client";

import {
  Ban,
  MailCheck,
  Pencil,
  RotateCcw,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";

import { AvatarLabel } from "@/components/ui/avatar";
import { Menu, type MenuItem } from "@/components/ui/menu";
import {
  SortableTH,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  type SortDirection,
} from "@/components/ui/table";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { WORKSPACE_NOW_MS } from "@/lib/workspace-clock";
import { roleName } from "@/lib/workspace-fixtures";
import { cn } from "@/lib/utils";
import type { WorkspaceMember } from "@/types/workspace";
import { MemberStatusBadge } from "./workspace-badges";

export type MemberSortField = "name" | "role" | "status" | "lastActive" | "joined";

/**
 * The team table.
 *
 * The row-actions menu is built per row from the member's own status, not
 * filtered from one fixed list — an invited member has no role to change and a
 * suspended one has nothing to resend, and offering either produces a menu item
 * that can only fail. That is the brief's rule and it is also what keeps the
 * menu short enough to read.
 *
 * The signed-in member's own row loses its destructive actions entirely. You
 * cannot suspend or remove yourself here; leaving a workspace is a different
 * flow with a different confirmation, and an accidental self-removal is
 * unrecoverable without another admin.
 */
export function MemberTable({
  members,
  sortField,
  sortDirection,
  onSort,
  onOpen,
  onChangeRole,
  onResend,
  onCancelInvite,
  onSuspend,
  onReactivate,
  onRemove,
  canManage,
}: {
  members: WorkspaceMember[];
  sortField: MemberSortField | null;
  sortDirection: SortDirection;
  onSort: (field: MemberSortField) => void;
  onOpen: (member: WorkspaceMember) => void;
  onChangeRole: (member: WorkspaceMember) => void;
  onResend: (member: WorkspaceMember) => void;
  onCancelInvite: (member: WorkspaceMember) => void;
  onSuspend: (member: WorkspaceMember) => void;
  onReactivate: (member: WorkspaceMember) => void;
  onRemove: (member: WorkspaceMember) => void;
  /** Without it the menu keeps View details and drops everything else. */
  canManage: boolean;
}) {
  function actionsFor(member: WorkspaceMember): MenuItem[] {
    const items: MenuItem[] = [
      {
        label: "View details",
        icon: <UserRound className="size-4" aria-hidden />,
        onSelect: () => onOpen(member),
      },
    ];

    if (!canManage) return items;

    /* Your own row: view only. Self-removal has no undo and no second path
       back in if you were the last admin. */
    if (member.isCurrentUser) return items;

    if (member.status === "invited") {
      items.push(
        {
          label: "Resend invitation",
          icon: <MailCheck className="size-4" aria-hidden />,
          onSelect: () => onResend(member),
        },
        {
          label: "Change role",
          icon: <Pencil className="size-4" aria-hidden />,
          onSelect: () => onChangeRole(member),
        },
        {
          label: "Cancel invitation",
          icon: <XCircle className="size-4" aria-hidden />,
          destructive: true,
          onSelect: () => onCancelInvite(member),
        },
      );
      return items;
    }

    if (member.status === "suspended") {
      items.push(
        {
          label: "Reactivate member",
          icon: <RotateCcw className="size-4" aria-hidden />,
          onSelect: () => onReactivate(member),
        },
        {
          label: "Remove member",
          icon: <Trash2 className="size-4" aria-hidden />,
          destructive: true,
          onSelect: () => onRemove(member),
        },
      );
      return items;
    }

    items.push(
      {
        label: "Change role",
        icon: <Pencil className="size-4" aria-hidden />,
        onSelect: () => onChangeRole(member),
      },
      {
        label: "Suspend member",
        icon: <Ban className="size-4" aria-hidden />,
        destructive: true,
        onSelect: () => onSuspend(member),
      },
      {
        label: "Remove member",
        icon: <Trash2 className="size-4" aria-hidden />,
        destructive: true,
        onSelect: () => onRemove(member),
      },
    );

    return items;
  }

  return (
    <Table minWidth="62rem">
      <THead>
        <SortableTH
          field="name"
          activeField={sortField}
          direction={sortDirection}
          onSort={onSort}
        >
          Member
        </SortableTH>
        <SortableTH
          field="role"
          activeField={sortField}
          direction={sortDirection}
          onSort={onSort}
        >
          Role
        </SortableTH>
        <TH>Status</TH>
        <SortableTH
          field="lastActive"
          activeField={sortField}
          direction={sortDirection}
          onSort={onSort}
        >
          Last Active
        </SortableTH>
        <SortableTH
          field="joined"
          activeField={sortField}
          direction={sortDirection}
          onSort={onSort}
        >
          Joined
        </SortableTH>
        <TH align="right">
          <span className="sr-only">Actions</span>
        </TH>
      </THead>

      <TBody>
        {members.map((member) => (
          <TR
            key={member.id}
            onClick={() => onOpen(member)}
            className="cursor-pointer"
          >
            <TD className="max-w-xs">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen(member);
                }}
                className="block max-w-full text-left focus-visible:shadow-focus focus-visible:outline-none"
              >
                <AvatarLabel
                  name={member.name}
                  secondary={member.email}
                  size="sm"
                  tone={
                    member.isCurrentUser
                      ? "bg-primary-soft text-primary-dark"
                      : undefined
                  }
                />
              </button>
            </TD>

            <TD className="text-text-secondary">
              {roleName(member.roleId)}
              {member.isCurrentUser ? (
                <span className="ml-1.5 text-meta font-normal text-text-muted">
                  (you)
                </span>
              ) : null}
            </TD>

            <TD>
              <MemberStatusBadge status={member.status} />
            </TD>

            <TD
              className={cn(
                "font-normal",
                member.lastActiveAt ? "text-text-secondary" : "text-text-muted",
              )}
            >
              {member.lastActiveAt
                ? formatRelativeTime(member.lastActiveAt, WORKSPACE_NOW_MS)
                : "Never signed in"}
            </TD>

            <TD className="font-normal text-text-secondary">
              {member.joinedAt ? (
                formatDate(member.joinedAt)
              ) : (
                <span className="text-text-muted">
                  Invited {formatRelativeTime(member.invitedAt, WORKSPACE_NOW_MS)}
                </span>
              )}
            </TD>

            <TD align="right">
              {/* Stops the row's own open handler firing behind the menu. */}
              <span onClick={(event) => event.stopPropagation()} className="inline-flex">
                <Menu label={`Actions for ${member.name}`} items={actionsFor(member)} />
              </span>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
