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
 *
 * Laid out as an inbox row, because that is what it is: avatar, then the thread
 * (who, what they said, where it stands), then the right rail holding the two
 * things you scan a list of threads *for* — how long it has been waiting, and
 * whether anything is unread. Those two stack on the right rather than sitting
 * inline, so the eye can run down a single column of times instead of finding
 * each one at the end of a different-length name.
 *
 * Three lines per row, in falling weight: the name is the anchor, the message
 * is the content, the status strip is metadata. An unanswered thread earns
 * fuller ink on its message — the whole panel exists to surface those.
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
    /*
     * The list is pulled out by its own row padding, so every row can be padded
     * on all four sides and still sit where an unpadded list would.
     *
     * The two things this fixes were one mistake. Trimming the first row's top
     * padding and the last row's bottom left those rows' hover grounds shorter
     * than the rows themselves — hovering the top of the first row lit nothing.
     * And insetting only the anchor horizontally made the ground wider than the
     * `divide-y` lines, which are drawn on the list items, so the highlight
     * overhung the dividers by 8px a side.
     *
     * With the bleed on the list instead, the ground and the divider are the
     * same box: they cannot disagree. Padding is uniform `p-3`, so the gap
     * around the text is even on all four sides, and the negative margin gives
     * that padding back — the first name still starts exactly where the card
     * body starts.
     */
    <ul className="-m-3 divide-y divide-border">
      {conversations.map((conversation) => {
        const last = conversation.messages.at(-1);
        const waiting = last?.direction === "inbound";
        const unread = conversation.unread > 0;

        return (
          <li key={conversation.id}>
            <Link
              href={`${hrefBase}?conversation=${conversation.id}`}
              className="flex items-start gap-3 p-3 transition-colors hover:bg-surface-secondary/70 focus-visible:shadow-focus focus-visible:outline-none"
            >
              <div className="relative shrink-0">
                <Avatar name={conversation.contact.name} />
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
                <p className="truncate text-sm font-semibold text-text-primary">
                  {conversation.contact.name}
                </p>

                <p
                  className={cn(
                    "mt-1 truncate text-sm",
                    waiting
                      ? "font-medium text-text-primary/80"
                      : "text-text-secondary",
                  )}
                >
                  {waiting ? "" : "You: "}
                  {truncate(last?.body ?? "No messages yet", 64)}
                </p>

                <div className="mt-2 flex min-w-0 items-center gap-2">
                  <Badge
                    tone={STATUS_TONES[conversation.status]}
                    size="sm"
                    className="shrink-0"
                  >
                    {conversation.status}
                  </Badge>
                  {conversation.contact.assignedAgent ? (
                    <span className="flex min-w-0 items-center gap-2 text-sm text-text-secondary">
                      <span aria-hidden className="text-text-muted">
                        ·
                      </span>
                      <span className="truncate">
                        {conversation.contact.assignedAgent}
                      </span>
                    </span>
                  ) : null}
                </div>
              </div>

              {/* One column, so five rows give one column of times to scan. */}
              <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
                <time
                  dateTime={conversation.contact.lastActivityAt}
                  className={cn(
                    "text-sm whitespace-nowrap tabular-nums",
                    unread ? "font-medium text-text-secondary" : "text-text-muted",
                  )}
                >
                  {formatRelativeTime(conversation.contact.lastActivityAt)}
                </time>

                {unread ? (
                  /* A counted pill rather than a dot: "3" is the difference
                     between a thread to glance at and one to open now. Sized
                     from its own text so a two-digit count stays a lozenge
                     instead of squeezing. */
                  <span
                    aria-label={`${conversation.unread} unread`}
                    className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs leading-none font-bold text-white tabular-nums"
                  >
                    {conversation.unread}
                  </span>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
