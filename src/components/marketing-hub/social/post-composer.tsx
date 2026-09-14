"use client";

import { useMemo, useState } from "react";
import { Check, Hash, ImagePlus, Send, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Tag } from "@/components/ui/tag";
import { useToast } from "@/components/ui/toast";
import { PLATFORM_THEME } from "@/constants/channels";
import { MEDIA_ASSETS, publishableAccounts } from "@/lib/social-fixtures";
import { SocialAccountSelector } from "@/components/integrations/social/social-account-selector";
import { cn } from "@/lib/utils";
import type { SocialPlatform } from "@/types/social";
import { PlatformMark } from "../shared/channel-badge";

/**
 * Create Post.
 *
 * Ordered the way the spec's flow runs — platform, media, caption, hashtags,
 * preview, schedule — and the preview is per-platform rather than generic,
 * because the same caption is a different post on each: X truncates at 280, an
 * Instagram caption hides after two lines, and LinkedIn shows a link preview
 * card. A single "preview" pane would be lying about at least two of them.
 *
 * Character limits come from the platforms and are enforced as a warning
 * rather than a hard stop: the field belongs to the author, and a caption that
 * is fine on Facebook should not be blocked because X is also selected.
 */

const PLATFORM_LIMITS: Record<SocialPlatform, number> = {
  instagram: 2_200,
  facebook: 63_206,
  linkedin: 3_000,
  x: 280,
};

/** Where the caption visibly truncates in each platform's own feed. */
const PLATFORM_FOLD: Record<SocialPlatform, number> = {
  instagram: 125,
  facebook: 250,
  linkedin: 210,
  x: 280,
};

const SUGGESTED_HASHTAGS = [
  "#autumn2026",
  "#marketingautomation",
  "#whatsappmarketing",
  "#smallbusiness",
  "#saas",
  "#customerstory",
  "#growth",
  "#emailmarketing",
];

