import React from 'react';
import {
  Menu,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
} from 'lucide-react';

interface TopNavBarProps {
  title: string;
  selectedMonth?: string;
  onMonthChange?: (m: string) => void;
  currentScope?: string;
  onScopeChange?: (scope: string) => void;
  folderOptions?: { id: string; name: string }[];
  isYoYMode?: boolean;
  onOpenMobileSidebar: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  title,
  onOpenMobileSidebar,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shadow-2xs">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
          {title}
        </h1>
      </div>

      {/* Right: Clean badge */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200">
          Internal Analytics
        </span>
      </div>
    </header>
  );
};
