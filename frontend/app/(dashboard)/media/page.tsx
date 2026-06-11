"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { Button, Card, PageHeader, Badge } from "@/components/ui";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { useMedia, useUploadMedia, useDeleteMedia } from "@/hooks/useMedia";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/types";

const filters = ["All", "Logo", "Banner", "Product", "Gallery"] as const;

export default function MediaPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const { data: items, isLoading, isError, error, refetch } = useMedia(filter);
  const upload = useUploadMedia();
  const del = useDeleteMedia();
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = (filter === "All" ? "Gallery" : filter) as MediaAsset["type"];
    upload.mutate({ file, type });
    e.target.value = "";
  }

  return (
    <div>
      <PageHeader
        title="Media Library"
        description="Centralized asset management for your websites."
        action={
          <Button disabled={upload.isPending} onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> {upload.isPending ? "Uploading…" : "Upload"}
          </Button>
        }
      />
      <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={onFile} />

      <Card
        className="mb-6 cursor-pointer border-2 border-dashed p-8 text-center hover:border-[var(--accent)]"
        onClick={() => fileRef.current?.click()}
      >
        <ImageIcon className="mx-auto text-slate-300" size={32} />
        <p className="mt-2 text-sm font-medium text-slate-600">Click to upload images</p>
        <p className="text-xs text-slate-400">PNG, JPG up to 5MB</p>
      </Card>

      <div className="mb-4 flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !items || items.length === 0 ? (
        <EmptyState title="No media yet" description="Upload your first image to get started." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <Card key={m.id} className="group overflow-hidden">
              <div className="relative h-32 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.url}
                  alt={m.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <button
                  onClick={() => del.mutate(m.id)}
                  className="absolute right-2 top-2 rounded-md bg-white/90 p-1.5 text-slate-600 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium text-slate-800">{m.name}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <Badge color="indigo">{m.type}</Badge>
                  <span className="text-xs text-slate-400">{m.size}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
