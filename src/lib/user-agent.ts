import type { DeviceInfo, DeviceKind } from "@/types/account";

/**
 * What this browser can honestly say about itself.
 *
 * The Active Sessions panel has to name the device somebody is reading it on,
 * and the only source for that in a browser is the user-agent string. This
 * module is the single place that reads it, because a user-agent parse is a
 * pile of special cases that gets copied and then diverges — one screen saying
 * "Safari" and another "Mobile Safari 17" about the same device is worse than
 * either answer alone.
 *
 * Two rules the parse holds to, both of which are about not overstating.
 *
 * It reports only what the string actually carries. Windows sends
 * `Windows NT 10.0` for both Windows 10 and Windows 11 — Microsoft froze it —
 * so this says "Windows" and stops. The version is reachable through
 * `navigator.userAgentData.getHighEntropyValues`, which is asynchronous,
 * Chromium-only, and a permission-shaped API; naming a Windows release from
 * the legacy string would be a guess rendered as a fact on a security screen.
 *
 * It is a description, not an identity. A user-agent is trivially forged and
 * two identical laptops produce identical strings, so nothing here is used to
 * decide *which* session a row is — that is the session id the service issues.
 * This only makes a row readable by a human who is trying to recognise their
 * own phone in a list.
 */

/* -------------------------------------------------------------------------- */
/* Browser                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Order is the whole algorithm.
 *
 * Every Chromium browser still claims `Chrome` and every one of them claims
 * `Safari` after that, because a decade of server-side sniffing made honesty
 * expensive. So the specific tokens have to be tested first: Edge before
 * Chrome, Chrome before Safari, or every browser on the list renders as
 * "Safari".
 *
 * The iOS entries are not duplicates. Apple requires every iOS browser to use
 * WebKit, so Chrome on an iPhone is `CriOS` and Firefox is `FxiOS`; matching
 * only the desktop token would report a merchant's iPhone as Safari and they
 * would not recognise their own session.
 */
const BROWSERS: { name: string; pattern: RegExp }[] = [
  { name: "Edge", pattern: /Edg(?:e|A|iOS)?\/(\d+)/ },
  { name: "Opera", pattern: /OPR\/(\d+)/ },
  { name: "Samsung Internet", pattern: /SamsungBrowser\/(\d+)/ },
  { name: "Firefox", pattern: /(?:Firefox|FxiOS)\/(\d+)/ },
  { name: "Chrome", pattern: /(?:Chrome|CriOS)\/(\d+)/ },
  /* Safari carries its release in `Version/`; the `Safari/` token that follows
     is the WebKit build and is not a number anybody would recognise. */
  { name: "Safari", pattern: /Version\/(\d+)[\d.]*\s+(?:Mobile\/\S+\s+)?Safari/ },
];

/* -------------------------------------------------------------------------- */
/* Platform                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * iOS first, and Linux last.
 *
 * Android's string contains `Linux`, and iOS's contains `Mac OS X`, so the
 * general platforms have to lose to the specific ones. Linux is the fallback
 * for everything that reached the end.
 */
const PLATFORMS: { name: string; pattern: RegExp }[] = [
  { name: "iOS", pattern: /iPhone|iPad|iPod/ },
  { name: "Android", pattern: /Android/ },
  { name: "ChromeOS", pattern: /CrOS/ },
  { name: "Windows", pattern: /Windows NT/ },
  { name: "macOS", pattern: /Macintosh|Mac OS X/ },
  { name: "Linux", pattern: /Linux|X11/ },
];

function match(
  userAgent: string,
  table: { name: string; pattern: RegExp }[],
): { name: string; version: string | null } | null {
  for (const entry of table) {
    const found = entry.pattern.exec(userAgent);
    if (found) return { name: entry.name, version: found[1] ?? null };
  }
  return null;
}

/**
 * Desktop, mobile or tablet.
 *
 * `Mobi` is the token the specification actually reserves for "this is a
 * phone", and Android honours it: a tablet sends `Android` without it. iPadOS
 * is the exception that needs `maxTouchPoints` — since version 13 an iPad
 * requests desktop sites by default and its string is indistinguishable from a
 * Mac's, so the touch count is the only signal left.
 */
function deviceKind(userAgent: string, touchPoints: number): DeviceKind {
  if (/iPad/.test(userAgent)) return "tablet";
  if (/Macintosh/.test(userAgent) && touchPoints > 1) return "tablet";
  if (/Tablet/.test(userAgent)) return "tablet";
  if (/Android/.test(userAgent) && !/Mobi/.test(userAgent)) return "tablet";
  if (/Mobi|iPhone|iPod/.test(userAgent)) return "mobile";
  if (/Windows NT|Macintosh|CrOS|X11|Linux/.test(userAgent)) return "desktop";
  return "unknown";
}

/**
 * The device this code is running on.
 *
 * Takes its inputs as arguments rather than reading `navigator` itself so it
 * can be called with a string from a service — the same function formats a
 * session recorded on another device once an account service is listing them.
 */
export function describeDevice(
  userAgent: string,
  touchPoints = 0,
): DeviceInfo {
  const browser = match(userAgent, BROWSERS);
  const platform = match(userAgent, PLATFORMS);
  const kind = deviceKind(userAgent, touchPoints);

  /*
   * A Macintosh that reports touch points is an iPad.
   *
   * Not a guess: since iPadOS 13 an iPad requests desktop sites by default and
   * sends a Mac's user-agent, and no Mac has ever shipped a touchscreen. This
   * is Apple's own recommended way to tell them apart, and without it a
   * merchant looking for their iPad in this list is told they are signed in on
   * a Mac they do not own.
   */
  const os =
    platform?.name === "macOS" && kind === "tablet"
      ? "iPadOS"
      : (platform?.name ?? "Unknown platform");

  return {
    browser: browser?.name ?? "Unknown browser",
    browserVersion: browser?.version ?? null,
    os,
    kind,
  };
}

/** This browser, or a blank description when there is no `navigator` — SSR. */
export function describeThisDevice(): DeviceInfo {
  if (typeof navigator === "undefined") {
    return {
      browser: "Unknown browser",
      browserVersion: null,
      os: "Unknown platform",
      kind: "unknown",
    };
  }

  return describeDevice(navigator.userAgent, navigator.maxTouchPoints ?? 0);
}

/* -------------------------------------------------------------------------- */
/* Rendering                                                                  */
/* -------------------------------------------------------------------------- */

/** "Chrome · Windows" — the line somebody scans for their own device. */
export function deviceSummary(device: DeviceInfo): string {
  return `${device.browser} · ${device.os}`;
}

/** "Chrome 153 · Windows · Desktop" — the line under it. */
export function deviceDetail(device: DeviceInfo): string {
  const browser = device.browserVersion
    ? `${device.browser} ${device.browserVersion}`
    : device.browser;

  const kind = KIND_LABEL[device.kind];
  return kind ? `${browser} · ${device.os} · ${kind}` : `${browser} · ${device.os}`;
}

const KIND_LABEL: Record<DeviceKind, string> = {
  desktop: "Desktop",
  mobile: "Phone",
  tablet: "Tablet",
  unknown: "",
};

/**
 * The browser's time zone, as the coarsest location signal that is actually available.
 *
 * Deliberately not a city, a country or an IP lookup. A session list exists so
 * somebody can recognise their own devices, and `Europe/Lisbon` does that;
 * a street-level guess would be new personal data collected to decorate a row.
 */
export function deviceTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}
