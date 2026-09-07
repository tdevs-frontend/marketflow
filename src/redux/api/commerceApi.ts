import { baseApi } from "./baseApi";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type {
  Catalog,
  Category,
  CreateCatalogPayload,
  CreateCategoryPayload,
  CreateDiscountPayload,
  CreateProductPayload,
  CreateStockAdjustmentPayload,
  Discount,
  InventoryItem,
  Order,
  OrderListQuery,
  Product,
  ProductListQuery,
  StockAdjustment,
  UpdateCategoryPayload,
  UpdateDiscountPayload,
  UpdateOrderStatusPayload,
  UpdateProductPayload,
} from "@/types/commerce";

/**
 * The whole Commerce module in one slice — products, categories, orders,
 * inventory, catalogs and discounts share a module and cross-invalidate each
 * other, so keeping them together avoids six files that all import the same
 * tags. Pages currently read fixtures from `lib/commerce-fixtures`; swapping a
 * page to its hook here needs no shape changes.
 */
export const commerceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* ---------------------------------------------------------- Products */

    getProducts: builder.query<PaginatedResponse<Product>, ProductListQuery | void>({
      query: (params) => ({ url: "/products", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Product" as const, id })),
              { type: "Product" as const, id: "LIST" },
            ]
          : [{ type: "Product" as const, id: "LIST" }],
    }),

    getProduct: builder.query<ApiResponse<Product>, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Product", id }],
    }),

    createProduct: builder.mutation<ApiResponse<Product>, CreateProductPayload>({
      query: (body) => ({ url: "/products", method: "POST", body }),
      invalidatesTags: [
        { type: "Product", id: "LIST" },
        { type: "Inventory", id: "LIST" },
      ],
    }),

    updateProduct: builder.mutation<ApiResponse<Product>, UpdateProductPayload>({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
        { type: "Inventory", id: "LIST" },
      ],
    }),

    deleteProduct: builder.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: [
        { type: "Product", id: "LIST" },
        { type: "Inventory", id: "LIST" },
      ],
    }),

    duplicateProduct: builder.mutation<ApiResponse<Product>, string>({
      query: (id) => ({ url: `/products/${id}/duplicate`, method: "POST" }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),

    /** Bulk status change behind the table's selection bar. */
    bulkUpdateProducts: builder.mutation<
      ApiResponse<{ updated: number }>,
      { ids: string[]; status: Product["status"] }
    >({
      query: (body) => ({ url: "/products/bulk", method: "PATCH", body }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),

    importProducts: builder.mutation<ApiResponse<{ imported: number }>, FormData>({
      query: (body) => ({ url: "/products/import", method: "POST", body }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),

    /* -------------------------------------------------------- Categories */

    getCategories: builder.query<ApiResponse<Category[]>, void>({
      query: () => "/categories",
      providesTags: [{ type: "Category", id: "LIST" }],
    }),

    createCategory: builder.mutation<ApiResponse<Category>, CreateCategoryPayload>({
      query: (body) => ({ url: "/categories", method: "POST", body }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),

    updateCategory: builder.mutation<ApiResponse<Category>, UpdateCategoryPayload>({
      query: ({ id, ...body }) => ({ url: `/categories/${id}`, method: "PATCH", body }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),

    deleteCategory: builder.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({ url: `/categories/${id}`, method: "DELETE" }),
      invalidatesTags: [
        { type: "Category", id: "LIST" },
        { type: "Product", id: "LIST" },
      ],
    }),

    /* ------------------------------------------------------------ Orders */

    getOrders: builder.query<PaginatedResponse<Order>, OrderListQuery | void>({
      query: (params) => ({ url: "/orders", params: params ?? undefined }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Order" as const, id })),
              { type: "Order" as const, id: "LIST" },
            ]
          : [{ type: "Order" as const, id: "LIST" }],
    }),

    getOrder: builder.query<ApiResponse<Order>, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Order", id }],
    }),

    updateOrderStatus: builder.mutation<ApiResponse<Order>, UpdateOrderStatusPayload>({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Order", id },
        { type: "Order", id: "LIST" },
        { type: "Inventory", id: "LIST" },
      ],
    }),

    refundOrder: builder.mutation<ApiResponse<Order>, { id: string; amount?: number }>({
      query: ({ id, amount }) => ({
        url: `/orders/${id}/refund`,
        method: "POST",
        body: { amount },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Order", id },
        { type: "Order", id: "LIST" },
      ],
    }),

    /* --------------------------------------------------------- Inventory */

    getInventory: builder.query<ApiResponse<InventoryItem[]>, void>({
      query: () => "/inventory",
      providesTags: [{ type: "Inventory", id: "LIST" }],
    }),

    getStockActivity: builder.query<ApiResponse<StockAdjustment[]>, void>({
      query: () => "/inventory/activity",
      providesTags: [{ type: "Inventory", id: "ACTIVITY" }],
    }),

    createStockAdjustment: builder.mutation<
      ApiResponse<StockAdjustment>,
      CreateStockAdjustmentPayload
    >({
      query: (body) => ({ url: "/inventory/adjustments", method: "POST", body }),
      invalidatesTags: [
        { type: "Inventory", id: "LIST" },
        { type: "Inventory", id: "ACTIVITY" },
        { type: "Product", id: "LIST" },
      ],
    }),

    /* ---------------------------------------------------------- Catalogs */

    getCatalogs: builder.query<ApiResponse<Catalog[]>, void>({
      query: () => "/catalogs",
      providesTags: [{ type: "Catalog", id: "LIST" }],
    }),

    createCatalog: builder.mutation<ApiResponse<Catalog>, CreateCatalogPayload>({
      query: (body) => ({ url: "/catalogs", method: "POST", body }),
      invalidatesTags: [{ type: "Catalog", id: "LIST" }],
    }),

    /* --------------------------------------------------------- Discounts */

    getDiscounts: builder.query<ApiResponse<Discount[]>, void>({
      query: () => "/discounts",
      providesTags: [{ type: "Discount", id: "LIST" }],
    }),

    createDiscount: builder.mutation<ApiResponse<Discount>, CreateDiscountPayload>({
      query: (body) => ({ url: "/discounts", method: "POST", body }),
      invalidatesTags: [{ type: "Discount", id: "LIST" }],
    }),

    updateDiscount: builder.mutation<ApiResponse<Discount>, UpdateDiscountPayload>({
      query: ({ id, ...body }) => ({ url: `/discounts/${id}`, method: "PATCH", body }),
      invalidatesTags: [{ type: "Discount", id: "LIST" }],
    }),

    deleteDiscount: builder.mutation<ApiResponse<{ id: string }>, string>({
      query: (id) => ({ url: `/discounts/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Discount", id: "LIST" }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useDuplicateProductMutation,
  useBulkUpdateProductsMutation,
  useImportProductsMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetOrdersQuery,
  useGetOrderQuery,
  useUpdateOrderStatusMutation,
  useRefundOrderMutation,
  useGetInventoryQuery,
  useGetStockActivityQuery,
  useCreateStockAdjustmentMutation,
  useGetCatalogsQuery,
  useCreateCatalogMutation,
  useGetDiscountsQuery,
  useCreateDiscountMutation,
  useUpdateDiscountMutation,
  useDeleteDiscountMutation,
} = commerceApi;
