"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ArrowRight } from "lucide-react";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useOrgStore } from "@/stores/orgStore";
import { Button } from "@/components/ui";

/**
 * Onboarding guard. Tenant-scoped requests require an active organization
 * (the `X-Organization-Id` header). A freshly registered user has none, so
 * we surface a blocking prompt to create one before they hit pages that
 * would otherwise fail with "X-Organization-Id header is required".
 *
 * Hidden on `/organizations*` routes so the user can actually create one.
 */
export function OrganizationGate() {
  const pathname = usePathname();
  const { isSuccess } = useOrganizations();
  const organizations = useOrgStore((s) => s.organizations);

  const onOrgRoute = pathname.startsWith("/organizations");
  // Only act once the orgs request has succeeded, to avoid a flash on load.
  const hasNoOrganization = isSuccess && organizations.length === 0;

  if (!hasNoOrganization || onOrgRoute) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 text-center shadow-xl">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-[var(--accent)]">
          <Building2 size={26} />
        </span>
        <h2 className="text-xl font-semibold text-slate-900">Create your organization</h2>
        <p className="mt-2 text-sm text-slate-500">
          You need an organization before you can build websites, add products, or upload media.
          Let&apos;s set one up first.
        </p>
        <Link href="/organizations/create">
          <Button className="mt-6 w-full">
            Create Organization <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
