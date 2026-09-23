"use client";

import {
  Maximize2,
  Redo2,
  Undo2,
  Wand2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { IconButton } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * The canvas toolbar.
 *
 * Icon-only and grey, so it reads as chrome rather than as a row of actions
 * competing with Publish. Every button carries a tooltip and an accessible
 * name - an icon-only control with neither is a guess.
 *
 * The zoom percentage is a button: clicking it returns to 100%, which is the
 * one zoom level anybody ever asks for by name.
 */
export function BuilderToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFit,
  onUndo,
  onRedo,
  onAutoLayout,
  canUndo,
  canRedo,
  className,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFit: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onAutoLayout?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-btn border border-border bg-surface/95 p-1 shadow-btn backdrop-blur",
        className,
      )}
    >
      {onUndo ? (
        <>
          <Tooltip content="Undo">
            <IconButton label="Undo" size="sm" onClick={onUndo} disabled={!canUndo}>
              <Undo2 />
            </IconButton>
          </Tooltip>
          <Tooltip content="Redo">
            <IconButton label="Redo" size="sm" onClick={onRedo} disabled={!canRedo}>
              <Redo2 />
            </IconButton>
          </Tooltip>
          <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />
        </>
      ) : null}

      <Tooltip content="Zoom out">
        <IconButton label="Zoom out" size="sm" onClick={onZoomOut}>
          <ZoomOut />
        </IconButton>
      </Tooltip>

      <Tooltip content="Reset to 100%">
        <button
          type="button"
          onClick={onZoomReset}
          className="min-w-12 rounded-btn px-1.5 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-gray-soft hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none tabular-nums"
        >
          {Math.round(zoom * 100)}%
        </button>
      </Tooltip>

      <Tooltip content="Zoom in">
        <IconButton label="Zoom in" size="sm" onClick={onZoomIn}>
          <ZoomIn />
        </IconButton>
      </Tooltip>

      <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />

      <Tooltip content="Fit to screen">
        <IconButton label="Fit workflow to screen" size="sm" onClick={onFit}>
          <Maximize2 />
        </IconButton>
      </Tooltip>

      {onAutoLayout ? (
        <Tooltip content="Auto layout">
          <IconButton label="Tidy the layout" size="sm" onClick={onAutoLayout}>
            <Wand2 />
          </IconButton>
        </Tooltip>
      ) : null}
    </div>
  );
}
