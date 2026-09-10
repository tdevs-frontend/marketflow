"use client";

import { useState } from "react";
import {
  Layers,
  Mail,
  MessageCircle,
  Pencil,
  ShoppingBag,
  Smartphone,
  StickyNote,
  Tag as TagIcon,
  Target,
} from "lucide-react";

import { AvatarLabel } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Textarea } from "@/components/ui/input";
import { TabCount, TabPanel, Tabs, type TabItem } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import {
  CUSTOMER_SEGMENTS,
  LEADS,
  activityForContact,
  contactName,
  ownerName,
  segmentMembers,
  stageLabel,
  type CustomerContact,
} from "@/lib/customer-fixtures";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/format";
import type { ContactChannel } from "@/types/contact";
import { cn } from "@/lib/utils";
import {
  ActivityTimeline,
  DrawerFact,
  DrawerSection,
} from "./activity-timeline";
import {
  ContactStatusBadge,
  LifecycleBadge,
  SourceBadge,
  StageBadge,
  TagBadge,
} from "./customer-badges";

type Tab =
  "overview" | "activity" | "orders" | "campaigns" | "automation" | "notes";

/**
 * One consent row: the channel, and whether we may use it.
 *
 * Consent is its own block rather than a fact in the grid because it is the one
 * thing here with legal weight — a reader should be able to answer "can I
 * message this person on WhatsApp?" without interpreting anything.
 */
const CONSENT: {
  channel: ContactChannel;
  label: string;
  icon: typeof Mail;
  tone: string;
}[] = [
  {
    channel: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    tone: "text-whatsapp",
  },
  { channel: "email", label: "Email", icon: Mail, tone: "text-email" },
  { channel: "sms", label: "SMS", icon: Smartphone, tone: "text-sms" },
];

