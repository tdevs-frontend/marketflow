export type WhatsAppMessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "template"
  | "location"
  | "interactive";

export type WhatsAppMessageStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type WhatsAppMessageDirection = "inbound" | "outbound";

export interface WhatsAppMessage {
  id: string;
  conversationId: string;
  direction: WhatsAppMessageDirection;
  type: WhatsAppMessageType;
  body?: string;
  mediaUrl?: string;
  templateId?: string;
  status: WhatsAppMessageStatus;
  errorMessage?: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface WhatsAppConversation {
  id: string;
  contactId: string;
  phoneNumber: string;
  displayName: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadCount: number;
  assignedTo?: string;
  status: "open" | "pending" | "resolved";
  /** 24-hour customer service window expiry (WhatsApp Business rule). */
  sessionExpiresAt?: string;
  labels: string[];
}

export interface WhatsAppAccount {
  id: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  wabaId: string;
  verifiedName: string;
  qualityRating: "green" | "yellow" | "red" | "unknown";
  messagingLimit: string;
  connected: boolean;
}

export interface SendWhatsAppMessagePayload {
  conversationId: string;
  type: WhatsAppMessageType;
  body?: string;
  mediaUrl?: string;
  templateId?: string;
  variables?: Record<string, string>;
}
