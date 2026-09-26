import { Google_Sans_Flex, Stack_Sans_Notch } from "next/font/google";

/*
 * The two typefaces, self-hosted.
 *
 * `next/font/google` downloads these at build time and serves the woff2 files
 * from this site's own origin, with an `@font-face` per weight and a preload
 * for the Latin subset. They used to come from a runtime `<link>` to
 * fonts.googleapis.com, which Firefox's Enhanced Tracking Protection (strict),
 * privacy add-ons and "block remote fonts" settings refuse - and every one of
 * them left the page in `system-ui`. A first-party font file is not a
 * third-party request, so there is nothing for them to block.
 *
 * The weights are the same four the old link asked for - 400 body, 500 labels,
 * 600 semibold, 700 headings - so each `font-*` weight utility lands on a real
 * face and no browser synthesizes one. Only `wght` is requested: Google Sans
 * Flex also has `opsz`, `wdth`, `slnt`, `GRAD` and `ROND` axes, and asking for
 * `opsz` would switch on automatic optical sizing and change the look.
 *
 * The preload is what keeps the swap short: the Latin files are requested
 * alongside the HTML rather than after the CSS is parsed, so the `system-ui`
 * fallback is on screen for less time than it was behind a second origin.
 * (next/font has no metrics for these two families, so it emits no
 * size-adjusted fallback face and says so as a build warning; `--font-fallback`
 * is still the next rung.)
 *
 * Each exposes its family name as a CSS variable on `<html>`. `font-themes.css`
 * reads them into `--font-notch` / `--font-gsans`, and everything else in the
 * type system hangs off those two tokens.
 */
export const stackSansNotch = Stack_Sans_Notch({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-face-notch",
});

export const googleSansFlex = Google_Sans_Flex({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-face-gsans",
});
