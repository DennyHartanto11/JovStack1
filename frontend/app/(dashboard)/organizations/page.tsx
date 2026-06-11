"use client";

import Link from "next/link";
import { Plus, Building2, Check } from "lucide-react";
import { Button, Card, PageHeader } from "@/components/ui";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useOrgStore } from "@/stores/orgStore";

export default function OrganizationsPage() {
  const { data: organizations, isLoading, isError, error, refetch } = useOrganizations();
  const { activeOrg, setActiveOrg } = useOrgStore();

  return (
    <div>
      <PageHeader
        title="Organizations"
        description="Switch between or manage your organizations (tenants)."
        action={
          <Link href="/organizations/create">
            <Button>
              <Plus size={16} /> New Organization
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !organizations || organizations.length === 0 ? (
        <EmptyState
          title="No organizations"
          description="Create your first organization to get started."
          action={
            <Link href="/organizations/create">
              <Button>
                <Plus size={16} /> New Organization
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id} className="p-5">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
                  <Building2 size={20} />
                </span>
                {org.id === activeOrg?.id && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                    <Check size={14} /> Active
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{org.name}</h3>
              <p className="text-xs text-slate-400">{org.slug}.jovstack.app</p>
              <Button
                variant={org.id === activeOrg?.id ? "outline" : "primary"}
                size="sm"
                className="mt-4 w-full"
                onClick={() => setActiveOrg(org)}
                disabled={org.id === activeOrg?.id}
              >
                {org.id === activeOrg?.id ? "Current" : "Switch"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
