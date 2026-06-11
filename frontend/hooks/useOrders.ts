"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiList, type ApiMeta } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useActiveOrgId } from "./useActiveOrgId";
import type { Order, OrderStatus } from "@/types";

export function useOrders(opts: { status?: string; page?: number } = {}) {
  const org = useActiveOrgId();
  const { status, page = 1 } = opts;
  return useQuery({
    queryKey: qk.orders(org, status, page),
    queryFn: () =>
      apiList<Order[]>("/orders", {
        params: { status: status && status !== "All" ? status : undefined, page },
      }),
    enabled: !!org,
    select: (res: { data: Order[]; meta?: ApiMeta }) => res,
  });
}

/** Single order with line items (GET /orders/:id, keyed by order code). */
export function useOrder(code: string | null) {
  const org = useActiveOrgId();
  return useQuery({
    queryKey: ["order", org, code],
    queryFn: () => api<Order>(`/orders/${code}`),
    enabled: !!org && !!code,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api<Order>(`/orders/${id}/status`, { method: "PATCH", body: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", org] }),
  });
}
