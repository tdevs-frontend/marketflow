import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Welcome back</h1>
        <p className="text-sm text-text-muted">
          Sign in to your workspace to continue.
        </p>
      </div>

      <form className="space-y-4">
        <Field label="Work email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>

        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>

        <div className="flex justify-end">
          <Link
            href={APP_ROUTES.forgotPassword}
            className="text-xs text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-text-muted">
        New to MarketFlow?{" "}
        <Link href={APP_ROUTES.register} className="text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
