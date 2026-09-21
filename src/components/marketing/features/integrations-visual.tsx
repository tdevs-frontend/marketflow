import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";

import { Icon } from "@/components/ui/icon";
import { integrationTint } from "@/constants/integrations";
import { cn } from "@/lib/utils";
import { ProductFrame } from "./feature-section";

/**
 * The integrations hub, as it actually looks — including the broken one.
 *
 * Eight tiles, named after the eight integrations MarketFlow ships. No count,
 * no logo wall, no "and 40 more": a marketing page that claims a number the
 * product cannot back is the claim a prospect checks first, and the eight here
 * are each a real card on `/dashboard/integrations`.
 *
 * One tile is in the Issue state and one needs setup. That is deliberate. A
 * grid where everything is green says the screenshot was staged; a grid with a
 * failing SMS connection says this is a page you would actually look at on a
 * Monday, and it is also the honest way to show that MarketFlow tells you when
 * a connection breaks rather than dropping messages quietly.
 *
 * Tints come from `integrationTint`, the same map the dashboard cards use, so
 * WhatsApp is the same green in both places.
 */

interface Tile {
  id: string;
  name: string;
  icon: string;
  detail: string;
  state: "connected" | "needs_setup" | "issue";
}

const TILES: Tile[] = [
  { id: "whatsapp", name: "WhatsApp Business", icon: "message-circle", detail: "Meta Cloud API", state: "connected" },
  { id: "email", name: "Email", icon: "mail", detail: "SMTP", state: "connected" },
  { id: "sms", name: "SMS", icon: "smartphone", detail: "Twilio", state: "issue" },
  { id: "social", name: "Social Media", icon: "share-2", detail: "4 accounts", state: "connected" },
  { id: "shopify", name: "Shopify", icon: "shopping-cart", detail: "Not connected", state: "needs_setup" },
  { id: "ga4", name: "Google Analytics 4", icon: "bar-chart", detail: "Not connected", state: "needs_setup" },
  { id: "webhooks", name: "Webhooks", icon: "webhook", detail: "3 endpoints", state: "connected" },
  { id: "api", name: "API Access", icon: "code", detail: "3 keys", state: "connected" },
];

const STATE = {
  connected: {
    label: "Connected",
    icon: CheckCircle2,
    tone: "bg-success-soft text-success-text",
  },
  needs_setup: {
    label: "Needs Setup",
    icon: CircleDashed,
    tone: "bg-surface-secondary text-text-secondary",
  },
  issue: {
    label: "Issue",
    icon: AlertTriangle,
    tone: "bg-error-soft text-error-text",
  },
} as const;

export function IntegrationsVisual() {
  return (
    <ProductFrame path="/dashboard/integrations" status="6 connected">
      <div className="bg-background p-3 sm:p-4">
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {TILES.map((tile) => {
            const state = STATE[tile.state];

            return (
              <li
                key={tile.id}
                className="rounded-panel border border-border bg-surface p-2.5"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-btn border",
                      integrationTint(tile.id),
                    )}
                  >
                    <Icon name={tile.icon} className="size-4" />
                  </span>
                  <state.icon
                    className={cn(
                      "mt-0.5 size-3.5 shrink-0",
                      tile.state === "connected" && "text-success",
                      tile.state === "issue" && "text-error",
                      tile.state === "needs_setup" && "text-text-muted",
                    )}
                    aria-hidden
                  />
                </div>

                <p className="mt-2 truncate text-xs font-semibold text-text-primary">
                  {tile.name}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-text-muted">
                  {tile.detail}
                </p>

                <span
                  className={cn(
                    "mt-2 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    state.tone,
                  )}
                >
                  {state.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </ProductFrame>
  );
}
