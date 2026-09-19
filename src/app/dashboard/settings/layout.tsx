import { SettingsNav } from "@/components/settings";

/**
 * The Settings module, and its own navigation.
 *
 * The strip above the page is the same pattern Integrations, WhatsApp and Email
 * already use: the sidebar carries the module, and the module carries its own
 * pages. Somebody who arrives on Security from a link needs to see the section
 * they are inside and be able to move sideways within it without going back to
 * the sidebar.
 *
 * One list feeds both — `constants/settings.SETTINGS_PAGES` — so the six rows
 * in the sidebar and the six links here cannot drift apart.
 *
 * Each page renders its own `PageHeader`. The strip has to sit above it for the
 * heading to belong to the page rather than to the module, which is also why
 * there is no "Settings" title in this layout: six sections with six different
 * answers are not one page with a subtitle.
 */
export default function SettingsLayout({
  children,
}: LayoutProps<"/dashboard/settings">) {
  return (
    <>
      <SettingsNav />
      {children}
    </>
  );
}
