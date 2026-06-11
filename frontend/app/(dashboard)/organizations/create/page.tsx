"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, Card, Input, Label, PageHeader } from "@/components/ui";
import { useCreateOrganization } from "@/hooks/useOrganizations";
import { ApiError } from "@/lib/api";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const create = useCreateOrganization();

  const autoSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/organizations" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Back
      </Link>
      <PageHeader title="Create Organization" description="Set up a new workspace for your business." />

      <Card className="p-6">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(
              { name, slug: autoSlug },
              { onSuccess: () => router.push("/organizations") }
            );
          }}
        >
          {create.isError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {create.error instanceof ApiError ? create.error.message : "Failed to create organization."}
            </p>
          )}
          <div>
            <Label>Organization Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Business" required />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={autoSlug} onChange={(e) => setSlug(e.target.value)} placeholder="my-business" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/organizations">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
