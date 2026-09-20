"use client";

import { useId, useMemo, useState } from "react";
import { Lock } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import {
  NOTIFICATION_CHANNEL_LABEL,
  NOTIFICATION_EVENTS,
  QUIET_HOURS_OPTIONS,
  notificationEventsByCategory,
} from "@/constants/settings";
import {
  updateNotificationPolicy,
  updateNotificationPreferences,
} from "@/lib/account-service";
import {
  useAccount,
  useNotificationPolicy,
  useNotificationPreferences,
} from "@/lib/account-store";
import { defaultNotificationPreferences } from "@/lib/account-fixtures";
import { isValidEmail } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type {
  NotificationChannel,
  NotificationEventDef,
  QuietHours,
  UserNotificationPreferences,
  WorkspaceNotificationPolicy,
} from "@/types/account";
import { useWorkspacePermissions } from "@/components/workspace/use-workspace-permissions";

import { ServiceNotice } from "./service-notice";
import {
  SaveBar,
  SettingsRow,
  SettingsSection,
  useSaveState,
} from "./settings-section";

/**
 * Notifications — two settings with one name, told apart.
 *
 * This is the distinction the module is built around, and it is a governance
 * boundary rather than a layout choice:
 *
 *   The **workspace** decides which events exist for its members and which
 *   channels they may use. That is an administrator's call, because muting
 *   "Automation failed" for everybody is a decision with a blast radius.
 *
 *   The **member** decides, within that, what reaches them personally.
 *
 * Collapsing the two is how a support agent ends up able to switch off the
 * whole workspace's failure alerts from their own preferences page. So they are
 * different records (`WorkspaceNotificationPolicy` against
 * `UserNotificationPreferences`), different service calls with different
 * authorisation, and — for anyone who can do both — two views that you have to
 * deliberately switch between. A member without the permission never sees the
 * workspace view at all, and their list is *derived* from the policy: an event
 * an administrator turns off simply is not there.
 *
 * The rows are compact and grouped by category rather than being a card each.
 * There are twenty-odd of these; as cards it is a page nobody reads to the
 * bottom, and a notification list that is not scannable gets dealt with by
 * switching everything off once.
 */

type View = "me" | "workspace";

