"use client";

import { useEffect, useState } from "react";
import { Users, Building2, Calendar, ClipboardList } from "lucide-react";
import Header from "@/components/layout/header";
import StatsCard from "@/components/dashboard/stats-card";
import ActivityChart from "@/components/dashboard/activity-chart";
import RecentTasks from "@/components/dashboard/recent-tasks";
import RightPanel from "@/components/dashboard/right-panel";
import { api } from "@/lib/api";
import { DashboardStats } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api
      .get<DashboardStats>("admin/dashboard/stats")
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="flex">
      <div className="flex-1 min-w-0">
        <Header title="대시보드" />

        <div className="px-8 pb-8 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <StatsCard
              label="전체 사용자"
              value={stats?.total_users ?? 0}
              icon={Users}
              accent
            />
            <StatsCard
              label="전체 동아리"
              value={stats?.total_clubs ?? 0}
              icon={Building2}
            />
            <StatsCard
              label="전체 이벤트"
              value={stats?.total_events ?? 0}
              icon={Calendar}
            />
            <StatsCard
              label="대기 중 요청"
              value={stats?.pending_registrations ?? 0}
              icon={ClipboardList}
              accent
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-4">
            <ActivityChart />
            <RecentTasks />
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="pr-6 pt-16">
        <RightPanel stats={stats} />
      </div>
    </div>
  );
}
