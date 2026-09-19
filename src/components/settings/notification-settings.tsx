"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  ALL_NOTIFICATION_EVENTS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_GROUPS,
  QUIET_HOURS,
} from "@/constants/settings";
import { isValidEmail } from "@/lib/validation";
import {
  defaultNotificationPrefs,
  updateNotificationPrefs,
  useNotificationPrefs,
} from "@/lib/settings-store";

import { ServiceNotice } from "./service-notice";

/**
 * What the product is allowed to interrupt you about.
 *
 * Grouped by *why* rather than by channel — what is happening to your work,
 * and who needs you — because that is how somebody decides what to turn off. A
 * flat list of twelve toggles gets switched off wholesale the first time one
 * of them is noisy.
 *
 * The catalogue lives in `constants/settings` and each entry names the module
 * that raises it, so the list can be checked rather than trusted. One row did
 * not survive that check: "Somebody mentions me in a note" promised a
 * notification for a feature the product does not have — notes are a
 * `string[]` on a record, with no author and no mention parsing — so nothing
 * could ever have raised it. "A new lead arrives" became "A lead is assigned
 * to me", which is the event the lead model actually carries.
 */

export function NotificationSettings() {
  const id = useId();
  const toast = useToast();

  const saved = useNotificationPrefs();

  const [draft, setDraft] = useState(saved);
  const [touched, setTouched] = useState(false);

  const addressError =
    draft.address.trim() && !isValidEmail(draft.address)
      ? "Enter a valid email address, or leave it empty."
      : undefined;

  const dirty =
    draft.channel !== saved.channel ||
    draft.quiet !== saved.quiet ||
    draft.address !== saved.address ||
    ALL_NOTIFICATION_EVENTS.some(
      (event) => draft.events[event.key] !== saved.events[event.key],
    );

  /* Email-only delivery with no address is the one combination that silently
     sends nothing, so it is worth saying out loud rather than validating. */
  const emailOnly = draft.channel === "email";

  return (
    <div className="space-y-6">
      <ServiceNotice tone="session" title="Preferences are not delivered yet">
        Nothing sends these notifications today — there is no notification
        service behind the dashboard. The choices below are kept for this
        session so the shape of them is real, and they are the events the
        product actually models.
      </ServiceNotice>

      <Card>
        <CardHeader
          title="How to reach you"
          description="Applies to everything below."
        />
        <CardBody className="max-w-lg space-y-4">
          <Field label="Send notifications by" htmlFor={`${id}-channel`}>
            <Select
              id={`${id}-channel`}
              hideLabel={false}
              label="Send notifications by"
              value={draft.channel}
              onChange={(channel) => setDraft({ ...draft, channel })}
              options={NOTIFICATION_CHANNELS}
            />
          </Field>

          <Field
            label="Send to a different address"
            htmlFor={`${id}-address`}
            hint="Optional. Leave blank to use the email on your profile."
            error={touched ? addressError : undefined}
          >
            <Input
              id={`${id}-address`}
              type="email"
              value={draft.address}
              error={Boolean(touched && addressError)}
              onChange={(event) =>
                setDraft({ ...draft, address: event.target.value })
              }
            />
          </Field>

          <Field
            label="Quiet hours"
            htmlFor={`${id}-quiet`}
            hint="Held notifications arrive together when the window closes. Failures are always sent immediately."
          >
            <Select
              id={`${id}-quiet`}
              hideLabel={false}
              label="Quiet hours"
              value={draft.quiet}
              onChange={(quiet) => setDraft({ ...draft, quiet })}
              options={QUIET_HOURS}
            />
          </Field>
        </CardBody>
      </Card>

      {NOTIFICATION_GROUPS.map((group) => (
        <Card key={group.id}>
          <CardHeader title={group.title} description={group.description} />
          <CardBody className="space-y-4">
            {group.events.map((event) => {
              const Icon = event.icon;

              return (
                <div key={event.key} className="flex items-start gap-3.5">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-muted">
                    <Icon className="size-4" aria-hidden />
                  </span>

                  <CheckboxField
                    className="flex-1"
                    id={`${id}-${event.key}`}
                    checked={draft.events[event.key] ?? event.defaultOn}
                    onCheckedChange={(next) =>
                      setDraft({
                        ...draft,
                        events: { ...draft.events, [event.key]: next },
                      })
                    }
                    label={event.label}
                    hint={
                      emailOnly && event.defaultOn
                        ? `${event.hint} Sent by email only.`
                        : event.hint
                    }
                  />
                </div>
              );
            })}
          </CardBody>
        </Card>
      ))}

      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          disabled={!dirty}
          onClick={() => {
            setTouched(true);
            if (addressError) return;

            updateNotificationPrefs({
              ...draft,
              address: draft.address.trim(),
            });
            setTouched(false);
            toast("Notification preferences updated", "success");
          }}
        >
          Save preferences
        </Button>

        {dirty ? (
          <Button
            variant="ghost"
            onClick={() => {
              setDraft(saved);
              setTouched(false);
            }}
          >
            Cancel
          </Button>
        ) : null}

        <Button
          variant="outline"
          className="max-sm:w-full sm:ms-auto"
          onClick={() => {
            setDraft(defaultNotificationPrefs());
            setTouched(false);
          }}
        >
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
