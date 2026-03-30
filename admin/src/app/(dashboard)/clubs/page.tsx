"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users, Layers, ChevronRight, Plus, Trash2 } from "lucide-react";
import Header from "@/components/layout/header";
import { api } from "@/lib/api";
import { ClubInfo } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export default function ClubsPage() {
  const [clubs, setClubs] = useState<ClubInfo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUniversity, setNewUniversity] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchClubs = () => {
    api
      .get<{ data: ClubInfo[] }>("admin/all-clubs")
      .then((res) => setClubs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post(`admin/clubs?name=${encodeURIComponent(newName.trim())}&university=${encodeURIComponent(newUniversity.trim())}`);
      setNewName("");
      setNewUniversity("");
      setShowCreate(false);
      fetchClubs();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to create club");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (clubId: string, clubName: string) => {
    if (!confirm(`"${clubName}" 동아리를 삭제하시겠습니까?`)) return;
    try {
      await api.delete(`admin/clubs/${clubId}`);
      fetchClubs();
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to delete club");
    }
  };

  const topLevel = clubs.filter((c) => !c.parent_id);
  const filtered = topLevel.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header title="동아리" />

      <div className="px-8 pb-8">
        {/* Search + Create */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="동아리 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-card-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border"
            />
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="h-10 px-4 rounded-xl bg-text-primary text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            동아리 생성
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-card rounded-2xl border border-card-border p-6 mb-6 flex items-end gap-4">
            <div className="flex-1">
              <label className="text-xs font-semibold text-text-secondary mb-1 block">동아리명</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="동아리 이름 입력"
                className="w-full h-10 px-4 rounded-xl bg-bg border border-card-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-text-secondary mb-1 block">대학교</label>
              <input
                type="text"
                value={newUniversity}
                onChange={(e) => setNewUniversity(e.target.value)}
                placeholder="대학교 이름 입력"
                className="w-full h-10 px-4 rounded-xl bg-bg border border-card-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="h-10 px-6 rounded-xl bg-text-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {creating ? "생성 중..." : "생성"}
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-card rounded-2xl border border-card-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border">
                <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3.5">
                  동아리명
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3.5">
                  대학교
                </th>
                <th className="text-center text-xs font-semibold text-text-secondary px-6 py-3.5">
                  멤버
                </th>
                <th className="text-center text-xs font-semibold text-text-secondary px-6 py-3.5">
                  서브그룹
                </th>
                <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3.5">
                  생성일
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-text-muted py-12 text-sm">
                    불러오는 중...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-text-muted py-12 text-sm">
                    동아리가 없습니다
                  </td>
                </tr>
              ) : (
                filtered.map((club) => (
                  <tr
                    key={club.id}
                    className="border-b border-card-border last:border-0 hover:bg-sidebar-hover transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-bg border border-card-border flex items-center justify-center overflow-hidden shrink-0">
                          {club.logo_image ? (
                            <img src={club.logo_image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-text-secondary">
                              {club.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-text-primary">
                          {club.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {club.university || "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-text-primary">
                        <Users size={14} className="text-text-muted" />
                        {club.member_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-text-primary">
                        <Layers size={14} className="text-text-muted" />
                        {club.subgroup_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {formatDate(club.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(club.id, club.name)}
                          className="text-text-muted hover:text-red-500 transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                        <Link
                          href={`/clubs/${club.id}`}
                          className="text-text-muted hover:text-accent transition-colors"
                        >
                          <ChevronRight size={18} />
                        </Link>
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
