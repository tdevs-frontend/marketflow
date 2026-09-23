"use client";

import { Clock, Send } from "lucide-react";

import { CheckboxField } from "@/components/ui/checkbox";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  FREQUENCY_ANY_HOURS,
  FREQUENCY_SAME_DAYS,
  SEND_SPEEDS,
  SPREAD_OPTIONS,
  WEEKDAYS,
} from "@/lib/campaign-fixtures";
import { TIMEZONES } from "@/lib/marketing-fixtures";
import { cn } from "@/lib/utils";
import type { SendSpeed } from "@/types/marketing";
import { OptionCard, StepSection, TogglePanel } from "./shared";
import type { StepProps } from "./types";

/**
 * Step 5 - when it goes, and the guards on when it must not.
 *
 * Everything below "when" on this step is a safety rail rather than a feature:
 * quiet hours stop a 3am SMS, allowed days stop a B2B campaign landing on a
 * Sunday, the frequency cap stops a contact getting three campaigns in an
 * afternoon, and throttling stops a 40,000-message send burying the inbox in
 * replies it cannot answer. Each is optional and each states its consequence.
 */

export function ScheduleStep(props: StepProps) {
  const { draft, set, errors, derived } = props;

  return (
    <div className="space-y-5">
      <StepSection title={derived.isSocial ? "When to publish" : "When to send"}>
        <div className="grid gap-3 sm:grid-cols-2">
          <OptionCard
            selected={draft.sendMode === "now"}
            onClick={() => set("sendMode", "now")}
            icon={<Send aria-hidden />}
            title={derived.isSocial ? "Publish now" : "Send now"}
            hint="Starts as soon as you launch."
          />
          <OptionCard
            selected={draft.sendMode === "later"}
            onClick={() => set("sendMode", "later")}
            icon={<Clock aria-hidden />}
            title="Schedule for later"
            hint="Pick a date and time."
          />
        </div>
      </StepSection>

      {draft.sendMode === "later" ? (
        <>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Date" htmlFor="cmp-date" error={errors.date}>
              <Input
                id="cmp-date"
                type="date"
                value={draft.date}
                error={Boolean(errors.date)}
                onChange={(event) => set("date", event.target.value)}
              />
            </Field>

            <Field label="Time" htmlFor="cmp-time">
              <Input
                id="cmp-time"
                type="time"
                value={draft.time}
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

          {derived.isSocial ? null : (
            <CheckboxField
              id="cmp-recipient-tz"
              checked={draft.useRecipientTimezone}
              onCheckedChange={(next) => set("useRecipientTimezone", next)}
              label="Send at this local time in each recipient's timezone"
              hint="10:00 for a contact in Dhaka and 10:00 for one in London, so the send spreads across the day. Contacts with no known timezone use the campaign timezone above."
            />
          )}
        </>
      ) : null}

      {derived.isSocial ? (
        <SocialScheduling {...props} />
      ) : (
        <>
          <DeliveryWindow {...props} />
          <FrequencySection {...props} />
          <DeliverySpeed {...props} />
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Quiet hours and allowed days                                               */
/* -------------------------------------------------------------------------- */

function DeliveryWindow({ draft, set, errors }: StepProps) {
  const quiet = draft.quietHours;

  const toggleDay = (index: number) =>
    set(
      "allowedDays",
      draft.allowedDays.includes(index)
        ? draft.allowedDays.filter((day) => day !== index)
        : [...draft.allowedDays, index].sort(),
    );

  return (
    <StepSection
      title="Delivery window"
      hint="A campaign that lands at the wrong hour reads as spam, whatever it says."
    >
      <div className="space-y-2.5">
        <TogglePanel
          id="cmp-quiet"
          checked={quiet.enabled}
          onCheckedChange={(next) => set("quietHours", { ...quiet, enabled: next })}
          label="Quiet hours"
          hint="Anything that would deliver inside this window waits until it closes."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Do not send from" htmlFor="cmp-quiet-from">
              <Input
                id="cmp-quiet-from"
                type="time"
                value={quiet.from}
                onChange={(event) =>
                  set("quietHours", { ...quiet, from: event.target.value })
                }
              />
            </Field>
            <Field label="Until" htmlFor="cmp-quiet-to">
              <Input
                id="cmp-quiet-to"
                type="time"
                value={quiet.to}
                onChange={(event) =>
                  set("quietHours", { ...quiet, to: event.target.value })
                }
              />
            </Field>
          </div>
        </TogglePanel>

        <div className="rounded-panel border border-border px-3.5 py-3">
          <p className="text-sm font-bold text-text-secondary">Allowed days</p>
          <p className="mt-1 text-sm font-medium text-text-muted">
            Delivery is held to the next allowed day.
          </p>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {WEEKDAYS.map((day) => {
              const on = draft.allowedDays.includes(day.index);

              return (
                <button
                  key={day.index}
                  type="button"
                  aria-pressed={on}
                  aria-label={day.label}
                  onClick={() => toggleDay(day.index)}
                  className={cn(
                    "h-9 min-w-12 rounded-btn border px-2.5 text-sm font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                    on
                      ? "border-primary bg-primary-soft text-primary-dark"
                      : "border-border text-text-muted hover:border-border-strong hover:text-text-secondary",
                  )}
                >
                  {day.short}
                </button>
              );
            })}
          </div>

          {errors.allowedDays ? (
            <p className="mt-2 text-sm text-error">{errors.allowedDays}</p>
          ) : null}
        </div>
      </div>
    </StepSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Frequency cap                                                              */
/* -------------------------------------------------------------------------- */

function FrequencySection({ draft, set }: StepProps) {
  const cap = draft.frequencyCap;

  return (
    <StepSection
      title="Frequency cap"
      hint="Protects contacts who sit in several segments at once from receiving every campaign."
    >
      <TogglePanel
        id="cmp-frequency"
        checked={cap.enabled}
        onCheckedChange={(next) => set("frequencyCap", { ...cap, enabled: next })}
        label="Skip recently contacted people"
        hint="They are counted as excluded rather than failed, and stay in the audience for the next campaign."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Received any campaign within"
            htmlFor="cmp-freq-any"
          >
            <Select
              id="cmp-freq-any"
              label="Received any campaign within"
              hideLabel={false}
              value={String(cap.anyChannelHours)}
              onChange={(next) =>
                set("frequencyCap", { ...cap, anyChannelHours: Number(next) })
              }
              options={FREQUENCY_ANY_HOURS}
            />
          </Field>

          <Field label="Received a campaign on this channel within" htmlFor="cmp-freq-same">
            <Select
              id="cmp-freq-same"
              label="Received a campaign on this channel within"
              hideLabel={false}
              value={String(cap.sameChannelDays)}
              onChange={(next) =>
                set("frequencyCap", { ...cap, sameChannelDays: Number(next) })
              }
              options={FREQUENCY_SAME_DAYS}
            />
          </Field>
        </div>
      </TogglePanel>
    </StepSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Delivery speed                                                             */
/* -------------------------------------------------------------------------- */

function DeliverySpeed({ draft, set, derived }: StepProps) {
  return (
    <StepSection
      title="Sending speed"
      hint={
        derived.recipients > 5000
          ? `${derived.recipients.toLocaleString()} messages at once generates replies faster than a team can read them.`
          : undefined
      }
    >
      <div className="space-y-2.5">
        <div className="grid gap-3 sm:grid-cols-2">
          {SEND_SPEEDS.map((option) => (
            <OptionCard
              key={option.value}
              selected={draft.sendSpeed === option.value}
              onClick={() => set("sendSpeed", option.value as SendSpeed)}
              title={option.label}
              hint={option.hint}
            />
          ))}
        </div>

        {draft.sendSpeed === "throttled" ? (
          <Field label="Spread over" htmlFor="cmp-spread">
            <Select
              id="cmp-spread"
              label="Spread over"
              hideLabel={false}
              value={String(draft.spreadMinutes)}
              onChange={(next) => set("spreadMinutes", Number(next))}
              options={SPREAD_OPTIONS}
            />
          </Field>
        ) : null}
      </div>
    </StepSection>
  );
}

/* -------------------------------------------------------------------------- */
/* Social                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Social has one extra question, and only when it is worth asking.
 *
 * With a single account there is nothing to coordinate, so the toggle does not
 * render at all - the default stays "one time for everything", which is what
 * almost every campaign wants.
 */
function SocialScheduling({ draft, set, derived }: StepProps) {
  if (derived.accounts.length < 2) return null;

  return (
    <StepSection title="Multiple accounts">
      <div className="grid gap-3 sm:grid-cols-2">
        <OptionCard
          selected={!draft.perPlatformSchedule}
          onClick={() => set("perPlatformSchedule", false)}
          title="Use the same schedule for all"
          hint={`One slot across ${derived.accounts.length} accounts.`}
        />
        <OptionCard
          selected={draft.perPlatformSchedule}
          onClick={() => set("perPlatformSchedule", true)}
          title="Customise per platform"
          hint="Each platform gets its own publish time, set after scheduling."
        />
      </div>
    </StepSection>
  );
}
