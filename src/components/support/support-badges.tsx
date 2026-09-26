import { AlertTriangle, ArrowDown, ArrowUp, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  PRIORITY_TONE,
  STATUS_TONE,
  merchantStatusLabel,
  priorityLabel,
  statusLabel,
} from "@/constants/support";
import type { TicketPriority, TicketStatus } from "@/types/support";

/**
 * Ticket state as badges, on the shared `Badge`.
 *
 * `audience` only changes the words: the two waiting states read from the
 * reader's side of the desk - "Waiting for Merchant" to an agent is
 * "Waiting for You" to the merchant. The tone is the same for both.
 */
export function TicketStatusBadge({
  status,
  audience = "agent",
}: {
  status: TicketStatus;
  audience?: "agent" | "merchant";
}) {
  return (
    <Badge variant={STATUS_TONE[status]} casing="none" className="whitespace-nowrap">
      {audience === "merchant" ? merchantStatusLabel(status) : statusLabel(status)}
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
