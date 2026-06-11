"use client";

import { useOrgStore } from "@/stores/orgStore";

/** The active organization id, used both for query-key scoping and to gate
 *  tenant-scoped queries (they stay disabled until an org is selected). */
export function useActiveOrgId(): string | undefined {
  return useOrgStore((s) => s.activeOrg?.id);
}
