/** Centralized TanStack Query keys. Org id is folded in so switching tenant
 *  invalidates/refetches all tenant-scoped data automatically. */
export const qk = {
  me: ["me"] as const,
  organizations: ["organizations"] as const,

  dashboardSummary: (org?: string) => ["dashboard", "summary", org] as const,
  dashboardTrends: (org?: string, range = "6m") =>
    ["dashboard", "trends", org, range] as const,
  dashboardActivities: (org?: string) => ["dashboard", "activities", org] as const,

  members: (org?: string) => ["team", "members", org] as const,
  invitations: (org?: string) => ["team", "invitations", org] as const,

  websites: (org?: string, q?: string) => ["websites", org, q ?? ""] as const,
  website: (org?: string, id?: string) => ["websites", org, "detail", id] as const,
  pages: (org?: string, websiteId?: string) =>
    ["pages", org, websiteId] as const,
  blocks: (org?: string, pageId?: string) => ["blocks", org, pageId] as const,

  media: (org?: string, type?: string) => ["media", org, type ?? "all"] as const,

  products: (org?: string, category?: string, q?: string, page?: number) =>
    ["products", org, category ?? "all", q ?? "", page ?? 1] as const,
  categories: (org?: string) => ["categories", org] as const,

  orders: (org?: string, status?: string, page?: number) =>
    ["orders", org, status ?? "all", page ?? 1] as const,

  leads: (org?: string, status?: string, page?: number) =>
    ["leads", org, status ?? "all", page ?? 1] as const,
};
