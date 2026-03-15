"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { RecentRegistration } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-badge-yellow text-[#92400E]",
  confirmed: "bg-badge-green text-[#065F46]",
  cancelled: "bg-badge-coral text-[#991B1B]",
  checked_in: "bg-badge-blue text-[#1E40AF]",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "대기",
  confirmed: "승인",
  cancelled: "취소",
  checked_in: "체크인",
};

export default function RecentTasks() {
  const [tasks, setTasks] = useState<RecentRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: RecentRegistration[] }>("admin/dashboard/recent-registrations", { limit: 4 })
      .then((res) => setTasks(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-card rounded-2xl border border-card-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-text-primary">
          요청 현황
        </h3>
        <span className="text-xs text-text-muted">
          최근 등록 요청
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {loading ? (
          <p className="col-span-2 text-center text-text-muted text-sm py-8">
            불러오는 중...
          </p>
        ) : tasks.length === 0 ? (
          <p className="col-span-2 text-center text-text-muted text-sm py-8">
            등록 요청이 없습니다
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="border border-card-border rounded-xl p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    STATUS_STYLES[task.status] || "bg-bg text-text-secondary"
                  )}
                >
                  {STATUS_LABELS[task.status] || task.status}
                </span>
              </div>
              <p className="text-sm font-semibold text-text-primary truncate">
                {task.event}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                @{task.username}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
