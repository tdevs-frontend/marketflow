"use client";

import { Check, CheckCheck, Link2 } from "lucide-react";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { PLATFORM_THEME } from "@/constants/channels";
import { useMediaAssets } from "@/lib/media-store";
import { cn } from "@/lib/utils";
import type { CampaignDraft } from "@/types/marketing";
import type { SocialPlatform } from "@/types/social";
import { PlatformMark } from "../shared/channel-badge";
import { AssetThumb } from "./media-picker";
import { composedCaption, renderPersonalised } from "./draft";
import type { DraftDerived } from "./draft";

/**
 * How the campaign will look where it lands.
 *
 * Four previews rather than one, because the thing a merchant is checking is
 * different in each: on WhatsApp it is whether the message reads like a person
 * wrote it, on email whether the subject and preview line work together in a
 * crowded inbox, on SMS whether it fits, and on social whether the caption
 * survives the fold.
 *
 * Deliberately restrained. These are built from the same panels, borders and
 * type scale as the rest of the dashboard - a pixel-accurate iPhone frame would
 * be a second design system, and it would still be wrong on Android.
 */

/** Characters each platform shows before "… more". */
const PLATFORM_FOLD: Record<SocialPlatform, number> = {
  instagram: 125,
  facebook: 250,
  linkedin: 210,
  x: 280,
};

const PHONE = "mx-auto max-w-sm overflow-hidden rounded-panel border border-border";

function PreviewStage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-panel bg-background p-4", className)}>
      {children}
    </div>
  );
}

