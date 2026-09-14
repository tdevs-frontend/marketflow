import { ModuleNav } from "@/components/layout/module-nav";

/**
 * Products, Catalog and Categories are three views of one dataset.
 *
 * They used to be three sidebar rows, which is how a merchant ends up asking
 * which of them is "the real product list". One sidebar entry now — Products —
 * and the other two are views reached from here.
 *
 * It is now the *only* way to reach Catalog and Categories: both had sidebar
 * rows of their own until this change, which meant three global entries pointed
 * at one product database. The component already existed for exactly this
 * purpose and was never rendered — so the strip was written, the sidebar was
 * never trimmed, and the duplication stayed.
 *
 * A component rather than a route layout: `/dashboard/products/new` and the
 * edit form are children of Products, and a strip of views above a form is
 * chrome that belongs to the list, not to the thing being edited. So the three
 * list pages opt in and nothing else does.
 */
const VIEWS = [
  { title: "All Products", href: "/dashboard/products" },
  { title: "Categories", href: "/dashboard/categories" },
  { title: "Catalog", href: "/dashboard/catalog" },
];

export function ProductViewsNav() {
  return <ModuleNav items={VIEWS} label="Product views" />;
}
