import { cn, formatNumber } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  trend?: string;
  accent?: boolean;
}

export default function StatsCard({ label, value, icon: Icon, trend, accent }: StatsCardProps) {
  return (
    <div className="bg-card rounded-2xl border border-card-border p-5 flex items-start justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow">
      <div>
        <p className="text-sm text-text-secondary font-medium">{label}</p>
        <p className="text-2xl font-bold text-text-primary mt-1">
          {formatNumber(value)}
        </p>
        {trend && (
          <p className="text-xs text-success font-medium mt-1">{trend}</p>
        )}
      </div>
      <div
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center",
          accent ? "bg-sidebar-active" : "bg-bg"
        )}
      >
        <Icon
          size={20}
          className={accent ? "text-accent" : "text-text-secondary"}
        />
      </div>
    </div>
  );
}
