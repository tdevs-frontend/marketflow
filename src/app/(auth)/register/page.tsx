import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-[1.75rem]">Create your workspace</h1>
        <p className="text-sm leading-relaxed text-text-secondary">
          Free for your first 1,000 contacts. No card required.
        </p>
      </div>

      <form className="space-y-5">
        <Field label="Full name" htmlFor="name">
          <Input className="h-12" id="name" name="name" autoComplete="name" required />
        </Field>

        <Field label="Work email" htmlFor="email">
          <Input className="h-12" id="email" name="email" type="email" autoComplete="email" required />
        </Field>

        <Field label="Workspace name" htmlFor="workspace" hint="You can rename this later.">
          <Input className="h-12" id="workspace" name="workspace" required />
        </Field>

        <Field label="Password" htmlFor="password" hint="At least 8 characters, with a number and an uppercase letter.">
          <Input className="h-12"
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </Field>

        <Button type="submit" size="lg" className="w-full">
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link href={APP_ROUTES.login} className="text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
