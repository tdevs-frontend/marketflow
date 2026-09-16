import type { Metadata } from "next";

import { ReduxProvider } from "@/redux/provider";
import { ToastProvider } from "@/components/ui/toast";
import { siteConfig } from "@/config/site";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — Marketing automation & CRM`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-text-secondary">
        {/*
         * The typefaces, from Google Fonts.
         *
         * React hoists `link` out of the tree and into `<head>`, so these sit
         * beside the app's own stylesheet rather than after it. The two
         * `preconnect`s matter more than they look: the CSS comes from
         * `fonts.googleapis.com` and names font files on `fonts.gstatic.com`,
         * so without them the browser pays a fresh DNS + TLS handshake to a
         * second origin only *after* it has parsed the CSS. `crossOrigin` on
         * the gstatic one is required — fonts are fetched in CORS mode, and a
         * preconnect that does not match the eventual request is a wasted
         * connection rather than a reused one.
         *
         * Both families are variable, and the four weights named here are the
         * ones the UI spends: 400 body, 500 labels and table cells, 600
         * semibold, 700 headings and emphasis.
         */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* `no-page-custom-font` guards against a font linked from a single
            Pages-Router page. This is the App Router's root layout, which wraps
            every route, so the font is loaded once for the whole product — the
            exact thing the rule asks for. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;600;700&family=Stack+Sans+Notch:wght@400;500;600;700&display=swap"
        />
        <ReduxProvider>
          <ToastProvider>{children}</ToastProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
