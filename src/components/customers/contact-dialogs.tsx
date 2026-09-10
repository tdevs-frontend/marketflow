"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  CONTACT_SOURCES,
  CUSTOMER_TAGS,
  LIFECYCLES,
  contactName,
  type ContactSource,
  type CustomerContact,
  type Lifecycle,
} from "@/lib/customer-fixtures";
import { SEGMENTS } from "@/lib/segment-fixtures";
import { formatNumber } from "@/lib/format";
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
        For <span className="font-medium text-text-primary">{contactName(contacts[0])}</span>.
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
/* Add contact                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The one create form in the module.
 *
 * Deliberately short: name, one way to reach them, and where they came from.
 * Everything else the CRM tracks is either derived (lifetime value, stage) or
 * added later from the drawer, and a create form that asks for twelve fields
 * is a create form nobody finishes.
 */
export function ContactFormDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (name: string) => void;
}) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [lifecycle, setLifecycle] = useState<Lifecycle>("subscriber");
  const [source, setSource] = useState<ContactSource>("manual");
  const [submitted, setSubmitted] = useState(false);

  /*
   * Reset when the dialog opens, so a cancelled draft never reappears.
   *
   * Adjusted during render rather than in an effect: an effect would paint the
   * stale draft for one frame before clearing it, and the lint rule that
   * forbids `setState` in an effect is pointing at exactly that bug.
   */
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setFirst("");
      setLast("");
      setEmail("");
      setPhone("");
      setLifecycle("subscriber");
      setSource("manual");
      setSubmitted(false);
    }
  }

  const nameMissing = first.trim().length === 0;
  const reachMissing = email.trim().length === 0 && phone.trim().length === 0;
  const invalid = nameMissing || reachMissing;

  function submit() {
    setSubmitted(true);
    if (invalid) return;
    onSaved(`${first.trim()} ${last.trim()}`.trim());
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add contact"
      description="Create one contact by hand. Use Import CSV for a list."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Add contact</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="First name"
            htmlFor="contact-first"
            error={submitted && nameMissing ? "A first name is required." : undefined}
          >
            <Input
              id="contact-first"
              value={first}
              error={submitted && nameMissing}
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

        <Field
          label="Email"
          htmlFor="contact-email"
          hint="Email or phone — at least one, so the contact is reachable."
          error={
            submitted && reachMissing ? "Add an email or a phone number." : undefined
          }
        >
          <Input
            id="contact-email"
            type="email"
            value={email}
            error={submitted && reachMissing}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="sarah@brightretail.co"
          />
        </Field>

        <Field label="Phone" htmlFor="contact-phone">
          <Input
            id="contact-phone"
            value={phone}
            error={submitted && reachMissing}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+971 50 118 4420"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
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
            Add {picked.length ? `${picked.length} tag${picked.length === 1 ? "" : "s"}` : "tags"}
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
 * Add contacts to a static segment.
 *
 * Dynamic segments are excluded and say why. Their membership is the result of
 * their rules, so hand-adding someone would either be silently reverted on the
 * next evaluation or quietly corrupt the rule's meaning — both worse than not
 * offering it.
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

  const target = SEGMENTS.find((segment) => segment.id === picked);

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
            onClick={() => target && onApply(target.name, contacts?.length ?? 0)}
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
            {SEGMENTS.filter((segment) => !segment.system).map((segment) => {
              const dynamic = segment.rules.length > 0;

              return (
                <li key={segment.id}>
                  <button
                    type="button"
                    disabled={dynamic}
                    onClick={() => setPicked(segment.id)}
                    className="flex w-full items-start gap-3 rounded-btn px-2.5 py-2.5 text-left transition-colors hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55 aria-pressed:bg-primary-soft"
                    aria-pressed={picked === segment.id}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-text-primary">
                        {segment.name}
                      </span>
                      <span className="block truncate text-xs text-text-muted">
                        {formatNumber(segment.contacts)} contacts
                        {dynamic ? " · rule-based, membership is computed" : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="text-[11px] text-text-muted">
            Rule-based segments cannot take contacts by hand — edit their rules on
            the Segments page instead.
          </p>
        </div>
      ) : null}
    </Dialog>
  );
}
