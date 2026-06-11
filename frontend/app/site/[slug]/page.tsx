"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Storefront } from "@/components/storefront/Storefront";
import { defaultTheme } from "@/lib/theme";
import { LoadingState } from "@/components/ui/states";
import type { ThemeSettings, Product } from "@/types";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"
).replace(/\/+$/, "");

interface PublicSiteData {
  website: {
    id: string;
    name: string;
    slug: string;
    seoTitle: string;
    seoDescription: string;
    state: "Live";
    publishedAt: string | null;
  };
  theme: Partial<ThemeSettings>;
  pages: Array<{
    id: string;
    name: string;
    order: number;
    blocks: Array<{ id: string; type: string; title: string; order: number; config: unknown }>;
  }>;
  products: Product[];
}

/**
 * Public storefront — fetches from GET /api/v1/public/sites/:slug
 * (no auth, no X-Organization-Id required). Works for any visitor.
 */
export default function PublicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [data, setData] = useState<PublicSiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE_URL}/api/v1/public/sites/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data as PublicSiteData);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0e14]">
        <LoadingState label="Loading store…" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0b0e14] text-slate-300">
        <p className="text-lg font-semibold">Store not found</p>
        <p className="text-sm text-slate-500">
          No published website matches &quot;{slug}&quot;.
        </p>
        <Link href="/websites" className="text-sm text-[#14b8c4] hover:underline">
          Back to portal
        </Link>
      </div>
    );
  }

  // Merge saved theme over defaults — deep-merge colors so partial themes work
  const theme: ThemeSettings = {
    ...defaultTheme,
    ...(data.theme as ThemeSettings),
    colors: {
      ...defaultTheme.colors,
      ...(data.theme.colors ?? {}),
    },
    sections: (data.theme as ThemeSettings).sections ?? defaultTheme.sections,
  };

  return (
    <Storefront theme={theme} products={data.products} siteSlug={data.website.slug} />
  );
}
