import React from 'react';
import { Calendar, Filter, CheckCircle2, AlertTriangle, FileText, Sparkles, Scale, RefreshCw } from 'lucide-react';

interface HeaderProps {
  periodT1: string;
  periodT: string;
  folderFilter: string;
  normalizeByDays: boolean;
  onPeriodT1Change: (val: string) => void;
  onPeriodTChange: (val: string) => void;
  onFolderFilterChange: (val: string) => void;
  onNormalizeToggle: () => void;
  onQuickPreset: (t1: string, t: string) => void;
  onOpenReport: () => void;
  availableMonths: string[];
  foldersList: { id: string; name: string }[];
  totalIssuesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  periodT1,
  periodT,
  folderFilter,
  normalizeByDays,
  onPeriodT1Change,
  onPeriodTChange,
  onFolderFilterChange,
  onNormalizeToggle,
  onQuickPreset,
  onOpenReport,
  availableMonths,
  foldersList,
  totalIssuesCount,
}) => {
  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {/* Top bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                8-Step Data Methodology
              </span>
              <span className="text-xs text-slate-400">VnExpress News Content Analytics</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Phân Tích Hiệu Quả Nội Dung Tin Tức
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Hệ thống chẩn đoán biến động Pageviews & Bài viết theo chuẩn LMDI, Kitagawa, Đóng góp 5 chiều & Ma trận giao thoa.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="export-report-btn"
              onClick={onOpenReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium transition shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Xuất Báo Cáo 8 Bước</span>
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs sm:text-sm">
          {/* Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Base Period T-1 */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 font-medium whitespace-nowrap">Kỳ gốc [T-1]:</span>
              <select
                id="period-t1-select"
                value={periodT1}
                onChange={(e) => onPeriodT1Change(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                <optgroup label="Tổng hợp & Trung bình" className="bg-slate-800 text-slate-300">
                  <option value="AVG_2026" className="bg-slate-800 text-white font-medium">
                    Trung bình năm 2026 (T1-T8/2026)
                  </option>
                  <option value="AVG_2026_PREV" className="bg-slate-800 text-white font-medium">
                    Trung bình 7 tháng đầu 2026 (T1-T7/2026)
                  </option>
                  <option value="AVG_2025" className="bg-slate-800 text-white font-medium">
                    Trung bình năm 2025 (Cả năm)
                  </option>
                </optgroup>
                <optgroup label="Từng tháng cụ thể" className="bg-slate-800 text-slate-300">
                  {availableMonths.map((m) => (
                    <option key={`t1-${m}`} value={m} className="bg-slate-800 text-white">
                      Tháng {m}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Target Period T */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 font-medium whitespace-nowrap">Kỳ phân tích [T]:</span>
              <select
                id="period-t-select"
                value={periodT}
                onChange={(e) => onPeriodTChange(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={`t-${m}`} value={m} className="bg-slate-800 text-white">
                    Tháng {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Folder / Category filter */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="folder-filter-select"
                value={folderFilter}
                onChange={(e) => onFolderFilterChange(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer max-w-[180px] truncate"
              >
                <option value="ALL_FOLDERS_AGG" className="bg-slate-800 text-white">
                  Toàn bộ VnExpress (Tổng tất cả các ban)
                </option>
                {foldersList.map((f) => (
                  <option key={f.id} value={f.name} className="bg-slate-800 text-white">
                    {f.name} ({f.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Presets & Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 text-xs hidden xl:inline">So sánh nhanh:</span>
              <button
                onClick={() => onQuickPreset('AVG_2026', '8/2026')}
                className={`px-2.5 py-1 text-xs rounded border transition font-medium ${
                  periodT1 === 'AVG_2026' && periodT === '8/2026'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                8/2026 vs TB Năm 2026
              </button>
              <button
                onClick={() => onQuickPreset('AVG_2026_PREV', '8/2026')}
                className={`px-2.5 py-1 text-xs rounded border transition font-medium ${
                  periodT1 === 'AVG_2026_PREV' && periodT === '8/2026'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                8/2026 vs TB 7T Đầu
              </button>
              <button
                onClick={() => onQuickPreset('8/2025', '8/2026')}
                className={`px-2.5 py-1 text-xs rounded border transition ${
                  periodT1 === '8/2025' && periodT === '8/2026'
                    ? 'bg-emerald-600 text-white border-emerald-500 font-medium'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                YoY 8/2026 vs 8/2025
              </button>
            </div>

            {/* Normalization Toggle */}
            <button
              onClick={onNormalizeToggle}
              title="Chuẩn hóa theo số ngày thực tế của từng tháng về trung bình chuẩn 30 ngày"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs border transition ${
                normalizeByDays
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Chuẩn hóa số ngày {normalizeByDays ? '(Bật)' : '(Tắt)'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
