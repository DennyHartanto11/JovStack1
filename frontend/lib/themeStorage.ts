import type { ThemeSettings } from "@/types";

/**
 * Client-side theme persistence. Until the backend exposes
 * `GET/PUT /websites/:id/theme`, the edited theme is stored in localStorage
 * so the editor preview AND the public storefront (/site/[slug]) read the
 * same latest values. Swap to the API once the endpoint exists.
 */
const key = (websiteId: string) => `jovstack-theme-${websiteId}`;

export function loadLocalTheme(websiteId: string): ThemeSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(websiteId));
    return raw ? (JSON.parse(raw) as ThemeSettings) : null;
  } catch {
    return null;
  }
}

export function saveLocalTheme(websiteId: string, theme: ThemeSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(websiteId), JSON.stringify(theme));
  } catch {
    /* ignore quota / serialization errors */
  }
}
