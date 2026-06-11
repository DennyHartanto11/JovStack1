"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiList, type ApiMeta } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useActiveOrgId } from "./useActiveOrgId";
import type {
  Product,
  Category,
  CreateProductPayload,
  UpdateProductPayload,
} from "@/types";

export function useProducts(
  opts: { category?: string; q?: string; page?: number; pageSize?: number } = {}
) {
  const org = useActiveOrgId();
  const { category, q, page = 1, pageSize } = opts;
  return useQuery({
    queryKey: [...qk.products(org, category, q, page), pageSize ?? 0],
    queryFn: () =>
      apiList<Product[]>("/products", {
        params: {
          category: category && category !== "All" ? category : undefined,
          q,
          page,
          pageSize,
        },
      }),
    enabled: !!org,
    // expose { data, meta } to the caller
    select: (res: { data: Product[]; meta?: ApiMeta }) => res,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) =>
      api<Product>("/products", { method: "POST", body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", org] }),
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (payload: UpdateProductPayload) =>
      api<Product>(`/products/${id}`, { method: "PATCH", body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", org] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/products/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", org] }),
  });
}

/* ---------------- Categories ---------------- */

export function useCategories() {
  const org = useActiveOrgId();
  return useQuery({
    queryKey: qk.categories(org),
    queryFn: () => api<Category[]>("/categories"),
    enabled: !!org,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (name: string) =>
      api<Category>("/categories", { method: "POST", body: { name } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories(org) }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories(org) }),
  });
}
