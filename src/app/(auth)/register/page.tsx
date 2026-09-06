import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Create your workspace</h1>
        <p className="text-sm text-text-muted">
          Free for your first 1,000 contacts. No card required.
        </p>
      </div>

      <form className="space-y-4">
        <Field label="Full name" htmlFor="name">
          <Input id="name" name="name" autoComplete="name" required />
        </Field>

        <Field label="Work email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>

        <Field label="Workspace name" htmlFor="workspace" hint="You can rename this later.">
          <Input id="workspace" name="workspace" required />
        </Field>

        <Field label="Password" htmlFor="password" hint="At least 8 characters, with a number and an uppercase letter.">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </Field>

        <Button type="submit" className="w-full">
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link href={APP_ROUTES.login} className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
