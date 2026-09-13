"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

/**
 * What the product is allowed to interrupt you about.
 *
 * Grouped by *why* rather than by channel — what is happening to your work,
 * what needs a person, and the digest — because that is how somebody decides
 * what to turn off. A flat list of twelve toggles gets switched off wholesale
 * the first time one of them is noisy.
 *
 * Failures default on and marketing summaries default off: the ones that cost
 * money if missed should have to be turned *off* deliberately.
 */

interface Pref {
  key: string;
  label: string;
  hint: string;
  defaultOn: boolean;
}

const WORK: Pref[] = [
  {
    key: "campaign-finished",
    label: "A campaign finishes sending",
    hint: "With the delivery figures once they settle.",
    defaultOn: true,
  },
  {
    key: "automation-failed",
    label: "An automation step fails",
    hint: "Recommended — a failed step usually means a customer heard nothing.",
    defaultOn: true,
  },
  {
    key: "integration-disconnected",
    label: "An integration disconnects",
    hint: "A revoked WhatsApp or email connection stops every journey using it.",
    defaultOn: true,
  },
];

const PEOPLE: Pref[] = [
  {
    key: "assigned",
    label: "A conversation is assigned to me",
    hint: "From the WhatsApp inbox or a workflow that routes to an owner.",
    defaultOn: true,
  },
  {
    key: "new-lead",
    label: "A new lead arrives",
    hint: "Only leads where you are the owner.",
    defaultOn: false,
  },
  {
    key: "mention",
    label: "Somebody mentions me in a note",
    hint: "",
    defaultOn: true,
  },
];

const DIGEST: Pref[] = [
  {
    key: "weekly",
    label: "Weekly performance summary",
    hint: "Campaigns, automations and revenue for the past seven days.",
    defaultOn: true,
  },
  {
    key: "product",
    label: "Product updates from MarketFlow",
    hint: "New features and changes. No more than once a month.",
    defaultOn: false,
  },
];

const CHANNELS = [
  { value: "email", label: "Email only" },
  { value: "in_app", label: "In-app only" },
  { value: "both", label: "Email and in-app" },
];

const QUIET = [
  { value: "off", label: "Never hold notifications" },
  { value: "night", label: "Hold overnight (21:00 – 08:00)" },
  { value: "weekend", label: "Hold overnight and at weekends" },
];

function PrefGroup({
  title,
  description,
  prefs,
  values,
  onToggle,
}: {
  title: string;
  description: string;
  prefs: Pref[];
  values: Record<string, boolean>;
  onToggle: (key: string, next: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="space-y-4">
        {prefs.map((pref) => (
          <CheckboxField
            key={pref.key}
            id={pref.key}
            checked={values[pref.key] ?? pref.defaultOn}
            onCheckedChange={(next) => onToggle(pref.key, next)}
            label={pref.label}
            hint={pref.hint || undefined}
          />
        ))}
      </CardBody>
    </Card>
  );
}

export function NotificationSettings() {
  const id = useId();
  const toast = useToast();

  const [values, setValues] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      [...WORK, ...PEOPLE, ...DIGEST].map((pref) => [pref.key, pref.defaultOn]),
    ),
  );
  const [channel, setChannel] = useState("both");
  const [quiet, setQuiet] = useState("night");
  const [address, setAddress] = useState("");

  const toggle = (key: string, next: boolean) =>
    setValues((current) => ({ ...current, [key]: next }));

  return (
    <div className="space-y-6">
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
              value={channel}
              onChange={setChannel}
              options={CHANNELS}
            />
          </Field>

          <Field
            label="Send to a different address"
            htmlFor={`${id}-address`}
            hint="Optional. Leave blank to use the email on your profile."
          >
            <Input
              id={`${id}-address`}
              type="email"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="alerts@yourcompany.com"
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
              value={quiet}
              onChange={setQuiet}
              options={QUIET}
            />
          </Field>
        </CardBody>
      </Card>

      <PrefGroup
        title="Your work"
        description="Things happening to campaigns and automations you run."
        prefs={WORK}
        values={values}
        onToggle={toggle}
      />

      <PrefGroup
        title="People"
        description="When a customer or a teammate needs you."
        prefs={PEOPLE}
        values={values}
        onToggle={toggle}
      />

      <PrefGroup
        title="Summaries"
        description="Scheduled, never urgent."
        prefs={DIGEST}
        values={values}
        onToggle={toggle}
      />

      <div className="flex flex-wrap items-center gap-2.5">
        <Button onClick={() => toast("Notification preferences saved", "success")}>
          Save preferences
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setValues(
              Object.fromEntries(
                [...WORK, ...PEOPLE, ...DIGEST].map((pref) => [
                  pref.key,
                  pref.defaultOn,
                ]),
              ),
            );
            setChannel("both");
            setQuiet("night");
            toast("Reset to the recommended defaults", "info");
          }}
        >
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
