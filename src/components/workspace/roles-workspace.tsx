"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ChevronRight,
  Copy,
  GitCompare,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { AvatarLabel } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Menu } from "@/components/ui/menu";
import { Select } from "@/components/ui/select";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import {
  PERMISSION_GROUPS,
  TOTAL_PERMISSIONS,
  WORKSPACE_ROUTES,
  applyDependencies,
  permissionLabel,
} from "@/constants/workspace";
import { formatRelativeTime } from "@/lib/format";
import { WORKSPACE_NOW, WORKSPACE_NOW_MS } from "@/lib/workspace-clock";
import {
  CURRENT_MEMBER,
  WORKSPACE_MEMBERS,
  WORKSPACE_ROLES,
  accessPreview,
  auditEventForRoleChange,
  auditEventForRoleLifecycle,
  duplicateRole,
  grantCount,
  groupCoverage,
  lockoutWarning,
  membersWithRole,
  moduleCoverage,
  permissionDeltas,
  riskLevel,
  roleActivity,
  roleActivityForChange,
  sensitiveGrants,
} from "@/lib/workspace-fixtures";
import { cn } from "@/lib/utils";
import type { PermissionAction, RoleGrants, WorkspaceRole } from "@/types/workspace";
import {
  PermissionLegend,
  PermissionMatrix,
  SensitiveSummary,
} from "./permission-matrix";
import {
  ChangeSummaryDialog,
  CompareRolesDialog,
  CopyPermissionsDialog,
  CreateRoleDrawer,
  DeleteRoleDialog,
} from "./role-dialogs";
import {
  permissionHint,
  useWorkspacePermissions,
} from "./use-workspace-permissions";
import {
  recordAuditEvent,
  recordRoleEvent,
  useSessionRoleEvents,
} from "./workspace-audit-store";
import { RiskBadge, RoleTypeBadge } from "./workspace-badges";

/**
 * Roles & Permissions - what workspace members can reach.
 *
 * Master/detail rather than a table that opens a modal: the permission editor
 * *is* the page, and burying it behind a dialog makes comparing two roles a
 * matter of memory. The list stays visible so switching between Marketing
 * Manager and Junior Marketer is one click and the matrix redraws beside it.
 *
 * The detail is three tabs - Permissions, Members, Activity - because a role
 * answers three questions and only one of them is the grid. No new routes: this
 * is one page, and Workspace already owns four sidebar entries.
 *
 * Two protections are enforced here rather than left for the server to reject,
 * because both are unrecoverable from inside the product: the Owner role cannot
 * be edited or deleted, and nobody can strip the permission that governs
 * permissions from the role they themselves hold.
 */

type DetailTab = "permissions" | "members" | "activity";

const TABS: TabItem<DetailTab>[] = [
  { value: "permissions", label: "Permissions" },
  { value: "members", label: "Members" },
  { value: "activity", label: "Activity" },
];

