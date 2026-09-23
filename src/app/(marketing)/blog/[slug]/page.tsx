import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock3 } from "lucide-react";

import { LogoMark } from "@/components/ui/logo";
import { BlogCard, ShareArticle } from "@/components/marketing/blog";
import {
  BLOG_ARTICLES,
  formatArticleDate,
  getArticleBySlug,
  getRelatedArticles,
  type ArticleBlock,
} from "@/constants/blog";
import { APP_ROUTES } from "@/constants";
import { siteConfig } from "@/config/site";

/** Nine known slugs, so every article is prerendered at build time. */
export function generateStaticParams() {
  return BLOG_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) return {};

  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.publishedAt,
      images: [article.image],
    },
  };
}

/**
 * One article.
 *
 * A single column at reading width, on the white canvas - no rail, no sticky
 * table of contents, no related-articles sidebar competing with the paragraph
 * being read. These pieces are 600 to 900 words; furniture built for a 5,000
 * word reference would be the page telling the reader it is longer than it is.
 *
 * The body is rendered from three block types rather than from HTML, so every
 * article gets the same measure, the same rhythm between a heading and the
 * paragraph under it, and no chance of a stray inline style arriving with the
 * copy. See `constants/blog.ts` for the shape.
 */
function Block({ block }: { block: ArticleBlock }) {
  if (block.type === "h2") {
    return (
      <h2 className="mt-12 text-2xl leading-snug font-bold text-text-primary sm:text-[1.75rem] text-balance">
        {block.text}
      </h2>
    );
  }

  if (block.type === "list") {
    return (
      <ul className="mt-6 space-y-3">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3">
            <span
              aria-hidden
              className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary"
            />
            <span className="text-lg leading-[1.8] text-text-secondary text-pretty">
              {item}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="mt-6 text-lg leading-[1.8] text-text-secondary text-pretty">
      {block.text}
    </p>
  );
}

export default async function ArticlePage({
  params,
}: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) notFound();

  /* Three others on the same subject, never this one. */
  const related = getRelatedArticles(article);

  return (
    <>
      <article>
        <header className="hero-surface relative isolate overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-160 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.12),transparent)]"
          />

          <div className="custom-container">
            <div className="mx-auto max-w-3xl py-14 lg:py-16">
              <p className="inline-flex w-fit items-center rounded-full border border-primary-border bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                {article.category}
              </p>

              <h1 className="mt-4 text-[2rem] leading-[1.12] font-bold tracking-tight text-balance sm:text-[2.75rem]">
                {article.title}
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-text-secondary text-pretty">
                {article.description}
              </p>

              {/* The byline. The product is the author - there is no author
                  record behind these yet, and inventing a person to sign them
                  is the one detail on this page a reader could catch. */}
              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-6 text-sm text-text-muted">
                <span className="inline-flex items-center gap-2 font-semibold text-text-primary">
                  <LogoMark size={22} />
                  {siteConfig.name}
                </span>
                <span aria-hidden>·</span>
                <time dateTime={article.publishedAt}>
                  {formatArticleDate(article.publishedAt)}
                </time>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-3.5" aria-hidden />
                  {article.readingMinutes} min read
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="custom-container">
          <div className="mx-auto max-w-3xl">
            <div className="relative mt-12 aspect-video overflow-hidden rounded-card border border-border bg-background shadow-card">
              <Image
                src={article.image}
                alt={article.imageAlt}
                fill
                unoptimized
                priority
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-cover"
              />
            </div>

            <div className="pt-10 pb-16 lg:pb-20">
              {article.body.map((block, index) => (
                <Block key={index} block={block} />
              ))}

              {/* Closing the piece rather than opening it: a reader shares
                  what they have finished, not what they have not started. */}
              <ShareArticle
                url={`${siteConfig.url}${APP_ROUTES.blog}/${article.slug}`}
                title={article.title}
              />
            </div>
          </div>
        </div>
      </article>

      <section
        aria-labelledby="related-articles-title"
        className="section-space-py bg-background"
      >
        <div className="custom-container">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <h2
              id="related-articles-title"
              className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl"
            >
              Related articles
            </h2>

            <Link
              href={APP_ROUTES.blog}
              className="group inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-primary transition-colors hover:text-primary-dark focus-visible:shadow-focus focus-visible:outline-none"
            >
              View all articles
              <ArrowRight
                className="size-4 transition-[translate] duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden
              />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {related.map((item) => (
              <BlogCard key={item.slug} article={item} showDate />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
