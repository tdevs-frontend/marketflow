import { ModuleNav } from "@/components/layout/module-nav";
import { SETTINGS_PAGES } from "@/constants/settings";

/**
 * The six Settings sections, as a strip of links.
 *
 * Links rather than `Tabs`, and that is the substantive change. These were tab
 * panels swapped in place, which meant the URL never moved: no deep link to
 * Security, no back button between Profile and Notifications, nothing to paste
 * into a message when somebody asks where two-factor lives, and every panel
 * destroyed the moment you left it — so a half-finished form was gone on the
 * way to check something on another tab.
 *
 * `ModuleNav` is the component Integrations, WhatsApp and Email already use for
 * exactly this, down to `aria-current="page"` and the middle-clickable anchors
 * a tab cannot offer. It looks like the tab strip on purpose, so the two read as
 * one system; the difference is in what it promises.
 *
 * One array feeds this and the sidebar — `constants/settings.SETTINGS_PAGES` —
 * so the two lists cannot drift.
 */
export function SettingsNav() {
  return (
    <ModuleNav
      items={SETTINGS_PAGES.map(({ title, href }) => ({ title, href }))}
      label="Settings sections"
    />
  );
}
