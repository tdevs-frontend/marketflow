import Link from "next/link";
import { ArrowRight, ChevronDown, Scale } from "lucide-react";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { APP_ROUTES } from "@/constants";
import {
  LEGAL_PLACEHOLDERS,
  type LegalBlock,
  type LegalDocument as LegalDocumentData,
  type LegalListItem,
} from "@/constants/legal";

import { LegalToc, type TocItem } from "./legal-toc";

/**
 * A legal document page: the hero, then the numbered sections beside an
 * "On this page" rail.
 *
 * The hero is the Solutions and Blog band — same `hero-surface`, grid and
 * bloom — so the page is plainly part of the site. Everything under it is a
 * document rather than a landing page: no cards, no alternating grounds, one
 * column at reading width.
 *
 * From `lg` the rail sits to the left and sticks under the header, so a
 * reader deep in section 20 of the Terms can still see where they are and
 * jump elsewhere. Below `lg` it collapses into a `<details>` above the body —
 * a native disclosure, so it works without JavaScript and is announced as a
 * button.
 *
 * `scroll-mt-28` on each section clears the 72px sticky header with room for
 * the heading to breathe when a rail link or a deep link lands on it.
 */
export function LegalDocument({
  document,
  related,
}: {
  document: LegalDocumentData;
  /** The sibling document, linked from the foot of the page. */
  related: { label: string; href: string };
}) {
  const toc: TocItem[] = document.sections.map((section) => ({
    id: section.id,
    label: section.navLabel ?? section.title,
  }));

  return (
    <>
      <section
        aria-labelledby="legal-title"
        className="hero-surface relative isolate overflow-hidden"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-border-strong)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border-strong)_1px,transparent_1px)] bg-size-[64px_64px] opacity-40 mask-[radial-gradient(ellipse_85%_45%_at_50%_20%,black,transparent_75%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -z-10 size-192 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.12),transparent)]"
        />

        <div className="custom-container">
          <div className="mx-auto max-w-3xl py-16 text-center lg:py-20">
            <p className="section-eyebrow inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-3.5 pl-3 text-text-secondary shadow-card">
              <Scale className="size-4 text-primary" aria-hidden />
              Legal
            </p>

            <h1
              id="legal-title"
              className="mt-7 text-[2.5rem] leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl xl:text-[3.5rem]"
            >
              {document.title}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-[1.7] text-text-secondary text-pretty sm:text-lg">
              {document.description}
            </p>

            <Breadcrumb
              align="center"
              className="mt-6"
              items={[
                { label: "Home", href: APP_ROUTES.home },
                { label: "Legal" },
                { label: document.title },
              ]}
            />
          </div>
        </div>
      </section>

      <div className="custom-container">
        <div className="mx-auto grid max-w-6xl gap-10 py-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14 lg:py-16 xl:gap-20">
          <aside className="hidden lg:block">
            <div className="sticky top-28 max-h-[calc(100vh-8.5rem)] overflow-y-auto pb-4">
              <LegalToc items={toc} />
            </div>
          </aside>

          <div className="min-w-0 max-w-3xl">
            <details className="group mb-10 rounded-card border border-border bg-background lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-text-primary [&::-webkit-details-marker]:hidden">
                On this page
                <ChevronDown
                  className="size-4 text-text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  aria-hidden
                />
              </summary>
              <ol className="space-y-2 border-t border-border px-5 py-4 text-sm">
                {toc.map((item, index) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="flex gap-2 text-text-secondary hover:text-primary"
                    >
                      <span className="w-5 shrink-0 tabular-nums text-text-muted">
                        {index + 1}.
                      </span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </details>

            <article>
              {document.sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  aria-labelledby={`${section.id}-title`}
                  className="scroll-mt-28 border-t border-border pt-10 pb-2 first:border-t-0 first:pt-0 [&+section]:mt-10"
                >
                  <h2
                    id={`${section.id}-title`}
                    className="flex gap-3 text-2xl leading-snug font-bold tracking-tight text-text-primary text-balance sm:text-[1.75rem]"
                  >
                    <span className="shrink-0 tabular-nums text-primary">
                      {index + 1}.
                    </span>
                    <span>{section.title}</span>
                  </h2>

                  {section.blocks.map((block, blockIndex) => (
                    <Block key={blockIndex} block={block} />
                  ))}
                </section>
              ))}
            </article>

            <footer className="mt-14 flex flex-col gap-4 border-t border-border pt-8 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
              <p>
                Last updated:{" "}
                <span className="font-semibold text-text-primary">
                  {LEGAL_PLACEHOLDERS.lastUpdated}
                </span>
              </p>
              <Link
                href={related.href}
                className="group inline-flex w-fit items-center gap-1.5 rounded-sm font-semibold text-primary transition-colors hover:text-primary-dark focus-visible:shadow-focus focus-visible:outline-none"
              >
                {related.label}
                <ArrowRight
                  className="size-4 transition-[translate] duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden
                />
              </Link>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}

const BODY = "text-base leading-[1.8] text-text-secondary text-pretty sm:text-[1.0625rem]";

function ListItem({ item }: { item: LegalListItem }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="mt-3 size-1.5 shrink-0 rounded-full bg-primary"
      />
      <span className={BODY}>
        {typeof item === "string" ? (
          item
        ) : (
          <>
            <strong className="font-semibold text-text-primary">
              {item.term}
            </strong>{" "}
            — {item.text}
          </>
        )}
      </span>
    </li>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (block.type === "h3") {
    return (
      <h3 className="mt-8 text-lg leading-snug font-semibold text-text-primary">
        {block.text}
      </h3>
    );
  }

  if (block.type === "list") {
    return (
      <ul className="mt-5 space-y-3">
        {block.items.map((item) => (
          <ListItem
            key={typeof item === "string" ? item : item.term}
            item={item}
          />
        ))}
      </ul>
    );
  }

  return <p className={`mt-5 ${BODY}`}>{block.text}</p>;
}
