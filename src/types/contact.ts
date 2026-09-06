export type ContactStatus = "active" | "unsubscribed" | "bounced" | "blocked";

export type ContactChannel = "email" | "sms" | "whatsapp";

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  company?: string;
  jobTitle?: string;
  avatarUrl?: string;
  status: ContactStatus;
  tags: string[];
  optedInChannels: ContactChannel[];
  customFields: Record<string, string | number | boolean | null>;
  ownerId?: string;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactListQuery {
  search?: string;
  status?: ContactStatus;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "lastName";
  sortOrder?: "asc" | "desc";
}

export type CreateContactPayload = Omit<
  Contact,
  "id" | "createdAt" | "updatedAt" | "lastContactedAt"
>;

export type UpdateContactPayload = Partial<CreateContactPayload> & { id: string };
