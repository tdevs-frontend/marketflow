import type { CampaignDraft } from "@/types/marketing";
import { EMPTY_DRAFT } from "./draft";

/**
 * Keeping a half-finished campaign alive across a reload.
 *
 * `sessionStorage`, not `localStorage`, and the difference is deliberate. The
 * problem being solved is a refresh, a crash, or a mis-click on Back — all of
 * which happen inside one tab, in one sitting. `localStorage` would also
 * resurrect a draft someone abandoned three weeks ago, in a new tab, on top of
 * the campaign they came here to write, which is a worse bug than the one this
 * fixes.
 *
 * Everything here is wrapped in try/catch and returns `null` on any doubt:
 * storage throws in private-mode Safari and when a quota is full, and a wizard
 * that cannot open because it failed to *restore* a draft is far worse than one
 * that quietly starts fresh.
 */

/* Version the key rather than migrating. A draft is minutes of work, not
   months, so a shape change can safely drop what it cannot read — and a
   half-migrated draft that sends to the wrong audience is not worth it. */
const KEY = "marketflow:campaign-wizard:v1";

export interface StoredWizard {
  draft: CampaignDraft;
  index: number;
  furthest: number;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Rebuild a draft from whatever was stored, over the top of a complete one.
 *
 * Field-by-field merge rather than a plain spread: a payload written by an
 * older build is missing keys the current one reads, and `draft.tracking.utm`
 * coming back `undefined` would crash the Review step on mount. Nested groups
 * are merged one level down for the same reason.
 */
function reviveDraft(value: unknown): CampaignDraft | null {
  if (!isObject(value)) return null;
  /* Two fields prove it is a campaign draft and not some other payload that
     happened to land on this key. */
  if (typeof value.name !== "string" || typeof value.channel !== "string") {
    return null;
  }

  /* Only the object-valued groups, so the spread below has something to spread
     — the generic `keyof CampaignDraft` version cannot prove that for a string
     field, and would need a cast that hides exactly the mistake it invites. */
  type GroupKey = "sender" | "exclusions" | "quietHours" | "frequencyCap" | "abTest";

  const group = <K extends GroupKey>(key: K): CampaignDraft[K] =>
    isObject(value[key])
      ? ({ ...EMPTY_DRAFT[key], ...value[key] } as CampaignDraft[K])
      : EMPTY_DRAFT[key];

  return {
    ...EMPTY_DRAFT,
    ...value,
    sender: group("sender"),
    exclusions: group("exclusions"),
    quietHours: group("quietHours"),
    frequencyCap: group("frequencyCap"),
    abTest: group("abTest"),
    fallbacks: isObject(value.fallbacks)
      ? (value.fallbacks as Record<string, string>)
      : {},
    tracking: {
      ...EMPTY_DRAFT.tracking,
      ...(isObject(value.tracking) ? value.tracking : {}),
      utm: {
        ...EMPTY_DRAFT.tracking.utm,
        ...(isObject(value.tracking) && isObject(value.tracking.utm)
          ? value.tracking.utm
          : {}),
      },
    },
  } as CampaignDraft;
}

/**
 * Turn a parsed payload into a wizard state, or refuse it.
 *
 * Split from `loadWizard` so the decisions here — what counts as a draft, how
 * a bad index is clamped, which nested groups get filled in — can be exercised
 * without a browser. `loadWizard` is then only the I/O around it.
 */
export function parseStoredWizard(
  value: unknown,
  totalSteps: number,
): StoredWizard | null {
  if (!isObject(value)) return null;

  const draft = reviveDraft(value.draft);
  if (!draft) return null;

  /* Clamp rather than trust: a stored index past the last step would render an
     empty wizard with no way back. */
  const clamp = (input: unknown) =>
    typeof input === "number" && Number.isFinite(input)
      ? Math.min(Math.max(Math.trunc(input), 0), totalSteps - 1)
      : 0;

  const furthest = clamp(value.furthest);
  return {
    draft,
    /* Never restore ahead of the furthest step reached, or the stepper would
       show a current step it also considers unreachable. */
    index: Math.min(clamp(value.index), furthest),
    furthest,
  };
}

export function loadWizard(totalSteps: number): StoredWizard | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    return parseStoredWizard(JSON.parse(raw), totalSteps);
  } catch {
    return null;
  }
}

export function saveWizard(value: StoredWizard): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* Full quota or blocked storage. The wizard still works in memory, and
       warning someone mid-sentence that their draft is not being backed up
       would be more alarming than useful. */
  }
}

export function clearWizard(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* Nothing to do — the draft is submitted either way. */
  }
}
