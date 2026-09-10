import React, { useMemo } from 'react';
import { MonthlyDataPoint, calculateMedian } from '../utils/timeSeriesAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../utils/formatters';
import {
  BarChart3,
  Layers,
  Compass,
  Smartphone,
  Layout,
  Edit3,
  FolderTree,
  FileDown,
  FileSpreadsheet,
  RotateCcw,
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
  selectedMonth,
  onMonthChange,
}) => {
  const { isCustomData, customMeta, resetToDefault } = useDataset();
  const months2026 = monthlyData.filter((d) => d.year === 2026);

  // Available months list for selection (in reverse chronological order)
  const availableMonths = useMemo(() => {
    return [...months2026].reverse().map((d) => ({
      value: d.month,
      label: `Tháng ${d.month}`,
    }));
  }, [months2026]);

  const targetIdx = months2026.findIndex((d) => d.month === selectedMonth);
  const safeTargetIdx = targetIdx >= 0 ? targetIdx : months2026.length - 1;
  const currentMonthPoint = months2026[safeTargetIdx] || months2026[months2026.length - 1];
  const prevMonthPoint = safeTargetIdx > 0 ? months2026[safeTargetIdx - 1] : null;

  const currentMonthLabel = currentMonthPoint?.month || '8/2026';
  const prevMonthLabel = prevMonthPoint ? `Tháng ${prevMonthPoint.month}` : 'Kỳ trước';

  // 1. Pageviews
  const pvList = months2026.map((d) => d.record.pageviews || 0);
  const curPV = currentMonthPoint?.record.pageviews || 0;
  const prevPV = prevMonthPoint?.record.pageviews || 0;
  const medPV = calculateMedian(pvList);
  const deltaMoMPV = prevMonthPoint ? curPV - prevPV : 0;
  const pctMoMPV = prevMonthPoint && prevPV > 0 ? ((curPV - prevPV) / prevPV) * 100 : 0;
  const deltaMedPV = curPV - medPV;
  const pctMedPV = medPV > 0 ? ((curPV - medPV) / medPV) * 100 : 0;

  // 2. Articles
  const artList = months2026.map((d) => d.record.articles || 0);
  const curArt = currentMonthPoint?.record.articles || 0;
  const prevArt = prevMonthPoint?.record.articles || 0;
  const medArt = calculateMedian(artList);
  const deltaMoMArt = prevMonthPoint ? curArt - prevArt : 0;
  const pctMoMArt = prevMonthPoint && prevArt > 0 ? ((curArt - prevArt) / prevArt) * 100 : 0;
  const deltaMedArt = curArt - medArt;
  const pctMedArt = medArt > 0 ? ((curArt - medArt) / medArt) * 100 : 0;

  // 3. Yield (Sử dụng P-Detail thay vì Pageviews theo yêu cầu: Yield = P-Detail / Bài)
  const curDetail = currentMonthPoint?.record.pDetail || 0;
  const prevDetail = prevMonthPoint?.record.pDetail || 0;
  const yieldList = months2026.map((d) =>
    (d.record.articles || 0) > 0 ? (d.record.pDetail || 0) / (d.record.articles || 1) : 0
  );
  const curYield = curArt > 0 ? curDetail / curArt : 0;
  const prevYield = prevMonthPoint && prevArt > 0 ? prevDetail / prevArt : 0;
  const medYield = calculateMedian(yieldList);
  const deltaMoMYield = prevMonthPoint ? curYield - prevYield : 0;
  const pctMoMYield = prevMonthPoint && prevYield > 0 ? ((curYield - prevYield) / prevYield) * 100 : 0;
  const deltaMedYield = curYield - medYield;
  const pctMedYield = medYield > 0 ? ((curYield - medYield) / medYield) * 100 : 0;

  // 4. Build Top Rate
  const buildTopRateList = months2026.map((d) =>
    (d.record.articles || 0) > 0 ? ((d.record.aBuildTop || 0) / (d.record.articles || 1)) * 100 : 0
  );
  const curBuildRate = curArt > 0 ? ((currentMonthPoint?.record.aBuildTop || 0) / curArt) * 100 : 0;
  const prevBuildRate = prevMonthPoint && prevArt > 0 ? ((prevMonthPoint?.record.aBuildTop || 0) / prevArt) * 100 : 0;
  const medBuildRate = calculateMedian(buildTopRateList);
  const deltaMoMBuildRate = prevMonthPoint ? curBuildRate - prevBuildRate : 0;
  const deltaMedBuildRate = curBuildRate - medBuildRate;

  const tabs = [
    { id: 'all', name: 'Toàn Bộ Góc Nhìn', icon: Layers },
    { id: 'sources', name: 'Nguồn Truy Cập (7 Nguồn)', icon: Compass },
    { id: 'overview', name: 'Quy Mô & Yield', icon: BarChart3 },
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
            <p className="text-xs text-slate-500">
              Đối chiếu số liệu Tháng {currentMonthLabel} với <strong>MoM ({prevMonthLabel})</strong> và{' '}
              <strong>Mốc Trung vị chu kỳ năm 2026</strong>.
            </p>
            {isCustomData && customMeta && (
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đang dùng dữ liệu nạp: <strong>{customMeta.fileName}</strong> ({customMeta.rowsCount} dòng, {customMeta.months.join(', ')})
                </span>
                <button
                  onClick={onOpenExcelImport}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
                >
                  Đổi file
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={resetToDefault}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-medium hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Khôi phục gốc
                </button>
              </div>
            )}
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
                Phạm vi:
              </label>
              <select
                id="select-folder-scope"
                value={currentScope}
                onChange={(e) => onScopeChange(e.target.value)}
                className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
              >
                <option value="ALL_FOLDERS_AGG">Toàn bộ VnExpress</option>
                <optgroup label="Danh sách các ban / chuyên mục:">
                  {folderOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.id})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Import Excel / CSV Button */}
            <button
              onClick={onOpenExcelImport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition shadow-xs cursor-pointer whitespace-nowrap"
              title="Tải lên tệp Excel (.xlsx, .xls) hoặc CSV"
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
              <div className="grid grid-cols-[auto_auto_auto] items-center justify-start gap-x-3.5 gap-y-1.5 text-xs">
                {/* Row 1: vs Tháng trước */}
                <span className="text-[11px] text-slate-400 font-medium text-left whitespace-nowrap">vs Tháng trước:</span>
                <span className="font-bold text-slate-800 text-xs font-mono text-left whitespace-nowrap">
                  {prevMonthPoint ? formatNumber(prevPV) : '—'}
                </span>
                <span className={`font-bold text-xs font-mono text-left whitespace-nowrap ${deltaMoMPV >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {prevMonthPoint ? formatPercent(pctMoMPV) : '—'}
                </span>

                {/* Row 2: vs Trung vị */}
                <span className="text-[11px] text-slate-400 font-medium text-left whitespace-nowrap">vs Trung vị:</span>
                <span className="font-bold text-slate-800 text-xs font-mono text-left whitespace-nowrap">
                  {formatNumber(medPV)}
                </span>
                <span className={`font-bold text-xs font-mono text-left whitespace-nowrap ${deltaMedPV >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatPercent(pctMedPV)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Articles */}
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
              <div className="grid grid-cols-[auto_auto_auto] items-center justify-start gap-x-3.5 gap-y-1.5 text-xs">
                {/* Row 1: vs Tháng trước */}
                <span className="text-[11px] text-slate-400 font-medium text-left whitespace-nowrap">vs Tháng trước:</span>
                <span className="font-bold text-slate-800 text-xs font-mono text-left whitespace-nowrap">
                  {prevMonthPoint ? formatNumber(prevArt) : '—'}
                </span>
                <span className={`font-bold text-xs font-mono text-left whitespace-nowrap ${deltaMoMArt >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {prevMonthPoint ? formatPercent(pctMoMArt) : '—'}
                </span>

                {/* Row 2: vs Trung vị */}
                <span className="text-[11px] text-slate-400 font-medium text-left whitespace-nowrap">vs Trung vị:</span>
                <span className="font-bold text-slate-800 text-xs font-mono text-left whitespace-nowrap">
                  {formatNumber(medArt)}
                </span>
                <span className={`font-bold text-xs font-mono text-left whitespace-nowrap ${deltaMedArt >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatPercent(pctMedArt)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Yield */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs sm:text-[13px] font-bold text-slate-800 tracking-tight whitespace-nowrap block">
                  Hiệu suất Yield
                </span>
                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap block mt-0.5">
                  (Công thức: P-Detail / Bài)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200/70 whitespace-nowrap">
                Tổng tháng
              </span>
            </div>

            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {curArt > 0 ? formatNumber(curYield) : 'N/A'}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 font-sans whitespace-nowrap">P-Detail/bài</span>
            </div>

            <div className="border-t border-slate-100 pt-2.5">
              <div className="grid grid-cols-[auto_auto_auto] items-center justify-start gap-x-3.5 gap-y-1.5 text-xs">
                {/* Row 1: vs Tháng trước */}
                <span className="text-[11px] text-slate-400 font-medium text-left whitespace-nowrap">vs Tháng trước:</span>
                <span className="font-bold text-slate-800 text-xs font-mono text-left whitespace-nowrap">
                  {prevMonthPoint && prevYield > 0 ? formatNumber(prevYield) : '—'}
                </span>
                <span className={`font-bold text-xs font-mono text-left whitespace-nowrap ${deltaMoMYield >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {prevMonthPoint && prevYield > 0 ? formatPercent(pctMoMYield) : '—'}
                </span>

                {/* Row 2: vs Trung vị */}
                <span className="text-[11px] text-slate-400 font-medium text-left whitespace-nowrap">vs Trung vị:</span>
                <span className="font-bold text-slate-800 text-xs font-mono text-left whitespace-nowrap">
                  {medYield > 0 ? formatNumber(medYield) : '—'}
                </span>
                <span className={`font-bold text-xs font-mono text-left whitespace-nowrap ${deltaMedYield >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {medYield > 0 ? formatPercent(pctMedYield) : '—'}
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
              <div className="grid grid-cols-[auto_auto_auto] items-center justify-start gap-x-3.5 gap-y-1.5 text-xs">
                {/* Row 1: vs Tháng trước */}
                <span className="text-[11px] text-slate-400 font-medium text-left whitespace-nowrap">vs Tháng trước:</span>
                <span className="font-bold text-slate-800 text-xs font-mono text-left whitespace-nowrap">
                  {prevMonthPoint ? `${prevBuildRate.toFixed(1)}%` : '—'}
                </span>
                <span className={`font-bold text-xs font-mono text-left whitespace-nowrap ${deltaMoMBuildRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {prevMonthPoint ? `${deltaMoMBuildRate >= 0 ? '+' : ''}${deltaMoMBuildRate.toFixed(1)}%` : '—'}
                </span>

                {/* Row 2: vs Trung vị */}
                <span className="text-[11px] text-slate-400 font-medium text-left whitespace-nowrap">vs Trung vị:</span>
                <span className="font-bold text-slate-800 text-xs font-mono text-left whitespace-nowrap">
                  {`${medBuildRate.toFixed(1)}%`}
                </span>
                <span className={`font-bold text-xs font-mono text-left whitespace-nowrap ${deltaMedBuildRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
