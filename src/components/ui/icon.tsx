import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  Code,
  CreditCard,
  FileText,
  Funnel,
  GitBranch,
  Globe,
  Home,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  Layers,
  Library,
  ListChecks,
  Lock,
  Mail,
  MailOpen,
  Megaphone,
  MessageCircle,
  Plug,
  ScrollText,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tag,
  Target,
  Terminal,
  Ticket,
  User,
  UserCog,
  Users,
  Webhook,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Maps the icon keys used in `constants/navigation` to Lucide components. */
const ICONS: Record<string, LucideIcon> = {
  home: Home,
  sparkles: Sparkles,
  tag: Tag,
  "layout-dashboard": LayoutDashboard,
  "bar-chart": BarChart3,
  users: Users,
  target: Target,
  megaphone: Megaphone,
  "message-circle": MessageCircle,
  mail: Mail,
  smartphone: Smartphone,
  workflow: Workflow,
  "file-text": FileText,
  plug: Plug,
  settings: Settings,

  /* Marketing */
  "calendar-days": CalendarDays,
  inbox: Inbox,

  /* Customers */
  layers: Layers,
  "git-branch": GitBranch,

  /* Automation */
  "layout-template": LayoutTemplate,
  zap: Zap,
  "scroll-text": ScrollText,

  /* Growth */
  "clipboard-list": ClipboardList,
  funnel: Funnel,
  "list-checks": ListChecks,
  globe: Globe,
  ticket: Ticket,

  /* Content */
  library: Library,
  "mail-open": MailOpen,
  image: ImageIcon,

  /* Integrations */
  webhook: Webhook,
  code: Code,

  /* Workspace */
  "user-cog": UserCog,
  "shield-check": ShieldCheck,
  activity: Activity,
  building: Building2,

  /* Settings */
  user: User,
  bell: Bell,
  "credit-card": CreditCard,
  lock: Lock,
  terminal: Terminal,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const Component = ICONS[name] ?? LayoutDashboard;
  return <Component className={className} aria-hidden />;
}
