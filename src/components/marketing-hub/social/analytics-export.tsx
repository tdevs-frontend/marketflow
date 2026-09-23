"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * The Social Analytics export, as a page action.
 *
 * It sat at the right-hand end of the page's own filter toolbar until the date
 * picker came off that toolbar. Export is not a filter - it only lived there
 * because that is where the row happened to be - so it moves to
 * `PageHeader.secondaryActions`, the slot its own documentation names for
 * exactly this. Same move, same shape, as Email's and SMS's.
 *
 * A component of its own because the page is a server component and this needs
 * a click handler and the toast hook; it is the smallest client boundary that
 * keeps the rest of the page on the server.
 */
export function SocialAnalyticsExport() {
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
