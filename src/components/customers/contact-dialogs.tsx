"use client";

import { useState } from "react";
import { Mail, MessageCircle, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  CONSENT_CHANNELS,
  CONTACT_SOURCES,
  CONTACT_STATUSES,
  CUSTOMER_SEGMENTS,
  CUSTOMER_TAGS,
  LIFECYCLES,
  OWNERS,
  contactName,
  segmentById,
  segmentMembers,
  type ContactSource,
  type CustomerContact,
  type Lifecycle,
} from "@/lib/customer-fixtures";
import { formatNumber } from "@/lib/format";
import type { ContactChannel, ContactStatus } from "@/types/contact";
import { cn } from "@/lib/utils";
import { TagDot } from "./customer-badges";

/**
 * How many people a bulk dialog is about, said once at the top.
 *
 * The alternative is putting the count in the title, which then has to be
 * pluralised in three places. One line, one sentence, every dialog.
 */
function Scope({ contacts }: { contacts: CustomerContact[] }) {
  if (contacts.length === 1) {
    return (
      <p className="text-[13px] text-text-secondary">
        For{" "}
        <span className="font-medium text-text-primary">
          {contactName(contacts[0])}
        </span>
        .
      </p>
    );
  }

  return (
    <p className="text-[13px] text-text-secondary">
      For{" "}
      <span className="font-medium text-text-primary">
        {contacts.length} selected contacts
      </span>
      .
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Add / edit contact                                                         */
/* -------------------------------------------------------------------------- */

/* Deliberately permissive: enough to catch a typo, not enough to reject a
   valid address. Anything stricter here rejects real people. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Digits, spaces and the usual punctuation, 7–20 characters. International
   numbers vary far too much to validate a format. */
const PHONE_RE = /^[+()\d][\d\s()+-]{6,19}$/;

const CONSENT_ICON: Record<ContactChannel, typeof Mail> = {
  whatsapp: MessageCircle,
  email: Mail,
  sms: Smartphone,
};

/**
 * The module's one contact form, used for both create and edit.
 *
 * One component rather than two because the fields, the validation and the
 * consent block are identical and only the title, the button and the initial
 * values differ — two copies is how "Add" gains a field that "Edit" silently
 * drops.
 *
 * Validation runs on submit and the dialog stays open on failure, which is the
 * brief's explicit requirement: a modal that closes on invalid input throws
 * away everything typed. Errors are per-field and announced through `Field`'s
 * `error`, which wires `aria-describedby` for us.
 */
export function ContactFormDialog({
  open,
  contact,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** Present when editing; absent when creating. */
  contact: CustomerContact | null;
  onClose: () => void;
  onSaved: (name: string, wasEdit: boolean) => void;
}) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<ContactStatus>("active");
  const [lifecycle, setLifecycle] = useState<Lifecycle>("subscriber");
  const [source, setSource] = useState<ContactSource>("manual");
  const [owner, setOwner] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [segments, setSegments] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState<ContactChannel[]>([]);
  const [submitted, setSubmitted] = useState(false);

  /*
   * Load the subject during render rather than in an effect.
   *
   * Keyed on the contact's id — or `"new"` when creating — so opening the
   * dialog for a different contact reloads the fields while a re-render for
   * the same one keeps whatever has been typed. An effect would paint the
   * previous contact's values for a frame first.
   */
  const subject = open ? (contact?.id ?? "new") : null;
  const [lastSubject, setLastSubject] = useState(subject);
  if (subject !== lastSubject) {
    setLastSubject(subject);
    setFirst(contact?.firstName ?? "");
    setLast(contact?.lastName ?? "");
    setEmail(contact?.email ?? "");
    setPhone(contact?.phone ?? "");
    setCompany(contact?.company ?? "");
    setStatus(contact?.status ?? "active");
    setLifecycle(contact?.lifecycle ?? "subscriber");
    setSource(contact?.source ?? "manual");
    setOwner(contact?.ownerId ?? "");
    setTags(contact?.tags ?? []);
    setSegments(contact?.segmentIds ?? []);
    setNotes("");
    setConsent(contact?.optedInChannels ?? []);
    setSubmitted(false);
  }

  const errors = {
    first: first.trim().length === 0 ? "A first name is required." : null,
    reach:
      email.trim().length === 0 && phone.trim().length === 0
        ? "Add an email or a phone number so the contact is reachable."
        : null,
    email:
      email.trim().length > 0 && !EMAIL_RE.test(email.trim())
        ? "That does not look like an email address."
        : null,
    phone:
      phone.trim().length > 0 && !PHONE_RE.test(phone.trim())
        ? "Use digits, spaces and + ( ) - only."
        : null,
  };

  const invalid = Object.values(errors).some(Boolean);
  const show = (key: keyof typeof errors) =>
    submitted ? (errors[key] ?? undefined) : undefined;

  function submit() {
    setSubmitted(true);
    /* Stays open on failure — nothing typed is thrown away. */
    if (invalid) return;
    onSaved(`${first.trim()} ${last.trim()}`.trim(), Boolean(contact));
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={contact ? "Edit contact" : "Add contact"}
      description={
        contact
          ? "Changes apply everywhere this contact appears."
          : "Create one contact by hand. Use Import contacts for a list."
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>
            {contact ? "Save changes" : "Add contact"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="First name"
            htmlFor="contact-first"
            error={show("first")}
          >
            <Input
              id="contact-first"
              value={first}
              error={Boolean(show("first"))}
              onChange={(event) => setFirst(event.target.value)}
              placeholder="Sarah"
            />
          </Field>

          <Field label="Last name" htmlFor="contact-last">
            <Input
              id="contact-last"
              value={last}
              onChange={(event) => setLast(event.target.value)}
              placeholder="Ahmed"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Email"
            htmlFor="contact-email"
            error={show("email") ?? show("reach")}
          >
            <Input
              id="contact-email"
              type="email"
              value={email}
              error={Boolean(show("email") ?? show("reach"))}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="sarah@brightretail.co"
            />
          </Field>

          <Field label="Phone" htmlFor="contact-phone" error={show("phone")}>
            <Input
              id="contact-phone"
              value={phone}
              error={Boolean(show("phone") ?? show("reach"))}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+971 50 118 4420"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company" htmlFor="contact-company">
            <Input
              id="contact-company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Bright Retail"
            />
          </Field>

          <Field label="Owner" htmlFor="contact-owner">
            <Select
              id="contact-owner"
              hideLabel
              label="Owner"
              value={owner || "none"}
              onChange={(next) => setOwner(next === "none" ? "" : next)}
              options={[
                { value: "none", label: "Unassigned" },
                ...OWNERS.map((item) => ({ value: item.id, label: item.name })),
              ]}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Status" htmlFor="contact-status">
            <Select
              id="contact-status"
              hideLabel
              label="Status"
              value={status}
              onChange={(next) => setStatus(next as ContactStatus)}
              options={CONTACT_STATUSES}
            />
          </Field>

          <Field label="Lifecycle stage" htmlFor="contact-stage">
            <Select
              id="contact-stage"
              hideLabel
              label="Lifecycle stage"
              value={lifecycle}
              onChange={(next) => setLifecycle(next as Lifecycle)}
              options={LIFECYCLES}
            />
          </Field>

          <Field label="Source" htmlFor="contact-source">
            <Select
              id="contact-source"
              hideLabel
              label="Source"
              value={source}
              onChange={(next) => setSource(next as ContactSource)}
              options={CONTACT_SOURCES}
            />
          </Field>
        </div>

        {/*
         * Consent is its own block with its own heading, because it is the one
         * section here with legal weight. Folded in beside "Company" it reads
         * as another preference; on its own it reads as a permission.
         */}
        <fieldset className="rounded-panel border border-border p-3.5">
          <legend className="px-1 text-sm font-medium text-text-primary">
            Consent
          </legend>
          <p className="text-xs text-text-muted">
            Only channels with consent can be used for marketing messages.
          </p>

          <div className="mt-3 space-y-1">
            {CONSENT_CHANNELS.map((channel) => {
              const Icon = CONSENT_ICON[channel.value];
              const granted = consent.includes(channel.value);

              return (
                <label
                  key={channel.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-btn px-2 py-2 transition-colors hover:bg-surface-secondary"
                >
                  <Checkbox
                    checked={granted}
                    onCheckedChange={(checked) =>
                      setConsent((prev) =>
                        checked
                          ? [...prev, channel.value]
                          : prev.filter((item) => item !== channel.value),
                      )
                    }
                    label={`${channel.label} consent`}
                  />
                  <Icon
                    className="size-4 shrink-0 text-text-muted"
                    aria-hidden
                  />
                  <span className="flex-1 text-[13px] text-text-secondary">
                    {channel.label} consent
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Field label="Tags" htmlFor="contact-tags" hint="Applied on save.">
          <div id="contact-tags" className="flex flex-wrap gap-1.5">
            {CUSTOMER_TAGS.map((tag) => {
              const picked = tags.includes(tag.name);

              return (
                <button
                  key={tag.id}
                  type="button"
                  aria-pressed={picked}
                  onClick={() =>
                    setTags((prev) =>
                      picked
                        ? prev.filter((name) => name !== tag.name)
                        : [...prev, tag.name],
                    )
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                    picked
                      ? "border-primary bg-primary-soft text-primary-dark"
                      : "border-border text-text-secondary hover:border-border-strong",
                  )}
                >
                  <TagDot color={tag.color} />
                  {tag.name}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Segments" htmlFor="contact-segments">
          <div id="contact-segments" className="space-y-1">
            {/* Only static segments: a dynamic one cannot be joined by hand,
                its rules decide. */}
            {CUSTOMER_SEGMENTS.filter(
              (segment) => !segment.system && segment.type === "static",
            )
              .slice(0, 4)
              .map((segment) => (
                <label
                  key={segment.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-btn px-2 py-1.5 transition-colors hover:bg-surface-secondary"
                >
                  <Checkbox
                    checked={segments.includes(segment.id)}
                    onCheckedChange={(checked) =>
                      setSegments((prev) =>
                        checked
                          ? [...prev, segment.id]
                          : prev.filter((id) => id !== segment.id),
                      )
                    }
                    label={`Add to ${segment.name}`}
                  />
                  <span className="flex-1 truncate text-[13px] text-text-secondary">
                    {segment.name}
                  </span>
                  <span className="text-[11px] text-text-muted tabular-nums">
                    {formatNumber(segmentMembers(segment).length)}
                  </span>
                </label>
              ))}
            <p className="px-2 text-[11px] text-text-muted">
              Only manual segments are listed — rule-based membership is
              computed.
            </p>
          </div>
        </Field>

        <Field label="Notes" htmlFor="contact-notes">
          <Textarea
            id="contact-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Anything the next person should know before contacting them."
          />
        </Field>
      </div>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Tag picker                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Apply existing tags to one contact or to a selection.
 *
 * It only offers tags that already exist. Creating a tag inline is how a tag
 * list grows three spellings of "Wholesale"; new tags are made on the Tags
 * page, where their colour and description are set deliberately.
 */
export function TagPickerDialog({
  contacts,
  onClose,
  onApply,
}: {
  contacts: CustomerContact[] | null;
  onClose: () => void;
  onApply: (names: string[], count: number) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);

  /* Keyed on the subject, so reopening for a different selection starts
     empty while a re-render for the same one keeps the ticks. */
  const subject = contacts?.map((item) => item.id).join(",") ?? null;
  const [lastSubject, setLastSubject] = useState(subject);
  if (subject !== lastSubject) {
    setLastSubject(subject);
    setPicked([]);
  }

  return (
    <Dialog
      open={Boolean(contacts)}
      onClose={onClose}
      title="Add tags"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={picked.length === 0}
            onClick={() => onApply(picked, contacts?.length ?? 0)}
          >
            Add{" "}
            {picked.length
              ? `${picked.length} tag${picked.length === 1 ? "" : "s"}`
              : "tags"}
          </Button>
        </>
      }
    >
      {contacts ? (
        <div className="space-y-4">
          <Scope contacts={contacts} />

          <ul className="space-y-1">
            {CUSTOMER_TAGS.map((tag) => (
              <li key={tag.id}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-btn px-2 py-2 transition-colors hover:bg-surface-secondary">
                  <Checkbox
                    checked={picked.includes(tag.name)}
                    onCheckedChange={(checked) =>
                      setPicked((prev) =>
                        checked
                          ? [...prev, tag.name]
                          : prev.filter((name) => name !== tag.name),
                      )
                    }
                    label={`Add ${tag.name}`}
                  />
                  <TagDot color={tag.color} />
                  <span className="flex-1 text-[13px] font-medium text-text-primary">
                    {tag.name}
                  </span>
                  {tag.description ? (
                    <span className="hidden max-w-56 truncate text-xs text-text-muted sm:block">
                      {tag.description}
                    </span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Segment picker                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Add contacts to a manual segment.
 *
 * Rule-based segments are excluded and say why. Their membership is the result
 * of their rules, so hand-adding someone would either be silently reverted on
 * the next evaluation or quietly corrupt the rule's meaning — both worse than
 * not offering it.
 */
export function SegmentPickerDialog({
  contacts,
  onClose,
  onApply,
}: {
  contacts: CustomerContact[] | null;
  onClose: () => void;
  onApply: (name: string, count: number) => void;
}) {
  const [picked, setPicked] = useState<string>("");

  const subject = contacts?.map((item) => item.id).join(",") ?? null;
  const [lastSubject, setLastSubject] = useState(subject);
  if (subject !== lastSubject) {
    setLastSubject(subject);
    setPicked("");
  }

  const target = segmentById(picked);

  return (
    <Dialog
      open={Boolean(contacts)}
      onClose={onClose}
      title="Add to segment"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!target}
            onClick={() =>
              target && onApply(target.name, contacts?.length ?? 0)
            }
          >
            Add to segment
          </Button>
        </>
      }
    >
      {contacts ? (
        <div className="space-y-4">
          <Scope contacts={contacts} />

          <ul className="space-y-1">
            {CUSTOMER_SEGMENTS.filter((segment) => !segment.system).map(
              (segment) => {
                const dynamic = segment.type === "dynamic";

                return (
                  <li key={segment.id}>
                    <button
                      type="button"
                      disabled={dynamic}
                      onClick={() => setPicked(segment.id)}
                      aria-pressed={picked === segment.id}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-btn px-2.5 py-2.5 text-left transition-colors focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55",
                        picked === segment.id
                          ? "bg-primary-soft"
                          : "hover:bg-surface-secondary",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-text-primary">
                          {segment.name}
                        </span>
                        <span className="block truncate text-xs text-text-muted">
                          {formatNumber(segmentMembers(segment).length)}{" "}
                          contacts
                          {dynamic
                            ? " · rule-based, membership is computed"
                            : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              },
            )}
          </ul>

          <p className="text-[11px] text-text-muted">
            Rule-based segments cannot take contacts by hand — edit their rules
            on the Segments page instead.
          </p>
        </div>
      ) : null}
    </Dialog>
  );
}
