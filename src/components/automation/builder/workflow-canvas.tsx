"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";
import { NODE_H, NODE_W, WorkflowNodeCard } from "./workflow-node";

export interface Viewport {
  zoom: number;
  x: number;
  y: number;
}

export const ZOOM_MIN = 0.4;
export const ZOOM_MAX = 1.6;

export const clampZoom = (value: number) =>
  Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100));

/**
 * The bounding box of a graph, in canvas units.
 *
 * Used by fit-to-screen and by the initial centring. Exported because the
 * toolbar's Fit button lives outside this component but has to measure the
 * same thing.
 */
export function graphBounds(nodes: WorkflowNode[]) {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: NODE_W, maxY: NODE_H };
  }

  const xs = nodes.map((node) => node.position.x);
  const ys = nodes.map((node) => node.position.y);

  return {
    minX: Math.min(...xs) - NODE_W / 2,
    maxX: Math.max(...xs) + NODE_W / 2,
    minY: Math.min(...ys),
    maxY: Math.max(...ys) + NODE_H,
  };
}

/** The viewport that puts a whole graph on screen with a comfortable margin. */
export function fitViewport(
  nodes: WorkflowNode[],
  width: number,
  height: number,
  padding = 56,
): Viewport {
  const bounds = graphBounds(nodes);
  const graphWidth = bounds.maxX - bounds.minX;
  const graphHeight = bounds.maxY - bounds.minY;

  const zoom = clampZoom(
    Math.min(
      (width - padding * 2) / Math.max(graphWidth, 1),
      (height - padding * 2) / Math.max(graphHeight, 1),
      1,
    ),
  );

  return {
    zoom,
    x: (width - graphWidth * zoom) / 2 - bounds.minX * zoom,
    y: (height - graphHeight * zoom) / 2 - bounds.minY * zoom,
  };
}

/** A connector: down out of the source, into the top of the target. */
function edgePath(from: WorkflowNode, to: WorkflowNode) {
  const x1 = from.position.x;
  const y1 = from.position.y + NODE_H;
  const x2 = to.position.x;
  const y2 = to.position.y;
  const curve = Math.max(28, Math.abs(y2 - y1) / 2);

  return `M ${x1} ${y1} C ${x1} ${y1 + curve}, ${x2} ${y2 - curve}, ${x2} ${y2}`;
}

export interface CanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
  viewportRef: RefObject<HTMLDivElement | null>;
  selectedId?: string | null;
  onSelect?: (nodeId: string | null) => void;
  /** Fired once as a drag begins, so the whole gesture is a single undo. */
  onMoveStart?: () => void;
  onMove?: (nodeId: string, position: { x: number; y: number }) => void;
  /** A node kind dropped from the library, in canvas coordinates. */
  onDropKind?: (kind: string, position: { x: number; y: number }) => void;
  onDuplicate?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  invalidIds?: Set<string>;
  /** Hangs the entered count off every node - the Analytics tab's reading. */
  showAnalytics?: boolean;
  /** Turns off dragging and the node menus, leaving pan and zoom. */
  readOnly?: boolean;
  className?: string;
}

/**
 * The workflow canvas: a pan-and-zoom surface with absolutely positioned nodes
 * and SVG connectors between them.
 *
 * Nodes carry their own coordinates, which the API owns - nothing here lays
 * anything out. That is what lets the same component render an authored graph
 * in the builder and a read-only one in Analytics without a second code path.
 *
 * Wheel handling is attached natively rather than through `onWheel`: React
 * registers wheel listeners passively, so `preventDefault` inside a React
 * handler is ignored and ctrl-scroll zooms the whole browser page instead of
 * the canvas.
 */
