"use client";

import { Mail } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/ui";
import { LeadStatusBadge } from "@/components/ui/status";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { useLeads, useUpdateLeadStatus } from "@/hooks/useLeads";
import { formatDate } from "@/lib/utils";
import type { LeadStatus } from "@/types";

const nextStatus: Record<LeadStatus, LeadStatus> = {
  New: "Contacted",
  Contacted: "Closed",
  Closed: "Closed",
};

export default function LeadsPage() {
  const { data, isLoading, isError, error, refetch } = useLeads();
  const updateStatus = useUpdateLeadStatus();
  const leads = data?.data ?? [];

  if (isLoading) return <LeadsShell><LoadingState /></LeadsShell>;
  if (isError) return <LeadsShell><ErrorState error={error} onRetry={() => refetch()} /></LeadsShell>;
  if (leads.length === 0)
    return (
      <LeadsShell>
        <EmptyState title="No leads yet" description="Inquiries from your contact forms appear here." />
      </LeadsShell>
    );

  return (
    <LeadsShell>
      <div className="space-y-3">
        {leads.map((l) => (
          <Card key={l.id} className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[var(--accent)]">
                  <Mail size={18} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{l.name}</p>
                    <LeadStatusBadge status={l.status} />
                  </div>
                  <p className="text-xs text-slate-400">{l.email}</p>
                  <p className="mt-2 text-sm text-slate-600">{l.message}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-slate-400">{formatDate(l.createdAt)}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={l.status === "Closed" || updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: l.id, status: nextStatus[l.status] })}
                >
                  {l.status === "New" ? "Mark Contacted" : l.status === "Contacted" ? "Close" : "Closed"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </LeadsShell>
  );
}

function LeadsShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PageHeader title="Leads" description="Inquiries submitted through your website contact forms." />
      {children}
    </div>
  );
}
