"use client";

import { useCallback, useMemo, useState } from "react";

import { NODE_META } from "@/constants/automation";
import type { NodeKind, Workflow, WorkflowEdge, WorkflowNode } from "@/types/workflow";
import { NODE_H, NODE_W } from "./workflow-node";
import { validateWorkflow } from "./workflow-validator";

/**
 * The builder's editing state, as a hook.
 *
 * It lives here rather than inside the canvas because three things need it at
 * once: the canvas draws it, the inspector edits it, and the detail header —
 * two components up, above the tab strip — reads `dirty` and `issues` to
 * decide whether Publish is allowed. Passing one object down beats three
 * components each keeping their own copy of the graph.
 *
 * History is a pair of stacks of whole graphs rather than a list of reversible
 * operations. A workflow is a few dozen small objects, so snapshotting is
 * cheap, and an inverse for every operation is the kind of thing that is
 * correct for a month and then silently is not.
 */

interface Snapshot {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

const HISTORY_LIMIT = 40;
const COLUMN = 300;
const ROW = 150;

let nodeSequence = 0;

/** Ids for nodes created in the browser. A counter, because Date.now() is
    impure and these are minted inside handlers React may re-run. */
const nextNodeId = () => {
  nodeSequence += 1;
  return `node-${nodeSequence}`;
};

/**
 * The graph and both history stacks, as one value.
 *
 * They live together because every writer touches all three, and a change that
 * updated the graph without pushing onto `past` — or the other way round — is
 * an undo stack that silently skips a step. One state, one functional update,
 * no ordering to get wrong.
 *
 * Refs would be the obvious home for the stacks, and they are the wrong one:
 * a ref read during render (to decide whether Undo is enabled) does not
 * re-render when it changes, and a ref written inside a state updater makes
 * that updater impure — which React punishes by calling it twice in
 * development and recording every edit to the stack twice.
 */
interface History {
  graph: Snapshot;
  past: Snapshot[];
  future: Snapshot[];
}

export function useWorkflowDraft(workflow: Workflow) {
  const [history, setHistory] = useState<History>({
    graph: { nodes: workflow.nodes, edges: workflow.edges },
    past: [],
    future: [],
  });
  const graph = history.graph;

  const [selectedId, setSelectedId] = useState<string | null>(
    workflow.nodes[0]?.id ?? null,
  );
  const [dirty, setDirty] = useState(false);

  /**
   * One writer for every change.
   *
   * `record: false` is what keeps a drag out of the undo stack as forty
   * separate positions — `beginGesture` takes the single snapshot instead.
   */
  const apply = useCallback(
    (next: (current: Snapshot) => Snapshot, record = true) => {
      setHistory((current) => ({
        graph: next(current.graph),
        past: record
          ? [...current.past, current.graph].slice(-HISTORY_LIMIT)
          : current.past,
        future: record ? [] : current.future,
      }));
      setDirty(true);
    },
    [],
  );

  const undo = useCallback(() => {
    setHistory((current) => {
      const previous = current.past[current.past.length - 1];
      if (!previous) return current;

      return {
        graph: previous,
        past: current.past.slice(0, -1),
        future: [current.graph, ...current.future].slice(0, HISTORY_LIMIT),
      };
    });
    setDirty(true);
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      const next = current.future[0];
      if (!next) return current;

      return {
        graph: next,
        past: [...current.past, current.graph].slice(-HISTORY_LIMIT),
        future: current.future.slice(1),
      };
    });
    setDirty(true);
  }, []);

  /* Snapshot before the gesture starts, so a whole drag is one undo. */
  const beginGesture = useCallback(() => {
    setHistory((current) => ({
      ...current,
      past: [...current.past, current.graph].slice(-HISTORY_LIMIT),
      future: [],
    }));
  }, []);

  const moveNode = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      apply(
        (current) => ({
          ...current,
          nodes: current.nodes.map((node) =>
            node.id === nodeId ? { ...node, position } : node,
          ),
        }),
        false,
      );
    },
    [apply],
  );

  const updateNode = useCallback(
    (updated: WorkflowNode) => {
      apply((current) => ({
        ...current,
        nodes: current.nodes.map((node) => (node.id === updated.id ? updated : node)),
      }));
    },
    [apply],
  );

  /**
   * Adds a node, and connects it where it can.
   *
   * Dropped on the canvas it lands where the pointer let go and joins whatever
   * was selected; clicked in the library it is placed under the selection,
   * which is the path a touch screen has. Either way it arrives connected —
   * an unattached node is a validation error, and producing one on every add
   * would mean the panel is red from the first click.
   */
  const addNode = useCallback(
    (kind: NodeKind, position?: { x: number; y: number }) => {
      const meta = NODE_META[kind];
      const id = nextNodeId();

      apply((current) => {
        const parent =
          current.nodes.find((node) => node.id === selectedId) ??
          current.nodes[current.nodes.length - 1];

        const node: WorkflowNode = {
          id,
          kind,
          title: meta.label,
          summary: meta.defaultSummary,
          config: {},
          position:
            position ??
            (parent
              ? { x: parent.position.x, y: parent.position.y + ROW }
              : { x: 0, y: 0 }),
          branches: meta.defaultBranches?.map((label, order) => ({
            id: `${id}-b${order}`,
            label,
          })),
        };

        /* A second trigger is never what was meant — there is one entry point,
           so dropping another replaces nothing and simply arrives loose for the
           validator to flag. Everything else attaches to the selection. */
        const connectable =
          parent && kind !== "trigger" && parent.id !== node.id ? parent : null;

        const takenBranches = new Set(
          current.edges
            .filter((edge) => edge.from === connectable?.id)
            .map((edge) => edge.branchId),
        );
        const freeBranch = connectable?.branches?.find(
          (branch) => !takenBranches.has(branch.id),
        );

        const edges: WorkflowEdge[] = connectable
          ? [
              ...current.edges,
              {
                id: `${connectable.id}->${node.id}`,
                from: connectable.id,
                to: node.id,
                branchId: freeBranch?.id,
              },
            ]
          : current.edges;

        return { nodes: [...current.nodes, node], edges };
      });

      setSelectedId(id);
      return id;
    },
    [apply, selectedId],
  );

  const duplicateNode = useCallback(
    (nodeId: string) => {
      const copyId = nextNodeId();

      apply((current) => {
        const source = current.nodes.find((node) => node.id === nodeId);
        if (!source) return current;

        const copy: WorkflowNode = {
          ...source,
          id: copyId,
          position: { x: source.position.x + NODE_W + 40, y: source.position.y },
          branches: source.branches?.map((branch, order) => ({
            id: `${copyId}-b${order}`,
            label: branch.label,
          })),
          entered: undefined,
          branchShare: undefined,
        };

        return { ...current, nodes: [...current.nodes, copy] };
      });

      setSelectedId(copyId);
    },
    [apply],
  );

  /**
   * Removes a node and heals the graph around it.
   *
   * Its parent is joined to its children rather than both being left dangling:
   * deleting a Wait out of the middle of a journey should close the gap, which
   * is what anybody deleting a Wait means.
   */
  const deleteNode = useCallback(
    (nodeId: string) => {
      apply((current) => {
        const parents = current.edges.filter((edge) => edge.to === nodeId);
        const children = current.edges.filter((edge) => edge.from === nodeId);

        const healed: WorkflowEdge[] = [];
        for (const parent of parents) {
          for (const child of children) {
            healed.push({
              id: `${parent.from}->${child.to}`,
              from: parent.from,
              to: child.to,
              branchId: parent.branchId,
            });
          }
        }

        return {
          nodes: current.nodes.filter((node) => node.id !== nodeId),
          edges: [
            ...current.edges.filter(
              (edge) => edge.from !== nodeId && edge.to !== nodeId,
            ),
            ...healed,
          ],
        };
      });

      setSelectedId((current) => (current === nodeId ? null : current));
    },
    [apply],
  );

  /**
   * Tidies the graph: depth from the trigger becomes the row, and siblings
   * share a row centred on zero.
   *
   * Deliberately simple. A real layered layout minimises edge crossings, which
   * matters on a graph with thirty nodes and does not on one with nine; this
   * is the "unpick the mess I just made by dragging" button, not a solver.
   */
  const autoLayout = useCallback(() => {
    apply((current) => {
      const start =
        current.nodes.find((node) => node.kind === "trigger") ?? current.nodes[0];
      if (!start) return current;

      const depth = new Map<string, number>([[start.id, 0]]);
      const queue = [start.id];

      while (queue.length > 0) {
        const id = queue.shift()!;
        const level = depth.get(id) ?? 0;
        for (const edge of current.edges.filter((item) => item.from === id)) {
          if (depth.has(edge.to)) continue;
          depth.set(edge.to, level + 1);
          queue.push(edge.to);
        }
      }

      /* Anything unreachable is parked below the deepest row rather than at the
         origin, where it would sit under the trigger. */
      const maxDepth = Math.max(0, ...depth.values());
      let stray = 0;

      const rows = new Map<number, string[]>();
      for (const node of current.nodes) {
        const level = depth.get(node.id) ?? maxDepth + 1 + Math.floor(stray++ / 3);
        rows.set(level, [...(rows.get(level) ?? []), node.id]);
      }

      const positions = new Map<string, { x: number; y: number }>();
      for (const [level, ids] of rows) {
        ids.forEach((id, index) => {
          positions.set(id, {
            x: (index - (ids.length - 1) / 2) * COLUMN,
            y: level * ROW,
          });
        });
      }

      return {
        ...current,
        nodes: current.nodes.map((node) => ({
          ...node,
          position: positions.get(node.id) ?? node.position,
        })),
      };
    });
  }, [apply]);

  const issues = useMemo(
    () => validateWorkflow(graph.nodes, graph.edges),
    [graph.nodes, graph.edges],
  );

  const invalidIds = useMemo(
    () =>
      new Set(
        issues
          .filter((issue) => issue.severity === "error" && issue.nodeId)
          .map((issue) => issue.nodeId as string),
      ),
    [issues],
  );

  const selectedNode = useMemo(
    () => graph.nodes.find((node) => node.id === selectedId) ?? null,
    [graph.nodes, selectedId],
  );

  return {
    nodes: graph.nodes,
    edges: graph.edges,
    selectedId,
    selectedNode,
    select: setSelectedId,
    dirty,
    markSaved: () => setDirty(false),
    issues,
    invalidIds,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
    beginGesture,
    moveNode,
    updateNode,
    addNode,
    duplicateNode,
    deleteNode,
    autoLayout,
  };
}

export type WorkflowDraft = ReturnType<typeof useWorkflowDraft>;

export { NODE_H, NODE_W };
