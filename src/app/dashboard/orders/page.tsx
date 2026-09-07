import type { Metadata } from "next";
import { Download } from "lucide-react";

import { OrdersWorkspace } from "@/components/commerce";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <>
      <PageHeader
        title="Orders"
        description="Track and manage customer purchases from one place."
        action={
          <Button variant="outline" size="compact">
            <Download aria-hidden />
            Export Orders
          </Button>
        }
      />

      <OrdersWorkspace />
    </>
  );
}
