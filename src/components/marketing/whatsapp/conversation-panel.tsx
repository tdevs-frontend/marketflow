import {
  CheckCheck,
  ChevronRight,
  MoreHorizontal,
  Search,
  Send,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { CONVERSATION, WORKSPACE_THREADS } from "./automation-data";

/**
 * The inbox column: who is waiting, and who is open.
 *
 * The first panel dropped when the monitor gets small — it is the only one in
 * the workspace whose job is already implied by the panel beside it.
 */
export function ConversationList() {
  return (
    <div
      aria-hidden
      className="hidden w-30.5 shrink-0 flex-col border-r border-border bg-surface @[520px]:flex @[620px]:w-35"
    >
      <div className="flex items-center justify-between px-2 pt-2.5 pb-1.5">
        <span className="text-[9px] leading-none font-bold tracking-tight text-text-primary">
          Conversations
        </span>
        <span className="rounded-full bg-surface-secondary px-1 py-px text-[7px] leading-none font-semibold text-text-muted">
          12
        </span>
      </div>

      <div className="mx-2 mb-1.5 flex items-center gap-1 rounded-md bg-surface-secondary px-1.5 py-1">
        <Search className="size-2 shrink-0 text-text-muted" strokeWidth={2.2} />
        <span className="text-[7px] leading-none text-text-muted">Search</span>
      </div>

      <div className="flex flex-col">
        {WORKSPACE_THREADS.map((thread) => (
          <span
            key={thread.name}
            className={cn(
              "flex items-center gap-1.5 border-l-2 px-2 py-1.5",
              thread.active
                ? "border-primary bg-primary-soft/60"
                : "border-transparent",
            )}
          >
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-whatsapp-soft text-[7px] leading-none font-bold text-whatsapp-dark">
              {thread.initials}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[8px] leading-tight font-semibold text-text-primary">
                {thread.name}
              </span>
              <span className="block truncate text-[7px] leading-tight text-text-muted">
                {thread.preview}
              </span>
            </span>

            <span className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="text-[6px] leading-none text-text-muted">
                {thread.time}
              </span>
              {thread.unread ? (
                <span className="grid size-2.5 place-items-center rounded-full bg-whatsapp-brand text-[6px] leading-none font-bold text-white">
                  {thread.unread}
                </span>
              ) : null}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * The open thread: MarketFlow's WhatsApp inbox, not WhatsApp Web.
 *
 * The messaging conventions are honoured — warm thread ground, tinted outgoing
 * bubble, double ticks — because a reader clocks a chat as a chat from those
 * before reading a word of it. Everything around them is the product: a SaaS
 * header above, a composer below, and the automated reply labelled with what
 * sent it, which is the difference between this and a WhatsApp screenshot.
 */
export function ConversationPanel() {
  return (
    <div aria-hidden className="flex min-w-0 flex-1 flex-col bg-chat-ground">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-border bg-surface px-2 py-1.5 @[440px]:gap-2 @[440px]:px-2.5 @[440px]:py-2">
        <span className="relative shrink-0">
          <span className="grid size-5 place-items-center rounded-full bg-whatsapp-soft text-[7px] leading-none font-bold text-whatsapp-dark @[440px]:size-6 @[440px]:text-[8px]">
            {CONVERSATION.initials}
          </span>
          <span className="absolute -right-px -bottom-px size-1.5 rounded-full bg-whatsapp-brand ring-2 ring-surface @[440px]:size-2" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[9px] leading-tight font-bold tracking-tight text-text-primary @[440px]:text-[10px]">
            {CONVERSATION.name}
          </span>
          <span className="flex items-center gap-1 text-[7px] leading-tight font-medium text-whatsapp @[440px]:text-[8px]">
            <span className="size-1 rounded-full bg-whatsapp-brand" />
            {CONVERSATION.presence}
          </span>
        </span>

        <MoreHorizontal className="size-3 shrink-0 text-text-muted" />
      </div>

      {/* Thread */}
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-1 px-2 pt-2 pb-1.5 @[440px]:gap-1.5 @[440px]:px-3">
        <span className="mx-auto mb-0.5 rounded-full bg-black/5 px-1.5 py-0.5 text-[6px] leading-none font-semibold tracking-[0.08em] text-text-muted uppercase @[440px]:text-[7px]">
          Today
        </span>

        {/* Inbound */}
        <span className="max-w-[88%] self-start rounded-[9px] rounded-bl-[3px] bg-surface px-2 py-1 shadow-[0_1px_1px_rgba(15,23,42,0.06)]">
          <span className="block text-[8px] leading-normal text-text-primary @[440px]:text-[9.5px]">
            {CONVERSATION.inbound}
          </span>
          <span className="mt-px block text-right text-[6px] leading-none text-text-muted">
            {CONVERSATION.inboundTime}
          </span>
        </span>

        {/* Who is about to answer — the automation, named. */}
        <span className="flex items-center gap-1 self-end pr-0.5 text-[6px] leading-none font-semibold text-primary @[440px]:text-[7px]">
          <Sparkles className="size-2 @[440px]:size-2.5" strokeWidth={2.2} />
          {CONVERSATION.sender}
        </span>

        {/* The automated reply */}
        <span className="max-w-[90%] self-end rounded-[9px] rounded-br-[3px] bg-chat-outgoing px-2 py-1 shadow-[0_1px_1px_rgba(15,23,42,0.06)]">
          <span className="block text-[8px] leading-normal text-text-primary @[440px]:text-[9.5px]">
            {CONVERSATION.reply}
          </span>
          <span className="mt-px flex items-center justify-end gap-1 text-[6px] leading-none text-text-muted">
            {CONVERSATION.replyTime}
            <CheckCheck className="size-2 text-info" />
          </span>
        </span>

        {/* What that reply attached. */}
        <span className="flex w-[90%] items-center gap-1.5 self-end rounded-[9px] rounded-br-[3px] border border-border bg-surface p-1 shadow-[0_1px_1px_rgba(15,23,42,0.06)]">
          <span className="grid size-5 shrink-0 place-items-center rounded-md bg-primary-soft text-primary @[440px]:size-6">
            <Sparkles className="size-2.5 @[440px]:size-3" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[8px] leading-tight font-semibold text-text-primary @[440px]:text-[9px]">
              {CONVERSATION.attachment.title}
            </span>
            <span className="mt-px flex items-center gap-px text-[7px] leading-none font-medium text-primary @[440px]:text-[8px]">
              {CONVERSATION.attachment.action}
              <ChevronRight className="size-2" strokeWidth={2.5} />
            </span>
          </span>
        </span>
      </div>

      {/* Composer */}
      <div className="flex shrink-0 items-center gap-1.5 border-t border-border bg-surface px-2 py-1.5">
        <span className="flex-1 truncate rounded-full bg-surface-secondary px-2 py-1 text-[7px] leading-none text-text-muted @[440px]:text-[8px]">
          Type a message
        </span>
        <span className="grid size-4 shrink-0 place-items-center rounded-full bg-whatsapp text-white @[440px]:size-5">
          <Send className="size-2 @[440px]:size-2.5" strokeWidth={2.2} />
        </span>
      </div>
    </div>
  );
}
