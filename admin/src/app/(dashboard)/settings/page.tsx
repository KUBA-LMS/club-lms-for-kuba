"use client";

import Header from "@/components/layout/header";
import { Shield, Server, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <div>
      <Header title="설정" />

      <div className="px-8 pb-8 max-w-[800px]">
        <h2 className="text-xl font-bold text-text-primary mb-6">
          시스템 설정
        </h2>

        {/* IP Whitelist */}
        <div className="bg-card rounded-2xl border border-card-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-sidebar-active flex items-center justify-center shrink-0">
              <Shield size={20} className="text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-text-primary">
                IP 화이트리스트
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                특정 IP 주소만 관리자 대시보드에 접근할 수 있도록 제한합니다.
                <code className="text-xs bg-bg px-1.5 py-0.5 rounded">ADMIN_IP_WHITELIST</code> 환경 변수로 설정합니다.
              </p>
              <div className="mt-4 bg-bg rounded-xl border border-card-border p-4">
                <p className="text-xs text-text-muted mb-1">현재 설정:</p>
                <p className="text-sm font-mono text-text-primary">
                  {process.env.ADMIN_IP_WHITELIST || "(미설정 - 모든 IP 허용)"}
                </p>
              </div>
              <p className="text-xs text-text-muted mt-3">
                형식: 쉼표로 구분된 IP. 예시: 192.168.1.1,10.0.0.1
              </p>
            </div>
          </div>
        </div>

        {/* Backend Info */}
        <div className="bg-card rounded-2xl border border-card-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-bg flex items-center justify-center shrink-0">
              <Server size={20} className="text-text-secondary" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-text-primary">
                백엔드 연결
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                API 서버 URL 설정입니다.
              </p>
              <div className="mt-4 bg-bg rounded-xl border border-card-border p-4">
                <p className="text-xs text-text-muted mb-1">백엔드 URL:</p>
                <p className="text-sm font-mono text-text-primary">
                  {process.env.BACKEND_URL || "http://localhost:8000/api/v1"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Database Info */}
        <div className="bg-card rounded-2xl border border-card-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-bg flex items-center justify-center shrink-0">
              <Database size={20} className="text-text-secondary" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-text-primary">
                관리자 계정 관리
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                최고관리자 계정은 서버에서 CLI 명령어로 관리합니다.
              </p>
              <div className="mt-4 bg-bg rounded-xl border border-card-border p-4 space-y-2">
                <p className="text-xs font-mono text-text-secondary">
                  python -m scripts.manage create-superadmin
                </p>
                <p className="text-xs font-mono text-text-secondary">
                  python -m scripts.manage promote-admin &lt;username&gt;
                </p>
                <p className="text-xs font-mono text-text-secondary">
                  python -m scripts.manage demote-admin &lt;username&gt;
                </p>
                <p className="text-xs font-mono text-text-secondary">
                  python -m scripts.manage list-admins
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
