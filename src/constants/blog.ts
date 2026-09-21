/**
 * The Resources library.
 *
 * Nine articles, each about something the product actually does — WhatsApp
 * automation, the lead pipeline, segments, campaigns, orders, analytics. A
 * marketing blog that writes about productivity in general is a content farm
 * wearing the brand; every piece here is answerable from a module in the
 * dashboard, which is what makes the "Read article" click worth anything.
 *
 * The data lives here rather than in the components because three surfaces
 * read it — the landing section takes the first three, `/blog` lists all nine
 * behind filters, and `/blog/[slug]` renders one in full — and a set of cards
 * that disagreed about a publication date depending on which page you were on
 * is the kind of thing nobody notices until a customer does.
 *
 * There is no CMS behind this yet. When there is, this file is the shape it
 * has to return.
 */

/** The filter taxonomy. `topic` is the machine key; the chip shows `label`. */
export const BLOG_TOPICS = [
  { value: "marketing", label: "Marketing" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "automation", label: "Automation" },
  { value: "customers", label: "Customers" },
  { value: "commerce", label: "Commerce" },
  { value: "analytics", label: "Analytics" },
] as const;

export type BlogTopic = (typeof BLOG_TOPICS)[number]["value"];

/**
 * One piece of article body.
 *
 * Deliberately three cases and no more. An article surface that accepts
 * arbitrary HTML is a styling problem forever; three block types cover every
 * piece written so far and each one has exactly one rendering.
 */
export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[] };

