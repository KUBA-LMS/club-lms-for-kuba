"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Shield, UserMinus, Crown } from "lucide-react";
import Link from "next/link";
import Header from "@/components/layout/header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Member {
  id: string;
  username: string;
  legal_name: string | null;
  profile_image: string | null;
  student_id: string | null;
  role: string;
  is_admin: boolean;
  club_role: string;
}

interface MemberListResponse {
  data: Member[];
  total: number;
  page: number;
  limit: number;
}

const ROLE_BADGE: Record<string, string> = {
  superadmin: "bg-badge-coral text-[#991B1B]",
  admin: "bg-badge-blue text-[#1E40AF]",
  member: "bg-bg text-text-secondary",
};

export default function ClubDetailPage() {
  const params = useParams();
  const clubId = params.clubId as string;
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchMembers() {
    try {
      const res = await api.get<MemberListResponse>(
        `admin/clubs/${clubId}/members`,
        { limit: 100 },
      );
      setMembers(res.data);
    } catch {
      toast.error("멤버 목록을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
  }, [clubId]);

  async function toggleAdmin(userId: string) {
    try {
      await api.put(`admin/clubs/${clubId}/members/${userId}/admin-toggle`);
      toast.success("역할이 변경되었습니다");
      fetchMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "역할 변경에 실패했습니다");
    }
  }

  async function toggleLead(userId: string) {
    try {
      await api.put(`admin/clubs/${clubId}/members/${userId}/lead-toggle`);
      toast.success("동아리 역할이 변경되었습니다");
      fetchMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "역할 변경에 실패했습니다");
    }
  }

  async function removeMember(userId: string, username: string) {
    if (!confirm(`${username}님을 이 동아리에서 제거하시겠습니까?`)) return;
    try {
      await api.delete(`admin/clubs/${clubId}/members/${userId}`);
      toast.success("멤버가 제거되었습니다");
      fetchMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "멤버 제거에 실패했습니다");
    }
  }

  return (
    <div>
      <Header title="동아리 상세" />

      <div className="px-8 pb-8">
        {/* Back link */}
        <Link
          href="/clubs"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          동아리 목록으로
        </Link>

        <h2 className="text-xl font-bold text-text-primary mb-6">멤버</h2>

        {/* Table */}
        <div className="bg-card rounded-2xl border border-card-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border">
                <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3.5">
                  사용자
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3.5">
                  학번
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3.5">
                  앱 역할
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3.5">
                  동아리 역할
                </th>
                <th className="text-right text-xs font-semibold text-text-secondary px-6 py-3.5">
                  관리
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center text-text-muted py-12 text-sm">
                    불러오는 중...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-text-muted py-12 text-sm">
                    멤버가 없습니다
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-card-border last:border-0 hover:bg-sidebar-hover transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-bg border border-card-border flex items-center justify-center overflow-hidden shrink-0">
                          {m.profile_image ? (
                            <img src={m.profile_image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-text-secondary">
                              {m.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{m.username}</p>
                          {m.legal_name && (
                            <p className="text-xs text-text-muted">{m.legal_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">
                      {m.student_id || "-"}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={cn(
                          "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                          ROLE_BADGE[m.role] || ROLE_BADGE.member,
                        )}
                      >
                        {m.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={cn(
                          "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                          m.club_role === "lead"
                            ? "bg-badge-yellow text-[#92400E]"
                            : "bg-bg text-text-secondary",
                        )}
                      >
                        {m.club_role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toggleAdmin(m.id)}
                          title="관리자 전환"
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-badge-blue hover:text-[#1E40AF] transition-colors"
                        >
                          <Shield size={14} />
                        </button>
                        <button
                          onClick={() => toggleLead(m.id)}
                          title="리더 전환"
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-badge-yellow hover:text-[#92400E] transition-colors"
                        >
                          <Crown size={14} />
                        </button>
                        <button
                          onClick={() => removeMember(m.id, m.username)}
                          title="멤버 제거"
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-badge-coral hover:text-danger transition-colors"
                        >
                          <UserMinus size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
