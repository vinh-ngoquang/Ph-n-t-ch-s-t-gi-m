import React, { useMemo } from 'react';
import { YoYSummaryData } from '../utils/yoyAnalytics';
import { isSpecialPublication } from '../utils/timeSeriesAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../utils/formatters';
import {
  Layers,
  Compass,
  Smartphone,
  Layout,
  Edit3,
  FolderTree,
  FileDown,
  ExternalLink,
  Pencil,
  TrendingDown,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';

interface Props {
  yoyData: YoYSummaryData;
  currentScope: string;
  onScopeChange: (scope: string) => void;
  folderOptions: { id: string; name: string }[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenReport: () => void;
  onOpenGoogleSheetSync: () => void;
}

export const ExecutiveHeaderYoY: React.FC<Props> = ({
  yoyData,
  currentScope,
  onScopeChange,
  folderOptions,
  activeTab,
  onTabChange,
  onOpenReport,
  onOpenGoogleSheetSync,
}) => {
  const { googleSheetConfig } = useDataset();

  // Split folders into VnExpress departments and Specialized standalone publications (Ngôi Sao, English)
  const { vnExpressFolders, specialFolders } = useMemo(() => {
    const vne: { id: string; name: string }[] = [];
    const special: { id: string; name: string }[] = [];

    folderOptions.forEach((f) => {
      if (isSpecialPublication(f.id, f.name)) {
        special.push(f);
      } else {
        vne.push(f);
      }
    });

    vne.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    special.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    return { vnExpressFolders: vne, specialFolders: special };
  }, [folderOptions]);

  const tabs = [
    { id: 'all', name: 'Toàn Bộ Góc Nhìn', icon: Layers },
    { id: 'sources', name: 'Nguồn Truy Cập (7 Nguồn)', icon: Compass },
    { id: 'platforms', name: 'Nền Tảng Thiết Bị', icon: Smartphone },
    { id: 'folders', name: '24 Chuyên Mục', icon: FolderTree },
    { id: 'pages', name: 'Lớp Trang & Thị Trường', icon: Layout },
    { id: 'articles', name: 'Sản Lượng Bài Viết', icon: Edit3 },
  ];

  const {
    monthsRangeLabel,
    pv2026,
    pv2025,
    deltaPV,
    pctDeltaPV,
    sessions2026,
    sessions2025,
    deltaSessions,
    pctDeltaSessions,
    pvPerSession2026,
    articles2026,
    articles2025,
    deltaArticles,
    pctDeltaArticles,
    buildTop2026,
    buildTop2025,
    deltaBuildTop,
    pctDeltaBuildTop,
    buildRate2026,
  } = yoyData;

  return (
    <div className="space-y-4">
      {/* Top Main Navigation Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap sm:flex-nowrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
                Phân Tích Hiệu Quả VnExpress: Lũy Kế 2026 vs Cùng Kỳ 2025
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap flex items-center gap-1">
                <BarChart2 className="w-3 h-3" />
                <span>Tổng 2026 ({monthsRangeLabel})</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                Cùng kỳ 2025 ({monthsRangeLabel})
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                Mặc định Lũy Kế
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>
                Đối chiếu <strong>Tổng lũy kế toàn bộ {yoyData.monthsCount} tháng năm 2026 ({monthsRangeLabel})</strong> so với <strong>cùng kỳ {yoyData.monthsCount} tháng năm 2025</strong>.
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 inline-flex items-center gap-1.5 flex-wrap">
                <span>Nguồn:</span>
                {googleSheetConfig?.url ? (
                  <a
                    href={googleSheetConfig.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 cursor-pointer transition"
                    title={googleSheetConfig.url}
                  >
                    <span>Google Sheets</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <button
                    onClick={onOpenGoogleSheetSync}
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 cursor-pointer transition"
                    title="Bấm để cấu hình link Google Sheets"
                  >
                    <span>Google Sheets</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={onOpenGoogleSheetSync}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 cursor-pointer transition"
                  title="Sửa đường link kết nối Google Sheets"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  <span>Sửa kết nối</span>
                </button>
              </span>
            </p>
          </div>

          {/* Scope selection & Action buttons (NO "Kỳ phân tích" box as requested) */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Scope selection */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <label htmlFor="select-folder-scope-yoy" className="text-[11px] text-slate-500 font-semibold whitespace-nowrap">
                Ban:
              </label>
              <select
                id="select-folder-scope-yoy"
                value={currentScope}
                onChange={(e) => onScopeChange(e.target.value)}
                className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer max-w-[200px] sm:max-w-[250px] truncate"
              >
                <option value="ALL_FOLDERS_AGG">Toàn bộ hệ thống (Tổng tất cả)</option>
                <option value="ALL_VNE_AGG">Toàn bộ VnExpress (Tất cả ban VnE)</option>

                {/* 1. Tách riêng chuyên trang Ngôi Sao */}
                <optgroup label="─── TÁCH RIÊNG: NGÔI SAO ───">
                  {specialFolders
                    .filter((f) => f.id === '1002835' || f.name.toLowerCase().includes('ngôi sao'))
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.id})
                      </option>
                    ))}
                </optgroup>

                {/* 2. Tách riêng chuyên trang English */}
                <optgroup label="─── TÁCH RIÊNG: ENGLISH ───">
                  {specialFolders
                    .filter((f) => f.id === '1003888' || f.name.toLowerCase().includes('english'))
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.id})
                      </option>
                    ))}
                </optgroup>

                {/* 3. Tất cả các ban còn lại thuộc VnExpress */}
                <optgroup label="─── CÁC BAN THUỘC VNEXPRESS ───">
                  {vnExpressFolders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.id === '1000000' ? 'Trang chủ VnExpress' : f.name} ({f.id})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Export report button */}
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition shadow-xs cursor-pointer whitespace-nowrap"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Xuất Báo Cáo</span>
            </button>
          </div>
        </div>

        {/* 4 Clean Key Metrics - Styled matching reference scorecard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4 pt-4 border-t border-slate-100">
          {/* Card 1: Pageviews */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-[13px] font-bold text-slate-800 tracking-tight whitespace-nowrap">
                Tổng Pageview (PV)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 whitespace-nowrap">
                Lũy kế {monthsRangeLabel}
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {formatNumber(pv2026)}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-sans">PV</span>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">Cùng kỳ 2025:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatNumber(pv2025)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-[11px] text-slate-400 font-medium">So với 2025:</span>
                <span className={`font-bold font-mono flex items-center gap-0.5 ${deltaPV >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {deltaPV >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{formatDelta(deltaPV)} ({formatPercent(pctDeltaPV)})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Session (Cột Z) */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-[13px] font-bold text-slate-800 tracking-tight whitespace-nowrap">
                Tổng Session
              </span>
              <span
                className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200/70 whitespace-nowrap"
                title="Lượt xem trung bình trên mỗi phiên (PV / Session)"
              >
                {pvPerSession2026 > 0 ? `${pvPerSession2026.toFixed(2)} PV/phiên` : 'Cột Z'}
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {formatNumber(sessions2026)}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-sans">Phiên</span>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">Cùng kỳ 2025:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatNumber(sessions2025)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-[11px] text-slate-400 font-medium">So với 2025:</span>
                <span className={`font-bold font-mono flex items-center gap-0.5 ${deltaSessions >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {deltaSessions >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{formatDelta(deltaSessions)} ({formatPercent(pctDeltaSessions)})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Articles */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-[13px] font-bold text-slate-800 tracking-tight whitespace-nowrap">
                Sản Lượng Bài
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200/70 whitespace-nowrap">
                Tổng {monthsRangeLabel}
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {formatNumber(articles2026)}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-sans">Bài</span>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">Cùng kỳ 2025:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatNumber(articles2025)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-[11px] text-slate-400 font-medium">So với 2025:</span>
                <span className={`font-bold font-mono flex items-center gap-0.5 ${deltaArticles >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {deltaArticles >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{formatDelta(deltaArticles)} ({formatPercent(pctDeltaArticles)})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Build Top Articles */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-[13px] font-bold text-slate-800 tracking-tight whitespace-nowrap">
                Số Bài Build Top
              </span>
              <span
                className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/70 whitespace-nowrap"
                title="Tỷ lệ bài Build Top trên tổng sản lượng bài"
              >
                {buildRate2026 > 0 ? `Tỷ lệ ${buildRate2026.toFixed(1)}%` : 'Build Top'}
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {formatNumber(buildTop2026)}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-sans">Bài</span>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">Cùng kỳ 2025:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatNumber(buildTop2025)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-[11px] text-slate-400 font-medium">So với 2025:</span>
                <span className={`font-bold font-mono flex items-center gap-0.5 ${deltaBuildTop >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {deltaBuildTop >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{formatDelta(deltaBuildTop)} ({formatPercent(pctDeltaBuildTop)})</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
