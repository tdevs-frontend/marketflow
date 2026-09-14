import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { APP_ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

const STATS = [
  { label: "Unread", value: 12, tone: "bg-primary" },
  /* "Awaiting Reply" truncated in the middle tile below ~1500px — three tiles
     across a five-column card leaves roughly 90px of text width. */
  { label: "Awaiting", value: 8, tone: "bg-warning" },
  { label: "Assigned", value: 4, tone: "bg-border-strong" },
] as const;

interface Conversation {
  name: string;
  preview: string;
  time: string;
  unread: boolean;
  online: boolean;
}

const CONVERSATIONS: Conversation[] = [
  {
    name: "Sarah Ahmed",
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
    name: "Maria",
    preview: "Can you send me the catalog?",
    time: "15 min ago",
    unread: false,
    online: true,
  },
  {
    name: "David Chen",
    preview: "Thanks — order received.",
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
 * primitive — every other avatar in the product is a plain initials chip.
 */
function ConversationAvatar({ name, online }: { name: string; online: boolean }) {
  return (
    <span className="relative shrink-0">
      <Avatar name={name} tone="bg-primary-soft text-primary-dark" />
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
            <span className="grid size-7 shrink-0 place-items-center rounded-btn bg-whatsapp-soft text-whatsapp">
              <MessageCircle className="size-4" aria-hidden />
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
        <ul className="mt-4 flex-1 divide-y divide-border border-t border-border">
          {CONVERSATIONS.map((conversation) => (
            <li key={conversation.name}>
              <Link
                href={APP_ROUTES.whatsappInbox}
                className="-mx-2 flex items-center gap-3 rounded-panel px-2 py-3 transition-colors hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none"
              >
                <ConversationAvatar
                  name={conversation.name}
                  online={conversation.online}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-sm text-text-primary",
                        conversation.unread ? "font-bold" : "font-medium",
                      )}
                    >
                      {conversation.name}
                    </p>
                    <span className="shrink-0 text-meta text-text-secondary">
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
                    className="size-2 shrink-0 rounded-full bg-primary"
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
