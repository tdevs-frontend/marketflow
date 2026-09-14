"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Tooltip } from "@/components/ui/tooltip";
import {
  PERMISSION_ACTION_LABEL,
  PERMISSION_ACTION_ORDER,
  PERMISSION_GROUPS,
} from "@/constants/workspace";
import { cn } from "@/lib/utils";
import type {
  PermissionAction,
  PermissionGroup as PermissionGroupType,
  RoleGrants,
} from "@/types/workspace";

/**
 * The permission matrix.
 *
 * Sixty-one permissions across eight modules is a wall if rendered flat, so the
 * groups are accordions and only the first opens by default. Progressive
 * disclosure is not decoration here: a merchant adjusting one thing about
 * campaigns should never have to scroll past commerce and billing to reach it.
 *
 * Each resource renders only the actions it declares, so the grid has ragged
 * rows rather than a rectangle of mostly-empty cells. A permanently blank
 * "Publish" under Contacts would teach a reader to stop checking the columns.
 *
 * Two layouts, one state. Above `lg` it is a real grid with the action names as
 * a header row; below it each resource becomes a card of labelled checkboxes,
 * because a seven-column matrix on a phone is either unreadable or a horizontal
 * scroll inside a vertical one.
 */
export function PermissionMatrix({
  grants,
  onToggle,
  readOnly = false,
  /** Returns a reason to refuse, or `null` to allow. Drives the lockout guard. */
  guard,
  className,
}: {
  grants: RoleGrants;
  onToggle: (resource: string, action: PermissionAction, next: boolean) => void;
  readOnly?: boolean;
  guard?: (resource: string, action: PermissionAction, next: boolean) => string | null;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {PERMISSION_GROUPS.map((group, index) => (
        <PermissionGroup
          key={group.key}
          group={group}
          grants={grants}
          onToggle={onToggle}
          readOnly={readOnly}
          guard={guard}
          defaultOpen={index === 0}
        />
      ))}
    </div>
  );
}

/**
 * One module's permissions.
 *
 * The header carries the group's own select-all, which is the control most
 * used: "give this role everything in Marketing" is a sentence a merchant
 * actually thinks, and making them tick twenty-three boxes to say it is what
 * makes permission editors feel like paperwork.
 */
