"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Globe, ExternalLink, Trash2 } from "lucide-react";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { PublicationBadge } from "@/components/ui/status";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { useWebsites, useDeleteWebsite, useTogglePublish } from "@/hooks/useWebsites";
import { formatDate } from "@/lib/utils";
import { siteUrl, siteVanityDomain } from "@/lib/site";

export default function WebsitesPage() {
  const [q, setQ] = useState("");
  const { data: websites, isLoading, isError, error, refetch } = useWebsites(q || undefined);
  const del = useDeleteWebsite();
  const toggle = useTogglePublish();

  return (
    <div>
      <PageHeader
        title="Websites"
        description="Create and manage your business websites."
        action={
          <Link href="/websites/create">
            <Button>
              <Plus size={16} /> New Website
            </Button>
          </Link>
        }
      />

      <div className="mb-4 max-w-xs">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search websites..." />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !websites || websites.length === 0 ? (
        <EmptyState
          title="No websites yet"
          description="Create your first website to start building."
          action={
            <Link href="/websites/create">
              <Button>
                <Plus size={16} /> New Website
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {websites.map((w) => (
            <Card key={w.id} className="overflow-hidden transition-shadow hover:shadow-md">
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
                <Globe size={36} className="text-indigo-300" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{w.name}</h3>
                    <a
                      href={siteUrl(w)}
                      target="_blank"
                      rel="noreferrer"
                      title={`Opens ${siteUrl(w)}`}
                      className="mt-0.5 flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                    >
                      {siteVanityDomain(w)} <ExternalLink size={11} />
                    </a>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${w.name}"?`)) del.mutate(w.id);
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <PublicationBadge state={w.state} />
                  <span className="text-xs text-slate-400">{w.pages} pages</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/websites/${w.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={toggle.isPending}
                    onClick={() =>
                      toggle.mutate({
                        id: w.id,
                        action: w.state === "Live" ? "unpublish" : "publish",
                      })
                    }
                  >
                    {w.state === "Live" ? "Unpublish" : "Publish"}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-slate-400">Updated {formatDate(w.updatedAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
