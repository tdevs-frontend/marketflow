"use client";

import { Hash, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CheckboxField } from "@/components/ui/checkbox";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AB_TEST_FIELDS, AB_WINNER_METRICS } from "@/lib/campaign-fixtures";
import { EMAIL_TEMPLATES } from "@/lib/email-fixtures";
import { TEMPLATES } from "@/lib/whatsapp-fixtures";
import { cn } from "@/lib/utils";
import type { AbTestField, AbWinnerMetric } from "@/types/marketing";
import { MediaPicker } from "./media-picker";
import { PersonalisationSection } from "./personalisation";
import { ChannelPreview } from "./previews";
import { StepSection, TogglePanel, WarningNote } from "./shared";
import type { StepProps } from "./types";

/**
 * Step 3 — the message itself, composed for the channel it is going out on.
 *
 * Four composers, not one with fields hidden. A generic composer forces every
 * channel through the widest common shape, which in practice means an SMS box
 * with a subject line above it and a WhatsApp message with no template picker.
 * Each branch below asks only for what its channel actually sends, and the
 * preview beside it is the same channel's.
 *
 * Personalisation sits under the composer rather than on a step of its own.
 * Merge tags are written here, so the fallback each one needs belongs here too
 * — a tag typed on one screen and its "what if this contact has no first name"
 * answered on the next is one decision asked twice.
 */

const HASHTAG_SUGGESTIONS = [
  "marketflow",
  "summersale",
  "newarrivals",
  "shoplocal",
  "ecommerce",
];

