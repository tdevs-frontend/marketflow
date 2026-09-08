"use client";

import { useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Columns3,
  Eye,
  GripVertical,
  Heading,
  Image as ImageIcon,
  Link2,
  Minus,
  Monitor,
  Package,
  Save,
  Share2,
  Smartphone,
  Trash2,
  Type,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { EmailBlock, EmailBlockType, EmailTemplate } from "@/types/email";

/**
 * The email template builder.
 *
 * A block list with a live preview rather than a drag-on-canvas editor: email
 * renders as a single column in every client that matters, so the document
 * genuinely *is* an ordered list of blocks, and reorder buttons beat drag
 * handles for keyboard users and for anyone on a touchscreen.
 *
 * The preview switches between phone and desktop width because that is the
 * decision the layout hangs on — two thirds of opens are on a phone, and a
 * three-column product block that looks right at 600px is unusable at 375px.
 */

const BLOCK_META: Record<EmailBlockType, { icon: LucideIcon; label: string }> = {
  logo: { icon: ImageIcon, label: "Logo" },
  heading: { icon: Heading, label: "Heading" },
  text: { icon: Type, label: "Text" },
  image: { icon: ImageIcon, label: "Image" },
  button: { icon: Link2, label: "Button" },
  divider: { icon: Minus, label: "Divider" },
  products: { icon: Package, label: "Products" },
  social: { icon: Share2, label: "Social links" },
  footer: { icon: Columns3, label: "Footer" },
};

const PALETTE: EmailBlockType[] = [
  "heading",
  "text",
  "image",
  "button",
  "divider",
  "products",
  "social",
];

type PreviewWidth = "mobile" | "desktop";

/** One block, as it renders inside the preview frame. */
function PreviewBlock({ block }: { block: EmailBlock }) {
  switch (block.type) {
    case "logo":
      return (
        <div className="border-b border-border px-6 py-5 text-center">
          <p className="font-heading text-sm tracking-tight text-primary-dark">
            {block.content}
          </p>
        </div>
      );

    case "heading":
      return (
        <h3 className="px-6 pt-6 text-lg leading-snug text-text-primary">
          {block.content}
        </h3>
      );

    case "text":
      return (
        <p className="px-6 pt-3 text-[13px] leading-relaxed text-text-secondary">
          {block.content}
        </p>
      );

    case "image":
      return (
        <div className="px-6 pt-4">
          <div className="grid aspect-[3/1] place-items-center rounded-panel bg-email-soft">
            <p className="text-[11px] font-medium text-email">
              {block.content}
              {block.meta ? ` · ${block.meta}` : ""}
            </p>
          </div>
        </div>
      );

    case "button":
      return (
        <div className="px-6 pt-5">
          <span className="inline-flex h-10 items-center rounded-btn bg-email px-5 text-[13px] font-semibold text-white">
            {block.content}
          </span>
        </div>
      );

    case "divider":
      return <div className="mx-6 mt-5 h-px bg-border" />;

    case "products":
      return (
        <div className="px-6 pt-5">
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((index) => (
              <div key={index} className="rounded-panel border border-border p-2">
                <div className="aspect-square rounded-btn bg-surface-secondary" />
                <p className="mt-1.5 truncate text-[10px] text-text-muted">
                  Product {index + 1}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-text-muted">
            {block.content}
            {block.meta ? ` · ${block.meta}` : ""}
          </p>
        </div>
      );

    case "social":
      return (
        <div className="flex items-center justify-center gap-2 px-6 pt-5">
          {[0, 1, 2, 3].map((index) => (
            <span key={index} className="size-6 rounded-full bg-surface-secondary" />
          ))}
        </div>
      );

    case "footer":
      return (
        <div className="mt-6 border-t border-border px-6 py-4 text-center">
          <p className="text-[10px] leading-relaxed text-text-muted">
            {block.content}
          </p>
        </div>
      );
  }
}

export function EmailTemplateBuilder({ template }: { template: EmailTemplate }) {
  const toast = useToast();

  const [blocks, setBlocks] = useState<EmailBlock[]>(template.blocks);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subject, setSubject] = useState(template.subject);
  const [previewText, setPreviewText] = useState(template.previewText);
  const [width, setWidth] = useState<PreviewWidth>("desktop");

  /* A counter rather than `Date.now()`: ids only need to be unique within this
     editing session, and a clock read during render is not pure. */
  const nextId = useRef(0);

  const selected = blocks.find((block) => block.id === selectedId) ?? null;

  function move(id: string, direction: -1 | 1) {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === id);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= current.length) return current;

      const reordered = [...current];
      [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
      return reordered;
    });
  }

  function add(type: EmailBlockType) {
    const block: EmailBlock = {
      id: `b-new-${(nextId.current += 1)}`,
      type,
      content: `New ${BLOCK_META[type].label.toLowerCase()}`,
    };
    /* Inserted before the footer, which always belongs last. */
    setBlocks((current) => {
      const footerIndex = current.findIndex((item) => item.type === "footer");
      if (footerIndex < 0) return [...current, block];
      return [
        ...current.slice(0, footerIndex),
        block,
        ...current.slice(footerIndex),
      ];
    });
    setSelectedId(block.id);
  }

  function update(id: string, patch: Partial<EmailBlock>) {
    setBlocks((current) =>
      current.map((block) => (block.id === id ? { ...block, ...patch } : block)),
    );
  }

  function remove(id: string) {
    setBlocks((current) => current.filter((block) => block.id !== id));
    setSelectedId(null);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[16rem_minmax(0,1fr)_18rem]">
      {/* ------------------------------------------------------- Block list */}
      <Card className="h-max p-4 xl:sticky xl:top-22">
        <p className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
          Blocks
        </p>

        <ol className="mt-3 space-y-1">
          {blocks.map((block, index) => {
            const meta = BLOCK_META[block.type];
            const Icon = meta.icon;
            const active = block.id === selectedId;
            /* Logo and footer are structural — they stay where they are. */
            const locked = block.type === "logo" || block.type === "footer";

            return (
              <li key={block.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedId(block.id)}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-btn px-2 py-1.5 text-left transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                    active
                      ? "bg-email-soft text-email-dark"
                      : "text-text-secondary hover:bg-surface-secondary",
                  )}
                >
                  <GripVertical
                    className="size-3.5 shrink-0 text-border-strong"
                    aria-hidden
                  />
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-medium">{meta.label}</span>
                    <span className="block truncate text-[10px] text-text-muted">
                      {block.content}
                    </span>
                  </span>
                </button>

                {locked ? null : (
                  <span className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      onClick={() => move(block.id, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${meta.label} up`}
                      className="grid size-4 place-items-center rounded text-text-muted transition-colors hover:text-text-primary disabled:opacity-30 focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <ArrowUp className="size-3" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(block.id, 1)}
                      disabled={index === blocks.length - 1}
                      aria-label={`Move ${meta.label} down`}
                      className="grid size-4 place-items-center rounded text-text-muted transition-colors hover:text-text-primary disabled:opacity-30 focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <ArrowDown className="size-3" aria-hidden />
                    </button>
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-4 border-t border-border pt-3">
          <p className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
            Add block
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {PALETTE.map((type) => {
              const meta = BLOCK_META[type];
              const Icon = meta.icon;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => add(type)}
                  className="flex items-center gap-1.5 rounded-btn border border-border px-2 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:border-email hover:bg-email-soft hover:text-email-dark focus-visible:shadow-focus focus-visible:outline-none"
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------------- Preview */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="min-w-0">
            <h2 className="truncate text-base">{template.name}</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {blocks.length} blocks · {template.category.replace("-", " ")}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <SegmentedControl
              label="Preview width"
              value={width}
              onChange={setWidth}
              options={[
                { value: "desktop", label: "Desktop" },
                { value: "mobile", label: "Mobile" },
              ]}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast("Test email sent to your address")}
            >
              <Eye aria-hidden />
              Send test
            </Button>
            <Button size="sm" onClick={() => toast(`${template.name} saved`)}>
              <Save aria-hidden />
              Save
            </Button>
          </div>
        </div>

        {/* The inbox line — subject and preheader, as a client shows them. */}
        <div className="mt-4 rounded-panel border border-border bg-surface-secondary px-3.5 py-2.5">
          <p className="text-[10px] font-medium tracking-[0.08em] text-text-muted uppercase">
            Inbox preview
          </p>
          <p className="mt-1 truncate text-[13px] font-bold text-text-primary">
            {subject || "No subject"}
          </p>
          <p className="truncate text-xs text-text-muted">
            {previewText || "No preview text — clients will pull the first line of the body."}
          </p>
        </div>

        <div className="mt-4 flex justify-center rounded-panel bg-background p-4">
          <div
            className={cn(
              "overflow-hidden rounded-panel border border-border bg-surface transition-[max-width]",
              width === "mobile" ? "w-full max-w-[23.5rem]" : "w-full max-w-[37.5rem]",
            )}
          >
            {blocks.map((block) => (
              <button
                key={block.id}
                type="button"
                onClick={() => setSelectedId(block.id)}
                className={cn(
                  "block w-full text-left transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                  block.id === selectedId
                    ? "bg-email-soft/50 ring-1 ring-email ring-inset"
                    : "hover:bg-surface-secondary/50",
                )}
              >
                <PreviewBlock block={block} />
              </button>
            ))}
          </div>
        </div>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
          {width === "mobile" ? (
            <Smartphone className="size-3.5" aria-hidden />
          ) : (
            <Monitor className="size-3.5" aria-hidden />
          )}
          {width === "mobile" ? "376px — iPhone width" : "600px — the email standard"}
        </p>
      </Card>

      {/* -------------------------------------------------------- Inspector */}
      <div className="space-y-4 xl:sticky xl:top-22 xl:h-max">
        {selected ? (
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                Block settings
              </p>
              <Badge tone="info">{BLOCK_META[selected.type].label}</Badge>
            </div>

            <div className="mt-3 space-y-3">
              <Field label="Content" htmlFor="block-content">
                <Textarea
                  id="block-content"
                  value={selected.content}
                  onChange={(event) =>
                    update(selected.id, { content: event.target.value })
                  }
                  className="min-h-24"
                />
              </Field>

              {["button", "image", "products"].includes(selected.type) ? (
                <Field
                  label={selected.type === "button" ? "Destination" : "Details"}
                  htmlFor="block-meta"
                  hint={
                    selected.type === "button"
                      ? "A path, a full URL, or a {{merge_tag}}."
                      : undefined
                  }
                >
                  <Input
                    id="block-meta"
                    value={selected.meta ?? ""}
                    onChange={(event) =>
                      update(selected.id, { meta: event.target.value })
                    }
                  />
                </Field>
              ) : null}

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedId(null)}
                >
                  Done
                </Button>
                {selected.type === "logo" || selected.type === "footer" ? null : (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => remove(selected.id)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ) : null}

        <Card className="p-4">
          <p className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
            Template
          </p>

          <div className="mt-3 space-y-3">
            <Field
              label="Subject line"
              htmlFor="template-subject"
              hint={`${subject.length} characters — clients truncate around 45 on mobile.`}
            >
              <Input
                id="template-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </Field>

            <Field
              label="Preview text"
              htmlFor="template-preview"
              hint="Shown after the subject. Leave it empty and the client picks its own."
            >
              <Textarea
                id="template-preview"
                value={previewText}
                onChange={(event) => setPreviewText(event.target.value)}
                className="min-h-20"
              />
            </Field>

            <div className="rounded-panel bg-surface-secondary px-3 py-2.5">
              <p className="text-[11px] text-text-secondary">
                Merge tags available:{" "}
                <code className="font-mono text-email-dark">{"{{first_name}}"}</code>,{" "}
                <code className="font-mono text-email-dark">{"{{company}}"}</code>,{" "}
                <code className="font-mono text-email-dark">{"{{order_id}}"}</code>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