export function NotificationSettings() {
  const permissions = useWorkspacePermissions();
  const canConfigure = permissions.can("workspace_settings", "edit");

  const [view, setView] = useState<View>("me");

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Choose which notifications you receive and how they reach you."
      />

      <div className="space-y-6">
        <ServiceNotice tone="session" title="Preferences are saved, delivery is not connected">
          These choices are kept for this session and are the events the product
          genuinely models — nothing here is a placeholder switch. What does not
          exist yet is the service that sends them, so turning something on
          records the preference rather than starting a mail.
        </ServiceNotice>

        {canConfigure ? (
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl
              label="Notification settings view"
              value={view}
              onChange={setView}
              options={[
                { value: "me", label: "My preferences" },
                { value: "workspace", label: "Workspace configuration" },
              ]}
            />
            <p className="text-sm font-medium text-text-muted">
              {view === "me"
                ? "What reaches you personally."
                : `What every member of this workspace can be notified about. Visible to you because you are ${permissions.roleName}.`}
            </p>
          </div>
        ) : null}

        {view === "me" ? <MyPreferences /> : <WorkspacePolicy />}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Member preferences                                                         */
/* -------------------------------------------------------------------------- */

function MyPreferences() {
  const id = useId();
  const user = useAccount();
  const policy = useNotificationPolicy();
  const saved = useNotificationPreferences();
  const { state, run, setError } = useSaveState();

  const [draft, setDraft] = useState<UserNotificationPreferences>(saved);

  /**
   * The member's list, derived from the policy rather than from the catalogue.
   *
   * An event the workspace has switched off does not appear, and a channel the
   * workspace has not permitted is not offered — which is what makes the split
   * real. A UI that shows every event and quietly ignores half of them has an
   * administrator's setting that does nothing visible.
   */
  const groups = useMemo(() => {
    const available = NOTIFICATION_EVENTS.filter(
      (event) => policy.enabled[event.key] !== false,
    );
    return notificationEventsByCategory(available);
  }, [policy]);

  const emailError =
    draft.emailAddress.trim() && !isValidEmail(draft.emailAddress)
      ? "Enter a valid email address, or leave it empty."
      : undefined;

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  /** Channels the workspace permits for this event, in catalogue order. */
  const allowed = (event: NotificationEventDef): NotificationChannel[] => {
    const permitted = policy.channels[event.key] ?? event.channels;
    return event.channels.filter((channel) => permitted.includes(channel));
  };

  function toggle(
    event: NotificationEventDef,
    channel: NotificationChannel,
    on: boolean,
  ) {
    setDraft((current) => {
      const existing = current.channels[event.key] ?? [];
      const next = on
        ? [...new Set([...existing, channel])]
        : existing.filter((item) => item !== channel);

      return { ...current, channels: { ...current.channels, [event.key]: next } };
    });
  }

  function save() {
    if (emailError) {
      setError(emailError);
      return;
    }

    void run(async () => {
      const result = await updateNotificationPreferences(draft);
      if (result.ok) setDraft(result.data);
      return result;
    });
  }

  /* Email delivery with no verified route is the one combination that silently
     sends nothing, so it is said out loud rather than validated. */
  const usesEmail = Object.values(draft.channels).some((list) =>
    list.includes("email"),
  );

  return (
    <div className="space-y-6">
      <SettingsSection
        title="How to reach you"
        description="Applies to everything you have chosen to receive by email."
        bodyClassName="max-w-2xl space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Send email to"
            htmlFor={`${id}-address`}
            error={emailError}
            hint={`Leave blank to use ${user.email}.`}
          >
            <Input
              id={`${id}-address`}
              type="email"
              placeholder={user.email}
              value={draft.emailAddress}
              error={Boolean(emailError)}
              onChange={(event) =>
                setDraft({ ...draft, emailAddress: event.target.value })
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
              label="Quiet hours"
              value={draft.quietHours}
              onChange={(quietHours: QuietHours) =>
                setDraft({ ...draft, quietHours })
              }
              options={QUIET_HOURS_OPTIONS}
            />
          </Field>
        </div>

        {!usesEmail ? (
          <p className="text-sm font-medium text-text-muted">
            Nothing is set to arrive by email at the moment, so the address
            above is unused.
          </p>
        ) : null}
      </SettingsSection>

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            title="No notifications are available"
            description="An administrator has switched off every notification for this workspace. Ask them to enable the ones you need."
          />
        </Card>
      ) : (
        groups.map((group) => (
          <SettingsSection
            key={group.category.key}
            title={group.category.label}
            description={group.category.description}
            bodyClassName="-mx-5 divide-y divide-border"
          >
            {group.events.map((event) => (
              <EventRow
                key={event.key}
                event={event}
                channels={allowed(event)}
                selected={draft.channels[event.key] ?? []}
                onToggle={(channel, on) => toggle(event, channel, on)}
                idBase={id}
              />
            ))}
          </SettingsSection>
        ))
      )}

      {/* Sticky, because the list is long enough that a bar at the bottom is a
          bar you have to remember to scroll back to. */}
      <Card className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 px-5 py-4 shadow-card-hover">
        <SaveBar
          state={state}
          dirty={dirty}
          onSave={save}
          onCancel={() => setDraft(saved)}
          label="Save preferences"
        >
          <Button
            variant="outline"
            className="max-sm:w-full sm:ms-auto"
            onClick={() => setDraft(defaultNotificationPreferences())}
          >
            Reset to defaults
          </Button>
        </SaveBar>
      </Card>
    </div>
  );
}

/**
 * One notification, as a row.
 *
 * Title, one line of what raises it, and a checkbox per permitted channel — the
 * four things the reader needs and nothing else. The channels are checkboxes
 * rather than a switch because an event can legitimately go to both, to one, or
 * to neither, and "neither" is a normal answer that a single on/off control
 * cannot express without a second control beside it.
 */
function EventRow({
  event,
  channels,
  selected,
  onToggle,
  idBase,
}: {
  event: NotificationEventDef;
  channels: NotificationChannel[];
  selected: NotificationChannel[];
  onToggle: (channel: NotificationChannel, on: boolean) => void;
  idBase: string;
}) {
  return (
    <SettingsRow
      actions={
        event.mandatory ? (
          /*
           * Not a disabled checkbox. "Your password changed" is how somebody
           * finds out it was not them, and a product that lets that be muted
           * has built the attacker a quiet room. A greyed-out box invites the
           * reader to look for the way to un-grey it; a badge that states the
           * rule ends the question.
           */
          <Tooltip content="Security notices cannot be switched off.">
            <span className="inline-flex items-center gap-1.5">
              <Badge tone="neutral">
                <Lock className="size-3" aria-hidden />
                Always on
              </Badge>
              <span className="text-sm text-text-muted">
                {channels
                  .map((channel) => NOTIFICATION_CHANNEL_LABEL[channel])
                  .join(" · ")}
              </span>
            </span>
          </Tooltip>
        ) : (
          channels.map((channel) => (
            <Checkbox
              key={channel}
              id={`${idBase}-${event.key}-${channel}`}
              checked={selected.includes(channel)}
              onCheckedChange={(on) => onToggle(channel, on)}
              /* Names the event as well as the channel, so a screen reader
                 announces "Campaign completed, Email" rather than the tenth
                 unlabelled "Email" on the page. */
              label={`${NOTIFICATION_CHANNEL_LABEL[channel]} — ${event.title}`}
            />
          ))
        )
      }
    >
      <p className="text-sm font-semibold text-text-primary">{event.title}</p>
      <p className="mt-0.5 text-sm text-text-muted">{event.description}</p>
    </SettingsRow>
  );
}

