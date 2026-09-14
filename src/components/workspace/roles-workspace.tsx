"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Copy, Plus, ShieldCheck, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { AvatarLabel } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { TOTAL_PERMISSIONS, WORKSPACE_ROUTES } from "@/constants/workspace";
import { WORKSPACE_NOW } from "@/lib/workspace-clock";
import {
  CURRENT_MEMBER,
  WORKSPACE_MEMBERS,
  WORKSPACE_ROLES,
  grantCount,
  lockoutWarning,
  membersWithRole,
  roleById,
} from "@/lib/workspace-fixtures";
import { cn } from "@/lib/utils";
import type { PermissionAction, WorkspaceRole } from "@/types/workspace";
import { PermissionMatrix } from "./permission-matrix";
import {
  permissionHint,
  useWorkspacePermissions,
} from "./use-workspace-permissions";
import { RoleTypeBadge } from "./workspace-badges";

/**
 * Roles & Permissions — what workspace members can reach.
 *
 * A master/detail layout rather than a table of roles that opens a modal: the
 * permission matrix is the page, and burying it behind a dialog makes comparing
 * two roles a matter of memory. The list stays visible so switching between
 * Marketing Manager and Junior Marketer is one click and the matrix redraws
 * beside it.
 *
 * Two protections are enforced here rather than left to the backend to reject:
 * the Owner role cannot be edited or deleted, and a member cannot remove the
 * permission that governs permissions from the role they themselves hold. Both
 * are unrecoverable from inside the product.
 */
