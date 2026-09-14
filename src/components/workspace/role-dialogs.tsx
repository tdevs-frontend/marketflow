"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
  ShieldAlert,
  Users,
} from "lucide-react";

import { AvatarLabel } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, Drawer } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Select } from "@/components/ui/select";
import {
  PERMISSION_ACTION_LABEL,
  PERMISSION_GROUPS,
  PERMISSION_PRESETS,
  TOTAL_PERMISSIONS,
  applyDependencies,
} from "@/constants/workspace";
import { WORKSPACE_NOW } from "@/lib/workspace-clock";
import {
  CURRENT_MEMBER,
  grantCount,
  membersWithRole,
  permissionDeltas,
  riskLevel,
  sensitiveGrants,
} from "@/lib/workspace-fixtures";
import { cn } from "@/lib/utils";
import type {
  PermissionAction,
  RoleGrants,
  WorkspaceMember,
  WorkspaceRole,
} from "@/types/workspace";
import { PermissionMatrix, SensitiveSummary } from "./permission-matrix";
import { RiskBadge } from "./workspace-badges";

/* -------------------------------------------------------------------------- */
/* Create                                                                     */
/* -------------------------------------------------------------------------- */

const STEPS = ["Details", "Starting point", "Permissions", "Review"] as const;
type StepIndex = 0 | 1 | 2 | 3;

/**
 * Creating a custom role.
 *
 * A drawer with four steps rather than a dialog with one long form, because
 * step two decides what step three contains — and a merchant who picks
 * "Marketing" then sees 38 permissions already ticked understands the role they
 * are making far better than one who arrives at an empty grid.
 *
 * Starting empty is offered and is not the default. Building a coherent
 * permission set from a hundred cleared checkboxes is a job nobody finishes
 * correctly; the result is either too wide or missing a prerequisite.
 *
 * State is mount-scoped — callers render this only while open — so an abandoned
 * role leaves nothing behind for the next one.
 */
