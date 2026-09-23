"use client";

import { useMemo, useState } from "react";
import { CircleSlash, MailCheck, Plus, UserCheck, Users } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { MEMBER_STATUS_LABEL } from "@/constants/workspace";
import { useTableState } from "@/hooks/useTableState";
import { formatCount } from "@/lib/format";
import { WORKSPACE_NOW } from "@/lib/workspace-clock";
import {
  WORKSPACE_MEMBERS,
  WORKSPACE_ROLES,
  memberTotals,
  roleName,
} from "@/lib/workspace-fixtures";
import type { MemberStatus, WorkspaceMember } from "@/types/workspace";
import { MemberDetailDrawer } from "./member-detail-drawer";
import { MemberTable, type MemberSortField } from "./member-table";
import {
  CancelInviteDialog,
  ChangeRoleDialog,
  InviteMemberDialog,
  RemoveMemberDialog,
  SuspendMemberDialog,
} from "./member-dialogs";
import {
  permissionHint,
  useWorkspacePermissions,
} from "./use-workspace-permissions";

/**
 * Team Members - who works in this workspace.
 *
 * One responsibility and no more: the people, their status, and the lifecycle
 * actions that move them between states. What they can *do* is one click away
 * on Roles & Permissions and is never edited here beyond picking which role
 * they hold; what they *did* is the Activity page.
 *
 * Invitations live in this table rather than a page of their own. "Who is in
 * this workspace" includes the people who have been asked, and a separate
 * Invitations screen means checking two places to answer one question.
 */

const ALL = "all";
const FILTERS = ["status", "role"] as const;
type FilterKey = (typeof FILTERS)[number];

const STATUS_OPTIONS = [
  { value: ALL, label: "All statuses" },
  ...(Object.keys(MEMBER_STATUS_LABEL) as MemberStatus[]).map((status) => ({
    value: status,
    label: MEMBER_STATUS_LABEL[status],
  })),
];

const ROLE_OPTIONS = [
  { value: ALL, label: "All roles" },
  ...WORKSPACE_ROLES.map((role) => ({ value: role.id, label: role.name })),
];

