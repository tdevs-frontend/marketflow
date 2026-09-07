import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-full flex-1">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-66">
        <DashboardHeader />
        <main className="flex-1 space-y-6 p-4 sm:p-6 md:p-7">{children}</main>
      </div>
    </div>
  );
}
