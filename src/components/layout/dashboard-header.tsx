"use client";

import { Menu, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { NotificationPopover } from "@/components/layout/notification-popover";
import { UserMenu } from "@/components/layout/user-menu";
import { useAppDispatch } from "@/hooks/useRedux";
import { setMobileNavOpen } from "@/redux/features/ui/uiSlice";

/**
 * The dashboard's top bar: navigation toggle, search, the notification bell
 * and the account menu.
 *
 * The last two own their own state and their own data - `NotificationPopover`
 * reads the feed, `UserMenu` reads the account store - so this component holds
 * neither. It used to read the account itself to render the name beside the
 * avatar; that chip is `UserMenu`'s trigger now, and the record follows it.
 *
 * Worth keeping in mind for both: they read `lib/account-store`, not
 * `auth.user`. `auth.user` is `null` and always has been - nothing in the
 * product dispatches `setCredentials` - so the chip said "Guest User" on every
 * screen while the team directory, the audit trail and Workspace Settings all
 * named the same real person.
 */
export function DashboardHeader() {
  const dispatch = useAppDispatch();

  return (
    <header className="sticky top-0 z-30 flex h-18 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => dispatch(setMobileNavOpen(true))}
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-btn bg-black/7 text-text-primary transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:shadow-focus lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          size="sm"
          placeholder="Search contacts, campaigns…"
          className="pl-9"
          aria-label="Search"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* The bell and its panel, together - the button owns the open state,
            so the trigger and the thing it opens cannot drift apart. The
            unread count moved with it, since the badge and the panel's header
            count the same list. */}
        <NotificationPopover />

        {/* The same chip as before - avatar, name, same height and hover - now
            opening the account menu rather than going straight to Profile.
            Profile is still one click away: it is the block at the top of the
            menu and the first row under it. */}
        <UserMenu />
      </div>
    </header>
  );
}
