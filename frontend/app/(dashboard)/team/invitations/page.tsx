"use client";

import Link from "next/link";
import { ArrowLeft, X, RotateCw } from "lucide-react";
import { Card, PageHeader, Badge } from "@/components/ui";
import { RoleBadge } from "@/components/ui/status";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { useInvitations, useResendInvitation, useRevokeInvitation } from "@/hooks/useTeam";
import { formatDate } from "@/lib/utils";

export default function InvitationsPage() {
  const { data: invitations, isLoading, isError, error, refetch } = useInvitations();
  const resend = useResendInvitation();
  const revoke = useRevokeInvitation();

  return (
    <div>
      <Link href="/team" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to team
      </Link>
      <PageHeader title="Invitations" description="Pending and past member invitations." />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !invitations || invitations.length === 0 ? (
        <EmptyState title="No invitations" description="Invite members from the Team page." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id} className="border-b border-[var(--border)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{inv.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={inv.role} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(inv.sentAt)}</td>
                  <td className="px-4 py-3">
                    <Badge color={inv.status === "Pending" ? "amber" : "slate"}>{inv.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                        title="Resend"
                        disabled={resend.isPending}
                        onClick={() => resend.mutate(inv.id)}
                      >
                        <RotateCw size={15} />
                      </button>
                      <button
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                        title="Revoke"
                        disabled={revoke.isPending}
                        onClick={() => revoke.mutate(inv.id)}
                      >
                        <X size={15} />
                      </button>
                    </div>
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
