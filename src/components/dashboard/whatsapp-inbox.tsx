import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { BrandIcon } from "@/components/ui/brand-icon";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { APP_ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

const STATS = [
  /* Green, and the same green as the unread dot on a row below. Unread is the
     one count that maps onto something the reader can point at in the list. */
  { label: "Unread", value: 12, tone: "bg-whatsapp" },
  /* "Awaiting Reply" truncated in the middle tile below ~1500px - three tiles
     across a five-column card leaves roughly 90px of text width. */
  { label: "Awaiting", value: 8, tone: "bg-warning" },
  { label: "Assigned", value: 4, tone: "bg-border-strong" },
] as const;

interface Conversation {
  name: string;
  /** The contact's photo. Absent contacts fall back to their initials. */
  avatarUrl?: string;
  preview: string;
  time: string;
  unread: boolean;
  online: boolean;
}

/**
 * Placeholder queue - swap for `useGetInboxQuery()` once the API is live.
 *
 * Two of the four carry a photo and two do not, which is the real shape of a
 * CRM contact list: WhatsApp supplies a profile picture only when the contact
 * has one set and has not hidden it. A fixture where everyone has a photo hides
 * the fallback until it appears in production.
 */
const CONVERSATIONS: Conversation[] = [
  {
    name: "Sarah Ahmed",
    avatarUrl: "/customer-avatar-1.jpg",
    preview: "Is the Premium Package available?",
    time: "2 min ago",
    unread: true,
    online: true,
  },
  {
    name: "John Smith",
    preview: "I want to know the price.",
    time: "8 min ago",
    unread: true,
    online: false,
  },
  {
    name: "Maria Gomez",
    preview: "Can you send me the catalog?",
    time: "15 min ago",
    unread: false,
    online: true,
  },
  {
    name: "David Chen",
    avatarUrl: "/customer-avatar-4.jpg",
    preview: "Thanks - order received.",
    time: "24 min ago",
    unread: false,
    online: false,
  },
];

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The shared `Avatar` plus a presence dot.
 *
 * The dot needs a positioned wrapper and the avatar itself has no business
 * knowing about online state, so it is composed here rather than added to the
 * primitive.
 *
 * The chip is bordered rather than bare. A soft indigo circle on a white card
 * has almost nothing holding its edge, and the row's grey hover state was
 * swallowing it outright; the border is the same soft-fill-plus-matching-edge
 * the KPI tiles use, so a photo and an initials chip occupy the same visible
 * shape instead of one reading as a picture and the other as a tint.
 */
function ConversationAvatar({
  name,
  avatarUrl,
  online,
}: {
  name: string;
  avatarUrl?: string;
  online: boolean;
}) {
  return (
    <span className="relative shrink-0">
      <Avatar
        name={name}
        src={avatarUrl}
        tone="border border-primary-border bg-primary-soft text-primary-dark"
      />
      {online ? (
        <span
          className="absolute right-0 bottom-0 size-2.5 rounded-full bg-whatsapp ring-2 ring-surface"
          aria-label="Online"
          role="img"
        />
      ) : null}
    </span>
  );
}

/**
 * The inbox, as a queue rather than a report.
 *
 * The three counts at the top are the state of the queue; the rows under them
 * are the front of it. Each row is a link rather than a row with a reply button
 * beside it: the button only ever went to the same place the row describes, and
 * a 40px target per row beats a 32px one at the end of it.
 */
export function WhatsAppInbox({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base">
            {/* The real mark, not a generic speech bubble: `BrandIcon` already
                carries the WhatsApp glyph for the Integrations tiles, and a
                card titled "WhatsApp Inbox" is the one place a lucide chat
                bubble reads as a placeholder for the logo that should be
                there. Bordered to match the KPI tiles' soft-fill treatment. */}
            <span className="grid size-7 shrink-0 place-items-center rounded-btn border border-whatsapp-border bg-whatsapp-soft text-whatsapp">
              <BrandIcon name="whatsapp" className="size-4" />
            </span>
            WhatsApp Inbox
          </h2>
          <p className="mt-1 text-sm text-text-secondary font-medium">
            Conversations waiting on a reply.
          </p>
        </div>

        <ButtonLink
          href={APP_ROUTES.whatsappInbox}
          variant="ghost"
          size="sm"
          className="shrink-0"
        >
          Open Inbox
        </ButtonLink>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-2">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-panel bg-surface-secondary px-3.5 py-2.5"
          >
            <dt className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
              <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", stat.tone)} />
              <span className="truncate">{stat.label}</span>
            </dt>
            <dd className="mt-1.5 text-xl leading-none font-bold text-text-primary tabular-nums">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {CONVERSATIONS.length === 0 ? (
        <div className="mt-5 flex-1">
          <EmptyState
            compact
            title="No conversations yet"
            description="Connect WhatsApp Business and incoming messages will land here."
            action={
              <ButtonLink href={APP_ROUTES.whatsappOverview} size="sm">
                Connect WhatsApp
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <ul className="mt-4 flex-1 border-t border-border">
          {/*
            The rule under each row belongs to the row, not to the list.

            `divide-y` draws a line *between* children, so the last row had
            nothing under it and the list stopped mid-air. `border-b` on the
            `ul` could not fix that either: it is `flex-1`, so it stretches to
            the bottom of the card and its own bottom rule would float well
            below the last conversation. Hanging the rule off each `li` closes
            the list directly under the final row at any card height.
          */}
          {CONVERSATIONS.map((conversation) => (
            <li key={conversation.name} className="border-b border-border">
              {/*
                No negative inset. The row used to be `-mx-2 px-2`, which pushed
                the hover fill 8px past each end of the rules above and below
                it, so hovering produced a grey band visibly wider than the list
                it belonged to. Flush with the rules, the hover reads as the row
                highlighting rather than as a chip floating over it, and the
                avatar lines up with the header and the stat tiles above.
              */}
              <Link
                href={APP_ROUTES.whatsappInbox}
                className="flex items-center gap-3 py-3 transition-colors hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none"
              >
                <ConversationAvatar
                  name={conversation.name}
                  avatarUrl={conversation.avatarUrl}
                  online={conversation.online}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    {/* Semibold when read, bold when not. The name is the row's
                        subject and used to sit at the same weight as the
                        message under it, which left the two lines competing. */}
                    <p
                      className={cn(
                        "truncate text-sm text-text-primary",
                        conversation.unread ? "font-bold" : "font-semibold",
                      )}
                    >
                      {conversation.name}
                    </p>
                    {/* Muted and tabular: the timestamp is the least important
                        thing in the row, and at `text-secondary` it was
                        pulling as hard as the message. Lining figures stop
                        "2 min ago" and "24 min ago" shifting the column. */}
                    <span className="shrink-0 text-meta text-text-muted tabular-nums">
                      {conversation.time}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-text-secondary">
                    {conversation.preview}
                  </p>
                </div>

                {conversation.unread ? (
                  <span
                    aria-label="Unread"
                    role="img"
                    className="size-2.5 shrink-0 rounded-full bg-whatsapp"
                  />
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
