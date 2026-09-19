import { SettingsNav } from "@/components/settings";

/**
 * The Settings shell: navigation rail beside the section.
 *
 * `lg:grid-cols-[13.5rem_minmax(0,1fr)]` — a fixed rail and a content column
 * that is allowed to be narrower than its contents. The `minmax(0,1fr)` is
 * load-bearing: a grid track defaults to `min-content`, so one wide element
 * inside a section (the API key table, the webhook endpoints) would push the
 * column out and scroll the whole page sideways instead of scrolling itself.
 *
 * Below `lg` it is one column and the rail becomes a scrolling strip above the
 * content — see `SettingsNav`.
 *
 * The page heading stays in the content column rather than spanning the shell.
 * Each route says what *it* is ("Profile — manage your personal account
 * information"), and a module-level title above the rail would make those read
 * as subtitles of a page nobody is on.
 *
 * The dashboard layout gives `main` a `space-y-6`, which is what separates the
 * rail row from nothing else here — the grid supplies its own gap.
 */
export default function SettingsLayout({
  children,
}: LayoutProps<"/dashboard/settings">) {
  return (
    <div className="grid gap-6 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-8">
      <SettingsNav />
      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}
