"use client";

import { useState } from "react";
import { Menu, Search, Bell, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useLogout } from "@/hooks/useAuth";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-white/80 px-4 backdrop-blur lg:px-6">
      <button onClick={onMenu} className="lg:hidden">
        <Menu size={20} />
      </button>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Search..."
          className="h-9 w-full rounded-lg border border-[var(--border)] bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-[var(--accent)] focus:bg-white"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((o) => !o);
              setMenuOpen(false);
            }}
            className="relative rounded-lg p-2 hover:bg-slate-100"
          >
            <Bell size={18} className="text-slate-600" />
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-lg border border-[var(--border)] bg-white p-2 shadow-lg">
                <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Notifications
                </p>
                <div className="flex flex-col items-center gap-1 px-3 py-8 text-center">
                  <Bell size={22} className="text-slate-300" />
                  <p className="text-sm text-slate-500">You&apos;re all caught up</p>
                  <p className="text-xs text-slate-400">No new notifications</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setMenuOpen((o) => !o);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white"
              style={{ background: user?.avatarColor ?? "#6366f1" }}
            >
              {user?.name?.charAt(0) ?? "?"}
            </span>
            <div className="hidden text-left text-sm sm:block">
              <p className="font-medium leading-none text-slate-900">{user?.name ?? "—"}</p>
              <p className="mt-0.5 text-xs text-slate-500">{user?.email ?? ""}</p>
            </div>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-[var(--border)] bg-white p-1 shadow-lg">
                <button
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <LogOut size={15} /> {logout.isPending ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
