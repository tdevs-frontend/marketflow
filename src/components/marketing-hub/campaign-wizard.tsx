"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  MessageCircle,
  Send,
  Smartphone,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { APP_ROUTES } from "@/constants";
import { AUDIENCES, TIMEZONES } from "@/lib/marketing-fixtures";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  AudienceSegment,
  CampaignDraft,
  MarketingChannel,
  WizardStep,
} from "@/types/marketing";

const STEPS: { value: WizardStep; label: string }[] = [
  { value: "campaign", label: "Campaign" },
  { value: "audience", label: "Audience" },
  { value: "content", label: "Content" },
  { value: "schedule", label: "Schedule" },
  { value: "review", label: "Review" },
];

const CHANNEL_CARDS: {
  value: MarketingChannel;
  label: string;
  hint: string;
  icon: typeof Mail;
}[] = [
  {
    value: "whatsapp",
    label: "WhatsApp",
    hint: "Highest read rate. Template needed for the first message.",
    icon: MessageCircle,
  },
  {
    value: "email",
    label: "Email",
    hint: "Best for long-form and rich layouts.",
    icon: Mail,
  },
  {
    value: "sms",
    label: "SMS",
    hint: "Short, urgent, no images. Billed per segment.",
    icon: Smartphone,
  },
];

const WHATSAPP_TEMPLATES = [
  { value: "", label: "No template — free-form reply window" },
  { value: "tpl-sale", label: "seasonal_offer_v3 (Marketing)" },
  { value: "tpl-restock", label: "back_in_stock_v1 (Marketing)" },
  { value: "tpl-order", label: "order_update_v2 (Utility)" },
];

const EMAIL_TEMPLATES = [
  { value: "", label: "Start from blank" },
  { value: "tpl-promo", label: "Promotional — single column" },
  { value: "tpl-launch", label: "Product launch — hero + grid" },
  { value: "tpl-digest", label: "Monthly digest" },
];

const EMPTY: CampaignDraft = {
  name: "",
  description: "",
  channel: "whatsapp",
  segment: "all",
  templateId: "",
  message: "",
  subject: "",
  previewText: "",
  sendMode: "now",
  date: "",
  time: "09:00",
  timezone: "Asia/Dhaka",
};

/** 160 GSM-7 characters per segment, 153 once a message needs more than one. */
function smsSegments(length: number) {
  if (length === 0) return 0;
  return length <= 160 ? 1 : Math.ceil(length / 153);
}

/* -------------------------------------------------------------------------- */
/* Stepper                                                                    */
/* -------------------------------------------------------------------------- */

