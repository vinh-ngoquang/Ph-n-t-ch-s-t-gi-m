import React, { useState } from 'react';
import { Menu, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useDataset } from '../../context/DatasetContext';

interface TopNavBarProps {
  title: string;
  onOpenMobileSidebar: () => void;
  onOpenGoogleSheetModal?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  title,
  onOpenMobileSidebar,
  onOpenGoogleSheetModal,
}) => {
  const { googleSheetConfig, isSyncingSheet, syncFromGoogleSheet } = useDataset();
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleRefresh = async () => {
    if (!googleSheetConfig?.url) {
      if (onOpenGoogleSheetModal) onOpenGoogleSheetModal();
      return;
    }
    try {
      const res = await syncFromGoogleSheet(googleSheetConfig.url, googleSheetConfig.syncMode || 'replace');
      const latestMo = res.summary.months[res.summary.months.length - 1] || '';
      setToastMsg({
        text: `Đã làm mới dữ liệu (${res.records.length} dòng${latestMo ? ` • Tháng: ${latestMo}` : ''})`,
        type: 'success',
      });
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: any) {
      setToastMsg({
        text: err?.message || 'Không thể đồng bộ từ Google Sheets',
        type: 'error',
      });
      setTimeout(() => setToastMsg(null), 4500);
    }
  };

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

      {/* Right: Refresh button, Sync toast, & Clean badge */}
      <div className="flex items-center gap-2.5 shrink-0">
        {toastMsg && (
          <div
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-1 ${
              toastMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* 1-Click Refresh Data Button */}
        <button
          onClick={handleRefresh}
          disabled={isSyncingSheet}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs ${
            isSyncingSheet
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 opacity-80 cursor-wait'
              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white border border-emerald-700 shadow-2xs hover:shadow-xs'
          }`}
          title="Bấm để tải lại dữ liệu từ Google Sheets"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
          <span>{isSyncingSheet ? 'Đang cập nhật...' : 'Làm mới dữ liệu'}</span>
        </button>

        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200">
          Internal Analytics
        </span>
      </div>
    </header>
  );
};
