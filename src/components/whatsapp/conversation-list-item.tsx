import { Badge } from "@/components/ui/badge";
import { cn, initials, truncate } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import type { WhatsAppConversation } from "@/types/whatsapp";

export function ConversationListItem({
  conversation,
  active = false,
  onSelect,
}: {
  conversation: WhatsAppConversation;
  active?: boolean;
  onSelect?: (id: string) => void;
}) {
  const [first, last] = conversation.displayName.split(" ");

  return (
    <button
      type="button"
      onClick={() => onSelect?.(conversation.id)}
      className={cn(
        "relative flex w-full items-start gap-3 rounded-btn px-3 py-3 text-left transition-all",
        "before:absolute before:left-0 before:top-1/2 before:h-8 before:w-0.5 before:-translate-y-1/2 before:rounded-r-full before:bg-primary before:transition-opacity",
        active
          ? "bg-primary-soft before:opacity-100"
          : "before:opacity-0 hover:bg-primary-subtle",
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-secondary text-xs font-semibold text-text-secondary">
        {initials(first, last)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-text-primary">{conversation.displayName}</span>
          {conversation.lastMessageAt ? (
            <span className="shrink-0 text-xs text-text-muted">
              {formatRelativeTime(conversation.lastMessageAt)}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-text-muted">
            {truncate(conversation.lastMessagePreview ?? "No messages yet", 40)}
          </span>
          {conversation.unreadCount > 0 ? (
            <Badge tone="brand" className="px-1.5">{conversation.unreadCount}</Badge>
          ) : null}
        </span>
      </span>
    </button>
  );
}
