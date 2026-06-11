import type { Website } from "@/types";

// Read the env var directly (Next inlines NEXT_PUBLIC_* at build time) so this
// module stays free of the API client and its store side effects.
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"
).replace(/\/+$/, "");

/**
 * Published-site URL helpers.
 *
 * A website has a *vanity* domain (`{slug}.jovstack.app`) that we display, but
 * that subdomain only resolves once real wildcard DNS is provisioned. The
 * frontend serves the live theme at `/site/{slug}` using the public JSON API
 * (`GET /api/v1/public/sites/:slug`), so we always point there for the preview
 * link — it renders the actual saved theme and products.
 *
 * The backend also has its own `/site/{slug}` HTML renderer (a lightweight
 * stand-in), but we prefer the frontend route because it uses the full React
 * Storefront component with all theme customizations.
 */

/** Display label, e.g. `tokobudi.jovstack.app`. */
export function siteVanityDomain(site: Pick<Website, "slug" | "domain">): string {
  return site.domain ?? `${site.slug}.jovstack.app`;
}

/**
 * Openable URL for the published storefront. Always uses the frontend
 * `/site/{slug}` route, which fetches from the public API and renders the
 * full live theme (not the backend's lightweight HTML renderer).
 */
export function siteUrl(site: Pick<Website, "slug">): string {
  return `/site/${site.slug}`;
}

/** The backend-served HTML preview URL (lightweight, not theme-accurate). */
export function backendSiteUrl(slug: string): string {
  return `${API_BASE_URL}/site/${slug}`;
}
