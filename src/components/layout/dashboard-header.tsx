"use client";

import { Menu, Search } from "lucide-react";

import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_ROUTES } from "@/constants/app";
import { NotificationPopover } from "@/components/layout/notification-popover";
import { useAppDispatch } from "@/hooks/useRedux";
import { setMobileNavOpen } from "@/redux/features/ui/uiSlice";
import { useAccount } from "@/lib/account-store";
import { displayName } from "@/types/account";

/**
 * The header reads the account store, not `auth.user`.
 *
 * `auth.user` is `null` and always has been — nothing in the product dispatches
 * `setCredentials` — so this chip said "Guest User" on every screen while the
 * team directory, the audit trail and Workspace Settings all named the same
 * real person. Reading `lib/account-store` fixes both halves of that: the name
 * is right, and a photo or a name changed in Settings → Profile appears here
 * immediately, because both surfaces read one record.
 */
export function DashboardHeader() {
  const dispatch = useAppDispatch();
  const user = useAccount();

  const name = displayName(user);

  return (
    <header className="sticky top-0 z-30 flex h-18 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur">
      <IconButton
        label="Open navigation"
        onClick={() => dispatch(setMobileNavOpen(true))}
        className="lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </IconButton>

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input size="sm" placeholder="Search contacts, campaigns…" className="pl-9" aria-label="Search" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* The bell and its panel, together — the button owns the open state,
            so the trigger and the thing it opens cannot drift apart. The
            unread count moved with it, since the badge and the panel's header
            count the same list. */}
        <NotificationPopover />

        {/* A link to Profile, because that is the one thing everybody tries to
            click on a name in a header. No pill behind the whole chip — only
            the avatar carries a surface. */}
        <Link
          href={APP_ROUTES.settingsProfile}
          className="flex h-10 items-center gap-2 rounded-btn pe-1 transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
        >
          <Avatar name={name} src={user.avatarUrl ?? undefined} size="md" />
          <span className="hidden text-sm font-medium sm:block">{name}</span>
          <span className="sr-only">Open your profile settings</span>
        </Link>
      </div>
    </header>
  );
}
