"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/layout/header";
import { api } from "@/lib/api";
import { UserInfo, PaginatedResponse } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const ROLE_BADGE: Record<string, string> = {
  superadmin: "bg-badge-coral text-[#991B1B]",
  admin: "bg-badge-blue text-[#1E40AF]",
  member: "bg-bg text-text-secondary",
};

const ROLE_FILTERS = ["all", "member", "admin", "superadmin"];
const ROLE_FILTER_LABELS: Record<string, string> = {
  all: "전체",
  member: "멤버",
  admin: "관리자",
  superadmin: "최고관리자",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      if (roleFilter !== "all") params.role = roleFilter;

      const res = await api.get<PaginatedResponse<UserInfo>>("admin/users", params);
      setUsers(res.data);
      setTotal(res.total);
    } catch {
      toast.error("사용자 목록을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  async function changeRole(userId: string, newRole: string) {
    try {
      await api.put("admin/users/" + userId + "/role", { role: newRole });
      toast.success("역할이 변경되었습니다");
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "역할 변경에 실패했습니다");
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <Header title="사용자" />

      <div className="px-8 pb-8">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="이름 또는 학번으로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-card-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border"
            />
          </div>

          <div className="flex items-center gap-1 bg-card border border-card-border rounded-xl p-1">
            {ROLE_FILTERS.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                  roleFilter === r
                    ? "bg-text-primary text-white"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {ROLE_FILTER_LABELS[r] || r}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-2xl border border-card-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border">
                <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3.5">사용자</th>
                <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3.5">이메일</th>
                <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3.5">학번</th>
                <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3.5">역할</th>
                <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3.5">상태</th>
                <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3.5">가입일</th>
                <th className="text-right text-xs font-semibold text-text-secondary px-6 py-3.5">관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center text-text-muted py-12 text-sm">
                    불러오는 중...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-text-muted py-12 text-sm">
                    사용자가 없습니다
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-card-border last:border-0 hover:bg-sidebar-hover transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-bg border border-card-border flex items-center justify-center overflow-hidden shrink-0">
                          {user.profile_image ? (
                            <img src={user.profile_image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-text-secondary">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{user.username}</p>
                          <p className="text-xs text-text-muted">{user.legal_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">
                      {user.email || "-"}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">
                      {user.student_id || "-"}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={cn(
                          "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                          ROLE_BADGE[user.role] || ROLE_BADGE.member
                        )}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={cn(
                          "inline-block h-2 w-2 rounded-full",
                          user.is_active ? "bg-success" : "bg-text-muted"
                        )}
                      />
                    </td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {user.role === "superadmin" ? (
                        <span className="text-xs text-text-muted">-</span>
                      ) : user.role === "admin" ? (
                        <button
                          onClick={() => changeRole(user.id, "member")}
                          className="text-xs font-medium text-danger hover:underline"
                        >
                          강등
                        </button>
                      ) : (
                        <button
                          onClick={() => changeRole(user.id, "admin")}
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          승급
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-card-border">
              <p className="text-xs text-text-muted">
                전체 {total}명
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-text-secondary">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