export function ContentStep(props: StepProps) {
  const { draft, derived } = props;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-5">
        {draft.channel === "whatsapp" ? <WhatsAppComposer {...props} /> : null}
        {draft.channel === "email" ? <EmailComposer {...props} /> : null}
        {draft.channel === "sms" ? <SmsComposer {...props} /> : null}
        {draft.channel === "social" ? <SocialComposer {...props} /> : null}

        <PersonalisationSection {...props} />

        <AbTestSection {...props} />
      </div>

      <div className="lg:sticky lg:top-4 lg:self-start">
        <p className="text-base font-semibold text-text-primary/80">
          {derived.channelLabel} preview
        </p>
        <div className="mt-2.5">
          <ChannelPreview
            draft={draft}
            derived={derived}
            /* Raw tags here: the composer is where they are being typed, and
               resolving them would hide the thing being written. */
            personalise={false}
            device={props.preview.device}
            onDeviceChange={props.preview.setDevice}
            platform={props.preview.platform}
            onPlatformChange={props.preview.setPlatform}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* WhatsApp                                                                   */
/* -------------------------------------------------------------------------- */

function WhatsAppComposer({ draft, set, errors, derived }: StepProps) {
  const template = TEMPLATES.find((item) => item.id === draft.templateId);

  return (
    <>
      <Field
        label="Template"
        htmlFor="cmp-template"
        hint="A template is required outside the 24-hour reply window."
      >
        <Select
          id="cmp-template"
          label="Template"
          hideLabel={false}
          value={draft.templateId}
          onChange={(next) => {
            const picked = TEMPLATES.find((item) => item.id === next);
            set("templateId", next);
            /* Pre-fill the body from the template, but never over typed copy —
               losing a written message to a dropdown is unforgivable. */
            if (picked && !draft.message.trim()) set("message", picked.body);
          }}
          options={[
            { value: "", label: "No template — free-form reply window" },
            ...TEMPLATES.map((item) => ({
              value: item.id,
              label: `${item.name} (${item.category})`,
            })),
          ]}
        />
      </Field>

      {template ? (
        <div className="rounded-panel border border-border px-3.5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={
                template.status === "approved"
                  ? "success"
                  : template.status === "pending"
                    ? "warning"
                    : "danger"
              }
              size="sm"
            >
              {template.status}
            </Badge>
            <span className="text-sm font-medium text-text-muted">
              {template.language} · {template.variables.length} variable
              {template.variables.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Header, body, footer and buttons are fixed by the approved
              template — shown, not edited, because Meta approved this exact
              shape and editing it here would silently invalidate it. */}
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="font-medium text-text-muted">Body</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-text-secondary">
                {template.body}
              </dd>
            </div>
            {template.footer ? (
              <div>
                <dt className="font-medium text-text-muted">Footer</dt>
                <dd className="mt-0.5 text-text-secondary">{template.footer}</dd>
              </div>
            ) : null}
            {template.buttons.length > 0 ? (
              <div>
                <dt className="font-medium text-text-muted">Buttons</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {template.buttons.map((button) => (
                    <span
                      key={button.label}
                      className="rounded-btn border border-border px-2 py-0.5 text-sm font-medium text-text-secondary"
                    >
                      {button.label}
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}

      <Field
        label="Message"
        htmlFor="cmp-message"
        error={errors.message}
        hint="Use {{first_name}} or {{order_id}} to personalise. A fallback goes after a pipe: {{first_name | Customer}}."
      >
        <Textarea
          id="cmp-message"
          value={draft.message}
          error={Boolean(errors.message)}
          rows={7}
          onChange={(event) => set("message", event.target.value)}
        />
      </Field>

      <p className="text-sm text-text-muted">
        {derived.messageLength} / 1024 characters. Media and buttons are set on
        the template.
      </p>

      <StepSection title="Media" hint="Optional header image, from the library.">
        <MediaPicker
          selected={draft.mediaIds}
          onChange={(ids) => set("mediaIds", ids)}
          max={1}
        />
      </StepSection>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Email                                                                      */
/* -------------------------------------------------------------------------- */

function EmailComposer({ draft, set, errors }: StepProps) {
  return (
    <>
      <Field label="Template" htmlFor="cmp-template">
        <Select
          id="cmp-template"
          label="Template"
          hideLabel={false}
          value={draft.templateId}
          onChange={(next) => set("templateId", next)}
          options={[
            { value: "", label: "Start from blank" },
            ...EMAIL_TEMPLATES.map((item) => ({
              value: item.id,
              label: item.name,
            })),
          ]}
        />
      </Field>

      <Field label="Subject" htmlFor="cmp-subject" error={errors.subject}>
        <Input
          id="cmp-subject"
          value={draft.subject}
          error={Boolean(errors.subject)}
          onChange={(event) => set("subject", event.target.value)}
        />
      </Field>

      <Field
        label="Preview Text"
        htmlFor="cmp-preview"
        hint="The line shown after the subject in most inboxes."
      >
        <Input
          id="cmp-preview"
          value={draft.previewText}
          onChange={(event) => set("previewText", event.target.value)}
        />
      </Field>

      <Field
        label="Body"
        htmlFor="cmp-message"
        error={errors.message}
        hint="Use {{first_name}} or {{order_id}} to personalise. A fallback goes after a pipe: {{first_name | Customer}}."
      >
        <Textarea
          id="cmp-message"
          value={draft.message}
          error={Boolean(errors.message)}
          rows={9}
          onChange={(event) => set("message", event.target.value)}
        />
      </Field>

      <StepSection title="Call to action">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Button label" htmlFor="cmp-cta-label">
            <Input
              id="cmp-cta-label"
              value={draft.ctaLabel}
              placeholder="Shop the sale"
              onChange={(event) => set("ctaLabel", event.target.value)}
            />
          </Field>
          <Field label="Button link" htmlFor="cmp-cta-url">
            <Input
              id="cmp-cta-url"
              value={draft.ctaUrl}
              placeholder="https://marketflow.io/sale"
              onChange={(event) => set("ctaUrl", event.target.value)}
            />
          </Field>
        </div>
      </StepSection>

      <StepSection title="Media" hint="Images from the workspace Media Library.">
        <MediaPicker
          selected={draft.mediaIds}
          onChange={(ids) => set("mediaIds", ids)}
        />
      </StepSection>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* SMS                                                                        */
/* -------------------------------------------------------------------------- */

function SmsComposer({ draft, set, errors, derived }: StepProps) {
  const { messageLength, smsSegmentCount } = derived;

  return (
    <>
      <Field
        label="Message"
        htmlFor="cmp-message"
        error={errors.message}
        hint="Use {{first_name}} to personalise. A fallback goes after a pipe: {{first_name | there}}."
      >
        <Textarea
          id="cmp-message"
          value={draft.message}
          error={Boolean(errors.message)}
          rows={6}
          onChange={(event) => set("message", event.target.value)}
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel bg-surface-secondary px-3.5 py-3 text-sm">
        <span className="text-text-secondary">{messageLength} characters</span>
        <span
          className={cn(
            "font-medium",
            smsSegmentCount > 3 ? "text-warning-text" : "text-text-primary",
          )}
        >
          {smsSegmentCount} SMS segment{smsSegmentCount === 1 ? "" : "s"} per
          recipient
        </span>
      </div>

      <CheckboxField
        id="cmp-shorten"
        checked={draft.shortenLinks}
        onCheckedChange={(next) => set("shortenLinks", next)}
        label="Shorten links"
        hint="Every link becomes a 23-character tracked short URL, which is also what makes click tracking possible on SMS."
      />

      {smsSegmentCount > 3 ? (
        <WarningNote>
          At {smsSegmentCount} segments this message bills{" "}
          {smsSegmentCount}× per recipient. Trimming below 160 characters sends
          as one.
        </WarningNote>
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Social                                                                     */
/* -------------------------------------------------------------------------- */

function SocialComposer({ draft, set, errors, derived }: StepProps) {
  const needsMedia = derived.accounts.some(
    (account) => account.platform === "instagram",
  );

  const toggleHashtag = (tag: string) =>
    set(
      "hashtags",
      draft.hashtags.includes(tag)
        ? draft.hashtags.filter((item) => item !== tag)
        : [...draft.hashtags, tag],
    );

  return (
    <>
      <Field
        label="Post text"
        htmlFor="cmp-message"
        error={errors.message}
        hint="Campaign, product and workspace variables resolve here. Contact variables do not — a post has no single recipient."
      >
        <Textarea
          id="cmp-message"
          value={draft.message}
          error={Boolean(errors.message)}
          rows={7}
          onChange={(event) => set("message", event.target.value)}
        />
      </Field>

      <StepSection
        title="Media"
        hint={
          needsMedia
            ? "Instagram is selected, so an image or video is required."
            : "Images and video from the workspace Media Library."
        }
      >
        <MediaPicker
          selected={draft.mediaIds}
          onChange={(ids) => set("mediaIds", ids)}
          required={needsMedia && draft.mediaIds.length === 0}
        />
        <p className="mt-2 text-sm font-medium text-text-muted">
          One asset publishes as a single image or video. Carousels arrive with
          multi-asset support on the platform APIs.
        </p>
      </StepSection>

      <Field label="Link" htmlFor="cmp-cta-url" hint="Appended to the post where the platform supports it.">
        <Input
          id="cmp-cta-url"
          value={draft.ctaUrl}
          placeholder="https://marketflow.io/sale"
          onChange={(event) => set("ctaUrl", event.target.value)}
        />
      </Field>

      <StepSection title="Hashtags">
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-2">
            {HASHTAG_SUGGESTIONS.map((tag) => {
              const on = draft.hashtags.includes(tag);

              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleHashtag(tag)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-btn border px-2.5 py-1 text-sm font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                    on
                      ? "border-primary bg-primary-soft text-primary-dark"
                      : "border-border text-text-secondary hover:border-border-strong hover:text-text-primary",
                  )}
                >
                  {on ? (
                    <Hash className="size-3.5" aria-hidden />
                  ) : (
                    <Plus className="size-3.5" aria-hidden />
                  )}
                  {tag}
                </button>
              );
            })}
          </div>

          <p className="text-sm font-medium text-text-muted">
            {draft.hashtags.length === 0
              ? "No hashtags — the caption publishes as written."
              : `${draft.hashtags.length} hashtag${
                  draft.hashtags.length === 1 ? "" : "s"
                } appended below the caption.`}
          </p>
        </div>
      </StepSection>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* A/B test                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Optional, and off by default.
 *
 * The fields a test can vary come from `AB_TEST_FIELDS` per channel, so this
 * renders the same regardless of which composer is above it — and so the
 * backend that eventually runs the split reads one shape rather than four.
 */
function AbTestSection({ draft, set, derived }: StepProps) {
  const test = draft.abTest;
  const fields = AB_TEST_FIELDS[draft.channel];
  const metrics = AB_WINNER_METRICS[draft.channel];
  const patch = (next: Partial<typeof test>) => set("abTest", { ...test, ...next });

  const splitSize = Math.round((derived.recipients * test.split) / 100);

  return (
    <TogglePanel
      id="cmp-ab"
      checked={test.enabled}
      onCheckedChange={(next) => patch({ enabled: next })}
      label="Create A/B test"
      hint="Send two versions and keep the one that performs better."
    >
      <div className="space-y-4">
        <Field label="What to test" htmlFor="cmp-ab-field">
          <Select
            id="cmp-ab-field"
            label="What to test"
            hideLabel={false}
            value={test.field}
            onChange={(next) => patch({ field: next as AbTestField })}
            options={fields}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Variant A" htmlFor="cmp-ab-a">
            <Textarea
              id="cmp-ab-a"
              rows={3}
              value={test.variantA}
              placeholder="Leave blank to use the message above"
              onChange={(event) => patch({ variantA: event.target.value })}
            />
          </Field>
          <Field label="Variant B" htmlFor="cmp-ab-b">
            <Textarea
              id="cmp-ab-b"
              rows={3}
              value={test.variantB}
              onChange={(event) => patch({ variantB: event.target.value })}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Audience split"
            htmlFor="cmp-ab-split"
            hint={
              derived.isSocial
                ? "Applied per account."
                : `${splitSize.toLocaleString()} get A, ${(
                    derived.recipients - splitSize
                  ).toLocaleString()} get B.`
            }
          >
            <Select
              id="cmp-ab-split"
              label="Audience split"
              hideLabel={false}
              value={String(test.split)}
              onChange={(next) => patch({ split: Number(next) })}
              options={[
                { value: "50", label: "50 / 50" },
                { value: "25", label: "25 / 75" },
                { value: "10", label: "10 / 90 (small test group)" },
              ]}
            />
          </Field>

          <Field label="Winner decided by" htmlFor="cmp-ab-metric">
            <Select
              id="cmp-ab-metric"
              label="Winner decided by"
              hideLabel={false}
              value={test.winnerMetric}
              onChange={(next) => patch({ winnerMetric: next as AbWinnerMetric })}
              options={metrics}
            />
          </Field>
        </div>
      </div>
    </TogglePanel>
  );
}
