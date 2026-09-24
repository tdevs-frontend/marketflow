"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, X } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { APP_ROUTES, marketingNav } from "@/constants";
import { cn, isActiveRoute } from "@/lib/utils";

/**
 * The marketing site's navigation below `nav` (868px), as a right-hand off-canvas panel.
 *
 * One component for every public page, reading the same `marketingNav` the
 * desktop bar does - adding a page to the site is one entry there, and both
 * surfaces pick it up. Flat, because Features and Solutions are each one page
 * today; a second level would be a menu holding a link back to its own page.
 *
 * The motion is the off-canvas pattern rather than a `<dialog>`: the panel and
 * its overlay stay mounted and move between two states, so closing animates
 * exactly as smoothly as opening, in every browser. The panel travels in from
 * a little past the edge while it fades up, on an ease-in-out curve, and the
 * overlay fades on its own beneath it.
 *
 * Rendered into `<body>` through a portal. The header it is triggered from is
 * `backdrop-blur`, and a `backdrop-filter` makes an element the containing
 * block for its fixed descendants - left inside it, the panel would be pinned
 * to the 72px bar instead of the viewport.
 *
 * What a `<dialog>` would have given for free is done by hand: Escape and the
 * overlay close it, focus moves in on open and back to the menu button on
 * close, Tab stays inside while it is open, and the closed panel is `inert` so
 * nothing in it can be reached. The page behind stops scrolling through the
 * `mobile-menu-show` class `globals.css` already defines for this.
 */

/* The panel's curve and duration, shared by the panel and the overlay so the
   two land together. */
const MOTION = "duration-300 ease-[cubic-bezier(0.785,0.135,0.15,0.86)] motion-reduce:transition-none";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const subscribe = () => () => {};

export function MobileNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  /* The portal target only exists in the browser. */
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = () => setOpen(false);

  /* Scroll lock, focus in, focus back - and Escape from anywhere. */
  useEffect(() => {
    document.body.classList.toggle("mobile-menu-show", open);
    if (!open) return;

    closeRef.current?.focus();
    const trigger = triggerRef.current;

    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("mobile-menu-show");
      trigger?.focus();
    };
  }, [open]);

  /* Left open while the window widens past `nav` (868px), the panel would sit over a
     desktop bar that has its own links - so it closes itself. */
  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia("(min-width: 54.25rem)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [open]);

  /* Tab wraps inside the panel rather than walking out into the page. */
  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !panelRef.current) return;
    const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const last = items.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      {/* The breakpoint sits on a wrapper, not on the button: `.burger-menu`
          is an unlayered rule in `globals.css` that sets `display: flex`, and
          unlayered CSS outranks every utility - so a `nav:hidden` on the button
          itself loses and the menu button shows on desktop. */}
      <div className="flex nav:hidden">
        <button
          ref={triggerRef}
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "burger-menu rounded-btn text-text-secondary transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none",
            open && "active",
          )}
        >
          <span aria-hidden />
          <span aria-hidden />
          <span aria-hidden />
        </button>
      </div>

      {mounted
        ? createPortal(
            <>
              <div
                aria-hidden
                onClick={close}
                className={cn(
                  "fixed inset-0 z-50 bg-text-primary/45 transition-[opacity,visibility] nav:hidden",
                  MOTION,
                  open ? "visible opacity-100" : "invisible opacity-0",
                )}
              />

              <div
                ref={panelRef}
                id="mobile-navigation"
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                inert={!open}
                onKeyDown={trapFocus}
                className={cn(
                  "fixed inset-y-0 right-0 z-50 flex h-dvh w-full flex-col bg-surface shadow-float transition-[translate,opacity,visibility] will-change-transform min-[26.25rem]:w-90 nav:hidden",
                  MOTION,
                  open
                    ? "visible translate-x-0 opacity-100"
                    : "invisible translate-x-[calc(100%+5rem)] opacity-0",
                )}
              >
                <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-4">
                  <Link
                    href={APP_ROUTES.home}
                    onClick={close}
                    className="inline-flex items-center rounded-btn focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <Logo height={32} />
                  </Link>
                  <button
                    ref={closeRef}
                    type="button"
                    aria-label="Close menu"
                    onClick={close}
                    className="grid size-10 place-items-center rounded-btn text-text-primary transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <X className="size-6" aria-hidden />
                  </button>
                </div>

                <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
                  <ul>
                    {marketingNav.map((item) => {
                      const current = isActiveRoute(pathname, item.href);

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={close}
                            aria-current={current ? "page" : undefined}
                            className={cn(
                              "flex rounded-btn py-3.5 text-xl font-semibold transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                              /* Each state names its own ink - see the note on
                                 the desktop links in `SiteHeader`. */
                              current
                                ? "text-primary"
                                : "text-text-primary hover:text-primary",
                            )}
                          >
                            {item.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <div className="shrink-0 space-y-3 border-t border-border px-5 py-5">
                  <ButtonLink
                    href={APP_ROUTES.login}
                    onClick={close}
                    variant="ghost"
                    className="w-full border border-border hover:border-border-strong"
                  >
                    Sign In
                  </ButtonLink>
                  <ButtonLink href={APP_ROUTES.register} onClick={close} className="w-full">
                    Start Free
                    <ArrowRight aria-hidden />
                  </ButtonLink>
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