export function PostComposer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();

  /*
   * The composer selects *accounts*, not platforms.
   *
   * A merchant with two Facebook Pages has to be able to say which one, and a
   * platform-level toggle cannot express that. The list comes from
   * `publishableAccounts()` — the same predicate Integrations → Social uses —
   * so an account whose token expired this morning is simply not offered, and
   * this component never has to know what a token is.
   */
  const publishable = publishableAccounts();
  const [accountIds, setAccountIds] = useState<string[]>(() =>
    publishable[0] ? [publishable[0].id] : [],
  );
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagDraft, setHashtagDraft] = useState("");
  const [previewPlatform, setPreviewPlatform] = useState<SocialPlatform>("instagram");
  const [mediaOpen, setMediaOpen] = useState(false);

  const selectedAccounts = publishable.filter((account) =>
    accountIds.includes(account.id),
  );

  /* Character limits and the preview are genuinely per-platform, not per
     account — two Facebook Pages render a caption identically — so the
     platform list is derived rather than stored. */
  const platforms = useMemo(
    () => [...new Set(selectedAccounts.map((account) => account.platform))],
    [selectedAccounts],
  );

  /* Composed text is what the platforms actually receive, so it is what the
     counters measure — hashtags count against the limit too. */
  const composed = useMemo(
    () => [caption, hashtags.join(" ")].filter(Boolean).join("\n\n"),
    [caption, hashtags],
  );

  /* Preview follows the selection: deselecting the platform you were
     previewing would otherwise leave a preview of a post you are not making. */
  const activePreview = platforms.includes(previewPlatform)
    ? previewPlatform
    : (platforms[0] ?? "instagram");

  const selectedMedia = MEDIA_ASSETS.filter((asset) => mediaIds.includes(asset.id));

  const overLimit = platforms.filter(
    (platform) => composed.length > PLATFORM_LIMITS[platform],
  );

  function addHashtag(value: string) {
    const tag = value.trim().replace(/^#*/, "");
    if (!tag) return;
    const formatted = `#${tag}`;
    setHashtags((current) =>
      current.includes(formatted) ? current : [...current, formatted],
    );
    setHashtagDraft("");
  }

  function reset() {
    setAccountIds(publishable[0] ? [publishable[0].id] : []);
    setMediaIds([]);
    setTitle("");
    setCaption("");
    setHashtags([]);
    setHashtagDraft("");
  }

  function submit(action: "draft" | "schedule") {
    onClose();
    toast(
      action === "draft"
        ? `${title || "Untitled post"} saved as a draft`
        : `${title || "Post"} scheduled to ${accountIds.length} account${accountIds.length === 1 ? "" : "s"}`,
    );
    reset();
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="Create post"
        description="One caption, published to every platform you pick."
        size="lg"
        footer={
          <>
            <Button variant="outline" size="compact" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="compact"
              onClick={() => submit("draft")}
            >
              Save draft
            </Button>
            <Button
              size="compact"
              onClick={() => submit("schedule")}
              disabled={accountIds.length === 0 || composed.length === 0}
            >
              <Send aria-hidden />
              Schedule
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* --------------------------------------------------- 1. Platform */}
          <section>
            <h3 className="text-sm font-medium tracking-[0.08em] text-text-muted uppercase">
              1 · Publish to
            </h3>

            <SocialAccountSelector
              selected={accountIds}
              onChange={setAccountIds}
              className="mt-2.5"
            />
          </section>

          {/* ------------------------------------------------------ 2. Media */}
          <section>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium tracking-[0.08em] text-text-muted uppercase">
                2 · Media
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setMediaOpen(true)}>
                <ImagePlus aria-hidden />
                Choose from library
              </Button>
            </div>

            {selectedMedia.length === 0 ? (
              <button
                type="button"
                onClick={() => setMediaOpen(true)}
                className="mt-2.5 flex w-full flex-col items-center gap-1.5 rounded-panel border border-dashed border-border-strong px-4 py-6 transition-colors hover:border-primary focus-visible:shadow-focus focus-visible:outline-none"
              >
                <Upload className="size-5 text-text-muted" aria-hidden />
                <span className="text-sm font-medium text-text-primary">
                  Add an image or video
                </span>
                <span className="text-sm text-text-muted">
                  Text-only posts are fine on X and LinkedIn, and reach far less
                  on Instagram
                </span>
              </button>
            ) : (
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {selectedMedia.map((asset) => (
                  <li key={asset.id} className="relative">
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-20 place-items-center rounded-panel",
                        asset.tone,
                      )}
                    >
                      {asset.type === "video" ? (
                        <span className="ml-1 block size-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-text-muted" />
                      ) : null}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setMediaIds((current) =>
                          current.filter((id) => id !== asset.id),
                        )
                      }
                      aria-label={`Remove ${asset.name}`}
                      className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full border border-border bg-surface text-text-muted shadow-btn transition-colors hover:text-error focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                    <p className="mt-1 max-w-20 truncate text-sm text-text-muted">
                      {asset.name}
                    </p>
                  </li>
                ))}

                <li>
                  <button
                    type="button"
                    onClick={() => setMediaOpen(true)}
                    className="grid size-20 place-items-center rounded-panel border border-dashed border-border-strong text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <ImagePlus className="size-5" aria-hidden />
                    <span className="sr-only">Add more media</span>
                  </button>
                </li>
              </ul>
            )}
          </section>

          {/* ---------------------------------------------------- 3. Caption */}
          <section className="space-y-4">
            <h3 className="text-sm font-medium tracking-[0.08em] text-text-muted uppercase">
              3 · Caption
            </h3>

            <Field
              label="Internal title"
              htmlFor="post-title"
              hint="Only you see this. It labels the post on the calendar."
            >
              <Input
                id="post-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </Field>

            <Field label="Caption" htmlFor="post-caption">
              <Textarea
                id="post-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                className="min-h-28"
              />
            </Field>

            {/* One counter per selected platform — the limits differ by an
                order of magnitude, so a single number would be meaningless. */}
            {platforms.length > 0 ? (
              <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                {platforms.map((platform) => {
                  const limit = PLATFORM_LIMITS[platform];
                  const over = composed.length > limit;

                  return (
                    <li
                      key={platform}
                      className="inline-flex items-center gap-1.5 text-sm"
                    >
                      <PlatformMark platform={platform} size="sm" />
                      <span
                        className={cn(
                          "font-medium tabular-nums",
                          over ? "text-error" : "text-text-secondary",
                        )}
                      >
                        {composed.length.toLocaleString()} /{" "}
                        {limit.toLocaleString()}
                      </span>
                      {composed.length > PLATFORM_FOLD[platform] && !over ? (
                        <span className="text-text-muted">
                          cut off after {PLATFORM_FOLD[platform]}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {overLimit.length > 0 ? (
              <p className="rounded-panel border border-error/25 bg-error-soft px-3 py-2 text-sm text-error-text">
                Too long for{" "}
                {overLimit.map((p) => PLATFORM_THEME[p].label).join(" and ")}.
                Publishing will fail there — trim the caption or deselect the
                platform.
              </p>
            ) : null}
          </section>

          {/* --------------------------------------------------- 4. Hashtags */}
          <section>
            <h3 className="text-sm font-medium tracking-[0.08em] text-text-muted uppercase">
              4 · Hashtags
            </h3>

            <div className="mt-2.5 flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Hash
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
                  aria-hidden
                />
                <Input
                  value={hashtagDraft}
                  onChange={(event) => setHashtagDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === ",") {
                      event.preventDefault();
                      addHashtag(hashtagDraft);
                    }
                  }}
                  aria-label="Add a hashtag"
                  className="h-10 pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="compact"
                onClick={() => addHashtag(hashtagDraft)}
              >
                Add
              </Button>
            </div>

            {hashtags.length > 0 ? (
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {hashtags.map((tag) => (
                  <li key={tag}>
                    <Tag
                      label={tag}
                      tone="bg-primary-soft text-primary-dark"
                      onRemove={() =>
                        setHashtags((current) =>
                          current.filter((value) => value !== tag),
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
            ) : null}

            <p className="mt-3 text-sm text-text-muted">Suggested</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {SUGGESTED_HASHTAGS.filter((tag) => !hashtags.includes(tag)).map(
                (tag) => (
                  <li key={tag}>
                    <button
                      type="button"
                      onClick={() => addHashtag(tag)}
                      className="rounded-btn border border-border px-2 py-0.5 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary-dark focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      {tag}
                    </button>
                  </li>
                ),
              )}
            </ul>
          </section>

          {/* ---------------------------------------------------- 5. Preview */}
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-medium tracking-[0.08em] text-text-muted uppercase">
                5 · Preview
              </h3>

              {platforms.length > 1 ? (
                <SegmentedControl
                  label="Preview platform"
                  value={activePreview}
                  onChange={setPreviewPlatform}
                  size="sm"
                  options={platforms.map((platform) => ({
                    value: platform,
                    label: PLATFORM_THEME[platform].label,
                  }))}
                />
              ) : null}
            </div>

            {platforms.length === 0 ? (
              <p className="mt-2.5 rounded-panel border border-dashed border-border px-3 py-4 text-center text-sm text-text-muted">
                Pick an account to see how this post will look.
              </p>
            ) : (
              <div className="mt-2.5 rounded-panel bg-background p-4">
                <div className="mx-auto max-w-sm overflow-hidden rounded-panel border border-border bg-surface">
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                    <PlatformMark platform={activePreview} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-text-primary">
                        MarketFlow
                      </p>
                      <p className="text-sm text-text-muted">
                        {selectedAccounts.find(
                          (account) => account.platform === activePreview,
                        )?.username ?? "@marketflow"}
                      </p>
                    </div>
                  </div>

                  {selectedMedia[0] ? (
                    <span
                      aria-hidden
                      className={cn(
                        "block w-full",
                        /* Instagram crops to square, the rest keep 16:9. */
                        activePreview === "instagram"
                          ? "aspect-square"
                          : "aspect-video",
                        selectedMedia[0].tone,
                      )}
                    />
                  ) : null}

                  <div className="px-3.5 py-3">
                    <p className="text-sm leading-relaxed whitespace-pre-line text-text-secondary">
                      {composed.length > PLATFORM_FOLD[activePreview] ? (
                        <>
                          {composed.slice(0, PLATFORM_FOLD[activePreview])}
                          <span className="text-text-muted">
                            … <span className="font-medium">more</span>
                          </span>
                        </>
                      ) : (
                        composed || (
                          <span className="text-text-muted italic">
                            Your caption appears here
                          </span>
                        )
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* --------------------------------------------------- 6. Schedule */}
          <section>
            <h3 className="text-sm font-medium tracking-[0.08em] text-text-muted uppercase">
              6 · Schedule
            </h3>

            <div className="mt-2.5 grid gap-4 sm:grid-cols-2">
              <Field label="Date" htmlFor="post-date">
                <Input id="post-date" type="date" />
              </Field>
              <Field
                label="Time"
                htmlFor="post-time"
                hint="15:00–18:00 is this account's best-performing window."
              >
                <Input id="post-time" type="time" defaultValue="15:30" />
              </Field>
            </div>
          </section>
        </div>
      </Dialog>

      {/* ---------------------------------------------------- Media picker */}
      <Dialog
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        title="Choose media"
        description={`${mediaIds.length} selected`}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="compact"
              onClick={() => setMediaOpen(false)}
            >
              Cancel
            </Button>
            <Button size="compact" onClick={() => setMediaOpen(false)}>
              Use {mediaIds.length} {mediaIds.length === 1 ? "item" : "items"}
            </Button>
          </>
        }
      >
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {MEDIA_ASSETS.map((asset) => {
            const active = mediaIds.includes(asset.id);

            return (
              <li key={asset.id}>
                <button
                  type="button"
                  onClick={() =>
                    setMediaIds((current) =>
                      current.includes(asset.id)
                        ? current.filter((id) => id !== asset.id)
                        : [...current, asset.id],
                    )
                  }
                  aria-pressed={active}
                  className="group w-full text-left focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      "relative block aspect-square overflow-hidden rounded-panel border-2 transition-colors",
                      active ? "border-primary" : "border-transparent",
                      asset.tone,
                    )}
                  >
                    {asset.type === "video" ? (
                      <span
                        aria-hidden
                        className="absolute top-1/2 left-1/2 size-0 -translate-x-1/2 -translate-y-1/2 border-y-[7px] border-l-[11px] border-y-transparent border-l-text-muted"
                      />
                    ) : null}

                    {active ? (
                      <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-primary text-white">
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                    ) : null}

                    {asset.type === "video" && asset.duration ? (
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-text-primary/70 px-1 text-sm font-medium text-white tabular-nums">
                        {asset.duration}s
                      </span>
                    ) : null}
                  </span>

                  <span className="mt-1.5 block truncate text-sm font-medium text-text-primary">
                    {asset.name}
                  </span>
                  <span className="block text-sm text-text-muted">
                    {asset.width} × {asset.height}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Dialog>
    </>
  );
}
