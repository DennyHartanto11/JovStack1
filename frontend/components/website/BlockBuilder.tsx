"use client";

import { useState } from "react";
import {
  GripVertical,
  Trash2,
  Layout,
  Star,
  Images,
  Package,
  HelpCircle,
  Mail,
  PanelBottom,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui";
import { LoadingState } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { useBlocks, useSaveBlocks } from "@/hooks/useWebsites";
import type { Block, BlockType } from "@/types";

const blockMeta: Record<BlockType, { icon: typeof Layout; desc: string }> = {
  Hero: { icon: Layout, desc: "Large banner with heading & CTA" },
  Features: { icon: Star, desc: "Highlight key features" },
  Gallery: { icon: Images, desc: "Image grid gallery" },
  Product: { icon: Package, desc: "Showcase products" },
  FAQ: { icon: HelpCircle, desc: "Frequently asked questions" },
  Contact: { icon: Mail, desc: "Contact form section" },
  Footer: { icon: PanelBottom, desc: "Page footer" },
};

const allBlocks = Object.keys(blockMeta) as BlockType[];

export function BlockBuilder({ pageId }: { pageId: string }) {
  const { data, isLoading } = useBlocks(pageId);
  const save = useSaveBlocks(pageId);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Render-phase sync: when the server payload arrives (or the page changes),
  // seed the editable canvas once. Adjusting state during render — not in an
  // effect — avoids a cascading re-render. See react.dev "you might not need
  // an effect".
  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  if (data && syncedFor !== pageId) {
    setBlocks(data);
    setSyncedFor(pageId);
  }

  function addBlock(type: BlockType) {
    setBlocks((b) => [
      ...b,
      { id: `b-${Date.now()}`, type, title: `${type} Block` },
    ]);
  }

  function removeBlock(id: string) {
    setBlocks((b) => b.filter((x) => x.id !== id));
  }

  function onDrop(target: number) {
    if (dragIndex === null || dragIndex === target) return;
    setBlocks((b) => {
      const copy = [...b];
      const [moved] = copy.splice(dragIndex, 1);
      copy.splice(target, 0, moved);
      return copy;
    });
    setDragIndex(null);
  }

  function handleSave() {
    save.mutate({
      blocks: blocks.map((b, order) => ({ type: b.type, title: b.title, order })),
    });
  }

  if (isLoading) return <LoadingState label="Loading blocks…" />;

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Palette */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Block Palette
        </p>
        <div className="space-y-2">
          {allBlocks.map((type) => {
            const Icon = blockMeta[type].icon;
            return (
              <button
                key={type}
                onClick={() => addBlock(type)}
                className="flex w-full items-start gap-3 rounded-lg border border-[var(--border)] bg-white p-3 text-left transition-colors hover:border-[var(--accent)] hover:bg-indigo-50/40"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                  <Icon size={16} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-slate-800">{type}</span>
                  <span className="block text-xs text-slate-400">{blockMeta[type].desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Canvas */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Canvas — drag to reorder
        </p>
        <div className="min-h-[400px] space-y-3 rounded-xl border-2 border-dashed border-[var(--border)] bg-slate-50/50 p-4">
          {blocks.length === 0 && (
            <div className="flex h-64 flex-col items-center justify-center text-slate-400">
              <Plus size={28} />
              <p className="mt-2 text-sm">Add blocks from the palette</p>
            </div>
          )}
          {blocks.map((block, i) => {
            const Icon = blockMeta[block.type].icon;
            return (
              <div
                key={block.id}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(i)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm transition-all",
                  dragIndex === i && "opacity-40"
                )}
              >
                <GripVertical size={18} className="cursor-grab text-slate-300 group-hover:text-slate-500" />
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-50 text-[var(--accent)]">
                  <Icon size={18} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{block.title}</p>
                  <p className="text-xs text-slate-400">{block.type} block</p>
                </div>
                <button
                  onClick={() => removeBlock(block.id)}
                  className="rounded p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          {save.isSuccess && <span className="text-sm text-green-600">Saved ✓</span>}
          <Button variant="outline">Preview</Button>
          <Button onClick={handleSave} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save Page"}
          </Button>
        </div>
      </div>
    </div>
  );
}