function EmptyPreview({ label }: { label: string }) {
  return (
    <p className="rounded-panel border border-dashed border-border px-3.5 py-6 text-center text-sm font-medium text-text-muted">
      {label}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* WhatsApp                                                                   */
/* -------------------------------------------------------------------------- */

function WhatsAppPreview({ body }: { body: string }) {
  return (
    <PreviewStage>
      <div className={cn(PHONE, "bg-whatsapp-soft")}>
        <div className="flex items-center gap-2.5 border-b border-whatsapp-border bg-whatsapp px-3.5 py-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/20 text-sm font-bold text-white">
            M
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-white">
              MarketFlow
            </span>
            <span className="block text-sm text-white/80">Business account</span>
          </span>
        </div>

        <div className="px-3.5 py-4">
          {/* Outbound bubble: tail on the right, ticks in the corner - the two
              details that make a WhatsApp message recognisable at a glance. */}
          <div className="ml-auto max-w-[85%] rounded-panel rounded-tr-none bg-surface px-3 py-2 shadow-card">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-text-primary">
              {body || (
                <span className="text-text-muted italic">
                  Your message appears here
                </span>
              )}
            </p>
            <p className="mt-1 flex items-center justify-end gap-1 text-text-muted">
              <span className="text-sm">09:00</span>
              <CheckCheck className="size-3.5" aria-hidden />
            </p>
          </div>
        </div>
      </div>
    </PreviewStage>
  );
}

/* -------------------------------------------------------------------------- */
/* Email                                                                      */
/* -------------------------------------------------------------------------- */

function EmailPreview({
  draft,
  body,
  device,
  onDeviceChange,
}: {
  draft: CampaignDraft;
  body: string;
  device: "desktop" | "mobile";
  onDeviceChange: (value: "desktop" | "mobile") => void;
}) {
  return (
    <div className="space-y-2.5">
      <SegmentedControl
        label="Preview device"
        size="sm"
        value={device}
        onChange={onDeviceChange}
        options={[
          { value: "desktop", label: "Desktop" },
          { value: "mobile", label: "Mobile" },
        ]}
      />

      <PreviewStage>
        <div
          className={cn(
            "overflow-hidden rounded-panel border border-border bg-surface",
            device === "mobile" ? "mx-auto max-w-sm" : "w-full",
          )}
        >
          {/* The inbox row, before the open - subject and preview text are read
              together there or not at all. */}
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-text-muted">
              {draft.sender.emailFrom || "sender not set"}
            </p>
            <p className="mt-0.5 text-sm font-bold text-text-primary">
              {draft.subject || (
                <span className="text-text-muted italic">No subject line</span>
              )}
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-text-secondary">
              {draft.previewText || body.slice(0, 90) || "…"}
            </p>
          </div>

          <div className="px-4 py-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-text-secondary">
              {body || (
                <span className="text-text-muted italic">
                  Your email body appears here
                </span>
              )}
            </p>

            {draft.ctaLabel ? (
              <span className="mt-4 inline-flex h-10 items-center rounded-btn bg-primary px-4 text-sm font-bold text-white">
                {draft.ctaLabel}
              </span>
            ) : null}

            <p className="mt-5 border-t border-border pt-3 text-sm font-medium text-text-muted">
              You are receiving this because you subscribed to MarketFlow.
              <span className="ml-1 underline">Unsubscribe</span>
            </p>
          </div>
        </div>
      </PreviewStage>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SMS                                                                        */
/* -------------------------------------------------------------------------- */

function SmsPreview({ body, sender }: { body: string; sender: string }) {
  return (
    <PreviewStage>
      <div className={cn(PHONE, "bg-surface")}>
        <div className="border-b border-border px-3.5 py-2.5 text-center">
          <p className="text-sm font-bold text-text-primary">
            {sender || "Sender ID"}
          </p>
        </div>

        <div className="px-3.5 py-4">
          <div className="max-w-[85%] rounded-panel rounded-bl-none bg-sms-soft px-3 py-2">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-text-primary">
              {body || (
                <span className="text-text-muted italic">
                  Your message appears here
                </span>
              )}
            </p>
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-sm text-text-muted">
            <Check className="size-3.5" aria-hidden />
            Delivered
          </p>
        </div>
      </div>
    </PreviewStage>
  );
}

/* -------------------------------------------------------------------------- */
/* Social                                                                     */
/* -------------------------------------------------------------------------- */

function SocialPreview({
  draft,
  derived,
  platform,
  onPlatformChange,
  caption,
}: {
  draft: CampaignDraft;
  derived: DraftDerived;
  platform: SocialPlatform;
  onPlatformChange: (value: SocialPlatform) => void;
  caption: string;
}) {
  /* Above the early return: an asset uploaded in the composer has to reach the
     preview, and a hook behind a branch is not a hook. */
  const assets = useMediaAssets();

  if (derived.platforms.length === 0) {
    return <EmptyPreview label="Pick an account to see how this post will look." />;
  }

  const active = derived.platforms.includes(platform)
    ? platform
    : derived.platforms[0];
  const account = derived.accounts.find((item) => item.platform === active);
  const media = assets.find((asset) => asset.id === draft.mediaIds[0]);
  const fold = PLATFORM_FOLD[active];

  return (
    <div className="space-y-2.5">
      {derived.platforms.length > 1 ? (
        <SegmentedControl
          label="Preview platform"
          size="sm"
          value={active}
          onChange={onPlatformChange}
          options={derived.platforms.map((item) => ({
            value: item,
            label: PLATFORM_THEME[item].label,
          }))}
        />
      ) : null}

      <PreviewStage>
        <div className={cn(PHONE, "bg-surface")}>
          <div className="flex items-center gap-2.5 px-3.5 py-2.5">
            <PlatformMark platform={active} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-text-primary">
                {account?.name ?? "MarketFlow"}
              </span>
              <span className="block truncate text-sm text-text-muted">
                {account?.username ?? "@marketflow"}
              </span>
            </span>
          </div>

          {media ? (
            <AssetThumb
              asset={media}
              className={cn(
                "w-full",
                /* Instagram crops to square, the rest keep 16:9. */
                active === "instagram" ? "aspect-square" : "aspect-video",
              )}
            />
          ) : null}

          <div className="px-3.5 py-3">
            <p className="text-sm leading-relaxed whitespace-pre-line text-text-secondary">
              {caption.length > fold ? (
                <>
                  {caption.slice(0, fold)}
                  <span className="text-text-muted">
                    … <span className="font-medium">more</span>
                  </span>
                </>
              ) : (
                caption || (
                  <span className="text-text-muted italic">
                    Your caption appears here
                  </span>
                )
              )}
            </p>

            {draft.ctaUrl ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary">
                <Link2 className="size-3.5" aria-hidden />
                <span className="truncate">{draft.ctaUrl}</span>
              </p>
            ) : null}
          </div>
        </div>
      </PreviewStage>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Switch                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The right preview for the draft's channel, with merge tags resolved.
 *
 * `personalise` is what separates the Content preview from the Personalise one:
 * the composer shows the raw tags being typed, and the later steps show what a
 * recipient actually gets.
 */
export function ChannelPreview({
  draft,
  derived,
  personalise = true,
  device,
  onDeviceChange,
  platform,
  onPlatformChange,
}: {
  draft: CampaignDraft;
  derived: DraftDerived;
  personalise?: boolean;
  device: "desktop" | "mobile";
  onDeviceChange: (value: "desktop" | "mobile") => void;
  platform: SocialPlatform;
  onPlatformChange: (value: SocialPlatform) => void;
}) {
  const resolve = (text: string) =>
    personalise ? renderPersonalised(text, draft.fallbacks) : text;

  const body = resolve(draft.message);

  switch (draft.channel) {
    case "whatsapp":
      return <WhatsAppPreview body={body} />;
    case "email":
      return (
        <EmailPreview
          draft={{ ...draft, subject: resolve(draft.subject) }}
          body={body}
          device={device}
          onDeviceChange={onDeviceChange}
        />
      );
    case "sms":
      return <SmsPreview body={body} sender={draft.sender.smsSenderId} />;
    case "social":
      return (
        <SocialPreview
          draft={draft}
          derived={derived}
          platform={platform}
          onPlatformChange={onPlatformChange}
          caption={resolve(composedCaption(draft))}
        />
      );
  }
}
