export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type LeadSource =
  | "website"
  | "whatsapp"
  | "email"
  | "sms"
  | "referral"
  | "campaign"
  | "manual"
  | "import";

export interface Lead {
  id: string;
  contactId: string;
  title: string;
  stage: LeadStage;
  source: LeadSource;
  value: number;
  currency: string;
  score: number;
  probability: number;
  ownerId?: string;
  pipelineId: string;
  expectedCloseDate?: string;
  lostReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: { id: string; name: string; stage: LeadStage; order: number }[];
}

export interface LeadListQuery {
  search?: string;
  stage?: LeadStage;
  source?: LeadSource;
  ownerId?: string;
  pipelineId?: string;
  page?: number;
  limit?: number;
}

export type CreateLeadPayload = Omit<Lead, "id" | "createdAt" | "updatedAt">;

export type UpdateLeadPayload = Partial<CreateLeadPayload> & { id: string };
