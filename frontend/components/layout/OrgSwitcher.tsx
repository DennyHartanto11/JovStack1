"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { useOrgStore } from "@/stores/orgStore";
import { cn } from "@/lib/utils";

export function OrgSwitcher() {
  const { organizations, activeOrg, setActiveOrg } = useOrgStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm hover:bg-slate-50"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--accent)] text-white">
          <Building2 size={14} />
        </span>
        <span className="flex-1 truncate text-left font-medium">
          {activeOrg?.name ?? "Select organization"}
        </span>
        <ChevronsUpDown size={14} className="text-slate-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-lg border border-[var(--border)] bg-white p-1 shadow-lg">
            <p className="px-2 py-1.5 text-xs font-medium text-slate-400">Organizations</p>
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  setActiveOrg(org);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-100"
              >
                <span className="flex-1 text-left">{org.name}</span>
                {org.id === activeOrg?.id && <Check size={14} className="text-[var(--accent)]" />}
              </button>
            ))}
            <div className="my-1 h-px bg-[var(--border)]" />
            <a
              href="/organizations/create"
              className={cn("block rounded-md px-2 py-1.5 text-sm text-[var(--accent)] hover:bg-slate-100")}
            >
              + Create organization
            </a>
          </div>
        </>
      )}
    </div>
  );
}
