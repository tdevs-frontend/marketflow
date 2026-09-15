"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_VARIANT_OPTIONS, VARIANT_OPTION_PRESETS } from "@/constants/commerce";
import { containsValue, moveItem, nextOptionName } from "@/lib/variants";
import { cn } from "@/lib/utils";
import type { ProductType, VariantOption } from "@/types/commerce";

/**
 * The option builder — the half of the variant system a merchant actually
 * authors. Everything below it (the grid, the table, the price range) is
 * derived from what is typed here.
 *
 * Two rules shape the whole component:
 *
 * Renames are safe and removals are not. Renaming an *option* ("Colour" to
 * "Color") touches no variant, because a variant stores its values positionally
 * and not the option's name — so it applies immediately. Removing an option or
 * a value destroys every variant underneath it, so this component never does
 * it: it raises a request and the manager above confirms first.
 *
 * Values cannot be edited in place, only added and removed. That is deliberate
 * rather than an omission — a variant is matched to its combination by value,
 * so quietly retyping "Black" as "Navy" would orphan that row's SKU, stock and
 * image with no warning at all. Removing and adding says what is happening, and
 * gets the confirmation it deserves.
 */

/** Suggested names for the type, minus the ones already used. */
function suggestionsFor(type: ProductType, options: VariantOption[]): string[] {
  const used = new Set(options.map((option) => option.name.trim().toLowerCase()));
  return VARIANT_OPTION_PRESETS[type].filter(
    (name) => !used.has(name.toLowerCase()),
  );
}

/** A square icon button at table density — reorder and remove controls. */
function IconButton({
  label,
  onClick,
  disabled,
  tone = "muted",
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "muted" | "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-btn transition-colors focus-visible:shadow-focus focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35",
        tone === "danger"
          ? "text-text-muted hover:bg-error-soft hover:text-error-text"
          : "text-text-muted hover:bg-surface-secondary hover:text-text-primary",
      )}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Values                                                                     */
/* -------------------------------------------------------------------------- */

