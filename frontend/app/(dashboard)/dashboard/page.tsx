"use client";

import { Globe, Package, ShoppingCart, Inbox } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { StatCard } from "@/components/dashboard/StatCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { LoadingState, ErrorState } from "@/components/ui/states";
import {
  useDashboardSummary,
  useDashboardTrends,
  useDashboardActivities,
} from "@/hooks/useDashboard";

export default function DashboardPage() {
  const summary = useDashboardSummary();
  const trends = useDashboardTrends();
  const activities = useDashboardActivities();

  return (
    <div>
      <PageHeader title="Dashboard" description="Welcome back, here's your business at a glance." />

      {summary.isError ? (
        <ErrorState error={summary.error} onRetry={() => summary.refetch()} />
      ) : !summary.data ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Websites" value={summary.data.totalWebsites} icon={Globe} accent="#6366f1" />
          <StatCard label="Total Products" value={summary.data.totalProducts} icon={Package} accent="#22c55e" />
          <StatCard label="Total Orders" value={summary.data.totalOrders} icon={ShoppingCart} accent="#f59e0b" />
          <StatCard label="Total Leads" value={summary.data.totalLeads} icon={Inbox} accent="#ef4444" />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Orders & Leads Trend</h2>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> Orders
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" /> Leads
              </span>
            </div>
          </div>
          {trends.isError ? (
            <ErrorState error={trends.error} onRetry={() => trends.refetch()} />
          ) : !trends.data ? (
            <LoadingState />
          ) : (
            <TrendChart data={trends.data} />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Recent Activities</h2>
          {activities.isError ? (
            <ErrorState error={activities.error} onRetry={() => activities.refetch()} />
          ) : !activities.data ? (
            <LoadingState />
          ) : (
            <ul className="space-y-4">
              {activities.data.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                  <div>
                    <p className="text-sm text-slate-700">{a.text}</p>
                    <p className="text-xs text-slate-400">{a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
