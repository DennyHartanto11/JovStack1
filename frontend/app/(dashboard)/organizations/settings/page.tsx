"use client";

import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Textarea, PageHeader } from "@/components/ui";
import { useOrgStore } from "@/stores/orgStore";
import { useUpdateOrganization, useDeleteOrganization } from "@/hooks/useOrganizations";
import { ApiError } from "@/lib/api";

export default function OrgSettingsPage() {
  const router = useRouter();
  const activeOrg = useOrgStore((s) => s.activeOrg);
  const update = useUpdateOrganization(activeOrg?.id ?? "");
  const del = useDeleteOrganization();

  if (!activeOrg) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" description="Manage your organization settings." />

      <Card className="mb-6 p-6">
        <h3 className="mb-4 font-semibold text-slate-900">General</h3>
        {/* `key` resets the uncontrolled fields when the active org changes. */}
        <form
          key={activeOrg.id}
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            update.mutate({
              name: String(fd.get("name") ?? ""),
              slug: String(fd.get("slug") ?? ""),
              description: String(fd.get("description") ?? ""),
            });
          }}
        >
          {update.isError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {update.error instanceof ApiError ? update.error.message : "Failed to save."}
            </p>
          )}
          {update.isSuccess && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">Saved ✓</p>
          )}
          <div>
            <Label>Organization Name</Label>
            <Input name="name" defaultValue={activeOrg.name} required />
          </div>
          <div>
            <Label>Slug</Label>
            <Input name="slug" defaultValue={activeOrg.slug} required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea name="description" defaultValue={activeOrg.description ?? ""} rows={3} placeholder="What does your business do?" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="border-red-200 p-6">
        <h3 className="font-semibold text-red-600">Danger Zone</h3>
        <p className="mt-1 text-sm text-slate-500">
          Soft delete this organization. Data will be retained but inaccessible.
        </p>
        <Button
          variant="danger"
          className="mt-4"
          disabled={del.isPending}
          onClick={() => {
            if (confirm(`Delete "${activeOrg.name}"? This cannot be easily undone.`)) {
              del.mutate(activeOrg.id, { onSuccess: () => router.push("/organizations") });
            }
          }}
        >
          {del.isPending ? "Deleting…" : "Delete Organization"}
        </Button>
      </Card>
    </div>
  );
}
