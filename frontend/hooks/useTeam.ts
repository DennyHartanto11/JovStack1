"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useActiveOrgId } from "./useActiveOrgId";
import type { Member, Invitation, InviteMemberPayload, Role } from "@/types";

export function useMembers() {
  const org = useActiveOrgId();
  return useQuery({
    queryKey: qk.members(org),
    queryFn: () => api<Member[]>("/team/members"),
    enabled: !!org,
  });
}

export function useInvitations(enabled = true) {
  const org = useActiveOrgId();
  return useQuery({
    queryKey: qk.invitations(org),
    queryFn: () => api<Invitation[]>("/team/invitations"),
    enabled: !!org && enabled,
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (payload: InviteMemberPayload) =>
      api<Invitation>("/team/invitations", { method: "POST", body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.invitations(org) }),
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Exclude<Role, "Owner"> }) =>
      api<Member>(`/team/members/${id}`, { method: "PATCH", body: { role } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.members(org) }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/team/members/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.members(org) }),
  });
}

export function useResendInvitation() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/team/invitations/${id}/resend`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.invitations(org) }),
  });
}

export function useRevokeInvitation() {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/team/invitations/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.invitations(org) }),
  });
}
