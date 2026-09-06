export type CampaignChannel = "email" | "sms" | "whatsapp" | "multi";

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "paused"
  | "failed";

export interface CampaignStats {
  recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  failed: number;
}

export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  subject?: string;
  templateId?: string;
  audienceId?: string;
  segmentFilters?: Record<string, unknown>;
  scheduledAt?: string;
  sentAt?: string;
  stats: CampaignStats;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignListQuery {
  search?: string;
  channel?: CampaignChannel;
  status?: CampaignStatus;
  page?: number;
  limit?: number;
}

export type CreateCampaignPayload = Omit<
  Campaign,
  "id" | "stats" | "sentAt" | "createdAt" | "updatedAt" | "createdBy"
>;

export type UpdateCampaignPayload = Partial<CreateCampaignPayload> & { id: string };

export type TemplateCategory = "marketing" | "transactional" | "utility" | "authentication";

export interface Template {
  id: string;
  name: string;
  channel: CampaignChannel;
  category: TemplateCategory;
  subject?: string;
  body: string;
  variables: string[];
  approvalStatus?: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}
