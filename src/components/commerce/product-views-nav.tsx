import { ModuleNav } from "@/components/layout/module-nav";

/**
 * Products, Catalog and Categories are three views of one dataset.
 *
 * They used to be three sidebar rows, which is how a merchant ends up asking
 * which of them is "the real product list". One sidebar entry now — Products —
 * and the other two are views reached from here.
 *
 * A component rather than a route layout: `/dashboard/products/new` and the
 * edit form are children of Products, and a strip of views above a form is
 * chrome that belongs to the list, not to the thing being edited. So the three
 * list pages opt in and nothing else does.
 */
const VIEWS = [
  { title: "Products", href: "/dashboard/products" },
  { title: "Catalog", href: "/dashboard/catalog" },
  { title: "Categories", href: "/dashboard/categories" },
];

export function ProductViewsNav() {
  return <ModuleNav items={VIEWS} label="Product views" />;
}
