"use client";

import { useState } from "react";
import { Plus, Tags, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { Button, Card, PageHeader, Input, Label } from "@/components/ui";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/hooks/useProducts";

export default function CategoriesPage() {
  const { data: categories, isLoading, isError, error, refetch } = useCategories();
  const create = useCreateCategory();
  const del = useDeleteCategory();
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showFeedback(type: "success" | "error", msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  }

  return (
    <div>
      <PageHeader title="Categories" description="Organize your products into categories." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit p-6 lg:col-span-1">
          <h3 className="mb-4 font-semibold text-slate-900">Add Category</h3>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              create.mutate(name.trim(), {
                onSuccess: () => {
                  setName("");
                  showFeedback("success", `Category "${name.trim()}" created!`);
                },
                onError: (err: unknown) => {
                  const msg =
                    err instanceof Error ? err.message : "Failed to create category.";
                  showFeedback("error", msg);
                },
              });
            }}
          >
            <div>
              <Label>Category Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Electronics"
              />
            </div>

            {/* Inline feedback banner */}
            {feedback && (
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  feedback.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle size={14} />
                ) : (
                  <AlertCircle size={14} />
                )}
                {feedback.msg}
              </div>
            )}

            <Button className="w-full" type="submit" disabled={create.isPending}>
              <Plus size={16} /> {create.isPending ? "Adding…" : "Add Category"}
            </Button>
          </form>
        </Card>

        <div className="space-y-3 lg:col-span-2">
          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => refetch()} />
          ) : !categories || categories.length === 0 ? (
            <EmptyState title="No categories yet" description="Create your first category." />
          ) : (
            categories.map((c) => (
              <Card key={c.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-[var(--accent)]">
                    <Tags size={18} />
                  </span>
                  <div>
                    <p className="font-medium text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.productCount} products</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete category "${c.name}"?`)) del.mutate(c.id);
                  }}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
