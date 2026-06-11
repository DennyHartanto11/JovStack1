"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Image as ImageIcon,
  Package,
  Tags,
  ShoppingCart,
  Inbox,
  Users,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrgSwitcher } from "./OrgSwitcher";

const nav = [
  { section: "Overview", items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    section: "Build",
    items: [
      { href: "/websites", label: "Websites", icon: Globe },
      { href: "/media", label: "Media Library", icon: ImageIcon },
    ],
  },
  {
    section: "Commerce",
    items: [
      { href: "/products", label: "Products", icon: Package },
      { href: "/categories", label: "Categories", icon: Tags },
      { href: "/orders", label: "Orders", icon: ShoppingCart },
      { href: "/leads", label: "Leads", icon: Inbox },
    ],
  },
  {
    section: "Settings",
    items: [
      { href: "/team", label: "Team", icon: Users },
      { href: "/organizations/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--border)] bg-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] font-bold text-white">
              J
            </span>
            <span className="text-lg font-semibold tracking-tight">JovStack</span>
          </Link>
          <button onClick={onClose} className="lg:hidden">
            <X size={18} />
          </button>
        </div>

        <div className="px-3 pb-3">
          <OrgSwitcher />
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
          {nav.map((group) => (
            <div key={group.section}>
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <Icon size={18} className={active ? "text-[var(--accent)]" : ""} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--border)] p-3">
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-700">Free Plan</p>
            <p className="mt-0.5">3 of 5 websites used</p>
          </div>
        </div>
      </aside>
    </>
  );
}
