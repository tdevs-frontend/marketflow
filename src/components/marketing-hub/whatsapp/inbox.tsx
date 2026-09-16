"use client";

import { useId, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Info,
  Mail,
  MessageSquareText,
  Paperclip,
  Phone,
  Search,
  Send,
  UserPlus,
  X,
} from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tag } from "@/components/ui/tag";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TabPanel, Tabs, type TabItem } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import {
  AGENTS,
  CONVERSATIONS,
  QUICK_REPLIES,
} from "@/lib/marketing-fixtures";
import { APP_ROUTES } from "@/constants";
import { formatRelativeTime } from "@/lib/format";
import { cn, initials } from "@/lib/utils";

/** `initials` takes two arguments, so a full name has to be split first. */
const contactInitials = (name: string) => {
  const [first, last] = name.split(" ");
  return initials(first, last);
};
import type { Conversation, InboxMessage } from "@/types/marketing";

type Scope = "all" | "unread" | "unassigned" | "mine";

/**
 * The list's scope, as tabs rather than a segmented control.
 *
 * Both were available, and they answer different questions. `SegmentedControl`
 * is chrome — the Volume/Rates switch in a chart header, read at a glance and
 * never aimed at twice. This strip is the first control in the column and it
 * decides *what the list below contains*, which is the job `Tabs` does on
 * every other list in the dashboard: Products, Sales, Customers, Segments,
 * Settings. Stretching a pill track to the panel's full width was the tell —
 * no other call site does that, because the control was never a tab bar.
 */
const SCOPE_TABS: TabItem<Scope>[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  /*
   * Unassigned is here because the Overview counts it.
   *
   * The queue panel reports "9 with no owner" and, until now, the Inbox had no
   * way to show those nine — a number on a dashboard that the tool underneath
   * it could not act on. "Assigned to me" shortens to "Mine" to buy the fourth
   * tab its width in a 320px column.
   */
  { value: "unassigned", label: "Unassigned" },
  { value: "mine", label: "Mine" },
];

/** The signed-in agent, until auth carries a real one. */
const CURRENT_AGENT = "Nadia Karim";

/**
 * Lifecycle and conversation state, as badge tones.
 *
 * Two different readings that both live in the details panel, so they are kept
 * visually apart: lifecycle is who the person *is* and sits under their name,
 * conversation state is what this thread is *doing* and sits in the tile row.
 * Brand green is spent on the two that mean "worth your attention" — a VIP, and
 * a thread still open — rather than on every chip in the sidebar.
 */
const LIFECYCLE_TONE: Record<"lead" | "customer" | "vip", BadgeTone> = {
  lead: "info",
  customer: "neutral",
  vip: "brand",
};

const STATUS_TONE: Record<"open" | "pending" | "resolved", BadgeTone> = {
  open: "brand",
  pending: "warning",
  resolved: "success",
};

