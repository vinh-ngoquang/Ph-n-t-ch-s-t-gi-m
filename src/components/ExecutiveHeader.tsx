import React, { useMemo } from 'react';
import { MonthlyDataPoint, calculateMedian, isSpecialPublication } from '../utils/timeSeriesAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../utils/formatters';
import {
  Layers,
  Compass,
  Smartphone,
  Layout,
  Edit3,
  FolderTree,
  FileDown,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';

interface Props {
  monthlyData: MonthlyDataPoint[];
  currentScope: string;
  onScopeChange: (scope: string) => void;
  folderOptions: { id: string; name: string }[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenReport: () => void;
  onOpenExcelImport: () => void;
  onOpenGoogleSheetSync: () => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export const ExecutiveHeader: React.FC<Props> = ({
  monthlyData,
  currentScope,
  onScopeChange,
  folderOptions,
  activeTab,
  onTabChange,
  onOpenReport,
  onOpenExcelImport,
  onOpenGoogleSheetSync,
  selectedMonth,
  onMonthChange,
}) => {
  const {
    isCustomData,
    customMeta,
    googleSheetConfig,
    isSyncingSheet,
  } = useDataset();
  const months2026 = monthlyData.filter((d) => d.year === 2026);

  // Available months list for selection (in reverse chronological order)
  const availableMonths = useMemo(() => {
    return [...months2026].reverse().map((d) => ({
      value: d.month,
      label: `Tháng ${d.month}`,
    }));
  }, [months2026]);

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

    // Sort VnExpress folders alphabetically by Vietnamese locale
    vne.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    // Sort special folders: Ngôi sao first, then English
    special.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    return { vnExpressFolders: vne, specialFolders: special };
  }, [folderOptions]);

  const targetIdx = months2026.findIndex((d) => d.month === selectedMonth);
  const safeTargetIdx = targetIdx >= 0 ? targetIdx : months2026.length - 1;
  const currentMonthPoint = months2026[safeTargetIdx] || months2026[months2026.length - 1];

  const currentMonthLabel = currentMonthPoint?.month || '8/2026';

  // 1. Pageviews
  const pvList = months2026.map((d) => d.record.pageviews || 0);
  const curPV = currentMonthPoint?.record.pageviews || 0;
  const medPV = calculateMedian(pvList);
  const deltaMedPV = curPV - medPV;
  const pctMedPV = medPV > 0 ? ((curPV - medPV) / medPV) * 100 : 0;

  // 2. Sessions (Cột Z - Session)
  const sessionList = months2026.map((d) => d.record.sessions || 0);
  const curSession = currentMonthPoint?.record.sessions || 0;
  const medSession = calculateMedian(sessionList);
  const deltaMedSession = curSession - medSession;
  const pctMedSession = medSession > 0 ? ((curSession - medSession) / medSession) * 100 : 0;
  const curPvPerSession = curSession > 0 ? curPV / curSession : 0;

  // 3. Articles
  const artList = months2026.map((d) => d.record.articles || 0);
  const curArt = currentMonthPoint?.record.articles || 0;
  const medArt = calculateMedian(artList);
  const deltaMedArt = curArt - medArt;
  const pctMedArt = medArt > 0 ? ((curArt - medArt) / medArt) * 100 : 0;

  // 4. Build Top Rate
  const buildTopRateList = months2026.map((d) =>
    (d.record.articles || 0) > 0 ? ((d.record.aBuildTop || 0) / (d.record.articles || 1)) * 100 : 0
  );
  const curBuildRate = curArt > 0 ? ((currentMonthPoint?.record.aBuildTop || 0) / curArt) * 100 : 0;
  const medBuildRate = calculateMedian(buildTopRateList);
  const deltaMedBuildRate = curBuildRate - medBuildRate;

  const tabs = [
    { id: 'all', name: 'Toàn Bộ Góc Nhìn', icon: Layers },
    { id: 'sources', name: 'Nguồn Truy Cập (7 Nguồn)', icon: Compass },
    { id: 'platforms', name: 'Nền Tảng Thiết Bị', icon: Smartphone },
    { id: 'folders', name: '24 Chuyên Mục', icon: FolderTree },
    { id: 'pages', name: 'Lớp Trang & Thị Trường', icon: Layout },
    { id: 'articles', name: 'Sản Lượng Bài Viết', icon: Edit3 },
  ];

  return (
    <div className="space-y-4">
      {/* Top Main Navigation Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap sm:flex-nowrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
                Phân Tích Hiệu Quả Nội Dung VnExpress
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                Tháng {currentMonthLabel}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                Chuẩn Trung vị 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>
                Đối chiếu số liệu Tháng {currentMonthLabel} với <strong>Mốc Trung vị chu kỳ năm 2026</strong>.
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

          {/* Month filter, Scope selection & Action buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* 1. Month Filter Box */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <label htmlFor="select-month-filter" className="text-[11px] text-slate-500 font-semibold whitespace-nowrap">
                Kỳ phân tích:
              </label>
              <select
                id="select-month-filter"
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="bg-transparent text-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
              >
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label} {m.value === '8/2026' ? '(Mới nhất)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Scope selection */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <label htmlFor="select-folder-scope" className="text-[11px] text-slate-500 font-semibold whitespace-nowrap">
                Ban:
              </label>
              <select
                id="select-folder-scope"
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

            {/* Google Sheets Sync Button */}
            <button
              onClick={onOpenGoogleSheetSync}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition shadow-xs cursor-pointer whitespace-nowrap ${
                googleSheetConfig?.url
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
              title={googleSheetConfig?.url ? `Đang kết nối: ${googleSheetConfig.url}` : 'Đồng bộ tự động từ Google Sheets'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
              <span>{googleSheetConfig?.url ? 'Google Sheets' : 'Đồng Bộ Sheets'}</span>
              {googleSheetConfig?.url && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
              )}
            </button>

            {/* Import Excel / CSV Button */}
            <button
              onClick={onOpenExcelImport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium text-xs transition shadow-xs cursor-pointer whitespace-nowrap"
              title="Tải lên tệp Excel (.xlsx, .xls) hoặc CSV thủ công"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Import Excel</span>
            </button>

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
                Tổng Pageview
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200/70 whitespace-nowrap">
                Tổng tháng
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {formatNumber(curPV)}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-sans">PV</span>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">Mốc Trung vị 2026:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatNumber(medPV)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-[11px] text-slate-400 font-medium">Lệch vs Trung vị:</span>
                <span className={`font-bold font-mono ${deltaMedPV >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatDelta(deltaMedPV)} ({formatPercent(pctMedPV)})
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
                {curPvPerSession > 0 ? `${curPvPerSession.toFixed(2)} PV/phiên` : 'Cột Z'}
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {formatNumber(curSession)}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-sans">Phiên</span>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">Mốc Trung vị 2026:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatNumber(medSession)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-[11px] text-slate-400 font-medium">Lệch vs Trung vị:</span>
                <span className={`font-bold font-mono ${deltaMedSession >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatDelta(deltaMedSession)} ({formatPercent(pctMedSession)})
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Articles */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-[13px] font-bold text-slate-800 tracking-tight whitespace-nowrap">
                Sản lượng Bài
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200/70 whitespace-nowrap">
                Tổng tháng
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {formatNumber(curArt)}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-sans">Bài</span>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">Mốc Trung vị 2026:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatNumber(medArt)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-[11px] text-slate-400 font-medium">Lệch vs Trung vị:</span>
                <span className={`font-bold font-mono ${deltaMedArt >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatDelta(deltaMedArt)} ({formatPercent(pctMedArt)})
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Build Top Rate */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-[13px] font-bold text-slate-800 tracking-tight whitespace-nowrap">
                Tỷ lệ Lên Trang Bìa
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200/70 whitespace-nowrap">
                Tổng tháng
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {`${curBuildRate.toFixed(1)}%`}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-sans">Build Top</span>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">Mốc Trung vị 2026:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {`${medBuildRate.toFixed(1)}%`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-[11px] text-slate-400 font-medium">Lệch vs Trung vị:</span>
                <span className={`font-bold font-mono ${deltaMedBuildRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {`${deltaMedBuildRate >= 0 ? '+' : ''}${deltaMedBuildRate.toFixed(1)}%`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition cursor-pointer text-xs ${
                isActive
                  ? 'bg-white text-blue-600 font-bold shadow-xs border border-blue-200'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
