"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import type { Integration } from "@/types/integration";

/**
 * The confirmation that says what breaks.
 *
 * "This cannot be undone" is the default `ConfirmDialog` copy and it is the
 * wrong warning here — disconnecting *can* be undone, and the real cost is that
 * twelve workflows stop firing in the meantime. So the dialog lists the
 * dependents, read from the integration's own `usage`, which is the only way
 * the warning stays true as the workspace grows.
 *
 * An integration nothing depends on gets the short version. Padding a harmless
 * action with dire copy is how merchants learn to click through the copy that
 * matters.
 */
export function DisconnectDialog({
  integration,
  open,
  onClose,
  onConfirm,
}: {
  integration: Integration;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { usage } = integration;

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Disconnect ${integration.name}?`}
      description={
        usage.length > 0
          ? "This connection is currently in use."
          : "The connection will stop working immediately."
      }
      confirmLabel={`Disconnect ${integration.name}`}
    >
      <div className="space-y-3.5">
        {usage.length > 0 ? (
          <>
            <p className="text-sm text-text-secondary">Used by:</p>
            <ul className="space-y-1.5">
              {usage.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2.5 rounded-panel bg-surface-secondary px-3 py-2"
                >
                  <Icon name={item.icon} className="size-4 shrink-0 text-text-muted" />
                  <span className="min-w-0 flex-1 text-sm font-medium text-text-primary">
                    {item.count === undefined
                      ? item.label
                      : `${item.count} ${item.label.toLowerCase()}`}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <p className="text-sm text-text-secondary">
          Messages and automations using this connection may stop working.
          Credentials are kept, so you can reconnect without entering them again.
        </p>
      </div>
    </ConfirmDialog>
  );
}
