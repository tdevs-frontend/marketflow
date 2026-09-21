import { MessageCircle, Tag } from "lucide-react";

import { ProductFrame } from "./feature-section";

/**
 * The lead pipeline, as the Leads board draws it.
 *
 * Four of the seven stages MarketFlow ships — New, Contacted, Qualified, Won —
 * because a marketing page showing all seven at this width gives each column
 * 60px and nothing in them can be read. The stages shown are the real ones from
 * `constants/app.LEAD_STAGES`, in their real order.
 *
 * Under the board, one contact row: the same person from the Qualified column,
 * with the channel they came in on and the tags they carry. That pairing is the
 * section's whole argument — the card on the board and the record in Contacts
 * are one thing, so the lead you drag is the customer you later message.
 */

interface Lead {
  name: string;
  company: string;
  value: string;
}

const COLUMNS: { stage: string; count: number; leads: Lead[]; tone: string }[] = [
  {
    stage: "New",
    count: 24,
    tone: "bg-border-strong",
    leads: [
      { name: "Nadia Rahman", company: "Kabir Textiles", value: "$2,400" },
      { name: "Imran Chowdhury", company: "Bay Interiors", value: "$980" },
    ],
  },
  {
    stage: "Contacted",
    count: 18,
    tone: "bg-info",
    leads: [{ name: "Sarah Mitchell", company: "Northline Co", value: "$5,200" }],
  },
  {
    stage: "Qualified",
    count: 11,
    tone: "bg-primary",
    leads: [
      { name: "Fatima Rahman", company: "Zara Boutique", value: "$8,600" },
      { name: "Daniel Okafor", company: "Okafor & Sons", value: "$3,150" },
    ],
  },
  {
    stage: "Won",
    count: 7,
    tone: "bg-success",
    leads: [{ name: "Priya Sharma", company: "Lotus Care", value: "$12,900" }],
  },
];

export function CrmVisual() {
  return (
    <ProductFrame path="/dashboard/leads" status="1,248 leads">
      <div className="space-y-3 bg-background p-3 sm:p-4">
        {/* The board */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {COLUMNS.map((column) => (
            <div
              key={column.stage}
              className="rounded-panel border border-border bg-surface p-2.5"
            >
              <div className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className={`size-1.5 shrink-0 rounded-full ${column.tone}`}
                />
                <span className="truncate text-xs font-semibold text-text-primary">
                  {column.stage}
                </span>
                <span className="ml-auto shrink-0 text-xs text-text-muted tabular-nums">
                  {column.count}
                </span>
              </div>

              <ul className="mt-2 space-y-1.5">
                {column.leads.map((lead) => (
                  <li
                    key={lead.name}
                    className="rounded-btn border border-border bg-surface-secondary/60 p-2"
                  >
                    <p className="truncate text-xs font-semibold text-text-primary">
                      {lead.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-text-muted">
                      {lead.company}
                    </p>
                    <p className="mt-1.5 text-[11px] font-bold text-primary tabular-nums">
                      {lead.value}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* The same person, as a contact record. */}
        <div className="rounded-panel border border-border bg-surface p-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-dark">
              FR
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">
                Fatima Rahman
              </p>
              <p className="truncate text-xs text-text-muted">
                Zara Boutique · +880 1712 345678
              </p>
            </div>
            <span className="hidden shrink-0 items-center gap-1 rounded-full bg-whatsapp-soft px-2 py-1 text-[11px] font-semibold text-whatsapp-dark sm:inline-flex">
              <MessageCircle className="size-3" aria-hidden />
              WhatsApp
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
            <Tag className="size-3 text-text-muted" aria-hidden />
            {["VIP", "Repeat buyer", "Dhaka"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-text-secondary"
              >
                {tag}
              </span>
            ))}
            <span className="ml-auto text-[11px] text-text-muted">
              In journey · Post-purchase
            </span>
          </div>
        </div>
      </div>
    </ProductFrame>
  );
}