export function RolesWorkspace() {
  const toast = useToast();
  const permissions = useWorkspacePermissions();

  const [roles, setRoles] = useState<WorkspaceRole[]>(WORKSPACE_ROLES);
  const [selectedId, setSelectedId] = useState(roles[0]?.id ?? "");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<WorkspaceRole | null>(null);
  const [dirty, setDirty] = useState(false);

  const role = roles.find((item) => item.id === selectedId) ?? roles[0];
  const members = useMemo(
    () => (role ? membersWithRole(role.id, WORKSPACE_MEMBERS) : []),
    [role],
  );

  /* The Owner's grant map is the definition of full access — editing it would
     let a workspace lock its own owner out of something. */
  const isOwnerRole = role?.id === "role_owner";
  const editable = permissions.canManageRoles && !isOwnerRole;

  function toggle(resource: string, action: PermissionAction, next: boolean) {
    if (!role) return;

    setRoles((current) =>
      current.map((item) => {
        if (item.id !== role.id) return item;

        const actions = item.grants[resource] ?? [];
        const updated = next
          ? [...actions, action]
          : actions.filter((value) => value !== action);

        return {
          ...item,
          grants: { ...item.grants, [resource]: updated },
          updatedAt: WORKSPACE_NOW,
        };
      }),
    );
    setDirty(true);
  }

  const customRoles = roles.filter((item) => item.type === "custom");

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description="Control what workspace members can view, create, edit and manage."
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
       * Role list beside the matrix on a desktop, stacked below `xl`.
       *
       * 19rem holds the longest role name plus its member count without
       * wrapping; narrower and "Marketing Manager · 4 members" breaks over two
       * lines on every row.
       */}
      <div className="grid gap-6 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="min-w-0">
          <Card className="overflow-hidden">
            <CardHeader
              title="Roles"
              description={`${roles.length} roles · ${TOTAL_PERMISSIONS} permissions`}
            />
            <CardBody className="p-2">
              <ul className="space-y-0.5">
                {roles.map((item) => {
                  const count = membersWithRole(item.id, WORKSPACE_MEMBERS).length;
                  const active = item.id === role?.id;

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(item.id);
                          setDirty(false);
                        }}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "w-full rounded-panel px-3 py-2.5 text-left transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                          active
                            ? "bg-primary-soft"
                            : "hover:bg-surface-secondary",
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "truncate text-sm font-semibold",
                              active ? "text-primary-dark" : "text-text-primary",
                            )}
                          >
                            {item.name}
                          </span>
                          <span className="shrink-0 text-meta text-text-muted tabular-nums">
                            {count}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-meta text-text-muted">
                          {item.description}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

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
              <Card className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold">{role.name}</h2>
                      <RoleTypeBadge type={role.type} />
                    </div>
                    <p className="mt-1 max-w-xl text-sm text-text-secondary">
                      {role.description}
                    </p>
                  </div>

                  {role.type === "custom" && permissions.canManageRoles ? (
                    <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast("Role duplicated", "success")}
                      >
                        <Copy aria-hidden />
                        Duplicate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleting(role)}
                        className="text-error hover:border-error hover:bg-error-soft hover:text-error"
                      >
                        <Trash2 aria-hidden />
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </div>

                <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
                  <div>
                    <dt className="text-meta font-medium text-text-muted">Members</dt>
                    <dd className="mt-1 text-sm font-semibold text-text-primary">
                      {members.length}{" "}
                      {members.length === 1 ? "member" : "members"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-meta font-medium text-text-muted">
                      Permissions
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-text-primary">
                      {grantCount(role.grants)} of {TOTAL_PERMISSIONS} granted
                    </dd>
                  </div>
                  <div>
                    <dt className="text-meta font-medium text-text-muted">Type</dt>
                    <dd className="mt-1 text-sm font-semibold text-text-primary">
                      {role.type === "system"
                        ? "System role — cannot be deleted"
                        : `Created by ${role.createdBy ?? "a teammate"}`}
                    </dd>
                  </div>
                </dl>

                {members.length > 0 ? (
                  <div className="mt-5 border-t border-border pt-5">
                    <p className="text-sm font-medium text-text-primary">
                      Members using this role
                    </p>
                    <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-2.5">
                      {members.map((member) => (
                        <li key={member.id}>
                          <Link
                            href={WORKSPACE_ROUTES.team}
                            className="rounded-btn focus-visible:shadow-focus focus-visible:outline-none"
                          >
                            <AvatarLabel
                              name={member.name}
                              secondary={member.email}
                              size="sm"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Card>

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

              <Card>
                <CardHeader
                  title="Permissions"
                  description={
                    editable
                      ? "Expand a module to change what this role can reach."
                      : "Read-only. You need Manage roles to change these."
                  }
                  action={
                    dirty ? (
                      <div className="flex items-center gap-2.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRoles(WORKSPACE_ROLES);
                            setDirty(false);
                          }}
                        >
                          Discard
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setDirty(false);
                            toast(`${role.name} permissions saved`, "success");
                          }}
                        >
                          Save changes
                        </Button>
                      </div>
                    ) : undefined
                  }
                />
                <CardBody>
                  <PermissionMatrix
                    grants={role.grants}
                    onToggle={toggle}
                    readOnly={!editable}
                    guard={(resource, action, next) =>
                      isOwnerRole
                        ? "The Owner role is fixed at full access."
                        : lockoutWarning(role.id, resource, action, next)
                    }
                  />
                </CardBody>
              </Card>

              {role.id === CURRENT_MEMBER.roleId && editable ? (
                <p className="flex items-start gap-2.5 rounded-card border border-warning-soft bg-warning-soft px-4 py-3.5 text-sm text-warning-text">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    This is your own role. Permissions that would lock you out of
                    managing the workspace are held open — everything else you
                    turn off applies to you as soon as it is saved.
                  </span>
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {creating ? (
        <CreateRoleDialog
          open
          roles={roles}
          onClose={() => setCreating(false)}
          onCreate={(next) => {
            setRoles((current) => [...current, next]);
            setSelectedId(next.id);
            toast(`${next.name} created`, "success");
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          setRoles((current) => current.filter((item) => item.id !== deleting.id));
          setSelectedId("role_owner");
          toast(`${deleting.name} deleted`, "info");
          setDeleting(null);
        }}
        title={deleting ? `Delete ${deleting.name}?` : "Delete role?"}
        description="Members holding this role need a new one before they can sign in."
        confirmLabel="Delete Role"
      >
        <p className="text-sm text-text-secondary">
          {deleting
            ? membersWithRole(deleting.id, WORKSPACE_MEMBERS).length > 0
              ? `${membersWithRole(deleting.id, WORKSPACE_MEMBERS).length} member(s) currently hold this role and will be moved to Viewer until you reassign them.`
              : "Nobody holds this role, so nothing changes for your team."
            : null}
        </p>
      </ConfirmDialog>
    </>
  );
}

/**
 * Creating a custom role.
 *
 * It starts from an existing role rather than from nothing. Building a
 * permission set from sixty-one empty checkboxes is a job nobody finishes
 * correctly; "Marketing Manager, minus publishing" is how merchants actually
 * think about it, and the base-role picker is what lets them say it.
 */
function CreateRoleDialog({
  open,
  roles,
  onClose,
  onCreate,
}: {
  open: boolean;
  roles: WorkspaceRole[];
  onClose: () => void;
  onCreate: (role: WorkspaceRole) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [baseId, setBaseId] = useState("role_manager");
  const [touched, setTouched] = useState(false);

  const duplicate = roles.some(
    (role) => role.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );
  const error = !name.trim()
    ? "Give the role a name."
    : duplicate
      ? "A role with that name already exists."
      : null;

  const base = roleById(baseId);

  function submit() {
    setTouched(true);
    if (error || !base) return;

    onCreate({
      id: `role_custom_${Date.now().toString(36)}`,
      name: name.trim(),
      description:
        description.trim() || `Custom permission set based on ${base.name}.`,
      type: "custom",
      /* A copy, not a reference — editing the new role must not edit its base. */
      grants: Object.fromEntries(
        Object.entries(base.grants).map(([key, actions]) => [key, [...actions]]),
      ),
      createdAt: WORKSPACE_NOW,
      updatedAt: WORKSPACE_NOW,
      createdBy: CURRENT_MEMBER.name,
    });
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create custom role"
      description="Start from an existing role, then narrow it on the next screen."
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button size="compact" onClick={submit}>
            Create Role
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field
          label="Role name"
          htmlFor="role-name"
          error={touched ? (error ?? undefined) : undefined}
        >
          <Input
            id="role-name"
            value={name}
            error={touched && Boolean(error)}
            placeholder="Junior Marketer"
            onChange={(event) => setName(event.target.value)}
          />
        </Field>

        <Field
          label="Description"
          htmlFor="role-description"
          hint="Shown in the role list and when assigning someone to it."
        >
          <Textarea
            id="role-description"
            value={description}
            maxLength={160}
            placeholder="Marketing Manager without publishing or contact export."
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <Field
          label="Base role"
          htmlFor="role-base"
          hint="The new role starts with a copy of this one's permissions."
        >
          <Select
            id="role-base"
            label="Base role"
            hideLabel={false}
            value={baseId}
            onChange={setBaseId}
            options={roles.map((role) => ({
              value: role.id,
              label: role.name,
              hint: `${grantCount(role.grants)} permissions`,
            }))}
          />
        </Field>

        {base ? (
          <p className="rounded-panel border border-border bg-surface-secondary px-3.5 py-3 text-sm text-text-secondary">
            Starts with {grantCount(base.grants)} of {TOTAL_PERMISSIONS}{" "}
            permissions. You can remove any of them straight after creating it.
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
