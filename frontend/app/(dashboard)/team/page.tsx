"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, Trash2, Mail } from "lucide-react";
import { Button, Card, PageHeader, Input, Label } from "@/components/ui";
import { RoleBadge } from "@/components/ui/status";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { useMembers, useInviteMember, useRemoveMember } from "@/hooks/useTeam";
import { formatDate } from "@/lib/utils";
import type { Role } from "@/types";

const roles: Exclude<Role, "Owner">[] = ["Admin", "Editor", "Viewer"];

export default function TeamPage() {
  const [invite, setInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<Role, "Owner">>("Editor");

  const { data: members, isLoading, isError, error, refetch } = useMembers();
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();

  return (
    <div>
      <PageHeader
        title="Team"
        description="Manage members and their roles."
        action={
          <div className="flex gap-2">
            <Link href="/team/invitations">
              <Button variant="outline">
                <Mail size={16} /> Invitations
              </Button>
            </Link>
            <Button onClick={() => setInvite((v) => !v)}>
              <UserPlus size={16} /> Invite Member
            </Button>
          </div>
        }
      />

      {invite && (
        <Card className="mb-6 p-5">
          <h3 className="mb-4 font-semibold text-slate-900">Invite a new member</h3>
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              inviteMember.mutate(
                { email, role },
                {
                  onSuccess: () => {
                    setEmail("");
                    setInvite(false);
                  },
                }
              );
            }}
          >
            <div className="flex-1">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@email.com" required />
            </div>
            <div className="sm:w-40">
              <Label>Role</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Exclude<Role, "Owner">)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
              >
                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={inviteMember.isPending}>
              {inviteMember.isPending ? "Sending…" : "Send Invite"}
            </Button>
          </form>
        </Card>
      )}

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !members || members.length === 0 ? (
        <EmptyState title="No members yet" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-[var(--border)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium text-white"
                        style={{ background: m.avatarColor }}
                      >
                        {m.name.charAt(0)}
                      </span>
                      <div>
                        <p className="font-medium text-slate-800">{m.name}</p>
                        <p className="text-xs text-slate-400">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={m.role} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(m.joinedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent"
                      disabled={m.role === "Owner"}
                      onClick={() => {
                        if (confirm(`Remove ${m.name}?`)) removeMember.mutate(m.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
