/**
 * The Resources library.
 *
 * Twenty-four articles, each about something the product actually does —
 * WhatsApp automation, the lead pipeline, segments, campaigns, orders,
 * analytics. A marketing blog that writes about productivity in general is a
 * content farm wearing the brand; every piece here is answerable from a module
 * in the dashboard, which is what makes the "Read article" click worth
 * anything.
 *
 * The data lives here rather than in the components because three surfaces
 * read it — the landing section takes the first three, `/blog` pages through
 * all of them behind filters, and `/blog/[slug]` renders one in full — and a
 * set of cards that disagreed about a publication date depending on which page
 * you were on is the kind of thing nobody notices until a customer does.
 *
 * Photography is in `public/blog`, one file per article, named for the slot
 * rather than for the slug so an article can be retitled without orphaning its
 * image. Every file is 1600×900, cropped at the source, so the grid cannot be
 * broken by a replacement of the wrong shape.
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

/** Articles per page on `/blog`. Three full rows of the three-column grid. */
export const BLOG_PAGE_SIZE = 9;

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
  /** Describes the photograph, not the article — it is the image's alt text. */
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
    image: "/blog/whatsapp-automation.jpg",
    imageAlt: "A hand holding a phone showing an open messaging conversation.",
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
    image: "/blog/customer-journey.jpg",
    imageAlt: "Two people shaking hands at the close of a business meeting.",
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
    image: "/blog/multi-channel.jpg",
    imageAlt:
      "A desk with a monitor, laptop and a printed social media marketing plan.",
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
    image: "/blog/lead-follow-up.jpg",
    imageAlt: "Someone taking a call on a mobile phone while holding a coffee.",
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
    image: "/blog/segmentation.jpg",
    imageAlt: "A desk covered with printed charts and analysis notes.",
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
    image: "/blog/automation-timing.jpg",
    imageAlt: "A screen showing a board of work items organised into columns.",
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
    image: "/blog/conversations-revenue.jpg",
    imageAlt: "Two colleagues reviewing an online store on a laptop together.",
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
    image: "/blog/campaigns.jpg",
    imageAlt:
      "A marketing team working around a desk of laptops, notes and printed material.",
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
    image: "/blog/analytics.jpg",
    imageAlt: "A laptop displaying a dashboard of performance charts.",
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
  {
    slug: "writing-whatsapp-templates-that-get-approved",
    category: "WhatsApp Automation",
    topic: "whatsapp",
    title: "Writing WhatsApp Templates That Get Approved the First Time",
    description:
      "What template review actually checks for, and how to write a message that passes without three rounds of edits.",
    readingMinutes: 5,
    publishedAt: "2026-04-30",
    image: "/blog/whatsapp-templates.jpg",
    imageAlt: "Hands typing a message on a mobile phone keyboard.",
    body: [
      {
        type: "p",
        text: "A rejected template is rarely rejected for its wording. It is rejected because it is the wrong category, because a variable is doing something a variable should not, or because it reads as an advert sent to somebody who did not ask for one.",
      },
      { type: "h2", text: "Get the category right first" },
      {
        type: "p",
        text: "Utility, marketing and authentication are not labels you pick to suit the approval odds. They describe what the message does, and a marketing message submitted as a utility one is the single most common rejection.",
      },
      { type: "h2", text: "Write the variable, not around it" },
      {
        type: "list",
        items: [
          "Give every placeholder a real example when you submit it.",
          "Never start or end a message with a variable.",
          "Do not use a variable to smuggle in the part of the message that would have failed review.",
          "Keep the fixed text meaningful on its own — if the sentence only makes sense once filled in, it will not pass.",
        ],
      },
      { type: "h2", text: "Say who you are" },
      {
        type: "p",
        text: "The recipient may not have your number saved. A template that opens by naming the business it comes from is both better received and more likely to be approved, and it costs one line.",
      },
    ],
  },
  {
    slug: "running-a-shared-inbox-without-stepping-on-each-other",
    category: "WhatsApp Automation",
    topic: "whatsapp",
    title: "Running a Shared Inbox Without Two People Answering the Same Chat",
    description:
      "Assignment, ownership and a few small conventions that keep a team inbox from becoming a group chat.",
    readingMinutes: 5,
    publishedAt: "2026-04-16",
    image: "/blog/shared-inbox.jpg",
    imageAlt: "Two support agents wearing headsets, working at their desks.",
    body: [
      {
        type: "p",
        text: "The failure mode of a shared inbox is not messages going unanswered. It is two people answering the same one differently, four minutes apart, in front of the customer.",
      },
      { type: "h2", text: "Ownership beats etiquette" },
      {
        type: "p",
        text: "Every open conversation should have exactly one name on it. Teams that rely on a convention — whoever saw it first — discover that the convention breaks at precisely the times it matters, which is when the inbox is busy.",
      },
      { type: "h2", text: "Three conventions worth writing down" },
      {
        type: "list",
        items: [
          "Assign before you reply, not after.",
          "Close a conversation when it is done, so the open count means something.",
          "Hand over in the thread, not in a side channel — the next person needs the context, not the summary.",
        ],
      },
      { type: "h2", text: "Let the automation take the easy half" },
      {
        type: "p",
        text: "Acknowledgements, opening hours, order status. Anything a workflow can answer correctly every time should not be arriving in a human queue at all, and removing it is usually what makes the rest of the inbox manageable.",
      },
    ],
  },
  {
    slug: "email-deliverability-basics",
    category: "Marketing",
    topic: "marketing",
    title: "Email Deliverability Basics Every Marketing Team Should Know",
    description:
      "Authentication, list hygiene and sending patterns — the three things that decide whether your campaign reaches an inbox at all.",
    readingMinutes: 7,
    publishedAt: "2026-04-02",
    image: "/blog/email-deliverability.jpg",
    imageAlt: "A tidy desk with an open laptop, notebook and phone.",
    body: [
      {
        type: "p",
        text: "Deliverability is the quietest way a campaign fails. The send reports as successful, the numbers look merely disappointing, and nothing tells you that a third of it never reached an inbox.",
      },
      { type: "h2", text: "Authenticate the domain" },
      {
        type: "p",
        text: "SPF, DKIM and DMARC are not optional any more — the large inbox providers now require them for bulk senders. They are a one-time DNS job and the single highest-return thing on this list.",
      },
      { type: "h2", text: "Send to people who want it" },
      {
        type: "list",
        items: [
          "Remove hard bounces immediately, not monthly.",
          "Suppress contacts who have not opened anything in a year — they are lowering the reputation of every send.",
          "Make unsubscribing easy. A spam complaint costs far more than a lost contact.",
          "Never send to a purchased list.",
        ],
      },
      { type: "h2", text: "Warm up, then stay steady" },
      {
        type: "p",
        text: "A new sending domain that goes from zero to fifty thousand in a day looks exactly like a compromised one. Build volume gradually, and once you are there, keep the pattern regular — the irregular sender is the suspicious one.",
      },
    ],
  },
  {
    slug: "when-sms-marketing-actually-works",
    category: "Marketing",
    topic: "marketing",
    title: "When SMS Marketing Actually Works — and When It Backfires",
    description:
      "SMS has the highest read rate of any channel and the shortest patience. Here is where it earns its place.",
    readingMinutes: 4,
    publishedAt: "2026-03-19",
    image: "/blog/sms-marketing.jpg",
    imageAlt: "A phone screen asking the reader to turn on notifications.",
    body: [
      {
        type: "p",
        text: "Almost every SMS is read, and read within minutes. That statistic is why teams adopt the channel and also why they misuse it — a channel nobody can ignore is a channel you can very easily wear out.",
      },
      { type: "h2", text: "Use it for time and certainty" },
      {
        type: "list",
        items: [
          "Order and delivery updates.",
          "Appointment reminders.",
          "One-time codes.",
          "A genuinely short window — today only, closing at six.",
        ],
      },
      { type: "h2", text: "Do not use it for anything that needs a paragraph" },
      {
        type: "p",
        text: "If the message needs explaining, it belongs in email. An SMS that arrives as three segments and ends mid-sentence costs you three times the money and some goodwill.",
      },
      { type: "h2", text: "Frequency is the whole discipline" },
      {
        type: "p",
        text: "Set a cap — a small number per contact per month — and treat it as a hard limit rather than a target. The cost of one message too many is an opt-out, and on SMS an opt-out is permanent.",
      },
    ],
  },
  {
    slug: "building-a-social-content-calendar-that-survives",
    category: "Marketing",
    topic: "marketing",
    title: "Building a Social Content Calendar Your Team Will Actually Keep",
    description:
      "Planning further ahead than next week, without building a schedule that collapses the first time something urgent happens.",
    readingMinutes: 5,
    publishedAt: "2026-03-05",
    image: "/blog/social-planner.jpg",
    imageAlt: "A wall calendar showing a month laid out in a grid.",
    body: [
      {
        type: "p",
        text: "Most content calendars are abandoned in week three. Not because the team stopped caring, but because the calendar was built for a month in which nothing else happened.",
      },
      { type: "h2", text: "Plan themes, schedule posts" },
      {
        type: "p",
        text: "Decide the month's three or four themes in one sitting, then fill individual slots weekly. Planning thirty specific posts in advance guarantees that half of them will be wrong by the time they publish.",
      },
      { type: "h2", text: "Leave gaps on purpose" },
      {
        type: "p",
        text: "A calendar with no empty slots has no room for the thing actually worth posting — the customer story, the launch, the answer to a question everybody suddenly has. Book about seventy per cent and defend the rest.",
      },
      { type: "h2", text: "Review what happened, not what was planned" },
      {
        type: "list",
        items: [
          "Which posts earned replies rather than impressions?",
          "Which theme is carrying the month?",
          "What did you skip, and did anyone notice?",
        ],
      },
    ],
  },
  {
    slug: "recovering-abandoned-carts-without-being-annoying",
    category: "Commerce",
    topic: "commerce",
    title: "Recovering Abandoned Carts Without Being Annoying About It",
    description:
      "A short, well-timed sequence recovers more than a long one — and costs far less goodwill.",
    readingMinutes: 5,
    publishedAt: "2026-02-19",
    image: "/blog/abandoned-cart.jpg",
    imageAlt: "A small shopping trolley standing on a laptop keyboard.",
    body: [
      {
        type: "p",
        text: "An abandoned cart is not a lost sale. It is usually an interruption — a phone call, a train stop, a question the page did not answer. The recovery message that works treats it that way.",
      },
      { type: "h2", text: "Three messages, and then stop" },
      {
        type: "list",
        items: [
          "One hour later — a reminder with the items in it, and nothing else.",
          "A day later — answer the objection. Delivery time, returns, sizing.",
          "Three days later — the last one, and make it clear it is the last one.",
        ],
      },
      { type: "h2", text: "Hold the discount back" },
      {
        type: "p",
        text: "Leading with a discount teaches customers to abandon deliberately, and the habit is very hard to unlearn. Keep it for the final message, if at all — most recovered carts do not need one.",
      },
      { type: "h2", text: "Read the failures" },
      {
        type: "p",
        text: "If one product is abandoned far more than the rest, the sequence is not the problem. Something on the page is, and no amount of follow-up will fix it.",
      },
    ],
  },
  {
    slug: "from-product-catalog-to-campaign",
    category: "Commerce",
    topic: "commerce",
    title: "From Product Catalog to Campaign in an Afternoon",
    description:
      "Keeping the catalog structured enough that building a campaign around a product range is an afternoon rather than a project.",
    readingMinutes: 5,
    publishedAt: "2026-02-05",
    image: "/blog/product-catalog.jpg",
    imageAlt: "A styled arrangement of retail product bottles and packaging.",
    body: [
      {
        type: "p",
        text: "The reason a seasonal campaign takes two weeks is almost never the campaign. It is the hour spent working out which products are actually in the range, and the second hour finding images that match.",
      },
      { type: "h2", text: "Structure the catalog for the campaign you will run" },
      {
        type: "list",
        items: [
          "Categories that match how you sell, not how you warehouse.",
          "One good image per product, at a consistent crop.",
          "Stock status that is true, so the campaign cannot promote something unavailable.",
          "Tags for the groupings you reach for repeatedly — new in, clearance, bestsellers.",
        ],
      },
      { type: "h2", text: "Build the audience from the orders" },
      {
        type: "p",
        text: "The strongest audience for a product range is the people who bought the last one. That segment already exists in the order history, and it outperforms a broad send reliably enough to be the first thing to try.",
      },
      { type: "h2", text: "Close the loop" },
      {
        type: "p",
        text: "If the campaign links to the catalog and the orders link back to the campaign, next season's version starts with a number instead of an opinion.",
      },
    ],
  },
  {
    slug: "order-confirmations-that-earn-repeat-business",
    category: "Commerce",
    topic: "commerce",
    title: "Order Confirmations That Earn the Next Order",
    description:
      "The transactional messages nobody optimises are the ones everybody reads. Here is what to do with that.",
    readingMinutes: 4,
    publishedAt: "2026-01-22",
    image: "/blog/order-confirmation.jpg",
    imageAlt: "Cardboard parcels stacked and ready for dispatch.",
    body: [
      {
        type: "p",
        text: "Order confirmations are opened at rates a marketing campaign will never reach. Most businesses use that attention to restate the total and nothing else.",
      },
      { type: "h2", text: "Answer the question they were about to ask" },
      {
        type: "p",
        text: "When will it arrive, how do I change it, and who do I ask. A confirmation that answers all three removes a support conversation and reads as competence.",
      },
      { type: "h2", text: "Add one thing, not five" },
      {
        type: "list",
        items: [
          "A genuinely relevant accessory for what they just bought.",
          "Or the care instructions. Or the setup guide.",
          "Never a discount on the thing they bought an hour ago.",
        ],
      },
      { type: "h2", text: "Then follow up once, later" },
      {
        type: "p",
        text: "A check-in timed to roughly when the product has been used a few times is the highest-yielding message in most commerce programmes, and almost nobody sends it.",
      },
    ],
  },
  {
    slug: "lead-scoring-without-overengineering-it",
    category: "Customer Management",
    topic: "customers",
    title: "Lead Scoring Without Over-Engineering It",
    description:
      "A scoring model small enough that the team trusts it, and specific enough to change who gets called first.",
    readingMinutes: 6,
    publishedAt: "2026-01-08",
    image: "/blog/lead-scoring.jpg",
    imageAlt: "Printed sales charts being examined with a magnifying glass.",
    body: [
      {
        type: "p",
        text: "Most lead scoring models die of complexity. Twenty weighted signals produce a number nobody can explain, and a number nobody can explain is a number nobody acts on.",
      },
      { type: "h2", text: "Score two things" },
      {
        type: "p",
        text: "Fit — are they the kind of customer you serve well. Interest — have they done something recently. Keep them separate; a perfect-fit lead who has gone quiet needs a different action to a poor-fit lead who is very active.",
      },
      { type: "h2", text: "Use four or five signals, not twenty" },
      {
        type: "list",
        items: [
          "Replied to a message.",
          "Asked about price.",
          "Visited more than once this week.",
          "Matches the segment your best customers came from.",
        ],
      },
      { type: "h2", text: "Check it against reality every quarter" },
      {
        type: "p",
        text: "Take the deals you actually won and look at what the model said about them beforehand. If the score had no relationship to the outcome, the model is decoration — and simplifying it is more useful than adding to it.",
      },
    ],
  },
  {
    slug: "contact-data-hygiene",
    category: "Customer Management",
    topic: "customers",
    title: "Contact Data Hygiene: The Unglamorous Work That Pays",
    description:
      "Duplicates, stale numbers and half-filled records quietly degrade every campaign, segment and report you build on them.",
    readingMinutes: 5,
    publishedAt: "2025-12-18",
    image: "/blog/contact-data.jpg",
    imageAlt: "Someone working at a desktop computer in an office.",
    body: [
      {
        type: "p",
        text: "Nobody schedules time for contact hygiene, which is why every database eventually contains the same customer three times under two spellings and a phone number that stopped working in 2023.",
      },
      { type: "h2", text: "What it actually costs" },
      {
        type: "list",
        items: [
          "Segments that are quietly wrong, so campaigns reach the wrong people.",
          "Customers messaged twice, which reads as carelessness.",
          "Reports that overstate the audience and understate the repeat rate.",
          "Money spent sending to addresses and numbers that cannot receive.",
        ],
      },
      { type: "h2", text: "Fix the intake, then the backlog" },
      {
        type: "p",
        text: "Cleaning a database that is still being filled badly is a treadmill. Decide which fields are required at capture, normalise phone numbers on the way in, and merge on a key that cannot be typed two ways.",
      },
      { type: "h2", text: "Make it a monthly half hour" },
      {
        type: "p",
        text: "Duplicates, bounces, contacts with no channel at all. Thirty minutes a month keeps a database usable; an annual project never quite finishes.",
      },
    ],
  },
  {
    slug: "building-your-first-automation-workflow",
    category: "Automation",
    topic: "automation",
    title: "Building Your First Automation Workflow, Step by Step",
    description:
      "Start with one journey you already run manually, and turn it into something that runs whether anyone is watching or not.",
    readingMinutes: 6,
    publishedAt: "2025-12-04",
    image: "/blog/first-workflow.jpg",
    imageAlt: "A flow diagram being drawn out on a whiteboard.",
    body: [
      {
        type: "p",
        text: "The best first workflow is not a clever one. It is the thing your team already does by hand, the same way, several times a week — because you already know it works and you already know what it should say.",
      },
      { type: "h2", text: "Write it down before you build it" },
      {
        type: "p",
        text: "On paper: what starts it, what happens, how long between each step, and what stops it. Most of the mistakes that are painful to unpick in a builder are obvious in four lines of handwriting.",
      },
      { type: "h2", text: "Build the smallest version" },
      {
        type: "list",
        items: [
          "One trigger.",
          "One message.",
          "One wait.",
          "One exit condition.",
        ],
      },
      { type: "h2", text: "Test it on yourself" },
      {
        type: "p",
        text: "Run it against your own contact record and read the messages as they arrive, at the intervals they arrive. Reading a sequence in a builder tells you nothing about how it feels to receive.",
      },
      { type: "h2", text: "Then add one branch" },
      {
        type: "p",
        text: "Once it has run for a week without surprising you, add the condition you knew you would need. Workflows built one branch at a time stay understandable; workflows built all at once get switched off.",
      },
    ],
  },
  {
    slug: "webhooks-and-api-connecting-your-stack",
    category: "Automation",
    topic: "automation",
    title: "Webhooks and APIs: Connecting MarketFlow to the Rest of Your Stack",
    description:
      "When a built-in integration is not enough, an outbound webhook and a few API calls usually are.",
    readingMinutes: 7,
    publishedAt: "2025-11-20",
    image: "/blog/webhooks-api.jpg",
    imageAlt: "Two developers looking at code on a laptop screen.",
    body: [
      {
        type: "p",
        text: "Every business eventually has one tool that nothing integrates with. That is what webhooks are for: a way to tell another system that something happened here, without either side knowing much about the other.",
      },
      { type: "h2", text: "Webhooks push, APIs pull" },
      {
        type: "p",
        text: "Use a webhook when something happening should cause something elsewhere — an order placed, a lead qualified. Use the API when you need to ask a question, or write data in on a schedule.",
      },
      { type: "h2", text: "Build the receiver defensively" },
      {
        type: "list",
        items: [
          "Verify the signature before trusting the payload.",
          "Respond fast and process afterwards — a slow endpoint causes retries.",
          "Expect duplicates, and make handling one twice harmless.",
          "Log what you received, not just what you did with it.",
        ],
      },
      { type: "h2", text: "Scope the key to the job" },
      {
        type: "p",
        text: "An API key that can do everything is a key you will be nervous about rotating. Issue one per integration, scoped to what that integration needs, and rotating becomes a five-minute task rather than a change freeze.",
      },
    ],
  },
  {
    slug: "conversion-funnel-where-customers-drop-off",
    category: "Analytics",
    topic: "analytics",
    title: "Reading a Conversion Funnel: Where Customers Actually Drop Off",
    description:
      "The biggest number in a funnel is rarely the most useful one. How to find the step that is genuinely costing you.",
    readingMinutes: 6,
    publishedAt: "2025-11-06",
    image: "/blog/conversion-funnel.jpg",
    imageAlt: "A presenter walking a small team through charts on a whiteboard.",
    body: [
      {
        type: "p",
        text: "Every funnel loses most of its people at the top. That is not a finding, it is arithmetic — and teams that react to it end up optimising the step that was never the problem.",
      },
      { type: "h2", text: "Compare a step to itself, not to the one above" },
      {
        type: "p",
        text: "The useful question is whether a step converts worse than it did last month, or worse than the same step does for a similar segment. A step that has always lost sixty per cent and still loses sixty per cent is not where the opportunity is.",
      },
      { type: "h2", text: "Segment before you conclude" },
      {
        type: "p",
        text: "An average funnel is several different funnels added together. Split by channel or by segment and the flat overall number usually resolves into one group doing well and one doing badly — which is an action, where the average was not.",
      },
      { type: "h2", text: "Look at time, not only at counts" },
      {
        type: "list",
        items: [
          "How long do people sit at each step before moving?",
          "Where does the gap grow when volume rises?",
          "Which step is slowest when your team is busiest?",
        ],
      },
    ],
  },
  {
    slug: "revenue-attribution-across-channels",
    category: "Analytics",
    topic: "analytics",
    title: "Revenue Attribution Across Channels, Without Fooling Yourself",
    description:
      "Every attribution model is wrong in a specific, knowable way. Pick one deliberately and know what it hides.",
    readingMinutes: 7,
    publishedAt: "2025-10-23",
    image: "/blog/revenue-attribution.jpg",
    imageAlt: "Coins scattered across printed financial charts.",
    body: [
      {
        type: "p",
        text: "Attribution is not a measurement problem, it is an allocation problem. The revenue is real; the question is which of the four things that happened before it gets the credit, and there is no objectively correct answer.",
      },
      { type: "h2", text: "What each model quietly assumes" },
      {
        type: "list",
        items: [
          "Last touch assumes the final click did the persuading. It systematically overvalues whichever channel sits closest to the purchase.",
          "First touch assumes discovery is everything, and undervalues the follow-up that closed it.",
          "Even-weight assumes every step mattered equally, which is easy to defend and rarely true.",
        ],
      },
      { type: "h2", text: "Pick one and keep it" },
      {
        type: "p",
        text: "Consistency is worth more than accuracy here. A model held steady for a year shows you direction, which is what budget decisions actually need. Switching models mid-year produces a change in the numbers that looks exactly like a change in performance.",
      },
      { type: "h2", text: "Sanity-check against the total" },
      {
        type: "p",
        text: "If the attributed revenue and the actual revenue diverge, trust the bank. The model is a lens on the business, not a second version of it.",
      },
    ],
  },
  {
    slug: "weekly-marketing-review-in-twenty-minutes",
    category: "Analytics",
    topic: "analytics",
    title: "A Weekly Marketing Review That Takes Twenty Minutes",
    description:
      "Five questions, one page, once a week — a review short enough that it actually happens every week.",
    readingMinutes: 4,
    publishedAt: "2025-10-09",
    image: "/blog/weekly-review.jpg",
    imageAlt: "A small team reviewing work together around a laptop.",
    body: [
      {
        type: "p",
        text: "The monthly marketing review is too late to change anything and too long to prepare, which is why it slips. A weekly one only works if it is genuinely short.",
      },
      { type: "h2", text: "The five questions" },
      {
        type: "list",
        items: [
          "What went out this week, and what did it produce?",
          "Which number moved more than usual, up or down?",
          "What is stuck — leads with no activity, conversations with no reply?",
          "What are we sending next week, and to whom?",
          "What is one thing we are stopping?",
        ],
      },
      { type: "h2", text: "The last question is the important one" },
      {
        type: "p",
        text: "Marketing programmes accumulate. Without a standing prompt to remove something, the weekly send list only ever grows, and the review turns into a status meeting about work nobody has time to do properly.",
      },
      { type: "h2", text: "Write down the decision, not the data" },
      {
        type: "p",
        text: "The numbers are already in the dashboard. What is worth keeping is the sentence explaining what you decided because of them — which is the only part you will want in three months.",
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
