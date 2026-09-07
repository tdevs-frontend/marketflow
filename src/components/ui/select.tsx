"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  /** Optional second line, for options that need context. */
  hint?: string;
  disabled?: boolean;
}

export interface SelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  /** Accessible name. Required — a filter control with no name is unusable. */
  label: string;
  /** Set when a visible `<label htmlFor>` names it instead. */
  hideLabel?: boolean;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

const TRIGGER =
  "inline-flex w-full items-center justify-between gap-2 rounded-field border border-border-strong bg-surface px-3.5 text-sm text-text-primary transition-all outline-none hover:border-border-strong focus-visible:border-primary focus-visible:shadow-focus-field disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:opacity-60";

/**
 * A listbox built from buttons rather than a native `<select>`, so the menu can
 * be styled, hold two-line options and match the rest of the kit.
 *
 * Native `<select>` cannot be styled beyond the trigger, which is why this
 * exists — but it means the keyboard contract is ours to honour: Up/Down and
 * Home/End move the active option, typing jumps to a match, Enter or Space
 * commits, Escape cancels, and focus always returns to the trigger. The open
 * list takes focus and reports the active option through `aria-activedescendant`.
 */
export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  hideLabel = true,
  id,
  placeholder = "Select…",
  disabled,
  error,
  className,
}: SelectProps<T>) {
  const generatedId = useId();
  const triggerId = id ?? `${generatedId}-trigger`;
  const listId = `${generatedId}-list`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropUp, setDropUp] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ buffer: "", timer: 0 });

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  function openList() {
    if (disabled) return;
    /* Flip upward when the trigger sits too low for the menu to fit. */
    const rect = triggerRef.current?.getBoundingClientRect();
    setDropUp(Boolean(rect && window.innerHeight - rect.bottom < 260));
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function closeList(returnFocus = true) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function commit(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange(option.value);
    closeList();
  }

  /* Focus the list on open so arrow keys land somewhere predictable. */
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  /* Keeps the active option in view while arrowing through a long list. */
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function step(offset: number) {
    setActiveIndex((current) => {
      let next = current;
      for (let i = 0; i < options.length; i += 1) {
        next = (next + offset + options.length) % options.length;
        if (!options[next]?.disabled) return next;
      }
      return current;
    });
  }

  function onListKeyDown(event: React.KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        step(1);
        return;
      case "ArrowUp":
        event.preventDefault();
        step(-1);
        return;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        return;
      case "End":
        event.preventDefault();
        setActiveIndex(options.length - 1);
        return;
      case "Enter":
      case " ":
        event.preventDefault();
        commit(activeIndex);
        return;
      case "Escape":
        event.preventDefault();
        closeList();
        return;
      case "Tab":
        setOpen(false);
        return;
    }

    /* Typeahead: letters jump to the first option that starts with them. */
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      window.clearTimeout(typeahead.current.timer);
      typeahead.current.buffer += event.key.toLowerCase();
      typeahead.current.timer = window.setTimeout(() => {
        typeahead.current.buffer = "";
      }, 600);

      const match = options.findIndex(
        (option) =>
          !option.disabled &&
          option.label.toLowerCase().startsWith(typeahead.current.buffer),
      );
      if (match >= 0) setActiveIndex(match);
    }
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={hideLabel ? label : undefined}
        aria-invalid={error || undefined}
        disabled={disabled}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
            event.preventDefault();
            openList();
          }
        }}
        className={cn(
          TRIGGER,
          "h-11",
          error && "border-error focus-visible:border-error focus-visible:shadow-focus-error",
        )}
      >
        <span
          className={cn("truncate text-left", !selected && "text-text-muted")}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${listId}-${activeIndex}`}
          onKeyDown={onListKeyDown}
          className={cn(
            "absolute z-40 max-h-60 w-full min-w-max overflow-y-auto rounded-panel border border-border bg-surface p-1 shadow-float outline-none",
            dropUp ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;

            return (
              <li key={option.value} role="none">
                <div
                  id={`${listId}-${index}`}
                  role="option"
                  data-index={index}
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  onClick={() => commit(index)}
                  onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                  className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-btn px-2.5 py-2 text-sm transition-colors",
                    option.disabled && "pointer-events-none opacity-50",
                    index === activeIndex
                      ? "bg-primary-soft text-primary-dark"
                      : "text-text-secondary",
                  )}
                >
                  <Check
                    aria-hidden
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      isSelected ? "text-primary" : "invisible",
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.hint ? (
                      <span className="block text-xs text-text-muted">
                        {option.hint}
                      </span>
                    ) : null}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
