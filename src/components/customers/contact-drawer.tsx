"use client";

import {
  ExternalLink,
  Layers,
  Mail,
  MessageCircle,
  Smartphone,
  StickyNote,
  Tag as TagIcon,
  Target,
} from "lucide-react";

import { AvatarLabel } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import {
  LEADS,
  PIPELINE_STAGES,
  activityForContact,
  contactName,
  ownerName,
  stageLabel,
  type CustomerContact,
} from "@/lib/customer-fixtures";
import { SEGMENTS } from "@/lib/segment-fixtures";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/format";
import type { ContactChannel } from "@/types/contact";
import { cn } from "@/lib/utils";
import { ActivityTimeline, DrawerFact, DrawerSection } from "./activity-timeline";
import {
  ContactStatusBadge,
  LifecycleBadge,
  SourceBadge,
  StageBadge,
  TagBadge,
} from "./customer-badges";

/**
 * One consent row: the channel, and whether we may use it.
 *
 * Consent is shown as its own block rather than folded into the fact grid
 * because it is the one thing on this drawer with legal weight — a reader
 * should be able to answer "can I message this person on WhatsApp?" without
 * interpreting anything.
 */
const CONSENT: { channel: ContactChannel; label: string; icon: typeof Mail; tone: string }[] = [
  { channel: "whatsapp", label: "WhatsApp", icon: MessageCircle, tone: "text-whatsapp" },
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
              className={cn("size-4 shrink-0", granted ? item.tone : "text-text-muted")}
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
 * "View full profile" is the escape hatch to the route for the cases that
 * genuinely need one.
 *
 * Everything below the header is a `DrawerSection`, the same stack the lead
 * and journey drawers use.
 */
export function ContactDrawer({
  contact,
  onClose,
  onAddTag,
  onAddToSegment,
  onCreateLead,
}: {
  contact: CustomerContact | null;
  onClose: () => void;
  onAddTag: (contact: CustomerContact) => void;
  onAddToSegment: (contact: CustomerContact) => void;
  onCreateLead: (contact: CustomerContact) => void;
}) {
  const activity = contact ? activityForContact(contact.id) : [];
  const leads = contact ? LEADS.filter((item) => item.contactId === contact.id) : [];
  const segments = contact
    ? SEGMENTS.filter((segment) => contact.segmentIds.includes(segment.id))
    : [];

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
              disabled={!contact.optedInChannels.length}
              onClick={() => {
                /* TODO: open the channel composer for this contact. */
              }}
            >
              <MessageCircle className="size-4" />
              Send message
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAddTag(contact)}>
              <TagIcon className="size-4" />
              Add tag
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddToSegment(contact)}
            >
              <Layers className="size-4" />
              Add to segment
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onCreateLead(contact)}>
              <Target className="size-4" />
              Create lead
            </Button>
          </div>
        ) : null
      }
    >
      {contact ? (
        <div className="space-y-4">
          {/* Identity */}
          <div className="flex items-start justify-between gap-3">
            <AvatarLabel
              name={contactName(contact)}
              secondary={contact.jobTitle ?? contact.email ?? undefined}
              size="lg"
            />
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <LifecycleBadge lifecycle={contact.lifecycle} />
              <ContactStatusBadge status={contact.status} />
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-panel bg-surface-secondary p-3.5">
            <DrawerFact label="Email" value={contact.email ?? "—"} />
            <DrawerFact label="Phone" value={contact.phone ?? "—"} />
            <DrawerFact
              label="Lifetime value"
              value={formatCurrency(contact.lifetimeValue)}
              strong
            />
            <DrawerFact label="Orders" value={String(contact.orders)} strong />
            <DrawerFact
              label="Last order"
              value={contact.lastOrderAt ? formatDate(contact.lastOrderAt) : "—"}
            />
            <DrawerFact label="Owner" value={ownerName(contact.ownerId)} />
            <DrawerFact label="Source" value={<SourceBadge source={contact.source} />} />
            <DrawerFact label="Created" value={formatDate(contact.createdAt)} />
          </dl>

          <DrawerSection
            title="Tags"
            action={
              <Button size="sm" variant="ghost" onClick={() => onAddTag(contact)}>
                Add
              </Button>
            }
          >
            {contact.tags.length ? (
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((tag) => (
                  <TagBadge key={tag} name={tag} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted">No tags on this contact.</p>
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
                    <Layers className="size-3.5 shrink-0 text-primary" aria-hidden />
                    <span className="truncate">{segment.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-text-muted">
                Not in any segment. Segments this contact matches will appear here
                once they are dynamic.
              </p>
            )}
          </DrawerSection>

          <DrawerSection title="Communication preferences">
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
                    <StageBadge stage={item.stage} label={stageLabel(item.stage)} />
                  </li>
                ))}
              </ul>
            </DrawerSection>
          ) : null}

          <DrawerSection
            title="Activity"
            action={
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  /* TODO: POST /contacts/:id/notes */
                }}
              >
                <StickyNote className="size-4" />
                Add note
              </Button>
            }
          >
            <ActivityTimeline
              entries={activity}
              emptyDescription="Conversations, campaign events and notes for this contact will appear here."
            />
          </DrawerSection>

          <DrawerSection title="Profile">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                /* TODO: route to /dashboard/contacts/[id] once it exists. */
              }}
            >
              <ExternalLink className="size-4" />
              View full profile
            </Button>
            <p className="mt-2 text-[11px] text-text-muted">
              Last contacted{" "}
              {contact.lastContactedAt
                ? formatRelativeTime(contact.lastContactedAt)
                : "never"}
              {" · "}
              {PIPELINE_STAGES.length} pipeline stages available
            </p>
          </DrawerSection>
        </div>
      ) : null}
    </Drawer>
  );
}