export function RolesWorkspace() {
  const toast = useToast();
  const idBase = useId();
  const permissions = useWorkspacePermissions();

  const [roles, setRoles] = useState<WorkspaceRole[]>(WORKSPACE_ROLES);
  const [members, setMembers] = useState(WORKSPACE_MEMBERS);
  const [selectedId, setSelectedId] = useState(roles[0]?.id ?? "");
  const [tab, setTab] = useState<DetailTab>("permissions");

  /**
   * The staged edit.
   *
   * Permission toggles never write straight to `roles` - they accumulate here
   * until the merchant saves, which is what makes the change summary possible
   * and what stops a mis-click from revoking someone's access in real time.
   */
  const [draft, setDraft] = useState<RoleGrants | null>(null);

  const [creating, setCreating] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [copying, setCopying] = useState<WorkspaceRole | null>(null);
  const [deleting, setDeleting] = useState<WorkspaceRole | null>(null);
  const [archiving, setArchiving] = useState<WorkspaceRole | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [leavingTo, setLeavingTo] = useState<string | null>(null);

  const role = roles.find((item) => item.id === selectedId) ?? roles[0];
  const grants = draft ?? role?.grants ?? {};
  const dirty = draft !== null;

  const roleMembers = useMemo(
    () => (role ? membersWithRole(role.id, members) : []),
    [role, members],
  );

  const isOwnerRole = role?.id === "role_owner";
  const editable = permissions.canManageRoles && !isOwnerRole && role?.status === "active";

  const deltas = useMemo(
    () => (role && draft ? permissionDeltas(role.grants, draft) : []),
    [role, draft],
  );

  /* Every toggle resolves dependencies, so an incoherent combination is never
     held in state - not caught at save, simply not reachable. */
  function toggle(resource: string, action: PermissionAction, next: boolean) {
    if (!role) return;

    const base = draft ?? role.grants;
    const { grants: updated, cascaded } = applyDependencies(
      base,
      resource,
      action,
      next,
    );
    setDraft(updated);

    if (cascaded.length > 0) {
      toast(
        next
          ? `Also granted ${cascaded.map((item) => permissionLabel(resource, item)).join(", ")} - required for this.`
          : `Also removed ${cascaded.map((item) => permissionLabel(resource, item)).join(", ")} - they depend on it.`,
        "info",
      );
    }
  }

  function save() {
    if (!role || !draft) return;

    setRoles((current) =>
      current.map((item) =>
        item.id === role.id
          ? {
              ...item,
              grants: draft,
              updatedAt: WORKSPACE_NOW,
              updatedBy: CURRENT_MEMBER.name,
            }
          : item,
      ),
    );
    /* Both trails, from one edit: the workspace audit trail for correlation
       with everything else, and the role's own history for the tab beside
       this one. */
    const payload = {
      role,
      deltas,
      affectedMembers: roleMembers.length,
      actor: CURRENT_MEMBER,
    };
    recordAuditEvent(auditEventForRoleChange(payload));
    recordRoleEvent(roleActivityForChange(payload));

    setDraft(null);
    toast(
      `${role.name} updated - ${deltas.length} permission ${deltas.length === 1 ? "change" : "changes"} saved`,
      "success",
    );
  }

  /** Switching roles with a staged edit asks first rather than dropping it. */
  function selectRole(id: string) {
    if (dirty && id !== selectedId) {
      setLeavingTo(id);
      return;
    }
    setSelectedId(id);
  }

  function copyFrom(fromRoleId: string, groupKey: string) {
    const source = roles.find((item) => item.id === fromRoleId);
    if (!source || !role) return;

    const keys =
      groupKey === "all"
        ? PERMISSION_GROUPS.flatMap((group) =>
            group.resources.map((resource) => resource.key),
          )
        : (PERMISSION_GROUPS.find((group) => group.key === groupKey)?.resources ?? []).map(
            (resource) => resource.key,
          );

    const base = { ...(draft ?? role.grants) };
    for (const key of keys) base[key] = [...(source.grants[key] ?? [])];

    setDraft(base);
    toast(`Copied ${source.name} permissions - review and save`, "info");
  }

  const active = roles.filter((item) => item.status === "active");
  const archived = roles.filter((item) => item.status === "archived");
  const customRoles = roles.filter((item) => item.type === "custom");

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description="Control what workspace members can view, create, edit and manage."
        secondaryActions={
          <Button variant="outline" onClick={() => setComparing(true)}>
            <GitCompare aria-hidden />
            Compare Roles
          </Button>
        }
        action={
          permissions.canManageRoles ? (
            <Button onClick={() => setCreating(true)}>
              <Plus aria-hidden />
              Create Custom Role
            </Button>
          ) : (
            <Tooltip content={permissionHint("Manage roles", permissions.roleName)}>
              <Button disabled>
                <Plus aria-hidden />
                Create Custom Role
              </Button>
            </Tooltip>
          )
        }
      />

      {/*
       * Role list beside the detail on a desktop, stacked below `xl`.
       *
       * 19rem holds the longest role name plus its counts without wrapping;
       * narrower and every row breaks over two lines.
       */}
      <div className="grid gap-6 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="min-w-0">
          {/* Mobile: a select. A 19rem list above the editor pushes the grid
              off the first screen on a phone. */}
          <div className="xl:hidden">
            <Select
              label="Role"
              hideLabel={false}
              value={role?.id ?? ""}
              onChange={selectRole}
              options={roles.map((item) => ({
                value: item.id,
                label: item.name,
                hint: `${membersWithRole(item.id, members).length} members · ${grantCount(item.grants)} permissions`,
              }))}
            />
          </div>

          <Card className="max-xl:hidden">
            <CardHeader
              title="Roles"
              description={`${active.length} active · ${TOTAL_PERMISSIONS} permissions`}
            />
            <CardBody className="p-2">
              <ul className="space-y-0.5">
                {active.map((item) => (
                  <RoleRow
                    key={item.id}
                    role={item}
                    memberCount={membersWithRole(item.id, members).length}
                    active={item.id === role?.id}
                    onSelect={() => selectRole(item.id)}
                  />
                ))}
              </ul>

              {archived.length > 0 ? (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="px-3 text-meta font-medium tracking-[0.06em] text-text-muted uppercase">
                    Archived
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {archived.map((item) => (
                      <RoleRow
                        key={item.id}
                        role={item}
                        memberCount={membersWithRole(item.id, members).length}
                        active={item.id === role?.id}
                        onSelect={() => selectRole(item.id)}
                      />
                    ))}
                  </ul>
                </div>
              ) : null}

              {customRoles.length === 0 ? (
                <EmptyState
                  compact
                  className="mt-2"
                  title="No custom roles"
                  description="Create one if the default roles do not fit your team."
                />
              ) : null}
            </CardBody>
          </Card>
        </aside>

        <div className="min-w-0 space-y-6">
          {role ? (
            <>
              <RoleHeader
                role={role}
                grants={grants}
                memberCount={roleMembers.length}
                canManage={permissions.canManageRoles}
                onDuplicate={() => {
                  const copy = duplicateRole(role, CURRENT_MEMBER.name);
                  setRoles((current) => [...current, copy]);
                  setSelectedId(copy.id);
                  setDraft(null);
                  recordAuditEvent(
                    auditEventForRoleLifecycle({
                      role: copy,
                      action: "duplicated",
                      actor: CURRENT_MEMBER,
                      detail: `Copied from ${role.name}`,
                    }),
                  );
                  toast(`${copy.name} created - customise it now`, "success");
                }}
                onCopyPermissions={() => setCopying(role)}
                onArchive={() => setArchiving(role)}
                onRestore={() => {
                  setRoles((current) =>
                    current.map((item) =>
                      item.id === role.id ? { ...item, status: "active" } : item,
                    ),
                  );
                  recordAuditEvent(
                    auditEventForRoleLifecycle({
                      role,
                      action: "restored",
                      actor: CURRENT_MEMBER,
                    }),
                  );
                  toast(`${role.name} restored`, "success");
                }}
                onDelete={() => setDeleting(role)}
              />

              {role.status === "archived" ? (
                <p className="flex items-start gap-2.5 rounded-card border border-border bg-surface-secondary px-4 py-3.5 text-sm text-text-secondary">
                  <Archive className="mt-0.5 size-4 shrink-0 text-text-muted" aria-hidden />
                  <span>
                    <span className="font-semibold text-text-primary">
                      This role is archived.
                    </span>{" "}
                    Its permissions are kept and it cannot be assigned to anyone.
                    Restore it to use it again.
                  </span>
                </p>
              ) : null}

              {isOwnerRole ? (
                <p className="flex items-start gap-2.5 rounded-card border border-border bg-surface-secondary px-4 py-3.5 text-sm text-text-secondary">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-text-muted" aria-hidden />
                  <span>
                    <span className="font-semibold text-text-primary">
                      The Owner role is fixed at full access.
                    </span>{" "}
                    It cannot be edited or deleted, so a workspace can never end
                    up with nobody able to administer it. Transferring ownership
                    is a separate, explicit step.
                  </span>
                </p>
              ) : null}

              <Tabs
                tabs={TABS}
                value={tab}
                onChange={setTab}
                label="Role detail"
                idBase={idBase}
                bleed={false}
              />

              {tab === "permissions" ? (
                <TabPanel idBase={idBase} value="permissions" className="space-y-4">
                  {editable ? null : (
                    <p className="text-sm text-text-muted">
                      {isOwnerRole
                        ? "Read-only - the Owner role is protected."
                        : role.status === "archived"
                          ? "Read-only - restore this role to edit it."
                          : permissionHint("Manage roles", permissions.roleName)}
                    </p>
                  )}

                  <PermissionMatrix
                    grants={grants}
                    baseline={role.grants}
                    onToggle={toggle}
                    readOnly={!editable}
                    guard={(resource, action, next) =>
                      isOwnerRole
                        ? "The Owner role is fixed at full access."
                        : lockoutWarning(role.id, resource, action, next)
                    }
                  />

                  <PermissionLegend hasChanges={dirty} />

                  {role.id === CURRENT_MEMBER.roleId && editable ? (
                    <p className="flex items-start gap-2.5 rounded-card border border-warning-soft bg-warning-soft px-4 py-3.5 text-sm text-warning-text">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                      <span>
                        This is your own role. Permissions that would lock you
                        out of managing the workspace are held open - everything
                        else you turn off applies to you as soon as it is saved.
                      </span>
                    </p>
                  ) : null}
                </TabPanel>
              ) : null}

              {tab === "members" ? (
                <TabPanel idBase={idBase} value="members">
                  <RoleMembers role={role} members={roleMembers} />
                </TabPanel>
              ) : null}

              {tab === "activity" ? (
                <TabPanel idBase={idBase} value="activity">
                  <RoleActivity roleId={role.id} />
                </TabPanel>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {/*
       * The save bar, sticky while an edit is staged.
       *
       * Appears only when there is something to save - a permanently pinned bar
       * spends 64px of every visit saying "nothing has changed".
       */}
      {dirty && role ? (
        <div className="sticky bottom-0 z-30 -mx-4 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:-mx-7 md:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <span className="inline-block size-2 rounded-full bg-warning" aria-hidden />
              {deltas.length} unsaved permission{" "}
              {deltas.length === 1 ? "change" : "changes"} on {role.name}
            </p>

            <div className="flex items-center gap-2.5">
              <Button variant="outline" size="compact" onClick={() => setDraft(null)}>
                Discard
              </Button>
              <Button size="compact" onClick={() => setReviewing(true)}>
                Review &amp; Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {creating ? (
        <CreateRoleDrawer
          open
          roles={roles}
          onClose={() => setCreating(false)}
          onCreate={(next) => {
            setRoles((current) => [...current, next]);
            setSelectedId(next.id);
            setDraft(null);
            recordAuditEvent(
              auditEventForRoleLifecycle({
                role: next,
                action: "created",
                actor: CURRENT_MEMBER,
              }),
            );
            toast(`${next.name} created`, "success");
          }}
        />
      ) : null}

      {comparing ? (
        <CompareRolesDialog
          open
          roles={roles}
          initialLeft={role?.id ?? ""}
          onClose={() => setComparing(false)}
        />
      ) : null}

      {copying ? (
        <CopyPermissionsDialog
          open
          target={copying}
          roles={roles}
          onClose={() => setCopying(null)}
          onCopy={copyFrom}
        />
      ) : null}

      <ChangeSummaryDialog
        role={role ?? null}
        before={role?.grants ?? {}}
        after={draft ?? {}}
        members={roleMembers}
        open={reviewing}
        onClose={() => setReviewing(false)}
        onConfirm={save}
      />

      {deleting ? (
        <DeleteRoleDialog
          open
          role={deleting}
          roles={roles}
          members={members}
          onClose={() => setDeleting(null)}
          onConfirm={(target, reassignToId) => {
            if (reassignToId) {
              setMembers((current) =>
                current.map((member) =>
                  member.roleId === target.id
                    ? { ...member, roleId: reassignToId }
                    : member,
                ),
              );
            }
            setRoles((current) => current.filter((item) => item.id !== target.id));
            setSelectedId("role_owner");
            setDraft(null);
            recordAuditEvent(
              auditEventForRoleLifecycle({
                role: target,
                action: "deleted",
                actor: CURRENT_MEMBER,
                detail: reassignToId
                  ? `Members reassigned to ${roles.find((r) => r.id === reassignToId)?.name}`
                  : "No members held this role",
              }),
            );
            toast(
              reassignToId
                ? `${target.name} deleted - members moved to ${roles.find((r) => r.id === reassignToId)?.name}`
                : `${target.name} deleted`,
              "info",
            );
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(archiving)}
        onClose={() => setArchiving(null)}
        onConfirm={() => {
          if (!archiving) return;
          setRoles((current) =>
            current.map((item) =>
              item.id === archiving.id ? { ...item, status: "archived" } : item,
            ),
          );
          recordAuditEvent(
            auditEventForRoleLifecycle({
              role: archiving,
              action: "archived",
              actor: CURRENT_MEMBER,
            }),
          );
          toast(`${archiving.name} archived`, "info");
          setArchiving(null);
        }}
        title={archiving ? `Archive ${archiving.name}?` : "Archive role?"}
        description="It keeps its permissions and stops being assignable."
        confirmLabel="Archive Role"
        tone="primary"
      >
        <p className="text-sm text-text-secondary">
          Archiving is the reversible half of deleting. Anyone already holding
          the role keeps it; it simply stops appearing when assigning someone
          new. You can restore it at any time.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(leavingTo)}
        onClose={() => setLeavingTo(null)}
        onConfirm={() => {
          if (!leavingTo) return;
          setDraft(null);
          setSelectedId(leavingTo);
          setLeavingTo(null);
        }}
        title="Discard unsaved permission changes?"
        description={`Your edits to ${role?.name} have not been saved.`}
        confirmLabel="Discard and switch"
        cancelLabel="Keep editing"
      >
        <p className="text-sm text-text-secondary">
          Switching roles now loses the {deltas.length}{" "}
          {deltas.length === 1 ? "change" : "changes"} you staged. Save them
          first if you want to keep them.
        </p>
      </ConfirmDialog>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* List row                                                                   */
/* -------------------------------------------------------------------------- */

function RoleRow({
  role,
  memberCount,
  active,
  onSelect,
}: {
  role: WorkspaceRole;
  memberCount: number;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? "true" : undefined}
        className={cn(
          "w-full rounded-panel px-3 py-2.5 text-left transition-colors focus-visible:shadow-focus focus-visible:outline-none",
          active ? "bg-primary-soft" : "hover:bg-surface-secondary",
          role.status === "archived" && "opacity-70",
        )}
      >
        <span className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm font-semibold",
              active ? "text-primary-dark" : "text-text-primary",
            )}
          >
            {role.name}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-meta text-text-muted tabular-nums">
            {memberCount}
            <span className="sr-only">members</span>
          </span>
        </span>

        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <RoleTypeBadge type={role.type} />
          <span className="text-meta text-text-muted tabular-nums">
            {grantCount(role.grants)} permissions
          </span>
        </span>
      </button>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Header and summary                                                         */
/* -------------------------------------------------------------------------- */

function RoleHeader({
  role,
  grants,
  memberCount,
  canManage,
  onDuplicate,
  onCopyPermissions,
  onArchive,
  onRestore,
  onDelete,
}: {
  role: WorkspaceRole;
  grants: RoleGrants;
  memberCount: number;
  canManage: boolean;
  onDuplicate: () => void;
  onCopyPermissions: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const modules = moduleCoverage(grants);
  const sensitive = sensitiveGrants(grants);
  const coverage = groupCoverage(grants).filter((group) => group.granted > 0);

  const isOwner = role.id === "role_owner";
  const isSystem = role.type === "system";

  /* Duplicate is offered on every role including the Owner - copying a
     permission set is not the same as changing it, and "start from Owner" is a
     legitimate way to build a second administrator. */
  const actions = [
    { label: "Duplicate role", icon: <Copy className="size-4" aria-hidden />, onSelect: onDuplicate },
    ...(canManage && !isOwner
      ? [
          {
            label: "Copy permissions from…",
            icon: <ChevronRight className="size-4" aria-hidden />,
            onSelect: onCopyPermissions,
          },
        ]
      : []),
    ...(canManage && !isSystem && role.status === "active"
      ? [
          {
            label: "Archive role",
            icon: <Archive className="size-4" aria-hidden />,
            onSelect: onArchive,
          },
        ]
      : []),
    ...(canManage && !isSystem && role.status === "archived"
      ? [
          {
            label: "Restore role",
            icon: <ArchiveRestore className="size-4" aria-hidden />,
            onSelect: onRestore,
          },
        ]
      : []),
    ...(canManage && !isSystem
      ? [
          {
            label: "Delete role",
            icon: <Trash2 className="size-4" aria-hidden />,
            destructive: true,
            onSelect: onDelete,
          },
        ]
      : []),
  ];

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">{role.name}</h2>
            <RoleTypeBadge type={role.type} />
            {role.status === "archived" ? (
              <Badge size="sm" className="normal-case">
                Archived
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 max-w-xl text-sm text-text-secondary">
            {role.description}
          </p>
          <p className="mt-1.5 text-meta text-text-muted">
            Updated {formatRelativeTime(role.updatedAt, WORKSPACE_NOW_MS)}
            {role.updatedBy ? ` by ${role.updatedBy}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <Menu label={`Actions for ${role.name}`} items={actions} />
        </div>
      </div>

      {/* Compact summary tiles - deliberately not KPI cards. This is context
          above the editor, not the point of the page. */}
      <dl className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile label="Members" value={String(memberCount)} />
        <SummaryTile
          label="Permissions"
          value={`${grantCount(grants)} / ${TOTAL_PERMISSIONS}`}
        />
        <SummaryTile label="Modules" value={`${modules.covered} / ${modules.total}`} />
        <SummaryTile label="Risk level" value={<RiskBadge level={riskLevel(grants)} />} />
      </dl>

      {coverage.length > 0 ? (
        <div className="mt-5 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-text-primary">
              Permission summary
            </p>
            <SensitiveSummary count={sensitive.length} />
          </div>

          <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-2">
            {coverage.map((group) => (
              <li key={group.key} className="text-sm">
                <span className="text-text-secondary">{group.label}</span>{" "}
                <span className="font-semibold text-text-primary tabular-nums">
                  {group.granted}/{group.total}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <AccessPreview grants={grants} />
    </Card>
  );
}

function SummaryTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-panel border border-border px-3.5 py-2.5">
      <dt className="text-meta font-medium text-text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-text-primary">{value}</dd>
    </div>
  );
}

/**
 * What this role can reach, in plain terms.
 *
 * The mental model for a merchant who will never read a matrix. Three buckets
 * and module names - "Sales Agent works with Customers, reads Analytics, and
 * cannot touch Automation or Settings" - which is the sentence they would say
 * out loud when deciding who to give it to.
 */
function AccessPreview({ grants }: { grants: RoleGrants }) {
  const preview = accessPreview(grants);

  const rows = [
    { label: "Can access", items: preview.full, tone: "text-success-text" },
    { label: "Limited", items: preview.limited, tone: "text-warning-text" },
    { label: "No access", items: preview.none, tone: "text-text-muted" },
  ].filter((row) => row.items.length > 0);

  return (
    <div className="mt-5 border-t border-border pt-5">
      <p className="text-sm font-medium text-text-primary">Access preview</p>
      <dl className="mt-2.5 space-y-2">
        {rows.map((row) => (
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
      <p className="mt-2 text-meta text-text-muted">
        “Limited” means the role can look at a module but cannot change anything
        in it.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Members and activity tabs                                                  */
/* -------------------------------------------------------------------------- */

function RoleMembers({
  role,
  members,
}: {
  role: WorkspaceRole;
  members: typeof WORKSPACE_MEMBERS;
}) {
  if (members.length === 0) {
    return (
      <EmptyState
        title="Nobody holds this role"
        description={
          role.status === "archived"
            ? "Archived roles cannot be assigned to anyone."
            : "Assign it from Team Members when you invite or edit someone."
        }
        action={
          <ButtonLink href={WORKSPACE_ROUTES.team} variant="outline" size="sm">
            Go to Team Members
          </ButtonLink>
        }
      />
    );
  }

  return (
    <Card>
      <CardHeader
        title={`${members.length} ${members.length === 1 ? "member" : "members"}`}
        description="Everyone who gains or loses access when this role changes."
        action={
          <ButtonLink href={WORKSPACE_ROUTES.team} variant="outline" size="sm">
            Manage in Team
          </ButtonLink>
        }
      />
      <CardBody className="p-2">
        <ul className="space-y-0.5">
          {members.map((member) => (
            <li key={member.id}>
              <Link
                href={WORKSPACE_ROUTES.team}
                className="flex items-center gap-3 rounded-panel px-3 py-2.5 transition-colors hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none"
              >
                <AvatarLabel
                  name={member.name}
                  secondary={member.email}
                  size="sm"
                  className="min-w-0 flex-1"
                />
                <span className="shrink-0 text-meta text-text-muted">
                  {member.lastActiveAt
                    ? formatRelativeTime(member.lastActiveAt, WORKSPACE_NOW_MS)
                    : "Never signed in"}
                </span>
                <ChevronRight className="size-4 shrink-0 text-text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

/**
 * What has been done to this role.
 *
 * The narrow view of the workspace audit trail, scoped to one role. The same
 * events appear on the Activity page, where they can be correlated with
 * everything else; here they answer "why does this role look like this".
 */
function RoleActivity({ roleId }: { roleId: string }) {
  /* Anything recorded in this session sits above the fixture's history, so a
     change made a moment ago is visible where it was made. */
  const session = useSessionRoleEvents(roleId);
  const events = [...session, ...roleActivity(roleId)];

  if (events.length === 0) {
    return (
      <EmptyState
        title="No changes recorded"
        description="Edits to this role's permissions and membership will appear here."
      />
    );
  }

  return (
    <Card>
      <CardHeader
        title="Role history"
        description="Permission and membership changes, newest first."
        action={
          <ButtonLink href={WORKSPACE_ROUTES.activity} variant="outline" size="sm">
            Full audit trail
          </ButtonLink>
        }
      />
      <CardBody>
        <ul className="divide-y divide-border">
          {events.map((event) => (
            <li key={event.id} className="py-3.5 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-text-primary">
                  {event.actorName} - {event.summary}
                </p>
                <p className="text-meta text-text-muted">
                  {formatRelativeTime(event.createdAt, WORKSPACE_NOW_MS)}
                </p>
              </div>

              {event.added.length > 0 || event.removed.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {event.added.map((key) => (
                    <Badge key={key} tone="success" size="sm" className="normal-case">
                      + {prettyKey(key)}
                    </Badge>
                  ))}
                  {event.removed.map((key) => (
                    <Badge key={key} tone="danger" size="sm" className="normal-case">
                      − {prettyKey(key)}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {event.affectedMembers > 0 ? (
                <p className="mt-1.5 text-meta text-text-muted">
                  Affected {event.affectedMembers}{" "}
                  {event.affectedMembers === 1 ? "member" : "members"}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

/** `contacts.export` → `Contacts · Export`, using the catalogue's own labels. */
function prettyKey(key: string): string {
  const [resource, action] = key.split(".");
  return permissionLabel(resource, action as PermissionAction);
}
