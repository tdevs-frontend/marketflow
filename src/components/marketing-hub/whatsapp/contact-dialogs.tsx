"use client";

import { useState } from "react";
import { MessageCircle, Pencil, Plus, X } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog, Drawer } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { APP_ROUTES } from "@/constants";
import { AGENTS } from "@/lib/marketing-fixtures";
import {
  CONTACT_STATUSES,
  CONTACT_TAGS,
  contactName,
} from "@/lib/whatsapp-fixtures";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { cn, initials } from "@/lib/utils";
import type { WhatsAppContact, WhatsAppContactStatus } from "@/types/marketing";

const STATUS_TONES: Record<WhatsAppContactStatus, BadgeTone> = {
  active: "success",
  inactive: "neutral",
  blocked: "danger",
};

export function ContactStatusBadge({ status }: { status: WhatsAppContactStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{status}</Badge>;
}

export function ContactAvatar({
  contact,
  size = "md",
}: {
  contact: WhatsAppContact;
  size?: "sm" | "md" | "lg";
}) {
  const box = { sm: "size-8 text-[10px]", md: "size-9 text-xs", lg: "size-14 text-sm" }[
    size
  ];

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-primary-soft font-bold text-primary-dark",
        box,
      )}
    >
      {initials(contact.firstName, contact.lastName)}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Details                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A drawer rather than a page: a contact is read alongside the list, and a
 * route change would lose the filters and scroll position behind it.
 */
