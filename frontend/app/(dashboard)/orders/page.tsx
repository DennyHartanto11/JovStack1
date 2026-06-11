"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/ui";
import { OrderStatusBadge } from "@/components/ui/status";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/states";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { OrderDetailDrawer } from "@/components/order/OrderDetailDrawer";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const tabs: ("All" | OrderStatus)[] = ["All", "New", "Processing", "Completed", "Cancelled"];
const nextStatus: Record<OrderStatus, OrderStatus> = {
  New: "Processing",
  Processing: "Completed",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

export default function OrdersPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [openCode, setOpenCode] = useState<string | null>(null);
  const { data, isLoading, isError, error, refetch } = useOrders({ status: tab });
  const updateStatus = useUpdateOrderStatus();

  const orders = data?.data ?? [];

  return (
    <div>
      <PageHeader title="Orders" description="Manage incoming orders from your websites." />

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-[var(--border)]">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap",
              tab === t
                ? "border-[var(--accent)] text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders" description="Orders from your published sites appear here." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setOpenCode(o.id)}
                  className="cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium text-[var(--accent)] underline-offset-2 hover:underline">
                    {o.id}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{o.customer}</p>
                    <p className="text-xs text-slate-400">{o.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{o.items}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{formatCurrency(o.total)}</td>
                  <td className="px-4 py-3">
                    <button
                      title="Advance status"
                      disabled={o.status === "Completed" || o.status === "Cancelled"}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus.mutate({ id: o.id, status: nextStatus[o.status] });
                      }}
                    >
                      <OrderStatusBadge status={o.status} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`https://wa.me/${o.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="ghost" size="sm" className="text-green-600">
                        <MessageCircle size={14} /> WhatsApp
                      </Button>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <OrderDetailDrawer code={openCode} onClose={() => setOpenCode(null)} />
    </div>
  );
}
