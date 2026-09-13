"use client";

import { useId, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABEL } from "@/constants/roles";

/**
 * The signed-in person, as opposed to the workspace.
 *
 * That distinction is the whole reason these three panels moved off the
 * sidebar and behind tabs: General is the *business*, and Profile,
 * Notifications and Security are the individual. Four rows in the sidebar was
 * four answers to one question.
 *
 * Built from the same `Card` / `Field` / `Input` shapes General already uses,
 * so the panels are interchangeable to look at.
 */

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "bn", label: "Bengali" },
  { value: "es", label: "Spanish" },
  { value: "ar", label: "Arabic" },
];

export function ProfileSettings() {
  const id = useId();
  const toast = useToast();
  const { user } = useAuth();

  const [firstName, setFirstName] = useState(
    (user?.name ?? "Guest User").split(" ")[0] ?? "",
  );
  const [lastName, setLastName] = useState(
    (user?.name ?? "Guest User").split(" ").slice(1).join(" "),
  );
  const [email, setEmail] = useState(user?.email ?? "you@marketflow.app");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [language, setLanguage] = useState("en");

  const fullName = `${firstName} ${lastName}`.trim() || "Guest User";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Your photo"
          description="Shown beside your name in the inbox, on assignments and in activity logs."
        />
        <CardBody className="flex flex-wrap items-center gap-4">
          <Avatar name={fullName} size="lg" />
          <div className="flex flex-wrap gap-2.5">
            <Button
              variant="outline"
              size="compact"
              onClick={() => toast("Photo upload arrives with the API", "info")}
            >
              Upload photo
            </Button>
            <Button
              variant="ghost"
              size="compact"
              onClick={() => toast("Photo removed", "success")}
            >
              Remove
            </Button>
          </div>
          <p className="w-full text-sm text-text-muted">
            JPG or PNG, up to 2 MB. Square images look best.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Your details"
          description="How you appear to the rest of the workspace."
        />
        <CardBody className="max-w-lg space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor={`${id}-first`}>
              <Input
                id={`${id}-first`}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </Field>
            <Field label="Last name" htmlFor={`${id}-last`}>
              <Input
                id={`${id}-last`}
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </Field>
          </div>

          <Field
            label="Email address"
            htmlFor={`${id}-email`}
            hint="Used to sign in, and where account notices are sent."
          >
            <Input
              id={`${id}-email`}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>

          <Field
            label="Phone"
            htmlFor={`${id}-phone`}
            hint="Optional. Used for two-factor codes if you turn them on."
          >
            <Input
              id={`${id}-phone`}
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+971 50 000 0000"
            />
          </Field>

          <Field label="Job title" htmlFor={`${id}-title`}>
            <Input
              id={`${id}-title`}
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              placeholder="Head of Growth"
            />
          </Field>

          <Field
            label="Language"
            htmlFor={`${id}-language`}
            hint="Changes the dashboard only — it does not affect what you send."
          >
            <Select
              id={`${id}-language`}
              hideLabel={false}
              label="Language"
              value={language}
              onChange={setLanguage}
              options={LANGUAGES}
            />
          </Field>

          <Button onClick={() => toast("Profile saved", "success")}>
            Save changes
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Role"
          description="What you can reach in this workspace. Only an owner can change it."
        />
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            You are signed in as{" "}
            <strong className="text-text-primary">
              {ROLE_LABEL[user?.role ?? "owner"]}
            </strong>
            .
          </p>
          <Button
            variant="outline"
            size="compact"
            onClick={() => toast("Ask an owner to change your role", "info")}
          >
            Request a change
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
