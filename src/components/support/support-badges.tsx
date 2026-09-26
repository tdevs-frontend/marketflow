import { AlertTriangle, ArrowDown, ArrowUp, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PRIORITY_TONE, STATUS_TONE, priorityLabel, statusLabel } from "@/constants/support";
import type { TicketPriority, TicketStatus } from "@/types/support";

/** Ticket state as badges, on the shared `Badge`, in the shared vocabulary. */
export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant={STATUS_TONE[status]} casing="none" className="whitespace-nowrap">
      {statusLabel(status)}
    </Badge>
  );
}

const PRIORITY_ICON = { low: ArrowDown, normal: Minus, high: ArrowUp, urgent: AlertTriangle };

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const Icon = PRIORITY_ICON[priority];
  return (
    <Badge
      variant={PRIORITY_TONE[priority]}
      casing="none"
      icon={<Icon aria-hidden />}
      className="whitespace-nowrap"
    >
      {priorityLabel(priority)}
    </Badge>
  );
}
