import {
  CheckCheck,
  Clock,
  FileText,
  MoreVertical,
  Paperclip,
  Send,
  Smile,
  UserCheck,
  UserPlus,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Message = {
  from: "customer" | "business";
  body: string;
  time: string;
  /** Business messages carry a read receipt. */
  read?: boolean;
};

const CONVERSATION: Message[] = [
  {
    from: "customer",
    body: "Hi, I'm interested in your premium package.",
    time: "10:24",
  },
  {
    from: "business",
    body: "Hi Sarah 👋 Thanks for reaching out! Here's everything you need to know about our premium package.",
    time: "10:24",
    read: true,
  },
];

type WorkflowStep = {
  label: string;
  detail: string;
  icon: LucideIcon;
};

const WORKFLOW: WorkflowStep[] = [
  { label: "New Lead", detail: "Trigger", icon: UserPlus },
  { label: "Welcome Message", detail: "Sent instantly", icon: Zap },
  { label: "Wait 1 Day", detail: "Delay", icon: Clock },
  { label: "Follow-up", detail: "Template · Premium", icon: Send },
  { label: "Assign to Agent", detail: "Sales team", icon: UserCheck },
];

type Metric = {
  label: string;
  value: string;
  /** Width of the progress hairline under the figure. */
  progress: string;
};

const METRICS: Metric[] = [
  { label: "Messages Sent", value: "12,480", progress: "88%" },
  { label: "Delivered", value: "98.4%", progress: "98%" },
  { label: "Replies", value: "2,840", progress: "42%" },
];

function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("bg-surface", className)}>{children}</div>;
}

export function WhatsAppPreview() {
  return (
    <div
      role="img"
      aria-label="MarketFlow WhatsApp workspace: a customer conversation with an automated reply, a five-step automation from new lead to agent assignment, and delivery metrics."
      className="relative overflow-hidden rounded-card border border-border bg-surface shadow-card-hover"
    >
      {/* Window chrome */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
        </div>
        <p className="text-xs font-semibold text-text-primary">
          WhatsApp workspace
        </p>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary-dark">
          <span className="relative flex size-1.5" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-secondary" />
          </span>
          Live
        </span>
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Conversation */}
        <Panel className="flex flex-col">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <span className="relative">
              <span className="grid size-9 place-items-center rounded-full bg-surface-secondary text-[11px] font-semibold text-text-secondary">
                SM
              </span>
              <span
                aria-hidden
                className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-secondary ring-2 ring-surface"
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-text-primary">
                Sarah Mitchell
              </span>
              <span className="block text-[11px] text-text-muted">
                Online · Premium enquiry
              </span>
            </span>
            <MoreVertical
              className="size-4 shrink-0 text-text-muted"
              aria-hidden
            />
          </div>

          <div className="flex-1 space-y-3 px-4 py-4">
            {CONVERSATION.map((message, index) => {
              const business = message.from === "business";
              return (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    business ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-panel px-3 py-2",
                      business
                        ? "rounded-br-sm bg-primary-soft text-text-primary"
                        : "rounded-bl-sm bg-surface-secondary text-text-primary",
                    )}
                  >
                    <p className="text-xs leading-relaxed">{message.body}</p>
                    <p
                      className={cn(
                        "mt-1 flex items-center gap-1 text-[10px] text-text-muted",
                        business && "justify-end",
                      )}
                    >
                      {message.time}
                      {message.read ? (
                        <CheckCheck
                          className="size-3 text-accent"
                          aria-hidden
                        />
                      ) : null}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Automated attachment */}
            <div className="flex justify-end">
              <div className="flex w-[85%] items-center gap-2.5 rounded-panel border border-primary-border bg-primary-soft px-3 py-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-btn bg-surface text-primary">
                  <FileText className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-text-primary">
                    Product Brochure
                  </span>
                  <span className="block text-[10px] text-text-muted">
                    PDF · 2.4 MB
                  </span>
                </span>
                <span className="text-[11px] font-semibold whitespace-nowrap text-primary">
                  Open →
                </span>
              </div>
            </div>
          </div>

          {/* Composer */}
          <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
            <Smile className="size-4 shrink-0 text-text-muted" aria-hidden />
            <Paperclip
              className="size-4 shrink-0 text-text-muted"
              aria-hidden
            />
            <span className="flex-1 truncate rounded-full bg-surface-secondary px-3 py-1.5 text-[11px] text-text-muted">
              Type a message
            </span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-white">
              <Send className="size-3.5" aria-hidden />
            </span>
          </div>
        </Panel>

        {/* 
        
        Automation */}
        <Panel className="flex flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-secondary"
              />
              <span className="text-xs font-semibold text-text-primary">
                Automation Active
              </span>
            </span>
            <span className="text-[11px] text-text-muted">Premium flow</span>
          </div>

          <ol className="flex-1 space-y-0 px-4 py-4">
            {WORKFLOW.map((step, index) => (
              <li
                key={step.label}
                className="relative flex gap-3 pb-5 last:pb-0"
              >
                {index < WORKFLOW.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute top-9 left-3.75 h-[calc(100%-2.25rem)] w-px bg-border"
                  />
                ) : null}
                <span className="relative grid size-8 shrink-0 place-items-center rounded-full border border-primary-border bg-primary-soft text-primary">
                  <step.icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 pt-1">
                  <span className="block truncate text-sm leading-tight font-semibold text-text-primary">
                    {step.label}
                  </span>
                  <span className="mt-0.5 block truncate text-xs leading-tight text-text-muted">
                    {step.detail}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-3 gap-px border-t border-border bg-border">
        {METRICS.map((metric) => (
          <div key={metric.label} className="bg-surface px-4 py-3.5">
            <p className="truncate text-[11px] font-medium tracking-[0.06em] text-text-muted uppercase">
              {metric.label}
            </p>
            <p className="mt-1 text-lg font-bold tracking-tight text-text-primary tabular-nums">
              {metric.value}
            </p>
            <span
              aria-hidden
              className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-surface-secondary"
            >
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: metric.progress }}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
