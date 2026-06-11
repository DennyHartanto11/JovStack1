"use client";

import { X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { OrderStatusBadge } from "@/components/ui/status";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { useOrder } from "@/hooks/useOrders";
import { formatCurrency, formatDate } from "@/lib/utils";

export function OrderDetailDrawer({ code, onClose }: { code: string | null; onClose: () => void }) {
  const { data: order, isLoading, isError, error, refetch } = useOrder(code);
  if (!code) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <p className="font-mono text-sm font-semibold text-slate-900">{code}</p>
            <p className="text-xs text-slate-400">Order detail</p>
          </div>
          <button onClick={onClose} className="rounded p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => refetch()} />
          ) : !order ? null : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <OrderStatusBadge status={order.status} />
                <span className="text-xs text-slate-400">{formatDate(order.createdAt)}</span>
              </div>

              {/* Customer */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Customer
                </h3>
                <p className="font-medium text-slate-800">{order.customer}</p>
                {order.email && <p className="text-sm text-slate-500">{order.email}</p>}
                <p className="text-sm text-slate-500">{order.phone}</p>
                {order.address && <p className="mt-1 text-sm text-slate-500">{order.address}</p>}
                {order.paymentMethod && (
                  <p className="mt-1 text-xs text-slate-400">
                    Payment: <span className="uppercase">{order.paymentMethod}</span>
                  </p>
                )}
              </section>

              {/* Items */}
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Items ({order.items})
                </h3>
                <div className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)]">
                  {(order.lineItems ?? []).map((it) => (
                    <div key={it.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                      <div>
                        <p className="font-medium text-slate-800">{it.name}</p>
                        <p className="text-xs text-slate-400">
                          {it.size ? `Size ${it.size} · ` : ""}
                          {it.quantity} × {formatCurrency(it.price)}
                        </p>
                      </div>
                      <span className="font-medium text-slate-700">
                        {formatCurrency(it.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Total */}
              <section className="flex items-center justify-between border-t border-[var(--border)] pt-4">
                <span className="text-sm font-medium text-slate-500">Total</span>
                <span className="text-lg font-semibold text-slate-900">
                  {formatCurrency(order.total)}
                </span>
              </section>

              <a
                href={`https://wa.me/${order.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full text-green-600">
                  <MessageCircle size={16} /> Contact via WhatsApp
                </Button>
              </a>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