function Stepper({
  active,
  furthest,
  onJump,
}: {
  active: number;
  furthest: number;
  onJump: (index: number) => void;
}) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto">
      {STEPS.map((step, index) => {
        const done = index < furthest;
        const current = index === active;
        /* Only steps already reached are clickable — jumping ahead would skip
           the validation that gates each one. */
        const reachable = index <= furthest;

        return (
          <li key={step.value} className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => reachable && onJump(index)}
              disabled={!reachable}
              aria-current={current ? "step" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-btn px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                current
                  ? "bg-primary-soft text-primary-dark"
                  : reachable
                    ? "text-text-secondary hover:bg-surface-secondary"
                    : "cursor-not-allowed text-text-muted",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                  current
                    ? "bg-primary text-white"
                    : done
                      ? "bg-primary-soft text-primary"
                      : "bg-surface-secondary text-text-muted",
                )}
              >
                {done ? <Check className="size-3" strokeWidth={3} aria-hidden /> : index + 1}
              </span>
              <span className="whitespace-nowrap">{step.label}</span>
            </button>

            {index < STEPS.length - 1 ? (
              <ChevronRight
                className="size-4 shrink-0 text-border-strong"
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="max-w-[60%] text-right text-sm font-medium text-text-primary">
        {value}
      </dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Wizard                                                                     */
/* -------------------------------------------------------------------------- */

export function CampaignWizard() {
  const router = useRouter();
  const toast = useToast();

  const [index, setIndex] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [draft, setDraft] = useState<CampaignDraft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const step = STEPS[index].value;
  const set = <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const audience = AUDIENCES.find((item) => item.value === draft.segment);
  const audienceSize = audience?.size ?? 0;

  /** Each step gates the next; the review step has nothing left to check. */
  function validateStep(): boolean {
    const next: Record<string, string> = {};

    if (step === "campaign" && !draft.name.trim()) {
      next.name = "Name the campaign.";
    }
    if (step === "audience" && draft.segment === "custom") {
      next.segment = "Build the segment, or pick a saved audience.";
    }
    if (step === "content") {
      if (draft.channel === "email" && !draft.subject.trim()) {
        next.subject = "Enter a subject line.";
      }
      if (!draft.message.trim()) next.message = "Write the message.";
    }
    if (step === "schedule" && draft.sendMode === "later" && !draft.date) {
      next.date = "Pick a send date.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateStep()) return;
    const target = Math.min(index + 1, STEPS.length - 1);
    setIndex(target);
    setFurthest((value) => Math.max(value, target));
  }

  function finish(message: string) {
    toast(message);
    router.push(APP_ROUTES.marketingCampaigns);
  }

  const messageLength = draft.message.length;

  return (
    <Card className="p-5">
      <Stepper active={index} furthest={furthest} onJump={setIndex} />

      <div className="mt-6 border-t border-border pt-6">
        {/* ------------------------------------------------------ Campaign */}
        {step === "campaign" ? (
          <div className="space-y-5">
            <Field label="Campaign Name" htmlFor="cmp-name" error={errors.name}>
              <Input
                id="cmp-name"
                value={draft.name}
                error={Boolean(errors.name)}
                placeholder="Summer Sale 2026"
                className="h-11"
                onChange={(event) => set("name", event.target.value)}
              />
            </Field>

            <Field
              label="Campaign Description"
              htmlFor="cmp-description"
              hint="Internal only — helps your team find it later."
            >
              <Textarea
                id="cmp-description"
                value={draft.description}
                placeholder="20% off every service package through June."
                onChange={(event) => set("description", event.target.value)}
              />
            </Field>

            <fieldset>
              <legend className="text-sm font-medium text-text-primary">
                Channel
              </legend>
              <div className="mt-2.5 grid gap-3 sm:grid-cols-3">
                {CHANNEL_CARDS.map((card) => {
                  const Icon = card.icon;
                  const selected = draft.channel === card.value;

                  return (
                    <button
                      key={card.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => set("channel", card.value)}
                      className={cn(
                        "rounded-panel border p-3.5 text-left transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                        selected
                          ? "border-primary bg-primary-subtle"
                          : "border-border hover:border-border-strong",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 place-items-center rounded-btn",
                          selected
                            ? "bg-primary text-white"
                            : "bg-surface-secondary text-text-muted",
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="mt-2.5 block text-sm font-medium text-text-primary">
                        {card.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-text-muted">
                        {card.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        ) : null}

        {/* ------------------------------------------------------ Audience */}
        {step === "audience" ? (
          <div className="space-y-5">
            <fieldset>
              <legend className="text-sm font-medium text-text-primary">
                Who receives this campaign
              </legend>
              <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                {AUDIENCES.map((item) => {
                  const selected = draft.segment === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => set("segment", item.value as AudienceSegment)}
                      className={cn(
                        "flex items-start justify-between gap-3 rounded-panel border p-3.5 text-left transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                        selected
                          ? "border-primary bg-primary-subtle"
                          : "border-border hover:border-border-strong",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-text-primary">
                          {item.label}
                        </span>
                        <span className="block text-xs text-text-muted">
                          {item.hint}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
                        {item.size > 0 ? formatNumber(item.size) : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.segment ? (
                <p className="mt-2 text-xs text-error">{errors.segment}</p>
              ) : null}
            </fieldset>

            <div className="flex items-center gap-3 rounded-panel bg-primary-soft px-3.5 py-3">
              <Users className="size-4 shrink-0 text-primary" aria-hidden />
              <p className="text-sm text-primary-dark">
                <strong className="font-bold">{formatNumber(audienceSize)}</strong>{" "}
                contacts will receive this campaign.
              </p>
            </div>
          </div>
        ) : null}

        {/* ------------------------------------------------------- Content */}
        {step === "content" ? (
          <div className="space-y-5">
            {draft.channel === "email" ? (
              <>
                <Field label="Template" htmlFor="cmp-template">
                  <Select
                    id="cmp-template"
                    label="Template"
                    hideLabel={false}
                    value={draft.templateId}
                    onChange={(next) => set("templateId", next)}
                    options={EMAIL_TEMPLATES}
                  />
                </Field>

                <Field label="Subject" htmlFor="cmp-subject" error={errors.subject}>
                  <Input
                    id="cmp-subject"
                    value={draft.subject}
                    error={Boolean(errors.subject)}
                    placeholder="Your summer offer ends Sunday"
                    className="h-11"
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
                    placeholder="20% off every package until 30 June."
                    className="h-11"
                    onChange={(event) => set("previewText", event.target.value)}
                  />
                </Field>
              </>
            ) : null}

            {draft.channel === "whatsapp" ? (
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
                  onChange={(next) => set("templateId", next)}
                  options={WHATSAPP_TEMPLATES}
                />
              </Field>
            ) : null}

            <Field
              label="Message"
              htmlFor="cmp-message"
              error={errors.message}
              hint="Use {{first_name}}, {{product}} or {{order_id}} to personalise."
            >
              <Textarea
                id="cmp-message"
                value={draft.message}
                error={Boolean(errors.message)}
                rows={6}
                placeholder={
                  draft.channel === "sms"
                    ? "Flash sale: 20% off this weekend only. Reply STOP to opt out."
                    : "Hi {{first_name}} — our Summer Sale is live with 20% off every package."
                }
                onChange={(event) => set("message", event.target.value)}
              />
            </Field>

            {/* Channel-specific counters: SMS bills per segment, WhatsApp caps
                the body, and email has no meaningful limit. */}
            {draft.channel === "sms" ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel bg-surface-secondary px-3.5 py-3 text-sm">
                <span className="text-text-secondary">
                  {messageLength} characters
                </span>
                <span className="font-medium text-text-primary">
                  {smsSegments(messageLength)} SMS segment
                  {smsSegments(messageLength) === 1 ? "" : "s"} per recipient
                </span>
              </div>
            ) : null}

            {draft.channel === "whatsapp" ? (
              <p className="text-xs text-text-muted">
                {messageLength} / 1024 characters. Media and buttons are set on the
                template.
              </p>
            ) : null}
          </div>
        ) : null}

        {/* ------------------------------------------------------ Schedule */}
        {step === "schedule" ? (
          <div className="space-y-5">
            <fieldset>
              <legend className="text-sm font-medium text-text-primary">
                When to send
              </legend>
              <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    value: "now" as const,
                    label: "Send now",
                    hint: "Starts as soon as you launch.",
                    icon: Send,
                  },
                  {
                    value: "later" as const,
                    label: "Schedule for later",
                    hint: "Pick a date and time.",
                    icon: Clock,
                  },
                ].map((option) => {
                  const Icon = option.icon;
                  const selected = draft.sendMode === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => set("sendMode", option.value)}
                      className={cn(
                        "flex items-start gap-3 rounded-panel border p-3.5 text-left transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                        selected
                          ? "border-primary bg-primary-subtle"
                          : "border-border hover:border-border-strong",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-btn",
                          selected
                            ? "bg-primary text-white"
                            : "bg-surface-secondary text-text-muted",
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-text-primary">
                          {option.label}
                        </span>
                        <span className="block text-xs text-text-muted">
                          {option.hint}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {draft.sendMode === "later" ? (
              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="Date" htmlFor="cmp-date" error={errors.date}>
                  <Input
                    id="cmp-date"
                    type="date"
                    value={draft.date}
                    error={Boolean(errors.date)}
                    className="h-11"
                    onChange={(event) => set("date", event.target.value)}
                  />
                </Field>

                <Field label="Time" htmlFor="cmp-time">
                  <Input
                    id="cmp-time"
                    type="time"
                    value={draft.time}
                    className="h-11"
                    onChange={(event) => set("time", event.target.value)}
                  />
                </Field>

                <Field label="Timezone" htmlFor="cmp-tz">
                  <Select
                    id="cmp-tz"
                    label="Timezone"
                    hideLabel={false}
                    value={draft.timezone}
                    onChange={(next) => set("timezone", next)}
                    options={TIMEZONES.map((zone) => ({ value: zone, label: zone }))}
                  />
                </Field>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* -------------------------------------------------------- Review */}
        {step === "review" ? (
          <div className="space-y-5">
            <div className="rounded-panel border border-border">
              <dl className="divide-y divide-border px-3.5">
                <SummaryRow label="Campaign" value={draft.name || "Untitled"} />
                <SummaryRow
                  label="Channel"
                  value={
                    CHANNEL_CARDS.find((card) => card.value === draft.channel)?.label ??
                    ""
                  }
                />
                <SummaryRow
                  label="Audience"
                  value={`${audience?.label ?? ""} · ${formatNumber(audienceSize)} contacts`}
                />
                {draft.channel === "email" ? (
                  <SummaryRow label="Subject" value={draft.subject || "—"} />
                ) : null}
                <SummaryRow
                  label="Schedule"
                  value={
                    draft.sendMode === "now"
                      ? "Immediately on launch"
                      : `${draft.date || "—"} at ${draft.time} (${draft.timezone})`
                  }
                />
                {draft.channel === "sms" ? (
                  <SummaryRow
                    label="Estimated segments"
                    value={`${smsSegments(messageLength) * audienceSize} billed segments`}
                  />
                ) : null}
              </dl>
            </div>

            <div>
              <p className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                Message preview
              </p>
              <div className="mt-2.5 rounded-panel border border-border bg-surface-secondary p-4">
                {draft.channel === "email" && draft.subject ? (
                  <p className="mb-2 text-sm font-bold text-text-primary">
                    {draft.subject}
                  </p>
                ) : null}
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-text-secondary">
                  {draft.message || "Nothing written yet."}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ------------------------------------------------------------ Nav */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-border pt-5">
        <Button
          variant="outline"
          size="compact"
          disabled={index === 0}
          onClick={() => setIndex((value) => Math.max(value - 1, 0))}
        >
          <ChevronLeft aria-hidden />
          Back
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="compact"
            onClick={() => finish("Campaign saved as draft")}
          >
            Save Draft
          </Button>

          {step === "review" ? (
            draft.sendMode === "later" ? (
              <Button
                size="compact"
                onClick={() => finish("Campaign scheduled successfully")}
              >
                <Clock aria-hidden />
                Schedule Campaign
              </Button>
            ) : (
              <Button
                size="compact"
                onClick={() => finish("Campaign launched successfully")}
              >
                <Send aria-hidden />
                Launch Campaign
              </Button>
            )
          ) : (
            <Button size="compact" onClick={goNext}>
              Continue
              <ChevronRight aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