export interface BlogArticle {
  slug: string;
  /**
   * The chip on the card — editorial, and written for a reader.
   *
   * Distinct from `topic`, which is the filter key. They are not the same
   * job: "WhatsApp Automation" is a useful thing to print on a card and a
   * terrible thing to put in a row of filter buttons, where the set has to be
   * short enough to scan in one pass.
   */
  category: string;
  topic: BlogTopic;
  title: string;
  description: string;
  /** Minutes, rendered as "N min read" wherever it appears. */
  readingMinutes: number;
  /** ISO date. Formatted at the render site, never stored pre-formatted. */
  publishedAt: string;
  image: string;
  imageAlt: string;
  body: ArticleBlock[];
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "whatsapp-conversations-into-automated-customer-journeys",
    category: "WhatsApp Automation",
    topic: "whatsapp",
    title:
      "How to Turn WhatsApp Conversations Into Automated Customer Journeys",
    description:
      "Learn how automated replies, follow-ups and customer journeys can turn conversations into measurable growth.",
    readingMinutes: 6,
    publishedAt: "2026-09-09",
    image: "/blog/whatsapp-automation.svg",
    imageAlt:
      "A WhatsApp conversation beside an automated workflow of connected steps.",
    body: [
      {
        type: "p",
        text: "Most teams start on WhatsApp the same way: one shared phone, a handful of saved replies, and somebody who remembers to follow up. It works until it does not. The moment volume rises, the follow-ups are the first thing to go — not because anyone decided to stop, but because nobody owns the reminder.",
      },
      {
        type: "p",
        text: "A customer journey fixes that by writing the follow-up down once, as a workflow, instead of relying on a person to remember it every time.",
      },
      { type: "h2", text: "Start with the trigger, not the message" },
      {
        type: "p",
        text: "A journey begins with something happening: an inbound message, a form submission, a lead moving stage, an order placed. Pick the trigger first and the rest of the journey writes itself — you are no longer asking what to send, you are asking what should happen next.",
      },
      {
        type: "list",
        items: [
          "Inbound message from a new number — send a greeting, capture the contact, tag the enquiry.",
          "Lead reaches Qualified — wait a day, then send the pricing template.",
          "Order placed — confirm it, then check in a week later.",
          "No reply after three days — one follow-up, then stop.",
        ],
      },
      { type: "h2", text: "Let the wait do the work" },
      {
        type: "p",
        text: "The step teams skip most often is the wait. A sequence with no delays fires everything within a minute of the trigger and reads as a machine. Delays are what make an automated journey feel like a team that is paying attention: a message the next morning lands very differently to one that arrives four seconds after somebody says hello.",
      },
      { type: "h2", text: "Keep the handover open" },
      {
        type: "p",
        text: "Automation should never be a wall. Every journey needs a point where a human takes the conversation back, and the inbox is where that happens — an agent picks up the thread with the full history already attached, and the workflow stops rather than talking over them.",
      },
      {
        type: "p",
        text: "Build one journey, watch it for a fortnight, and only then build the second. The teams that get the most out of automation are rarely the ones with the most workflows.",
      },
    ],
  },
  {
    slug: "from-lead-to-loyal-customer",
    category: "Customer Management",
    topic: "customers",
    title: "From Lead to Loyal Customer: Building a Better Customer Journey",
    description:
      "Discover how connected customer data, segmentation and timely communication improve the path from first contact to repeat purchase.",
    readingMinutes: 7,
    publishedAt: "2026-08-27",
    image: "/blog/customer-journey.svg",
    imageAlt:
      "A lead pipeline of four stages, with cards moving from new through to won.",
    body: [
      {
        type: "p",
        text: "The gap between a lead and a loyal customer is not usually a gap in effort. It is a gap in memory: the conversation happened in one tool, the order in another, and the follow-up depended on whoever happened to read the thread.",
      },
      { type: "h2", text: "One record, not three" },
      {
        type: "p",
        text: "A customer who messaged you on WhatsApp in March, opened an email in May and ordered in June is one person. If your tools disagree about that, every downstream decision inherits the confusion — the segment is wrong, the campaign double-sends, and the report counts them twice.",
      },
      { type: "h2", text: "Stages are decisions, not labels" },
      {
        type: "p",
        text: "A pipeline stage should answer what has to happen next. If two stages produce the same action, you have one stage with two names. Keep the list short enough that the whole team agrees on where something sits without a meeting.",
      },
      {
        type: "list",
        items: [
          "New — nobody has replied yet.",
          "Contacted — a conversation has started.",
          "Qualified — there is a real need and a real budget.",
          "Won — the order exists, and the journey continues rather than ends.",
        ],
      },
      { type: "h2", text: "The journey does not stop at the sale" },
      {
        type: "p",
        text: "Most of the value in a customer record is created after the first order, and most teams stop maintaining it there. The second purchase is usually cheaper to earn than the first, but only if somebody is still paying attention — which, again, is a job for a workflow rather than a memory.",
      },
    ],
  },
  {
    slug: "multi-channel-marketing-strategy-that-scales",
    category: "Marketing",
    topic: "marketing",
    title: "How to Build a Multi-Channel Marketing Strategy That Scales",
    description:
      "Bring WhatsApp, Email, SMS and Social campaigns together without losing the customer context.",
    readingMinutes: 6,
    publishedAt: "2026-08-14",
    image: "/blog/multi-channel.svg",
    imageAlt:
      "One audience at the centre, branching out to four connected channels.",
    body: [
      {
        type: "p",
        text: "Adding a channel is easy. Adding a channel without fragmenting the customer is the hard part, and it is the part that decides whether a multi-channel strategy scales or simply multiplies the work.",
      },
      { type: "h2", text: "Pick the channel from the message" },
      {
        type: "p",
        text: "Each channel is good at something specific, and using them interchangeably is how a marketing programme starts to feel like noise.",
      },
      {
        type: "list",
        items: [
          "WhatsApp — conversations, and anything that expects a reply.",
          "Email — detail, and anything worth keeping.",
          "SMS — short, time-critical, and used sparingly.",
          "Social — reach, and the top of the journey rather than the end of it.",
        ],
      },
      { type: "h2", text: "One audience, four doors" },
      {
        type: "p",
        text: "The strategy only scales if the segment is defined once and every channel sends to the same definition. Maintaining a separate list per channel is what produces the experience every customer recognises: the same offer, three times, in three tones, twice after they already bought.",
      },
      { type: "h2", text: "Measure the programme, not the channel" },
      {
        type: "p",
        text: "Per-channel reports answer which send performed best. They cannot answer whether the campaign worked, because the customer who converted rarely used one channel. Attribution has to roll up to the campaign, or you will keep optimising the last click.",
      },
    ],
  },
  {
    slug: "improve-lead-follow-up-without-manual-work",
    category: "Automation",
    topic: "automation",
    title: "7 Ways to Improve Lead Follow-Up Without Adding More Manual Work",
    description:
      "Practical changes that shorten response time and stop qualified leads going quiet, without asking your team to do more.",
    readingMinutes: 5,
    publishedAt: "2026-07-30",
    image: "/blog/lead-follow-up.svg",
    imageAlt: "A follow-up checklist beside a timer showing elapsed response time.",
    body: [
      {
        type: "p",
        text: "Follow-up is the part of the funnel that fails quietly. Nobody reports a lead they forgot, so the loss never appears in a number until somebody counts the ones that went cold.",
      },
      { type: "h2", text: "Seven changes worth making" },
      {
        type: "list",
        items: [
          "Acknowledge every inbound message automatically, then reply properly. The first response sets the expectation; it does not have to be the full answer.",
          "Give every new lead an owner at the moment it is created, not at the next stand-up.",
          "Write the second and third follow-up as a workflow, so they happen without a reminder.",
          "Put a wait between them. Three messages in an hour reads as desperation.",
          "Stop the sequence the moment somebody replies.",
          "Tag the reason a lead went cold, so the pattern becomes visible.",
          "Review the leads with no activity in seven days once a week — a short list, not a report.",
        ],
      },
      { type: "h2", text: "Automate the remembering, not the relationship" },
      {
        type: "p",
        text: "None of the above replaces a salesperson. They remove the part of the job that a person is worst at — keeping a mental list of who is owed a message today — and leave the part a person is uniquely good at.",
      },
    ],
  },
  {
    slug: "why-customer-segmentation-matters",
    category: "Customer Management",
    topic: "customers",
    title: "Why Customer Segmentation Matters for Modern Marketing",
    description:
      "How grouping customers by behaviour rather than guesswork makes every campaign smaller, sharper and easier to measure.",
    readingMinutes: 6,
    publishedAt: "2026-07-16",
    image: "/blog/segmentation.svg",
    imageAlt: "A contact list resolving into three distinct customer groups.",
    body: [
      {
        type: "p",
        text: "Segmentation has a reputation as an advanced feature. It is closer to the opposite: it is the thing that makes everything else simpler, because a smaller audience is easier to write for and much easier to learn from.",
      },
      { type: "h2", text: "Segment on behaviour, not demographics" },
      {
        type: "p",
        text: "What somebody did is a far better predictor than who they are. Ordered twice in ninety days, opened the last three campaigns, asked about pricing and never replied — each of those is a group with an obvious next message.",
      },
      { type: "h2", text: "Start with three" },
      {
        type: "list",
        items: [
          "Customers who bought recently — the group most likely to buy again.",
          "Leads who engaged and went quiet — the group most worth recovering.",
          "Contacts who have never engaged — the group to stop paying to reach.",
        ],
      },
      { type: "h2", text: "A segment is a hypothesis" },
      {
        type: "p",
        text: "The value is not the list, it is what the list teaches you. If a segment never performs differently to the whole audience, it is not a segment — and deleting it is as useful as creating it was.",
      },
    ],
  },
  {
    slug: "automation-follow-up-at-the-right-time",
    category: "Automation",
    topic: "automation",
    title: "How Automation Helps Teams Follow Up at the Right Time",
    description:
      "Triggers, conditions and delays decide when a message lands — and timing is usually what separates a reply from silence.",
    readingMinutes: 5,
    publishedAt: "2026-06-29",
    image: "/blog/automation-timing.svg",
    imageAlt: "A workflow of sequential steps beside a clock marking the delay.",
    body: [
      {
        type: "p",
        text: "Teams tend to think of automation as a way to send more. Its more useful job is deciding when — because the same message is welcome on Tuesday morning and irritating on Friday night.",
      },
      { type: "h2", text: "Three controls, and what each one is for" },
      {
        type: "list",
        items: [
          "Triggers decide what starts the sequence — an event, not a date.",
          "Conditions decide who continues through it, so one workflow can serve several cases.",
          "Delays decide the pace, which is the control that most changes how the sequence feels.",
        ],
      },
      { type: "h2", text: "Design the exit first" },
      {
        type: "p",
        text: "Before adding a step, decide what stops the sequence. A reply, a purchase, an unsubscribe, a stage change. A workflow with no exit will eventually message somebody who already bought, and that one message costs more trust than the sequence earned.",
      },
      { type: "h2", text: "Watch it run" },
      {
        type: "p",
        text: "Read the activity log for the first week. The gap between what a workflow was meant to do and what it does is always widest at the start, and it is only visible in the runs.",
      },
    ],
  },
  {
    slug: "turning-conversations-into-measurable-revenue",
    category: "Commerce",
    topic: "commerce",
    title: "Turning Customer Conversations Into Measurable Revenue",
    description:
      "When orders and conversations share a workspace, revenue can be attributed back to the message that earned it.",
    readingMinutes: 7,
    publishedAt: "2026-06-11",
    image: "/blog/conversations-revenue.svg",
    imageAlt:
      "A conversation on the left, connected to a rising revenue chart on the right.",
    body: [
      {
        type: "p",
        text: "Conversational selling has an old reporting problem: the conversation lives in a messaging tool and the order lives in a store, so the link between them is somebody's recollection.",
      },
      { type: "h2", text: "Attach the order to the contact" },
      {
        type: "p",
        text: "Once an order belongs to a contact rather than to an anonymous checkout, every question downstream becomes answerable. Which campaign preceded it. Which conversation it came out of. Whether this customer has bought before, and what happened last time.",
      },
      { type: "h2", text: "What becomes measurable" },
      {
        type: "list",
        items: [
          "Revenue by channel, rather than opens by channel.",
          "The conversion rate of a conversation, not just of a campaign.",
          "Repeat rate per segment, which is the number that decides what to spend.",
          "The real cost of a slow reply, in orders rather than in minutes.",
        ],
      },
      { type: "h2", text: "Be honest about attribution" },
      {
        type: "p",
        text: "No model is exact, and a customer who saw a post, read an email and then messaged you is not one channel's win. Attribution is useful as a direction, not as a verdict — the moment it becomes a scoreboard, teams start optimising for the model rather than for the customer.",
      },
    ],
  },
  {
    slug: "practical-guide-to-better-marketing-campaigns",
    category: "Marketing",
    topic: "marketing",
    title: "A Practical Guide to Building Better Marketing Campaigns",
    description:
      "A repeatable way to plan, build, send and review a campaign — from the audience through to the number that judges it.",
    readingMinutes: 8,
    publishedAt: "2026-05-28",
    image: "/blog/campaigns.svg",
    imageAlt: "A campaign composer beside the audience list it will send to.",
    body: [
      {
        type: "p",
        text: "Most campaigns are built in the wrong order: the message first, the audience second, and the measure of success somewhere after it has already sent.",
      },
      { type: "h2", text: "Start at the end" },
      {
        type: "p",
        text: "Write down the number that will tell you whether this worked before you write a word of the copy. Replies, orders, bookings. If you cannot name it, the campaign is an announcement, which is a legitimate thing to send and a different thing to judge.",
      },
      { type: "h2", text: "Then the audience" },
      {
        type: "p",
        text: "The audience decides the message far more than the message decides the audience. A campaign to everybody has to be vague enough to be true for everybody, which is why broad sends underperform so reliably.",
      },
      { type: "h2", text: "Then the template" },
      {
        type: "p",
        text: "Reusable templates are not just a time saving. They are what makes results comparable — when the structure is held constant, the difference in performance is attributable to the thing you actually changed.",
      },
      { type: "h2", text: "Review within the week" },
      {
        type: "list",
        items: [
          "What did it produce against the number you named first?",
          "Which segment carried the result, and which one diluted it?",
          "What would you change, in one sentence?",
          "Is that change worth making before the next send, or is it noise?",
        ],
      },
      {
        type: "p",
        text: "A campaign nobody reviewed is a campaign nobody learned from, and the second one will cost exactly as much as the first.",
      },
    ],
  },
  {
    slug: "what-to-track-when-measuring-marketing-performance",
    category: "Analytics",
    topic: "analytics",
    title: "What to Track When Measuring Marketing Performance",
    description:
      "A short list of metrics worth watching weekly, and the vanity numbers worth ignoring entirely.",
    readingMinutes: 6,
    publishedAt: "2026-05-14",
    image: "/blog/analytics.svg",
    imageAlt:
      "Four performance tiles above a bar chart of campaign results over time.",
    body: [
      {
        type: "p",
        text: "Marketing analytics fails in two directions. Either nothing is tracked, or everything is — and a dashboard with forty numbers on it is the same as no dashboard, because nobody can tell which one moved for a reason.",
      },
      { type: "h2", text: "The short list" },
      {
        type: "list",
        items: [
          "Reply rate, per channel — the clearest signal that a message landed.",
          "Conversion rate from conversation to order.",
          "Revenue per campaign, not per send.",
          "Repeat purchase rate, which is the slowest number to move and the most worth moving.",
          "Time to first response, because it predicts most of the above.",
        ],
      },
      { type: "h2", text: "What to ignore" },
      {
        type: "p",
        text: "Impressions, follower counts and open rates are diagnostics, not outcomes. They are useful for explaining why a number moved and dangerous as the number itself — open rate in particular has been unreliable since inbox providers began pre-fetching images.",
      },
      { type: "h2", text: "Pick a cadence and hold it" },
      {
        type: "p",
        text: "Weekly for campaign activity, monthly for revenue and repeat rate. Checking a slow metric daily produces noise, and reacting to that noise is how teams end up rewriting a strategy that was working.",
      },
    ],
  },
];

/** The three on the landing page — newest first, which the array already is. */
export const FEATURED_ARTICLES = BLOG_ARTICLES.slice(0, 3);

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find((article) => article.slug === slug);
}

/**
 * The filter row, derived rather than declared.
 *
 * A filter that matches nothing is a broken control, and a hand-written list
 * would grow one the first time an article is removed. Building it from what
 * is actually published means that cannot happen.
 */
export const BLOG_FILTERS = [
  { value: "all", label: "All" },
  ...BLOG_TOPICS.filter((topic) =>
    BLOG_ARTICLES.some((article) => article.topic === topic.value),
  ),
] as const;

/** One date format for every surface that prints one. */
export function formatArticleDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
