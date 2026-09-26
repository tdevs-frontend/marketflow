"use client";

import { useState } from "react";
import { Loader2, Lock, Send } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { MESSAGE_MAX } from "@/constants/support";
import { formatDateTime } from "@/lib/format";
import type { SupportActor } from "@/lib/support-service";
import { cn } from "@/lib/utils";
import type { SupportAttachment } from "@/types/support";
import { AttachmentPicker, MessageAttachments } from "./attachments";

/**
 * The ticket thread and its composer - one component for both sides.
 *
 * A support inbox rather than a chat: every message is full width, left
 * aligned, and headed by who sent it and in what role, because a ticket is
 * read top to bottom as a record, not scanned as bubbles. The merchant and the
 * agent differ by a quiet tint; an internal note differs loudly - amber, a
 * lock, the words "Internal note" - because mistaking one for a reply is the
 * one error on this screen that matters.
 */

export interface ThreadMessage {
  id: string;
  senderName: string;
  senderRole: string;
  senderType: "merchant" | "agent" | "system";
  body: string;
  createdAt: string;
  attachments: SupportAttachment[];
  internal?: boolean;
}

export function Conversation({
  actor,
  messages,
}: {
  actor: SupportActor;
  messages: ThreadMessage[];
}) {
  return (
    <ol className="space-y-4" aria-label="Conversation">
      {messages.map((message) => {
        const agent = message.senderType === "agent";
        return (
          <li key={message.id} className="flex gap-3">
            <Avatar
              name={message.senderName}
              size="sm"
              tone={message.internal ? "bg-warning-soft text-warning-text" : agent ? "bg-primary-soft text-primary-dark" : undefined}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-semibold text-text-primary">{message.senderName}</span>
                {message.internal ? (
                  <Badge variant="warning" casing="none" icon={<Lock aria-hidden />}>
                    Internal note
                  </Badge>
                ) : (
                  <Badge variant={agent ? "primary" : "neutral"} casing="none">
                    {message.senderRole}
                  </Badge>
                )}
                <time dateTime={message.createdAt} className="text-sm text-text-muted">
                  {formatDateTime(message.createdAt)}
                </time>
              </div>
              <div
                className={cn(
                  "mt-1.5 rounded-panel border px-4 py-3",
                  message.internal
                    ? "border-warning/40 bg-warning-soft"
                    : agent
                      ? "border-primary-border/60 bg-primary-subtle"
                      : "border-border bg-surface",
                )}
              >
                {/* Plain text only: React escapes it, and nothing here ever
                    sets HTML - which is the XSS guarantee for ticket bodies. */}
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-text-secondary">
                  {message.body}
                </p>
                <MessageAttachments
                  actor={actor}
                  attachments={message.attachments}
                  tone={message.internal ? "note" : "default"}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export interface SendOptions {
  internal: boolean;
  waitForMerchant: boolean;
}

export function ReplyComposer({
  audience,
  onSend,
  disabledReason,
}: {
  audience: "merchant" | "agent";
  /** Resolves `true` when the message was accepted, so the box can clear. */
  onSend: (body: string, files: File[], options: SendOptions) => Promise<boolean>;
  /** Shown instead of the composer - a closed ticket takes no replies. */
  disabledReason?: string;
}) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<"reply" | "note">("reply");
  const [waitForMerchant, setWaitForMerchant] = useState(true);
  const [sending, setSending] = useState(false);

  const note = audience === "agent" && mode === "note";

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
    const accepted = await onSend(body, files, { internal: note, waitForMerchant: !note && waitForMerchant });
    setSending(false);
    if (accepted) {
      setBody("");
      setFiles([]);
    }
  }

  return (
    <div
      className={cn(
        "rounded-panel border p-3.5",
        note ? "border-warning/40 bg-warning-soft" : "border-border bg-surface",
      )}
    >
      {audience === "agent" ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <SegmentedControl
            label="Message type"
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: "reply", label: "Reply to merchant" },
              { value: "note", label: "Internal note" },
            ]}
          />
          {note ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-warning-text">
              <Lock className="size-4" aria-hidden />
              Only the support team sees notes
            </span>
          ) : null}
        </div>
      ) : null}

      <label htmlFor="reply-body" className="sr-only">
        {note ? "Internal note" : "Reply"}
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
        placeholder={note ? "Write an internal note…" : "Write a reply…"}
      />

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <AttachmentPicker files={files} onChange={setFiles} disabled={sending} compact />
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {audience === "agent" && !note ? (
            <CheckboxField
              id="reply-wait"
              label="Set to Waiting for Merchant"
              checked={waitForMerchant}
              onCheckedChange={setWaitForMerchant}
            />
          ) : null}
          <Button size="compact" onClick={send} disabled={sending || !body.trim()}>
            {sending ? <Loader2 className="animate-spin" aria-hidden /> : note ? <Lock aria-hidden /> : <Send aria-hidden />}
            {note ? "Add Note" : "Send Reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
