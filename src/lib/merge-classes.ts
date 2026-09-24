import { cn } from "@/lib/utils";

/**
 * Layered class merging for the components that own a style recipe - `Badge`
 * and `Button`.
 *
 * `cn()` is a plain join, so a `px-3` passed to a component that already sets
 * `px-2` does not replace it: both land on the element and whichever Tailwind
 * happens to emit later wins. For padding that is the larger number, for
 * weights it is alphabetical, and neither is what the call site asked for.
 * `mergeClasses` settles it by intent instead - a later layer drops every class
 * of an earlier layer that sets the same property under the same modifiers.
 *
 * Deliberately small. It knows the properties these recipes actually set, not
 * all of Tailwind, and anything it does not recognise is kept as-is. It only
 * ever drops classes, never rewrites them: Tailwind generates what it finds in
 * the source, so a `pl-2` synthesised here from a `px-2` would have no rule
 * behind it. A one-sided override of a two-sided class therefore replaces both
 * sides, and the call site states both.
 */

const TEXT_SIZE = /^text-(xs|sm|base|lg|xl|\dxl|meta|\[\d)/;
const TEXT_OTHER = /^text-(left|center|right|justify|start|end|balance|pretty|wrap|nowrap|ellipsis|clip)$/;

const GROUPS: [string, RegExp][] = [
  ["display", /^(hidden|block|inline|inline-block|inline-flex|flex|grid|inline-grid|contents)$/],
  ["position", /^(static|relative|absolute|fixed|sticky)$/],
  ["gap", /^gap-/],
  ["font-size", TEXT_SIZE],
  ["text-align", /^text-(left|center|right|justify|start|end)$/],
  ["text-wrap", /^text-(balance|pretty|wrap|nowrap)$/],
  ["whitespace", /^whitespace-/],
  ["user-select", /^select-/],
  ["weight", /^font-(thin|light|normal|medium|semibold|bold|extrabold|black)$/],
  ["font-family", /^font-(sans|mono|serif|heading|body)$/],
  ["casing", /^(capitalize|uppercase|lowercase|normal-case)$/],
  ["decoration", /^(underline|no-underline|line-through|overline)$/],
  ["underline-offset", /^underline-offset-/],
  ["radius", /^rounded(-|$)/],
  ["tracking", /^tracking-/],
  ["leading", /^leading-/],
  ["justify", /^justify-/],
  ["align-items", /^items-/],
  ["shadow", /^shadow(-|$)/],
  ["opacity", /^opacity-/],
  ["cursor", /^cursor-/],
  ["pointer-events", /^pointer-events-/],
  ["transition", /^transition(-|$)/],
  ["duration", /^duration-/],
  ["translate-y", /^-?translate-y-/],
  ["translate-x", /^-?translate-x-/],
  ["min-width", /^min-w-/],
  ["background-image", /^(bg-none|bg-linear|bg-gradient|brand-gradient)/],
  ["background-color", /^bg-/],
  ["border-width", /^border(-[xytrbl])?(-\d+)?$/],
  ["border-style", /^border-(solid|dashed|dotted|double|none)$/],
  ["border-color", /^border-/],
];

/* Box sides, so the eyebrow's `pr-4` can be replaced by a `pr-3.5` without
   also losing its `pl-3`, and a `size-5` replaces both an `h-9` and a `w-9`. */
const SIDES: [RegExp, string[]][] = [
  [/^p-/, ["pt", "pr", "pb", "pl"]],
  [/^px-/, ["pr", "pl"]],
  [/^py-/, ["pt", "pb"]],
  [/^pt-/, ["pt"]],
  [/^pr-/, ["pr"]],
  [/^pb-/, ["pb"]],
  [/^pl-/, ["pl"]],
  [/^size-/, ["h", "w"]],
  [/^h-/, ["h"]],
  [/^w-/, ["w"]],
];

/**
 * Splits `hover:[&_svg]:size-4` into its modifiers and its utility, ignoring
 * colons inside brackets. An important `!` is part of neither.
 */
function split(token: string): [string, string] {
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < token.length; i++) {
    const char = token[i];
    if (char === "[" || char === "(") depth++;
    else if (char === "]" || char === ")") depth--;
    else if (char === ":" && depth === 0) cut = i;
  }
  const utility = token.slice(cut + 1).replace(/^!|!$/g, "");
  return [token.slice(0, cut + 1), utility];
}

/** The property slots one class occupies, keyed by its modifiers. */
function slotsOf(token: string): string[] {
  const [modifiers, utility] = split(token);

  for (const [pattern, sides] of SIDES) {
    if (pattern.test(utility)) return sides.map((side) => `${modifiers}${side}`);
  }

  if (/^text-/.test(utility) && !TEXT_SIZE.test(utility) && !TEXT_OTHER.test(utility)) {
    return [`${modifiers}text-color`];
  }

  const group = GROUPS.find(([, pattern]) => pattern.test(utility));
  return group ? [`${modifiers}${group[0]}`] : [];
}

/**
 * Joins the layers in order, each able to replace what came before it.
 *
 * `mergeClasses(base, variant, size, className)`: the variant can restate a
 * base rule, the size can restate the variant's geometry, and the call site
 * has the last word on all three.
 */
export function mergeClasses(...layers: (string | false | null | undefined)[]): string {
  let kept: string[] = [];

  for (const layer of layers) {
    if (!layer) continue;
    const tokens = layer.split(/\s+/).filter(Boolean);
    const replaced = new Set(tokens.flatMap(slotsOf));
    kept = kept.filter((token) => !slotsOf(token).some((slot) => replaced.has(slot)));
    kept.push(...tokens);
  }

  return cn(kept);
}
