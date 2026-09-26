"use client";

import { useRef, useState } from "react";
import { FileText, Image as ImageIcon, Paperclip, X } from "lucide-react";

import { Button, IconButton } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENTS } from "@/constants/support";
import { formatBytes } from "@/lib/media-store";
import {
  attachmentUrl,
  validateAttachments,
  type SupportActor,
} from "@/lib/support-service";
import { cn } from "@/lib/utils";
import type { SupportAttachment } from "@/types/support";

/**
 * Attaching files to a ticket or a reply.
 *
 * Files are checked the moment they are picked, with the same
 * `validateAttachments` the service runs again on send - type by the file's
 * bytes, 10 MB each, five at most - so a refused file is refused here, with the
 * reason, rather than after the merchant has written their message.
 */
export function AttachmentPicker({
  files,
  onChange,
  disabled,
  compact = false,
}: {
  files: File[];
  onChange: (next: File[]) => void;
  disabled?: boolean;
  /** The composer's inline button, rather than the form's full-width field. */
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function add(picked: FileList | null) {
    if (!picked?.length) return;
    const next = [...files, ...Array.from(picked)];
    const checked = await validateAttachments(next);
    if (!checked.ok) {
      setError(checked.error);
      return;
    }
    setError(null);
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <input
        ref={input}
        type="file"
        multiple
        accept={ATTACHMENT_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          void add(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          size={compact ? "sm" : "compact"}
          disabled={disabled || files.length >= MAX_ATTACHMENTS}
          onClick={() => input.current?.click()}
        >
          <Paperclip aria-hidden />
          Attach File
        </Button>
        {!compact ? (
          <span className="text-sm text-text-muted">
            PNG, JPG, GIF, WebP, PDF, TXT or LOG · up to 10 MB each · {MAX_ATTACHMENTS} files
          </span>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}

      {files.length ? (
        <ul className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex max-w-full items-center gap-2 rounded-btn border border-border bg-surface-secondary py-1 pr-1 pl-2.5"
            >
              <FileGlyph type={file.type} />
              <span className="min-w-0 truncate text-sm font-medium text-text-primary">{file.name}</span>
              <span className="shrink-0 text-sm text-text-muted">{formatBytes(file.size)}</span>
              <IconButton
                label={`Remove ${file.name}`}
                size="xs"
                variant="quiet"
                onClick={() => {
                  setError(null);
                  onChange(files.filter((_, position) => position !== index));
                }}
              >
                <X aria-hidden />
              </IconButton>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function FileGlyph({ type }: { type: string }) {
  const Icon = type.startsWith("image/") ? ImageIcon : FileText;
  return <Icon className="size-4 shrink-0 text-text-muted" aria-hidden />;
}

/**
 * A message's files. Opening one goes through `attachmentUrl`, which checks the
 * viewer may see the message it belongs to; sample files have a record but no
 * stored bytes, and say so instead of offering a dead link.
 */
export function MessageAttachments({
  actor,
  attachments,
  tone = "default",
}: {
  actor: SupportActor;
  attachments: SupportAttachment[];
  tone?: "default" | "note";
}) {
  if (attachments.length === 0) return null;

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {attachments.map((attachment) => {
        const url = attachmentUrl(actor, attachment);
        const chip = cn(
          "flex max-w-full items-center gap-2 rounded-btn border px-2.5 py-1.5 text-sm",
          tone === "note" ? "border-warning/30 bg-surface" : "border-border bg-surface",
        );
        const body = (
          <>
            <FileGlyph type={attachment.fileType} />
            <span className="min-w-0 truncate font-medium text-text-primary">{attachment.fileName}</span>
            <span className="shrink-0 text-text-muted">{formatBytes(attachment.fileSize)}</span>
          </>
        );

        return (
          <li key={attachment.id} className="max-w-full">
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                download={attachment.fileName}
                className={cn(chip, "transition-colors hover:border-border-strong focus-visible:shadow-focus focus-visible:outline-none")}
              >
                {body}
              </a>
            ) : (
              <Tooltip content="Sample attachment - the file itself is not stored in this build">
                <span className={chip} tabIndex={0}>
                  {body}
                </span>
              </Tooltip>
            )}
          </li>
        );
      })}
    </ul>
  );
}
