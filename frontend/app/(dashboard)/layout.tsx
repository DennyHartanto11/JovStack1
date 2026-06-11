"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAuthStore } from "@/stores/authStore";
import { useMe } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganizations";
import { OrganizationGate } from "@/components/organization/OrganizationGate";
import { LoadingState } from "@/components/ui/states";

// SSR-safe mount flag: `false` on the server and first client render,
// `true` thereafter — without a state-setting effect. Lets the persisted
// auth store hydrate before we trust `accessToken`.
const emptySubscribe = () => () => {};
function useHasMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mounted = useHasMounted();
  const accessToken = useAuthStore((s) => s.accessToken);

  // Redirect unauthenticated users once hydration has settled.
  useEffect(() => {
    if (mounted && !accessToken) router.replace("/auth/login");
  }, [mounted, accessToken, router]);

  // Bootstrap session: current user + the user's organizations (sets active org).
  useMe(!!accessToken);
  useOrganizations();

  if (!mounted || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Preparing your workspace…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>
      </div>
      <OrganizationGate />
    </div>
  );
}
