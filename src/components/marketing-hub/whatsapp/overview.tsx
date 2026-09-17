/*
 * A client component although nothing here is interactive.
 *
 * `StatsGrid` is one, and `StatItem.icon` is a component function — which a
 * server component cannot hand across the boundary ("Functions cannot be passed
 * directly to Client Components"). The directive is the cheapest fix; the
 * alternative is passing icon *names* through the stat row, which would mean
 * changing a component every other module depends on.
 */
"use client";

import { Clock, Inbox, MessageSquare, Users, Workflow } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { BrandIcon } from "@/components/ui/brand-icon";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PanelCard } from "@/components/ui/chart-card";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/progress";
import { StatsGrid, MiniStat, type StatItem } from "@/components/ui/stats-card";
import { CHANNEL_THEME } from "@/constants/channels";
import { INTEGRATION_ROUTES } from "@/constants/integrations";
import { APP_ROUTES } from "@/constants";
import { CONVERSATIONS } from "@/lib/marketing-fixtures";
import { AUTOMATION_FLOWS } from "@/lib/automation-fixtures";
import {
  WA_ACTIVITY,
  WA_CONNECTION,
  WA_INBOX_SNAPSHOT,
  WA_OVERVIEW_TOTALS,
} from "@/lib/whatsapp-fixtures";
import {
  formatCount,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  rate,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { ActivityFeed } from "../shared/activity-feed";
import { RecentConversations } from "../shared/recent-conversations";

/**
 * The WhatsApp module's landing page — the operational one.
 *
 * Everything here answers "what is happening, and what do I do next": the
 * threads waiting, the queue behind them, what the automations ran, and what
 * changed.
 *
 * It used to open that second row on a Quick Actions card — five links to
 * Campaigns, Templates, Contacts, Automations and Analytics. Every one is a
 * tab in the module's own nav directly above it, so the card was the
 * navigation rendered a second time and dressed as content. Removed rather
 * than swapped for different shortcuts, and the conversation list took the
 * slot: threads waiting on a reply are what the page is for.
 *
 * Both rows are even pairs now. Three cards sharing a three-column row gave
 * each of them a third of the page, which is under the measure a conversation
 * row or a timeline entry was drawn at.
 *
 * Nothing here is a trend. The page used to carry a message-performance chart,
 * a delivery-rate breakdown and a campaign comparison — three readings that
 * Analytics already owns, drawn from the same fixtures, so the two pages
 * answered the same question with two different layouts and a merchant had to
 * learn which one was authoritative. Performance moved out wholesale; see
 * `whatsapp/analytics`. What is left is the state of the channel right now,
 * which no other page reports.
 */

const theme = CHANNEL_THEME.whatsapp;
const ACCENT = { soft: theme.soft, text: theme.text };
const SNAPSHOT = WA_INBOX_SNAPSHOT;

/**
 * One tone per subsystem, for the KPI row's icon tiles.
 *
 * The row covers five different things — a queue, a wait, a clock, a robot and
 * an audience — and five identical green tiles made the icons decorative:
 * nothing could be found without reading its label. Every pair is a
 * `-soft`/ink pair that already exists in the ramp, and each is the colour that
 * thing wears elsewhere in the product.
 */
const TILES = {
  conversations: { soft: "bg-primary-subtle", text: "text-secondary" },
  waiting: { soft: "bg-warning-soft", text: "text-warning-text" },
  response: { soft: "bg-info-soft", text: "text-info-text" },
  automation: { soft: "bg-primary-soft", text: "text-primary" },
  contacts: { soft: theme.soft, text: theme.text },
};

/**
 * Five readings of the queue, not of the campaign log.
 *
 * Sent, delivery rate and reply rate used to sit here. They are the first three
 * KPIs on Analytics, computed from the same `whatsappTotals()` call, so the two
 * rows could only ever agree — which made one of them redundant rather than
 * reassuring. These five have no counterpart on the other page.
 */
const STATS: StatItem[] = [
  {
    label: "Open Conversations",
    value: formatNumber(SNAPSHOT.open),
    changePercent: SNAPSHOT.openChange,
    icon: MessageSquare,
    accent: TILES.conversations,
    hint: `${SNAPSHOT.pending} pending · ${SNAPSHOT.resolvedToday} closed today`,
  },
  {
    label: "Awaiting Reply",
    value: formatNumber(SNAPSHOT.awaitingReply),
    changePercent: SNAPSHOT.awaitingChange,
    icon: Inbox,
    accent: TILES.waiting,
    hint: `${SNAPSHOT.unassigned} with no owner`,
    /* A shrinking backlog is the good outcome, so the trend flips. */
    invertTrend: true,
  },
  {
    label: "Avg First Response",
    value: `${WA_OVERVIEW_TOTALS.avgResponseMinutes}m`,
    changePercent: WA_OVERVIEW_TOTALS.responseChange,
    icon: Clock,
    accent: TILES.response,
    hint: "median, across all agents",
    invertTrend: true,
  },
  {
    label: "Active Automations",
    value: formatCount(WA_OVERVIEW_TOTALS.activeAutomations),
    changePercent: WA_OVERVIEW_TOTALS.automationsChange,
    icon: Workflow,
    accent: TILES.automation,
    hint: "running now",
  },
  {
    label: "Opted-in Contacts",
    value: formatCount(WA_OVERVIEW_TOTALS.contacts),
    changePercent: WA_OVERVIEW_TOTALS.contactsChange,
    icon: Users,
    accent: TILES.contacts,
    hint: `${formatPercent(WA_OVERVIEW_TOTALS.optInRate)} of the list`,
  },
];

/**
 * A tint per agent, for the avatar chip.
 *
 * `Avatar` is monochrome by default and says why: forty randomly tinted
 * circles in a contact table is the fastest way to make a clean list look like
 * a template. Its `tone` escape hatch exists for the few places where the
 * avatar carries meaning, and it names an agent as one of them — a support
 * queue is read by finding *your* row, and a colour finds it faster than a
 * name does.
 *
 * Keyed by name rather than assigned by index, so the palette survives the
 * sort below: an agent keeps their colour whether they are top of the queue or
 * bottom of it. Every pair is an existing token — including the pink, which is
 * `--color-instagram` at a tenth opacity, the one rose in the ramp.
 */
const AGENT_TONES: Record<string, string> = {
  "Nadia Karim": "bg-whatsapp-soft text-whatsapp",
  "Imran Hossain": "bg-info-soft text-info-text",
  "Tanvir Alam": "bg-sms-soft text-sms",
  "Sarah Ahmed": "bg-warning-soft text-warning-text",
  "Maria Gomez": "bg-instagram/10 text-instagram",
  "John Smith": "bg-primary-soft text-primary",
  "Priya Nair": "bg-accent-soft text-accent",
};

/**
 * A tint per queue state, for the Inbox card's four counts.
 *
 * Four numbers in a row on one white ground read as the same number printed
 * four times; what a supervisor is actually scanning for is a *state* — what is
 * live, what is waiting on us, what nobody owns, what is done — and the tint
 * separates those before a label is read. Each colour is the one that state
 * already wears in this product — the KPI row directly above this card tints
 * its Awaiting Reply tile with the same warning amber.
 *
 * The status softs are carried at 60% and the other two at full strength, which
 * lands all four at roughly the same weight over white — `success-soft` and
 * `warning-soft` are a good deal heavier than the violet and slate beside them,
 * and four tints that disagree about how loud they are read as an alert rather
 * than as a legend.
 *
 * Edges are tinted to match rather than left on the neutral border: a coloured
 * ground inside a grey outline is the one combination that looks like a
 * highlighted cell instead of a designed tile.
 */
const QUEUE_TINTS = {
  /** Live conversations — the healthy state, so the success green. */
  open: "border-success/20 bg-success-soft/60",
  /** Waiting on us. Same amber the Awaiting Reply KPI wears. */
  awaiting: "border-warning/25 bg-warning-soft/60",
  /** Nobody owns these. Violet — unclaimed work, not a warning. */
  unassigned: "border-primary/15 bg-primary-subtle",
  /** Settled. The neutral slate, so "done" is the quietest tile in the row. */
  closed: "border-border-strong/60 bg-surface-secondary",
};

/**
 * What a load percentage means, as the colour of the bar.
 *
 * Three bands rather than a gradient: the question a supervisor asks is "who
 * needs help", and that has a yes, a maybe and a no. The thresholds are where
 * a queue stops being comfortable — over 70% of capacity an agent is behind,
 * under 40% they have room for the next thread.
 */
function loadBand(percent: number): { tone: string; label: string } {
  if (percent >= 70) return { tone: "bg-error", label: "High load" };
  if (percent >= 40) return { tone: "bg-warning", label: "Medium load" };
  return { tone: "bg-whatsapp", label: "Low load" };
}

/** The panel rules, in one place so the three panels cannot drift apart. */
const SECTION_RULE = "text-[15px] font-semibold text-text-primary capitalize";

const WA_FLOWS = AUTOMATION_FLOWS.filter((flow) => flow.channel === "whatsapp");

/* Contacts mid-flow: a share of everything the flows have processed. */
const IN_FLOW = Math.round(
  WA_FLOWS.reduce((sum, flow) => sum + flow.contactsProcessed, 0) * 0.064,
);

const AVG_SUCCESS =
  WA_FLOWS.reduce((sum, flow) => sum + flow.successRate, 0) /
  Math.max(WA_FLOWS.length, 1);

/* -------------------------------------------------------------------------- */
/* Connection                                                                 */
/* -------------------------------------------------------------------------- */

/** Meta's own three-step rating, on the ramp the rest of the product uses. */
const QUALITY_TONE: Record<"high" | "medium" | "low", BadgeTone> = {
  high: "success",
  medium: "warning",
  low: "danger",
};

/**
 * Whether the channel can send, as the first thing on the page.
 *
 * Above the KPIs on purpose: every number below assumes the account is
 * connected, inside its send limit and receiving webhooks. When one of those
 * three is wrong, it is the only thing on the page worth reading — a merchant
 * chasing a flat reply rate should find a failing webhook here, not in the
 * Integrations module two clicks away.
 *
 * A strip rather than a panel. It is a precondition, not a reading, and the
 * moment it earns a card of its own it starts competing with the metrics it
 * exists to qualify.
 */
function ConnectionStatus() {
  const used = rate(WA_CONNECTION.windowUsed, WA_CONNECTION.tierLimit);

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-btn",
              theme.soft,
              theme.text,
            )}
          >
            <BrandIcon name="whatsapp" className="size-5" />
          </span>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">
              {WA_CONNECTION.businessName}
            </p>
            <p className="truncate text-meta font-medium text-text-secondary tabular-nums">
              {WA_CONNECTION.phone}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="success" size="sm" className="gap-1.5">
            <span aria-hidden className="size-1.5 rounded-full bg-success" />
            Connected
          </Badge>
          <Badge tone={QUALITY_TONE[WA_CONNECTION.quality]} size="sm">
            {WA_CONNECTION.quality} quality
          </Badge>
          {WA_CONNECTION.verified ? (
            <Badge tone="neutral" size="sm">
              Business verified
            </Badge>
          ) : (
            <Badge tone="danger" size="sm">
              Not verified
            </Badge>
          )}
          <Badge
            tone={WA_CONNECTION.webhookHealthy ? "neutral" : "danger"}
            size="sm"
          >
            {WA_CONNECTION.webhookHealthy
              ? "Webhook healthy"
              : "Webhook failing"}
          </Badge>
        </div>

        {/* The send ceiling, which is the one piece of connection health that
            is a quantity rather than a state. */}
        <div className="min-w-48 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className={SECTION_RULE}>24-hour send limit</p>
            <p className="text-sm font-bold text-text-primary tabular-nums">
              {formatNumber(WA_CONNECTION.windowUsed)} /{" "}
              {formatCount(WA_CONNECTION.tierLimit)}
            </p>
          </div>
          <ProgressBar
            value={used}
            label="Share of the 24-hour send limit used"
            tone={
              used >= 90 ? "bg-error" : used >= 75 ? "bg-warning" : theme.accent
            }
            size="sm"
            className="mt-1.5"
          />
        </div>

        <ButtonLink
          href={INTEGRATION_ROUTES.whatsapp}
          variant="outline"
          size="sm"
          className="shrink-0"
        >
          Manage connection
        </ButtonLink>
      </div>
    </Card>
  );
}

