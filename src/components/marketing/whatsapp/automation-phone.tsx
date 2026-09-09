import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Paperclip,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ART_HOVER, CONVERSATION } from "./automation-data";

/**
 * The customer's side of the story, as a handset.
 *
 * Widths are set rather than the height, because the 9:19.5 screen derives the
 * rest: 248px wide is a 537px phone below `lg`, where the badges orbit it; 208
 * and 224 are 451 and 485 at `lg` and `xl`, where the automation column stands
 * beside it instead.
 *
 * The frame is three nested rings: a graphite edge caught by the light along
 * its top rail, a near-black body, and the screen inset inside that.
 */
export function AutomationPhone({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-62 shrink-0 lg:w-52 xl:w-56", className)}>
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-6 left-1/2 -z-10 h-9 w-[72%] -translate-x-1/2 rounded-[50%] bg-[#1e1b4b]/45 blur-2xl"
      />

      <div
        className={cn(
          "relative rounded-[2.3rem] bg-linear-to-b from-[#454f61] via-[#151b24] to-[#39424f] p-[3px]",
          "shadow-[0_32px_70px_rgba(30,27,75,0.30),0_12px_30px_rgba(15,23,42,0.20)]",
          ART_HOVER,
          "group-hover/art:shadow-[0_38px_82px_rgba(30,27,75,0.38),0_16px_36px_rgba(15,23,42,0.26)]",
        )}
      >
        <div className="rounded-[2.2rem] bg-[#0a0e15] p-[5px]">
          <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.9rem] bg-surface">
            <PhoneScreen />
          </div>
        </div>

        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[2.3rem] bg-linear-to-b from-white/25 via-transparent to-white/8"
        />
      </div>
    </div>
  );
}

/**
 * The thread.
 *
 * Built to the conventions a messaging app is recognised by rather than copied
 * from one: a white header over a warm chat ground, a dated thread, a plain
 * incoming bubble against a green outgoing one, receipts on what was sent, and
 * a composer under it all. That set is what makes a reader clock this as a
 * conversation before they read a word of it.
 *
 * The messages stack up from the composer because a real thread is scrolled to
 * its end — which is also what stops a 19.5:9 screen from reading as a
 * half-empty panel.
 */
function PhoneScreen() {
  return (
    <div className="flex h-full flex-col bg-chat-ground">
      {/* Status bar, with the island floating over it. */}
      <div className="relative flex h-9 shrink-0 items-center justify-between bg-surface px-3.5">
        <span className="text-[9px] font-bold text-text-primary">9:41</span>
        <span className="flex items-end gap-px text-text-primary" aria-hidden>
          <span className="h-1 w-0.5 bg-current" />
          <span className="h-1.5 w-0.5 bg-current" />
          <span className="h-2 w-0.5 bg-current" />
        </span>
        <span
          aria-hidden
          className="absolute top-1.5 left-1/2 h-5 w-14 -translate-x-1/2 rounded-full bg-[#0a0e15]"
        />
      </div>

      {/* Contact header */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-border bg-surface px-2 pb-2">
        <ChevronLeft
          className="size-3.5 shrink-0 text-text-muted"
          strokeWidth={2.5}
          aria-hidden
        />
        <span className="relative shrink-0">
          <span className="grid size-7 place-items-center rounded-full bg-whatsapp-soft text-[9px] font-bold text-whatsapp-dark">
            SM
          </span>
          <span
            aria-hidden
            className="absolute -right-px -bottom-px size-2 rounded-full bg-whatsapp-bright ring-2 ring-surface"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] leading-tight font-semibold text-text-primary">
            {CONVERSATION.name}
          </span>
          <span className="block text-[9px] leading-tight font-medium text-whatsapp">
            {CONVERSATION.presence}
          </span>
        </span>
        <MoreVertical
          className="size-3.5 shrink-0 text-text-muted"
          aria-hidden
        />
      </div>

      {/* Thread */}
      <div className="flex flex-1 flex-col justify-end gap-1.5 px-2.5 pt-3 pb-2">
        <span className="mx-auto mb-1 rounded-full bg-black/6 px-2 py-0.5 text-[8px] leading-none font-semibold tracking-[0.08em] text-text-muted uppercase">
          Today
        </span>

        {/* Incoming */}
        <span className="max-w-[86%] self-start rounded-[11px] rounded-bl-[3px] bg-surface px-2.5 py-1.5 shadow-[0_1px_1px_rgba(15,23,42,0.06)]">
          <span className="block text-[11px] leading-[1.45] text-text-primary">
            {CONVERSATION.inbound}
          </span>
          <span className="mt-0.5 block text-right text-[8px] leading-none text-text-muted">
            {CONVERSATION.time}
          </span>
        </span>

        {/* Outgoing */}
        <span className="max-w-[88%] self-end rounded-[11px] rounded-br-[3px] bg-chat-outgoing px-2.5 py-1.5 shadow-[0_1px_1px_rgba(15,23,42,0.06)]">
          <span className="block text-[11px] leading-[1.45] text-text-primary">
            {CONVERSATION.reply}
          </span>
          <span className="mt-0.5 flex items-center justify-end gap-1 text-[8px] leading-none text-text-muted">
            {CONVERSATION.time}
            <CheckCheck className="size-2.5 text-info" aria-hidden />
          </span>
        </span>

        {/* The action the automated reply attached. */}
        <span className="flex w-[88%] items-center gap-2 self-end rounded-[11px] rounded-br-[3px] border border-border bg-surface p-1.5 shadow-[0_1px_1px_rgba(15,23,42,0.06)]">
          <span className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-primary-soft text-primary">
            <Sparkles className="size-3.5" strokeWidth={1.8} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[10px] leading-tight font-semibold text-text-primary">
              Premium Plan
            </span>
            <span className="mt-0.5 flex items-center gap-0.5 text-[9px] leading-none font-medium text-primary">
              View details
              <ChevronRight
                className="size-2.5"
                strokeWidth={2.5}
                aria-hidden
              />
            </span>
          </span>
        </span>

        <span className="flex items-center justify-end gap-1 pr-0.5 text-[8px] leading-none text-text-muted">
          <Zap
            className="animate-soft-pulse size-2.5 text-primary"
            strokeWidth={2}
            aria-hidden
          />
          Auto-replied in 0.8s
        </span>
      </div>

      {/* Composer */}
      <div className="flex shrink-0 items-center gap-1.5 bg-surface px-2 py-1.5">
        <span className="flex flex-1 items-center gap-1.5 rounded-full bg-surface-secondary px-2 py-1.5">
          <span className="flex-1 truncate text-[9px] leading-none text-text-muted">
            Message
          </span>
          <Paperclip
            className="size-3 shrink-0 text-text-muted"
            strokeWidth={2}
            aria-hidden
          />
        </span>
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-whatsapp text-white">
          <Send className="size-3" strokeWidth={2} aria-hidden />
        </span>
      </div>
    </div>
  );
}
