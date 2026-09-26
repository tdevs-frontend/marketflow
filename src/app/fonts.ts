import localFont from "next/font/local";

/*
 * The two typefaces, self-hosted.
 *
 * The woff2 files live in `./_fonts` and are served from this site's own
 * origin, with an `@font-face` each and a preload. They used to come from a
 * runtime `<link>` to fonts.googleapis.com, which Firefox's Enhanced Tracking
 * Protection (strict), privacy add-ons and "block remote fonts" settings
 * refuse - and every one of them left the page in `system-ui`. A first-party
 * font file is not a third-party request, so there is nothing for them to
 * block.
 *
 * Why `next/font/local` and not `next/font/google`: the Google loader takes
 * its fallback metrics from a precalculated table that has neither family, so
 * every build warned "Failed to find font override values", and Turbopack's
 * loader warns even with `adjustFontFallback: false`. The local loader reads
 * the metrics from the file itself, so it builds a real size-adjusted Arial
 * fallback and the swap barely shifts the layout.
 *
 * Each file is the Latin subset of the variable font, fetched from Google
 * Fonts' css2 API with only the `wght` axis (400..700) requested. That covers
 * the four weights the type system uses - 400 body, 500 labels, 600 semibold,
 * 700 headings - so no browser has to synthesize one. Google Sans Flex's other
 * axes (`opsz`, `wdth`, `slnt`, `GRAD`, `ROND`) are pinned to their defaults
 * in that file; turning `opsz` on would switch on automatic optical sizing and
 * change the look. To refresh a file, request
 * `https://fonts.googleapis.com/css2?family=<Family>:wght@400..700` with a
 * browser user agent and download the `/* latin *\/` src.
 *
 * Each exposes its family name as a CSS variable on `<html>`. `font-themes.css`
 * reads them into `--font-notch` / `--font-gsans`, and everything else in the
 * type system hangs off those two tokens.
 */
export const stackSansNotch = localFont({
  src: "./_fonts/stack-sans-notch-latin.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-face-notch",
});

export const googleSansFlex = localFont({
  src: "./_fonts/google-sans-flex-latin.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-face-gsans",
});