function time(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

/* -------------------------------------------------------------------------- */
/* Column 1 — conversations                                                   */
/* -------------------------------------------------------------------------- */

function ConversationList({
  conversations,
  activeId,
  onSelect,
  scope,
  onScopeChange,
  search,
  onSearchChange,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  scope: Scope;
  onScopeChange: (scope: Scope) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  /* Paired with `TabPanel` below, which is what makes the strip a real
     `tablist` rather than three buttons wearing the look of one. */
  const idBase = useId();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0">
        <div className="p-4 pb-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <Input size="sm"
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search conversations…"
              aria-label="Search conversations"
              className="pl-9"
            />
          </div>
        </div>

        {/* `bleed` off: the strip sits in a column padded by 16px, not in a
            card's 20px, so the component's own −20px would push it out of
            line with the search field above it. The strip's `border-b` is
            the divider the header used to carry itself. */}
        <Tabs
          tabs={SCOPE_TABS}
          value={scope}
          onChange={onScopeChange}
          label="Filter conversations"
          idBase={idBase}
          bleed={false}
          className="no-scrollbar px-4"
        />
      </div>

      <TabPanel
        idBase={idBase}
        value={scope}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {conversations.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No conversations"
              description="Nothing matches this filter right now."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {conversations.map((conversation) => {
              const last = conversation.messages[conversation.messages.length - 1];
              const active = conversation.id === activeId;

              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 p-4 text-left transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                      active ? "bg-primary-subtle" : "hover:bg-surface-secondary",
                    )}
                  >
                    <span className="relative shrink-0">
                      <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary-dark">
                        {contactInitials(conversation.contact.name)}
                      </span>
                      {conversation.online ? (
                        <span
                          role="img"
                          aria-label="Online"
                          className="absolute right-0 bottom-0 size-2.5 rounded-full bg-secondary ring-2 ring-surface"
                        />
                      ) : null}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        {/* The name is the row's subject, so it takes the body
                            step while everything under it drops to 14/13 — an
                            unread thread then says so by weight rather than by
                            being the only legible thing in the row. */}
                        <span
                          className={cn(
                            "truncate text-base text-text-primary",
                            conversation.unread > 0 ? "font-semibold" : "font-medium",
                          )}
                        >
                          {conversation.contact.name}
                        </span>
                        <span className="shrink-0 text-meta font-medium text-text-secondary">
                          {time(last.at)}
                        </span>
                      </span>

                      <span className="mt-1 flex items-center gap-2">
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-sm",
                            conversation.unread > 0
                              ? "font-medium text-text-primary"
                              : "text-text-secondary",
                          )}
                        >
                          {last.direction === "outbound" ? "You: " : ""}
                          {last.body}
                        </span>
                        {conversation.unread > 0 ? (
                          <span className="grid size-4.5 shrink-0 place-items-center rounded-full bg-primary text-xs font-medium text-white">
                            {conversation.unread}
                          </span>
                        ) : null}
                        {/* A closed window is the row's other actionable fact,
                            and it never coincides with an unread count — an
                            inbound message is what reopens the window. */}
                        {conversation.sessionOpen ? null : (
                          <Clock
                            className="size-3.5 shrink-0 text-warning-text"
                            aria-label="Reply window closed"
                          />
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </TabPanel>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Column 2 — chat                                                            */
/* -------------------------------------------------------------------------- */

function MessageState({ state }: { state?: InboxMessage["state"] }) {
  if (!state) return null;
  if (state === "read") {
    return <CheckCheck className="size-3.5 text-accent" aria-label="Read" />;
  }
  if (state === "delivered") {
    return <CheckCheck className="size-3.5 text-white/80" aria-label="Delivered" />;
  }
  if (state === "failed") {
    return <X className="size-3.5 text-error" aria-label="Failed" />;
  }
  return <Check className="size-3.5 text-white/80" aria-label="Sent" />;
}

function ChatWindow({
  conversation,
  onBack,
  onOpenDetails,
  onSend,
}: {
  conversation: Conversation;
  onBack: () => void;
  onOpenDetails: () => void;
  onSend: (body: string) => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const body = draft.trim();
    if (!body) return;
    onSend(body);
    setDraft("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-border p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="shrink-0 lg:hidden"
        >
          <ArrowLeft aria-hidden />
          <span className="sr-only">Back to conversations</span>
        </Button>

        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary-dark">
          {contactInitials(conversation.contact.name)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-text-primary">
            {conversation.contact.name}
          </p>
          {/* Presence reads as a state, not a sentence: the dot carries it and
              the phone number stays visible either way, which is the fact an
              agent actually needs while typing. */}
          <p className="flex items-center gap-1.5 text-meta font-medium text-text-secondary">
            {conversation.online ? (
              <>
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-secondary" />
                <span>Online</span>
                <span aria-hidden className="text-text-muted">·</span>
              </>
            ) : null}
            <span className="truncate">{conversation.contact.phone}</span>
          </p>
        </div>

        {/*
         * The window state, beside the name rather than in the composer alone.
         *
         * An agent picking a thread needs to know before they start typing
         * whether they can type at all — finding out at the send button is how
         * a reply gets lost.
         */}
        <Badge
          tone={conversation.sessionOpen ? "success" : "warning"}
          size="sm"
          className="hidden shrink-0 gap-1.5 sm:inline-flex"
        >
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full",
              conversation.sessionOpen ? "bg-success" : "bg-warning",
            )}
          />
          {conversation.sessionOpen ? "Session open" : "Session closed"}
        </Badge>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenDetails}
          className="shrink-0 xl:hidden"
        >
          <Info aria-hidden />
          <span className="sr-only">Contact details</span>
        </Button>
      </header>

      {/* History */}
      <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-surface-secondary/50 px-4 py-4">
        {conversation.messages.map((message) => {
          const outbound = message.direction === "outbound";

          return (
            <li
              key={message.id}
              className={cn("flex", outbound ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-panel px-3.5 py-2 sm:max-w-[78%]",
                  outbound
                    ? "rounded-br-sm bg-primary text-white"
                    : "rounded-bl-sm border border-border bg-surface text-text-primary",
                )}
              >
                {/*
                 * Body and stamp in one wrapping flex row, which is what makes
                 * a short message a single line.
                 *
                 * The stamp used to be its own block under the text, so every
                 * bubble — "Yes please" included — cost two lines and a
                 * thread of short replies read as a column of tall boxes. As a
                 * flex item it sits in the last line's leftover width when
                 * there is any and drops to its own right-aligned row when the
                 * text fills the bubble, which is the behaviour every chat
                 * client has and the reason the history no longer feels empty.
                 */}
                <div className="flex flex-wrap items-end justify-end gap-x-2">
                  <p className="max-w-full text-sm leading-relaxed whitespace-pre-wrap">
                    {message.body}
                  </p>
                  <p
                    className={cn(
                      "flex shrink-0 items-center gap-1 text-meta tabular-nums",
                      outbound ? "text-white/80" : "text-text-muted",
                    )}
                  >
                    {time(message.at)}
                    <MessageState state={message.state} />
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Composer */}
      <div className="border-t border-border p-3">
        {showReplies ? (
          <ul className="mb-2.5 space-y-1.5">
            {QUICK_REPLIES.map((reply) => (
              <li key={reply}>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(reply);
                    setShowReplies(false);
                    inputRef.current?.focus();
                  }}
                  className="w-full rounded-panel border border-border px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:border-primary hover:bg-primary-subtle focus-visible:shadow-focus focus-visible:outline-none"
                >
                  {reply}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {/*
         * Outside the window the composer does not pretend.
         *
         * Meta rejects a free-form message sent more than 24 hours after the
         * contact's last inbound one, so a textarea that accepts the text and a
         * Send button that fails is a worse answer than a strip saying what the
         * rule is and pointing at the templates that satisfy it.
         */}
        {conversation.sessionOpen ? null : (
          <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-panel border border-warning/40 bg-warning-soft/60 px-3.5 py-2.5">
            <p className="min-w-0 flex-1 text-sm font-medium text-warning-text">
              The 24-hour reply window has closed. Only an approved template can
              be sent to this contact.
            </p>
            <ButtonLink
              href={APP_ROUTES.whatsappTemplates}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              Choose a template
            </ButtonLink>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex shrink-0 gap-1">
            {/*
             * Two of the three buttons here had no handler at all.
             *
             * Attach stays and now behaves like every other stubbed action in
             * the module — Import, Export, Duplicate all raise a toast: media
             * is a real WhatsApp message type and the composer should say so.
             * The emoji button is gone. Every platform WhatsApp runs on has an
             * emoji key on its own keyboard, so the control bought nothing even
             * when it worked, and a button that does nothing at all is worse
             * than no button.
             */}
            <Button
              variant="ghost"
              size="sm"
              aria-label="Attach a file"
              disabled={!conversation.sessionOpen}
              onClick={() => toast("Attachments open from your device library")}
            >
              <Paperclip aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Quick replies"
              aria-expanded={showReplies}
              onClick={() => setShowReplies((value) => !value)}
            >
              <MessageSquareText aria-hidden />
            </Button>
          </div>

          <Textarea
            ref={inputRef}
            value={draft}
            rows={1}
            aria-label="Message"
            disabled={!conversation.sessionOpen}
            placeholder={
              conversation.sessionOpen
                ? undefined
                : "Template required outside the 24-hour window"
            }
            className="min-h-11 flex-1 resize-none py-3"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              /* Enter sends; Shift+Enter is a newline, as in every chat app. */
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
          />

          <Button
            size="compact"
            onClick={submit}
            disabled={!draft.trim() || !conversation.sessionOpen}
            aria-label="Send message"
            className="shrink-0"
          >
            <Send aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Column 3 — contact                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The details panel's section rule, in one place so the four sections cannot
 * drift apart.
 *
 * Set on the 13px metadata step rather than 14px: these are signposts between
 * blocks of content, and at body size they compete with the values they are
 * labelling. Semibold and `text-secondary` are what buy back the legibility
 * the smaller step costs — the old rule was `font-medium` on `text-muted`,
 * which is the lightest weight on the palette's lightest ink.
 */
const SECTION_HEADING =
  "text-meta font-semibold tracking-[0.08em] text-text-secondary uppercase";

function ContactDetails({
  conversation,
  onClose,
  onResolve,
}: {
  conversation: Conversation;
  onClose?: () => void;
  onResolve: () => void;
}) {
  const toast = useToast();
  const { contact } = conversation;

  const [agent, setAgent] = useState(contact.assignedAgent ?? "");
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState(contact.tags);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState(contact.notes);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary">Contact details</h2>
        {onClose ? (
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close details">
            <X aria-hidden />
          </Button>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        {/*
         * Profile block.
         *
         * Name, then what this person is — and nothing else. The phone number
         * moved down into the contact rows below, where it sits beside the
         * email with a matching tile, because a bare number under a name reads
         * as a subtitle rather than as one of two ways to reach someone.
         */}
        <div className="flex flex-col items-center text-center">
          <span className="grid size-16 place-items-center rounded-full bg-primary-soft text-base font-bold text-primary-dark">
            {contactInitials(contact.name)}
          </span>
          <p className="mt-3 text-base font-semibold text-text-primary">
            {contact.name}
          </p>
          <Badge tone={LIFECYCLE_TONE[contact.lifecycle]} size="sm" className="mt-2">
            {contact.lifecycle}
          </Badge>
        </div>

        {/* Where this thread stands, as two tiles rather than a label list. */}
        <dl className="grid grid-cols-2 gap-2">
          <div className="min-w-0 rounded-panel bg-surface-secondary px-3 py-2.5">
            <dt className="text-meta font-medium text-text-secondary">Status</dt>
            <dd className="mt-1.5">
              <Badge tone={STATUS_TONE[conversation.status]} size="sm">
                {conversation.status}
              </Badge>
            </dd>
          </div>
          <div className="min-w-0 rounded-panel bg-surface-secondary px-3 py-2.5">
            <dt className="text-meta font-medium text-text-secondary">Last activity</dt>
            <dd className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-text-primary">
              <Clock className="size-3.5 shrink-0 text-text-muted" aria-hidden />
              <span className="truncate">
                {formatRelativeTime(contact.lastActivityAt)}
              </span>
            </dd>
          </div>
        </dl>

        {/*
         * Reach. One row shape, so a missing email leaves no ragged gap.
         *
         * A list rather than a `dl`: the label sits *above* its value here so a
         * long address can use the panel's full width instead of truncating
         * against a right-aligned column, and `dl` has no valid nesting that
         * stacks the two without wrapping them in an element it does not allow.
         */}
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-muted">
              <Phone className="size-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-meta text-text-muted">Phone</span>
              <span className="block truncate text-sm font-medium text-text-primary">
                {contact.phone}
              </span>
            </span>
          </li>

          {contact.email ? (
            <li className="flex items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-muted">
                <Mail className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-meta text-text-muted">Email</span>
                <span className="block truncate text-sm font-medium text-text-primary">
                  {contact.email}
                </span>
              </span>
            </li>
          ) : null}
        </ul>

        {/* Tags */}
        <section>
          <h3 className={SECTION_HEADING}>Tags</h3>
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {tags.map((item) => (
              <li key={item} className="max-w-full">
                <Tag label={item} />
              </li>
            ))}
            {tags.length === 0 ? (
              <li className="text-sm text-text-muted">No tags yet.</li>
            ) : null}
          </ul>

          <div className="mt-2.5 flex gap-2">
            <Input size="sm"
              value={tag}
              aria-label="Add tag"
              onChange={(event) => setTag(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || !tag.trim()) return;
                event.preventDefault();
                setTags((prev) => [...new Set([...prev, tag.trim()])]);
                setTag("");
                toast("Tag added");
              }}
            />
            <Button
              variant="outline"
              size="compact"
              disabled={!tag.trim()}
              onClick={() => {
                setTags((prev) => [...new Set([...prev, tag.trim()])]);
                setTag("");
                toast("Tag added");
              }}
            >
              Add
            </Button>
          </div>
        </section>

        {/* Agent */}
        <section>
          <h3 className={SECTION_HEADING}>Assigned agent</h3>
          <Select
            label="Assigned agent"
            value={agent}
            onChange={(next) => {
              setAgent(next);
              toast(next ? `Assigned to ${next}` : "Assignment cleared");
            }}
            options={[
              { value: "", label: "Unassigned" },
              ...AGENTS.map((name) => ({ value: name, label: name })),
            ]}
            className="mt-2.5"
          />
        </section>

        {/* Notes */}
        <section>
          <h3 className={SECTION_HEADING}>Notes</h3>
          {/*
           * A note is one person writing a sentence about another, so it gets
           * a card with a rule around it rather than a tinted strip. The
           * fixture carries the text and nothing else — no author, no
           * timestamp — and inventing either would be worse than leaving the
           * card to the words.
           */}
          <ul className="mt-2.5 space-y-2">
            {notes.map((item, index) => (
              <li
                key={index}
                className="rounded-panel border border-border bg-surface-secondary px-3 py-2.5 text-sm leading-relaxed text-text-secondary"
              >
                {item}
              </li>
            ))}
            {notes.length === 0 ? (
              <li className="text-sm text-text-muted">No notes yet.</li>
            ) : null}
          </ul>

          <Textarea
            value={note}
            rows={2}
            aria-label="Add a note"
            placeholder="Add a note…"
            className="mt-2.5"
            onChange={(event) => setNote(event.target.value)}
          />
          <Button
            variant="outline"
            size="compact"
            disabled={!note.trim()}
            className="mt-2 w-full"
            onClick={() => {
              setNotes((prev) => [...prev, note.trim()]);
              setNote("");
              toast("Note saved");
            }}
          >
            <UserPlus aria-hidden />
            Save note
          </Button>
        </section>
      </div>

      <div className="border-t border-border p-4">
        <Button
          variant="outline"
          size="compact"
          className="w-full"
          onClick={onResolve}
          disabled={conversation.status === "resolved"}
        >
          <Check aria-hidden />
          {conversation.status === "resolved" ? "Conversation closed" : "Close conversation"}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Shell                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Three columns at `xl`, two at `lg`, one on a phone.
 *
 * Rather than hiding a column, the narrow layouts turn it into a view: the list
 * is the landing view, picking a conversation swaps to the thread, and details
 * open over it. Nothing becomes unreachable — the brief's rule about not
 * dropping functionality on mobile.
 */
export function WhatsAppInbox({
  initialConversationId,
}: {
  /** Deep-link target, e.g. from a Contacts row. Falls back to the first thread. */
  initialConversationId?: string;
} = {}) {
  const toast = useToast();

  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [activeId, setActiveId] = useState<string | null>(() => {
    const requested = CONVERSATIONS.find(
      (item) => item.id === initialConversationId,
    );
    return requested?.id ?? CONVERSATIONS[0]?.id ?? null;
  });
  const [scope, setScope] = useState<Scope>("all");
  const [search, setSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "thread">(
    initialConversationId ? "thread" : "list",
  );
  const [detailsOpen, setDetailsOpen] = useState(false);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return conversations.filter((item) => {
      if (term && !item.contact.name.toLowerCase().includes(term)) return false;
      if (scope === "unread" && item.unread === 0) return false;
      if (scope === "unassigned" && item.contact.assignedAgent) return false;
      if (scope === "mine" && item.contact.assignedAgent !== CURRENT_AGENT) {
        return false;
      }
      return true;
    });
  }, [conversations, search, scope]);

  const active = conversations.find((item) => item.id === activeId) ?? null;

  function selectConversation(id: string) {
    setActiveId(id);
    setMobileView("thread");
    /* Opening a thread clears its badge, as reading it would. */
    setConversations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: 0 } : item)),
    );
  }

  function send(body: string) {
    if (!active) return;
    setConversations((prev) =>
      prev.map((item) =>
        item.id === active.id
          ? {
              ...item,
              messages: [
                ...item.messages,
                {
                  id: `m-${Date.now()}`,
                  direction: "outbound" as const,
                  body,
                  at: new Date().toISOString(),
                  state: "sent" as const,
                },
              ],
            }
          : item,
      ),
    );
  }

  function resolve() {
    if (!active) return;
    setConversations((prev) =>
      prev.map((item) =>
        item.id === active.id ? { ...item, status: "resolved" as const } : item,
      ),
    );
    setDetailsOpen(false);
    toast("Conversation closed");
  }

  return (
    <Card className="relative flex h-[calc(100dvh-11rem)] min-h-125 overflow-hidden p-0">
      {/* Column 1 */}
      <div
        className={cn(
          "w-full shrink-0 border-border lg:w-80 lg:border-r xl:w-88",
          mobileView === "thread" ? "max-lg:hidden" : "",
        )}
      >
        <ConversationList
          conversations={visible}
          activeId={activeId}
          onSelect={selectConversation}
          scope={scope}
          onScopeChange={setScope}
          search={search}
          onSearchChange={setSearch}
        />
      </div>

      {/* Column 2 */}
      <div
        className={cn(
          "min-w-0 flex-1",
          mobileView === "list" ? "max-lg:hidden" : "",
        )}
      >
        {active ? (
          <ChatWindow
            conversation={active}
            onBack={() => setMobileView("list")}
            onOpenDetails={() => setDetailsOpen(true)}
            onSend={send}
          />
        ) : (
          <div className="grid h-full place-items-center p-6">
            <EmptyState
              title="No conversation selected"
              description="Pick a conversation on the left to read and reply."
            />
          </div>
        )}
      </div>

      {/* Column 3 — inline at xl */}
      {active ? (
        <div className="hidden w-80 shrink-0 border-l border-border xl:block">
          <ContactDetails conversation={active} onResolve={resolve} />
        </div>
      ) : null}

      {/* Column 3 — overlay below xl, so details are never lost */}
      {active && detailsOpen ? (
        <>
          <button
            type="button"
            aria-label="Close contact details"
            onClick={() => setDetailsOpen(false)}
            className="absolute inset-0 z-40 bg-text-primary/40 xl:hidden"
          />
          <div className="absolute inset-y-0 right-0 z-50 w-full max-w-sm border-l border-border bg-surface shadow-float xl:hidden">
            <ContactDetails
              conversation={active}
              onClose={() => setDetailsOpen(false)}
              onResolve={resolve}
            />
          </div>
        </>
      ) : null}
    </Card>
  );
}
