"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Plus, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { NODE_CATEGORY, NODE_LIBRARY, NODE_META } from "@/constants/automation";
import { cn } from "@/lib/utils";
import type { NodeKind } from "@/types/workflow";
import { NodeIcon } from "../node-icon";

/**
 * The palette of steps a workflow can be built from.
 *
 * Two ways to add a node, because the two input methods want different things:
 * dragging onto the canvas places a node exactly where the reader is looking,
 * and clicking appends it under the selection — which is the only path that
 * works on a touch screen, and the faster one even with a mouse when the graph
 * is a straight line.
 *
 * Categories collapse, and searching flattens them: with twenty-one node types
 * a closed accordion is faster to scan, but a search result should never hide
 * behind a collapsed heading.
 */
export function NodeLibrary({
  onAdd,
  className,
}: {
  /** Click-to-add. Dragging is handled by the canvas's drop target. */
  onAdd: (kind: NodeKind) => void;
  className?: string;
}) {
  const [term, setTerm] = useState("");
  const [closed, setClosed] = useState<string[]>([]);

  const query = term.trim().toLowerCase();

  const groups = useMemo(
    () =>
      NODE_LIBRARY.map((group) => ({
        ...group,
        kinds: group.kinds.filter((kind) => {
          if (!query) return true;
          const meta = NODE_META[kind];
          return `${meta.label} ${meta.description}`.toLowerCase().includes(query);
        }),
      })).filter((group) => group.kinds.length > 0),
    [query],
  );

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="relative shrink-0 p-3">
        <Search
          className="pointer-events-none absolute top-1/2 left-6 size-4 -translate-y-1/2 text-text-muted"
          aria-hidden
        />
        <Input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search nodes…"
          aria-label="Search nodes"
          className="h-10 pl-9"
        />
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {groups.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-text-muted">
            No nodes match “{term}”.
          </p>
        ) : (
          groups.map((group) => {
            const theme = NODE_CATEGORY[group.category];
            const open = query.length > 0 || !closed.includes(group.category);

            return (
              <section key={group.category} className="mb-1">
                <h3>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() =>
                      setClosed((list) =>
                        list.includes(group.category)
                          ? list.filter((item) => item !== group.category)
                          : [...list, group.category],
                      )
                    }
                    className="flex w-full items-center gap-1.5 rounded-btn px-1 py-2 text-sm font-medium tracking-[0.08em] text-text-muted uppercase transition-colors hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform",
                        open ? "" : "-rotate-90",
                      )}
                      aria-hidden
                    />
                    {theme.label}
                    <span className="ml-auto tabular-nums">{group.kinds.length}</span>
                  </button>
                </h3>

                {open ? (
                  <ul className="space-y-1 pb-1">
                    {group.kinds.map((kind) => {
                      const meta = NODE_META[kind];

                      return (
                        <li key={kind}>
                          <button
                            type="button"
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData(
                                "application/x-marketflow-node",
                                kind,
                              );
                              event.dataTransfer.effectAllowed = "copy";
                            }}
                            onClick={() => onAdd(kind)}
                            title={meta.description}
                            className="group flex w-full cursor-grab items-center gap-2.5 rounded-btn border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none active:cursor-grabbing"
                          >
                            <NodeIcon kind={kind} size="sm" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-text-primary">
                                {meta.label}
                              </span>
                              <span className="block truncate text-sm text-text-muted">
                                {meta.description}
                              </span>
                            </span>
                            <Plus
                              className="size-3.5 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                              aria-hidden
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </section>
            );
          })
        )}
      </div>

      <p className="shrink-0 border-t border-border px-4 py-2.5 text-sm text-text-muted">
        Drag a node onto the canvas, or click to add it after the selected step.
      </p>
    </div>
  );
}
