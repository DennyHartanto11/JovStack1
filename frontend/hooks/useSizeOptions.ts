"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useActiveOrgId } from "./useActiveOrgId";
import type { SizeOption } from "@/types";

/** Org-defined reusable size labels (backend `/size-options`). */
export function useSizeOptions() {
  const org = useActiveOrgId();
  return useQuery({
    queryKey: ["size-options", org],
    queryFn: () => api<SizeOption[]>("/size-options"),
    enabled: !!org,
  });
}

export function useCreateSizeOption() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (label: string) =>
      api<SizeOption>("/size-options", { method: "POST", body: { label } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["size-options", org] }),
  });
}

export function useUpdateSizeOption() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: ({ id, label, order }: { id: string; label?: string; order?: number }) =>
      api<SizeOption>(`/size-options/${id}`, { method: "PATCH", body: { label, order } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["size-options", org] }),
  });
}

export function useDeleteSizeOption() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/size-options/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["size-options", org] }),
  });
}