function ValueChip({
  value,
  index,
  total,
  onMove,
  onRemove,
}: {
  value: string;
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  return (
    <li className="inline-flex items-center gap-0.5 rounded-full border border-border bg-surface py-0.5 pr-0.5 pl-2.5">
      <span className="text-sm font-medium text-text-primary">{value}</span>

      {/* Only worth showing once there is somewhere to move to. */}
      {total > 1 ? (
        <>
          <IconButton
            label={`Move ${value} earlier`}
            onClick={() => onMove(index, index - 1)}
            disabled={index === 0}
          >
            <ChevronLeft className="size-3.5" aria-hidden />
          </IconButton>
          <IconButton
            label={`Move ${value} later`}
            onClick={() => onMove(index, index + 1)}
            disabled={index === total - 1}
          >
            <ChevronRight className="size-3.5" aria-hidden />
          </IconButton>
        </>
      ) : null}

      <IconButton label={`Remove ${value}`} onClick={onRemove} tone="danger">
        <X className="size-3.5" aria-hidden />
      </IconButton>
    </li>
  );
}

/** The add-a-value field. Enter commits, so a merchant never reaches for Add. */
function ValueInput({
  optionName,
  existing,
  onAdd,
}: {
  optionName: string;
  existing: string[];
  onAdd: (value: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const trimmed = draft.trim();
  const duplicate = Boolean(trimmed) && containsValue(existing, trimmed);

  function commit() {
    if (!trimmed || duplicate) return;
    onAdd(trimmed);
    setDraft("");
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Input
          size="sm"
          value={draft}
          error={duplicate}
          placeholder={`Add a ${optionName.toLowerCase() || "value"}…`}
          aria-label={`Add a value to ${optionName || "this option"}`}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            /* Inside a form, Enter would submit the product. */
            event.preventDefault();
            commit();
          }}
          className="sm:max-w-64"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!trimmed || duplicate}
          onClick={commit}
        >
          <Plus aria-hidden />
          Add
        </Button>
      </div>

      {duplicate ? (
        <p role="alert" className="text-sm text-error">
          {optionName || "This option"} already has “{trimmed}”.
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

export interface VariantOptionsEditorProps {
  type: ProductType;
  options: VariantOption[];
  /** Renames and value additions — changes that destroy nothing. */
  onChange: (next: VariantOption[]) => void;
  /**
   * A reorder, which has to re-slice every variant's positional values.
   *
   * `order` holds each surviving option's *old* index, which is what
   * `reorderVariantValues` needs to keep "Medium / Black" from becoming
   * "Black / Medium".
   */
  onReorder: (next: VariantOption[], order: number[]) => void;
  /** Destructive. The manager confirms before applying. */
  onRequestRemoveOption: (index: number) => void;
  onRequestRemoveValue: (optionIndex: number, value: string) => void;
}

export function VariantOptionsEditor({
  type,
  options,
  onChange,
  onReorder,
  onRequestRemoveOption,
  onRequestRemoveValue,
}: VariantOptionsEditorProps) {
  const suggestions = suggestionsFor(type, options);
  const atLimit = options.length >= MAX_VARIANT_OPTIONS;

  /** A name already taken by another option — the one thing §3 forbids. */
  function duplicateName(index: number): boolean {
    const name = options[index].name.trim().toLowerCase();
    if (!name) return false;
    return options.some(
      (option, position) =>
        position !== index && option.name.trim().toLowerCase() === name,
    );
  }

  function addOption() {
    const name = nextOptionName(
      options.map((option) => option.name),
      VARIANT_OPTION_PRESETS[type],
    );
    onChange([
      ...options,
      { id: `opt-${Date.now().toString(36)}`, name, values: [] },
    ]);
  }

  function renameOption(index: number, name: string) {
    onChange(
      options.map((option, position) =>
        position === index ? { ...option, name } : option,
      ),
    );
  }

  function moveOption(from: number, to: number) {
    if (to < 0 || to >= options.length) return;
    const order = moveItem(
      options.map((_, index) => index),
      from,
      to,
    );
    onReorder(moveItem(options, from, to), order);
  }

  function addValue(index: number, value: string) {
    onChange(
      options.map((option, position) =>
        position === index
          ? { ...option, values: [...option.values, value] }
          : option,
      ),
    );
  }

  function moveValue(index: number, from: number, to: number) {
    onChange(
      options.map((option, position) =>
        position === index
          ? { ...option, values: moveItem(option.values, from, to) }
          : option,
      ),
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {options.map((option, index) => {
          const clash = duplicateName(index);

          return (
            <li
              key={option.id}
              className="rounded-panel border border-border bg-surface p-3.5"
            >
              {/* Name, and where the option sits in the variant's name. */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-text-muted tabular-nums">
                  Option {index + 1}
                </span>

                <Input
                  size="sm"
                  value={option.name}
                  error={clash}
                  aria-label={`Option ${index + 1} name`}
                  placeholder={VARIANT_OPTION_PRESETS[type][index] ?? "Option name"}
                  onChange={(event) => renameOption(index, event.target.value)}
                  className="w-full sm:w-52"
                />

                <div className="ml-auto flex items-center gap-0.5">
                  {options.length > 1 ? (
                    <>
                      <IconButton
                        label={`Move ${option.name || "option"} up`}
                        onClick={() => moveOption(index, index - 1)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="size-4" aria-hidden />
                      </IconButton>
                      <IconButton
                        label={`Move ${option.name || "option"} down`}
                        onClick={() => moveOption(index, index + 1)}
                        disabled={index === options.length - 1}
                      >
                        <ChevronDown className="size-4" aria-hidden />
                      </IconButton>
                    </>
                  ) : null}
                  <IconButton
                    label={`Delete ${option.name || "option"}`}
                    onClick={() => onRequestRemoveOption(index)}
                    tone="danger"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </IconButton>
                </div>
              </div>

              {clash ? (
                <p role="alert" className="mt-1.5 text-sm text-error">
                  Another option is already called “{option.name.trim()}”.
                </p>
              ) : null}

              {/* Values */}
              <div className="mt-3 space-y-2.5">
                {option.values.length > 0 ? (
                  <ul className="flex flex-wrap items-center gap-1.5">
                    {option.values.map((value, position) => (
                      <ValueChip
                        key={value}
                        value={value}
                        index={position}
                        total={option.values.length}
                        onMove={(from, to) => moveValue(index, from, to)}
                        onRemove={() => onRequestRemoveValue(index, value)}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-medium text-text-muted">
                    No values yet — nothing is generated until this option has at
                    least one.
                  </p>
                )}

                <ValueInput
                  optionName={option.name}
                  existing={option.values}
                  onAdd={(value) => addValue(index, value)}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="compact"
          disabled={atLimit}
          onClick={addOption}
        >
          <Plus aria-hidden />
          Add Option
        </Button>

        <p className="text-sm font-medium text-text-muted">
          {atLimit
            ? `${MAX_VARIANT_OPTIONS} options is the limit — every extra axis multiplies the grid.`
            : suggestions.length > 0
              ? `Commonly ${suggestions.slice(0, 3).join(", ")}.`
              : `Up to ${MAX_VARIANT_OPTIONS} options.`}
        </p>
      </div>
    </div>
  );
}