export function PermissionGroup({
  group,
  grants,
  onToggle,
  readOnly,
  guard,
  defaultOpen = false,
}: {
  group: PermissionGroupType;
  grants: RoleGrants;
  onToggle: (resource: string, action: PermissionAction, next: boolean) => void;
  readOnly?: boolean;
  guard?: (resource: string, action: PermissionAction, next: boolean) => string | null;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const total = group.resources.reduce(
    (sum, resource) => sum + resource.actions.length,
    0,
  );
  const granted = group.resources.reduce(
    (sum, resource) => sum + (grants[resource.key]?.length ?? 0),
    0,
  );
  const all = granted === total;

  /** The actions this group actually uses, in the house order. */
  const columns = PERMISSION_ACTION_ORDER.filter((action) =>
    group.resources.some((resource) => resource.actions.includes(action)),
  );

  function setGroup(next: boolean) {
    for (const resource of group.resources) {
      for (const action of resource.actions) {
        const has = grants[resource.key]?.includes(action) ?? false;
        if (has === next) continue;
        if (guard?.(resource.key, action, next)) continue;
        onToggle(resource.key, action, next);
      }
    }
  }

  const panelId = `perm-${group.key}`;

  return (
    <section className="rounded-panel border border-border">
      <div className="flex items-center gap-3 px-3.5 py-3">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-btn text-left focus-visible:shadow-focus focus-visible:outline-none"
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-text-muted transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
          <Icon name={group.icon} className="size-4 shrink-0 text-text-muted" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-text-primary">
              {group.label}
            </span>
            <span className="block truncate text-meta text-text-muted">
              {group.description}
            </span>
          </span>
        </button>

        <span className="shrink-0 text-meta text-text-muted tabular-nums">
          {granted}/{total}
        </span>

        {readOnly ? null : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGroup(!all)}
            className="shrink-0"
          >
            {all ? "Clear all" : "Select all"}
          </Button>
        )}
      </div>

      {open ? (
        <div id={panelId} className="border-t border-border">
          {/* Desktop: a real grid, with the action names once at the top. */}
          <div className="hidden lg:block">
            <div
              className="grid items-center gap-x-3 border-b border-border px-3.5 py-2"
              style={{
                gridTemplateColumns: `minmax(0,1fr) repeat(${columns.length}, 5.5rem)`,
              }}
            >
              <span className="text-meta font-medium text-text-muted">Resource</span>
              {columns.map((action) => (
                <span
                  key={action}
                  className="text-center text-meta font-medium text-text-muted"
                >
                  {PERMISSION_ACTION_LABEL[action]}
                </span>
              ))}
            </div>

            {group.resources.map((resource) => (
              <div
                key={resource.key}
                className="grid items-center gap-x-3 border-b border-border px-3.5 py-2.5 last:border-0"
                style={{
                  gridTemplateColumns: `minmax(0,1fr) repeat(${columns.length}, 5.5rem)`,
                }}
              >
                <ResourceLabel resource={resource} />

                {columns.map((action) => {
                  const supported = resource.actions.includes(action);
                  if (!supported) {
                    return (
                      <span
                        key={action}
                        aria-hidden
                        className="text-center text-sm text-border-strong"
                      >
                        —
                      </span>
                    );
                  }

                  return (
                    <span key={action} className="flex justify-center">
                      <PermissionCheckbox
                        resource={resource.key}
                        resourceLabel={resource.label}
                        action={action}
                        checked={grants[resource.key]?.includes(action) ?? false}
                        onToggle={onToggle}
                        readOnly={readOnly}
                        guard={guard}
                      />
                    </span>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Mobile: one card per resource, each checkbox carrying its own word. */}
          <div className="divide-y divide-border lg:hidden">
            {group.resources.map((resource) => (
              <div key={resource.key} className="px-3.5 py-3">
                <ResourceLabel resource={resource} />

                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2.5">
                  {resource.actions.map((action) => (
                    <label
                      key={action}
                      className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary"
                    >
                      <PermissionCheckbox
                        resource={resource.key}
                        resourceLabel={resource.label}
                        action={action}
                        checked={grants[resource.key]?.includes(action) ?? false}
                        onToggle={onToggle}
                        readOnly={readOnly}
                        guard={guard}
                      />
                      {PERMISSION_ACTION_LABEL[action]}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ResourceLabel({
  resource,
}: {
  resource: PermissionGroupType["resources"][number];
}) {
  return (
    <span className="min-w-0">
      <span className="flex items-center gap-1.5">
        <span className="truncate text-sm font-medium text-text-primary">
          {resource.label}
        </span>
        {resource.href ? (
          /* A permission row that links to what it governs. Answers "what does
             this actually control" without leaving the page guessing. */
          <Link
            href={resource.href}
            className="shrink-0 rounded-btn text-text-muted transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
            aria-label={`Open ${resource.label}`}
          >
            <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        ) : null}
      </span>
      {resource.hint ? (
        <span className="mt-0.5 block text-meta text-text-muted">{resource.hint}</span>
      ) : null}
    </span>
  );
}

/**
 * One cell.
 *
 * A refused toggle renders as a lock with the reason in a tooltip rather than
 * as a checkbox that silently does nothing — the guard exists to stop a
 * specific mistake, and a control that ignores a click without explanation
 * reads as a bug.
 */
function PermissionCheckbox({
  resource,
  resourceLabel,
  action,
  checked,
  onToggle,
  readOnly,
  guard,
}: {
  resource: string;
  resourceLabel: string;
  action: PermissionAction;
  checked: boolean;
  onToggle: (resource: string, action: PermissionAction, next: boolean) => void;
  readOnly?: boolean;
  guard?: (resource: string, action: PermissionAction, next: boolean) => string | null;
}) {
  const refusal = guard?.(resource, action, !checked) ?? null;
  const label = `${resourceLabel} — ${PERMISSION_ACTION_LABEL[action]}`;

  if (refusal) {
    return (
      <Tooltip content={refusal}>
        <span
          className="grid size-4.5 place-items-center rounded-[5px] border border-border-strong bg-surface-secondary text-text-muted"
          role="img"
          aria-label={`${label} — locked. ${refusal}`}
          tabIndex={0}
        >
          <Lock className="size-2.5" aria-hidden />
        </span>
      </Tooltip>
    );
  }

  return (
    <Checkbox
      checked={checked}
      disabled={readOnly}
      onCheckedChange={(next) => onToggle(resource, action, next)}
      label={label}
    />
  );
}
