"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ExternalLink,
  Lock,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
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
  PermissionResource,
  ResourceAction,
  RoleGrants,
} from "@/types/workspace";

/**
 * The permission editor.
 *
 * Over a hundred permissions across eight modules is a wall if rendered flat,
 * so four things work together to keep it navigable:
 *
 *   Search        - the only realistic way to reach "Export contacts" when you
 *                   already know its name. Matching groups auto-expand.
 *   Filter        - Granted / Not granted / Sensitive / Changed. "Changed" is
 *                   the one that makes reviewing your own edit possible.
 *   Tiers         - the default view shows the handful of actions most roles
 *                   differ on; destructive and rare ones sit behind Advanced.
 *   Accordions    - one group open at a time, not eight.
 *
 * Two layouts, one state. Above `lg` it is a real grid with the action names as
 * a header row; below it each resource becomes a card of labelled checkboxes,
 * because a fourteen-column matrix on a phone is either unreadable or a
 * horizontal scroll inside a vertical one.
 */

export type PermissionFilter = "all" | "granted" | "denied" | "sensitive" | "changed";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "granted", label: "Granted" },
  { value: "denied", label: "Not granted" },
  { value: "sensitive", label: "Sensitive" },
  { value: "changed", label: "Changed" },
];

export interface PermissionMatrixProps {
  grants: RoleGrants;
  /** The saved copy, for the Changed filter and the changed markers. */
  baseline?: RoleGrants;
  onToggle: (resource: string, action: PermissionAction, next: boolean) => void;
  readOnly?: boolean;
  /** Returns a reason to refuse, or `null` to allow. Drives the lockout guard. */
  guard?: (resource: string, action: PermissionAction, next: boolean) => string | null;
  className?: string;
}

