import { Badge } from "./index";
import type { OrderStatus, LeadStatus, Role, PublicationState } from "@/types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, string> = {
    New: "blue",
    Processing: "amber",
    Completed: "green",
    Cancelled: "red",
  };
  return <Badge color={map[status]}>{status}</Badge>;
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const map: Record<LeadStatus, string> = {
    New: "blue",
    Contacted: "amber",
    Closed: "green",
  };
  return <Badge color={map[status]}>{status}</Badge>;
}

export function RoleBadge({ role }: { role: Role }) {
  const map: Record<Role, string> = {
    Owner: "indigo",
    Admin: "blue",
    Editor: "amber",
    Viewer: "slate",
  };
  return <Badge color={map[role]}>{role}</Badge>;
}

export function PublicationBadge({ state }: { state: PublicationState }) {
  return (
    <Badge color={state === "Live" ? "green" : "slate"}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${state === "Live" ? "bg-green-500" : "bg-slate-400"}`}
      />
      {state}
    </Badge>
  );
}
