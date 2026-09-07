import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth";
import { LogoMark } from "@/components/ui/logo";
import { APP_ROUTES } from "@/constants";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to continue to your MarketFlow workspace.",
};

export default function LoginPage() {
  return (
    <div>
      {/* Only at `lg`, where the brand panel is showing and the card has no
          lockup above it to answer "what am I signing in to". */}
      <LogoMark size={34} priority className="mb-6 hidden lg:block" />

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
