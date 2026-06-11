"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiList, type ApiMeta } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useActiveOrgId } from "./useActiveOrgId";
import type { Lead, LeadStatus } from "@/types";

export function useLeads(opts: { status?: string; page?: number } = {}) {
  const org = useActiveOrgId();
  const { status, page = 1 } = opts;
  return useQuery({
    queryKey: qk.leads(org, status, page),
    queryFn: () =>
      apiList<Lead[]>("/leads", {
        params: { status: status && status !== "All" ? status : undefined, page },
      }),
    enabled: !!org,
    select: (res: { data: Lead[]; meta?: ApiMeta }) => res,
  });
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      api<Lead>(`/leads/${id}/status`, { method: "PATCH", body: { status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads", org] }),
  });
}