export function WhatsAppOverview() {
  const conversations = [...CONVERSATIONS]
    .sort(
      (a, b) =>
        new Date(b.contact.lastActivityAt).getTime() -
        new Date(a.contact.lastActivityAt).getTime(),
    )
    .slice(0, 5);

  /*
   * Busiest first, with each agent's load against their own capacity.
   *
   * Sorted here rather than in the fixture so adding an eighth agent anywhere
   * in that list still lands them in the right place, and so the one row a
   * supervisor is looking for — whoever is closest to drowning — is always the
   * first one they read.
   */
  const agentLoad = [...SNAPSHOT.agents]
    .sort((a, b) => b.open - a.open)
    .map((agent) => {
      const load = (agent.open / SNAPSHOT.agentCapacity) * 100;
      return { ...agent, load, band: loadBand(load) };
    });

  return (
    <>
      <ConnectionStatus />

      <StatsGrid items={STATS} accent={ACCENT} columns={5} />

      {/*
        Conversations first, where Quick Actions used to be.

        That card was five links — Campaigns, Templates, Contacts, Automations
        and Analytics — and every one of them is a tab in the module's own nav
        directly above it, so it was the navigation rendered a second time and
        dressed as content. Removed rather than swapped for different
        shortcuts: what the slot is worth is the threads waiting on a reply.

        An even pair, so the two cards share a baseline. Inbox gives up the
        two-thirds it held while Quick Actions took the remaining third; at half
        each, the conversation rows get the measure they were drawn at and the
        queue's four counts still sit four across.
      */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard
          title="Recent Conversations"
          description="The five most recently active threads."
          action={
            <ButtonLink
              href={APP_ROUTES.whatsappInbox}
              variant="ghost"
              size="sm"
            >
              Open inbox
            </ButtonLink>
          }
        >
          <RecentConversations
            conversations={conversations}
            hrefBase={APP_ROUTES.whatsappInbox}
          />
        </PanelCard>

        <PanelCard
          title="Whatsapp Inbox"
          description="The queue as it stands, and who is carrying it."
          action={
            <ButtonLink
              href={APP_ROUTES.whatsappInbox}
              variant="outline"
              size="sm"
            >
              Open inbox
            </ButtonLink>
          }
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniStat
              label="Open"
              value={formatNumber(SNAPSHOT.open)}
              hint={`${formatNumber(SNAPSHOT.unreadMessages)} unread`}
              tone={QUEUE_TINTS.open}
            />
            <MiniStat
              label="Awaiting reply"
              value={formatNumber(SNAPSHOT.awaitingReply)}
              hint="inbound, unanswered"
              tone={QUEUE_TINTS.awaiting}
            />
            <MiniStat
              label="Unassigned"
              value={formatNumber(SNAPSHOT.unassigned)}
              hint="no owner yet"
              tone={QUEUE_TINTS.unassigned}
            />
            <MiniStat
              label="Closed today"
              value={formatNumber(SNAPSHOT.resolvedToday)}
              hint={`${formatNumber(SNAPSHOT.pending)} still pending`}
              tone={QUEUE_TINTS.closed}
            />
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <p className={SECTION_RULE}>Agent load</p>

            {/*
              Two lines an agent, not three.

              Seven agents at three lines each ran to about 420px of list,
              which pushed this card well past Recent Conversations beside it
              and undid the even pair the row is built on. Folding the counts
              up onto the name line and the percentage in beside the bar it
              labels keeps all four facts and gets the row back to roughly the
              height of a conversation row, so the two cards end level.
            */}
            <ul className="mt-3 space-y-3">
              {agentLoad.map((agent) => (
                <li key={agent.name} className="flex items-center gap-3">
                  {/*
                    The photo, with presence on it.

                    36px rather than the 32 this sat at: at 32 a face is a
                    thumbnail of a face, and the row is two lines of text tall,
                    so the larger chip aligns with the pair instead of floating
                    against the name alone. `Avatar` falls back to the agent's
                    initials on its own when there is no photo, which is three
                    of the seven and is what a real roster looks like. The
                    tint keyed to their name carries that fallback, and it is
                    the same tint their photo would have sat on.

                    The dot is composed here rather than added to the
                    primitive, same as the dashboard inbox does it: an avatar
                    has no business knowing whether someone is signed in. The
                    ring is the card's own white, so the dot reads as sitting
                    on top of the photo rather than cut out of it.
                  */}
                  <span className="relative shrink-0">
                    <Avatar
                      name={agent.name}
                      src={agent.avatarUrl}
                      size="sm+"
                      tone={AGENT_TONES[agent.name]}
                    />
                    {agent.online ? (
                      <span
                        className="absolute right-0 bottom-0 size-2.5 rounded-full bg-whatsapp ring-2 ring-surface"
                        role="img"
                        aria-label="Online"
                      />
                    ) : null}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {agent.name}
                      </p>
                      {/* The count is the figure and the wait annotates it, so
                          only the count takes primary ink. */}
                      <p className="shrink-0 text-meta text-text-secondary tabular-nums">
                        <span className="font-bold text-text-primary">
                          {agent.open}
                        </span>{" "}
                        chats · {agent.avgResponseMinutes}m
                      </p>
                    </div>

                    <div className="mt-1.5 flex items-center gap-2">
                      <ProgressBar
                        value={agent.load}
                        label={`${agent.name}: ${agent.band.label}, ${agent.open} of ${SNAPSHOT.agentCapacity} threads`}
                        tone={agent.band.tone}
                        size="sm"
                        className="min-w-0 flex-1"
                      />
                      {/* Fixed width, so seven percentages line up as a column
                          however many digits each one has. */}
                      <span className="w-8 shrink-0 text-right text-meta font-bold text-text-primary tabular-nums">
                        {Math.round(agent.load)}%
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </PanelCard>
      </div>

      {/*
        The analytics pair, at even width.

        These two and Recent Conversations used to share a three-column row, so
        each got a third of the page — which left a timeline entry's icon,
        title, detail and timestamp competing inside about 380px. Two cards at
        half the page each, and grid stretch keeps them the same height without
        either one naming a height of its own.
      */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard
          title="Automation Activity"
          description="What ran on its own in the last 30 days."
          action={
            <ButtonLink
              href={APP_ROUTES.whatsappAutomations}
              variant="ghost"
              size="sm"
            >
              View all
            </ButtonLink>
          }
        >
          {/* Same three-part row as the conversations panel beside it — tile,
              thread of text, right-aligned figures — so two lists sitting side
              by side read as one page rather than two components. */}
          <ul className="divide-y divide-border">
            {WA_FLOWS.map((flow) => (
              <li
                key={flow.id}
                className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-btn",
                    TILES.automation.soft,
                    TILES.automation.text,
                  )}
                >
                  <Workflow className="size-4.5" aria-hidden />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {flow.name}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-text-secondary">
                    {flow.triggerLabel} · active{" "}
                    {formatRelativeTime(flow.lastActivityAt)}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-base leading-none font-bold text-text-primary tabular-nums">
                    {formatNumber(flow.contactsProcessed)}
                  </p>
                  <p className="mt-1 text-meta font-medium text-text-secondary tabular-nums">
                    {formatPercent(flow.successRate)} success
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/*
           * Three readings of the flows themselves.
           *
           * Opt-in rate and average reply time used to sit in this footer, and
           * both are now KPIs in the row at the top of the page — a figure
           * stated twice on one screen is a figure a merchant checks twice.
           */}
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
            <MiniStat
              label="In flow"
              value={formatNumber(IN_FLOW)}
              hint="waiting"
            />
            <MiniStat
              label="Live flows"
              value={formatNumber(WA_FLOWS.length)}
            />
            <MiniStat
              label="Avg success"
              value={formatPercent(AVG_SUCCESS)}
              hint="completed the flow"
            />
          </div>
        </PanelCard>

        <PanelCard
          title="Recent Activity"
          description="Everything this module did in the last two days."
        >
          {/* 14px titles, matching the two panels beside it. */}
          <ActivityFeed entries={WA_ACTIVITY} titleSize="sm" />
        </PanelCard>
      </div>
    </>
  );
}
