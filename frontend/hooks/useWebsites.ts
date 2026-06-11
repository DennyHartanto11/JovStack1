"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useActiveOrgId } from "./useActiveOrgId";
import type {
  Website,
  CreateWebsitePayload,
  UpdateWebsitePayload,
  Page,
  Block,
  SaveBlocksPayload,
} from "@/types";

export function useWebsites(q?: string) {
  const org = useActiveOrgId();
  return useQuery({
    queryKey: qk.websites(org, q),
    queryFn: () => api<Website[]>("/websites", { params: { q } }),
    enabled: !!org,
  });
}

export function useWebsite(id: string) {
  const org = useActiveOrgId();
  return useQuery({
    queryKey: qk.website(org, id),
    queryFn: () => api<Website>(`/websites/${id}`),
    enabled: !!org && !!id,
  });
}

export function useCreateWebsite() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (payload: CreateWebsitePayload) =>
      api<Website>("/websites", { method: "POST", body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.websites(org) }),
  });
}

export function useUpdateWebsite(id: string) {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (payload: UpdateWebsitePayload) =>
      api<Website>(`/websites/${id}`, { method: "PATCH", body: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.websites(org) });
      qc.invalidateQueries({ queryKey: qk.website(org, id) });
    },
  });
}

export function useDeleteWebsite() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/websites/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.websites(org) }),
  });
}

export function useTogglePublish() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "publish" | "unpublish" }) =>
      api<Website>(`/websites/${id}/${action}`, { method: "POST" }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.websites(org) });
      qc.invalidateQueries({ queryKey: qk.website(org, vars.id) });
    },
  });
}

export async function checkSlugAvailable(slug: string): Promise<boolean> {
  const res = await api<{ available: boolean }>("/websites/slug-available", {
    params: { slug },
  });
  return res.available;
}

/* ---------------- Pages & Blocks ---------------- */

export function usePages(websiteId: string) {
  const org = useActiveOrgId();
  return useQuery({
    queryKey: qk.pages(org, websiteId),
    queryFn: () => api<Page[]>(`/websites/${websiteId}/pages`),
    enabled: !!org && !!websiteId,
  });
}

export function useCreatePage(websiteId: string) {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (name: string) =>
      api<Page>(`/websites/${websiteId}/pages`, { method: "POST", body: { name } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.pages(org, websiteId) }),
  });
}

export function useReorderPages(websiteId: string) {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (pageIds: string[]) =>
      api<Page[]>(`/websites/${websiteId}/pages/reorder`, {
        method: "PATCH",
        body: { pageIds },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.pages(org, websiteId) }),
  });
}

export function useDeletePage(websiteId: string) {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (pageId: string) =>
      api<void>(`/websites/${websiteId}/pages/${pageId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.pages(org, websiteId) }),
  });
}

export function useBlocks(pageId: string | undefined) {
  const org = useActiveOrgId();
  return useQuery({
    queryKey: qk.blocks(org, pageId),
    queryFn: () => api<Block[]>(`/pages/${pageId}/blocks`),
    enabled: !!org && !!pageId,
  });
}

export function useSaveBlocks(pageId: string) {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (payload: SaveBlocksPayload) =>
      api<Block[]>(`/pages/${pageId}/blocks`, { method: "PUT", body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.blocks(org, pageId) }),
  });
}
