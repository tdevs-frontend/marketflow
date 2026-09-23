"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Send } from "lucide-react";

import { BrandIcon } from "@/components/ui/brand-icon";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox";
import { Field, Input, Textarea } from "@/components/ui/input";
import { footerSocials } from "@/constants";
import { SectionEyebrow } from "@/components/marketing/section-eyebrow";

/**
 * The message form, under the three contact cards.
 *
 * Two columns: what writing in gets you on the left, the form on the right.
 * The left column is the page's only place to say what happens after the
 * send - who reads it and how long it takes - and a form whose reader cannot
 * tell whether anyone is on the other end is a form that does not get filled
 * in.
 *
 * Built from the product's own field primitives - `Field`, `Input`,
 * `Textarea`, `CheckboxField`, `Button` - rather than hand-styled inputs, so
 * the focus ring, the error state, the disabled state and the field heights
 * are the ones every other form in MarketFlow has. That is also what makes
 * the validation behave: the first failed field takes focus, errors are tied
 * to their inputs by `aria-describedby`, and the whole set is disabled by one
 * `fieldset` while a send is in flight.
 *
 * The socials are `footerSocials` - the same four accounts and the same URLs
 * the footer links to, drawn with `BrandIcon`, because Lucide has no brand
 * marks and a second list here would be a second set of links to keep right.
 *
 * The submit is simulated, exactly as `LoginForm`'s is, and marked with the
 * same TODO. Nothing is posted anywhere yet.
 */

interface Errors {
  name?: string;
  email?: string;
  message?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(name: string, email: string, message: string): Errors {
  const errors: Errors = {};

  if (!name.trim()) errors.name = "Tell us who you are.";

  if (!email.trim()) errors.email = "We need an address to reply to.";
  else if (!EMAIL.test(email.trim()))
    errors.email = "That does not look like an email address.";

  if (!message.trim()) errors.message = "Tell us what you need.";
  else if (message.trim().length < 10)
    errors.message =
      "A sentence or two, so we can route it to the right person.";

  return errors;
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [updates, setUpdates] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  /* Errors appear on the first submit and track the fields after it - a field
     that reds out while it is still being typed into is a field that scolds. */
  const [liveValidation, setLiveValidation] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  function revalidate(next: {
    name?: string;
    email?: string;
    message?: string;
  }) {
    if (!liveValidation) return;
    setErrors(
      validate(next.name ?? name, next.email ?? email, next.message ?? message),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setLiveValidation(true);
    setFormError(null);

    const nextErrors = validate(name, email, message);
    setErrors(nextErrors);

    /* Focus the first failed field, so keyboard users land on the problem. */
    if (nextErrors.name || nextErrors.email || nextErrors.message) {
      (nextErrors.name
        ? nameRef
        : nextErrors.email
          ? emailRef
          : messageRef
      ).current?.focus();
      return;
    }

    setPending(true);

    try {
      // TODO: swap for the real contact mutation.
      await new Promise((resolve) => setTimeout(resolve, 900));
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
      setUpdates(false);
      setErrors({});
      setLiveValidation(false);
    } catch {
      setFormError(
        "We could not send that. Try again, or email support@marketflow.app.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      aria-labelledby="contact-form-title"
      className="section-space-py bg-background"
    >
      <div className="custom-container">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          {/* ------------------------------------------------------ left */}
          <div className="pt-2">
            <SectionEyebrow text="Contact us" icon={Send} />

            <h2
              id="contact-form-title"
              className="section-title mt-5 max-w-xl text-balance"
            >
              Feel free to get in touch{" "}
              <span className="brand-gradient-text">with the team</span>
            </h2>

            <p className="section-subtitle max-w-xl">
              Comparing platforms, planning a migration, or stuck halfway
              through a setup write to us and a person answers. Support replies
              within one business day; ask for sales and we will walk you
              through a live workspace instead.
            </p>

            <h3 className="mt-8 text-base font-semibold text-text-primary">
              Follow us here:
            </h3>

            <ul className="mt-4 flex items-center gap-2">
              {footerSocials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.label}
                    className="grid size-10 place-items-center rounded-full bg-primary-soft border text-text-secondary transition-colors hover:bg-primary hover:text-white focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <BrandIcon name={social.icon} className="size-4.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ------------------------------------------------------ form */}
          <div className="rounded-card border border-border bg-surface p-5 shadow-card md:p-6">
            <h3 className="text-2xl font-bold text-text-primary">
              Send us a message
            </h3>

            {sent ? (
              /* The form is replaced rather than topped with a banner: the
                 thing to read now is the confirmation, not the empty fields
                 under it. `role="status"` announces it without stealing
                 focus. */
              <div
                role="status"
                className="mt-5 rounded-panel bg-success-soft p-6 text-center"
              >
                <CheckCircle2
                  className="mx-auto size-8 text-success"
                  aria-hidden
                />
                <p className="mt-3 text-base font-semibold text-text-primary">
                  Message received
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                  Someone from the team replies within one business day. Urgent?
                  Email{" "}
                  <a
                    href="mailto:support@marketflow.app"
                    className="font-semibold text-primary hover:text-primary-dark"
                  >
                    support@marketflow.app
                  </a>
                  .
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-5"
                  onClick={() => setSent(false)}
                >
                  Send another
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="mt-5">
                {/* `disabled` here reaches every control inside, button
                    included, so nothing is touchable mid-send. */}
                <fieldset disabled={pending} className="space-y-5">
                  <Field
                    label="Name"
                    htmlFor="contact-name"
                    error={errors.name}
                  >
                    <Input
                      id="contact-name"
                      ref={nameRef}
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        revalidate({ name: event.target.value });
                      }}
                      error={Boolean(errors.name)}
                      aria-describedby={
                        errors.name ? "contact-name-error" : undefined
                      }
                      autoComplete="name"
                    />
                  </Field>

                  <Field
                    label="Email"
                    htmlFor="contact-email"
                    error={errors.email}
                  >
                    <Input
                      id="contact-email"
                      ref={emailRef}
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        revalidate({ email: event.target.value });
                      }}
                      error={Boolean(errors.email)}
                      aria-describedby={
                        errors.email ? "contact-email-error" : undefined
                      }
                      autoComplete="email"
                    />
                  </Field>

                  <Field
                    label="Message"
                    htmlFor="contact-message"
                    error={errors.message}
                  >
                    <Textarea
                      id="contact-message"
                      ref={messageRef}
                      rows={5}
                      value={message}
                      onChange={(event) => {
                        setMessage(event.target.value);
                        revalidate({ message: event.target.value });
                      }}
                      error={Boolean(errors.message)}
                      aria-describedby={
                        errors.message ? "contact-message-error" : undefined
                      }
                    />
                  </Field>

                  <CheckboxField
                    id="contact-updates"
                    checked={updates}
                    onCheckedChange={setUpdates}
                    label="Send me MarketFlow product updates."
                    hint="Occasional release notes. Unsubscribe from any of them."
                  />

                  {formError ? (
                    <p role="alert" className="text-sm font-medium text-error">
                      {formError}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    size="lg"
                    className="group w-full sm:w-auto"
                  >
                    {pending ? "Sending…" : "Send message"}
                    <ArrowRight
                      className="size-4 transition-[translate] group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                      aria-hidden
                    />
                  </Button>
                </fieldset>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
