/**
 * The legal documents - Privacy Policy and Terms of Service - as data.
 *
 * Content lives here rather than in JSX for the same reason the blog's does:
 * every section renders with the same measure, the same numbering and the same
 * rhythm, and the "On this page" navigation is built from the same array the
 * body is, so a section cannot exist without a nav entry or the other way
 * round.
 *
 * ## What is deliberately not claimed
 *
 * These documents describe MarketFlow as it is built. Beyond the dummy company
 * details in `LEGAL_PLACEHOLDERS`, they name no governing jurisdiction,
 * certification (SOC 2, ISO 27001), regulatory status (GDPR, CCPA),
 * encryption standard, uptime figure, delivery rate or payment processor,
 * because none of those is established anywhere in the product. Governing
 * law (Terms §28) points at wherever the company is registered rather than
 * naming a country. Replace the dummy details in `LEGAL_PLACEHOLDERS`, once,
 * before the pages go live, and have the result reviewed by a lawyer.
 *
 * Free trials and free plans are written conditionally ("if we offer…")
 * because pricing commits to neither: `PLANS` has no free tier and
 * `PRICING_FAQS` names no trial length.
 */

/**
 * Every fact the documents need that the product does not supply.
 *
 * All of these are DUMMY values for development and demo work -
 * `example.com` is a reserved domain, so nothing sent to those addresses goes
 * anywhere. Replace them with the real details before launch.
 */
export const LEGAL_PLACEHOLDERS = {
  companyName: "MarketFlow Technologies Ltd.",
  companyAddress: "123 Innovation Avenue, Dhaka 1212, Bangladesh",
  legalEmail: "legal@marketflow.example.com",
  privacyEmail: "privacy@marketflow.example.com",
  lastUpdated: "September 23, 2026",
} as const;

const P = LEGAL_PLACEHOLDERS;

/** A list item, optionally led by a bold term: "Account information - …". */
export type LegalListItem = string | { term: string; text: string };

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: LegalListItem[] };

export interface LegalSection {
  /** The anchor. Stable - other pages and support replies link to these. */
  id: string;
  title: string;
  /** A shorter label for the "On this page" navigation, where one reads better. */
  navLabel?: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  title: string;
  sections: LegalSection[];
}

/* -------------------------------------------------------------------------- */
/* Privacy Policy                                                             */
/* -------------------------------------------------------------------------- */

