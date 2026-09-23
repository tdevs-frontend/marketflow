"use client";

import { useId, useMemo, useState } from "react";
import { Lock, Search } from "lucide-react";

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
  NotificationCategory,
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
 * Notifications - two settings with one name, told apart.
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
 * authorisation, and - for anyone who can do both - two views that you have to
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

/** One category and the events under it, as `notificationEventsByCategory` returns. */
type EventGroup = ReturnType<typeof notificationEventsByCategory>[number];

export function NotificationSettings() {
  const permissions = useWorkspacePermissions();
  const canConfigure = permissions.can("workspace_settings", "edit");

  const [view, setView] = useState<View>("me");

  return (
    <>
      <div className="space-y-6">
        <ServiceNotice tone="session" title="Preferences are saved, delivery is not connected">
          These choices are kept for this session and are the events the product
          genuinely models - nothing here is a placeholder switch. What does not
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
   * workspace has not permitted is not offered - which is what makes the split
   * real. A UI that shows every event and quietly ignores half of them has an
   * administrator's setting that does nothing visible.
   */
  const groups = useMemo(() => {
    const available = NOTIFICATION_EVENTS.filter(
      (event) => policy.enabled[event.key] !== false,
    );
    return notificationEventsByCategory(available);
  }, [policy]);

  const { query, setQuery, category, setCategory, filtered } =
    useEventFilter(groups);

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
            title="No notification preferences are available yet"
            description="Once notification events are enabled for your workspace, they will appear here."
          />
        </Card>
      ) : (
        <>
          {/* The browser and the count sit above the sections rather than
              inside a card of their own - they are controls over the list,
              not a section of it. */}
          <div className="space-y-3">
            <EventFilterBar
              groups={groups}
              query={query}
              onQuery={setQuery}
              category={category}
              onCategory={setCategory}
              matches={filtered.reduce((n, g) => n + g.events.length, 0)}
              idBase={id}
            />
            <PreferenceSummary groups={groups} selected={draft.channels} />
          </div>

          {filtered.length === 0 ? (
            <Card>
              <EmptyState
                compact
                title="No notifications match"
                description="Try a different search, or choose another module."
              />
            </Card>
          ) : (
            filtered.map((group) => (
              <SettingsSection
                key={group.category.key}
                title={group.category.label}
                description={group.category.description}
                action={
                  <CategoryToggle
                    group={group}
                    selected={draft.channels}
                    onChange={(next) =>
                      setDraft((current) => ({
                        ...current,
                        channels: { ...current.channels, ...next },
                      }))
                    }
                  />
                }
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
        </>
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

/* -------------------------------------------------------------------------- */
/* Finding a notification                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Search and a category filter, over a catalogue of fifty-odd rows.
 *
 * Neither would earn its place at a dozen events - and neither was here when
 * there were sixteen. The page now covers every module in the product, which
 * is what makes it useful and also what makes "turn off the bounce alert" a
 * scrolling problem. Two controls, both compact, both operating on the same
 * filtered list the sections below render.
 *
 * Search matches the title and the description rather than the key. A merchant
 * looking for the low-stock row types "stock", not `inventory.low_stock`, and
 * matching the description is what finds "Out of stock" from the word
 * "restocked".
 *
 * The category filter is a `<select>` rather than eleven chips. Eleven chips
 * wrap to three lines on a laptop and push the first section below the fold,
 * which costs more than the click it saves.
 */
function useEventFilter(groups: EventGroup[]) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<NotificationCategory | "all">("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return groups
      .filter((group) => category === "all" || group.category.key === category)
      .map((group) => ({
        ...group,
        events: needle
          ? group.events.filter(
              (event) =>
                event.title.toLowerCase().includes(needle) ||
                event.description.toLowerCase().includes(needle),
            )
          : group.events,
      }))
      .filter((group) => group.events.length > 0);
  }, [groups, query, category]);

  return { query, setQuery, category, setCategory, filtered };
}

function EventFilterBar({
  groups,
  query,
  onQuery,
  category,
  onCategory,
  matches,
  idBase,
}: {
  groups: EventGroup[];
  query: string;
  onQuery: (value: string) => void;
  category: NotificationCategory | "all";
  onCategory: (value: NotificationCategory | "all") => void;
  matches: number;
  idBase: string;
}) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
        />
        <Input
          id={`${idBase}-search`}
          size="sm"
          className="pl-9"
          placeholder="Search notifications…"
          aria-label="Search notifications"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
        />
      </div>

      <Select
        size="sm"
        label="Filter by module"
        value={category}
        onChange={onCategory}
        className="sm:w-56"
        options={[
          { value: "all", label: "All modules" },
          ...groups.map((group) => ({
            value: group.category.key,
            label: group.category.label,
          })),
        ]}
      />

      {/* Announced, because filtering a list by typing gives a sighted reader
          instant feedback and everybody else nothing at all. */}
      <p role="status" aria-live="polite" className="sr-only">
        {matches} {matches === 1 ? "notification" : "notifications"} shown.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * How many of the available notifications are switched on.
 *
 * One line, not a card. The number a merchant wants from this page at a glance
 * is "am I going to hear about anything", and with fifty rows that is no longer
 * answerable by looking. It counts the *available* events - an event an
 * administrator has switched off is not the member's to be on or off about.
 */
function PreferenceSummary({
  groups,
  selected,
}: {
  groups: EventGroup[];
  selected: Record<string, NotificationChannel[]>;
}) {
  const events = groups.flatMap((group) => group.events);
  const on = events.filter(
    (event) => event.mandatory || (selected[event.key] ?? []).length > 0,
  ).length;

  return (
    <p className="text-sm font-medium text-text-muted">
      <span className="font-bold text-text-primary tabular-nums">{on}</span> of{" "}
      <span className="tabular-nums">{events.length}</span> notifications on
      {on < events.length ? (
        <>
          {" · "}
          <span className="tabular-nums">{events.length - on}</span> muted
        </>
      ) : null}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Category master control                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Turn a whole module on or off in one move.
 *
 * Eleven modules and fifty rows is a page somebody arrives at wanting to mute
 * Social entirely, and doing that a checkbox at a time is the interaction that
 * makes them mute everything instead.
 *
 * "On" restores each event's *own* default rather than ticking every box:
 * switching Commerce back on should not start mailing you about every product
 * that gets published, which is the setting nobody chose and everybody would
 * have to undo. `defaultChannels` is the editorial answer to "what does this
 * event deserve", and it is the right answer here too.
 *
 * It only ever writes the member's own preferences. The workspace policy is an
 * administrator's record and is not reachable from this control - a master
 * switch that quietly widened its blast radius would be the exact collapse the
 * two-record split exists to prevent.
 */
function CategoryToggle({
  group,
  selected,
  onChange,
}: {
  group: EventGroup;
  selected: Record<string, NotificationChannel[]>;
  /** Event key → the channels it should now use. */
  onChange: (next: Record<string, NotificationChannel[]>) => void;
}) {
  /* Mandatory rows are not the member's to switch, so they are excluded from
     both the reading and the writing - otherwise the control could never show
     "off" for a category holding one. */
  const optional = group.events.filter((event) => !event.mandatory);
  const anyOn = optional.some(
    (event) => (selected[event.key] ?? []).length > 0,
  );

  if (optional.length === 0) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() =>
        onChange(
          Object.fromEntries(
            optional.map((event) => [
              event.key,
              anyOn ? [] : [...event.defaultChannels],
            ]),
          ),
        )
      }
    >
      {anyOn ? "Mute all" : "Restore defaults"}
      <span className="sr-only"> in {group.category.label}</span>
    </Button>
  );
}

/**
 * One notification, as a row.
 *
 * Title, one line of what raises it, and a checkbox per permitted channel - the
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
           * Not a disabled checkbox. The one mandatory row left is a declined
           * charge, which ends in a suspended workspace if nobody acts on it -
           * and the person who muted it is exactly the person who needed
           * telling. A greyed-out box invites the reader to look for the way
           * to un-grey it; a badge that states the rule ends the question.
           */
          <Tooltip content="A failed payment suspends the workspace, so this one cannot be switched off.">
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
              label={`${NOTIFICATION_CHANNEL_LABEL[channel]} - ${event.title}`}
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
                        label={`Allow ${NOTIFICATION_CHANNEL_LABEL[channel]} - ${event.title}`}
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
