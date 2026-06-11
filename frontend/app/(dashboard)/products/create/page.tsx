"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button, Card, Input, Label, Textarea, PageHeader, Badge } from "@/components/ui";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { useCategories, useCreateProduct } from "@/hooks/useProducts";
import { useSizeOptions } from "@/hooks/useSizeOptions";
import { ApiError } from "@/lib/api";
import type { ProductVariantInput } from "@/types";

export default function CreateProductPage() {
  const router = useRouter();
  const { data: categories } = useCategories();
  const { data: sizeOptions } = useSizeOptions();
  const create = useCreateProduct();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    seoTitle: "",
    seoDescription: "",
  });
  const [imageId, setImageId] = useState<string | undefined>();
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [variants, setVariants] = useState<ProductVariantInput[]>([]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addSize(label: string) {
    const size = label.trim();
    if (!size || variants.some((v) => v.size.toLowerCase() === size.toLowerCase())) return;
    setVariants((vs) => [...vs, { size, stock: 0 }]);
  }
  function updateVariant(i: number, patch: Partial<ProductVariantInput>) {
    setVariants((vs) => vs.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }
  function removeVariant(i: number) {
    setVariants((vs) => vs.filter((_, idx) => idx !== i));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/products" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to products
      </Link>
      <PageHeader title="Create Product" description="Add a new product to your catalog." />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(
            {
              name: form.name,
              description: form.description,
              price: Number(form.price),
              category: form.category || categories?.[0]?.name || "",
              imageId: imageId,
              seoTitle: form.seoTitle || undefined,
              seoDescription: form.seoDescription || undefined,
              variants: variants.length ? variants : undefined,
            },
            { onSuccess: () => router.push("/products") }
          );
        }}
        className="grid gap-6 lg:grid-cols-3"
      >
        {create.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 lg:col-span-3">
            {create.error instanceof ApiError ? create.error.message : "Failed to create product."}
          </p>
        )}

        <Card className="space-y-5 p-6 lg:col-span-2">
          <div>
            <Label>Product Name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Kopi Arabika Gayo" required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Describe your product..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price (IDR)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="50000"
                required
              />
            </div>
            <div>
              <Label>Category</Label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
              >
                {(categories ?? []).map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sizes & stock */}
          <div className="border-t border-[var(--border)] pt-5">
            <Label className="mb-1 block">Sizes & Stock</Label>
            <p className="mb-3 text-xs text-slate-400">
              Optional. Add purchasable sizes, each with its own stock. Leave empty for a
              single-stock product.
            </p>

            {/* Quick-add from existing org size options */}
            {(sizeOptions ?? []).length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Quick add:</span>
                {(sizeOptions ?? []).map((s) => {
                  const used = variants.some((v) => v.size.toLowerCase() === s.label.toLowerCase());
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={used}
                      onClick={() => addSize(s.label)}
                      className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-xs hover:bg-slate-50 disabled:opacity-40"
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            )}

            {variants.length > 0 && (
              <div className="mb-3 space-y-2">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={v.size}
                      onChange={(e) => updateVariant(i, { size: e.target.value })}
                      placeholder="Size (e.g. M)"
                      className="w-24"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={String(v.stock)}
                      onChange={(e) => updateVariant(i, { stock: Math.max(0, Number(e.target.value)) })}
                      placeholder="Stock"
                      className="w-24"
                    />
                    <Input
                      value={v.sku ?? ""}
                      onChange={(e) => updateVariant(i, { sku: e.target.value || undefined })}
                      placeholder="SKU (optional)"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                <p className="text-xs text-slate-400">
                  Total stock: <Badge color="indigo">{variants.reduce((s, v) => s + v.stock, 0)}</Badge>
                </p>
              </div>
            )}

            <AddSizeInline onAdd={addSize} />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <Label className="mb-3 block">Product Image</Label>
            <ImageUploader
              currentUrl={imageUrl}
              onUploaded={(id, url) => {
                setImageId(id);
                setImageUrl(url);
              }}
              onClear={() => {
                setImageId(undefined);
                setImageUrl(undefined);
              }}
            />
          </Card>
          <Card className="space-y-4 p-6">
            <h3 className="text-sm font-semibold text-slate-900">SEO</h3>
            <div>
              <Label>SEO Title</Label>
              <Input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} placeholder="SEO title" />
            </div>
            <div>
              <Label>SEO Description</Label>
              <Textarea value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} rows={2} placeholder="SEO description" />
            </div>
          </Card>
        </div>

        <div className="flex justify-end gap-3 lg:col-span-3">
          <Link href="/products">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function AddSizeInline({ onAdd }: { onAdd: (label: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd(value);
            setValue("");
          }
        }}
        placeholder="Add a size, e.g. XL"
        className="w-40"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          onAdd(value);
          setValue("");
        }}
      >
        <Plus size={14} /> Add Size
      </Button>
    </div>
  );
}
