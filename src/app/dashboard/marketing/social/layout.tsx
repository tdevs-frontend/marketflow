import { ModuleNav } from "@/components/layout/module-nav";

/**
 * The Social Planner's own pages.
 *
 * No Overview entry: `/marketing/social` redirects to the Calendar, which is
 * where a content team starts, and a tab that bounces you to the tab beside it
 * is a tab that teaches people not to trust the strip.
 */
const PAGES = [
  { title: "Calendar", href: "/dashboard/marketing/social/calendar" },
  { title: "Posts", href: "/dashboard/marketing/social/posts" },
  { title: "Media", href: "/dashboard/marketing/social/media" },
  { title: "Accounts", href: "/dashboard/marketing/social/accounts" },
  { title: "Analytics", href: "/dashboard/marketing/social/analytics" },
];

export default function SocialLayout({
  children,
}: LayoutProps<"/dashboard/marketing/social">) {
  return (
    <>
      <ModuleNav items={PAGES} label="Social Planner pages" />
      {children}
    </>
  );
}
