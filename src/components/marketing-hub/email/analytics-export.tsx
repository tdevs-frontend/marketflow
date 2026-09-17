"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * The Email Analytics export, as a page action.
 *
 * It used to sit at the right-hand end of the page's own filter toolbar. That
 * toolbar is gone — the period is chosen centrally now, not per page — and
 * Export went with it only because of where it happened to be parked, not
 * because it is a filter. `PageHeader.secondaryActions` is the slot its own
 * documentation names for exactly this ("Outline or ghost buttons — Export,
 * Import, Settings"), so the button moves there rather than being deleted.
 *
 * A component of its own because the page is a server component and this needs
 * a click handler and the toast hook; it is the smallest client boundary that
 * keeps the rest of the page on the server.
 *
 * The report has no period of its own to name yet. Once the central filter is
 * reading, the selected range is what this should queue the CSV for.
 */
export function EmailAnalyticsExport() {
  const toast = useToast();

  return (
    <Button
      variant="outline"
      size="compact"
      onClick={() =>
        toast("Report queued — we will email the CSV when it is ready")
      }
    >
      <Download aria-hidden />
      Export
    </Button>
  );
}
