import { MessageCircle, Reply } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_ROUTES } from "@/constants";
import { cn, initials } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

const STATS = [
  { label: "Unread", value: 12, tone: "bg-primary" },
  { label: "Awaiting Reply", value: 8, tone: "bg-warning" },
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
    preview: "Is this product available?",
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
];

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

function Avatar({ name, online }: { name: string; online: boolean }) {
  const [first, last] = name.split(" ");

  return (
    <span className="relative shrink-0">
      <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-dark">
        {initials(first, last)}
      </span>
      {online ? (
        <span
          className="absolute right-0 bottom-0 size-2.5 rounded-full bg-secondary ring-2 ring-surface"
          aria-label="Online"
          role="img"
        />
      ) : null}
    </span>
  );
}

export function WhatsAppInbox({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base">
          <span className="grid size-7 place-items-center rounded-btn bg-primary-soft text-primary">
            <MessageCircle className="size-4" aria-hidden />
          </span>
          WhatsApp Inbox
        </h2>

        <ButtonLink
          href={APP_ROUTES.whatsapp}
          variant="ghost"
          size="sm"
          className="shrink-0"
        >
          Open Inbox
        </ButtonLink>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-panel bg-surface-secondary px-3 py-2.5"
          >
            <dt className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted">
              <span aria-hidden className={cn("size-1.5 rounded-full", stat.tone)} />
              {stat.label}
            </dt>
            <dd className="mt-1 text-lg leading-none font-bold text-text-primary">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <ul className="mt-4 divide-y divide-border border-t border-border">
        {CONVERSATIONS.map((conversation) => (
          <li
            key={conversation.name}
            className="group flex items-center gap-3 py-3 transition-colors"
          >
            <Avatar name={conversation.name} online={conversation.online} />

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
                <span className="shrink-0 text-[11px] text-text-muted">
                  {conversation.time}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[13px] text-text-secondary">
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

            <ButtonLink
              href={APP_ROUTES.whatsapp}
              variant="outline"
              size="sm"
              aria-label={`Reply to ${conversation.name}`}
              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 max-lg:opacity-100"
            >
              <Reply aria-hidden />
            </ButtonLink>
          </li>
        ))}
      </ul>
    </Card>
  );
}
