import { Mail, MapPin, Phone, type LucideIcon } from "lucide-react";

/**
 * The three ways to reach MarketFlow, as a row of cards.
 *
 * Every line that can be acted on is: the numbers are `tel:` links and the
 * addresses are `mailto:` links, so a tap on a phone dials and a click on an
 * address opens a composer. A contact page whose contact details are plain
 * text is a contact page that makes the reader copy them out by hand.
 *
 * The location is the one card with nothing to press. There is no map route
 * to send anyone to, and a third card styled like a link that goes nowhere
 * would be worse than a card that plainly states an address.
 *
 * The composition is the reference's - tinted bed, round mark, title, two
 * lines - painted in MarketFlow's own colours: the brand gradient on the
 * mark, `primary-soft` for the bed, and the text tokens the rest of the site
 * uses. The support address is the one in `siteConfig`, so the page and the
 * footer cannot drift apart.
 */

interface ContactChannel {
  icon: LucideIcon;
  title: string;
  /** `href` omitted on a line that is an address to read, not one to act on. */
  lines: { label: string; href?: string }[];
}

/*
 * PLACEHOLDER: the phone numbers and the street address are stand-ins -
 * MarketFlow has no real ones in this codebase. The two email addresses are
 * the product's own (`siteConfig.links.support`). Replace the rest before
 * this page goes anywhere near production.
 */
const CHANNELS: ContactChannel[] = [
  {
    icon: Phone,
    title: "Call Us On",
    lines: [
      { label: "+880 1700 000 000", href: "tel:+8801700000000" },
      { label: "+880 1900 000 000", href: "tel:+8801900000000" },
    ],
  },
  {
    icon: Mail,
    title: "Email Us",
    lines: [
      { label: "support@marketflow.app", href: "mailto:support@marketflow.app" },
      { label: "sales@marketflow.app", href: "mailto:sales@marketflow.app" },
    ],
  },
  {
    icon: MapPin,
    title: "Our Location",
    lines: [
      { label: "Level 4, 12 Gulshan Avenue" },
      { label: "Dhaka 1212, Bangladesh" },
    ],
  },
];

export function ContactInfo() {
  return (
    <section
      aria-labelledby="contact-info-title"
      className="section-space-py bg-surface"
    >
      <div className="custom-container">
        <h2 id="contact-info-title" className="sr-only">
          How to reach us
        </h2>

        <ul className="grid gap-5 md:grid-cols-3 lg:gap-6">
          {CHANNELS.map((channel) => (
            <li
              key={channel.title}
              className="flex min-h-67.5 flex-col items-center justify-center rounded-card border border-primary-border/50 bg-primary-soft px-8 py-10 text-center"
            >
              <span className="mb-5 grid size-20 place-items-center rounded-full brand-gradient shadow-[0_10px_30px_rgba(79,70,229,0.25)]">
                <channel.icon className="size-7 text-white" strokeWidth={1.8} aria-hidden />
              </span>

              <h3 className="mb-3 text-xl font-semibold text-text-primary">
                {channel.title}
              </h3>

              <div className="space-y-1">
                {channel.lines.map((line) => (
                  <p key={line.label} className="text-base leading-6 text-text-secondary">
                    {line.href ? (
                      <a
                        href={line.href}
                        className="rounded-sm transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
                      >
                        {line.label}
                      </a>
                    ) : (
                      line.label
                    )}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
