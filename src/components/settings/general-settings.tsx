import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";

import { TimezoneSelect } from "./timezone-select";

const TIMEZONES = ["UTC", "Asia/Dhaka", "Europe/London", "America/New_York"];

/**
 * The workspace's own settings — the page as it was before the tabs arrived.
 *
 * Lifted out of `app/dashboard/settings/page.tsx` unchanged: same two cards,
 * same fields, same copy. It is General's tab panel now rather than the whole
 * page, and nothing about how it looks moved with it.
 */
export function GeneralSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Workspace"
          description="Shown to your team and on outgoing messages."
        />
        <CardBody className="max-w-lg space-y-4">
          <Field label="Workspace name" htmlFor="workspace-name">
            <Input id="workspace-name" name="workspaceName" defaultValue="MarketFlow" />
          </Field>

          <Field
            label="Timezone"
            htmlFor="timezone"
            hint="Campaign schedules and reports use this timezone."
          >
            <TimezoneSelect id="timezone" zones={TIMEZONES} defaultValue="UTC" />
          </Field>

          <Button>Save changes</Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Sender identity"
          description="Defaults applied to new email campaigns."
        />
        <CardBody className="max-w-lg space-y-4">
          <Field label="From name" htmlFor="from-name">
            <Input id="from-name" name="fromName" defaultValue="MarketFlow" />
          </Field>

          <Field label="Reply-to address" htmlFor="reply-to">
            <Input id="reply-to" name="replyTo" type="email" />
          </Field>

          <Button>Save changes</Button>
        </CardBody>
      </Card>
    </div>
  );
}