export function TeamWorkspace() {
  const toast = useToast();
  const permissions = useWorkspacePermissions();
  const table = useTableState<FilterKey>(FILTERS);

  const [members, setMembers] = useState<WorkspaceMember[]>(WORKSPACE_MEMBERS);
  const [inviting, setInviting] = useState(false);
  const [selected, setSelected] = useState<WorkspaceMember | null>(null);
  const [changingRole, setChangingRole] = useState<WorkspaceMember | null>(null);
  const [suspending, setSuspending] = useState<WorkspaceMember | null>(null);
  const [cancelling, setCancelling] = useState<WorkspaceMember | null>(null);
  const [removing, setRemoving] = useState<WorkspaceMember | null>(null);

  const totals = useMemo(() => memberTotals(members), [members]);

  const kpis: Kpi[] = [
    {
      label: "Total Members",
      value: formatCount(totals.total),
      icon: Users,
      tone: "brand",
      hint: `${totals.seatsUsed} of ${totals.seatLimit} seats used`,
    },
    {
      label: "Active",
      value: formatCount(totals.active),
      icon: UserCheck,
      tone: "success",
      hint: "Can sign in right now",
    },
    {
      label: "Pending Invites",
      value: formatCount(totals.invited),
      icon: MailCheck,
      hint: totals.invited > 0 ? "Awaiting acceptance" : "Nothing outstanding",
    },
    {
      label: "Suspended",
      value: formatCount(totals.suspended),
      icon: CircleSlash,
      tone: totals.suspended > 0 ? "warning" : "neutral",
      hint: totals.suspended > 0 ? "Access paused" : "Nobody suspended",
    },
  ];

  const filtered = useMemo(() => {
    const term = table.search.trim().toLowerCase();

    return members.filter((member) => {
      if (table.filters.status !== ALL && member.status !== table.filters.status) {
        return false;
      }
      if (table.filters.role !== ALL && member.roleId !== table.filters.role) {
        return false;
      }
      if (term) {
        const haystack = [member.name, member.email, roleName(member.roleId)]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [members, table.filters.role, table.filters.status, table.search]);

  const sorted = useMemo(() => {
    const field = (table.sortField ?? "name") as MemberSortField;
    const factor = table.sortDirection === "asc" ? 1 : -1;

    /* Sorts on the underlying value, not the rendered string: "Never signed in"
       and "2 minutes ago" do not compare, and a null last-active always sorts
       to the end regardless of direction - it is the absence of a date, not an
       early one. */
    return [...filtered].sort((a, b) => {
      switch (field) {
        case "role":
          return roleName(a.roleId).localeCompare(roleName(b.roleId)) * factor;
        case "status":
          return a.status.localeCompare(b.status) * factor;
        case "lastActive": {
          if (!a.lastActiveAt) return 1;
          if (!b.lastActiveAt) return -1;
          return (
            (new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime()) *
            factor
          );
        }
        case "joined": {
          if (!a.joinedAt) return 1;
          if (!b.joinedAt) return -1;
          return (
            (new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()) * factor
          );
        }
        default:
          return a.name.localeCompare(b.name) * factor;
      }
    });
  }, [filtered, table.sortDirection, table.sortField]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / table.pageSize));
  const page = Math.min(table.page, totalPages);
  const paged = sorted.slice((page - 1) * table.pageSize, page * table.pageSize);

  /* One updater, so the drawer and the table can never show two versions of the
     same person. */
  function patch(id: string, next: Partial<WorkspaceMember>) {
    setMembers((current) =>
      current.map((member) => (member.id === id ? { ...member, ...next } : member)),
    );
    setSelected((current) =>
      current && current.id === id ? { ...current, ...next } : current,
    );
  }

  function invite(input: { email: string; roleId: string; message: string }) {
    const name = input.email
      .split("@")[0]
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    setMembers((current) => [
      {
        id: `mem_${Date.now().toString(36)}`,
        name,
        email: input.email,
        roleId: input.roleId,
        status: "invited",
        lastActiveAt: null,
        joinedAt: null,
        invitedAt: WORKSPACE_NOW,
        invitedById: permissions.memberId,
        ownership: { leads: 0, campaigns: 0, workflows: 0, contacts: 0 },
      },
      ...current,
    ]);

    toast("Invitation sent successfully.", "success");
  }

  const empty = members.length === 0;
  const noMatch = !empty && sorted.length === 0;

  return (
    <>
      <PageHeader
        title="Team Members"
        description="Invite and manage people who work in this workspace."
        action={
          permissions.canManageTeam ? (
            <Button onClick={() => setInviting(true)}>
              <Plus aria-hidden />
              Invite Member
            </Button>
          ) : (
            /*
             * Disabled and explained, not hidden.
             *
             * A missing button leaves a member wondering whether the feature
             * exists; a disabled one with a reason tells them exactly what to
             * ask for. The server still enforces this independently.
             */
            <Tooltip content={permissionHint("Manage team members", permissions.roleName)}>
              <Button disabled>
                <Plus aria-hidden />
                Invite Member
              </Button>
            </Tooltip>
          )
        }
      />

      <KpiStrip items={kpis} />

      {empty ? (
        <EmptyState
          title="No team members yet"
          description="Invite your first teammate to start working together in this workspace."
          action={
            permissions.canManageTeam ? (
              <Button size="sm" onClick={() => setInviting(true)}>
                <Plus aria-hidden />
                Invite Member
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="p-5">
          <FilterBar
            search={table.search}
            onSearchChange={table.setSearch}
            placeholder="Search name, email or role…"
            activeCount={table.activeFilters.length}
            onReset={table.clearAll}
          >
            <Select
              label="Status"
              value={table.filters.status}
              onChange={(value) => table.setFilter("status", value)}
              options={STATUS_OPTIONS}
              size="sm"
              className="w-40"
            />
            <Select
              label="Role"
              value={table.filters.role}
              onChange={(value) => table.setFilter("role", value)}
              options={ROLE_OPTIONS}
              size="sm"
              className="w-48"
            />
          </FilterBar>

          <div className="mt-5">
            {noMatch ? (
              <EmptyState
                compact
                title="No members match"
                description="Nothing here fits that search and filter."
              />
            ) : (
              <>
                <MemberTable
                  members={paged}
                  sortField={(table.sortField as MemberSortField | null) ?? "name"}
                  sortDirection={table.sortDirection}
                  onSort={table.toggleSort}
                  onOpen={setSelected}
                  onChangeRole={setChangingRole}
                  onResend={(member) =>
                    toast(`Invitation resent to ${member.email}`, "success")
                  }
                  onCancelInvite={setCancelling}
                  onSuspend={setSuspending}
                  onReactivate={(member) => {
                    patch(member.id, { status: "active" });
                    toast(`${member.name} reactivated`, "success");
                  }}
                  onRemove={setRemoving}
                  canManage={permissions.canManageTeam}
                />

                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={sorted.length}
                  perPage={table.pageSize}
                  onChange={table.setPage}
                  noun="members"
                />
              </>
            )}
          </div>
        </Card>
      )}

      {/* Mounted only while open, so a cancelled invite leaves nothing behind. */}
      {inviting ? (
        <InviteMemberDialog
          open
          onClose={() => setInviting(false)}
          members={members}
          onInvite={invite}
        />
      ) : null}

      <MemberDetailDrawer
        member={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onChangeRole={(member) => {
          setSelected(null);
          setChangingRole(member);
        }}
        onResend={(member) =>
          toast(`Invitation resent to ${member.email}`, "success")
        }
        onCancelInvite={(member) => {
          setSelected(null);
          setCancelling(member);
        }}
        canManage={permissions.canManageTeam}
      />

      {changingRole ? (
        <ChangeRoleDialog
          member={changingRole}
          open
          onClose={() => setChangingRole(null)}
          onConfirm={(member, roleId) => {
            patch(member.id, { roleId });
            toast(`${member.name} is now ${roleName(roleId)}`, "success");
          }}
        />
      ) : null}

      <SuspendMemberDialog
        member={suspending}
        open={Boolean(suspending)}
        onClose={() => setSuspending(null)}
        onConfirm={() => {
          if (!suspending) return;
          patch(suspending.id, { status: "suspended" });
          toast(`${suspending.name} suspended`, "info");
          setSuspending(null);
        }}
      />

      <CancelInviteDialog
        member={cancelling}
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        onConfirm={() => {
          if (!cancelling) return;
          setMembers((current) =>
            current.filter((member) => member.id !== cancelling.id),
          );
          toast(`Invitation to ${cancelling.email} cancelled`, "info");
          setCancelling(null);
        }}
      />

      {removing ? (
        <RemoveMemberDialog
          member={removing}
          members={members}
          open
          onClose={() => setRemoving(null)}
          onConfirm={(member, reassignToId) => {
            setMembers((current) =>
              current.filter((item) => item.id !== member.id),
            );
            if (selected?.id === member.id) setSelected(null);
            toast(
              reassignToId
                ? `${member.name} removed - their work moved to ${
                    members.find((item) => item.id === reassignToId)?.name ?? "a teammate"
                  }`
                : `${member.name} removed from this workspace`,
              "info",
            );
          }}
        />
      ) : null}
    </>
  );
}
