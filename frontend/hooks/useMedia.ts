"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useActiveOrgId } from "./useActiveOrgId";
import type { MediaAsset } from "@/types";

export function useMedia(type?: string) {
  const org = useActiveOrgId();
  return useQuery({
    queryKey: qk.media(org, type),
    queryFn: () =>
      api<MediaAsset[]>("/media", {
        params: { type: type && type !== "All" ? type : undefined },
      }),
    enabled: !!org,
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: ({ file, type }: { file: File; type: MediaAsset["type"] }) => {
      const form = new FormData();
      form.append("file", file);
      form.append("type", type);
      return api<MediaAsset>("/media", { method: "POST", form });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["media", org] }),
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/media/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["media", org] }),
  });
}
