"use client";

import { useState } from "react";
import { Headphones, Loader2, Send } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { MESSAGE_MAX } from "@/constants/support";
import { formatDateTime } from "@/lib/format";
import type { MerchantActor } from "@/lib/support-service";
import { cn } from "@/lib/utils";
import type { SupportMessage } from "@/types/support";
import { AttachmentPicker, MessageAttachments } from "./attachments";

/**
 * A ticket's thread and the merchant's reply box.
 *
 * A support inbox rather than a chat: every message is full width, left
 * aligned and headed by who sent it, because a ticket is read top to bottom as
 * a record. Support replies arrive from the Admin dashboard through the API as
 * `senderType: "support"` messages, signed by the agent where the API names
 * one and "MarketFlow Support" where it does not, and always labelled Support
 * Team. They differ from the merchant's own messages by a quiet brand tint.
 */
export function Conversation({
  actor,
  messages,
}: {
  actor: MerchantActor;
  messages: SupportMessage[];
}) {
  return (
    <ol className="space-y-4" aria-label="Conversation">
      {messages.map((message) => {
        const support = message.senderType === "support";
        return (
          <li key={message.id} className="flex gap-3">
            {support ? (
              <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-dark"
              >
                <Headphones className="size-4" />
              </span>
            ) : (
              <Avatar name={message.senderName} size="sm" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-semibold text-text-primary">{message.senderName}</span>
                <Badge variant={support ? "primary" : "neutral"} casing="none">
                  {support ? "Support Team" : "You"}
                </Badge>
                <time dateTime={message.createdAt} className="text-sm text-text-muted">
                  {formatDateTime(message.createdAt)}
                </time>
              </div>
              <div
                className={cn(
                  "mt-1.5 rounded-panel border px-4 py-3",
                  support ? "border-primary-border/60 bg-primary-subtle" : "border-border bg-surface",
                )}
              >
                {/* Plain text only: React escapes it, and nothing here ever
                    sets HTML - which is the XSS guarantee for ticket bodies. */}
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-text-secondary">
                  {message.message}
                </p>
                <MessageAttachments actor={actor} attachments={message.attachments} />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function ReplyComposer({
  onSend,
  disabledReason,
}: {
  /** Resolves `true` when the message was accepted, so the box can clear. */
  onSend: (body: string, files: File[]) => Promise<boolean>;
  /** Shown instead of the composer - a closed ticket takes no replies. */
  disabledReason?: string;
}) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  if (disabledReason) {
    return (
      <p className="rounded-panel border border-dashed border-border-strong px-4 py-3 text-sm font-medium text-text-secondary">
        {disabledReason}
      </p>
    );
  }

  async function send() {
    if (!body.trim() || sending) return;
    setSending(true);
    const accepted = await onSend(body, files);
    setSending(false);
    if (accepted) {
      setBody("");
      setFiles([]);
    }
  }

  return (
    <div className="rounded-panel border border-border bg-surface p-3.5">
      <label htmlFor="reply-body" className="sr-only">
        Reply
      </label>
      <Textarea
        id="reply-body"
        rows={4}
        maxLength={MESSAGE_MAX}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void send();
        }}
        placeholder="Write a reply…"
      />
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <AttachmentPicker files={files} onChange={setFiles} disabled={sending} compact />
        <Button size="compact" onClick={send} disabled={sending || !body.trim()} className="ml-auto">
          {sending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
          Send Reply
        </Button>
      </div>
    </div>
  );
}
