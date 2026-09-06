import { baseApi } from "./baseApi";
import type {
  SendWhatsAppMessagePayload,
  WhatsAppAccount,
  WhatsAppConversation,
  WhatsAppMessage,
} from "@/types/whatsapp";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

export const whatsappApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWhatsAppAccount: builder.query<ApiResponse<WhatsAppAccount>, void>({
      query: () => "/whatsapp/account",
      providesTags: [{ type: "WhatsAppAccount", id: "CURRENT" }],
    }),

    getConversations: builder.query<
      PaginatedResponse<WhatsAppConversation>,
      { status?: string; search?: string; page?: number } | void
    >({
      query: (params) => ({ url: "/whatsapp/conversations", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "WhatsAppConversation" as const, id })),
              { type: "WhatsAppConversation" as const, id: "LIST" },
            ]
          : [{ type: "WhatsAppConversation" as const, id: "LIST" }],
    }),

    getMessages: builder.query<PaginatedResponse<WhatsAppMessage>, string>({
      query: (conversationId) => `/whatsapp/conversations/${conversationId}/messages`,
      providesTags: (_result, _error, conversationId) => [
        { type: "WhatsAppMessage", id: conversationId },
      ],
    }),

    sendMessage: builder.mutation<ApiResponse<WhatsAppMessage>, SendWhatsAppMessagePayload>({
      query: ({ conversationId, ...body }) => ({
        url: `/whatsapp/conversations/${conversationId}/messages`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: "WhatsAppMessage", id: conversationId },
        { type: "WhatsAppConversation", id: "LIST" },
      ],
    }),

    markConversationRead: builder.mutation<ApiResponse<{ id: string }>, string>({
      query: (conversationId) => ({
        url: `/whatsapp/conversations/${conversationId}/read`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "WhatsAppConversation", id: "LIST" }],
    }),

    assignConversation: builder.mutation<
      ApiResponse<WhatsAppConversation>,
      { conversationId: string; assignedTo: string }
    >({
      query: ({ conversationId, assignedTo }) => ({
        url: `/whatsapp/conversations/${conversationId}/assign`,
        method: "PATCH",
        body: { assignedTo },
      }),
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: "WhatsAppConversation", id: conversationId },
        { type: "WhatsAppConversation", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetWhatsAppAccountQuery,
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkConversationReadMutation,
  useAssignConversationMutation,
} = whatsappApi;
