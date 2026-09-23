import { CreditCard, Terminal } from "lucide-react";

/**
 * Billing and the developer surface, in one short band.
 *
 * Both are real parts of the product and both would be a lie as a feature
 * section: nobody buys a marketing platform for its invoice page, and a
 * full-width block on subscription management next to the automation builder
 * would say the two matter equally. They get a two-up band with a small,
 * honest preview each - enough that a buyer knows the plumbing exists and stops
 * wondering, which is the entire job.
 *
 * The previews are the smallest true thing about each: what a plan row looks
 * like, and what a request against the API looks like. Neither pretends to be a
 * screenshot of a page.
 */

const PLAN_ROWS = [
  { label: "Plan", value: "Growth · monthly" },
  { label: "Contacts", value: "12,480 of 25,000" },
  { label: "Next invoice", value: "1 Oct · $79.00" },
];

export function SupportingStrip() {
  return (
    <section
      aria-labelledby="supporting-title"
      className="section-space-py scroll-mt-32"
    >
      <div className="custom-container">
        <h2 id="supporting-title" className="sr-only">
          Billing and developer tools
        </h2>

        <p className="mx-auto max-w-2xl text-center text-base leading-[1.7] text-text-secondary text-pretty">
          Manage your subscription and connect MarketFlow with your own tools and
          workflows.
        </p>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {/* Billing */}
          <div className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-btn bg-primary-soft text-primary">
                <CreditCard className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-text-primary">
                  Billing &amp; Subscription
                </h3>
                <p className="mt-0.5 text-xs text-text-muted">
                  Plans, usage and invoices in the workspace.
                </p>
              </div>
            </div>

            <dl className="mt-4 divide-y divide-border rounded-panel border border-border bg-background px-3">
              {PLAN_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-3 py-2.5"
                >
                  <dt className="text-xs text-text-muted">{row.label}</dt>
                  <dd className="min-w-0 truncate text-xs font-semibold text-text-primary">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Developer */}
          <div className="rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-btn bg-tint-slate-soft text-tint-slate-ink">
                <Terminal className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-text-primary">
                  API &amp; Developer
                </h3>
                <p className="mt-0.5 text-xs text-text-muted">
                  Scoped keys, webhooks and a REST API.
                </p>
              </div>
            </div>

            {/* A request, as a developer would write it. Masked key, because a
                marketing page showing a whole token teaches the wrong habit. */}
            <pre className="mt-4 overflow-x-auto rounded-panel border border-border bg-dark px-3 py-2.5 text-[11px] leading-relaxed text-dark-text">
              <code>
                <span className="text-whatsapp-bright">GET</span>{" "}
                /v1/contacts?segment=vip{"\n"}
                <span className="text-dark-muted">Authorization:</span> Bearer
                mf_live_••••8F2A
              </code>
            </pre>

            <p className="mt-3 text-xs text-text-muted">
              Every key is scoped per resource, and webhook deliveries are signed
              and retried.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
