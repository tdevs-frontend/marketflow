import { baseApi } from "./baseApi";
import type {
  Campaign,
  CampaignListQuery,
  CreateCampaignPayload,
  Template,
  UpdateCampaignPayload,
} from "@/types/campaign";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

export const campaignApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCampaigns: builder.query<PaginatedResponse<Campaign>, CampaignListQuery | void>({
      query: (params) => ({ url: "/campaigns", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Campaign" as const, id })),
              { type: "Campaign" as const, id: "LIST" },
            ]
          : [{ type: "Campaign" as const, id: "LIST" }],
    }),

    getCampaign: builder.query<ApiResponse<Campaign>, string>({
      query: (id) => `/campaigns/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Campaign", id }],
    }),

    createCampaign: builder.mutation<ApiResponse<Campaign>, CreateCampaignPayload>({
      query: (body) => ({ url: "/campaigns", method: "POST", body }),
      invalidatesTags: [{ type: "Campaign", id: "LIST" }],
    }),

    updateCampaign: builder.mutation<ApiResponse<Campaign>, UpdateCampaignPayload>({
      query: ({ id, ...body }) => ({ url: `/campaigns/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Campaign", id },
        { type: "Campaign", id: "LIST" },
      ],
    }),

    sendCampaign: builder.mutation<ApiResponse<Campaign>, { id: string; scheduledAt?: string }>({
      query: ({ id, scheduledAt }) => ({
        url: `/campaigns/${id}/send`,
        method: "POST",
        body: { scheduledAt },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Campaign", id },
        { type: "Campaign", id: "LIST" },
      ],
    }),

    deleteCampaign: builder.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({ url: `/campaigns/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Campaign", id: "LIST" }],
    }),

    getTemplates: builder.query<PaginatedResponse<Template>, { channel?: string } | void>({
      query: (params) => ({ url: "/templates", params: params ?? undefined }),
      providesTags: [{ type: "Template", id: "LIST" }],
    }),

    createTemplate: builder.mutation<ApiResponse<Template>, Partial<Template>>({
      query: (body) => ({ url: "/templates", method: "POST", body }),
      invalidatesTags: [{ type: "Template", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCampaignsQuery,
  useGetCampaignQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useSendCampaignMutation,
  useDeleteCampaignMutation,
  useGetTemplatesQuery,
  useCreateTemplateMutation,
} = campaignApi;
