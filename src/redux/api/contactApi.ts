import { baseApi } from "./baseApi";
import type {
  Contact,
  ContactListQuery,
  CreateContactPayload,
  UpdateContactPayload,
} from "@/types/contact";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

export const contactApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getContacts: builder.query<PaginatedResponse<Contact>, ContactListQuery | void>({
      query: (params) => ({ url: "/contacts", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Contact" as const, id })),
              { type: "Contact" as const, id: "LIST" },
            ]
          : [{ type: "Contact" as const, id: "LIST" }],
    }),

    getContact: builder.query<ApiResponse<Contact>, string>({
      query: (id) => `/contacts/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Contact", id }],
    }),

    createContact: builder.mutation<ApiResponse<Contact>, CreateContactPayload>({
      query: (body) => ({ url: "/contacts", method: "POST", body }),
      invalidatesTags: [{ type: "Contact", id: "LIST" }],
    }),

    updateContact: builder.mutation<ApiResponse<Contact>, UpdateContactPayload>({
      query: ({ id, ...body }) => ({ url: `/contacts/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Contact", id },
        { type: "Contact", id: "LIST" },
      ],
    }),

    deleteContact: builder.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({ url: `/contacts/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Contact", id: "LIST" }],
    }),

    importContacts: builder.mutation<ApiResponse<{ imported: number }>, FormData>({
      query: (body) => ({ url: "/contacts/import", method: "POST", body }),
      invalidatesTags: [{ type: "Contact", id: "LIST" }],
    }),
  }),
});

export const {
  useGetContactsQuery,
  useGetContactQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
  useImportContactsMutation,
} = contactApi;
