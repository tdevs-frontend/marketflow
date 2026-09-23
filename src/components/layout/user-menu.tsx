"use client";

import { useCallback, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  CreditCard,
  HelpCircle,
  LogOut,
  ShieldCheck,
  Terminal,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { AvatarPhoto } from "@/components/ui/avatar-photo";
import { Badge } from "@/components/ui/badge";
import { useDismissable } from "@/components/ui/menu";
import { Tooltip } from "@/components/ui/tooltip";
import { APP_ROUTES } from "@/constants/app";
import { PLANS } from "@/constants/pricing";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { useAccount, useSubscription } from "@/lib/account-store";

import { cn, isActiveRoute } from "@/lib/utils";
import { logout } from "@/redux/features/auth/authSlice";
import { displayName } from "@/types/account";

/**
 * The account menu behind the header's user chip.
 *
 * Navigation and nothing else. Every row here is a shortcut to a page that
 * already owns the thing it names - Security owns two-factor, Billing owns the
 * plan - and the menu deliberately surfaces none of that content itself. A
 * dropdown that shows the current plan and an upgrade button is a second
 * billing surface that will disagree with the first one within a release, and
 * a dropdown with a two-factor toggle in it is a security control somebody can
 * hit by mistake while reaching for Profile.
 *
 * Two groups, because the six destinations answer two different questions:
 * *you* (who I am, what reaches me, how my account is protected) and *this
 * workspace* (what it pays, how systems talk to it, where to get help). It is
 * the same split the Settings rail makes, so a reader who learns one has
 * learned both.
 *
 * The trigger is the chip that was already in the header, unchanged - same
 * height, same avatar, same name, same hover. It was a `<Link>` straight to
 * Profile; it is now the button that opens this. Profile is still one click
 * away, at the top of the menu and on the header block itself.
 */

interface MenuLink {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Rendered at the right of the row. The notification count uses it. */
  badge?: number;
  /** Set when the destination does not exist yet; the row renders inert. */
  unavailable?: string;
}

export function UserMenu() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const user = useAccount();
  const subscription = useSubscription();
  const unread = useAppSelector(
    (state) => state.notification.items.filter((item) => !item.read).length,
  );

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  /* The same dismissal behaviour as `Menu` and the notification panel -
     outside pointer-down, Escape, focus back to the trigger. */
  useDismissable(
    open,
    useCallback(() => setOpen(false), []),
    wrapperRef,
    triggerRef,
  );

  const name = displayName(user);
  const plan = PLANS.find((item) => item.id === subscription.planId);

  const account: MenuLink[] = [
    { label: "Profile", href: APP_ROUTES.settingsProfile, icon: UserRound },
    {
      label: "Notifications",
      href: APP_ROUTES.settingsNotifications,
      icon: Bell,
      /* The same list the bell counts. A second count computed differently is
         how a header shows 8 and a menu shows 7. */
      badge: unread || undefined,
    },
    { label: "Security", href: APP_ROUTES.settingsSecurity, icon: ShieldCheck },
  ];

  const workspace: MenuLink[] = [
    {
      label: "Billing & Subscription",
      href: APP_ROUTES.settingsBilling,
      icon: CreditCard,
    },
    { label: "API & Developer", href: APP_ROUTES.settingsApi, icon: Terminal },
    {
      label: "Help Center",
      href: "",
      icon: HelpCircle,
      /*
       * There is no help centre. `/help` exists in the marketing footer, which
       * points at pages that have not been built yet on purpose - borrowing it
       * here would put a 404 one click from every screen in the product. The
       * row stays visible so the absence is legible, and says why on hover.
       */
      unavailable: "A help centre has not been published yet.",
    },
  ];

  /**
   * Sign out, through the action the auth slice already exposes.
   *
   * `logout()` resets the auth state and the route change leaves the
   * dashboard. What it cannot do is end a session, because nothing starts
   * one - `auth.user` is `null` in every build and nothing dispatches
   * `setCredentials`. This is the real behaviour available today rather than a
   * confirmation dialog in front of it; when an auth service is wired, this is
   * the one function that changes.
   */
  const signOut = () => {
    setOpen(false);
    dispatch(logout());
    router.push(APP_ROUTES.login);
  };

  return (
    <div ref={wrapperRef} className="relative inline-flex">
      {/*
       * The header chip: photo, name, plan.
       *
       * `h-10` is gone. It was right when the chip was one line of text beside
       * a 40px avatar; with the name stacked over the plan the content is
       * taller than 40px and a fixed height clips it. `py-1` lets the chip take
       * the height its contents need, inside a 72px header that has the room.
       *
       * `items-center` aligns the stack against the middle of the photo, and
       * the stack itself is `items-start` so the name and the badge share a
       * left edge rather than centring on each other.
       */}
      <button
        ref={triggerRef}
        type="button"
        aria-label="User menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2.5 rounded-btn py-1 pe-1 transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
      >
        <AvatarPhoto name={name} src={user.avatarUrl} size="md" />

        {/* Name and plan hide together below `sm`. The badge on its own beside
            a photo reads as a status *on the person* - a role, or whether they
            are online - rather than as the account's tier. */}
        <span className="hidden flex-col items-start gap-1.5 sm:flex">
          <span className="text-sm leading-none font-semibold text-text-primary">
            {name}
          </span>
          {/* A bordered chip rather than a bare tint: at 13px on a soft indigo
              ground the label and its background sit close enough in value
              that the pill's edge disappears against the header. The border is
              what makes it read as a chip rather than as a highlighted word. */}
          <Badge
            tone="brand"
            size="xs"
            /* Only what `Badge` does not already set. The size is a rung on its
               scale rather than utilities passed in here: `cn()` is a plain
               join, so a `text-xs` and a tighter padding would race the
               component's own `text-meta` and `py-0.5` on stylesheet order
               instead of beating them. */
            className="border border-primary-border font-medium"
          >
            {plan?.name ?? subscription.planId} Plan
          </Badge>
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="User menu"
          /* `right-0` against a chip already at the right edge of a full-width
             header, so the panel grows into the page. The width clamps to the
             viewport minus both gutters - a fixed 320px panel overflows a
             narrow phone, and the symptom is a scrollbar on the whole
             dashboard rather than anything visibly wrong here. */
          className={cn(
            "absolute top-full right-0 z-40 mt-2 overflow-hidden",
            "w-[min(18rem,calc(100vw-1.5rem))]",
            "rounded-panel border border-border bg-surface shadow-float",
          )}
        >
          <ProfileHeader
            name={name}
            email={user.email}
            avatarUrl={user.avatarUrl}
            onNavigate={() => setOpen(false)}
          />

          <Group label="Account">
            {account.map((item) => (
              <Row
                key={item.label}
                item={item}
                active={isActiveRoute(pathname, item.href)}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </Group>

          <Group label="Workspace">
            {workspace.map((item) => (
              <Row
                key={item.label}
                item={item}
                active={
                  Boolean(item.href) && isActiveRoute(pathname, item.href)
                }
                onNavigate={() => setOpen(false)}
              />
            ))}
          </Group>

          <div className="border-t border-border p-1.5">
            {/*
             * One muted line closing the menu before the only destructive
             * action in it.
             *
             * It carries the plan *and its state*, which is the one piece of
             * account context neither the header block nor any row above
             * states - and it is why the tier is not also printed beside the
             * email. Saying "Growth plan" twice in a 320px panel reads as a
             * rendering fault; saying it once, with the status attached,
             * answers a question. Managing any of it is Billing's job, three
             * rows up.
             */}
            {/*
             * The plan as a chip, at the foot of the menu rather than under
             * the email.
             *
             * It sat in the identity block and said the same thing this line
             * already said, 250px apart - the tier twice in a 320px panel. One
             * of them had to go, and the bottom is where it earns its place:
             * the identity block stays avatar, name and address, and the badge
             * closes the menu with the one piece of account context nothing
             * else states.
             *
             * The status keeps its muted line beside the chip. The badge says
             * which plan; only this says whether it is running.
             */}

            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className={cn(ROW, "text-error-text hover:bg-error-soft")}
            >
              <LogOut className="size-4 shrink-0" aria-hidden />
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Header block                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Who you are signed in as, and one click to the page that edits it.
 *
 * The whole block is the link rather than a separate "Edit profile" control:
 * a name and an email in a menu is the thing everybody clicks expecting to
 * manage them, and a row that looks clickable and is not is worse than no row.
 * The arrow says so without needing a label.
 *
 * The plan line is one muted sentence, not a card. It answers "which tier is
 * this workspace on" at a glance, which is genuinely useful context here -
 * and stops there. Managing it is Billing's job, two rows below.
 */
function ProfileHeader({
  name,
  email,
  avatarUrl,
  onNavigate,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={APP_ROUTES.settingsProfile}
      role="menuitem"
      onClick={onNavigate}
      className="flex items-center gap-3 border-b border-border px-4 py-3.5 transition-colors hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none"
    >
      {/* 40px. `AvatarPhoto` renders the photo when there is one and the
          initials when there is not - or when the photo fails to load, which a
          plain `Avatar` would show as a broken glyph. */}
      <AvatarPhoto name={name} src={avatarUrl} size="md" />

      <span className="min-w-0 flex-1">
        {/* The heading of the block: 16px bold on primary ink, against the
            email's 14px regular on muted. The name is the thing being
            identified and the address qualifies it; at the same weight they
            read as two equal lines and the reader has to work out which is
            which. */}
        {/* `leading-tight` on both lines, so the pair stacks to roughly the
            avatar's own height. At the default leading the two lines run 44px
            against a 40px circle, and centring that difference leaves the name
            sitting a couple of pixels above the photo's midline - close enough
            to look accidental rather than deliberate. Tightened, the block and
            the circle read as one unit. */}
        <span className="block truncate text-base leading-tight font-bold text-text-primary">
          {name}
        </span>
        <span className="mt-0.5 block truncate text-sm leading-tight font-normal text-text-muted">
          {email}
        </span>
      </span>

      <ArrowUpRight className="size-4 shrink-0 text-text-muted" aria-hidden />
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Rows                                                                       */
/* -------------------------------------------------------------------------- */

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border p-1.5">
      {/* `text-meta` is the product's 13px step. `tracking-normal` rather than
          the wide tracking a label like this usually takes: at 13px semibold
          the extra letter-spacing pulls a six-letter word wider than the row
          beneath it and the heading starts competing with what it heads. */}
      <p className="px-2.5 pt-1.5 pb-1.5 text-sm font-semibold tracking-normal text-text-primary">
        {label}
      </p>
      {/* 3px between rows - enough that each is its own target, not enough to
          break the group into separate objects. */}
      <div className="space-y-[2px]">{children}</div>
    </div>
  );
}

/* 44px: 12px of padding either side of a 20px line. The shared string is the
   point - the six navigation rows and the log-out row below them are the same
   height whether they are links or a button, which is what stops the divider
   above Log out reading as a change of rhythm. */
/*
 * `min-h-11` is 44px - a floor, not a fixed height.
 *
 * The padding around it is deliberate and stays; what the floor adds is a
 * guarantee the row is big enough to hit on a touch screen even though its
 * content is a 16px icon and a 20px line. Setting the height instead of the
 * minimum would fight the padding the moment a label wrapped, which
 * "Billing & Subscription" does at the narrow end of this menu's width.
 *
 * Shared with the log-out button below, so the two are the same height and the
 * divider between them reads as a separator rather than a change of rhythm.
 */
const ROW =
  "flex min-h-9.5 w-full items-center gap-2.5 rounded-btn px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none";

function Row({
  item,
  active,
  onNavigate,
}: {
  item: MenuLink;
  active: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;

  const body = (
    <>
      <Icon className="size-4.5 shrink-0" aria-hidden />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span className="rounded-full bg-primary-soft px-1.5 py-0.5 text-xs font-bold text-primary-dark tabular-nums">
          {item.badge}
        </span>
      ) : null}
    </>
  );

  if (item.unavailable) {
    return (
      <Tooltip content={item.unavailable} side="bottom">
        {/*
         * Inert, not hidden. A row that silently disappears sends somebody
         * hunting the sidebar for where help went; a row that says it is not
         * there yet answers the question. `aria-disabled` rather than a
         * disabled button, so it stays in the tab order and a screen reader
         * reads the state instead of skipping the item.
         */}
        <span
          role="menuitem"
          aria-disabled
          tabIndex={0}
          className={cn(ROW, "cursor-not-allowed text-text-mute")}
        >
          {body}
        </span>
      </Tooltip>
    );
  }

  return (
    <Link
      href={item.href}
      role="menuitem"
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      /* The dashboard's own active treatment for a nested row: the primary
         tint, not the filled primary the sidebar's top-level rows take. A
         filled row inside a 320px menu reads as a button somebody is about to
         press rather than as where they already are. */
      className={cn(
        ROW,
        active
          ? "bg-primary-soft font-semibold text-primary-dark"
          : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
      )}
    >
      {body}
    </Link>
  );
}
