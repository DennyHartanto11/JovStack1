import { Card } from "@/components/ui";
import { type LucideIcon, TrendingUp } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  accent: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: `${accent}1a`, color: accent }}
        >
          <Icon size={20} />
        </span>
        {trend && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
            <TrendingUp size={12} />
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </Card>
  );
}
