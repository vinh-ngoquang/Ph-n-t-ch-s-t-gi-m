import React, { useState, useMemo } from 'react';
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
  Table2,
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
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  isYoYMode?: boolean;
  hideImportAndExport?: boolean;
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
  selectedMonth = '8/2026',
  onMonthChange,
  isYoYMode = false,
  hideImportAndExport = false,
}) => {
  const [showMonthlyTable, setShowMonthlyTable] = useState(false);
  const {
    googleSheetConfig,
    isSyncingSheet,
  } = useDataset();
  const months2026 = monthlyData.filter((d) => d.year === 2026);
  const months2025 = monthlyData.filter((d) => d.year === 2025);

  // Match months available in 2026 to 2025
  const availableMonthNums = new Set(months2026.map((d) => d.monthNum));
  const matched2025 = months2025.filter((d) => availableMonthNums.has(d.monthNum));

  // Available months list for selection (in reverse chronological order)
  const availableMonths = useMemo(() => {
    return [...monthlyData].reverse().map((d) => ({
      value: d.month,
      label: `Tháng ${d.month}`,
    }));
  }, [monthlyData]);

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

  // 4. Số bài Build Top
  const buildTopList = months2026.map((d) => d.record.aBuildTop || 0);
  const curBuildTop = currentMonthPoint?.record.aBuildTop || 0;
  const medBuildTop = calculateMedian(buildTopList);
  const deltaMedBuildTop = curBuildTop - medBuildTop;
  const pctMedBuildTop = medBuildTop > 0 ? ((curBuildTop - medBuildTop) / medBuildTop) * 100 : 0;
  const curBuildRate = curArt > 0 ? (curBuildTop / curArt) * 100 : 0;

  // --- YoY Accumulative Calculations ---
  let pv2026Sum = 0;
  let pv2025Sum = 0;
  months2026.forEach((d) => { pv2026Sum += d.record.pageviews || 0; });
  matched2025.forEach((d) => { pv2025Sum += d.record.pageviews || 0; });
  const deltaYoYPV = pv2026Sum - pv2025Sum;
  const pctYoYPV = pv2025Sum > 0 ? (deltaYoYPV / pv2025Sum) * 100 : 0;

  let session2026Sum = 0;
  let session2025Sum = 0;
  months2026.forEach((d) => { session2026Sum += d.record.sessions || 0; });
  matched2025.forEach((d) => { session2025Sum += d.record.sessions || 0; });
  const deltaYoYSession = session2026Sum - session2025Sum;
  const pctYoYSession = session2025Sum > 0 ? (deltaYoYSession / session2025Sum) * 100 : 0;
  const yoyPvPerSession = session2026Sum > 0 ? pv2026Sum / session2026Sum : 0;

  let art2026Sum = 0;
  let art2025Sum = 0;
  months2026.forEach((d) => { art2026Sum += d.record.articles || 0; });
  matched2025.forEach((d) => { art2025Sum += d.record.articles || 0; });
  const deltaYoYArt = art2026Sum - art2025Sum;
  const pctYoYArt = art2025Sum > 0 ? (deltaYoYArt / art2025Sum) * 100 : 0;

  let buildTop2026Sum = 0;
  let buildTop2025Sum = 0;
  months2026.forEach((d) => { buildTop2026Sum += d.record.aBuildTop || 0; });
  matched2025.forEach((d) => { buildTop2025Sum += d.record.aBuildTop || 0; });
  const deltaYoYBuildTop = buildTop2026Sum - buildTop2025Sum;
  const pctYoYBuildTop = buildTop2025Sum > 0 ? (deltaYoYBuildTop / buildTop2025Sum) * 100 : 0;
  const yoyBuildRate = art2026Sum > 0 ? (buildTop2026Sum / art2026Sum) * 100 : 0;

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
              {isYoYMode ? (
                <>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                    Tổng 2026 vs Cùng kỳ 2025
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                    Chuẩn Cùng Kỳ 2025
                  </span>
                </>
              ) : (
                <>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                    Tháng {currentMonthLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                    Chuẩn Trung vị 2026
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>
                {isYoYMode ? (
                  <>
                    Đối chiếu số liệu <strong>Tổng lũy kế 2026</strong> với <strong>Cùng kỳ năm 2025</strong>.
                  </>
                ) : (
                  <>
                    Đối chiếu số liệu Tháng {currentMonthLabel} với <strong>Mốc Trung vị chu kỳ năm 2026</strong>.
                  </>
                )}
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
            {/* 1. Month Filter Box - Hidden in YoY mode */}
            {!isYoYMode && onMonthChange && (
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
            )}

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

            {/* Nút bật tắt bảng chi tiết các tháng 2026 vs Trung vị */}
            {!isYoYMode && (
              <button
                onClick={() => setShowMonthlyTable(!showMonthlyTable)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium text-xs transition shadow-xs cursor-pointer whitespace-nowrap ${
                  showMonthlyTable
                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
                title="Bật/tắt bảng so sánh chi tiết các tháng trong năm 2026 với mốc trung vị"
              >
                <Table2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{showMonthlyTable ? 'Ẩn Bảng Các Tháng 2026' : 'Bảng Các Tháng 2026'}</span>
              </button>
            )}

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
            {!hideImportAndExport && (
              <button
                onClick={onOpenExcelImport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium text-xs transition shadow-xs cursor-pointer whitespace-nowrap"
                title="Tải lên tệp Excel (.xlsx, .xls) hoặc CSV thủ công"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Import Excel</span>
              </button>
            )}

            {/* Export report button */}
            {!hideImportAndExport && (
              <button
                onClick={onOpenReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition shadow-xs cursor-pointer whitespace-nowrap"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Xuất Báo Cáo</span>
              </button>
            )}
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
                {isYoYMode ? 'Tổng lũy kế' : 'Tổng tháng'}
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {formatNumber(isYoYMode ? pv2026Sum : curPV)}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-sans">PV</span>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">
                  {isYoYMode ? 'Cùng kỳ 2025:' : 'Mốc Trung vị 2026:'}
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatNumber(isYoYMode ? pv2025Sum : medPV)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-[11px] text-slate-400 font-medium">
                  {isYoYMode ? 'Lệch vs Cùng kỳ:' : 'Lệch vs Trung vị:'}
                </span>
                <span className={`font-bold font-mono ${(isYoYMode ? deltaYoYPV : deltaMedPV) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatDelta(isYoYMode ? deltaYoYPV : deltaMedPV)} ({formatPercent(isYoYMode ? pctYoYPV : pctMedPV)})
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
                {(isYoYMode ? yoyPvPerSession : curPvPerSession) > 0
                  ? `${(isYoYMode ? yoyPvPerSession : curPvPerSession).toFixed(2)} PV/phiên`
                  : 'Cột Z'}
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {formatNumber(isYoYMode ? session2026Sum : curSession)}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-sans">Phiên</span>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">
                  {isYoYMode ? 'Cùng kỳ 2025:' : 'Mốc Trung vị 2026:'}
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatNumber(isYoYMode ? session2025Sum : medSession)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-[11px] text-slate-400 font-medium">
                  {isYoYMode ? 'Lệch vs Cùng kỳ:' : 'Lệch vs Trung vị:'}
                </span>
                <span className={`font-bold font-mono ${(isYoYMode ? deltaYoYSession : deltaMedSession) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatDelta(isYoYMode ? deltaYoYSession : deltaMedSession)} ({formatPercent(isYoYMode ? pctYoYSession : pctMedSession)})
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
                {isYoYMode ? 'Tổng lũy kế' : 'Tổng tháng'}
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {formatNumber(isYoYMode ? art2026Sum : curArt)}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-sans">Bài</span>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">
                  {isYoYMode ? 'Cùng kỳ 2025:' : 'Mốc Trung vị 2026:'}
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatNumber(isYoYMode ? art2025Sum : medArt)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-[11px] text-slate-400 font-medium">
                  {isYoYMode ? 'Lệch vs Cùng kỳ:' : 'Lệch vs Trung vị:'}
                </span>
                <span className={`font-bold font-mono ${(isYoYMode ? deltaYoYArt : deltaMedArt) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatDelta(isYoYMode ? deltaYoYArt : deltaMedArt)} ({formatPercent(isYoYMode ? pctYoYArt : pctMedArt)})
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Build Top Articles */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-[13px] font-bold text-slate-800 tracking-tight whitespace-nowrap">
                Số bài Build Top
              </span>
              <span
                className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium text-purple-700 bg-purple-50 border border-purple-200/70 whitespace-nowrap"
                title="Tỷ lệ bài viết được build top lên trang bìa trên tổng sản lượng bài"
              >
                {(isYoYMode ? yoyBuildRate : curBuildRate) > 0
                  ? `${(isYoYMode ? yoyBuildRate : curBuildRate).toFixed(1)}% sản lượng`
                  : isYoYMode ? 'Tổng lũy kế' : 'Tổng tháng'}
              </span>
            </div>

            <div className="my-2.5 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {formatNumber(isYoYMode ? buildTop2026Sum : curBuildTop)}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-sans">Bài</span>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-medium">
                  {isYoYMode ? 'Cùng kỳ 2025:' : 'Mốc Trung vị 2026:'}
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatNumber(isYoYMode ? buildTop2025Sum : medBuildTop)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-[11px] text-slate-400 font-medium">
                  {isYoYMode ? 'Lệch vs Cùng kỳ:' : 'Lệch vs Trung vị:'}
                </span>
                <span className={`font-bold font-mono ${(isYoYMode ? deltaYoYBuildTop : deltaMedBuildTop) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatDelta(isYoYMode ? deltaYoYBuildTop : deltaMedBuildTop)} ({formatPercent(isYoYMode ? pctYoYBuildTop : pctMedBuildTop)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bảng so sánh số liệu các tháng năm 2026 vs. Mốc Trung Vị Chu Kỳ */}
        {!isYoYMode && showMonthlyTable && (
          <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Bảng So Sánh Các Tháng Năm 2026 vs. Mốc Trung Vị Chu Kỳ
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Chuẩn Trung Vị 2026
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Bấm vào từng tháng để chuyển nhanh kỳ phân tích. Dữ liệu từng tháng được đối chiếu trực tiếp với mốc Trung vị chu kỳ năm 2026.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                Kỳ đang xem: <strong className="text-blue-700 font-bold">Tháng {currentMonthLabel}</strong>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3.5 font-sans">Tháng trong năm 2026</th>
                    <th className="py-2.5 px-3.5 text-right font-sans">Tổng Pageview</th>
                    <th className="py-2.5 px-3.5 text-right font-sans">Tổng Session</th>
                    <th className="py-2.5 px-3.5 text-right font-sans">Sản Lượng Bài</th>
                    <th className="py-2.5 px-3.5 text-right font-sans">Số Bài Build Top</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {months2026.map((m) => {
                    const isSelected = m.month === selectedMonth;
                    const pv = m.record.pageviews || 0;
                    const dPv = pv - medPV;
                    const pPv = medPV > 0 ? (dPv / medPV) * 100 : 0;

                    const ss = m.record.sessions || 0;
                    const dSs = ss - medSession;
                    const pSs = medSession > 0 ? (dSs / medSession) * 100 : 0;

                    const art = m.record.articles || 0;
                    const dArt = art - medArt;
                    const pArt = medArt > 0 ? (dArt / medArt) * 100 : 0;

                    const bt = m.record.aBuildTop || 0;
                    const dBt = bt - medBuildTop;
                    const pBt = medBuildTop > 0 ? (dBt / medBuildTop) * 100 : 0;
                    const btRate = art > 0 ? (bt / art) * 100 : 0;

                    return (
                      <tr
                        key={m.month}
                        onClick={() => onMonthChange && onMonthChange(m.month)}
                        className={`transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 font-medium hover:bg-blue-50'
                            : 'hover:bg-slate-50/80'
                        }`}
                        title="Bấm để chọn tháng này làm kỳ phân tích"
                      >
                        <td className="py-2.5 px-3.5 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">Tháng {m.month}</span>
                            {isSelected && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white shadow-2xs">
                                Đang chọn
                              </span>
                            )}
                            {m.month === '8/2026' && !isSelected && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                Mới nhất
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Tổng Pageview */}
                        <td className="py-2.5 px-3.5 text-right font-mono">
                          <div className="font-bold text-slate-900">{formatNumber(pv)}</div>
                          <div className={`text-[11px] font-semibold ${dPv >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatDelta(dPv)} ({formatPercent(pPv)})
                          </div>
                        </td>

                        {/* Tổng Session */}
                        <td className="py-2.5 px-3.5 text-right font-mono">
                          <div className="font-bold text-slate-900">{formatNumber(ss)}</div>
                          <div className={`text-[11px] font-semibold ${dSs >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatDelta(dSs)} ({formatPercent(pSs)})
                          </div>
                        </td>

                        {/* Sản Lượng Bài */}
                        <td className="py-2.5 px-3.5 text-right font-mono">
                          <div className="font-bold text-slate-900">{formatNumber(art)}</div>
                          <div className={`text-[11px] font-semibold ${dArt >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatDelta(dArt)} ({formatPercent(pArt)})
                          </div>
                        </td>

                        {/* Số Bài Build Top */}
                        <td className="py-2.5 px-3.5 text-right font-mono">
                          <div className="font-bold text-slate-900 flex items-center justify-end gap-1">
                            <span>{formatNumber(bt)}</span>
                            {art > 0 && (
                              <span className="text-[10px] text-slate-400 font-sans font-normal">
                                ({btRate.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                          <div className={`text-[11px] font-semibold ${dBt >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatDelta(dBt)} ({formatPercent(pBt)})
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Benchmark Reference Row */}
                <tfoot className="bg-slate-100/90 font-semibold border-t-2 border-slate-300 text-slate-800">
                  <tr>
                    <td className="py-2.5 px-3.5 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span className="font-bold text-slate-900">Mốc Trung Vị Chu Kỳ 2026</span>
                        <span className="text-[10px] text-slate-500 font-normal">(Median Benchmark)</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                      <div>{formatNumber(medPV)}</div>
                      <div className="text-[10px] text-slate-500 font-normal">Chuẩn so sánh</div>
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                      <div>{formatNumber(medSession)}</div>
                      <div className="text-[10px] text-slate-500 font-normal">Chuẩn so sánh</div>
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                      <div>{formatNumber(medArt)}</div>
                      <div className="text-[10px] text-slate-500 font-normal">Chuẩn so sánh</div>
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                      <div>{formatNumber(medBuildTop)}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {medArt > 0 ? `${((medBuildTop / medArt) * 100).toFixed(1)}%` : 'Chuẩn so sánh'}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
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
