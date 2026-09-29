import React from 'react';
import {
  BarChart2,
  History,
  Globe,
  X,
} from 'lucide-react';

export type MainDashboardType = 'vne_detail' | 'vne_yoy' | 'market_overview';
export type ReportTabType = 'sources' | 'platforms' | 'readers' | 'folders' | 'pages' | 'articles' | 'all';

interface SidebarNavigationProps {
  mainDashboard: MainDashboardType;
  setMainDashboard: (d: MainDashboardType) => void;
  activeTab: ReportTabType;
  setActiveTab: (t: ReportTabType) => void;
  onOpenReport: () => void;
  onOpenExcelImport: () => void;
  onOpenGoogleSheetSync: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  mainDashboard,
  setMainDashboard,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const handleSelectDashboard = (dashboard: MainDashboardType) => {
    setMainDashboard(dashboard);
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-60 sm:w-64 bg-white border-r border-slate-200/90 flex flex-col z-50 transition-transform duration-200 ease-in-out select-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Maroon Logo with C */}
            <div className="w-8 h-8 rounded-lg bg-[#9c1f35] flex items-center justify-center text-white font-extrabold text-base shadow-xs shrink-0 tracking-tight">
              C
            </div>
            <div>
              <div className="text-[14px] font-extrabold text-slate-900 tracking-tight leading-tight">
                VnExpress
              </div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">
                Analytics
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 text-xs font-sans">
          {/* GROUP: DỮ LIỆU */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-2.5">
              DỮ LIỆU
            </div>
            <div className="space-y-1.5">
              {/* 1. Monthly Analytics (Single item, no sub-options) */}
              <button
                onClick={() => handleSelectDashboard('vne_detail')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition text-left ${
                  mainDashboard === 'vne_detail'
                    ? 'bg-rose-50/70 border border-rose-300 text-rose-950 font-bold shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart2
                    className={`w-4 h-4 shrink-0 ${
                      mainDashboard === 'vne_detail' ? 'text-[#9c1f35]' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-[13px] tracking-tight">Monthly Analytics</span>
                </div>
              </button>

              {/* 2. Historical (YoY) */}
              <button
                onClick={() => handleSelectDashboard('vne_yoy')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition text-left ${
                  mainDashboard === 'vne_yoy'
                    ? 'bg-rose-50/70 border border-rose-300 text-rose-950 font-bold shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <History
                    className={`w-4 h-4 shrink-0 ${
                      mainDashboard === 'vne_yoy' ? 'text-[#9c1f35]' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-[13px] tracking-tight">Historical (YoY)</span>
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  2026 vs 2025
                </span>
              </button>

              {/* 3. Thị Trường Báo Chí */}
              <button
                onClick={() => handleSelectDashboard('market_overview')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition text-left ${
                  mainDashboard === 'market_overview'
                    ? 'bg-rose-50/70 border border-rose-300 text-rose-950 font-bold shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Globe
                    className={`w-4 h-4 shrink-0 ${
                      mainDashboard === 'market_overview' ? 'text-[#9c1f35]' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-[13px] tracking-tight">Thị trường Báo chí</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
