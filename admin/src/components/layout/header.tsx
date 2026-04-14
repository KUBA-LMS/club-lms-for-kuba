"use client";

import { Search, Bell } from "lucide-react";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-8 bg-bg">
      {/* Search */}
      <div className="relative w-[360px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        <input
          type="text"
          placeholder="검색어를 입력하세요"
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-card-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border transition-colors"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <button className="relative h-10 w-10 rounded-xl bg-card border border-card-border flex items-center justify-center hover:bg-sidebar-hover transition-colors">
          <Bell size={18} className="text-text-secondary" />
        </button>
        <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center">
          <span className="text-white text-sm font-semibold">S</span>
        </div>
      </div>
    </header>
  );
}
