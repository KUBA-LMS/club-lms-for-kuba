"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { api } from "@/lib/api";
import { WeeklyActivity } from "@/lib/types";

export default function ActivityChart() {
  const [data, setData] = useState<WeeklyActivity[]>([]);

  useEffect(() => {
    api
      .get<{ data: WeeklyActivity[] }>("admin/dashboard/weekly-activity")
      .then((res) => setData(res.data))
      .catch(() => {});
  }, []);

  const max = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 0;

  return (
    <div className="bg-card rounded-2xl border border-card-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-text-primary">
          신규 가입
        </h3>
        <span className="text-xs text-text-muted">최근 7일</span>
      </div>

      <div className="h-[200px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="30%">
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8C8C8C", fontSize: 12 }}
              />
              <YAxis hide />
              <Tooltip
                cursor={false}
                contentStyle={{
                  background: "#1A1A1A",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 12,
                  padding: "6px 10px",
                }}
                labelStyle={{ display: "none" }}
                formatter={(value) => [`${value}명`, ""]}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.count === max && max > 0 ? "#E8573A" : "#1A1A1A"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted text-sm">
            불러오는 중...
          </div>
        )}
      </div>
    </div>
  );
}
