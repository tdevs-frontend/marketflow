import { Check, Minus } from "lucide-react";

import { PanelLabel, ProductFrame } from "./feature-section";

/**
 * Team members and what each role can do.
 *
 * The permission grid is the whole section in one object: three roles down the
 * side, four capabilities across, ticks and dashes. It is the answer to the
 * only question anyone asks about team features - can I let a junior send
 * campaigns without letting them export the contact list - and a list of
 * feature names could not answer it.
 *
 * Deliberately smaller than the sections above. Team and workspace settings are
 * what a buyer checks before rolling out, not what makes them try the product,
 * so this gets one frame rather than a frame and a capability list.
 */

const MEMBERS = [
  { initials: "SK", name: "Sagor Khan", role: "Owner", active: "Now" },
  { initials: "AR", name: "Ayesha Rahim", role: "Marketing", active: "12m ago" },
  { initials: "TH", name: "Tanvir Hasan", role: "Support", active: "1h ago" },
];

const ROLE_TONE: Record<string, string> = {
  Owner: "bg-primary-soft text-primary-dark",
  Marketing: "bg-info-soft text-info-text",
  Support: "bg-surface-secondary text-text-secondary",
};

const CAPABILITIES = ["Inbox", "Campaigns", "Billing", "Export"];

/** Role → which of the four capabilities it holds. */
const MATRIX: Record<string, boolean[]> = {
  Owner: [true, true, true, true],
  Marketing: [true, true, false, true],
  Support: [true, false, false, false],
};

export function WorkspaceVisual() {
  return (
    <ProductFrame path="/dashboard/workspace/roles" status="3 members">
      <div className="space-y-3 bg-background p-3 sm:p-4">
        <div className="rounded-panel border border-border bg-surface p-3">
          <PanelLabel>Team members</PanelLabel>
          <ul className="mt-2.5 divide-y divide-border">
            {MEMBERS.map((member) => (
              <li
                key={member.name}
                className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-secondary text-[11px] font-bold text-text-secondary">
                  {member.initials}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-text-primary">
                  {member.name}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_TONE[member.role]}`}
                >
                  {member.role}
                </span>
                <span className="hidden w-14 shrink-0 text-right text-[10px] text-text-muted sm:block">
                  {member.active}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-panel border border-border bg-surface p-3">
          <PanelLabel>Roles &amp; permissions</PanelLabel>

          <table className="mt-2.5 w-full border-collapse">
            <thead>
              <tr>
                <th className="w-20 pb-2 text-left text-[10px] font-semibold text-text-muted">
                  <span className="sr-only">Role</span>
                </th>
                {CAPABILITIES.map((capability) => (
                  <th
                    key={capability}
                    scope="col"
                    className="pb-2 text-center text-[10px] font-semibold text-text-muted"
                  >
                    {capability}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(MATRIX).map(([role, grants]) => (
                <tr key={role} className="border-t border-border">
                  <th
                    scope="row"
                    className="py-2 text-left text-[11px] font-semibold text-text-primary"
                  >
                    {role}
                  </th>
                  {grants.map((granted, index) => (
                    <td key={CAPABILITIES[index]} className="py-2 text-center">
                      {granted ? (
                        <span className="inline-grid size-4 place-items-center rounded-full bg-success-soft text-success-text">
                          <Check className="size-2.5" strokeWidth={3} aria-hidden />
                          <span className="sr-only">Allowed</span>
                        </span>
                      ) : (
                        <span className="inline-grid size-4 place-items-center rounded-full bg-surface-secondary text-text-muted">
                          <Minus className="size-2.5" strokeWidth={3} aria-hidden />
                          <span className="sr-only">Not allowed</span>
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ProductFrame>
  );
}
