import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Reset your password</h1>
        <p className="text-sm text-text-muted">
          We&apos;ll email you a link to choose a new one.
        </p>
      </div>

      <form className="space-y-4">
        <Field label="Work email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>

        <Button type="submit" className="w-full">
          Send reset link
        </Button>
      </form>

      <p className="text-center text-sm text-text-muted">
        <Link href={APP_ROUTES.login} className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
