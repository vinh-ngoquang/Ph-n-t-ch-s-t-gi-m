import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { MonthlyDataPoint, analyzeDimensionSeries, calculateMedian } from '../../utils/timeSeriesAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../../utils/formatters';
import {
  LineChart as LineChartIcon,
  ArrowUpDown,
  Search,
  Compass,
  Info,
  X,
  ChevronRight,
  Sparkles,
  Layers,
  TrendingDown,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { NewsRecord } from '../../types';

interface Props {
  monthlyData: MonthlyDataPoint[];
  selectedMonth?: string;
  currentScope?: string;
  folderOptions?: { id: string; name: string }[];
}

export const TrafficSourcesView: React.FC<Props> = ({
  monthlyData,
  selectedMonth,
  currentScope,
  folderOptions,
}) => {
  const sourcesConfig: {
    key: keyof NewsRecord;
    code: string;
    name: string;
    type: 'Internal' | 'External';
    color: string;
  }[] = [
    { key: 'pInHome', code: 'P- In-Home', name: 'P- In-Home', type: 'Internal', color: '#6366f1' },
    { key: 'pExGoogle', code: 'P- Ex-Google', name: 'P- Ex-Google', type: 'External', color: '#f59e0b' },
    { key: 'pInOther', code: 'P- In-Other', name: 'P- In-Other', type: 'Internal', color: '#94a3b8' },
    { key: 'pInDetail', code: 'P- In-Detail', name: 'P- In-Detail', type: 'Internal', color: '#06b6d4' },
    { key: 'pExDirect', code: 'P- Ex-Direct', name: 'P- Ex-Direct', type: 'External', color: '#10b981' },
    { key: 'pInFolder', code: 'P- In-Folder', name: 'P- In-Folder', type: 'Internal', color: '#ec4899' },
    { key: 'pExSocial', code: 'P- Ex-Social', name: 'P- Ex-Social', type: 'External', color: '#3b82f6' },
  ];

  // Điều kiện hiển thị Search & Discover và Brandname:
  // CHỈ xuất hiện khi lọc ở box Ban các giá trị sau:
  // 1, Toàn bộ Hệ thống (Tổng tất cả) - ALL_FOLDERS_AGG / ALL
  // 2, Toàn bộ Vnexpress - ALL_VNE_AGG
  // 3, Ngôi sao - 1002835
  // 4, English - 1003888
  // Nếu lọc các ban thì sẽ không hiện thông tin về Search & Discover và Brandname
  const isSearchDiscoverAllowed = useMemo(() => {
    if (!currentScope) return true;
    const scope = currentScope.trim();

    // 1. Toàn bộ Hệ thống (Tổng tất cả)
    if (scope === 'ALL_FOLDERS_AGG' || scope === 'ALL' || scope === 'ALL_SYSTEM') return true;

    // 2. Toàn bộ Vnexpress
    if (scope === 'ALL_VNE_AGG') return true;

    // 3. Ngôi sao
    if (scope === '1002835') return true;

    // 4. English
    if (scope === '1003888') return true;

    // Check by name in folderOptions or scope string
    const match = folderOptions?.find((f) => f.id === scope || f.name.toLowerCase() === scope.toLowerCase());
    const targetName = (match ? match.name : scope).toLowerCase();

    if (targetName.includes('ngôi sao') || targetName.includes('ngoi sao')) return true;
    if (targetName.includes('english')) return true;
    if (targetName.includes('toàn bộ hệ thống') || targetName.includes('tổng tất cả')) return true;
    if (targetName.includes('toàn bộ vnexpress') || targetName.includes('tất cả ban vne')) return true;

    return false;
  }, [currentScope, folderOptions]);

  // Logic hiển thị Brandname tương tự bóc tách Search & Discover
  const isBrandnameAllowed = isSearchDiscoverAllowed;

  const summary = useMemo(() => {
    return analyzeDimensionSeries(monthlyData, sourcesConfig, 'pageviews', selectedMonth);
  }, [monthlyData, selectedMonth]);

  // Google Details: Bóc tách Search & Discover cấu thành nên P- Ex-Google (Dữ liệu tham khảo)
  const googleDetails = useMemo(() => {
    if (!isSearchDiscoverAllowed) return null;

    const months2026 = monthlyData.filter((d) => d.year === 2026);
    const targetIdx = selectedMonth
      ? months2026.findIndex((d) => d.month === selectedMonth)
      : months2026.length - 1;
    const safeTargetIdx = targetIdx >= 0 ? targetIdx : months2026.length - 1;
    const curPoint = months2026[safeTargetIdx] || months2026[months2026.length - 1];

    const curGoogleTotal = curPoint?.record.pExGoogle || 0;

    // Kiểm tra xem dữ liệu đồng bộ đã có 2 cột này chưa
    const hasRawSearch = curPoint?.record.pExGoogleSearch !== undefined && curPoint?.record.pExGoogleSearch > 0;
    const hasRawDiscover = curPoint?.record.pExGoogleDiscover !== undefined && curPoint?.record.pExGoogleDiscover > 0;
    const isFromSheet = hasRawSearch || hasRawDiscover;

    const getSearchVal = (rec: NewsRecord) => {
      if (rec.pExGoogleSearch !== undefined && rec.pExGoogleSearch > 0) return rec.pExGoogleSearch;
      return Math.round((rec.pExGoogle || 0) * 0.62);
    };

    const getDiscoverVal = (rec: NewsRecord) => {
      if (rec.pExGoogleDiscover !== undefined && rec.pExGoogleDiscover > 0) return rec.pExGoogleDiscover;
      return Math.round((rec.pExGoogle || 0) * 0.38);
    };

    const curSearch = getSearchVal(curPoint.record);
    const curDiscover = getDiscoverVal(curPoint.record);

    const searchSeries = months2026.map((d) => getSearchVal(d.record));
    const discoverSeries = months2026.map((d) => getDiscoverVal(d.record));

    const medSearch = calculateMedian(searchSeries);
    const medDiscover = calculateMedian(discoverSeries);

    const deltaSearch = curSearch - medSearch;
    const pctSearch = medSearch > 0 ? (deltaSearch / medSearch) * 100 : 0;

    const deltaDiscover = curDiscover - medDiscover;
    const pctDiscover = medDiscover > 0 ? (deltaDiscover / medDiscover) * 100 : 0;

    const curMonthLabel = curPoint?.shortLabel || '';
    const totalDeltaGoogle = (curSearch + curDiscover) - (medSearch + medDiscover);
    const totalPctDeltaGoogle = (medSearch + medDiscover) > 0 ? (totalDeltaGoogle / (medSearch + medDiscover)) * 100 : 0;

    const primaryDriver: 'search' | 'discover' = deltaSearch >= deltaDiscover ? 'search' : 'discover';
    const primaryDriverLabel = primaryDriver === 'search' ? 'Google Search' : 'Google Discover';

    const trendInsightText = `Xu hướng tham khảo trong tháng ${curMonthLabel}: Tìm kiếm chủ động (Search) đạt ${formatNumber(curSearch)} PV (${formatDelta(deltaSearch)} so với chuẩn), trong khi Đề xuất di động (Discover) đạt ${formatNumber(curDiscover)} PV (${formatDelta(deltaDiscover)} so với chuẩn).`;

    const trendSearchDiscover = months2026.map((d) => {
      const sVal = getSearchVal(d.record);
      const dVal = getDiscoverVal(d.record);

      return {
        month: d.shortLabel,
        rawMonth: d.month,
        search: Number((sVal / 1_000_000).toFixed(2)),
        discover: Number((dVal / 1_000_000).toFixed(2)),
        searchRaw: sVal,
        discoverRaw: dVal,
      };
    });

    return {
      isFromSheet,
      curMonthLabel,
      curGoogleTotal,
      curSearch,
      curDiscover,
      medSearch,
      medDiscover,
      deltaSearch,
      deltaDiscover,
      pctSearch,
      pctDiscover,
      totalDeltaGoogle,
      totalPctDeltaGoogle,
      primaryDriver,
      primaryDriverLabel,
      trendInsightText,
      trendSearchDiscover,
    };
  }, [monthlyData, selectedMonth]);

  // Direct Details: Bóc tách Brandname (Dữ liệu tham khảo mức độ tìm kiếm chủ động thương hiệu VnExpress, từ T3/2026)
  const directDetails = useMemo(() => {
    if (!isBrandnameAllowed) return null;

    const months2026 = monthlyData.filter((d) => d.year === 2026);
    const targetIdx = selectedMonth
      ? months2026.findIndex((d) => d.month === selectedMonth)
      : months2026.length - 1;
    const curPoint = targetIdx >= 0 ? months2026[targetIdx] : months2026[months2026.length - 1];

    if (!curPoint) return null;

    const curDirectTotal = curPoint.record.pExDirect || 0;

    // Lọc các tháng thực sự có dữ liệu Brandname - TUYỆT ĐỐI KHÔNG BỊA SỐ
    const monthsWithBrandname = months2026.filter((d) => {
      const v = d.record.pExDirectBrandname;
      return v !== undefined && v !== null && v > 0;
    });

    const isFromSheet = monthsWithBrandname.length > 0;

    // Chuỗi giá trị thực tế của Brandname chỉ lấy từ các tháng có dữ liệu (từ T3/2026)
    const brandnameSeries = monthsWithBrandname.map((d) => d.record.pExDirectBrandname as number);
    const directSeries = months2026.map((d) => d.record.pExDirect || 0);

    // Mốc chuẩn trung vị Brandname tính trên các tháng có số liệu thực tế
    const medBrandname = brandnameSeries.length > 0 ? calculateMedian(brandnameSeries) : 0;
    const medDirect = calculateMedian(directSeries);

    // Tháng hiện tại được chọn: Kiểm tra xem tháng này có dữ liệu Brandname hay chưa
    const curBrandnameRaw = curPoint.record.pExDirectBrandname;
    const hasCurBrandname = curBrandnameRaw !== undefined && curBrandnameRaw !== null && curBrandnameRaw > 0;
    const curBrandname = hasCurBrandname ? curBrandnameRaw : 0;

    const deltaBrandname = hasCurBrandname ? curBrandname - medBrandname : null;
    const pctBrandname = (hasCurBrandname && medBrandname > 0 && deltaBrandname !== null)
      ? (deltaBrandname / medBrandname) * 100
      : null;

    const deltaDirect = curDirectTotal - medDirect;
    const pctDirect = medDirect > 0 ? (deltaDirect / medDirect) * 100 : 0;

    const curMonthLabel = curPoint?.shortLabel || '';

    // Biểu đồ xu hướng: CHỈ thể hiện các tháng thực sự có dữ liệu ghi nhận (từ T3/2026)
    const trendDirectBrandname = monthsWithBrandname.map((d) => {
      const bVal = d.record.pExDirectBrandname as number;

      return {
        month: d.shortLabel,
        rawMonth: d.month,
        brandname: Number((bVal / 1_000_000).toFixed(2)),
        brandnameRaw: bVal,
      };
    });

    const earliestDataMonth = monthsWithBrandname.length > 0 ? monthsWithBrandname[0].shortLabel : 'T3';
    const latestDataMonth = monthsWithBrandname.length > 0 ? monthsWithBrandname[monthsWithBrandname.length - 1].shortLabel : 'T8';

    return {
      isFromSheet,
      hasCurBrandname,
      curMonthLabel,
      curDirectTotal,
      curBrandname,
      medBrandname,
      medDirect,
      deltaBrandname,
      pctBrandname,
      deltaDirect,
      pctDirect,
      trendDirectBrandname,
      earliestDataMonth,
      latestDataMonth,
      countRecordedMonths: monthsWithBrandname.length,
    };
  }, [monthlyData, selectedMonth, isBrandnameAllowed]);

  // States
  const [showChart, setShowChart] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'drop' | 'internal' | 'external'>('all');
  const [sortBy, setSortBy] = useState<'deficit' | 'share' | 'volume' | 'growth'>('deficit');
  const [selectedKey, setSelectedKey] = useState<string>('pInHome');

  // Total metrics
  const totalT8 = summary.totalT8;
  const totalMed = summary.totalMedian;
  const totalDeltaMed = totalT8 - totalMed;

  // Process rows with internal/external classification
  const processedRows = useMemo(() => {
    return summary.rows.map((row) => {
      const cfg = sourcesConfig.find((s) => s.key === row.key);
      const isInternal = cfg?.type === 'Internal';
      return {
        ...row,
        code: cfg?.code || row.key,
        type: cfg?.type || 'Internal',
        color: cfg?.color || '#64748b',
        isInternal,
      };
    });
  }, [summary.rows]);

  // Deepest drop
  const dropsOnly = processedRows.filter((r) => r.deltaMedian < 0);
  const deepestDrop = dropsOnly.length > 0
    ? [...dropsOnly].sort((a, b) => a.deltaMedian - b.deltaMedian)[0]
    : null;

  // Best growth
  const gainsOnly = processedRows.filter((r) => r.deltaMedian >= 0);
  const bestGain = gainsOnly.length > 0
    ? [...gainsOnly].sort((a, b) => b.deltaMedian - a.deltaMedian)[0]
    : null;

  // External vs Internal balance
  const internalRows = processedRows.filter((r) => r.isInternal);
  const externalRows = processedRows.filter((r) => !r.isInternal);

  const internalT8 = internalRows.reduce((sum, r) => sum + r.t8, 0);
  const internalMed = internalRows.reduce((sum, r) => sum + r.median, 0);
  const internalDelta = internalT8 - internalMed;
  const internalPct = internalMed > 0 ? (internalDelta / internalMed) * 100 : 0;

  const externalT8 = externalRows.reduce((sum, r) => sum + r.t8, 0);
  const externalMed = externalRows.reduce((sum, r) => sum + r.median, 0);
  const externalDelta = externalT8 - externalMed;
  const externalPct = externalMed > 0 ? (externalDelta / externalMed) * 100 : 0;

  // Max absolute delta for relative bar scaling
  const maxAbsDeficit = Math.max(...processedRows.map((r) => Math.abs(r.deltaMedian)), 1);

  // Filter & Sort
  const displayedRows = useMemo(() => {
    let list = [...processedRows];
    if (filterType === 'drop') {
      list = list.filter((r) => r.deltaMedian < 0);
    } else if (filterType === 'internal') {
      list = list.filter((r) => r.isInternal);
    } else if (filterType === 'external') {
      list = list.filter((r) => !r.isInternal);
    }

    if (sortBy === 'deficit') {
      list.sort((a, b) => a.deltaMedian - b.deltaMedian);
    } else if (sortBy === 'share') {
      list.sort((a, b) => b.shareT8 - a.shareT8);
    } else if (sortBy === 'volume') {
      list.sort((a, b) => b.t8 - a.t8);
    } else if (sortBy === 'growth') {
      list.sort((a, b) => b.pctChangeMedian - a.pctChangeMedian);
    }
    return list;
  }, [processedRows, filterType, sortBy]);

  // Chart data
  const chartData = useMemo(() => {
    return summary.trendSeries.map((item) => {
      const pt: any = {
        month: item.shortLabel,
      };
      sourcesConfig.forEach((src) => {
        pt[src.code] = Number(((item[src.key] || 0) / 1_000_000).toFixed(2));
      });
      return pt;
    });
  }, [summary.trendSeries]);

  const dropSharePct = (deepestDrop && totalDeltaMed < 0)
    ? Math.round((deepestDrop.deltaMedian / totalDeltaMed) * 100)
    : 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      {/* 1. Header Bar with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Động thái & Nguồn Sụt giảm Pageview theo Tháng
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bóc tách từng nguồn lưu lượng so với mốc Trung vị chuẩn chu kỳ năm 2026
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Toggle Trend Chart */}
          <button
            onClick={() => setShowChart(!showChart)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
              showChart
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>{showChart ? 'Ẩn Biểu đồ Xu hướng' : 'Hiện Biểu đồ Xu hướng'}</span>
          </button>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/70">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({processedRows.length})
            </button>
            <button
              onClick={() => setFilterType('drop')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'drop'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Sụt giảm ({dropsOnly.length})
            </button>
            <button
              onClick={() => setFilterType('internal')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'internal'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nội bộ (P- In-*)
            </button>
            {/* External */}
            <button
              onClick={() => setFilterType('external')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'external'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nguồn ngoài (P- Ex-*)
            </button>

            {/* Google Search & Discover quick tab - CHỈ HIỆN Ở 4 PHẠM VI HỖ TRỢ */}
            {isSearchDiscoverAllowed && (
              <button
                onClick={() => {
                  setSelectedKey('pExGoogle');
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedKey === 'pExGoogle'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                    : 'text-amber-800 hover:bg-amber-50 hover:text-amber-900'
                }`}
                title="Bấm để xem dữ liệu tham khảo Search & Discover"
              >
                <Search className="w-3 h-3 text-amber-600" />
                <span>P- Ex-Google</span>
                <span className="text-[9px] px-1 py-0.2 bg-amber-200/80 rounded text-amber-900 font-bold">Tham khảo</span>
              </button>
            )}

            {/* Direct Brandname quick tab - CHỈ HIỆN Ở 4 PHẠM VI HỖ TRỢ */}
            {isBrandnameAllowed && directDetails && (
              <button
                onClick={() => {
                  setSelectedKey('pExDirect');
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedKey === 'pExDirect'
                    ? 'bg-blue-100 text-blue-900 border border-blue-300 shadow-xs'
                    : 'text-blue-800 hover:bg-blue-50 hover:text-blue-900'
                }`}
                title="Bấm để xem dữ liệu tham khảo Brandname cho P- Ex-Direct"
              >
                <Compass className="w-3 h-3 text-blue-600" />
                <span>P- Ex-Direct</span>
                <span className="text-[9px] px-1 py-0.2 bg-blue-200/80 rounded text-blue-900 font-bold">Brandname</span>
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 text-slate-500 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-[11px] whitespace-nowrap">Xếp theo:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="deficit">Giảm sâu nhất vs Trung vị (Mặc định)</option>
              <option value="share">Tỷ trọng cao nhất</option>
              <option value="volume">Lượng Pageview cao nhất</option>
              <option value="growth">Tăng trưởng tốt nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Top 3 Highlight Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Deepest Deficit Source */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Nguồn Sụt Giảm Sâu Nhất</span>
            {dropSharePct > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200/70">
                Chiếm {dropSharePct}% lượng hụt
              </span>
            )}
          </div>
          {deepestDrop ? (
            <div className="mt-2 space-y-1">
              <div className="text-base font-bold text-rose-600 font-mono flex items-center gap-2">
                <span>{deepestDrop.code}</span>
                <span>{formatDelta(deepestDrop.deltaMedian)} PV</span>
                <span className="text-xs font-semibold">({formatPercent(deepestDrop.pctChangeMedian)})</span>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {selectedMonth ? `Tháng ${selectedMonth}` : 'Tháng này'}: <strong className="text-slate-700">{formatNumber(deepestDrop.t8)}</strong>
                {'  '}| Trung vị: <strong className="text-slate-700">{formatNumber(deepestDrop.median)}</strong>
              </div>
            </div>
          ) : (
            <div className="text-xs text-emerald-700 font-semibold mt-2">Không có nguồn sụt giảm (≥ mốc trung vị)</div>
          )}
        </div>

        {/* Card 2: External vs Internal Balance */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Cán Cân P- Ex-* vs. P- In-*</div>
          <div className="mt-2 space-y-1 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Nguồn ngoài (P- Ex-*):</span>
              <span className="font-semibold text-slate-700">
                {formatNumber(externalT8)} PV{' '}
                <span className={externalDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  ({formatDelta(externalDelta)} | {formatPercent(externalPct)})
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Nội bộ (P- In-*):</span>
              <span className="font-semibold text-slate-700">
                {formatNumber(internalT8)} PV{' '}
                <span className={internalDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  ({formatDelta(internalDelta)} | {formatPercent(internalPct)})
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Best Performing Source */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Nguồn Tăng Trưởng Tốt Nhất</div>
          {bestGain ? (
            <div className="mt-2 space-y-1">
              <div className="text-base font-bold text-emerald-600 font-mono flex items-center gap-2">
                <span>{bestGain.code}</span>
                <span>{formatDelta(bestGain.deltaMedian)} PV</span>
                <span className="text-xs font-semibold">({formatPercent(bestGain.pctChangeMedian)})</span>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Tháng này: <strong className="text-slate-700">{formatNumber(bestGain.t8)}</strong>
                {'  '}| Trung vị: <strong className="text-slate-700">{formatNumber(bestGain.median)}</strong>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-2 italic">
              Chưa có nguồn nào vượt mốc trung vị trong tháng hiện tại.
            </div>
          )}
        </div>
      </div>

      {/* 3. Collapsible Trend Line Chart */}
      {showChart && (
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 transition-all">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-800">
              Đường xu hướng các nguồn truy cập qua 8 tháng (Triệu PV)
            </span>
            <span className="text-slate-500 text-[11px]">Đơn vị: Triệu Pageviews</span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(v) => `${v}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '0.5rem',
                    color: '#0f172a',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  }}
                  formatter={(value: any, name: any) => [`${value}M PV`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                {sourcesConfig.map((src) => (
                  <Line
                    key={src.code}
                    type="monotone"
                    dataKey={src.code}
                    stroke={src.color}
                    strokeWidth={src.key === selectedKey ? 3.5 : 2}
                    dot={{ r: 3, fill: src.color }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Main Clean Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/90">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-sans">Kênh Nguồn (Channel)</th>
              <th className="py-3 px-4 text-right font-sans">Tỷ Trọng Tháng Này</th>
              <th className="py-3 px-4 text-right font-sans">
                {selectedMonth ? `Tháng ${selectedMonth}` : 'Tháng Này (Tháng 8)'}
              </th>
              <th className="py-3 px-4 text-right font-sans">Mốc Trung Vị (2026)</th>
              <th className="py-3 px-4 text-right font-sans min-w-[200px]">Lệch vs. Trung Vị</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedRows.map((row) => {
              const isSelected = selectedKey === row.key;
              const isDrop = row.deltaMedian < 0;
              const barWidthPct = Math.min(100, Math.max(8, (Math.abs(row.deltaMedian) / maxAbsDeficit) * 100));

              return (
                <React.Fragment key={row.key}>
                  <tr
                    onClick={() => setSelectedKey(row.key as string)}
                    className={`cursor-pointer transition hover:bg-slate-50/70 ${
                      isSelected
                        ? row.key === 'pExGoogle' && isSearchDiscoverAllowed
                          ? 'bg-amber-50/50 border-l-4 border-l-amber-500'
                          : 'bg-blue-50/40 border-l-4 border-l-blue-600'
                        : ''
                    }`}
                  >
                    {/* Channel with Color Dot & Badge */}
                    <td className="py-3.5 px-4 font-sans font-medium text-slate-900">
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="font-semibold text-slate-900">{row.code}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200/70">
                          {row.type}
                        </span>
                        {isSelected && (
                          <span
                            className={`text-[11px] font-semibold ${
                              row.key === 'pExGoogle' && isSearchDiscoverAllowed
                                ? 'text-amber-700'
                                : 'text-blue-600'
                            }`}
                          >
                            • Đang chọn
                          </span>
                        )}

                        {/* Special Google Badge / Action - CHỈ HIỆN Ở 4 PHẠM VI ĐƯỢC PHÉP */}
                        {row.key === 'pExGoogle' && isSearchDiscoverAllowed && (
                          <div className="ml-auto">
                            {isSelected ? (
                              <span className="inline-block text-[10px] font-bold text-amber-900 bg-amber-200/80 border border-amber-400/80 rounded px-2 py-0.5">
                                Search & Discover
                              </span>
                            ) : (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedKey('pExGoogle');
                                }}
                                className="inline-block text-[10px] font-semibold text-amber-800 bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300 rounded px-2 py-0.5 transition cursor-pointer"
                                title="Bấm để xem Search & Discover"
                              >
                                Search & Discover ↗
                              </span>
                            )}
                          </div>
                        )}

                        {/* Special Direct Brandname Badge / Action - CHỈ HIỆN Ở 4 PHẠM VI ĐƯỢC PHÉP */}
                        {row.key === 'pExDirect' && isBrandnameAllowed && directDetails && (
                          <div className="ml-auto">
                            {isSelected ? (
                              <span className="inline-block text-[10px] font-bold text-blue-900 bg-blue-200/80 border border-blue-400/80 rounded px-2 py-0.5">
                                Brandname
                              </span>
                            ) : (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedKey('pExDirect');
                                }}
                                className="inline-block text-[10px] font-semibold text-blue-800 bg-blue-100/80 hover:bg-blue-200/80 border border-blue-300 rounded px-2 py-0.5 transition cursor-pointer"
                                title="Bấm để xem Brandname"
                              >
                                Brandname ↗
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Share % */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-slate-900">{formatPercent(row.shareT8, false)}</div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        Chuẩn: {formatPercent(row.shareMedian, false)}
                      </div>
                    </td>

                    {/* Month 8 Value */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-slate-900">{formatNumber(row.t8)}</div>
                    </td>

                    {/* Median Benchmark */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-semibold text-slate-700">{formatNumber(row.median)}</div>
                      <div className="text-[10px] text-slate-400 font-sans">Chuẩn 2026</div>
                    </td>

                    {/* Deviation vs Median + Sleek Progress Bar */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className={`font-bold ${isDrop ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatDelta(row.deltaMedian)} ({formatPercent(row.pctChangeMedian)})
                      </div>

                      {/* Deficit Bar indicator underneath number */}
                      <div className="w-full max-w-[170px] h-1.5 bg-slate-100 rounded-full overflow-hidden relative mt-1.5 ml-auto flex justify-end">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isDrop ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${barWidthPct}%` }}
                        />
                      </div>
                    </td>
                  </tr>

                  {/* SUB-ROWS FOR P- Ex-Google: CHỈ XUẤT HIỆN KHI CHỌN NGUỒN P- Ex-Google VÀ Ở 4 PHẠM VI HỖ TRỢ */}
                  {row.key === 'pExGoogle' && isSelected && isSearchDiscoverAllowed && googleDetails && (
                    <>
                      {/* Sub-row 1: Google Search */}
                      <tr className="bg-amber-50/70 border-l-4 border-l-amber-500 hover:bg-amber-50 transition font-sans">
                        <td className="py-2.5 px-4 pl-10 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-600 font-bold text-xs">↳</span>
                            <span className="font-bold text-amber-950">P- Ex-Google | Search</span>
                            <span className="text-[11px] text-slate-500 hidden sm:inline">(Tìm kiếm tự nhiên)</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-400 text-xs">
                          —
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          <div className="font-bold text-slate-900">{formatNumber(googleDetails.curSearch)}</div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          <div className="font-semibold text-slate-700">{formatNumber(googleDetails.medSearch)}</div>
                          <div className="text-[10px] text-slate-400 font-sans">Chuẩn 2026</div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          <div className={`font-bold ${googleDetails.deltaSearch >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatDelta(googleDetails.deltaSearch)} ({formatPercent(googleDetails.pctSearch)})
                          </div>
                        </td>
                      </tr>

                      {/* Sub-row 2: Google Discover */}
                      <tr className="bg-sky-50/70 border-l-4 border-l-sky-500 hover:bg-sky-50 transition font-sans">
                        <td className="py-2.5 px-4 pl-10 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="text-sky-600 font-bold text-xs">↳</span>
                            <span className="font-bold text-sky-950">P- Ex-Google | Discover</span>
                            <span className="text-[11px] text-slate-500 hidden sm:inline">(Gợi ý khám phá di động)</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-400 text-xs">
                          —
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          <div className="font-bold text-slate-900">{formatNumber(googleDetails.curDiscover)}</div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          <div className="font-semibold text-slate-700">{formatNumber(googleDetails.medDiscover)}</div>
                          <div className="text-[10px] text-slate-400 font-sans">Chuẩn 2026</div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          <div className={`font-bold ${googleDetails.deltaDiscover >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatDelta(googleDetails.deltaDiscover)} ({formatPercent(googleDetails.pctDiscover)})
                          </div>
                        </td>
                      </tr>

                      {/* Info helper row */}
                      <tr className="bg-amber-50/40 text-[11px] text-amber-900 border-b border-amber-200/60 font-sans">
                        <td colSpan={5} className="py-2 px-4 pl-10">
                          <span>
                            Search và Discover là các nguồn đo lường độc lập, không phải tập con của P- Ex-Google và không cộng dồn vào tổng nguồn.
                          </span>
                        </td>
                      </tr>
                    </>
                  )}

                  {/* SUB-ROWS FOR P- Ex-Direct: DỮ LIỆU THAM KHẢO BRANDNAME - CHỈ HIỆN KHI Ở 4 PHẠM VI HỖ TRỢ */}
                  {row.key === 'pExDirect' && isSelected && isBrandnameAllowed && directDetails && (
                    <>
                      {/* Sub-row 1: Brandname */}
                      <tr className="bg-blue-50/70 border-l-4 border-l-blue-600 hover:bg-blue-50 transition font-sans">
                        <td className="py-2.5 px-4 pl-10 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 font-bold text-xs">↳</span>
                            <span className="font-bold text-blue-950">P- Ex-Direct | Brandname</span>
                            <span className="text-[11px] text-slate-500 hidden sm:inline">
                              (Mức độ tìm kiếm thương hiệu VnExpress)
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-400 text-xs">
                          —
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          {directDetails.hasCurBrandname ? (
                            <div className="font-bold text-slate-900">{formatNumber(directDetails.curBrandname)}</div>
                          ) : (
                            <div className="text-xs text-slate-500 font-sans italic">
                              Chưa ghi nhận
                              <span className="text-[10px] text-slate-400 block font-normal">(Có từ T3/2026)</span>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          <div className="font-semibold text-slate-700">{formatNumber(directDetails.medBrandname)}</div>
                          <div className="text-[10px] text-slate-400 font-sans" title="Mốc chuẩn trung vị tính trên các tháng thực tế từ T3/2026">
                            Chuẩn 2026 (từ T3)
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          {directDetails.hasCurBrandname && directDetails.deltaBrandname !== null && directDetails.pctBrandname !== null ? (
                            <div
                              className={`font-bold ${
                                directDetails.deltaBrandname >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {formatDelta(directDetails.deltaBrandname)} ({formatPercent(directDetails.pctBrandname)})
                            </div>
                          ) : (
                            <div className="text-slate-400 font-sans text-xs">—</div>
                          )}
                        </td>
                      </tr>

                      {/* Info helper row */}
                      <tr className="bg-blue-50/40 text-[11px] text-blue-900 border-b border-blue-200/60 font-sans">
                        <td colSpan={5} className="py-2 px-4 pl-10">
                          <span>
                            Chỉ số Brandname thể hiện mức độ tìm kiếm thương hiệu VnExpress (ghi nhận từ Tháng 3/2026), không phải tập con của P- Ex-Direct và không cộng dồn vào tổng nguồn.
                          </span>
                        </td>
                      </tr>
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Table Total Summary Footer */}
          <tfoot className="bg-slate-50 font-sans border-t-2 border-slate-200">
            <tr className="font-semibold text-slate-900">
              <td className="py-3.5 px-4 font-bold text-xs uppercase tracking-tight">
                TỔNG TOÀN BỘ NGUỒN (INTERNAL + EXTERNAL)
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-bold text-xs">
                100%
              </td>
              <td className="py-3.5 px-4 text-right font-mono">
                <div className="font-bold text-xs text-slate-900">{formatNumber(totalT8)}</div>
              </td>
              <td className="py-3.5 px-4 text-right font-mono">
                <div className="font-bold text-xs text-slate-900">{formatNumber(totalMed)}</div>
                <div className="text-[10px] text-slate-400 font-sans">Chuẩn 2026</div>
              </td>
              <td className="py-3.5 px-4 text-right font-mono">
                <div
                  className={`font-bold text-xs ${
                    totalDeltaMed >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {formatDelta(totalDeltaMed)} (
                  {formatPercent(totalMed > 0 ? (totalDeltaMed / totalMed) * 100 : 0)})
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. Dedicated Reference Breakdown Panel for P- Ex-Google (CHỈ HIỂN THỊ KHI CHỌN NGUỒN P- Ex-Google VÀ Ở 4 PHẠM VI HỖ TRỢ) */}
      {selectedKey === 'pExGoogle' && isSearchDiscoverAllowed && googleDetails && (
        <div className="rounded-2xl border-2 border-amber-300/90 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-5 shadow-xs space-y-4 transition-all">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  P- Ex-Google | Search & Discover
                </h3>
                {googleDetails.isFromSheet && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ Google Sheets
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 font-sans">
                Search và Discover là các chỉ số đo lường độc lập, không phải tập con của P- Ex-Google.
              </p>
            </div>

            <button
              onClick={() => setSelectedKey('pInHome')}
              className="self-start sm:self-center flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 transition cursor-pointer shrink-0"
              title="Thu gọn bóc tách P- Ex-Google"
            >
              <X className="w-3.5 h-3.5" />
              <span>Đóng bóc tách</span>
            </button>
          </div>

          {/* Reference Indicator Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/80 rounded-xl border border-amber-200/70 text-xs font-semibold text-slate-700">
            <span className="text-amber-900">
              Google Search (Tháng {googleDetails.curMonthLabel}): <strong>{formatNumber(googleDetails.curSearch)} PV</strong>
            </span>
            <span className="text-sky-900">
              Google Discover (Tháng {googleDetails.curMonthLabel}): <strong>{formatNumber(googleDetails.curDiscover)} PV</strong>
            </span>
          </div>

          {/* 2 Detail Sub-cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Sub-card 1: Google Search */}
            <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs space-y-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900">P- Ex-Google | Search</h4>
                <p className="text-[11px] text-slate-500">Tìm kiếm tự nhiên (Organic Search)</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between font-mono">
                <div className="text-lg font-extrabold text-amber-900">
                  {formatNumber(googleDetails.curSearch)} <span className="text-xs font-normal text-slate-500">PV</span>
                </div>
                <div className={`text-xs font-bold ${googleDetails.deltaSearch >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatDelta(googleDetails.deltaSearch)} ({formatPercent(googleDetails.pctSearch)})
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-100 pt-1.5">
                <span>Mốc trung vị 2026:</span>
                <strong className="text-slate-700">{formatNumber(googleDetails.medSearch)} PV</strong>
              </div>
            </div>

            {/* Sub-card 2: Google Discover */}
            <div className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs space-y-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900">P- Ex-Google | Discover</h4>
                <p className="text-[11px] text-slate-500">Gợi ý khám phá di động (Chrome & Google App)</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between font-mono">
                <div className="text-lg font-extrabold text-sky-900">
                  {formatNumber(googleDetails.curDiscover)} <span className="text-xs font-normal text-slate-500">PV</span>
                </div>
                <div className={`text-xs font-bold ${googleDetails.deltaDiscover >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatDelta(googleDetails.deltaDiscover)} ({formatPercent(googleDetails.pctDiscover)})
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-100 pt-1.5">
                <span>Mốc trung vị 2026:</span>
                <strong className="text-slate-700">{formatNumber(googleDetails.medDiscover)} PV</strong>
              </div>
            </div>
          </div>

          {/* High-Clarity Trend Visualization for Search & Discover */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            {/* Chart Header */}
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">
                Phân Tích Xu Hướng: Search & Discover Qua Các Tháng 2026
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
                Đường xu hướng: So sánh trực tiếp biên độ và độ dốc tăng/giảm giữa Search và Discover (Triệu PV).
              </p>
            </div>

            {/* The Chart Rendering */}
            <div className="w-full h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={googleDetails.trendSearchDiscover}
                  margin={{ top: 10, right: 20, left: -5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(v) => `${v}M`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const point = payload[0]?.payload;
                      if (!point) return null;
                      return (
                        <div className="bg-slate-900/95 text-white rounded-xl p-3 shadow-xl border border-slate-700/80 text-xs min-w-[200px] space-y-2">
                          <div className="border-b border-slate-700/80 pb-1.5 font-bold text-slate-200">
                            Tháng {point.month}
                          </div>
                          <div className="space-y-1.5 font-mono">
                            <div className="flex items-center justify-between text-amber-300">
                              <div className="flex items-center gap-1.5 font-sans">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                                <span className="text-slate-200 font-medium">Search:</span>
                              </div>
                              <span className="font-bold">{formatNumber(point.searchRaw)} PV</span>
                            </div>
                            <div className="flex items-center justify-between text-sky-300">
                              <div className="flex items-center gap-1.5 font-sans">
                                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                                <span className="text-slate-200 font-medium">Discover:</span>
                              </div>
                              <span className="font-bold">{formatNumber(point.discoverRaw)} PV</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                  />
                  {googleDetails.curMonthLabel && (
                    <ReferenceLine
                      x={googleDetails.curMonthLabel}
                      stroke="#dc2626"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      label={{ value: 'Đang xem', fill: '#dc2626', fontSize: 10, position: 'insideTopRight' }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="search"
                    name="P- Ex-Google | Search (Triệu PV)"
                    stroke="#d97706"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#ffffff', stroke: '#d97706', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#d97706' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="discover"
                    name="P- Ex-Google | Discover (Triệu PV)"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#ffffff', stroke: '#0284c7', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#0284c7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 6. Dedicated Reference Breakdown Panel for P- Ex-Direct (CHỈ HIỂN THỊ KHI CHỌN NGUỒN P- Ex-Direct VÀ Ở 4 PHẠM VI HỖ TRỢ) */}
      {selectedKey === 'pExDirect' && isBrandnameAllowed && directDetails && (
        <div className="rounded-2xl border-2 border-blue-300/90 bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 p-5 shadow-xs space-y-4 transition-all">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-200/80 pb-3.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  P- Ex-Direct | Brandname
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Từ T3/2026
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedKey('pInHome')}
              className="self-start sm:self-center flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 transition cursor-pointer shrink-0"
              title="Thu gọn bóc tách P- Ex-Direct"
            >
              <X className="w-3.5 h-3.5" />
              <span>Đóng bóc tách</span>
            </button>
          </div>

          {/* Reference Indicator Summary */}
          {directDetails.hasCurBrandname ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/80 rounded-xl border border-blue-200/70 text-xs font-semibold text-slate-700">
              <span className="text-blue-900">
                P- Ex-Direct | Brandname (Tháng {directDetails.curMonthLabel}): <strong>{formatNumber(directDetails.curBrandname)} PV</strong>
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                (Bắt đầu từ T3/2026)
              </span>
            </div>
          ) : (
            <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs text-blue-900 font-sans">
              <span>
                Tháng <strong>{directDetails.curMonthLabel}</strong> chưa có số liệu Brandname (bắt đầu từ Tháng 3/2026).
              </span>
            </div>
          )}

          {/* 2 Deep Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Brandname Current Month */}
            <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">P- Ex-Direct | Brandname</h4>
                  <p className="text-[11px] text-slate-500">Tháng {directDetails.curMonthLabel} (Nhận diện thương hiệu)</p>
                </div>
                {!directDetails.hasCurBrandname && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    Từ T3/2026
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between font-mono">
                {directDetails.hasCurBrandname ? (
                  <>
                    <div className="text-lg font-extrabold text-blue-950">
                      {formatNumber(directDetails.curBrandname)} <span className="text-xs font-normal text-slate-500">PV</span>
                    </div>
                    {directDetails.deltaBrandname !== null && directDetails.pctBrandname !== null && (
                      <div className={`text-xs font-bold ${directDetails.deltaBrandname >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatDelta(directDetails.deltaBrandname)} ({formatPercent(directDetails.pctBrandname)})
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <span className="text-sm font-semibold text-slate-500 font-sans italic">Chưa ghi nhận trong tháng này</span>
                    <span className="text-[11px] text-slate-400 block font-sans">Dữ liệu Brandname bắt đầu từ Tháng 3/2026</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-100 pt-1.5">
                <span>Mốc trung vị 2026 (từ T3):</span>
                <strong className="text-slate-700">{formatNumber(directDetails.medBrandname)} PV</strong>
              </div>
            </div>

            {/* Card 2: Mốc Chuẩn & Phạm Vi Dữ Liệu Brandname */}
            <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Mốc Chuẩn & Phạm Vi Dữ Liệu</h4>
                  <p className="text-[11px] text-slate-500">Dữ liệu ghi nhận từ Tháng 3/2026</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {directDetails.countRecordedMonths} tháng có số liệu
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between font-mono">
                <div className="text-lg font-extrabold text-slate-900">
                  {formatNumber(directDetails.medBrandname)} <span className="text-xs font-normal text-slate-500">PV (Chuẩn trung vị)</span>
                </div>
                <div className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {directDetails.earliestDataMonth} - {directDetails.latestDataMonth}/2026
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-100 pt-1.5">
                <span>Số tháng ghi nhận:</span>
                <strong className="text-slate-700">{directDetails.countRecordedMonths} tháng (Từ T3/2026)</strong>
              </div>
            </div>
          </div>

          {/* Trend Visualization for Direct Brandname */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            {/* Chart Header */}
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-slate-900">
                  Phân Tích Xu Hướng: Brandname Qua Các Tháng 2026
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  Bắt đầu từ T3/2026
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
                Đường xu hướng: Theo dõi biên độ và tốc độ tăng trưởng lưu lượng Brandname (Triệu PV) qua từng tháng.
              </p>
            </div>

            {/* Recharts Canvas */}
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={directDetails.trendDirectBrandname}
                  margin={{ top: 10, right: 20, left: -5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(v) => `${v}M`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const point = payload[0]?.payload;
                      if (!point) return null;
                      return (
                        <div className="bg-slate-900/95 text-white rounded-xl p-3 shadow-xl border border-slate-700/80 text-xs min-w-[200px] space-y-2">
                          <div className="border-b border-slate-700/80 pb-1.5 font-bold text-slate-200">
                            Tháng {point.month}
                          </div>
                          <div className="flex items-center justify-between text-blue-300 font-mono">
                            <div className="flex items-center gap-1.5 font-sans">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                              <span className="text-slate-200 font-medium">Brandname:</span>
                            </div>
                            <span className="font-bold">{formatNumber(point.brandnameRaw)} PV</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                  />
                  {directDetails.curMonthLabel && directDetails.trendDirectBrandname.some((p) => p.month === directDetails.curMonthLabel) && (
                    <ReferenceLine
                      x={directDetails.curMonthLabel}
                      stroke="#dc2626"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      label={{ value: 'Đang xem', fill: '#dc2626', fontSize: 10, position: 'insideTopRight' }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="brandname"
                    name="P- Ex-Direct | Brandname (Triệu PV)"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#2563eb' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