function ConsentRow({ contact }: { contact: CustomerContact }) {
  return (
    <ul className="space-y-2">
      {CONSENT.map((item) => {
        const granted = contact.optedInChannels.includes(item.channel);
        const Icon = item.icon;

        return (
          <li key={item.channel} className="flex items-center gap-2.5">
            <Icon
              className={cn(
                "size-4 shrink-0",
                granted ? item.tone : "text-text-muted",
              )}
              aria-hidden
            />
            <span className="flex-1 text-[13px] text-text-secondary">
              {item.label}
            </span>
            <span
              className={cn(
                "text-[11px] font-medium",
                granted ? "text-success-text" : "text-text-muted",
              )}
            >
              {granted ? "Opted in" : "No consent"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Quick inspection for one contact, without leaving the table.
 *
 * A drawer rather than a route because the job it serves is comparison — a
 * reader works down a filtered list checking who to message, and a full page
 * navigation loses the list, the filters and the scroll position every time.
 *
 * Six tabs rather than one long scroll: the Overview is what is wanted nine
 * times out of ten, and burying it above five sections nobody asked for is how
 * a drawer becomes a page. `Tabs` handles the ARIA wiring and the panels are
 * `TabPanel`, so only the active one is in the accessibility tree.
 */
export function ContactDrawer({
  contact,
  onClose,
  onEdit,
  onAddTag,
  onAddToSegment,
  onCreateLead,
}: {
  contact: CustomerContact | null;
  onClose: () => void;
  onEdit: (contact: CustomerContact) => void;
  onAddTag: (contact: CustomerContact) => void;
  onAddToSegment: (contact: CustomerContact) => void;
  onCreateLead: (contact: CustomerContact) => void;
}) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [note, setNote] = useState("");

  /* Reset to Overview when a different contact is opened — landing on the
     previous contact's Automation tab is disorienting. */
  const subject = contact?.id ?? null;
  const [lastSubject, setLastSubject] = useState(subject);
  if (subject !== lastSubject) {
    setLastSubject(subject);
    setTab("overview");
    setNote("");
  }

  const activity = contact ? activityForContact(contact.id) : [];
  const leads = contact
    ? LEADS.filter((item) => item.contactId === contact.id)
    : [];
  const segments = contact
    ? /* Asked of the segment, so a dynamic one is included when its rules
         match — `segmentIds` only records the static memberships. */
      CUSTOMER_SEGMENTS.filter((segment) =>
        segmentMembers(segment).some((member) => member.id === contact.id),
      )
    : [];

  const orders = activity.filter((entry) => entry.kind === "order");
  const campaigns = activity.filter(
    (entry) => entry.kind === "campaign" || entry.kind === "email",
  );
  const automation = activity.filter((entry) => entry.kind === "automation");
  const notes = activity.filter((entry) => entry.kind === "note");

  const tabs: TabItem<Tab>[] = [
    { value: "overview", label: "Overview" },
    {
      value: "activity",
      label: "Activity",
      badge: activity.length ? <TabCount value={activity.length} /> : undefined,
    },
    {
      value: "orders",
      label: "Orders",
      badge: orders.length ? <TabCount value={orders.length} /> : undefined,
    },
    {
      value: "campaigns",
      label: "Campaigns",
      badge: campaigns.length ? (
        <TabCount value={campaigns.length} />
      ) : undefined,
    },
    {
      value: "automation",
      label: "Automation",
      badge: automation.length ? (
        <TabCount value={automation.length} />
      ) : undefined,
    },
    {
      value: "notes",
      label: "Notes",
      badge: notes.length ? <TabCount value={notes.length} /> : undefined,
    },
  ];

  const canMessage = (contact?.optedInChannels.length ?? 0) > 0;

  return (
    <Drawer
      open={Boolean(contact)}
      onClose={onClose}
      title={contact ? contactName(contact) : "Contact"}
      description={contact?.company ?? undefined}
      footer={
        contact ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              disabled={!canMessage}
              onClick={() =>
                toast(`Composer for ${contactName(contact)}`, "info")
              }
            >
              <MessageCircle className="size-4" />
              Send message
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddTag(contact)}
            >
              <TagIcon className="size-4" />
              Tags
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddToSegment(contact)}
            >
              <Layers className="size-4" />
              Segment
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCreateLead(contact)}
            >
              <Target className="size-4" />
              Create lead
            </Button>
          </div>
        ) : null
      }
    >
      {contact ? (
        <div className="space-y-4">
          {/* Identity and the quick actions the brief asks for. */}
          <div className="flex items-start justify-between gap-3">
            <AvatarLabel
              name={contactName(contact)}
              secondary={contact.email ?? contact.phone ?? undefined}
              size="lg"
            />
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <LifecycleBadge lifecycle={contact.lifecycle} />
              <ContactStatusBadge status={contact.status} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {CONSENT.map((item) => {
              const granted = contact.optedInChannels.includes(item.channel);
              const Icon = item.icon;

              return (
                <Tooltip
                  key={item.channel}
                  content={
                    granted
                      ? `Message on ${item.label}`
                      : `No ${item.label} consent`
                  }
                >
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!granted}
                    aria-label={`Message on ${item.label}`}
                    onClick={() => toast(`${item.label} composer`, "info")}
                  >
                    <Icon className={cn("size-4", granted && item.tone)} />
                    {item.label}
                  </Button>
                </Tooltip>
              );
            })}

            <Tooltip content="Edit this contact">
              <Button
                size="sm"
                variant="ghost"
                aria-label="Edit contact"
                onClick={() => onEdit(contact)}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
            </Tooltip>
          </div>

          <Tabs
            tabs={tabs}
            value={tab}
            onChange={setTab}
            label="Contact detail sections"
            idBase="contact-drawer"
          />

          {tab === "overview" ? (
            <TabPanel idBase="contact-drawer" value="overview">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-panel bg-surface-secondary p-3.5">
                <DrawerFact label="Email" value={contact.email ?? "—"} />
                <DrawerFact label="Phone" value={contact.phone ?? "—"} />
                <DrawerFact label="Company" value={contact.company ?? "—"} />
                <DrawerFact label="Job title" value={contact.jobTitle ?? "—"} />
                <DrawerFact label="Owner" value={ownerName(contact.ownerId)} />
                <DrawerFact
                  label="Source"
                  value={<SourceBadge source={contact.source} />}
                />
                <DrawerFact
                  label="Lifetime value"
                  value={formatCurrency(contact.lifetimeValue)}
                  strong
                />
                <DrawerFact
                  label="Orders"
                  value={String(contact.orders)}
                  strong
                />
                <DrawerFact
                  label="Last order"
                  value={
                    contact.lastOrderAt ? formatDate(contact.lastOrderAt) : "—"
                  }
                />
                <DrawerFact
                  label="Created"
                  value={formatDate(contact.createdAt)}
                />
              </dl>

              <DrawerSection
                title="Tags"
                action={
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAddTag(contact)}
                  >
                    Manage
                  </Button>
                }
                className="mt-4"
              >
                {contact.tags.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {contact.tags.map((tag) => (
                      <TagBadge key={tag} name={tag} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">
                    No tags on this contact.
                  </p>
                )}
              </DrawerSection>

              <DrawerSection
                title="Segments"
                action={
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAddToSegment(contact)}
                  >
                    Add
                  </Button>
                }
              >
                {segments.length ? (
                  <ul className="space-y-1.5">
                    {segments.map((segment) => (
                      <li
                        key={segment.id}
                        className="flex items-center gap-2 text-[13px] text-text-secondary"
                      >
                        <Layers
                          className="size-3.5 shrink-0 text-primary"
                          aria-hidden
                        />
                        <span className="truncate">{segment.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-text-muted">Not in any segment.</p>
                )}
              </DrawerSection>

              <DrawerSection title="Consent">
                <ConsentRow contact={contact} />
              </DrawerSection>

              {leads.length ? (
                <DrawerSection title="Open leads">
                  <ul className="space-y-2">
                    {leads.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-panel border border-border px-3 py-2.5"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium text-text-primary">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-text-muted">
                            {formatCurrency(item.value)} ·{" "}
                            {ownerName(item.ownerId)}
                          </span>
                        </span>
                        <StageBadge
                          stage={item.stage}
                          label={stageLabel(item.stage)}
                        />
                      </li>
                    ))}
                  </ul>
                </DrawerSection>
              ) : null}
            </TabPanel>
          ) : null}

          {tab === "activity" ? (
            <TabPanel idBase="contact-drawer" value="activity">
              <ActivityTimeline
                entries={activity}
                emptyDescription="Conversations, campaign events and notes for this contact will appear here."
              />
            </TabPanel>
          ) : null}

          {tab === "orders" ? (
            <TabPanel idBase="contact-drawer" value="orders">
              {orders.length ? (
                <ActivityTimeline entries={orders} />
              ) : (
                <EmptyState
                  title="No orders yet"
                  description="Completed orders will appear here with their value and date."
                />
              )}
              {contact.orders > 0 ? (
                <div className="mt-4 flex items-center justify-between rounded-panel bg-surface-secondary px-3.5 py-3">
                  <span className="flex items-center gap-2 text-[13px] text-text-secondary">
                    <ShoppingBag className="size-4 text-success" aria-hidden />
                    {contact.orders} order{contact.orders === 1 ? "" : "s"}{" "}
                    lifetime
                  </span>
                  <span className="text-sm font-bold text-text-primary tabular-nums">
                    {formatCurrency(contact.lifetimeValue)}
                  </span>
                </div>
              ) : null}
            </TabPanel>
          ) : null}

          {tab === "campaigns" ? (
            <TabPanel idBase="contact-drawer" value="campaigns">
              {campaigns.length ? (
                <ActivityTimeline entries={campaigns} />
              ) : (
                <EmptyState
                  title="No campaign activity"
                  description="Opens, clicks and sends will appear here once this contact is included in a campaign."
                />
              )}
            </TabPanel>
          ) : null}

          {tab === "automation" ? (
            <TabPanel idBase="contact-drawer" value="automation">
              {automation.length ? (
                <ActivityTimeline entries={automation} />
              ) : (
                <EmptyState
                  title="Not in any automation"
                  description="Workflow entries and exits will appear here."
                />
              )}
            </TabPanel>
          ) : null}

          {tab === "notes" ? (
            <TabPanel idBase="contact-drawer" value="notes">
              <Field label="Add a note" htmlFor="contact-note">
                <Textarea
                  id="contact-note"
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="What should the next person know?"
                />
              </Field>
              <Button
                size="sm"
                className="mt-2.5"
                disabled={note.trim().length === 0}
                onClick={() => {
                  setNote("");
                  toast("Note added", "success");
                }}
              >
                <StickyNote className="size-4" />
                Add note
              </Button>

              <div className="mt-4">
                {notes.length ? (
                  <ActivityTimeline entries={notes} />
                ) : (
                  <p className="text-xs text-text-muted">No notes yet.</p>
                )}
              </div>
            </TabPanel>
          ) : null}

          <p className="border-t border-border pt-3 text-[11px] text-text-muted">
            Last contacted{" "}
            {contact.lastContactedAt
              ? formatRelativeTime(contact.lastContactedAt)
              : "never"}
          </p>
        </div>
      ) : null}
    </Drawer>
  );
}
