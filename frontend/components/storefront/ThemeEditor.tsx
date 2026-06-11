"use client";

import { useState } from "react";
import { GripVertical, Eye, EyeOff, Save, Monitor, Smartphone } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui";
import { LoadingState } from "@/components/ui/states";
import { Storefront } from "./Storefront";
import { useWebsiteTheme, useSaveWebsiteTheme } from "@/hooks/useTheme";
import { useProducts } from "@/hooks/useProducts";
import { sectionLabels } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { ThemeSettings, StorefrontSection } from "@/types";

export function ThemeEditor({ websiteId }: { websiteId: string }) {
  const { data: loaded, isLoading } = useWebsiteTheme(websiteId);
  const save = useSaveWebsiteTheme(websiteId);
  const productsQ = useProducts({ page: 1 });
  const products = productsQ.data?.data ?? [];

  const [theme, setTheme] = useState<ThemeSettings | null>(null);
  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Render-phase sync of the loaded theme into editable local state.
  if (loaded && syncedFor !== websiteId) {
    setTheme(loaded);
    setSyncedFor(websiteId);
  }

  if (isLoading || !theme) return <LoadingState label="Loading theme…" />;

  // Typed updater helpers.
  const update = (patch: Partial<ThemeSettings>) => setTheme((t) => ({ ...t!, ...patch }));
  const updateColors = (k: keyof ThemeSettings["colors"], v: string) =>
    setTheme((t) => ({ ...t!, colors: { ...t!.colors, [k]: v } }));
  const updateHero = (k: keyof ThemeSettings["hero"], v: string) =>
    setTheme((t) => ({ ...t!, hero: { ...t!.hero, [k]: v } }));
  const updateButtons = (patch: Partial<NonNullable<ThemeSettings["buttons"]>>) =>
    setTheme((t) => ({
      ...t!,
      buttons: {
        borderRadius: "rounded-md",
        style: "solid",
        fontWeight: "semibold",
        hoverEffect: "zoom",
        ...(t!.buttons ?? {}),
        ...patch,
      },
    }));

  function toggleSection(id: string) {
    setTheme((t) => ({
      ...t!,
      sections: t!.sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    }));
  }
  function reorder(target: number) {
    if (dragIndex === null || dragIndex === target) return;
    setTheme((t) => {
      const next = [...t!.sections];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(target, 0, moved);
      return { ...t!, sections: next };
    });
    setDragIndex(null);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      {/* ---------------- Settings ---------------- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Storefront Theme</h3>
          <Button size="sm" disabled={save.isPending} onClick={() => save.mutate(theme)}>
            <Save size={14} /> {save.isPending ? "Saving…" : save.isSuccess ? "Saved ✓" : "Save"}
          </Button>
        </div>

        {/* Brand */}
        <Card className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Brand & Preset</p>
          <div className="mb-4">
            <Label>Theme Preset</Label>
            <select
              value={theme.preset ?? "default"}
              onChange={(e) => {
                const isPPRX = e.target.value === "pprx";
                // Only dynamically import pprxTheme when selected, or load from lib
                import("@/lib/theme").then(({ pprxTheme, defaultTheme }) => {
                  const presetTheme = isPPRX ? pprxTheme : defaultTheme;
                  // Merge the preset's layout/colors but keep the current brandName
                  setTheme((t) => ({ ...t!, ...presetTheme, brandName: t!.brandName }));
                });
              }}
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="default">Default Modern</option>
              <option value="pprx">Paper Rex Style</option>
            </select>
          </div>
          <div>
            <Label>Store Name</Label>
            <Input value={theme.brandName} onChange={(e) => update({ brandName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Currency</Label>
              <Input value={theme.currency} onChange={(e) => update({ currency: e.target.value })} />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input
                value={theme.logoUrl ?? ""}
                onChange={(e) => update({ logoUrl: e.target.value || undefined })}
                placeholder="optional"
              />
            </div>
          </div>
          <div>
            <Label>Nav items (comma separated)</Label>
            <Input
              value={theme.nav.join(", ")}
              onChange={(e) => update({ nav: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            />
          </div>
        </Card>

        {/* Colors */}
        <Card className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Colors</p>
          <div className="grid grid-cols-2 gap-3">
            {(() => {
              const getFallbackColor = (key: keyof typeof theme.colors) => {
                if (theme.colors[key]) return theme.colors[key];
                const isPprx = theme.preset === "pprx";
                const fallbacks = {
                  background: isPprx ? "#0d0d0d" : "#0b0e14",
                  surface: isPprx ? "#1a1a1a" : "#141923",
                  accent: isPprx ? "#e4ff00" : "#14b8c4",
                  accentAlt: isPprx ? "#ff0099" : "#7a1f2b",
                  text: isPprx ? "#ffffff" : "#f1f5f9",
                  muted: isPprx ? "#a0a0a0" : "#94a3b8",
                  headerBg: isPprx ? "#0d0d0d" : "#141923",
                  headerText: isPprx ? "#ffffff" : "#f1f5f9",
                  promoBarBg: isPprx ? "#ff0099" : "#14b8c4",
                  promoBarText: isPprx ? "#000000" : "#0b0e14",
                };
                return fallbacks[key] || "#000000";
              };
              return (
                [
                  ["background", "Background"],
                  ["surface", "Surface"],
                  ["accent", "Accent"],
                  ["accentAlt", "Accent 2"],
                  ["text", "Text"],
                  ["muted", "Muted"],
                  ["headerBg", "Header Background"],
                  ["headerText", "Header Text"],
                  ["promoBarBg", "Promo Bar Background"],
                  ["promoBarText", "Promo Bar Text"],
                ] as const
              ).map(([key, label]) => {
                const colorValue = getFallbackColor(key);
                return (
                  <div key={key}>
                    <Label>{label}</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorValue}
                        onChange={(e) => updateColors(key, e.target.value)}
                        className="h-9 w-10 shrink-0 cursor-pointer rounded border border-[var(--border)] bg-white"
                      />
                      <Input value={colorValue} onChange={(e) => updateColors(key, e.target.value)} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </Card>

        {/* Promo bar */}
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Promo Bar</p>
            <Toggle value={theme.promoBar.enabled} onChange={(v) => update({ promoBar: { ...theme.promoBar, enabled: v } })} />
          </div>
          <Input
            value={theme.promoBar.text}
            onChange={(e) => update({ promoBar: { ...theme.promoBar, text: e.target.value } })}
          />
        </Card>

        {/* Hero */}
        <Card className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hero</p>
          <div>
            <Label>Eyebrow</Label>
            <Input value={theme.hero.eyebrow} onChange={(e) => updateHero("eyebrow", e.target.value)} />
          </div>
          <div>
            <Label>Title</Label>
            <Input value={theme.hero.title} onChange={(e) => updateHero("title", e.target.value)} />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Input value={theme.hero.subtitle} onChange={(e) => updateHero("subtitle", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>CTA Label</Label>
              <Input value={theme.hero.ctaLabel} onChange={(e) => updateHero("ctaLabel", e.target.value)} />
            </div>
            <div>
              <Label>CTA Link</Label>
              <Input value={theme.hero.ctaHref} onChange={(e) => updateHero("ctaHref", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Hero Image URL</Label>
            <Input
              value={theme.hero.imageUrl ?? ""}
              onChange={(e) => updateHero("imageUrl", e.target.value)}
              placeholder="optional"
            />
          </div>
        </Card>

        {/* Newsletter */}
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Newsletter</p>
            <Toggle value={theme.newsletter.enabled} onChange={(v) => update({ newsletter: { ...theme.newsletter, enabled: v } })} />
          </div>
          <Input
            value={theme.newsletter.headline}
            onChange={(e) => update({ newsletter: { ...theme.newsletter, headline: e.target.value } })}
            placeholder="Headline"
          />
          <Input
            value={theme.newsletter.offer}
            onChange={(e) => update({ newsletter: { ...theme.newsletter, offer: e.target.value } })}
            placeholder="Offer"
          />
        </Card>
 
        {/* Buttons & Clickables */}
        <Card className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Buttons & Clickables</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Border Radius</Label>
              <select
                value={theme.buttons?.borderRadius ?? "rounded-md"}
                onChange={(e) => updateButtons({ borderRadius: e.target.value as any })}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
              >
                <option value="none">Sharp Corners</option>
                <option value="rounded">Small</option>
                <option value="rounded-md">Medium</option>
                <option value="rounded-lg">Large</option>
                <option value="rounded-full">Pill / Capsule</option>
              </select>
            </div>
            <div>
              <Label>Button Style</Label>
              <select
                value={theme.buttons?.style ?? "solid"}
                onChange={(e) => updateButtons({ style: e.target.value as any })}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
              >
                <option value="solid">Solid Color</option>
                <option value="outline">Outline</option>
                <option value="gradient">Gradient Glow</option>
              </select>
            </div>
            <div>
              <Label>Font Weight</Label>
              <select
                value={theme.buttons?.fontWeight ?? "semibold"}
                onChange={(e) => updateButtons({ fontWeight: e.target.value as any })}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
              >
                <option value="medium">Medium</option>
                <option value="semibold">Semi Bold</option>
                <option value="bold">Bold</option>
                <option value="black">Black (Italicized)</option>
              </select>
            </div>
            <div>
              <Label>Hover Effect</Label>
              <select
                value={theme.buttons?.hoverEffect ?? "zoom"}
                onChange={(e) => updateButtons({ hoverEffect: e.target.value as any })}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]"
              >
                <option value="none">None</option>
                <option value="zoom">Scale Zoom</option>
                <option value="glow">Glow Shadow</option>
                <option value="both">Zoom & Glow</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Sections (the block-builder part) */}
        <Card className="space-y-2 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Sections — drag to reorder, toggle to show/hide
          </p>
          {theme.sections.map((s, i) => (
            <SectionRow
              key={s.id}
              section={s}
              dim={dragIndex === i}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => reorder(i)}
              onToggle={() => toggleSection(s.id)}
            />
          ))}
        </Card>
      </div>

      {/* ---------------- Live preview ---------------- */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Preview</p>
          <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-white p-0.5">
            <button
              onClick={() => setDevice("desktop")}
              className={cn("rounded-md p-1.5", device === "desktop" ? "bg-slate-100" : "")}
            >
              <Monitor size={16} />
            </button>
            <button
              onClick={() => setDevice("mobile")}
              className={cn("rounded-md p-1.5", device === "mobile" ? "bg-slate-100" : "")}
            >
              <Smartphone size={16} />
            </button>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-slate-200">
          <div className="flex items-center gap-1.5 border-b border-[var(--border)] bg-white px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <span className="ml-2 text-xs text-slate-400">preview</span>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            <div className={cn("mx-auto transition-all", device === "mobile" ? "max-w-sm" : "w-full")}>
              <Storefront theme={theme} products={products} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionRow({
  section,
  dim,
  onToggle,
  ...drag
}: {
  section: StorefrontSection;
  dim: boolean;
  onToggle: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  return (
    <div
      draggable
      {...drag}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm",
        dim && "opacity-40",
        !section.enabled && "opacity-60"
      )}
    >
      <GripVertical size={15} className="cursor-grab text-slate-300" />
      <span className="flex-1 font-medium text-slate-700">
        {(section.config?.title as string) ?? sectionLabels[section.type]}
        <span className="ml-2 text-xs font-normal text-slate-400">{sectionLabels[section.type]}</span>
      </span>
      <button onClick={onToggle} className="text-slate-400 hover:text-slate-700">
        {section.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "relative h-5 w-9 rounded-full transition-colors",
        value ? "bg-[var(--accent)]" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
          value ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
