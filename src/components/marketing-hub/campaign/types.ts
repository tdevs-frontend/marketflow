import type { CampaignDraft, MarketingChannel, WizardStep } from "@/types/marketing";
import type { DraftDerived } from "./draft";
import type { PreflightIssue } from "./validation";

/**
 * What every step is handed.
 *
 * One shape rather than a bespoke prop list per step: the wizard owns the
 * draft, and a step's job is to render part of it and write back. `setChannel`
 * is separate from `set` because changing channel is not a field write — it
 * invalidates the sender, the template and the UTM defaults, and that repair
 * belongs in one place rather than in whichever step happens to change it.
 */
export interface StepProps {
  draft: CampaignDraft;
  set: <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => void;
  setChannel: (channel: MarketingChannel) => void;
  errors: Record<string, string>;
  derived: DraftDerived;
  issues: PreflightIssue[];
  /** Jump to a step — used by the Review checklist and the empty states. */
  goTo: (step: WizardStep) => void;
  /** Shared preview controls, so a device choice survives a step change. */
  preview: {
    device: "desktop" | "mobile";
    setDevice: (value: "desktop" | "mobile") => void;
    platform: import("@/types/social").SocialPlatform;
    setPlatform: (value: import("@/types/social").SocialPlatform) => void;
  };
}
