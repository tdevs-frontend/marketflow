"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Hover and focus tooltip.
 *
 * Opens on pointer *and* on keyboard focus, and the trigger points at the
 * bubble with `aria-describedby` — a title-attribute tooltip is invisible to
 * touch and unreliable to screen readers, and a hover-only one is unreachable
 * by keyboard. Escape closes it, because a tooltip pinned open over the thing
 * you are reading is worse than none.
 *
 * For content longer than a sentence use a popover; this is sized for a label.
 *
 * ---
 *
 * The bubble renders on an overlay layer rather than next to its trigger.
 *
 * It used to be an `absolute` span inside a `relative` wrapper, which is fine
 * until the trigger sits in a scroll container — and in this product it
 * usually does. The composer's segment hint lives inside a `Dialog`, whose
 * body is `overflow-y-auto`: an absolutely positioned bubble above that
 * trigger extended the scrollable area upward, so the dialog gained scroll
 * height and visibly jumped the moment you hovered the `?`. The same bubble
 * near a viewport edge widened the document and produced a horizontal
 * scrollbar. Both are the same bug — the tooltip was participating in layout.
 *
 * Now it is `position: fixed` in a portal, so it is measured against the
 * viewport and contributes nothing to any ancestor's scroll box. Nothing it
 * does can change the size of the document.
 *
 * The portal target is chosen per trigger, which is the part that is easy to
 * get wrong: `Dialog` is a native `<dialog>` opened with `showModal()`, and a
 * modal dialog paints in the browser's *top layer*, above every z-index in the
 * page. A tooltip portaled to `document.body` would therefore be invisible
 * behind any open modal, whatever `z-50` says. So a trigger inside an open
 * `<dialog>` portals into that dialog — joining it in the top layer — and
 * everything else portals to the body. Neither element is a containing block
 * for fixed positioning (no transform, filter or contain), so the coordinates
 * mean the same thing in both.
 */

/** Distance from the trigger, and the closest the bubble may sit to an edge. */
const OFFSET = 8;
const EDGE = 8;

type Side = "top" | "bottom";

interface Placement {
  left: number;
  top: number;
  side: Side;
}

/**
 * Where the bubble goes, given the trigger's box and the bubble's own.
 *
 * Flips rather than squeezes: if the preferred side has no room and the other
 * one does, it moves. If neither fits it keeps the preference, because a
 * bubble half off the top of a short viewport is still more readable than one
 * that jitters between sides as the page scrolls.
 *
 * `clientWidth` rather than `innerWidth` on purpose — the latter includes the
 * vertical scrollbar, and clamping against it parks the bubble underneath.
 */
function place(trigger: DOMRect, bubble: DOMRect, preferred: Side): Placement {
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;

  const fitsAbove = trigger.top - OFFSET - bubble.height >= EDGE;
  const fitsBelow = trigger.bottom + OFFSET + bubble.height <= viewportHeight - EDGE;

  const side: Side =
    preferred === "top"
      ? fitsAbove || !fitsBelow
        ? "top"
        : "bottom"
      : fitsBelow || !fitsAbove
        ? "bottom"
        : "top";

  const top =
    side === "top" ? trigger.top - OFFSET - bubble.height : trigger.bottom + OFFSET;

  /* Centred on the trigger, then pulled back inside whichever edge it crossed.
     When the bubble is wider than the viewport allows — a long string on a
     narrow phone — it pins to the left margin and `max-width` wraps the rest
     rather than letting it run off and widen the page. */
  const centred = trigger.left + trigger.width / 2 - bubble.width / 2;
  const furthestLeft = viewportWidth - EDGE - bubble.width;
  const left =
    furthestLeft < EDGE ? EDGE : Math.min(Math.max(centred, EDGE), furthestLeft);

  return { left, top, side };
}

/** The top layer when the trigger is inside an open modal, the body otherwise. */
function layerFor(node: Element | null): HTMLElement {
  const dialog = node?.closest("dialog");
  return dialog instanceof HTMLDialogElement && dialog.open ? dialog : document.body;
}

const same = (a: Placement | null, b: Placement) =>
  a !== null && a.left === b.left && a.top === b.top && a.side === b.side;

export function Tooltip({
  content,
  side = "top",
  className,
  children,
}: {
  content: ReactNode;
  side?: Side;
  className?: string;
  /** The trigger. Must be focusable for the keyboard path to work. */
  children: ReactNode;
}) {
  /*
   * The layer doubles as the open flag: a tooltip is open exactly when it has
   * somewhere to render. One state rather than two means they cannot disagree,
   * and it is resolved in the pointer handler rather than in an effect — the
   * trigger is already in the DOM by then, so there is nothing to wait for and
   * no cascading render to pay for. It starts null, so the server renders the
   * trigger alone.
   */
  const [layer, setLayer] = useState<HTMLElement | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  const open = layer !== null;

  const show = () => setLayer(layerFor(triggerRef.current));

  const hide = () => {
    setLayer(null);
    setPlacement(null);
  };

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const bubble = bubbleRef.current;
    if (!trigger || !bubble) return;

    const next = place(
      trigger.getBoundingClientRect(),
      bubble.getBoundingClientRect(),
      side,
    );
    /* Guarded so a parent re-rendering `content` into a fresh node cannot
       start a measure/set/measure loop. */
    setPlacement((current) => (same(current, next) ? current : next));
  }, [side]);

  /* Before paint: the bubble is mounted but hidden, so it can be measured at
     its real width without a flash at the wrong coordinates. Measuring the DOM
     and writing the result back is what `useLayoutEffect` is for — the bubble
     cannot be placed until the browser has told us how big it is. */
  useLayoutEffect(() => {
    if (!layer) return;
    reposition();
  }, [layer, reposition, content]);

  useEffect(() => {
    if (!layer) return;

    /* Capture phase, because the thing that scrolls is usually a dialog body
       or a table wrapper rather than the window, and those do not bubble. */
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);

    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [layer, reposition]);

  const bubble = (
    <span
      ref={bubbleRef}
      role="tooltip"
      id={id}
      style={{
        left: placement?.left ?? 0,
        top: placement?.top ?? 0,
        /* Held back for one frame while it is measured. */
        visibility: placement ? "visible" : "hidden",
        /* Caps the bubble at its design width, or at the viewport on a phone
           too narrow for it — the guard against a long label widening the
           page instead of wrapping. */
        maxWidth: `min(14rem, calc(100vw - ${EDGE * 2}px))`,
      }}
      className={cn(
        "pointer-events-none fixed z-50 w-max rounded-btn bg-text-primary px-2.5 py-1.5 text-center text-sm font-medium break-words text-white shadow-float",
        placement && "animate-tooltip-in",
      )}
    >
      {content}
    </span>
  );

  return (
    <span
      className={cn("relative inline-flex", className)}
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
      onKeyDown={(event) => {
        if (event.key === "Escape") hide();
      }}
    >
      <span
        ref={triggerRef}
        aria-describedby={open ? id : undefined}
        className="inline-flex"
      >
        {children}
      </span>

      {layer ? createPortal(bubble, layer) : null}
    </span>
  );
}

/**
 * The `?` next to a metric whose definition is not obvious — "reply rate of
 * what, exactly". Its own component so every one of them is the same size.
 */
export function InfoHint({ content }: { content: ReactNode }) {
  return (
    <Tooltip content={content}>
      <button
        type="button"
        aria-label="What this means"
        className="grid size-4 place-items-center rounded-full border border-border-strong text-xs font-bold text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
      >
        ?
      </button>
    </Tooltip>
  );
}
