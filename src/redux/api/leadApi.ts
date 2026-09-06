import { baseApi } from "./baseApi";
import type {
  CreateLeadPayload,
  Lead,
  LeadListQuery,
  LeadStage,
  Pipeline,
  UpdateLeadPayload,
} from "@/types/lead";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

export const leadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeads: builder.query<PaginatedResponse<Lead>, LeadListQuery | void>({
      query: (params) => ({ url: "/leads", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Lead" as const, id })),
              { type: "Lead" as const, id: "LIST" },
            ]
          : [{ type: "Lead" as const, id: "LIST" }],
    }),

    getLead: builder.query<ApiResponse<Lead>, string>({
      query: (id) => `/leads/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Lead", id }],
    }),

    getPipelines: builder.query<ApiResponse<Pipeline[]>, void>({
      query: () => "/pipelines",
      providesTags: [{ type: "Pipeline", id: "LIST" }],
    }),

    createLead: builder.mutation<ApiResponse<Lead>, CreateLeadPayload>({
      query: (body) => ({ url: "/leads", method: "POST", body }),
      invalidatesTags: [{ type: "Lead", id: "LIST" }],
    }),

    updateLead: builder.mutation<ApiResponse<Lead>, UpdateLeadPayload>({
      query: ({ id, ...body }) => ({ url: `/leads/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Lead", id },
        { type: "Lead", id: "LIST" },
      ],
    }),

    moveLeadStage: builder.mutation<ApiResponse<Lead>, { id: string; stage: LeadStage }>({
      query: ({ id, stage }) => ({ url: `/leads/${id}/stage`, method: "PATCH", body: { stage } }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Lead", id },
        { type: "Lead", id: "LIST" },
      ],
    }),

    deleteLead: builder.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({ url: `/leads/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Lead", id: "LIST" }],
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetLeadQuery,
  useGetPipelinesQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useMoveLeadStageMutation,
  useDeleteLeadMutation,
} = leadApi;
