"use client";

import { Ban, Copy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Menu } from "@/components/ui/menu";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { scopeSummary } from "@/constants/integrations";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { INTEGRATIONS_NOW_MS } from "@/lib/integration-fixtures";
import { cn } from "@/lib/utils";
import type { ApiKey } from "@/types/integration";

/**
 * The key register.
 *
 * The prefix column is the whole point of the table — it is the only part of a
 * key that ever exists after creation, and it is how a merchant matches a key
 * in this list to the one in their application's config. Monospace, because
 * that match is character by character.
 *
 * "Last used" earns its column: a key nobody has called in three months is a
 * key that should be revoked, and this is the only place that is visible.
 */
export function ApiKeyTable({
  keys,
  onRevoke,
  onCopyPrefix,
}: {
  keys: ApiKey[];
  onRevoke: (key: ApiKey) => void;
  onCopyPrefix: (key: ApiKey) => void;
}) {
  return (
    <Table minWidth="66rem">
      <THead>
        <TH>Key Name</TH>
        <TH>Prefix</TH>
        <TH>Created</TH>
        <TH>Last Used</TH>
        <TH>Permissions</TH>
        <TH>Status</TH>
        <TH align="right">
          <span className="sr-only">Actions</span>
        </TH>
      </THead>

      <TBody>
        {keys.map((key) => {
          const revoked = key.status === "revoked";

          return (
            <TR key={key.id} className={cn(revoked && "opacity-70")}>
              <TD>
                <span className="block font-semibold text-text-primary">
                  {key.name}
                </span>
                <span className="mt-0.5 block text-meta font-normal text-text-muted capitalize">
                  {key.environment}
                </span>
              </TD>

              <TD>
                <span className="font-mono text-meta text-text-secondary">
                  {key.masked}
                </span>
              </TD>

              <TD className="font-normal text-text-secondary">
                {formatDate(key.createdAt)}
              </TD>

              <TD className="font-normal text-text-secondary">
                {key.lastUsedAt
                  ? formatRelativeTime(key.lastUsedAt, INTEGRATIONS_NOW_MS)
                  : "Never"}
              </TD>

              <TD>
                <Badge
                  tone={scopeSummary(key.scopes) === "Read / Write" ? "warning" : "neutral"}
                  size="sm"
                  className="normal-case"
                >
                  {scopeSummary(key.scopes)}
                </Badge>
                <span className="ml-1.5 text-meta font-normal text-text-muted tabular-nums">
                  {key.scopes.length} {key.scopes.length === 1 ? "scope" : "scopes"}
                </span>
              </TD>

              <TD>
                <Badge tone={revoked ? "neutral" : "success"} size="sm" className="normal-case">
                  {revoked ? "Revoked" : "Active"}
                </Badge>
              </TD>

              <TD align="right">
                <Menu
                  label={`Actions for ${key.name}`}
                  items={[
                    {
                      label: "Copy prefix",
                      icon: <Copy className="size-4" aria-hidden />,
                      onSelect: () => onCopyPrefix(key),
                    },
                    {
                      label: "Revoke key",
                      icon: <Ban className="size-4" aria-hidden />,
                      destructive: true,
                      disabled: revoked,
                      onSelect: () => onRevoke(key),
                    },
                  ]}
                />
              </TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}
