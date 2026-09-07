"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Info,
  MessageSquareText,
  Paperclip,
  Search,
  Send,
  Smile,
  UserPlus,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useToast } from "@/components/ui/toast";
import {
  AGENTS,
  CONVERSATIONS,
  QUICK_REPLIES,
} from "@/lib/marketing-fixtures";
import { formatRelativeTime } from "@/lib/format";
import { cn, initials } from "@/lib/utils";

/** `initials` takes two arguments, so a full name has to be split first. */
const contactInitials = (name: string) => {
  const [first, last] = name.split(" ");
  return initials(first, last);
};
import type { Conversation, InboxMessage } from "@/types/marketing";

type Scope = "all" | "unread" | "mine";

/** The signed-in agent, until auth carries a real one. */
const CURRENT_AGENT = "Nadia Karim";

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
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search conversations…"
            aria-label="Search conversations"
            className="h-10 pl-9"
          />
        </div>

        <SegmentedControl
          label="Filter conversations"
          size="sm"
          value={scope}
          onChange={onScopeChange}
          options={[
            { value: "all", label: "All" },
            { value: "unread", label: "Unread" },
            { value: "mine", label: "Assigned to me" },
          ]}
          className="mt-3 w-full"
        />
      </div>

      {conversations.length === 0 ? (
        <div className="p-4">
          <EmptyState
            title="No conversations"
            description="Nothing matches this filter right now."
          />
        </div>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
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
                    <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-dark">
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
                      <span
                        className={cn(
                          "truncate text-sm text-text-primary",
                          conversation.unread > 0 ? "font-bold" : "font-medium",
                        )}
                      >
                        {conversation.contact.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-text-muted">
                        {time(last.at)}
                      </span>
                    </span>

                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[13px] text-text-secondary">
                        {last.direction === "outbound" ? "You: " : ""}
                        {last.body}
                      </span>
                      {conversation.unread > 0 ? (
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
                          {conversation.unread}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
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
    return <CheckCheck className="size-3.5 text-white/70" aria-label="Delivered" />;
  }
  if (state === "failed") {
    return <X className="size-3.5 text-error" aria-label="Failed" />;
  }
  return <Check className="size-3.5 text-white/70" aria-label="Sent" />;
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

        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-dark">
          {contactInitials(conversation.contact.name)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">
            {conversation.contact.name}
          </p>
          <p className="truncate text-xs text-text-muted">
            {conversation.online ? "Online" : conversation.contact.phone}
          </p>
        </div>

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
      <ol className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-surface-secondary/50 p-4">
        {conversation.messages.map((message) => {
          const outbound = message.direction === "outbound";

          return (
            <li
              key={message.id}
              className={cn("flex", outbound ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-panel px-3.5 py-2.5 sm:max-w-[70%]",
                  outbound
                    ? "rounded-br-sm bg-primary text-white"
                    : "rounded-bl-sm border border-border bg-surface text-text-primary",
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.body}
                </p>
                <p
                  className={cn(
                    "mt-1 flex items-center justify-end gap-1 text-[10px]",
                    outbound ? "text-white/70" : "text-text-muted",
                  )}
                >
                  {time(message.at)}
                  <MessageState state={message.state} />
                </p>
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
                  className="w-full rounded-panel border border-border px-3 py-2 text-left text-[13px] text-text-secondary transition-colors hover:border-primary hover:bg-primary-subtle focus-visible:shadow-focus focus-visible:outline-none"
                >
                  {reply}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex items-end gap-2">
          <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="sm" aria-label="Attach a file">
              <Paperclip aria-hidden />
            </Button>
            <Button variant="ghost" size="sm" aria-label="Insert emoji">
              <Smile aria-hidden />
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
            placeholder="Write a message…"
            aria-label="Message"
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
            disabled={!draft.trim()}
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
        <h2 className="text-sm font-medium text-text-primary">Contact details</h2>
        {onClose ? (
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close details">
            <X aria-hidden />
          </Button>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary-dark">
            {contactInitials(contact.name)}
          </span>
          <p className="mt-2.5 text-sm font-medium text-text-primary">{contact.name}</p>
          <p className="text-xs text-text-muted">{contact.phone}</p>
          {contact.email ? (
            <p className="truncate text-xs text-text-muted">{contact.email}</p>
          ) : null}
        </div>

        <dl className="space-y-2.5 rounded-panel border border-border p-3.5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-text-secondary">Status</dt>
            <dd className="font-medium text-text-primary capitalize">
              {contact.lifecycle}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-text-secondary">Last activity</dt>
            <dd className="text-text-primary">
              {formatRelativeTime(contact.lastActivityAt)}
            </dd>
          </div>
        </dl>

        {/* Tags */}
        <section>
          <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
            Tags
          </h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((item) => (
              <li
                key={item}
                className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs text-text-secondary"
              >
                {item}
              </li>
            ))}
            {tags.length === 0 ? (
              <li className="text-xs text-text-muted">No tags yet.</li>
            ) : null}
          </ul>

          <div className="mt-2.5 flex gap-2">
            <Input
              value={tag}
              placeholder="Add tag"
              aria-label="Add tag"
              className="h-10"
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
          <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
            Assigned agent
          </h3>
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
            className="mt-2"
          />
        </section>

        {/* Notes */}
        <section>
          <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
            Notes
          </h3>
          <ul className="mt-2 space-y-1.5">
            {notes.map((item, index) => (
              <li
                key={index}
                className="rounded-panel bg-surface-secondary px-3 py-2 text-[13px] text-text-secondary"
              >
                {item}
              </li>
            ))}
            {notes.length === 0 ? (
              <li className="text-xs text-text-muted">No notes yet.</li>
            ) : null}
          </ul>

          <Textarea
            value={note}
            rows={2}
            placeholder="Add a note…"
            aria-label="Add a note"
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
export function WhatsAppInbox() {
  const toast = useToast();

  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [activeId, setActiveId] = useState<string | null>(CONVERSATIONS[0]?.id ?? null);
  const [scope, setScope] = useState<Scope>("all");
  const [search, setSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return conversations.filter((item) => {
      if (term && !item.contact.name.toLowerCase().includes(term)) return false;
      if (scope === "unread" && item.unread === 0) return false;
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
