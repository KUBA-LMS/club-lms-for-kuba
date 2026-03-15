"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { DashboardStats } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { Circle, CheckCircle2 } from "lucide-react";

const PIE_COLORS = ["#E8573A", "#1A1A1A", "#E8E5E0"];

interface RightPanelProps {
  stats: DashboardStats | null;
}

export default function RightPanel({ stats }: RightPanelProps) {
  const pieData = stats
    ? [
        { name: "동아리", value: stats.total_clubs },
        { name: "이벤트", value: stats.total_events },
        { name: "사용자", value: stats.total_users },
      ]
    : [];

  const totalItems = pieData.reduce((s, d) => s + d.value, 0);
  const completionRate = stats
    ? Math.round(
        ((stats.total_events - stats.pending_registrations) /
          Math.max(stats.total_events, 1)) *
          100
      )
    : 0;

  return (
    <div className="w-[320px] shrink-0 space-y-5">
      {/* Platform Stats */}
      <div className="bg-card rounded-2xl border border-card-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text-primary">
            플랫폼 현황
          </h3>
          <span className="text-[10px] font-semibold text-accent bg-sidebar-active px-2 py-0.5 rounded-full">
            운영 중
          </span>
        </div>

        {/* Donut chart */}
        <div className="relative h-[140px] mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">
                {completionRate}%
              </p>
              <p className="text-[10px] text-text-muted">완료율</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {pieData.map((item, i) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[i] }}
                />
                <span className="text-text-secondary">{item.name}</span>
              </div>
              <span className="font-medium text-text-primary">
                {formatNumber(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="bg-card rounded-2xl border border-card-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h3 className="text-base font-semibold text-text-primary mb-4">
          오늘의 할 일
        </h3>

        <div className="space-y-3">
          {stats && stats.pending_registrations > 0 ? (
            <div className="flex items-start gap-3">
              <Circle size={16} className="text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-text-primary font-medium">
                  대기 중 등록 요청 {stats.pending_registrations}건
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  검토 및 승인 필요
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-text-primary font-medium">
                  모두 처리 완료
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  대기 중인 요청 없음
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-text-primary font-medium">
                시스템 정상 운영
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                모든 서비스 정상
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
