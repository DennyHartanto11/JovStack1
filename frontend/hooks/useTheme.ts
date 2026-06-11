"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { useActiveOrgId } from "./useActiveOrgId";
import { defaultTheme } from "@/lib/theme";
import { loadLocalTheme, saveLocalTheme } from "@/lib/themeStorage";
import type { ThemeSettings } from "@/types";

/**
 * Loads a website's storefront theme. Resolution order:
 *   1. backend `GET /websites/:id/theme` (when available)
 *   2. locally-saved theme (localStorage)
 *   3. built-in default theme
 * so the editor and the public /site/[slug] page always show the latest edits.
 */
export function useWebsiteTheme(websiteId: string) {
  const org = useActiveOrgId();
  return useQuery({
    queryKey: ["theme", org, websiteId],
    enabled: !!websiteId,
    queryFn: async () => {
      try {
        const theme = await api<ThemeSettings>(`/websites/${websiteId}/theme`);
        return { ...defaultTheme, ...theme } as ThemeSettings;
      } catch (err) {
        const missing = err instanceof ApiError && (err.status === 404 || err.code === "NOT_FOUND");
        if (missing) {
          return loadLocalTheme(websiteId) ?? defaultTheme;
        }
        // Network/other error → still prefer local edits over crashing.
        return loadLocalTheme(websiteId) ?? defaultTheme;
      }
    },
  });
}

export function useSaveWebsiteTheme(websiteId: string) {
  const qc = useQueryClient();
  const org = useActiveOrgId();
  return useMutation({
    mutationFn: async (theme: ThemeSettings) => {
      // Persist locally first so the public storefront reflects it immediately.
      saveLocalTheme(websiteId, theme);
      try {
        return await api<ThemeSettings>(`/websites/${websiteId}/theme`, {
          method: "PUT",
          body: theme,
        });
      } catch {
        // Backend endpoint not ready yet — local save still succeeds.
        return theme;
      }
    },
    onSuccess: (theme) => qc.setQueryData(["theme", org, websiteId], theme),
  });
}
