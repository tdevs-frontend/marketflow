"use client";

import { Bell, Menu, Search } from "lucide-react";

import { IconButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { setMobileNavOpen } from "@/redux/features/ui/uiSlice";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/utils";

export function DashboardHeader() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const unread = useAppSelector(
    (state) => state.notification.items.filter((item) => !item.read).length,
  );

  const [firstName, lastName] = (user?.name ?? "Guest User").split(" ");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur">
      <IconButton
        label="Open navigation"
        onClick={() => dispatch(setMobileNavOpen(true))}
        className="lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </IconButton>

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input placeholder="Search contacts, campaigns…" className="pl-9 h-10" aria-label="Search" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <IconButton
          label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
          className="relative"
        >
          <Bell className="h-4.5 w-4.5" />
          {unread > 0 ? (
            /* Ringed in the button's own grey, so the dot reads as a badge on
               the control rather than a white hole punched through it. */
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-secondary ring-2 ring-gray-soft" />
          ) : null}
        </IconButton>

        {/* No pill behind the whole chip — only the initials carry the grey. */}
        <div className="flex h-10 items-center gap-2">
          <span className="grid size-10 place-items-center rounded-full bg-gray text-xs font-bold text-gray-ink">
            {initials(firstName, lastName)}
          </span>
          <span className="hidden text-sm font-medium text-text-primary sm:block">
            {user?.name ?? "Guest User"}
          </span>
        </div>
      </div>
    </header>
  );
}
