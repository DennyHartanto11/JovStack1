import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Organization } from "@/types";

interface OrgState {
  organizations: Organization[];
  activeOrg: Organization | null;
  setOrganizations: (orgs: Organization[]) => void;
  setActiveOrg: (org: Organization) => void;
  clear: () => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set, get) => ({
      organizations: [],
      activeOrg: null,
      setOrganizations: (organizations) => {
        // Keep current active org if still present; otherwise default to first.
        const current = get().activeOrg;
        const stillValid = current && organizations.some((o) => o.id === current.id);
        set({
          organizations,
          activeOrg: stillValid ? current : organizations[0] ?? null,
        });
      },
      setActiveOrg: (activeOrg) => set({ activeOrg }),
      clear: () => set({ organizations: [], activeOrg: null }),
    }),
    {
      name: "jovstack-org",
      partialize: (s) => ({ activeOrg: s.activeOrg }),
    }
  )
);
