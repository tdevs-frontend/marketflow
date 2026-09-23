"use client";

import { useEffect, useRef, useState } from "react";
import { PanelRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Drawer } from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import type { NodeKind } from "@/types/workflow";
import { BuilderToolbar } from "./builder-toolbar";
import { NodeLibrary } from "./node-library";
import { NodeInspector } from "./node-inspector";
import {
  WorkflowCanvas,
  clampZoom,
  fitViewport,
  type Viewport,
} from "./workflow-canvas";
import { WorkflowValidator } from "./workflow-validator";
import type { WorkflowDraft } from "./use-workflow-draft";

/**
 * The three-panel builder: library, canvas, inspector.
 *
 * The panels collapse rather than shrink as the viewport narrows, because a
 * 140px canvas between two squeezed panels is worse than no panels at all.
 * From `xl` all three are visible; at `lg` the inspector becomes a drawer,
 * because configuring a node is a deliberate act and a drawer is a fine place
 * for one; below that both side panels are drawers and the canvas keeps the
 * screen, which is the only arrangement where a flow chart is legible on a
 * phone.
 *
 * The canvas is never crammed into a tiny viewport with the desktop chrome
 * intact - the toolbar loses its labels, the panels leave, and what is left is
 * the graph and two buttons.
 */
export function WorkflowBuilder({
  draft,
  className,
}: {
  draft: WorkflowDraft;
  className?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<Viewport>({ zoom: 1, x: 0, y: 0 });
  const [libraryOpen, setLibraryOpen] = useState(false);
  /*
   * Two readings of the same canvas.
   *
   * Performance hangs the entered count off every node and turns editing off,
   * because a drag while reading analytics is never intentional. A mode rather
   * than a separate screen: the drop-off you are looking at and the node you
   * would fix are the same object, and splitting them in two is how people
   * stop acting on their own analytics.
   */
  const [view, setView] = useState<"builder" | "performance">("builder");
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const wideInspector = useMediaQuery("(min-width: 80rem)");
  const wideLibrary = useMediaQuery("(min-width: 64rem)");

  const fit = () => {
    const element = viewportRef.current;
    if (!element) return;
    setViewport(fitViewport(draft.nodes, element.clientWidth, element.clientHeight));
  };

  /* Centre the graph once the canvas has a measured size. Running on mount
     only: re-fitting on every node change would yank the view out from under
     someone who has just panned to look at a branch. */
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    setViewport(fitViewport(draft.nodes, element.clientWidth, element.clientHeight));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Keyboard: the shortcuts a canvas tool is expected to answer. Ignored while
     a field has focus, so Backspace in the inspector edits text rather than
     deleting the node being edited. */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }

      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) draft.redo();
        else draft.undo();
        return;
      }

      if (modifier && (event.key === "=" || event.key === "+")) {
        event.preventDefault();
        setViewport((current) => ({ ...current, zoom: clampZoom(current.zoom + 0.1) }));
        return;
      }

      if (modifier && event.key === "-") {
        event.preventDefault();
        setViewport((current) => ({ ...current, zoom: clampZoom(current.zoom - 0.1) }));
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && draft.selectedId) {
        const node = draft.nodes.find((item) => item.id === draft.selectedId);
        if (!node || node.kind === "trigger") return;
        event.preventDefault();
        draft.deleteNode(draft.selectedId);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [draft]);

  function addNode(kind: NodeKind, position?: { x: number; y: number }) {
    draft.addNode(kind, position);
    setLibraryOpen(false);
    if (!wideInspector) setInspectorOpen(true);
  }

  function selectNode(nodeId: string | null) {
    draft.select(nodeId);
    if (nodeId && !wideInspector) setInspectorOpen(true);
  }

  /* `inDrawer` drops the panel's own close button: the drawer already has one,
     and two of them in the same corner is a bug that looks like a decision. */
  const inspector = (inDrawer: boolean) => (
    <NodeInspector
      node={draft.selectedNode}
      onChange={(node) => {
        draft.updateNode(node);
        if (inDrawer) setInspectorOpen(false);
      }}
      onDelete={(nodeId) => {
        draft.deleteNode(nodeId);
        setInspectorOpen(false);
      }}
    />
  );

  return (
    <div
      className={cn(
        "flex h-[calc(100dvh-19rem)] min-h-125 gap-4 max-lg:min-h-100",
        className,
      )}
    >
      <aside className="hidden w-60 shrink-0 overflow-hidden rounded-card border border-border bg-surface shadow-card lg:block">
        <NodeLibrary onAdd={addNode} />
      </aside>

      <div className="relative min-w-0 flex-1 overflow-hidden rounded-card border border-border bg-surface shadow-card">
        <WorkflowCanvas
          nodes={draft.nodes}
          edges={draft.edges}
          viewport={viewport}
          onViewportChange={setViewport}
          viewportRef={viewportRef}
          selectedId={draft.selectedId}
          onSelect={selectNode}
          onMoveStart={draft.beginGesture}
          onMove={draft.moveNode}
          onDropKind={(kind, position) => addNode(kind as NodeKind, position)}
          onDuplicate={draft.duplicateNode}
          onDelete={draft.deleteNode}
          invalidIds={view === "builder" ? draft.invalidIds : undefined}
          showAnalytics={view === "performance"}
          readOnly={view === "performance"}
        />

        <BuilderToolbar
          className="absolute top-3 left-3 z-10"
          zoom={viewport.zoom}
          onZoomIn={() =>
            setViewport((current) => ({ ...current, zoom: clampZoom(current.zoom + 0.1) }))
          }
          onZoomOut={() =>
            setViewport((current) => ({ ...current, zoom: clampZoom(current.zoom - 0.1) }))
          }
          onZoomReset={() => setViewport((current) => ({ ...current, zoom: 1 }))}
          onFit={fit}
          onUndo={draft.undo}
          onRedo={draft.redo}
          onAutoLayout={() => {
            draft.autoLayout();
            /* Tidying and then leaving the view where it was defeats the
               point - the whole graph has moved. */
            window.setTimeout(fit, 0);
          }}
          canUndo={draft.canUndo}
          canRedo={draft.canRedo}
        />

        <WorkflowValidator
          issues={draft.issues}
          onSelectNode={selectNode}
          className="absolute right-3 bottom-3 left-3 z-10 max-w-md shadow-float sm:left-auto sm:w-96"
        />

        <div className="absolute top-3 right-3 z-10">
          <SegmentedControl
            label="Canvas view"
            value={view}
            onChange={setView}
            options={[
              { value: "builder", label: "Builder" },
              { value: "performance", label: "Performance" },
            ]}
            className="bg-surface/95 shadow-btn backdrop-blur"
          />
        </div>

        {/* The compact controls the side panels leave behind. */}
        <div className="absolute top-14 right-3 z-10 flex gap-2 lg:hidden">
          <Button size="sm" variant="outline" onClick={() => setLibraryOpen(true)}>
            <Plus aria-hidden />
            Add step
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setInspectorOpen(true)}
            disabled={!draft.selectedNode}
          >
            <PanelRight aria-hidden />
            Configure
          </Button>
        </div>
      </div>

      <aside className="hidden w-80 shrink-0 overflow-hidden rounded-card border border-border bg-surface shadow-card xl:block">
        {inspector(false)}
      </aside>

      {/* Below `lg` the library is a sheet; the drawer is full-width on a phone
          and a panel on a tablet, which is what `Drawer` already does. */}
      <Drawer
        open={libraryOpen && !wideLibrary}
        onClose={() => setLibraryOpen(false)}
        title="Add a step"
        description="Drag onto the canvas, or tap to add after the selected step."
      >
        <div className="-mx-5 -my-5 h-[70dvh]">
          <NodeLibrary onAdd={addNode} />
        </div>
      </Drawer>

      <Drawer
        open={inspectorOpen && !wideInspector}
        onClose={() => setInspectorOpen(false)}
        title="Configure step"
      >
        <div className="-mx-5 -my-5 h-[75dvh]">{inspector(true)}</div>
      </Drawer>
    </div>
  );
}