/* -------------------------------------------------------------------------- */
/* Workspace policy                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The administrator's view: what members are allowed to be notified about.
 *
 * Deliberately coarse. An administrator decides whether an event exists for
 * this workspace and which channels it may use; they do not set individual
 * people's preferences, because doing that from here would silently overwrite
 * choices those people made and give them no way to see it had happened.
 */
function WorkspacePolicy() {
  const id = useId();
  const saved = useNotificationPolicy();
  const { state, run } = useSaveState();

  const [draft, setDraft] = useState<WorkspaceNotificationPolicy>(saved);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const groups = useMemo(() => notificationEventsByCategory(), []);

  const enabledCount = NOTIFICATION_EVENTS.filter(
    (event) => draft.enabled[event.key] !== false,
  ).length;

  function setEnabled(event: NotificationEventDef, on: boolean) {
    setDraft((current) => ({
      ...current,
      enabled: { ...current.enabled, [event.key]: on },
    }));
  }

  function setChannel(
    event: NotificationEventDef,
    channel: NotificationChannel,
    on: boolean,
  ) {
    setDraft((current) => {
      const existing = current.channels[event.key] ?? event.channels;
      const next = on
        ? event.channels.filter(
            (item) => existing.includes(item) || item === channel,
          )
        : existing.filter((item) => item !== channel);

      return { ...current, channels: { ...current.channels, [event.key]: next } };
    });
  }

  return (
    <div className="space-y-6">
      <ServiceNotice
        tone="unavailable"
        title="This changes what every member can receive"
        action={<Badge tone="brand">{enabledCount} of {NOTIFICATION_EVENTS.length} enabled</Badge>}
      >
        Switching an event off removes it from every member&rsquo;s
        Notifications page, including people who had chosen to receive it.
        Restricting a channel does the same for that channel. Members keep
        control of their own delivery within whatever is left available.
      </ServiceNotice>

      {groups.map((group) => (
        <SettingsSection
          key={group.category.key}
          title={group.category.label}
          description={group.category.description}
          bodyClassName="-mx-5 divide-y divide-border"
        >
          {group.events.map((event) => {
            const on = draft.enabled[event.key] !== false;
            const permitted = draft.channels[event.key] ?? event.channels;

            return (
              <SettingsRow
                key={event.key}
                /* Dimmed rather than hidden when the event is off: the channels
                   an administrator had permitted are what they get back if they
                   switch it on again, and removing them from view makes that
                   look like a reset. */
                className={cn(!on && "[&>div:last-child]:opacity-50")}
                actions={
                  event.mandatory ? (
                    <Badge tone="neutral">
                      <Lock className="size-3" aria-hidden />
                      Required
                    </Badge>
                  ) : (
                    event.channels.map((channel) => (
                      <Checkbox
                        key={channel}
                        id={`${id}-policy-${event.key}-${channel}`}
                        checked={permitted.includes(channel)}
                        disabled={!on}
                        onCheckedChange={(next) => setChannel(event, channel, next)}
                        label={`Allow ${NOTIFICATION_CHANNEL_LABEL[channel]} — ${event.title}`}
                      />
                    ))
                  )
                }
              >
                <Checkbox
                  id={`${id}-${event.key}-enabled`}
                  checked={on}
                  disabled={event.mandatory}
                  onCheckedChange={(next) => setEnabled(event, next)}
                  label={event.title}
                />
              </SettingsRow>
            );
          })}
        </SettingsSection>
      ))}

      <Card className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 px-5 py-4 shadow-card-hover">
        <SaveBar
          state={state}
          dirty={dirty}
          onSave={() => void run(() => updateNotificationPolicy(draft))}
          onCancel={() => setDraft(saved)}
          label="Save configuration"
        />
      </Card>
    </div>
  );
}
