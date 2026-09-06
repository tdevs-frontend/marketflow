import { baseApi } from "./baseApi";
import type {
  AnalyticsOverview,
  AnalyticsQuery,
  ChannelPerformance,
  MetricPoint,
} from "@/types/analytics";
import type { ApiResponse } from "@/types/api";

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOverview: builder.query<ApiResponse<AnalyticsOverview>, AnalyticsQuery | void>({
      query: (params) => ({ url: "/analytics/overview", params: params ?? undefined }),
      providesTags: [{ type: "Analytics", id: "OVERVIEW" }],
    }),

    getChannelPerformance: builder.query<
      ApiResponse<ChannelPerformance[]>,
      AnalyticsQuery | void
    >({
      query: (params) => ({ url: "/analytics/channels", params: params ?? undefined }),
      providesTags: [{ type: "Analytics", id: "CHANNELS" }],
    }),

    getCampaignAnalytics: builder.query<
      ApiResponse<{ series: MetricPoint[]; performance: ChannelPerformance[] }>,
      string
    >({
      query: (campaignId) => `/analytics/campaigns/${campaignId}`,
      providesTags: (_result, _error, campaignId) => [{ type: "Analytics", id: campaignId }],
    }),

    exportReport: builder.mutation<ApiResponse<{ url: string }>, AnalyticsQuery>({
      query: (body) => ({ url: "/analytics/export", method: "POST", body }),
    }),
  }),
});

export const {
  useGetOverviewQuery,
  useGetChannelPerformanceQuery,
  useGetCampaignAnalyticsQuery,
  useExportReportMutation,
} = analyticsApi;
