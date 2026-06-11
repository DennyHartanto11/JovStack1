"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { useActiveOrgId } from "./useActiveOrgId";
import type { DashboardSummary, TrendPoint, Activity } from "@/types";

export function useDashboardSummary() {
  const org = useActiveOrgId();
  return useQuery({
    queryKey: qk.dashboardSummary(org),
    queryFn: () => api<DashboardSummary>("/dashboard/summary"),
    enabled: !!org,
  });
}

export function useDashboardTrends(range = "6m") {
  const org = useActiveOrgId();
  return useQuery({
    queryKey: qk.dashboardTrends(org, range),
    queryFn: () => api<TrendPoint[]>("/dashboard/trends", { params: { range } }),
    enabled: !!org,
  });
}

export function useDashboardActivities() {
  const org = useActiveOrgId();
  return useQuery({
    queryKey: qk.dashboardActivities(org),
    queryFn: () => api<Activity[]>("/dashboard/activities"),
    enabled: !!org,
  });
}