export function PermissionMatrix({
  grants,
  baseline,
  onToggle,
  readOnly = false,
  guard,
  className,
}: PermissionMatrixProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PermissionFilter>("all");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const term = search.trim().toLowerCase();

  const changed = useMemo(
    () => (baseline ? changedKeys(baseline, grants) : new Set<string>()),
    [baseline, grants],
  );

  /**
   * Which actions survive the search, filter and tier controls.
   *
   * Returned per resource rather than computed in the row, so a group that ends
   * up with nothing visible can be dropped entirely - an accordion that opens
   * onto an empty panel is worse than one that is not there.
   */
  function visibleActions(resource: PermissionResource): ResourceAction[] {
    const resourceMatches =
      !term || resource.label.toLowerCase().includes(term);

    return resource.actions.filter((spec) => {
      if (spec.advanced && !showAdvanced && filter !== "sensitive") {
        /* Advanced actions still surface when they are what you searched for,
           or when they are part of the change you are reviewing. */
        const forced =
          (term && matchesAction(resource, spec, term)) ||
          (filter === "changed" && changed.has(`${resource.key}.${spec.action}`));
        if (!forced) return false;
      }

      if (term && !resourceMatches && !matchesAction(resource, spec, term)) {
        return false;
      }

      const granted = grants[resource.key]?.includes(spec.action) ?? false;

      if (filter === "granted" && !granted) return false;
      if (filter === "denied" && granted) return false;
      if (filter === "sensitive" && !spec.sensitive) return false;
      if (filter === "changed" && !changed.has(`${resource.key}.${spec.action}`)) {
        return false;
      }

      return true;
    });
  }

  const groups = PERMISSION_GROUPS.map((group) => ({
    group,
    resources: group.resources
      .map((resource) => ({ resource, actions: visibleActions(resource) }))
      .filter((row) => row.actions.length > 0),
  })).filter((entry) => entry.resources.length > 0);

  const narrowed = term.length > 0 || filter !== "all";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and filter. Stacks on a phone; one row from `sm`. */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <Input size="sm"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search permissions…"
            aria-label="Search permissions"
            className="pl-9"
          />
        </div>

        <SegmentedControl
          label="Filter permissions"
          value={filter}
          onChange={(value) => setFilter(value as PermissionFilter)}
          options={FILTERS}
          className="max-sm:overflow-x-auto"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-text-primary">
          <Checkbox
            checked={showAdvanced}
            onCheckedChange={setShowAdvanced}
            label="Show advanced permissions"
          />
          Show advanced permissions
          <Tooltip content="Destructive and rarely-changed actions - delete, publish, export, refund and the manage permissions.">
            <span
              tabIndex={0}
              className="grid size-4 place-items-center rounded-full border border-border-strong text-xs font-bold text-text-muted"
            >
              ?
            </span>
          </Tooltip>
        </label>

        {narrowed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setFilter("all");
            }}
          >
            <X aria-hidden />
            Clear
          </Button>
        ) : null}
      </div>

      {groups.length === 0 ? (
        <p className="rounded-panel border border-dashed border-border-strong px-4 py-8 text-center text-sm text-text-muted">
          No permissions match{term ? ` “${search.trim()}”` : " that filter"}.
        </p>
      ) : (
        <div className="space-y-2.5">
          {groups.map((entry, index) => (
            <PermissionGroup
              key={entry.group.key}
              group={entry.group}
              rows={entry.resources}
              grants={grants}
              changed={changed}
              onToggle={onToggle}
              readOnly={readOnly}
              guard={guard}
              /* Narrowing the list means the reader is hunting, so everything
                 that survived opens. Otherwise only the first group does. */
              defaultOpen={narrowed || index === 0}
              forceOpen={narrowed}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Does this action match the search term, by resource, action or impact? */
function matchesAction(
  resource: PermissionResource,
  spec: ResourceAction,
  term: string,
): boolean {
  return (
    resource.label.toLowerCase().includes(term) ||
    PERMISSION_ACTION_LABEL[spec.action].toLowerCase().includes(term) ||
    `${resource.label} ${PERMISSION_ACTION_LABEL[spec.action]}`
      .toLowerCase()
      .includes(term) ||
    Boolean(spec.sensitive?.toLowerCase().includes(term))
  );
}

function changedKeys(before: RoleGrants, after: RoleGrants): Set<string> {
  const keys = new Set<string>();

  for (const group of PERMISSION_GROUPS) {
    for (const resource of group.resources) {
      const had = new Set(before[resource.key] ?? []);
      const has = new Set(after[resource.key] ?? []);

      for (const spec of resource.actions) {
        if (had.has(spec.action) !== has.has(spec.action)) {
          keys.add(`${resource.key}.${spec.action}`);
        }
      }
    }
  }

  return keys;
}

/* -------------------------------------------------------------------------- */
/* Group                                                                      */
/* -------------------------------------------------------------------------- */

export function PermissionGroup({
  group,
  rows,
  grants,
  changed,
  onToggle,
  readOnly,
  guard,
  defaultOpen = false,
  forceOpen = false,
}: {
  group: PermissionGroupType;
  rows: { resource: PermissionResource; actions: ResourceAction[] }[];
  grants: RoleGrants;
  changed: Set<string>;
  onToggle: (resource: string, action: PermissionAction, next: boolean) => void;
  readOnly?: boolean;
  guard?: (resource: string, action: PermissionAction, next: boolean) => string | null;
  defaultOpen?: boolean;
  /** Search and filters override the accordion - hiding a hit helps nobody. */
  forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const expanded = forceOpen || open;

  /* Counts run over the whole group, not the filtered rows: "12 / 18" has to
     mean the same thing whatever is on screen. */
  const total = group.resources.reduce(
    (sum, resource) => sum + resource.actions.length,
    0,
  );
  const granted = group.resources.reduce(
    (sum, resource) => sum + (grants[resource.key]?.length ?? 0),
    0,
  );
  const all = granted === total;

  /** The action columns the *visible* rows actually use, in the house order. */
  const columns = PERMISSION_ACTION_ORDER.filter((action) =>
    rows.some((row) => row.actions.some((spec) => spec.action === action)),
  );

  function setGroup(next: boolean) {
    for (const row of rows) {
      for (const spec of row.actions) {
        const has = grants[row.resource.key]?.includes(spec.action) ?? false;
        if (has === next) continue;
        if (guard?.(row.resource.key, spec.action, next)) continue;
        onToggle(row.resource.key, spec.action, next);
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
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-btn text-left focus-visible:shadow-focus focus-visible:outline-none"
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-text-muted transition-transform",
              expanded && "rotate-180",
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
          {granted} / {total}
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

      {expanded ? (
        <div id={panelId} className="border-t border-border">
          {/* Desktop: a grid, with the action names once at the top. */}
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

            {rows.map(({ resource, actions }) => (
              <div
                key={resource.key}
                className="grid items-center gap-x-3 border-b border-border px-3.5 py-2.5 last:border-0"
                style={{
                  gridTemplateColumns: `minmax(0,1fr) repeat(${columns.length}, 5.5rem)`,
                }}
              >
                <ResourceLabel resource={resource} />

                {columns.map((action) => {
                  const spec = actions.find((item) => item.action === action);
                  if (!spec) {
                    return (
                      <span
                        key={action}
                        aria-hidden
                        className="text-center text-sm text-border-strong"
                      >
                        -
                      </span>
                    );
                  }

                  return (
                    <span key={action} className="flex justify-center">
                      <PermissionCell
                        resource={resource}
                        spec={spec}
                        checked={grants[resource.key]?.includes(action) ?? false}
                        changed={changed.has(`${resource.key}.${action}`)}
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

          {/* Mobile: one card per resource, each checkbox carrying its word. */}
          <div className="divide-y divide-border lg:hidden">
            {rows.map(({ resource, actions }) => (
              <div key={resource.key} className="px-3.5 py-3">
                <ResourceLabel resource={resource} />

                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-2.5">
                  {actions.map((spec) => (
                    <span
                      key={spec.action}
                      className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary"
                    >
                      <PermissionCell
                        resource={resource}
                        spec={spec}
                        checked={grants[resource.key]?.includes(spec.action) ?? false}
                        changed={changed.has(`${resource.key}.${spec.action}`)}
                        onToggle={onToggle}
                        readOnly={readOnly}
                        guard={guard}
                      />
                      {PERMISSION_ACTION_LABEL[spec.action]}
                      {spec.sensitive ? (
                        <SensitiveMark impact={spec.sensitive} />
                      ) : null}
                    </span>
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

function ResourceLabel({ resource }: { resource: PermissionResource }) {
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
 * The marker on a sensitive permission.
 *
 * Amber and small rather than red and loud. A matrix where thirty cells shout
 * is a matrix where none of them is heard - the badge exists to make a merchant
 * pause on the six that matter in the role they are editing, and the tooltip
 * carries the actual consequence rather than the word "sensitive" again.
 */
export function SensitiveMark({ impact }: { impact: string }) {
  return (
    <Tooltip content={impact}>
      <span
        tabIndex={0}
        role="img"
        aria-label={`Sensitive permission. ${impact}`}
        className="grid size-4 shrink-0 place-items-center rounded-full text-warning-text"
      >
        <ShieldAlert className="size-3.5" aria-hidden />
      </span>
    </Tooltip>
  );
}

/**
 * One cell.
 *
 * A refused toggle renders as a padlock with the reason in a tooltip rather
 * than a checkbox that silently does nothing - the guard exists to stop a
 * specific mistake, and a control that ignores a click without explaining reads
 * as a bug.
 */
function PermissionCell({
  resource,
  spec,
  checked,
  changed,
  onToggle,
  readOnly,
  guard,
}: {
  resource: PermissionResource;
  spec: ResourceAction;
  checked: boolean;
  changed: boolean;
  onToggle: (resource: string, action: PermissionAction, next: boolean) => void;
  readOnly?: boolean;
  guard?: (resource: string, action: PermissionAction, next: boolean) => string | null;
}) {
  const refusal = guard?.(resource.key, spec.action, !checked) ?? null;
  const label = `${resource.label} - ${PERMISSION_ACTION_LABEL[spec.action]}`;

  if (refusal) {
    return (
      <Tooltip content={refusal}>
        <span
          className="grid size-4.5 place-items-center rounded-[5px] border border-border-strong bg-surface-secondary text-text-muted"
          role="img"
          aria-label={`${label} - locked. ${refusal}`}
          tabIndex={0}
        >
          <Lock className="size-2.5" aria-hidden />
        </span>
      </Tooltip>
    );
  }

  return (
    <span className="relative inline-flex items-center gap-1">
      <Checkbox
        checked={checked}
        disabled={readOnly}
        onCheckedChange={(next) => onToggle(resource.key, spec.action, next)}
        label={
          spec.sensitive ? `${label} - sensitive. ${spec.sensitive}` : label
        }
        className={cn(
          /* An unsaved edit gets a ring rather than a colour change, so the
             checked/unchecked reading stays the primary one. */
          changed && "ring-2 ring-warning ring-offset-1",
        )}
      />
      {/* The desktop grid has no room for the glyph beside every box, so it
          rides on the cell only where the action is genuinely sensitive. */}
      {spec.sensitive ? (
        <span className="max-lg:hidden">
          <SensitiveMark impact={spec.sensitive} />
        </span>
      ) : null}
    </span>
  );
}

/** The legend under the matrix. Explains the two markers once, not per cell. */
export function PermissionLegend({ hasChanges }: { hasChanges: boolean }) {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-meta text-text-muted">
      <span className="inline-flex items-center gap-1.5">
        <ShieldAlert className="size-3.5 text-warning-text" aria-hidden />
        Sensitive - hover for what it allows
      </span>
      {hasChanges ? (
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-3 rounded-sm ring-2 ring-warning ring-offset-1"
          />
          Unsaved change
        </span>
      ) : null}
      <span className="inline-flex items-center gap-1.5">
        <Lock className="size-3.5" aria-hidden />
        Locked - protected by a workspace rule
      </span>
    </p>
  );
}

/** Sensitive-permission summary, for the review step and the role header. */
export function SensitiveSummary({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count === 0) return null;

  return (
    <Badge variant="warning" size="sm" casing="none" className={className} icon={<ShieldAlert aria-hidden />}>
      {count} sensitive
    </Badge>
  );
}
