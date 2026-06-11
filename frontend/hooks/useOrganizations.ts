"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useOrgStore } from "@/stores/orgStore";
import { useAuthStore } from "@/stores/authStore";
import type {
  Organization,
  CreateOrganizationPayload,
  UpdateOrganizationPayload,
} from "@/types";

/** Lists the user's orgs (not tenant-scoped) and syncs them into orgStore. */
export function useOrganizations() {
  const isAuthed = useAuthStore((s) => !!s.accessToken);
  const setOrganizations = useOrgStore((s) => s.setOrganizations);

  const query = useQuery({
    queryKey: qk.organizations,
    queryFn: () => api<Organization[]>("/organizations", { tenant: false }),
    enabled: isAuthed,
  });

  useEffect(() => {
    if (query.data) setOrganizations(query.data);
  }, [query.data, setOrganizations]);

  return query;
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  const setActiveOrg = useOrgStore((s) => s.setActiveOrg);
  return useMutation({
    mutationFn: (payload: CreateOrganizationPayload) =>
      api<Organization>("/organizations", { method: "POST", body: payload, tenant: false }),
    onSuccess: (org) => {
      setActiveOrg(org);
      qc.invalidateQueries({ queryKey: qk.organizations });
    },
  });
}

export function useUpdateOrganization(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateOrganizationPayload) =>
      api<Organization>(`/organizations/${id}`, { method: "PATCH", body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.organizations }),
  });
}

export function useDeleteOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/organizations/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.organizations }),
  });
}
