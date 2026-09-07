import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to continue to your MarketFlow workspace.",
};

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl sm:text-[1.75rem]">Welcome back</h1>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        Sign in to continue to your MarketFlow workspace.
      </p>

      <LoginForm />

      <p className="mt-8 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link
          href={APP_ROUTES.register}
          className="font-medium text-primary transition-colors hover:text-primary-dark"
        >
          Create your account
        </Link>
      </p>
    </div>
  );
}