export function ContactDetailsSheet({
  contact,
  onClose,
  onEdit,
}: {
  contact: WhatsAppContact | null;
  onClose: () => void;
  onEdit: (contact: WhatsAppContact) => void;
}) {
  const toast = useToast();
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [agent, setAgent] = useState("");

  /* Reset the local edits whenever a different contact opens. */
  const [loadedId, setLoadedId] = useState<string | null>(null);
  if (contact && contact.id !== loadedId) {
    setLoadedId(contact.id);
    setTags(contact.tags);
    setAgent(contact.assignedAgent ?? "");
    setTag("");
  }

  return (
    <Drawer
      open={Boolean(contact)}
      onClose={onClose}
      title={contact ? contactName(contact) : "Contact"}
      description={contact?.phone}
      footer={
        contact ? (
          <div className="flex flex-wrap gap-2.5">
            {/* Deep-links the inbox to this person's thread. */}
            <ButtonLink
              href={
                contact.conversationId
                  ? `${APP_ROUTES.whatsappInbox}?conversation=${contact.conversationId}`
                  : APP_ROUTES.whatsappInbox
              }
              variant="secondary"
              size="compact"
              className="flex-1"
            >
              <MessageCircle aria-hidden />
              Open Conversation
            </ButtonLink>
            <Button
              variant="outline"
              size="compact"
              onClick={() => onEdit(contact)}
            >
              <Pencil aria-hidden />
              Edit
            </Button>
          </div>
        ) : null
      }
    >
      {contact ? (
        <div className="space-y-6">
          <div className="text-center">
            <span className="mx-auto block w-fit">
              <ContactAvatar contact={contact} size="lg" />
            </span>
            <p className="mt-2.5 text-sm font-medium text-text-primary">
              {contactName(contact)}
            </p>
            {contact.email ? (
              <p className="truncate text-xs text-text-muted">{contact.email}</p>
            ) : null}
            <span className="mt-2 inline-block">
              <ContactStatusBadge status={contact.status} />
            </span>
          </div>

          <dl className="space-y-2.5 rounded-panel border border-border p-3.5 text-sm">
            {[
              { label: "Phone", value: contact.phone },
              { label: "Assigned to", value: agent || "Unassigned" },
              {
                label: "Last activity",
                value: formatRelativeTime(contact.lastActivityAt),
              },
              { label: "Created", value: formatDate(contact.createdAt) },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3">
                <dt className="text-text-secondary">{row.label}</dt>
                <dd className="truncate text-text-primary">{row.value}</dd>
              </div>
            ))}
          </dl>

          <section>
            <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
              Tags
            </h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((item) => (
                <li key={item}>
                  <Badge tone="neutral">{item}</Badge>
                </li>
              ))}
              {tags.length === 0 ? (
                <li className="text-xs text-text-muted">No tags yet.</li>
              ) : null}
            </ul>

            <div className="mt-2.5 flex gap-2">
              <Select
                label="Add tag"
                value={tag}
                onChange={setTag}
                placeholder="Choose a tag"
                options={CONTACT_TAGS.filter((item) => !tags.includes(item)).map(
                  (item) => ({ value: item, label: item }),
                )}
                className="min-w-0 flex-1"
              />
              <Button
                variant="outline"
                size="compact"
                disabled={!tag}
                onClick={() => {
                  setTags((prev) => [...prev, tag]);
                  setTag("");
                  toast("Tag added");
                }}
              >
                <Plus aria-hidden />
                Add
              </Button>
            </div>
          </section>

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

          {contact.notes ? (
            <section>
              <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                Notes
              </h3>
              <p className="mt-2 rounded-panel bg-surface-secondary px-3 py-2.5 text-[13px] text-text-secondary">
                {contact.notes}
              </p>
            </section>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}

/* -------------------------------------------------------------------------- */
/* Add / edit                                                                 */
/* -------------------------------------------------------------------------- */

interface Draft {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  tags: string[];
  status: WhatsAppContactStatus;
  assignedAgent: string;
  notes: string;
}

const EMPTY: Draft = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  tags: [],
  status: "active",
  assignedAgent: "",
  notes: "",
};

export function ContactFormDialog({
  open,
  contact,
  onClose,
}: {
  open: boolean;
  contact: WhatsAppContact | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tag, setTag] = useState("");
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  const key = contact?.id ?? (open ? "new" : null);
  if (open && key !== hydratedFor) {
    setHydratedFor(key);
    setErrors({});
    setDraft(
      contact
        ? {
            firstName: contact.firstName,
            lastName: contact.lastName,
            phone: contact.phone,
            email: contact.email ?? "",
            tags: contact.tags,
            status: contact.status,
            assignedAgent: contact.assignedAgent ?? "",
            notes: contact.notes ?? "",
          }
        : EMPTY,
    );
  }
  if (!open && hydratedFor !== null) setHydratedFor(null);

  const set = <K extends keyof Draft>(field: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  function submit() {
    const next: Record<string, string> = {};
    if (!draft.firstName.trim()) next.firstName = "Enter a first name.";
    /* WhatsApp needs an E.164 number; anything else silently fails to send. */
    if (!draft.phone.trim()) {
      next.phone = "Enter a phone number.";
    } else if (!/^\+[\d\s]{7,}$/.test(draft.phone.trim())) {
      next.phone = "Use international format, starting with +.";
    }
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
      next.email = "Enter a valid email address.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onClose();
    toast(contact ? "Contact updated successfully" : "Contact added successfully");
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={contact ? `Edit ${contactName(contact)}` : "Add contact"}
      description="Contacts must opt in before they can receive WhatsApp campaigns."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button size="compact" onClick={submit}>
            {contact ? "Save contact" : "Add contact"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First Name" htmlFor="ct-first" error={errors.firstName}>
            <Input
              id="ct-first"
              value={draft.firstName}
              error={Boolean(errors.firstName)}
              placeholder="Sarah"
              className="h-11"
              onChange={(event) => set("firstName", event.target.value)}
            />
          </Field>

          <Field label="Last Name" htmlFor="ct-last">
            <Input
              id="ct-last"
              value={draft.lastName}
              placeholder="Ahmed"
              className="h-11"
              onChange={(event) => set("lastName", event.target.value)}
            />
          </Field>

          <Field
            label="Phone"
            htmlFor="ct-phone"
            error={errors.phone}
            hint="International format, e.g. +880 1711 223344"
          >
            <Input
              id="ct-phone"
              type="tel"
              value={draft.phone}
              error={Boolean(errors.phone)}
              placeholder="+880 1711 223344"
              className="h-11"
              onChange={(event) => set("phone", event.target.value)}
            />
          </Field>

          <Field label="Email" htmlFor="ct-email" error={errors.email}>
            <Input
              id="ct-email"
              type="email"
              value={draft.email}
              error={Boolean(errors.email)}
              placeholder="sarah@brightretail.co"
              className="h-11"
              onChange={(event) => set("email", event.target.value)}
            />
          </Field>

          <Field label="Status" htmlFor="ct-status">
            <Select
              id="ct-status"
              label="Status"
              hideLabel={false}
              value={draft.status}
              onChange={(next) => set("status", next as WhatsAppContactStatus)}
              options={CONTACT_STATUSES}
            />
          </Field>

          <Field label="Assigned To" htmlFor="ct-agent">
            <Select
              id="ct-agent"
              label="Assigned To"
              hideLabel={false}
              value={draft.assignedAgent}
              onChange={(next) => set("assignedAgent", next)}
              options={[
                { value: "", label: "Unassigned" },
                ...AGENTS.map((name) => ({ value: name, label: name })),
              ]}
            />
          </Field>
        </div>

        <div>
          <p className="text-sm font-medium text-text-primary">Tags</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {draft.tags.map((item) => (
              <li key={item}>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary py-0.5 pr-1 pl-2.5 text-xs text-text-secondary">
                  {item}
                  <button
                    type="button"
                    aria-label={`Remove ${item}`}
                    onClick={() =>
                      set(
                        "tags",
                        draft.tags.filter((value) => value !== item),
                      )
                    }
                    className="grid size-4 place-items-center rounded-full text-text-muted transition-colors hover:text-error focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              </li>
            ))}
            {draft.tags.length === 0 ? (
              <li className="text-xs text-text-muted">No tags yet.</li>
            ) : null}
          </ul>

          <div className="mt-2.5 flex gap-2">
            <Select
              label="Add tag"
              value={tag}
              onChange={setTag}
              placeholder="Choose a tag"
              options={CONTACT_TAGS.filter((item) => !draft.tags.includes(item)).map(
                (item) => ({ value: item, label: item }),
              )}
              className="min-w-0 flex-1"
            />
            <Button
              variant="outline"
              size="compact"
              disabled={!tag}
              onClick={() => {
                set("tags", [...draft.tags, tag]);
                setTag("");
              }}
            >
              <Plus aria-hidden />
              Add
            </Button>
          </div>
        </div>

        <Field label="Notes" htmlFor="ct-notes">
          <Textarea
            id="ct-notes"
            value={draft.notes}
            rows={3}
            placeholder="Anything the team should know before replying."
            onChange={(event) => set("notes", event.target.value)}
          />
        </Field>
      </div>
    </Dialog>
  );
}
