import React, { useState, useMemo } from 'react';
import {
  VIETNAM_PUBLISHERS_VISITS,
  MARKET_2026_MONTHS,
  PublisherVisitRecord,
  calculate2026MedianVisit,
  calculateTotalMarket2026Median,
} from '../../data/marketData';
import { formatNumber, formatPercent, formatDelta } from '../../utils/formatters';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { RefreshCw, Check } from 'lucide-react';

interface Props {
  selectedMonth?: string;
}

type SortColumn =
  | 'rank'
  | 'name'
  | 'visits'
  | 'marketShare'
  | 'median2026'
  | 'delta2026'
  | 'pctDelta2026';

const STORAGE_KEY = 'vne_market_visits_similarweb_v3';

export const VietnamMarketOverviewView: React.FC<Props> = ({
  selectedMonth: initialMonth = '8/2026',
}) => {
  // Normalize initial month to one available in 2026, default '8/2026'
  const defaultMonth = MARKET_2026_MONTHS.includes(initialMonth) ? initialMonth : '8/2026';
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
  const [publisherSearch, setPublisherSearch] = useState<string>('');
  const [sortField, setSortField] = useState<SortColumn>('visits');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [chartViewMode, setChartViewMode] = useState<'market' | 'top5'>('market');

  // Editable publisher records state (persisted to localStorage)
  const [publishersData, setPublishersData] = useState<PublisherVisitRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return VIETNAM_PUBLISHERS_VISITS;
  });

  // State for data refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saveToast, setSaveToast] = useState<{ show: boolean; message: string }>({
    show: false,
    message: '',
  });

  // Handle refresh data from Similarweb source / reset cache
  const handleRefreshData = () => {
    setIsRefreshing(true);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    // Refresh with fresh copy of Similarweb publisher visits
    setPublishersData([...VIETNAM_PUBLISHERS_VISITS]);

    setTimeout(() => {
      setIsRefreshing(false);
      setSaveToast({
        show: true,
        message: 'Đã làm mới dữ liệu Similarweb thành công!',
      });
      setTimeout(() => setSaveToast({ show: false, message: '' }), 2500);
    }, 400);
  };

  // Dynamically calculate Total Market Median 2026 from all publishers' monthly visits
  const totalMarketMedian2026 = useMemo(() => {
    return calculateTotalMarket2026Median(publishersData);
  }, [publishersData]);

  // Process data for the selected month comparing vs 2026 median
  const processedData = useMemo(() => {
    // 1. Calculate each publisher's stats and comparison to 2026 Median
    const rawItems = publishersData.map((pub) => {
      const visits = pub.monthlyVisits[selectedMonth] ?? 0;
      const median2026 = calculate2026MedianVisit(pub.monthlyVisits);
      const delta2026 = visits - median2026;
      const pctDelta2026 = median2026 > 0 ? (delta2026 / median2026) * 100 : 0;

      return {
        ...pub,
        visits,
        median2026,
        delta2026,
        pctDelta2026,
      };
    });

    // 2. Total market visits for this month
    const totalMarketVisits = rawItems.reduce((acc, p) => acc + p.visits, 0);

    // 3. Market delta vs 2026 Median (407,668,658)
    const totalDelta2026 = totalMarketVisits - totalMarketMedian2026;
    const totalPctDelta2026 =
      totalMarketMedian2026 > 0 ? (totalDelta2026 / totalMarketMedian2026) * 100 : 0;

    // 4. Sort by visits descending to attach ranks and calculate market share
    const sortedByVisits = [...rawItems].sort((a, b) => b.visits - a.visits);

    const rankedItems = sortedByVisits.map((item, index) => ({
      ...item,
      rank: index + 1,
      marketShare: totalMarketVisits > 0 ? (item.visits / totalMarketVisits) * 100 : 0,
    }));

    return {
      items: rankedItems,
      totalMarketVisits,
      totalMarketMedian2026,
      totalDelta2026,
      totalPctDelta2026,
    };
  }, [publishersData, selectedMonth, totalMarketMedian2026]);

  // VnExpress specific record
  const vnExpressItem = useMemo(() => {
    return processedData.items.find((p) => p.id === 'vnexpress');
  }, [processedData]);

  // Trendline Chart Data (1/2026 to 8/2026)
  const trendChartData = useMemo(() => {
    return MARKET_2026_MONTHS.map((m) => {
      const monthTotal = publishersData.reduce(
        (sum, pub) => sum + (pub.monthlyVisits[m] ?? 0),
        0
      );

      const vne = publishersData.find((p) => p.id === 'vnexpress')?.monthlyVisits[m] ?? 0;
      const dantri = publishersData.find((p) => p.id === 'dantri')?.monthlyVisits[m] ?? 0;
      const b24h = publishersData.find((p) => p.id === '24h')?.monthlyVisits[m] ?? 0;
      const tuoitre = publishersData.find((p) => p.id === 'tuoitre')?.monthlyVisits[m] ?? 0;
      const thanhnien = publishersData.find((p) => p.id === 'thanhnien')?.monthlyVisits[m] ?? 0;

      return {
        monthKey: m,
        label: `Tháng ${m}`,
        shortLabel: `T${m.split('/')[0]}`,
        totalMarket: monthTotal,
        median2026: totalMarketMedian2026,
        vnexpress: vne,
        dantri,
        b24h,
        tuoitre,
        thanhnien,
      };
    });
  }, [publishersData, totalMarketMedian2026]);

  // Filter and sort items for the table
  const displayedPublishers = useMemo(() => {
    let list = [...processedData.items];

    // Search filter
    if (publisherSearch.trim()) {
      const q = publisherSearch.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.domain.toLowerCase().includes(q) ||
          p.shortName.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      switch (sortField) {
        case 'rank':
          valA = a.rank;
          valB = b.rank;
          break;
        case 'name':
          return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        case 'visits':
          valA = a.visits;
          valB = b.visits;
          break;
        case 'marketShare':
          valA = a.marketShare;
          valB = b.marketShare;
          break;
        case 'median2026':
          valA = a.median2026;
          valB = b.median2026;
          break;
        case 'delta2026':
          valA = a.delta2026;
          valB = b.delta2026;
          break;
        case 'pctDelta2026':
          valA = a.pctDelta2026;
          valB = b.pctDelta2026;
          break;
        default:
          valA = a.visits;
          valB = b.visits;
      }

      return sortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [processedData, publisherSearch, sortField, sortAsc]);

  const handleSort = (field: SortColumn) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getSortIndicator = (field: SortColumn) => {
    if (sortField !== field) return null;
    return <span className="ml-1 text-[10px] text-slate-500 font-mono">{sortAsc ? '▲' : '▼'}</span>;
  };

  return (
    <div className="space-y-5">
      {/* Refresh Notification Toast */}
      {saveToast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{saveToast.message}</span>
        </div>
      )}

      {/* 1. Header & Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Tổng Quan Thị Trường Báo Chí Việt Nam
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Chỉ số Visit (Lượt truy cập)
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đối sánh Trung vị 2026: {formatNumber(totalMarketMedian2026)}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Tháng {selectedMonth}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Thống kê số lượt truy cập (Visits), quy mô thị phần và đối sánh với mốc Trung vị 2026 của các cơ quan báo chí điện tử Việt Nam.
            </p>
          </div>

          {/* Month Selector & Quick Edit Button */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <label htmlFor="select-market-month" className="text-[11px] text-slate-500 font-semibold whitespace-nowrap">
                Kỳ phân tích:
              </label>
              <select
                id="select-market-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-slate-900 text-xs font-bold focus:outline-none cursor-pointer"
              >
                {[...MARKET_2026_MONTHS].reverse().map((m) => (
                  <option key={m} value={m}>
                    Tháng {m} {m === '8/2026' ? '(Mới nhất)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Button to refresh data from Similarweb */}
            <button
              type="button"
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-lg transition border border-blue-200 cursor-pointer shadow-2xs disabled:opacity-50"
              title="Làm mới lại dữ liệu Similarweb chuẩn xác"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Đang làm mới...' : 'Làm mới dữ liệu'}</span>
            </button>
          </div>
        </div>

        {/* 2 Focused Scorecards: Tổng Lượt Visit Toàn Thị Trường & Lượt Visit VnExpress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
          {/* Card 1: Tổng Lượt Visit Toàn Thị Trường */}
          <div className="bg-slate-50/70 rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-800 tracking-tight">
                  Tổng Lượt Visit Toàn Thị Trường
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/80">
                  Tháng {selectedMonth}
                </span>
              </div>

              {/* Số của tháng đó */}
              <div className="my-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {formatNumber(processedData.totalMarketVisits)}
                </span>
                <span className="text-xs font-semibold text-slate-500 font-sans">lượt visit</span>
              </div>
            </div>

            {/* Chi tiết: Trung vị 2026 = 407.668.658, Độ lệch tuyệt đối, % Lệch vs Trung vị */}
            <div className="border-t border-slate-200/80 pt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="block text-[11px] text-slate-500 font-medium">Trung vị 2026:</span>
                <span className="font-bold text-slate-900 font-mono text-xs sm:text-[13px]">
                  {formatNumber(totalMarketMedian2026)}
                </span>
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 font-medium">Độ lệch tuyệt đối:</span>
                <span
                  className={`font-bold font-mono text-xs sm:text-[13px] ${
                    processedData.totalDelta2026 >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {formatDelta(processedData.totalDelta2026)}
                </span>
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 font-medium">% Lệch vs Trung vị:</span>
                <span
                  className={`font-bold font-mono text-xs sm:text-[13px] ${
                    processedData.totalDelta2026 >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {formatPercent(processedData.totalPctDelta2026)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Lượt Visit VnExpress */}
          <div className="bg-slate-50/70 rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-800 tracking-tight">
                  Lượt Visit VnExpress
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold text-red-700 bg-red-50 border border-red-200">
                    #1 Toàn ngành
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200">
                    Thị phần {vnExpressItem ? vnExpressItem.marketShare.toFixed(2) : '0'}%
                  </span>
                </div>
              </div>

              {/* Số của tháng đó */}
              <div className="my-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {vnExpressItem ? formatNumber(vnExpressItem.visits) : '0'}
                </span>
                <span className="text-xs font-semibold text-slate-500 font-sans">lượt visit</span>
              </div>
            </div>

            {/* Chi tiết: Trung vị 2026, Độ lệch tuyệt đối, % Lệch vs Trung vị 2026 */}
            <div className="border-t border-slate-200/80 pt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="block text-[11px] text-slate-500 font-medium">Trung vị 2026:</span>
                <span className="font-bold text-slate-900 font-mono text-xs sm:text-[13px]">
                  {vnExpressItem ? formatNumber(vnExpressItem.median2026) : '0'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 font-medium">Độ lệch tuyệt đối:</span>
                <span
                  className={`font-bold font-mono text-xs sm:text-[13px] ${
                    (vnExpressItem?.delta2026 ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {vnExpressItem ? formatDelta(vnExpressItem.delta2026) : '0'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] text-slate-500 font-medium">% Lệch vs Trung vị:</span>
                <span
                  className={`font-bold font-mono text-xs sm:text-[13px] ${
                    (vnExpressItem?.delta2026 ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {vnExpressItem ? formatPercent(vnExpressItem.pctDelta2026) : '0%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Chart Đường Xu Hướng (Trendline Chart) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Biểu Đồ Đường Xu Hướng Lượt Truy Cập (Năm 2026)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quỹ đạo phát triển lượt visit qua các tháng năm 2026 đối sánh với mốc Trung vị 2026 ({formatNumber(totalMarketMedian2026)})
            </p>
          </div>

          {/* Toggle view mode */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200/70">
            <button
              type="button"
              onClick={() => setChartViewMode('market')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                chartViewMode === 'market'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toàn thị trường
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('top5')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                chartViewMode === 'top5'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Top 5 báo dẫn đầu
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="w-full h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartViewMode === 'market' ? (
              <LineChart data={trendChartData} margin={{ top: 15, right: 25, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                  domain={['dataMin - 15000000', 'dataMax + 15000000']}
                />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    const num = Number(value) || 0;
                    if (name === 'totalMarket') return [formatNumber(num) + ' visits', 'Tổng thị trường'];
                    if (name === 'median2026') return [formatNumber(num) + ' visits', 'Mốc Trung vị 2026'];
                    return [formatNumber(num) + ' visits', name];
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend
                  formatter={(value) => {
                    if (value === 'totalMarket') return 'Lượt Visit Toàn Thị Trường';
                    if (value === 'median2026') return `Chuẩn Trung vị 2026 (${formatNumber(totalMarketMedian2026)})`;
                    return value;
                  }}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <ReferenceLine
                  y={totalMarketMedian2026}
                  stroke="#64748b"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  label={{
                    value: `Trung vị 2026: ${formatNumber(totalMarketMedian2026)}`,
                    position: 'insideTopRight',
                    fill: '#475569',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="totalMarket"
                  name="totalMarket"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, stroke: '#1d4ed8', strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <LineChart data={trendChartData} margin={{ top: 15, right: 25, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    const num = Number(value) || 0;
                    return [formatNumber(num) + ' visits', name];
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="vnexpress"
                  name="VnExpress"
                  stroke="#9f224e"
                  strokeWidth={3}
                  dot={{ r: 3.5, fill: '#9f224e' }}
                />
                <Line
                  type="monotone"
                  dataKey="dantri"
                  name="Dân Trí"
                  stroke="#008837"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#008837' }}
                />
                <Line
                  type="monotone"
                  dataKey="b24h"
                  name="Báo 24h"
                  stroke="#e31b23"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#e31b23' }}
                />
                <Line
                  type="monotone"
                  dataKey="tuoitre"
                  name="Tuổi Trẻ"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0284c7' }}
                />
                <Line
                  type="monotone"
                  dataKey="thanhnien"
                  name="Thanh Niên"
                  stroke="#d97706"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#d97706' }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Main Table: Bảng Xếp Hạng Thị Phần & Đối Sánh Với Mốc Trung Vị 2026 */}
      {/* Tuân thủ yêu cầu: Bỏ các Icon, Bỏ Phân nhóm, Bỏ bar Thị phần visit */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Bảng Xếp Hạng Thị Phần & Đối Sánh Với Mốc Trung Vị 2026
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chỉ số lượt truy cập (Visits), tỷ trọng thị phần Tháng {selectedMonth} và so sánh với mốc Trung vị 2026 của từng báo
            </p>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={publisherSearch}
              onChange={(e) => setPublisherSearch(e.target.value)}
              placeholder="Tìm tên báo, tên miền..."
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:bg-white focus:border-blue-500 w-52 sm:w-64 transition"
            />
          </div>
        </div>

        {/* Table: Không Icon, Không Phân nhóm, Không bar Thị phần */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th
                  className="py-3 px-3.5 cursor-pointer hover:text-slate-900 select-none w-16"
                  onClick={() => handleSort('rank')}
                >
                  Hạng {getSortIndicator('rank')}
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => handleSort('name')}
                >
                  Cơ quan báo chí {getSortIndicator('name')}
                </th>
                <th
                  className="py-3 px-3.5 text-right cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => handleSort('visits')}
                >
                  Lượt Visit ({selectedMonth}) {getSortIndicator('visits')}
                </th>
                <th
                  className="py-3 px-3.5 text-right cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => handleSort('marketShare')}
                >
                  Thị phần Visit {getSortIndicator('marketShare')}
                </th>
                <th
                  className="py-3 px-3.5 text-right cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => handleSort('median2026')}
                >
                  Trung vị 2026 {getSortIndicator('median2026')}
                </th>
                <th
                  className="py-3 px-3.5 text-right cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => handleSort('delta2026')}
                >
                  Độ lệch tuyệt đối {getSortIndicator('delta2026')}
                </th>
                <th
                  className="py-3 px-3.5 text-right cursor-pointer hover:text-slate-900 select-none"
                  onClick={() => handleSort('pctDelta2026')}
                >
                  % Lệch vs Trung vị 2026 {getSortIndicator('pctDelta2026')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedPublishers.map((p) => {
                const isVnE = p.id === 'vnexpress';

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50 transition ${
                      isVnE ? 'bg-amber-50/40 font-medium' : ''
                    }`}
                  >
                    {/* Rank (No icon, clean number) */}
                    <td className="py-3 px-3.5 font-bold text-slate-700">
                      {p.rank}
                    </td>

                    {/* Publisher name & domain (No icon, clean text) */}
                    <td className="py-3 px-3">
                      <div>
                        <div className="font-bold text-slate-900">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {p.domain}
                        </div>
                      </div>
                    </td>

                    {/* Visits */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                      {formatNumber(p.visits)}
                    </td>

                    {/* Market Share % (No bar, clean number only) */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-blue-700">
                      {p.marketShare.toFixed(2)}%
                    </td>

                    {/* Median 2026 */}
                    <td className="py-3 px-3.5 text-right font-mono font-semibold text-slate-700">
                      {formatNumber(p.median2026)}
                    </td>

                    {/* Absolute Delta vs Median 2026 (No icon) */}
                    <td
                      className={`py-3 px-3.5 text-right font-mono font-bold ${
                        p.delta2026 >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatDelta(p.delta2026)}
                    </td>

                    {/* % Delta vs Median 2026 (No icon) */}
                    <td
                      className={`py-3 px-3.5 text-right font-mono font-bold ${
                        p.delta2026 >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatPercent(p.pctDelta2026)}
                    </td>
                  </tr>
                );
              })}

              {displayedPublishers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Không tìm thấy cơ quan báo chí phù hợp với từ khóa tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="border-t-2 border-slate-300 bg-slate-50/90 font-semibold text-xs text-slate-800">
              <tr>
                <td className="py-3 px-3.5 text-center font-bold text-slate-500">—</td>
                <td className="py-3 px-3 font-bold text-slate-900">
                  Tổng toàn thị trường ({displayedPublishers.length} báo)
                </td>
                <td className="py-3 px-3.5 text-right font-mono font-extrabold text-slate-900">
                  {formatNumber(processedData.totalMarketVisits)}
                </td>
                <td className="py-3 px-3.5 text-right font-mono font-bold text-blue-700">
                  100.00%
                </td>
                <td className="py-3 px-3.5 text-right font-mono font-extrabold text-slate-800">
                  {formatNumber(totalMarketMedian2026)}
                </td>
                <td
                  className={`py-3 px-3.5 text-right font-mono font-extrabold ${
                    processedData.totalDelta2026 >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {formatDelta(processedData.totalDelta2026)}
                </td>
                <td
                  className={`py-3 px-3.5 text-right font-mono font-extrabold ${
                    processedData.totalDelta2026 >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {formatPercent(processedData.totalPctDelta2026)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer note for table */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 pt-1 gap-2">
          <span>
            Hiển thị <strong>{displayedPublishers.length}</strong> cơ quan báo chí điện tử hàng đầu
          </span>
          <div className="flex items-center gap-2 font-mono text-slate-500">
            <span>Tổng Visit toàn thị trường ({selectedMonth}):</span>
            <strong className="text-slate-900 font-bold">{formatNumber(processedData.totalMarketVisits)}</strong>
            <span className="text-slate-300">|</span>
            <span>Trung vị 2026 thị trường:</span>
            <strong className="text-slate-900 font-bold">{formatNumber(totalMarketMedian2026)}</strong>
            <span className="text-slate-300">|</span>
            <span>VnExpress:</span>
            <strong className="text-red-700 font-bold">{formatNumber(vnExpressItem?.visits ?? 0)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
