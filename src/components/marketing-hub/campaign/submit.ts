import type { CampaignDraft } from "@/types/marketing";

/**
 * The one seam between the wizard and a backend.
 *
 * Everything else in this folder is pure or renders; this is the only function
 * that would become a network call, so it is the only one an RTK Query mutation
 * has to replace. It is deliberately `async` and deliberately able to throw,
 * because the wizard's loading, double-submit and error states are only
 * meaningful against something that takes time and can fail - wiring them to a
 * synchronous stub would mean shipping three code paths nobody has ever run.
 *
 * The offline check is a real failure this can hit today, so the error branch
 * is reachable rather than theoretical.
 */

export type SubmitMode = "draft" | "launch";

export interface SubmitResult {
  id: string;
  /** What the campaign becomes: a saved draft, or something due to go out. */
  status: "draft" | "queued";
}

export async function saveCampaign(
  draft: CampaignDraft,
  mode: SubmitMode,
): Promise<SubmitResult> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new Error(
      "You appear to be offline. Nothing was saved - reconnect and try again.",
    );
  }

  /* Stands in for the round trip. Long enough that the loading state is
     visible, short enough not to feel broken. */
  await new Promise((resolve) => setTimeout(resolve, 450));

  return {
    id: `cmp-${draft.channel}-${Date.now().toString(36)}`,
    status: mode === "draft" ? "draft" : "queued",
  };
}

/** What the toast says once it lands. */
export function successMessage(draft: CampaignDraft, mode: SubmitMode): string {
  if (mode === "draft") return "Campaign saved as draft";
  if (draft.sendMode === "later") return "Campaign scheduled successfully";
  return draft.channel === "social"
    ? "Campaign published successfully"
    : "Campaign launched successfully";
}
