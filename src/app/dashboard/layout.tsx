import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

/**
 * `data-surface="app"` is the workspace's typography scope.
 *
 * The landing pages are set in two faces — Stack Sans Notch for headings over
 * Google Sans Flex for everything else — and the dashboard is set in one. This
 * attribute is what tells the two apart: THE SURFACE RULE in
 * `styles/font-themes.css` repoints `--font-heading` at the body face for this
 * subtree, so every heading in here, down to a dialog's title, comes out in
 * Google Sans Flex without a single component naming a typeface.
 *
 * It sits on the outermost element rather than on `<main>` so the sidebar and
 * the header are inside it too.
 */
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div data-surface="app" className="flex min-h-full flex-1">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-66">
        <DashboardHeader />
        <main className="flex-1 space-y-6 p-4 sm:p-6 md:p-7">{children}</main>
      </div>
    </div>
  );
}
