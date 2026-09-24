import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
  },

  /**
   * `/dashboard/settings` has no page of its own.
   *
   * It used to be an Overview: a hub listing the settings destinations,
   * rendered beside a rail listing the same ones. A landing screen whose only
   * content is a second copy of the navigation next to it is a stop on the way
   * to somewhere, and every reader was making the same next click.
   *
   * The route has to keep working — the dashboard sidebar's Settings row points
   * at it, and so do older links — so it sends them to the first real page
   * instead. Here rather than in a `page.tsx` calling `redirect()`: that route
   * is statically prerendered, so the redirect ships inside the RSC payload and
   * a direct request is answered 200 with a document that then bounces. A
   * config redirect is resolved before routing and answers with a real 307, so
   * nothing renders and no payload is downloaded to be thrown away.
   *
   * Temporary, not permanent. A 308 is cached by browsers indefinitely, which
   * would make putting a page back here a support problem rather than a commit.
   */
  async redirects() {
    return [
      {
        source: "/dashboard/settings",
        destination: "/dashboard/settings/profile",
        permanent: false,
      },
      /* Customers is no longer a page of its own - it is the Customers tab
         of Contacts. Both of its old addresses land on that tab. */
      {
        source: "/dashboard/customers",
        destination: "/dashboard/contacts?view=customers",
        permanent: false,
      },
      {
        source: "/dashboard/sales/customers",
        destination: "/dashboard/contacts?view=customers",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