export function WorkflowCanvas({
  nodes,
  edges,
  viewport,
  onViewportChange,
  viewportRef,
  selectedId,
  onSelect,
  onMoveStart,
  onMove,
  onDropKind,
  onDuplicate,
  onDelete,
  invalidIds,
  showAnalytics,
  readOnly,
  className,
}: CanvasProps) {
  const byId = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );

  /* Everything that entered the workflow, for the per-node share. */
  const top = useMemo(
    () => nodes.find((node) => node.kind === "trigger")?.entered ?? 0,
    [nodes],
  );

  /*
   * Live values for the window listeners below, which are registered once.
   *
   * Written from an effect rather than during render: a ref assigned while
   * rendering is a side effect in the render phase, and React's rules reject
   * it. The effect runs after every commit, so a gesture in progress is
   * reading at most one frame of staleness - which at 60fps is a pixel.
   */
  const state = useRef({ viewport, onViewportChange });

  useEffect(() => {
    state.current = { viewport, onViewportChange };
  });

  const drag = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const pan = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );

  /* Zoom about the pointer, so the thing under the cursor stays under it. */
  const zoomAt = useCallback(
    (delta: number, clientX?: number, clientY?: number) => {
      const { viewport: current, onViewportChange: change } = state.current;
      const next = clampZoom(current.zoom + delta);
      if (next === current.zoom) return;

      const rect = viewportRef.current?.getBoundingClientRect();
      const anchorX = clientX !== undefined && rect ? clientX - rect.left : (rect?.width ?? 0) / 2;
      const anchorY = clientY !== undefined && rect ? clientY - rect.top : (rect?.height ?? 0) / 2;

      const ratio = next / current.zoom;
      change({
        zoom: next,
        x: anchorX - (anchorX - current.x) * ratio,
        y: anchorY - (anchorY - current.y) * ratio,
      });
    },
    [viewportRef],
  );

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        zoomAt(event.deltaY > 0 ? -0.1 : 0.1, event.clientX, event.clientY);
        return;
      }

      /* Plain wheel pans, the way every canvas tool behaves - the page behind
         the builder does not scroll while the pointer is over it. */
      event.preventDefault();
      const { viewport: current, onViewportChange: change } = state.current;
      change({
        ...current,
        x: current.x - event.deltaX,
        y: current.y - event.deltaY,
      });
    }

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [viewportRef, zoomAt]);

  /* One pair of window listeners for both gestures: a pointer that leaves the
     canvas mid-drag must still be tracked, which a local handler cannot do. */
  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      const { viewport: current, onViewportChange: change } = state.current;

      if (drag.current) {
        const move = drag.current;
        const dx = (event.clientX - move.startX) / current.zoom;
        const dy = (event.clientY - move.startY) / current.zoom;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) move.moved = true;
        onMove?.(move.nodeId, {
          x: Math.round(move.originX + dx),
          y: Math.round(move.originY + dy),
        });
        return;
      }

      if (pan.current) {
        change({
          ...current,
          x: pan.current.originX + (event.clientX - pan.current.startX),
          y: pan.current.originY + (event.clientY - pan.current.startY),
        });
      }
    }

    function onPointerUp() {
      drag.current = null;
      pan.current = null;
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [onMove]);

  function startNodeDrag(node: WorkflowNode, event: ReactPointerEvent<HTMLDivElement>) {
    if (readOnly || !onMove) return;
    /* Let the kebab menu and its items keep their own clicks. */
    if ((event.target as HTMLElement).closest("[aria-haspopup]")) return;

    onMoveStart?.();
    drag.current = {
      nodeId: node.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: node.position.x,
      originY: node.position.y,
      moved: false,
    };
  }

  function startPan(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    onSelect?.(null);
    pan.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: viewport.x,
      originY: viewport.y,
    };
  }

  return (
    <div
      ref={viewportRef}
      /* `workflow-dots` is the marketing page's grid; this is the in-product
         one - the same idea at the product's own neutral, subtle enough that
         nodes sit on it rather than in front of it. */
      className={cn(
        "relative h-full w-full touch-none overflow-hidden bg-surface-secondary/50",
        "[background-image:radial-gradient(var(--color-border-strong)_1px,transparent_1px)]",
        className,
      )}
      style={{
        backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
        backgroundPosition: `${viewport.x}px ${viewport.y}px`,
      }}
      onPointerDown={startPan}
      onDragOver={(event) => {
        if (!onDropKind) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(event) => {
        if (!onDropKind) return;
        event.preventDefault();
        const kind = event.dataTransfer.getData("application/x-marketflow-node");
        if (!kind) return;

        const rect = event.currentTarget.getBoundingClientRect();
        onDropKind(kind, {
          x: Math.round((event.clientX - rect.left - viewport.x) / viewport.zoom),
          y: Math.round((event.clientY - rect.top - viewport.y) / viewport.zoom - NODE_H / 2),
        });
      }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        {/* Zero-sized and overflow-visible, so paths can use the graph's own
            coordinates - including the negative ones a fork produces - without
            the SVG needing a viewBox that moves every time a node does. */}
        <svg
          aria-hidden
          width={1}
          height={1}
          className="pointer-events-none absolute top-0 left-0 overflow-visible"
        >
          {edges.map((edge) => {
            const from = byId.get(edge.from);
            const to = byId.get(edge.to);
            if (!from || !to) return null;

            return (
              <path
                key={edge.id}
                d={edgePath(from, to)}
                fill="none"
                strokeWidth={1.5}
                className={cn(
                  "transition-colors",
                  selectedId && (edge.from === selectedId || edge.to === selectedId)
                    ? "stroke-primary"
                    : "stroke-border-strong",
                )}
              />
            );
          })}
        </svg>

        {/* Branch labels ride the connector as HTML rather than SVG text: a
            chip with a border and a radius is three elements in SVG and one
            here, and it inherits the product's type without restating it. */}
        {edges.map((edge) => {
          const from = byId.get(edge.from);
          const to = byId.get(edge.to);
          if (!from || !to || !edge.branchId) return null;

          const branch = from.branches?.find((item) => item.id === edge.branchId);
          if (!branch) return null;

          const share = from.branchShare?.[branch.id];

          return (
            <Badge
              key={`${edge.id}-label`}
              variant="surface"
              casing="none"
              className="pointer-events-none absolute block -translate-x-1/2 -translate-y-1/2 px-2 whitespace-nowrap shadow-btn"
              style={{
                left: (from.position.x + to.position.x) / 2,
                top: (from.position.y + NODE_H + to.position.y) / 2,
              }}
            >
              {branch.label}
              {showAnalytics && share !== undefined ? (
                <span className="ml-1 text-text-muted tabular-nums">{share}%</span>
              ) : null}
            </Badge>
          );
        })}

        {nodes.map((node) => {
          return (
            <div
              key={node.id}
              className="absolute"
              style={{
                left: node.position.x - NODE_W / 2,
                top: node.position.y,
              }}
            >
              <WorkflowNodeCard
                node={node}
                selected={node.id === selectedId}
                invalid={invalidIds?.has(node.id)}
                analytics={
                  showAnalytics
                    ? {
                        entered: node.entered ?? 0,
                        share: top ? ((node.entered ?? 0) / top) * 100 : 0,
                      }
                    : undefined
                }
                onSelect={() => onSelect?.(node.id)}
                onPointerDown={(event) => startNodeDrag(node, event)}
                onConfigure={readOnly ? undefined : () => onSelect?.(node.id)}
                onDuplicate={
                  readOnly || !onDuplicate ? undefined : () => onDuplicate(node.id)
                }
                onDelete={
                  readOnly || !onDelete || node.kind === "trigger"
                    ? undefined
                    : () => onDelete(node.id)
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
