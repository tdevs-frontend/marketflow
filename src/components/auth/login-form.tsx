"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/ui/brand-icon";
import { Field, Input } from "@/components/ui/input";
import { APP_ROUTES } from "@/constants";

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

type Errors = { email?: string; password?: string };

/**
 * Deliberately loose. The server is the only thing that can actually tell a
 * real address from a well-formed one, so this catches typos and nothing else
 * — a stricter pattern here only ever locks out a valid address.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): Errors {
  const errors: Errors = {};

  if (!email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "Enter a valid email address, like you@company.com.";
  }

  /* No length or complexity rule on sign-in: the password either matches the
     stored one or it does not, and hinting at its shape helps nobody. */
  if (!password) {
    errors.password = "Enter your password.";
  }

  return errors;
}

/* -------------------------------------------------------------------------- */
/* Form                                                                       */
/* -------------------------------------------------------------------------- */

type Pending = "credentials" | "google" | null;

/**
 * NOTE — the network call is stubbed.
 *
 * `signIn` and `signInWithGoogle` below are the two seams: replace their bodies
 * with the real mutation and dispatch `setCredentials` / `setAuthError` from
 * `redux/features/auth/authSlice`. Everything around them — validation, focus
 * management, the busy and error states — is already wired for a real request.
 */
export function LoginForm() {
  const router = useRouter();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  /**
   * Validation stays quiet until the first submit, then tracks every keystroke.
   * Complaining about an incomplete address while it is still being typed is
   * the single most annoying thing a sign-in form can do.
   */
  const [liveValidation, setLiveValidation] = useState(false);

  const isPending = pending !== null;

  function revalidate(nextEmail: string, nextPassword: string) {
    if (liveValidation) setErrors(validate(nextEmail, nextPassword));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    setLiveValidation(true);
    setFormError(null);

    const nextErrors = validate(email, password);
    setErrors(nextErrors);

    /* Send focus to the first field that failed, so keyboard and screen-reader
       users land on the problem instead of hunting for it. */
    if (nextErrors.email || nextErrors.password) {
      (nextErrors.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setPending("credentials");

    try {
      // TODO: swap for the real sign-in mutation.
      await new Promise((resolve) => setTimeout(resolve, 900));
      router.push(APP_ROUTES.dashboard);
      /* Left pending on purpose — the button stays busy through the route
         change rather than flicking back to its resting state. */
    } catch {
      setFormError(
        "We could not sign you in. Check your email and password, then try again.",
      );
      setPending(null);
    }
  }

  async function handleGoogle() {
    if (isPending) return;

    setFormError(null);
    setPending("google");

    try {
      // TODO: swap for the OAuth redirect.
      await new Promise((resolve) => setTimeout(resolve, 900));
      router.push(APP_ROUTES.dashboard);
    } catch {
      setFormError("We could not reach Google. Try again in a moment.");
      setPending(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8">
      {/* `disabled` on the fieldset reaches every control inside it, including
          the buttons, so the busy state needs no per-control bookkeeping. */}
      <fieldset disabled={isPending} className="space-y-5">
        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-panel border border-error/25 bg-error-soft px-3.5 py-3 text-sm text-error-text"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{formError}</span>
          </div>
        ) : null}

        <Field label="Email address" htmlFor="email" error={errors.email}>
          <Input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Enter your email address"
            className="h-12"
            error={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              revalidate(event.target.value, password);
            }}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password}>
          <div className="relative">
            <Input
              ref={passwordRef}
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="h-12 pr-12"
              error={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                revalidate(email, event.target.value);
              }}
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              aria-controls="password"
              className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-field text-text-muted transition-colors hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60"
            >
              {showPassword ? (
                <EyeOff className="size-4.5" aria-hidden />
              ) : (
                <Eye className="size-4.5" aria-hidden />
              )}
            </button>
          </div>
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <label
            htmlFor="remember"
            className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-text-secondary select-none"
          >
            <input
              id="remember"
              name="remember"
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="size-4 accent-primary focus-visible:shadow-focus focus-visible:outline-none"
            />
            Remember me
          </label>

          <Link
            href={APP_ROUTES.forgotPassword}
            className="text-sm font-medium text-primary transition-colors hover:text-primary-dark"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full">
          {pending === "credentials" ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Signing in…
            </>
          ) : (
            "Sign In"
          )}
        </Button>

        <div className="flex items-center gap-4">
          <span aria-hidden className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-medium tracking-[0.14em] text-text-muted uppercase">
            or
          </span>
          <span aria-hidden className="h-px flex-1 bg-border" />
        </div>

        {/* `btn-google` lives in `styles/globals.css` — same look as the
            outline button, on its own class. */}
        <button type="button" className="btn-google" onClick={handleGoogle}>
          {pending === "google" ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <GoogleIcon />
          )}
          Continue with Google
        </button>
      </fieldset>

      {/* Announces the busy state to screen readers, which otherwise get no
          signal that anything happened when the button label changes. */}
      <p role="status" aria-live="polite" className="sr-only">
        {isPending ? "Signing in, please wait." : ""}
      </p>
    </form>
  );
}
