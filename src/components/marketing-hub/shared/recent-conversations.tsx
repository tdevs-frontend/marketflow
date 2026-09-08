import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format";
import { cn, truncate } from "@/lib/utils";
import type { Conversation, ConversationStatus } from "@/types/marketing";

const STATUS_TONES: Record<ConversationStatus, BadgeTone> = {
  open: "success",
  pending: "warning",
  resolved: "neutral",
};

/**
 * Latest inbox threads, for the overview pages.
 *
 * Shows the newest message rather than the first, and whose it was — an
 * inbound message with nothing after it is a thread waiting on you, which is
 * the only reason this panel is on a dashboard at all.
 */
export function RecentConversations({
  conversations,
  hrefBase,
}: {
  conversations: Conversation[];
  /**
   * The inbox route. The thread is appended as `?conversation=`, which is the
   * param the inbox page actually reads — see `whatsapp/inbox/page.tsx`.
   */
  hrefBase: string;
}) {
  return (
    <ul className="divide-y divide-border">
      {conversations.map((conversation) => {
        const last = conversation.messages.at(-1);
        const waiting = last?.direction === "inbound";

        return (
          <li key={conversation.id}>
            <Link
              href={`${hrefBase}?conversation=${conversation.id}`}
              className="flex items-start gap-3 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-surface-secondary/60 focus-visible:shadow-focus focus-visible:outline-none"
            >
              <div className="relative shrink-0">
                <Avatar name={conversation.contact.name} size="sm" />
                {conversation.online ? (
                  /* Ringed in the card's own white so the dot reads as a badge
                     on the avatar rather than a hole punched through it. */
                  <span
                    aria-label="Online"
                    className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-primary-light ring-2 ring-surface"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-[13px] font-medium text-text-primary">
                    {conversation.contact.name}
                  </p>
                  <time
                    dateTime={conversation.contact.lastActivityAt}
                    className="shrink-0 text-[11px] text-text-muted"
                  >
                    {formatRelativeTime(conversation.contact.lastActivityAt)}
                  </time>
                </div>

                <p
                  className={cn(
                    "mt-0.5 truncate text-xs",
                    waiting ? "font-medium text-text-secondary" : "text-text-muted",
                  )}
                >
                  {waiting ? "" : "You: "}
                  {truncate(last?.body ?? "No messages yet", 64)}
                </p>

                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge tone={STATUS_TONES[conversation.status]}>
                    {conversation.status}
                  </Badge>
                  {conversation.unread > 0 ? (
                    <span className="grid size-4.5 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
                      {conversation.unread}
                    </span>
                  ) : null}
                  {conversation.contact.assignedAgent ? (
                    <span className="truncate text-[11px] text-text-muted">
                      {conversation.contact.assignedAgent}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