export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy Policy",
  sections: [
    {
      id: "introduction",
      title: "Introduction",
      navLabel: "Overview",
      blocks: [
        {
          type: "p",
          text: `This Privacy Policy explains how ${P.companyName} ("MarketFlow", "we", "us" or "our") handles information in connection with the MarketFlow website and platform (together, the "Service"). MarketFlow is a customer engagement workspace: businesses use it to manage contacts and leads, hold customer conversations over WhatsApp, email, SMS and social channels, run campaigns, automate follow-ups, manage products and orders, and measure the results.`,
        },
        {
          type: "p",
          text: "Because of what MarketFlow does, two kinds of information pass through it. The first is information about you as a MarketFlow user - your account, your workspace and how you use the product. The second is information that businesses put into MarketFlow about their own customers and leads. We treat these differently, and Section 11 explains how.",
        },
        {
          type: "p",
          text: "By using the Service you acknowledge that you have read this Privacy Policy. If you do not agree with it, please do not use the Service.",
        },
      ],
    },
    {
      id: "information-we-collect",
      title: "Information We Collect",
      blocks: [
        {
          type: "p",
          text: "We collect information you provide to us, information your workspace stores in MarketFlow, and information generated automatically when you use the Service.",
        },
        { type: "h3", text: "Information you provide" },
        {
          type: "list",
          items: [
            {
              term: "Account information",
              text: "your name, email address, password, and any profile details you add, such as a photo or job title.",
            },
            {
              term: "Business and workspace information",
              text: "your business name, workspace settings, team members you invite and the roles you assign them, sender identities, connected phone numbers and domains, and billing contact details.",
            },
            {
              term: "Support and communications",
              text: "what you tell us when you contact support, reply to our emails or give us feedback.",
            },
          ],
        },
        { type: "h3", text: "Information your workspace stores" },
        {
          type: "list",
          items: [
            {
              term: "Customer and contact information",
              text: "names, phone numbers, email addresses, social profiles, tags, custom fields, segments and notes that you import or create for your customers.",
            },
            {
              term: "Leads and customer interaction data",
              text: "lead sources, pipeline stages, form submissions, assignments and the activity history MarketFlow records against each contact.",
            },
            {
              term: "Campaign and marketing data",
              text: "campaigns, audiences, message templates, scheduled posts, media you upload and the delivery, open, click and reply events reported back for them.",
            },
            {
              term: "Messages and communication data",
              text: "the content and metadata of WhatsApp, email, SMS and social conversations sent or received through your workspace, including attachments and conversation assignments.",
            },
            {
              term: "Orders and commerce information",
              text: "products, categories, inventory, catalogs, discounts and orders, including the customer details, items, amounts and statuses attached to each order.",
            },
            {
              term: "Automation data",
              text: "the workflows, triggers and conditions you build, and the record of when each one ran and what it did.",
            },
          ],
        },
        { type: "h3", text: "Information collected automatically" },
        {
          type: "list",
          items: [
            {
              term: "Usage and analytics data",
              text: "the pages and features you use, actions you take in the workspace, and the time and duration of your sessions.",
            },
            {
              term: "Device, browser and technical information",
              text: "IP address, browser type and version, operating system, device identifiers, language and time-zone settings, referring pages, and error and performance logs.",
            },
            {
              term: "Cookies and similar technologies",
              text: "small files and local storage used to keep you signed in, remember your preferences and understand how the Service is used. Section 6 covers these in more detail.",
            },
          ],
        },
      ],
    },
    {
      id: "how-we-use-information",
      title: "How We Use Information",
      blocks: [
        { type: "p", text: "We use the information described above to:" },
        {
          type: "list",
          items: [
            "provide, operate and maintain MarketFlow and your workspace;",
            "deliver, receive and organise customer conversations in the shared inbox;",
            "run the campaigns you create and report on how they performed;",
            "execute the automations and follow-ups you configure;",
            "store and organise your contacts, leads and segments;",
            "record and manage products, inventory and orders;",
            "produce the analytics, dashboards and reports in your workspace;",
            "understand how the Service is used so we can fix problems and improve features;",
            "keep the Service, our users and their customers secure;",
            "detect, investigate and prevent abuse, spam, fraud and violations of our Terms of Service;",
            "respond to support requests and questions;",
            "send you service messages - such as security alerts, billing notices and changes to the Service or to this policy.",
          ],
        },
        {
          type: "p",
          text: "We may also send you product news or marketing emails. You can opt out of those at any time using the link in the message; service messages will continue while you have an account.",
        },
      ],
    },
    {
      id: "communication-channels",
      title: "Communication Channels",
      blocks: [
        {
          type: "p",
          text: "Most of what MarketFlow does involves sending or receiving messages through channels that other companies operate. When you use a channel, the relevant information passes between MarketFlow and that channel's provider so the message can be delivered and its status reported back.",
        },
        {
          type: "list",
          items: [
            {
              term: "WhatsApp",
              text: "messages, templates, media and contact phone numbers are exchanged with the WhatsApp Business Platform, or with the WhatsApp business solution provider you connect, together with delivery and read statuses.",
            },
            {
              term: "Email",
              text: "recipient addresses, message content and sender details are passed to the email or SMTP provider configured for your workspace, which returns delivery, bounce, open and click events where it supports them.",
            },
            {
              term: "SMS",
              text: "recipient phone numbers and message content are passed to the SMS provider you connect, which returns delivery statuses and replies.",
            },
            {
              term: "Social media",
              text: "when you connect accounts such as Instagram, Facebook, LinkedIn or X, MarketFlow exchanges the posts, media, scheduling details and performance data needed to publish and measure your content, within the permissions you grant.",
            },
            {
              term: "Webhooks",
              text: "when you configure a webhook, MarketFlow sends the event data you selected to the URL you provide. What happens to it there is controlled by you or the service at that address.",
            },
            {
              term: "API",
              text: "when you or a tool you authorise uses the MarketFlow API, data is read from or written to your workspace according to the permissions of the credentials used.",
            },
          ],
        },
        {
          type: "p",
          text: "Channel providers process this information under their own terms and privacy policies, and may apply their own rules to what can be sent. MarketFlow cannot guarantee that any provider will accept or deliver a particular message.",
        },
      ],
    },
    {
      id: "integrations",
      title: "Integrations and Third-Party Services",
      navLabel: "Integrations",
      blocks: [
        {
          type: "p",
          text: "MarketFlow lets you connect external services to your workspace - for example messaging providers, social platforms, commerce platforms such as Shopify, and your own systems through webhooks and the API. Connecting an integration is your choice, and you can disconnect it from your workspace settings.",
        },
        {
          type: "p",
          text: "When you connect an integration, you authorise MarketFlow to exchange information with that service as needed to make the integration work. Information you send to, or receive from, a third-party service is also subject to that service's own privacy policy and terms, which we do not control. We encourage you to review them before connecting.",
        },
      ],
    },
    {
      id: "cookies",
      title: "Cookies and Tracking Technologies",
      navLabel: "Cookies",
      blocks: [
        {
          type: "p",
          text: "We use cookies, local storage and similar technologies on the MarketFlow website and platform. They fall into three broad groups:",
        },
        {
          type: "list",
          items: [
            {
              term: "Essential",
              text: "needed to sign you in, keep your session secure and make the workspace work. The Service cannot function without them.",
            },
            {
              term: "Preferences",
              text: "remember choices such as your selected workspace, table layouts or dismissed notices.",
            },
            {
              term: "Analytics",
              text: "help us understand which pages and features are used so we can improve them.",
            },
          ],
        },
        {
          type: "p",
          text: "Most browsers let you block or delete cookies. If you block essential cookies, parts of the Service - including signing in - will not work.",
        },
      ],
    },
    {
      id: "data-sharing",
      title: "Data Sharing and Disclosure",
      navLabel: "Data Sharing",
      blocks: [
        {
          type: "p",
          text: "We do not sell personal information. We share information only in the circumstances below:",
        },
        {
          type: "list",
          items: [
            {
              term: "Service providers",
              text: "companies that help us run the Service - for example with hosting, email delivery, customer support or billing - who may use the information only to provide those services to us.",
            },
            {
              term: "Integration providers",
              text: "the messaging, social, commerce and other services you connect, to the extent needed to make those integrations work.",
            },
            {
              term: "Analytics providers",
              text: "tools that help us understand usage of the Service.",
            },
            {
              term: "Infrastructure providers",
              text: "the cloud and network providers on which MarketFlow and its data are hosted.",
            },
            {
              term: "Within your workspace",
              text: "with the team members your workspace owner or admins have invited, according to their roles.",
            },
            {
              term: "Legal requirements",
              text: "with courts, regulators, law enforcement or other authorities when we believe in good faith that disclosure is required by law or legal process, or is necessary to protect the rights, property or safety of MarketFlow, our users or others.",
            },
            {
              term: "Business transfers",
              text: "as part of a merger, acquisition, financing or sale of all or part of our business, in which case the information would remain subject to protections consistent with this policy.",
            },
            {
              term: "With your consent",
              text: "in any other case where you have asked us to or agreed to it.",
            },
          ],
        },
      ],
    },
    {
      id: "data-retention",
      title: "Data Retention",
      blocks: [
        {
          type: "p",
          text: "We keep account and workspace information for as long as your account is active and as needed to provide the Service. Customer data in a workspace is kept until the workspace deletes it or the account is closed.",
        },
        {
          type: "p",
          text: "After an account is closed we delete or de-identify its information within a reasonable period, except where we need to keep some of it longer - for example to meet legal, tax or accounting obligations, resolve disputes, enforce our agreements or protect against fraud and abuse. Copies may persist in backups for a limited time before they are overwritten.",
        },
      ],
    },
    {
      id: "data-security",
      title: "Data Security",
      navLabel: "Security",
      blocks: [
        {
          type: "p",
          text: "We use administrative, technical and organisational measures designed to protect information against unauthorised access, loss and misuse. These include limiting access to the people who need it, role-based permissions within each workspace, and monitoring the Service for suspicious activity.",
        },
        {
          type: "p",
          text: "No method of transmission or storage is completely secure, and we cannot guarantee absolute security. You play a part too: use a strong, unique password, keep your credentials and API keys private, review who has access to your workspace, and tell us promptly if you suspect unauthorised access.",
        },
      ],
    },
    {
      id: "your-rights",
      title: "User Rights and Choices",
      navLabel: "Your Rights",
      blocks: [
        {
          type: "p",
          text: "Depending on where you live, you may have rights over your personal information. Subject to applicable law, these can include the right to:",
        },
        {
          type: "list",
          items: [
            "access the personal information we hold about you;",
            "correct information that is inaccurate or incomplete;",
            "delete your information;",
            "receive a copy of your information in a portable format;",
            "object to or restrict certain processing;",
            "withdraw consent where we rely on it.",
          ],
        },
        {
          type: "p",
          text: `Much of your account and workspace information can be viewed, edited, exported or deleted directly in MarketFlow. For anything else, contact us at ${P.privacyEmail}. We may need to verify your identity before acting on a request, and some requests may be limited where the law allows or requires us to keep information.`,
        },
        {
          type: "p",
          text: "If you are a customer or lead of a business that uses MarketFlow, please see Section 11 - in most cases that business is the right place to send your request.",
        },
      ],
    },
    {
      id: "customer-data",
      title: "Business Customer and End-Customer Data",
      navLabel: "End-Customer Data",
      blocks: [
        {
          type: "p",
          text: "Three different groups of people are involved in MarketFlow, and their information is handled differently:",
        },
        {
          type: "list",
          items: [
            {
              term: "MarketFlow users",
              text: "the people who sign in to MarketFlow - workspace owners, admins and team members. We are responsible for their account information as described in this policy.",
            },
            {
              term: "Businesses using MarketFlow",
              text: "the companies that operate workspaces. They decide which customers to add, what to send them and how to use the results.",
            },
            {
              term: "End customers and leads",
              text: "the people whose details a business imports, captures or messages through MarketFlow.",
            },
          ],
        },
        {
          type: "p",
          text: "For end-customer and lead information, the business that operates the workspace decides why and how it is processed, and MarketFlow processes it on that business's behalf and according to its instructions. That business is responsible for having a lawful basis and any required consent to collect the information and to contact the people concerned, and for answering their questions and requests.",
        },
        {
          type: "p",
          text: "If you are an end customer and want to access, correct or delete information a business holds about you, or stop receiving its messages, please contact that business directly. If you contact us instead, we will try to direct your request to the right business.",
        },
      ],
    },
    {
      id: "childrens-privacy",
      title: "Children's Privacy",
      navLabel: "Children",
      blocks: [
        {
          type: "p",
          text: "MarketFlow is a business tool and is not directed at children. We do not knowingly collect personal information from anyone under the age at which they can lawfully consent to it where they live. If you believe a child has given us personal information, contact us and we will take steps to delete it.",
        },
        {
          type: "p",
          text: "Businesses using MarketFlow must not use it to collect or process children's information in violation of applicable law.",
        },
      ],
    },
    {
      id: "international-transfers",
      title: "International Data Transfers",
      navLabel: "International Transfers",
      blocks: [
        {
          type: "p",
          text: "MarketFlow, our service providers and the integrations you connect may process information in countries other than the one where you or your customers live. Those countries may have data protection laws that differ from yours.",
        },
        {
          type: "p",
          text: "Where we transfer personal information across borders, we take steps intended to ensure it continues to be protected in line with this policy and applicable law.",
        },
      ],
    },
    {
      id: "changes",
      title: "Changes to This Privacy Policy",
      navLabel: "Changes",
      blocks: [
        {
          type: "p",
          text: 'We may update this Privacy Policy from time to time. When we do, we will change the "Last updated" date at the top of this page, and if the changes are material we will give you notice - for example by email or in the Service - before they take effect.',
        },
        {
          type: "p",
          text: "Continuing to use the Service after an update takes effect means you accept the revised policy.",
        },
      ],
    },
    {
      id: "contact",
      title: "Contact Information",
      navLabel: "Contact",
      blocks: [
        {
          type: "p",
          text: "If you have questions about this Privacy Policy or how MarketFlow handles information, contact us:",
        },
        {
          type: "list",
          items: [
            { term: "Company", text: P.companyName },
            { term: "Address", text: P.companyAddress },
            { term: "Privacy enquiries", text: P.privacyEmail },
            { term: "Legal enquiries", text: P.legalEmail },
          ],
        },
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Terms of Service                                                           */
/* -------------------------------------------------------------------------- */

export const TERMS_OF_SERVICE: LegalDocument = {
  title: "Terms of Service",
  sections: [
    {
      id: "acceptance",
      title: "Introduction and Acceptance",
      navLabel: "Overview",
      blocks: [
        {
          type: "p",
          text: `These Terms of Service ("Terms") are an agreement between you and ${P.companyName} ("MarketFlow", "we", "us" or "our") and govern your use of the MarketFlow website, platform, APIs and related services (the "Service").`,
        },
        {
          type: "p",
          text: 'By creating an account, accessing or using the Service, you agree to these Terms and to our Privacy Policy. If you use the Service on behalf of a business or other organisation, you confirm that you have authority to bind it, and "you" means that organisation. If you do not agree, do not use the Service.',
        },
      ],
    },
    {
      id: "eligibility",
      title: "Eligibility",
      blocks: [
        {
          type: "p",
          text: "MarketFlow is intended for businesses and professionals. To use it you must be old enough to form a binding contract where you live, be using it for business purposes, and not be barred from using it under any applicable law.",
        },
      ],
    },
    {
      id: "account",
      title: "MarketFlow Account",
      blocks: [
        {
          type: "p",
          text: "You need an account to use most of the Service. You agree to give accurate information when you register and to keep it up to date.",
        },
        {
          type: "p",
          text: "You are responsible for keeping your password and any API keys confidential, and for all activity under your account. Tell us promptly if you believe your account has been accessed without your permission.",
        },
      ],
    },
    {
      id: "workspace",
      title: "Workspace and Team Members",
      blocks: [
        {
          type: "p",
          text: "Your account operates within one or more workspaces. The workspace owner can invite team members and assign them roles - such as Workspace Admin, Marketing Manager, Sales Agent, Support Agent, Analyst or Viewer - which control what each person can see and do.",
        },
        {
          type: "p",
          text: "The workspace owner is responsible for who is given access, for the roles they hold, and for the actions team members take in the workspace.",
        },
      ],
    },
    {
      id: "user-responsibilities",
      title: "User Responsibilities",
      navLabel: "Your Responsibilities",
      blocks: [
        { type: "p", text: "When you use MarketFlow, you are responsible for:" },
        {
          type: "list",
          items: [
            "the customer and lead data you upload, import, capture or create in your workspace;",
            "having the rights, and any permission or consent required by law, to collect that data and to contact the people it relates to;",
            "the content of your messages, templates, campaigns, posts and automations;",
            "making sure your use of the Service complies with the laws that apply to you and to the people you contact, and with the policies of the channels you use;",
            "the third-party accounts you connect and the access you grant to them;",
            "the configuration of your automations, integrations and webhooks.",
          ],
        },
      ],
    },
    {
      id: "acceptable-use",
      title: "Acceptable Use",
      blocks: [
        { type: "p", text: "You must not use MarketFlow to:" },
        {
          type: "list",
          items: [
            "send spam, or messages to people who have not given any consent the law requires, or who have opted out;",
            "use purchased, rented, scraped or otherwise improperly obtained contact lists;",
            "send content that is unlawful, deceptive, fraudulent, harassing, hateful, defamatory or infringes anyone's rights;",
            "impersonate any person or organisation, or misrepresent who a message is from;",
            "distribute malware, phishing links or other harmful code;",
            "breach the policies of WhatsApp, email and SMS providers, social platforms or other connected services;",
            "attempt to gain unauthorised access to the Service, other workspaces or connected systems, or probe, scan or test their vulnerabilities without permission;",
            "interfere with or overload the Service, or circumvent its usage limits or security controls;",
            "copy, resell or reverse-engineer the Service, except where the law expressly allows it.",
          ],
        },
        {
          type: "p",
          text: "We may investigate suspected violations and take action under Section 20, including removing content or suspending messaging.",
        },
      ],
    },
    {
      id: "customer-data",
      title: "Customer Data",
      blocks: [
        {
          type: "p",
          text: '"Customer Data" means the contacts, leads, conversations, orders and other information about your customers that you or your integrations put into MarketFlow. As between you and us, you own your Customer Data.',
        },
        {
          type: "p",
          text: "You grant us permission to host, store, process, transmit and display Customer Data as needed to provide, secure and support the Service for you, and as described in our Privacy Policy. We process Customer Data on your behalf and according to your instructions as expressed through your use of the Service.",
        },
        {
          type: "p",
          text: "You are responsible for the accuracy, quality and legality of Customer Data and of the means by which you obtained it, and for keeping any copies you need outside MarketFlow.",
        },
      ],
    },
    {
      id: "campaigns",
      title: "Campaigns and Marketing Communications",
      navLabel: "Campaigns",
      blocks: [
        {
          type: "p",
          text: "You decide who receives your campaigns, what they say and when they are sent. You are responsible for making sure every campaign complies with the marketing, privacy and consumer protection laws that apply to you and to your recipients.",
        },
        {
          type: "p",
          text: "Where the law requires it, you must obtain permission from recipients before sending them marketing messages, identify yourself as the sender, provide a way to opt out, and honour opt-out requests promptly. MarketFlow provides tools to help - such as segments and templates - but using them correctly remains your responsibility.",
        },
      ],
    },
    {
      id: "messaging",
      title: "WhatsApp, Email, SMS and Social Messaging",
      navLabel: "Messaging Channels",
      blocks: [
        {
          type: "p",
          text: "MarketFlow sends and receives messages through channels operated by other companies. When you use a channel, you must also follow that provider's terms and policies - for example WhatsApp's business and commerce policies and template approval rules, your email provider's sending rules, carrier and registration requirements for SMS, and each social platform's terms.",
        },
        {
          type: "p",
          text: "Delivery depends on those providers. They can reject, filter, delay, throttle or block messages, decline templates, or restrict or suspend your account with them, and none of that is within our control. MarketFlow does not guarantee that any WhatsApp, email, SMS or social message will be delivered, delivered on time, opened or read.",
        },
        {
          type: "p",
          text: "Provider fees, message limits and quality ratings may apply in addition to your MarketFlow subscription, and are set by the provider.",
        },
      ],
    },
    {
      id: "automation",
      title: "Automation and Workflows",
      navLabel: "Automation",
      blocks: [
        {
          type: "p",
          text: "Workflows run the actions you configure - such as sending messages, updating contacts or moving leads - when their triggers and conditions are met. You are responsible for building, testing and monitoring your workflows, and for the messages and changes they produce.",
        },
        {
          type: "p",
          text: "Automations can act on large numbers of contacts quickly. Review a workflow before activating it, and pause it if it behaves unexpectedly. We are not responsible for the results of a workflow that runs as it was configured.",
        },
      ],
    },
    {
      id: "commerce",
      title: "Commerce, Products and Orders",
      navLabel: "Commerce",
      blocks: [
        {
          type: "p",
          text: "MarketFlow lets you manage products, categories, inventory, catalogs, discounts and orders. You are the seller: you are responsible for your products, their descriptions and prices, fulfilment, returns, refunds, taxes, and your relationship with your customers.",
        },
        {
          type: "p",
          text: "Where payments are handled through a third-party payment provider, that provider processes them under its own terms. MarketFlow is not a party to transactions between you and your customers.",
        },
      ],
    },
    {
      id: "integrations",
      title: "Integrations, APIs and Webhooks",
      navLabel: "Integrations & API",
      blocks: [
        {
          type: "p",
          text: "You may connect third-party services to MarketFlow and use our API and webhooks to exchange data with your own systems. You are responsible for the accounts you connect, the credentials you use, and where your webhooks send data.",
        },
        {
          type: "p",
          text: "Keep API keys secure and do not share them publicly. We may apply rate limits and other technical limits to the API, and may change, deprecate or discontinue API features with reasonable notice where practical. An integration can stop working if the third party changes or withdraws its service.",
        },
      ],
    },
    {
      id: "analytics",
      title: "Analytics and Reporting",
      navLabel: "Analytics",
      blocks: [
        {
          type: "p",
          text: "MarketFlow's analytics and reports are based on data from your workspace and from the providers you connect. Some figures - such as delivery, open and attribution data - depend on what those providers report and may be delayed, estimated or incomplete.",
        },
        {
          type: "p",
          text: "Reports are provided to help you understand your activity. They are not a guarantee of any result, and you should not rely on them as your only source for financial, tax or legal decisions.",
        },
      ],
    },
    {
      id: "intellectual-property",
      title: "Intellectual Property",
      blocks: [
        {
          type: "p",
          text: "The Service - including its software, design, text, graphics, logos and the MarketFlow name - is owned by us or our licensors and protected by intellectual property laws. These Terms give you a limited, non-exclusive, non-transferable right to use the Service for your business during your subscription. They do not transfer any ownership to you.",
        },
        {
          type: "p",
          text: "If you send us feedback or suggestions, we may use them without any obligation to you.",
        },
      ],
    },
    {
      id: "user-content",
      title: "User Content",
      blocks: [
        {
          type: "p",
          text: '"User Content" means the templates, messages, campaigns, media, product listings and other material you create or upload. You keep ownership of it, and give us permission to host, copy, process and display it as needed to operate the Service for you.',
        },
        {
          type: "p",
          text: "You confirm that you have the rights needed to use your User Content, and that it does not infringe anyone else's rights or break the law. We may remove User Content that we reasonably believe violates these Terms.",
        },
      ],
    },
    {
      id: "third-party-services",
      title: "Third-Party Services",
      blocks: [
        {
          type: "p",
          text: "The Service works with third-party services that we do not own or control, including messaging providers, social platforms and commerce tools. Your use of them is governed by their own terms and privacy policies, and we are not responsible for their availability, content, actions or data practices.",
        },
      ],
    },
    {
      id: "billing",
      title: "Subscriptions and Billing",
      blocks: [
        {
          type: "p",
          text: "Paid plans are billed in advance on a monthly or yearly basis, as selected when you subscribe. Plan features and limits - such as workspaces, contacts and message volumes - are described on our pricing page and may differ between plans.",
        },
        {
          type: "p",
          text: "Subscriptions renew automatically at the end of each billing period unless cancelled. You authorise us, or our payment provider, to charge the payment method on file for each renewal and for any upgrades. Fees are exclusive of taxes unless stated otherwise, and you are responsible for applicable taxes.",
        },
        {
          type: "p",
          text: "You can change plans from your workspace billing settings. We may change our prices; if we do, we will give you notice before the change applies to your next billing period. Except where required by law or stated otherwise in writing, fees already paid are non-refundable.",
        },
        {
          type: "p",
          text: "If a payment fails, we may retry it and, if it remains unpaid, limit or suspend access to paid features until the balance is settled.",
        },
      ],
    },
    {
      id: "free-plan",
      title: "Free Trial / Free Plan",
      navLabel: "Free Trial & Free Plan",
      blocks: [
        {
          type: "p",
          text: "If we offer a free trial or free plan, its length, features and limits will be described when you sign up. Unless you cancel before a trial ends, it may convert to a paid subscription and your payment method will be charged, if one was provided.",
        },
        {
          type: "p",
          text: "Free trials and free plans are provided as they are, may have lower limits than paid plans, and may be changed or ended by us at any time.",
        },
      ],
    },
    {
      id: "cancellation",
      title: "Cancellation",
      blocks: [
        {
          type: "p",
          text: "You can cancel your subscription at any time from your workspace billing settings. Cancellation stops the next renewal; your workspace remains available until the end of the period you have already paid for.",
        },
      ],
    },
    {
      id: "termination",
      title: "Account Suspension or Termination",
      navLabel: "Suspension & Termination",
      blocks: [
        {
          type: "p",
          text: "We may suspend or terminate your access to all or part of the Service - including sending on particular channels - if you materially breach these Terms, fail to pay fees, create a risk of harm or legal exposure for us, other users or recipients, or if a provider requires us to. Where reasonable, we will notify you first and give you an opportunity to fix the issue.",
        },
        {
          type: "p",
          text: "You may stop using the Service and close your account at any time.",
        },
      ],
    },
    {
      id: "data-after-termination",
      title: "Data After Termination",
      blocks: [
        {
          type: "p",
          text: "Before your account closes, you can export your contacts, campaign history and other data from the Service. After closure, we may delete your workspace and Customer Data after a reasonable period, except where we must keep information to meet legal obligations, resolve disputes or enforce our agreements. Deleted data cannot be recovered.",
        },
      ],
    },
    {
      id: "availability",
      title: "Service Availability",
      blocks: [
        {
          type: "p",
          text: "We work to keep MarketFlow available and reliable, but we do not promise that it will be uninterrupted, error-free or available at any particular time. The Service may be unavailable during maintenance, updates or events outside our control, and features that depend on third-party providers are subject to their availability.",
        },
      ],
    },
    {
      id: "disclaimers",
      title: "Disclaimers",
      blocks: [
        {
          type: "p",
          text: 'To the extent permitted by law, the Service is provided "as is" and "as available", without warranties of any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose and non-infringement.',
        },
        {
          type: "p",
          text: "MarketFlow does not guarantee any business outcome from using the Service - including message delivery or open rates, lead volumes, conversion rates, sales or revenue. Results depend on your business, your content, your audience and third-party providers.",
        },
      ],
    },
    {
      id: "limitation-of-liability",
      title: "Limitation of Liability",
      blocks: [
        {
          type: "p",
          text: "To the extent permitted by law, MarketFlow and its affiliates, directors, employees and suppliers will not be liable for any indirect, incidental, special, consequential or punitive damages, or for any loss of profits, revenue, data, goodwill or business opportunity, arising from or related to your use of the Service.",
        },
        {
          type: "p",
          text: "To the extent permitted by law, our total liability for any claim arising from or related to these Terms or the Service is limited to the amount you paid us for the Service in the twelve months before the event giving rise to the claim.",
        },
        {
          type: "p",
          text: "Some jurisdictions do not allow certain limitations, so some of the above may not apply to you.",
        },
      ],
    },
    {
      id: "indemnification",
      title: "Indemnification",
      blocks: [
        {
          type: "p",
          text: "You agree to defend, indemnify and hold harmless MarketFlow and its affiliates, directors, employees and suppliers from claims, damages, losses and expenses (including reasonable legal fees) arising from your Customer Data, your User Content, the messages you send, your violation of these Terms or of any law or third-party policy, or your violation of anyone's rights.",
        },
      ],
    },
    {
      id: "changes-to-service",
      title: "Changes to the Service",
      blocks: [
        {
          type: "p",
          text: "We continually develop MarketFlow and may add, change or remove features. If we make a change that materially reduces the core functionality of a paid plan you are subscribed to, we will give you reasonable notice.",
        },
      ],
    },
    {
      id: "changes-to-terms",
      title: "Changes to the Terms",
      blocks: [
        {
          type: "p",
          text: 'We may update these Terms from time to time. We will change the "Last updated" date at the top of this page and, for material changes, give you notice by email or in the Service before they take effect. If you continue to use the Service after the changes take effect, you accept the updated Terms.',
        },
      ],
    },
    {
      id: "governing-law",
      title: "Governing Law and Dispute Resolution",
      navLabel: "Governing Law",
      blocks: [
        {
          type: "p",
          text: `These Terms are governed by the laws of the jurisdiction in which ${P.companyName} is registered, without regard to its conflict-of-law rules. Any dispute arising from these Terms or the Service will be resolved in the courts of that jurisdiction, unless applicable law requires otherwise.`,
        },
        {
          type: "p",
          text: `Before starting formal proceedings, please contact us at ${P.legalEmail} so we can try to resolve the issue informally.`,
        },
      ],
    },
    {
      id: "contact",
      title: "Contact Information",
      navLabel: "Contact",
      blocks: [
        { type: "p", text: "If you have questions about these Terms, contact us:" },
        {
          type: "list",
          items: [
            { term: "Company", text: P.companyName },
            { term: "Address", text: P.companyAddress },
            { term: "Legal enquiries", text: P.legalEmail },
            { term: "Privacy enquiries", text: P.privacyEmail },
          ],
        },
      ],
    },
  ],
};