export function CreateRoleDrawer({
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
  const [step, setStep] = useState<StepIndex>(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("preset_marketing");
  const [grants, setGrants] = useState<RoleGrants>({});
  const [touched, setTouched] = useState(false);

  const duplicate = roles.some(
    (role) => role.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );
  const nameError = !name.trim()
    ? "Give the role a name."
    : duplicate
      ? "A role with that name already exists."
      : null;

  /** Presets and existing roles offered as one list — both are just grants. */
  const sources = [
    ...PERMISSION_PRESETS.map((preset) => ({
      id: preset.id,
      label: preset.label,
      description: preset.description,
      icon: preset.icon,
      kind: "preset" as const,
      grants: preset.grants,
    })),
    ...roles
      .filter((role) => role.status === "active")
      .map((role) => ({
        id: role.id,
        label: role.name,
        description: `Copy of an existing role — ${grantCount(role.grants)} permissions.`,
        icon: role.type === "custom" ? "user-cog" : "shield-check",
        kind: "role" as const,
        grants: role.grants,
      })),
  ];

  function chooseSource(id: string) {
    setSource(id);
    const chosen = sources.find((item) => item.id === id);
    /* Deep copy — editing the new role must never edit its source. */
    setGrants(
      Object.fromEntries(
        Object.entries(chosen?.grants ?? {}).map(([key, actions]) => [
          key,
          [...actions],
        ]),
      ),
    );
  }

  function toggle(resource: string, action: PermissionAction, next: boolean) {
    setGrants((current) => applyDependencies(current, resource, action, next).grants);
  }

  function next() {
    if (step === 0) {
      setTouched(true);
      if (nameError) return;
      /* Seed the grants the first time we leave step one. */
      if (Object.keys(grants).length === 0) chooseSource(source);
    }
    setStep((current) => Math.min(current + 1, 3) as StepIndex);
  }

  function create() {
    onCreate({
      id: `role_custom_${Date.now().toString(36)}`,
      name: name.trim(),
      description:
        description.trim() ||
        `Custom permission set based on ${sources.find((item) => item.id === source)?.label ?? "a preset"}.`,
      type: "custom",
      status: "active",
      grants,
      createdAt: WORKSPACE_NOW,
      updatedAt: WORKSPACE_NOW,
      createdBy: CURRENT_MEMBER.name,
      updatedBy: CURRENT_MEMBER.name,
    });
    onClose();
  }

  const sensitive = sensitiveGrants(grants);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Create custom role"
      description="Four steps. Nothing is created until the last one."
      footer={
        <div className="flex items-center justify-between gap-2.5">
          <Button
            variant="ghost"
            size="compact"
            onClick={() =>
              step === 0 ? onClose() : setStep((s) => (s - 1) as StepIndex)
            }
          >
            {step === 0 ? "Cancel" : <ArrowLeft aria-hidden />}
            {step === 0 ? null : "Back"}
          </Button>

          {step === 3 ? (
            <Button size="compact" onClick={create}>
              <Check aria-hidden />
              Create Role
            </Button>
          ) : (
            <Button size="compact" onClick={next}>
              Continue
              <ArrowRight aria-hidden />
            </Button>
          )}
        </div>
      }
    >
      <ol className="flex items-center gap-1.5">
        {STEPS.map((label, index) => {
          const done = index < step;
          const active = index === step;

          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className="flex min-w-0 flex-1 items-center gap-1.5"
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full text-[0.6875rem] font-bold transition-colors",
                  done
                    ? "bg-primary text-white"
                    : active
                      ? "bg-primary-soft text-primary-dark"
                      : "bg-surface-secondary text-text-muted",
                )}
              >
                {done ? <Check className="size-3" aria-hidden /> : index + 1}
              </span>
              <span
                className={cn(
                  "truncate text-meta font-medium",
                  active ? "text-text-primary" : "text-text-muted",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-5">
        {step === 0 ? (
          <div className="space-y-4">
            <Field
              label="Role name"
              htmlFor="new-role-name"
              error={touched ? (nameError ?? undefined) : undefined}
            >
              <Input
                id="new-role-name"
                value={name}
                error={touched && Boolean(nameError)}
                placeholder="Campaign Specialist"
                onChange={(event) => setName(event.target.value)}
              />
            </Field>

            <Field
              label="Description"
              htmlFor="new-role-description"
              hint="Shown in the role list and when assigning someone to it."
            >
              <Textarea
                id="new-role-description"
                value={description}
                maxLength={160}
                placeholder="Builds and schedules campaigns without publishing them."
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-2.5">
            <p className="text-sm text-text-secondary">
              Start from a preset or copy an existing role. You can change
              everything on the next step.
            </p>

            {sources.map((item) => {
              const selected = item.id === source;

              return (
                <label
                  key={item.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-panel border p-3.5 transition-all focus-within:shadow-focus",
                    selected
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-surface hover:border-border-strong hover:bg-surface-secondary",
                  )}
                >
                  <input
                    type="radio"
                    name="role-source"
                    value={item.id}
                    checked={selected}
                    onChange={() => chooseSource(item.id)}
                    className="sr-only"
                  />
                  <span className="grid size-8 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-secondary">
                    <Icon name={item.icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          selected ? "text-primary-dark" : "text-text-primary",
                        )}
                      >
                        {item.label}
                      </span>
                      <Badge size="sm" className="normal-case">
                        {item.kind === "preset" ? "Preset" : "Existing role"}
                      </Badge>
                    </span>
                    <span className="mt-0.5 block text-sm text-text-secondary">
                      {item.description}
                    </span>
                  </span>
                  {selected ? (
                    <span
                      aria-hidden
                      className="grid size-4.5 shrink-0 place-items-center rounded-full bg-primary text-white"
                    >
                      <Check className="size-3" />
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        ) : null}

        {step === 2 ? (
          <PermissionMatrix grants={grants} onToggle={toggle} />
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="rounded-panel border border-border bg-surface-secondary px-3.5 py-3">
              <p className="text-sm font-semibold text-text-primary">{name.trim()}</p>
              <p className="mt-0.5 text-sm text-text-secondary">
                {description.trim() || "No description."}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              <SummaryTile
                label="Permissions"
                value={`${grantCount(grants)} / ${TOTAL_PERMISSIONS}`}
              />
              <SummaryTile label="Risk level" value={<RiskBadge level={riskLevel(grants)} />} />
              <SummaryTile
                label="Modules"
                value={`${
                  PERMISSION_GROUPS.filter((group) =>
                    group.resources.some((r) => (grants[r.key]?.length ?? 0) > 0),
                  ).length
                } / ${PERMISSION_GROUPS.length}`}
              />
              <SummaryTile label="Members" value="0 — assign after creating" />
            </dl>

            {sensitive.length > 0 ? (
              <div className="rounded-panel border border-warning-soft bg-warning-soft px-3.5 py-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-warning-text">
                  <ShieldAlert className="size-4 shrink-0" aria-hidden />
                  {sensitive.length} sensitive{" "}
                  {sensitive.length === 1 ? "permission" : "permissions"}
                </p>
                <ul className="mt-2 space-y-1">
                  {sensitive.slice(0, 6).map((item) => (
                    <li
                      key={`${item.resource}.${item.action}`}
                      className="text-sm text-warning-text"
                    >
                      • {item.resource.replace(/_/g, " ")} —{" "}
                      {PERMISSION_ACTION_LABEL[item.action]}
                    </li>
                  ))}
                </ul>
                {sensitive.length > 6 ? (
                  <p className="mt-1.5 text-meta text-warning-text">
                    …and {sensitive.length - 6} more.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Drawer>
  );
}

function SummaryTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-panel border border-border px-3.5 py-3">
      <dt className="text-meta font-medium text-text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-text-primary">{value}</dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Change summary                                                             */
/* -------------------------------------------------------------------------- */

/**
 * What is about to change, before it does.
 *
 * The last thing between an edit and everyone holding the role losing access.
 * Removals are listed first and counted separately because they are the half
 * that breaks somebody's day; additions are reviewed second. The member count
 * turns an abstract permission edit into "this affects two people right now".
 */
export function ChangeSummaryDialog({
  role,
  before,
  after,
  members,
  open,
  onClose,
  onConfirm,
}: {
  role: WorkspaceRole | null;
  before: RoleGrants;
  after: RoleGrants;
  members: WorkspaceMember[];
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const deltas = useMemo(
    () => (role ? permissionDeltas(before, after) : []),
    [before, after, role],
  );

  if (!role) return null;

  const removed = deltas.filter((delta) => !delta.granted);
  const added = deltas.filter((delta) => delta.granted);
  const sensitiveAdded = added.filter((delta) => delta.sensitive);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={`Save changes to ${role.name}?`}
      description={`${deltas.length} permission ${deltas.length === 1 ? "change" : "changes"}`}
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="compact"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {members.length > 0 ? (
          <div className="flex items-start gap-3 rounded-panel border border-border bg-surface-secondary px-3.5 py-3">
            <Users className="mt-0.5 size-4 shrink-0 text-text-muted" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">
                These changes affect {members.length}{" "}
                {members.length === 1 ? "member" : "members"} immediately
              </p>
              <p className="mt-1 text-sm text-text-secondary font-medium">
                {members.map((member) => member.name).join(", ")}
              </p>
            </div>
          </div>
        ) : (
          <p className="rounded-panel border border-border bg-surface-secondary px-3.5 py-3 text-sm text-text-secondary">
            Nobody holds this role yet, so nothing changes for your team today.
          </p>
        )}

        {removed.length > 0 ? (
          <DeltaList
            title={`Removed (${removed.length})`}
            tone="removed"
            deltas={removed}
          />
        ) : null}

        {added.length > 0 ? (
          <DeltaList title={`Added (${added.length})`} tone="added" deltas={added} />
        ) : null}

        {sensitiveAdded.length > 0 ? (
          <p className="flex items-start gap-2.5 rounded-panel border border-warning-soft bg-warning-soft px-3.5 py-3 text-sm text-warning-text">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {sensitiveAdded.length} of the additions{" "}
              {sensitiveAdded.length === 1 ? "is" : "are"} sensitive. Everyone
              holding this role gains{" "}
              {sensitiveAdded.length === 1 ? "it" : "them"} as soon as you save.
            </span>
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}

function DeltaList({
  title,
  tone,
  deltas,
}: {
  title: string;
  tone: "added" | "removed";
  deltas: { resourceLabel: string; actionLabel: string; sensitive: boolean }[];
}) {
  return (
    <section>
      <h3
        className={cn(
          "text-sm font-semibold",
          tone === "added" ? "text-success-text" : "text-error-text",
        )}
      >
        {title}
      </h3>
      <ul className="mt-2 space-y-1">
        {deltas.map((delta) => (
          <li
            key={`${delta.resourceLabel}.${delta.actionLabel}`}
            className="flex items-center gap-2 rounded-panel bg-surface-secondary px-3 py-2 text-sm"
          >
            {tone === "added" ? (
              <Check className="size-3.5 shrink-0 text-success-text" aria-hidden />
            ) : (
              <Minus className="size-3.5 shrink-0 text-error-text" aria-hidden />
            )}
            <span className="min-w-0 flex-1 text-text-primary">
              {delta.resourceLabel} · {delta.actionLabel}
            </span>
            {delta.sensitive ? (
              <Badge tone="warning" size="sm" className="normal-case">
                Sensitive
              </Badge>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Delete                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Deleting a custom role, with somewhere for its members to go.
 *
 * The earlier version of this told a merchant that "members need a new role
 * before they can sign in" and then deleted the role anyway, which is a warning
 * that creates the problem it describes. This makes the fix part of the action:
 * pick the replacement, and the members are moved as the role is removed.
 */
export function DeleteRoleDialog({
  role,
  roles,
  members,
  open,
  onClose,
  onConfirm,
}: {
  role: WorkspaceRole | null;
  roles: WorkspaceRole[];
  members: WorkspaceMember[];
  open: boolean;
  onClose: () => void;
  onConfirm: (role: WorkspaceRole, reassignToId: string | null) => void;
}) {
  const [reassignTo, setReassignTo] = useState("");

  if (!role) return null;

  const holders = membersWithRole(role.id, members);
  const needsReassign = holders.length > 0;

  const candidates = roles.filter(
    (candidate) => candidate.id !== role.id && candidate.status === "active",
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Delete ${role.name}?`}
      description={
        needsReassign
          ? "Choose where its members go before it is removed."
          : "Nobody holds this role, so nothing changes for your team."
      }
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="compact"
            disabled={needsReassign && !reassignTo}
            onClick={() => {
              onConfirm(role, reassignTo || null);
              onClose();
            }}
          >
            {needsReassign ? "Reassign & Delete" : "Delete Role"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {needsReassign ? (
          <>
            <p className="text-sm text-text-secondary">
              {holders.length} {holders.length === 1 ? "member" : "members"}{" "}
              currently use this role:
            </p>

            <ul className="space-y-1.5">
              {holders.map((member) => (
                <li
                  key={member.id}
                  className="rounded-panel bg-surface-secondary px-3 py-2"
                >
                  <AvatarLabel
                    name={member.name}
                    secondary={member.email}
                    size="sm"
                  />
                </li>
              ))}
            </ul>

            <Field
              label="Reassign members to"
              htmlFor="reassign-role"
              hint="Applied the moment the role is deleted, so nobody loses access."
            >
              <Select
                id="reassign-role"
                label="Reassign members to"
                hideLabel={false}
                value={reassignTo}
                onChange={setReassignTo}
                placeholder="Choose a role…"
                options={candidates.map((candidate) => ({
                  value: candidate.id,
                  label: candidate.name,
                  hint: `${grantCount(candidate.grants)} permissions`,
                }))}
              />
            </Field>
          </>
        ) : null}

        <p className="text-sm text-text-secondary">
          Deleting a role cannot be undone. If you may want it back, archive it
          instead — archived roles keep their permissions and can be restored.
        </p>
      </div>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Compare                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Two roles, differences only.
 *
 * Showing every permission side by side would be two hundred rows of which a
 * dozen differ, and the dozen is the entire question — "what does Junior
 * Marketer actually lose compared to Marketing Manager". So the matching rows
 * are dropped and the count of them is reported instead.
 */
export function CompareRolesDialog({
  roles,
  initialLeft,
  open,
  onClose,
}: {
  roles: WorkspaceRole[];
  initialLeft: string;
  open: boolean;
  onClose: () => void;
}) {
  const [left, setLeft] = useState(initialLeft);
  const [right, setRight] = useState(
    roles.find((role) => role.id !== initialLeft)?.id ?? initialLeft,
  );

  const leftRole = roles.find((role) => role.id === left);
  const rightRole = roles.find((role) => role.id === right);

  const rows = useMemo(() => {
    if (!leftRole || !rightRole) return [];
    const out: {
      resource: string;
      action: PermissionAction;
      label: string;
      inLeft: boolean;
      inRight: boolean;
    }[] = [];

    for (const group of PERMISSION_GROUPS) {
      for (const resource of group.resources) {
        for (const spec of resource.actions) {
          const inLeft = leftRole.grants[resource.key]?.includes(spec.action) ?? false;
          const inRight = rightRole.grants[resource.key]?.includes(spec.action) ?? false;
          if (inLeft === inRight) continue;

          out.push({
            resource: resource.key,
            action: spec.action,
            label: `${resource.label} · ${PERMISSION_ACTION_LABEL[spec.action]}`,
            inLeft,
            inRight,
          });
        }
      }
    }

    return out;
  }, [leftRole, rightRole]);

  const shared = TOTAL_PERMISSIONS - rows.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Compare roles"
      description="Only the permissions that differ are listed."
      footer={
        <Button size="compact" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Role A" htmlFor="compare-left">
            <Select
              id="compare-left"
              label="Role A"
              hideLabel={false}
              value={left}
              onChange={setLeft}
              options={roles.map((role) => ({ value: role.id, label: role.name }))}
            />
          </Field>
          <Field label="Role B" htmlFor="compare-right">
            <Select
              id="compare-right"
              label="Role B"
              hideLabel={false}
              value={right}
              onChange={setRight}
              options={roles.map((role) => ({ value: role.id, label: role.name }))}
            />
          </Field>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-panel border border-dashed border-border-strong px-4 py-8 text-center text-sm text-text-muted">
            These two roles grant exactly the same permissions.
          </p>
        ) : (
          <>
            <p className="text-sm text-text-secondary">
              {rows.length} {rows.length === 1 ? "difference" : "differences"} ·{" "}
              {shared} permissions identical
            </p>

            <div className="overflow-hidden rounded-panel border border-border">
              <div className="grid grid-cols-[minmax(0,1fr)_5rem_5rem] items-center gap-x-3 border-b border-border bg-surface-secondary px-3.5 py-2">
                <span className="text-meta font-medium text-text-muted">
                  Permission
                </span>
                <span className="truncate text-center text-meta font-medium text-text-muted">
                  {leftRole?.name}
                </span>
                <span className="truncate text-center text-meta font-medium text-text-muted">
                  {rightRole?.name}
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {rows.map((row) => (
                  <div
                    key={`${row.resource}.${row.action}`}
                    className="grid grid-cols-[minmax(0,1fr)_5rem_5rem] items-center gap-x-3 border-b border-border px-3.5 py-2 last:border-0"
                  >
                    <span className="truncate text-sm text-text-primary">
                      {row.label}
                    </span>
                    <span className="flex justify-center">
                      <GrantMark on={row.inLeft} />
                    </span>
                    <span className="flex justify-center">
                      <GrantMark on={row.inRight} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}

function GrantMark({ on }: { on: boolean }) {
  return on ? (
    <Check className="size-4 text-success-text" aria-label="Granted" />
  ) : (
    <Minus className="size-4 text-text-muted" aria-label="Not granted" />
  );
}

/* -------------------------------------------------------------------------- */
/* Copy permissions                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Copying one module's permissions from another role.
 *
 * The partial version of "start from a role": a merchant refining Junior
 * Marketer usually wants Marketing Manager's *marketing* grants and nothing
 * else. Copying the whole role and re-narrowing seven other modules is how that
 * gets done without this.
 */
export function CopyPermissionsDialog({
  target,
  roles,
  open,
  onClose,
  onCopy,
}: {
  target: WorkspaceRole | null;
  roles: WorkspaceRole[];
  open: boolean;
  onClose: () => void;
  onCopy: (fromRoleId: string, groupKey: string) => void;
}) {
  const [fromId, setFromId] = useState("");
  const [groupKey, setGroupKey] = useState("all");

  if (!target) return null;

  const candidates = roles.filter((role) => role.id !== target.id);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Copy permissions"
      description={`Overwrite part of ${target.name} with another role's grants.`}
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="compact"
            disabled={!fromId}
            onClick={() => {
              onCopy(fromId, groupKey);
              onClose();
            }}
          >
            Copy Permissions
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Copy from" htmlFor="copy-from">
          <Select
            id="copy-from"
            label="Copy from"
            hideLabel={false}
            value={fromId}
            onChange={setFromId}
            placeholder="Choose a role…"
            options={candidates.map((role) => ({
              value: role.id,
              label: role.name,
              hint: `${grantCount(role.grants)} permissions`,
            }))}
          />
        </Field>

        <Field
          label="Which permissions"
          htmlFor="copy-scope"
          hint="Only the chosen module is overwritten. The rest of the role is untouched."
        >
          <Select
            id="copy-scope"
            label="Which permissions"
            hideLabel={false}
            value={groupKey}
            onChange={setGroupKey}
            options={[
              { value: "all", label: "Every module" },
              ...PERMISSION_GROUPS.map((group) => ({
                value: group.key,
                label: group.label,
              })),
            ]}
          />
        </Field>

        <p className="rounded-panel border border-border bg-surface-secondary px-3.5 py-3 text-sm text-text-secondary">
          This replaces the selected permissions rather than merging them. The
          change is staged like any other edit — you review it before saving.
        </p>
      </div>
    </Dialog>
  );
}

export { SensitiveSummary };
