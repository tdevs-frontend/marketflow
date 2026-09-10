"use client";

import { AvatarLabel } from "@/components/ui/avatar";
import { Drawer } from "@/components/ui/dialog";
import {
  activityForContact,
  contactById,
  contactName,
  type CustomerJourney,
} from "@/lib/customer-fixtures";
import { formatDate } from "@/lib/format";
import { ActivityTimeline, DrawerFact, DrawerSection } from "./activity-timeline";
import { LifecycleBadge, SourceBadge, TagBadge } from "./customer-badges";

/**
 * One person's journey, oldest first.
 *
 * The order is the one thing that differs from every other timeline in this
 * module: the contact and lead drawers answer "what just happened", so they
 * run newest first, while this one answers "how did they get here" and has to
 * run forwards. Same `ActivityTimeline`, reversed input — not a second
 * component, because the rows and their icons must stay identical.
 */
export function JourneyDrawer({
  journey,
  onClose,
}: {
  journey: CustomerJourney | null;
  onClose: () => void;
}) {
  const contact = journey ? contactById(journey.contactId) : undefined;
  /* `activityForContact` sorts newest first; a journey reads forwards. */
  const timeline = journey ? [...activityForContact(journey.contactId)].reverse() : [];

  return (
    <Drawer
      open={Boolean(journey)}
      onClose={onClose}
      title={contact ? contactName(contact) : "Journey"}
      description={contact?.company ?? undefined}
    >
      {journey && contact ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <AvatarLabel
              name={contactName(contact)}
              secondary={contact.email ?? contact.phone ?? undefined}
              size="lg"
            />
            <LifecycleBadge lifecycle={contact.lifecycle} />
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-panel bg-surface-secondary p-3.5">
            <DrawerFact label="First seen" value={formatDate(journey.firstSeenAt)} />
            <DrawerFact label="Current stage" value={journey.stage} strong />
            <DrawerFact
              label="Entry source"
              value={<SourceBadge source={journey.entrySource} />}
            />
            <DrawerFact
              label="Journey length"
              value={`${journey.durationDays} days`}
              strong
            />
            <DrawerFact
              label="Touchpoints"
              value={String(journey.touchpoints)}
              strong
            />
            <DrawerFact
              label="Last activity"
              value={formatDate(journey.lastActivityAt)}
            />
          </dl>

          {contact.tags.length ? (
            <DrawerSection title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((tag) => (
                  <TagBadge key={tag} name={tag} />
                ))}
              </div>
            </DrawerSection>
          ) : null}

          <DrawerSection title="Journey timeline">
            <ActivityTimeline
              entries={timeline}
              emptyTitle="No touchpoints recorded"
              emptyDescription="This contact has not interacted with a channel or campaign yet."
            />
          </DrawerSection>
        </div>
      ) : null}
    </Drawer>
  );
}
