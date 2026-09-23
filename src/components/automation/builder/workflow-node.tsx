"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { AlertTriangle, Copy, Settings2, Trash2 } from "lucide-react";

import { Menu } from "@/components/ui/menu";
import { NODE_CATEGORY, NODE_META } from "@/constants/automation";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WorkflowNode } from "@/types/workflow";
import { NodeIcon } from "../node-icon";

/**
 * Canvas geometry, in canvas units.
 *
 * Exported because three things need to agree on it: the node draws itself at
 * this size, the canvas positions edges against it, and fit-to-screen measures
 * the graph with it. A node that is 240 wide in one file and 220 in another is
 * how connectors end up meeting nothing.
 */
export const NODE_W = 240;
export const NODE_H = 92;

/**
 * One node on the canvas.
 *
 * Fixed height on purpose: the summary truncates rather than wrapping, so a
 * node with a long template name cannot shove the ones below it out of
 * alignment, and the edges - which are drawn from a constant - always land on
 * the card. The detail that will not fit belongs in the inspector.
 *
 * The selectable surface is a `role="button"` div rather than a `<button>`
 * because the kebab menu sits inside the same card, and a button inside a
 * button is invalid. The menu is a sibling, positioned over the corner.
 */
export function WorkflowNodeCard({
  node,
  selected,
  invalid,
  /** Node-level analytics: shows the entered count and its share of the top. */
  analytics,
  onSelect,
  onPointerDown,
  onDuplicate,
  onDelete,
  onConfigure,
}: {
  node: WorkflowNode;
  selected?: boolean;
  invalid?: boolean;
  analytics?: { entered: number; share: number };
  onSelect: () => void;
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onConfigure?: () => void;
}) {
  const meta = NODE_META[node.kind];
  const theme = NODE_CATEGORY[meta?.category ?? "advanced"];
  const isTrigger = node.kind === "trigger";

  return (
    <div
      className={cn(
        "group relative rounded-panel border bg-surface shadow-card transition-shadow",
        selected
          ? "border-primary shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
          : invalid
            ? "border-error/60"
            : "border-border hover:shadow-card-hover",
      )}
      style={{ width: NODE_W, height: NODE_H }}
    >
      {/* Category rail. Two pixels of colour is the whole of a node's
          identity - the surface itself stays the product's own. */}
      <span
        aria-hidden
        className={cn("absolute inset-x-0 top-0 h-0.5 rounded-t-panel", theme.rail)}
      />

      {/* Connection handles. Decorative here: edges are authored by dropping a
          node onto the canvas, and these say where a connection lands. */}
      {!isTrigger ? (
        <span
          aria-hidden
          className="absolute -top-1.25 left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2 border-border-strong bg-surface"
        />
      ) : null}
      <span
        aria-hidden
        className="absolute -bottom-1.25 left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2 border-border-strong bg-surface"
      />

      <div
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        aria-label={`${meta?.label ?? "Step"}: ${node.title}`}
        onPointerDown={onPointerDown}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
          }
        }}
        className="flex h-full cursor-grab flex-col justify-center gap-1 px-3 pt-1.5 focus-visible:shadow-focus focus-visible:outline-none active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <NodeIcon kind={node.kind} size="sm" />
          <span
            className={cn(
              "text-sm font-medium tracking-[0.06em] uppercase",
              theme.text,
            )}
          >
            {meta?.label ?? "Step"}
          </span>
          {invalid ? (
            <AlertTriangle className="size-3 text-error" aria-hidden />
          ) : null}
        </div>

        <p className="truncate pr-6 text-sm font-semibold text-text-primary">
          {node.title}
        </p>
        <p className="truncate text-sm text-text-muted">
          {node.summary || "Not configured"}
        </p>
      </div>

      {onDelete || onDuplicate ? (
        <div className="absolute top-1.5 right-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <Menu
            label={`Actions for ${node.title}`}
            items={[
              {
                label: "Configure",
                icon: <Settings2 className="size-4" />,
                onSelect: () => onConfigure?.(),
              },
              {
                label: "Duplicate",
                icon: <Copy className="size-4" />,
                onSelect: () => onDuplicate?.(),
                disabled: !onDuplicate,
              },
              {
                label: "Delete",
                icon: <Trash2 className="size-4" />,
                onSelect: () => onDelete?.(),
                destructive: true,
                disabled: !onDelete,
              },
            ]}
          />
        </div>
      ) : null}

      {analytics ? (
        <span className="absolute -right-1 -bottom-3 inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-sm font-medium text-text-secondary shadow-btn tabular-nums">
          {formatCount(analytics.entered)}
          <span className="text-text-muted">{analytics.share.toFixed(1)}%</span>
        </span>
      ) : null}
    </div>
  );
}
