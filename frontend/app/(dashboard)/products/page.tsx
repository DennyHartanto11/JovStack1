"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { Button, Card, Input, PageHeader, Badge } from "@/components/ui";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { useProducts, useCategories, useDeleteProduct } from "@/hooks/useProducts";
import { formatCurrency, cn } from "@/lib/utils";
import { mediaBoxStyle } from "@/lib/media";

export default function ProductsPage() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");

  const { data: categories } = useCategories();
  const { data, isLoading, isError, error, refetch } = useProducts({
    category: cat,
    q: q || undefined,
  });
  const del = useDeleteProduct();

  const products = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your product catalog."
        action={
          <Link href="/products/create">
            <Button>
              <Plus size={16} /> New Product
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {["All", ...(categories ?? []).map((c) => c.name)].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium",
                cat === c ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : products.length === 0 ? (
        <EmptyState title="No products found" description="Add a product or adjust your filters." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Sizes / Stock</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 rounded-lg bg-slate-100" style={mediaBoxStyle(p.image)} />
                      <div>
                        <p className="font-medium text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color="indigo">{p.category}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {p.sizes && p.sizes.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {p.sizes.map((s) => (
                          <Badge key={s}>{s}</Badge>
                        ))}
                        <span
                          className={cn(
                            "ml-1 text-xs",
                            (p.totalStock ?? 0) > 0 ? "text-slate-500" : "text-red-500"
                          )}
                        >
                          {(p.totalStock ?? 0) > 0 ? `${p.totalStock} in stock` : "Out of stock"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/products/${p.id}`}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${p.name}"?`)) del.mutate(p.id);
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 size={16} />
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
