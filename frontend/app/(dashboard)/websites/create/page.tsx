"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, Card, Input, Label, Textarea, PageHeader } from "@/components/ui";
import { useCreateWebsite } from "@/hooks/useWebsites";
import { ApiError } from "@/lib/api";

export default function CreateWebsitePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const create = useCreateWebsite();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/websites" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to websites
      </Link>
      <PageHeader title="Create Website" description="Set up a new website for your business." />

      <Card className="p-6">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(
              { name, slug, seoTitle, seoDescription },
              { onSuccess: () => router.push("/websites") }
            );
          }}
        >
          {create.isError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {create.error instanceof ApiError ? create.error.message : "Failed to create website."}
            </p>
          )}
          <div>
            <Label>Website Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Toko Budi" required />
          </div>
          <div>
            <Label>Subdomain</Label>
            <div className="flex items-center">
              <Input value={slug} readOnly className="rounded-r-none" placeholder="tokobudi" />
              <span className="flex h-10 items-center rounded-r-lg border border-l-0 border-[var(--border)] bg-slate-50 px-3 text-sm text-slate-500">
                .jovstack.app
              </span>
            </div>
          </div>
          <div>
            <Label>SEO Title</Label>
            <Input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Toko Budi - Sembako Murah Berkualitas"
            />
          </div>
          <div>
            <Label>SEO Description</Label>
            <Textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={3}
              placeholder="Deskripsi singkat untuk mesin pencari..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/websites">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create Website"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
