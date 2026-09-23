"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * The SMS Analytics export, as a page action.
 *
 * It used to sit at the right-hand end of the page's own filter toolbar. That
 * toolbar is gone - the period is chosen centrally now, not per page - and
 * Export only went with it because of where it happened to be parked, not
 * because it is a filter. `PageHeader.secondaryActions` is the slot its own
 * documentation names for exactly this, so the button moves there rather than
 * being deleted. Same move, same reasoning, same shape as Email's.
 *
 * A component of its own because the page is a server component and this needs
 * a click handler and the toast hook; it is the smallest client boundary that
 * keeps the rest of the page on the server.
 */
export function SmsAnalyticsExport() {
  const toast = useToast();

  return (
    <Button
      variant="outline"
      size="compact"
      onClick={() =>
        toast("Report queued - we will email the CSV when it is ready")
      }
    >
      <Download aria-hidden />
      Export
    </Button>
  );
}
