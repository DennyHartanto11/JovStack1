"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui";
import { PublicationBadge } from "@/components/ui/status";
import { ThemeEditor } from "@/components/storefront/ThemeEditor";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { useWebsite, useTogglePublish } from "@/hooks/useWebsites";
import { siteUrl } from "@/lib/site";

export default function WebsiteEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const website = useWebsite(id);
  const toggle = useTogglePublish();

  if (website.isError) return <ErrorState error={website.error} onRetry={() => website.refetch()} />;
  if (!website.data) return <LoadingState label="Loading website…" />;

  const w = website.data;

  return (
    <div>
      <Link href="/websites" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to websites
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{w.name}</h1>
          <PublicationBadge state={w.state} />
        </div>
        <div className="flex gap-2">
          <a href={siteUrl(w)} target="_blank" rel="noreferrer" title={`Opens ${siteUrl(w)}`}>
            <Button variant="outline">
              <Eye size={16} /> Preview
            </Button>
          </a>
          <Button
            disabled={toggle.isPending}
            onClick={() =>
              toggle.mutate({ id: w.id, action: w.state === "Live" ? "unpublish" : "publish" })
            }
          >
            {w.state === "Live" ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      <ThemeEditor websiteId={w.id} />
    </div>
  );
}
