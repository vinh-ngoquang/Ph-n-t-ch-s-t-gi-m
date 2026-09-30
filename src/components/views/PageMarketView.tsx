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
} from 'recharts';
import { MonthlyDataPoint, analyzeDimensionSeries, analyzeDimensionSeriesYoY } from '../../utils/timeSeriesAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../../utils/formatters';
import { LineChart as LineChartIcon } from 'lucide-react';
import { NewsRecord } from '../../types';
import { YoYMonthlySparkline, YoYMonthlyPoint } from '../common/YoYMonthlySparkline';

interface Props {
  monthlyData: MonthlyDataPoint[];
  selectedMonth?: string;
  isYoYMode?: boolean;
}

export const PageMarketView: React.FC<Props> = ({ monthlyData, selectedMonth, isYoYMode }) => {
  const [showPageChart, setShowPageChart] = useState(false);
  const [showMarketChart, setShowMarketChart] = useState(false);

  // Helper YoY monthly series for Sparklines
  const months2026 = useMemo(() => monthlyData.filter((d) => d.year === 2026), [monthlyData]);
  const months2025 = useMemo(() => monthlyData.filter((d) => d.year === 2025), [monthlyData]);
  const availableMonthNums = useMemo(() => {
    return Array.from(new Set(months2026.map((d) => d.monthNum))).sort((a, b) => a - b);
  }, [months2026]);

  const getYoYSeries = (key: string): YoYMonthlyPoint[] => {
    return availableMonthNums.map((mNum) => {
      const d26 = months2026.find((d) => d.monthNum === mNum);
      const d25 = months2025.find((d) => d.monthNum === mNum);
      return {
        monthNum: mNum,
        monthLabel: `T${mNum}`,
        val2026: Number(d26?.record[key as keyof NewsRecord]) || 0,
        val2025: Number(d25?.record[key as keyof NewsRecord]) || 0,
      };
    });
  };

  // Config for Page Types
  const pageTypeConfig: { key: keyof NewsRecord; code: string; name: string; color: string }[] = useMemo(() => [
    { key: 'pDetail', code: 'P_Detail', name: 'Trang Bài viết (Detail)', color: '#10b981' },
    { key: 'pListing', code: 'P_Listing', name: 'Trang Danh mục (Listing)', color: '#3b82f6' },
  ], []);

  const pageTypeSummary = useMemo(() => {
    if (isYoYMode) {
      return analyzeDimensionSeriesYoY(monthlyData, pageTypeConfig, 'pageviews');
    }
    return analyzeDimensionSeries(monthlyData, pageTypeConfig, 'pageviews', selectedMonth);
  }, [monthlyData, selectedMonth, isYoYMode, pageTypeConfig]);

  // Config for Markets
  const marketConfig: { key: keyof NewsRecord; code: string; name: string; color: string }[] = useMemo(() => [
    { key: 'pDO', code: 'M_Domestic', name: 'Trong nước (Domestic - DO)', color: '#0ea5e9' },
    { key: 'pOV', code: 'M_Overseas', name: 'Nước ngoài (Overseas - OV)', color: '#f59e0b' },
  ], []);

  const marketSummary = useMemo(() => {
    if (isYoYMode) {
      return analyzeDimensionSeriesYoY(monthlyData, marketConfig, 'pageviews');
    }
    return analyzeDimensionSeries(monthlyData, marketConfig, 'pageviews', selectedMonth);
  }, [monthlyData, selectedMonth, isYoYMode, marketConfig]);

  // Charts data
  const pageChartData = pageTypeSummary.trendSeries.map((item) => ({
    month: isYoYMode ? (item.label || item.shortLabel) : item.shortLabel,
    'P_Detail': Number(((item.pDetail || 0) / 1_000_000).toFixed(2)),
    'P_Listing': Number(((item.pListing || 0) / 1_000_000).toFixed(2)),
  }));

  const marketChartData = marketSummary.trendSeries.map((item) => ({
    month: isYoYMode ? (item.label || item.shortLabel) : item.shortLabel,
    'M_Domestic': Number(((item.pDO || 0) / 1_000_000).toFixed(2)),
    'M_Overseas': Number(((item.pOV || 0) / 1_000_000).toFixed(2)),
  }));

  const maxPageAbsDeficit = Math.max(...pageTypeSummary.rows.map((r) => Math.abs(r.deltaMedian)), 1);
  const maxMarketAbsDeficit = Math.max(...marketSummary.rows.map((r) => Math.abs(r.deltaMedian)), 1);

  return (
    <div className="space-y-6">
      {/* SECTION 1: LỚP TRANG (PAGE LAYERS) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {isYoYMode
                  ? 'Động thái & Phân Bố Lớp Trang (Tổng 2026 vs Cùng kỳ 2025)'
                  : 'Động thái & Phân Bố Lớp Trang (Page Layers: Listing vs Detail)'}
              </h2>
            </div>
          </div>

          {/* Top Right: Toggle Trend Chart */}
          <button
            onClick={() => setShowPageChart(!showPageChart)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer shrink-0 self-start sm:self-center ${
              showPageChart
                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>{showPageChart ? 'Ẩn Biểu đồ Xu hướng' : 'Hiện Biểu đồ Xu hướng'}</span>
          </button>
        </div>

        {/* Collapsible Chart */}
        {showPageChart && (
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 transition-all">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-slate-800">
                {isYoYMode
                  ? 'Xu hướng lưu lượng giữa Detail vs Listing từ 2025 đến tháng mới nhất (Triệu PV)'
                  : 'Xu hướng lưu lượng giữa Detail vs Listing qua 8 tháng (Triệu PV)'}
              </span>
              <span className="text-slate-500 text-[11px]">Đơn vị: Triệu PV</span>
            </div>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pageChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${v}M`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '0.5rem',
                      color: '#0f172a',
                      fontSize: '11px',
                    }}
                    formatter={(val: any, name: any) => [`${val}M PV`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Line type="monotone" dataKey="P_Detail" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="P_Listing" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Page Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/90">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-sans">Lớp Trang (Page Layer)</th>
                <th className="py-3 px-4 text-right font-sans">
                  {isYoYMode ? 'Tỷ Trọng Tổng 2026' : 'Tỷ Trọng Tháng Này'}
                </th>
                <th className="py-3 px-4 text-right font-sans">
                  {isYoYMode
                    ? 'Tổng 2026'
                    : (selectedMonth ? `Tháng ${selectedMonth}` : 'Tháng Này (Tháng 8)')}
                </th>
                <th className="py-3 px-4 text-right font-sans">
                  {isYoYMode ? 'Cùng Kỳ 2025' : 'Mốc Trung Vị (2026)'}
                </th>
                <th className="py-3 px-4 text-right font-sans min-w-[200px]">
                  {isYoYMode ? 'Lệch vs. Cùng Kỳ' : 'Lệch vs. Trung Vị'}
                </th>
                {isYoYMode && (
                  <th className="py-3 px-3 text-center font-sans min-w-[155px]">
                    <div>Xu Hướng Tháng (YoY)</div>
                    <div className="text-[9px] font-normal text-slate-400 flex items-center justify-center gap-1 mt-0.5 whitespace-nowrap">
                      <span className="text-emerald-600 font-bold">● '26 &ge; '25</span>
                      <span>|</span>
                      <span className="text-rose-600 font-bold">● '26 &lt; '25</span>
                      <span>|</span>
                      <span className="text-slate-400">--- '25</span>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageTypeSummary.rows.map((row) => {
                const cfg = pageTypeConfig.find((p) => p.key === row.key);
                const isDrop = row.deltaMedian < 0;
                const barWidthPct = Math.min(100, Math.max(8, (Math.abs(row.deltaMedian) / maxPageAbsDeficit) * 100));

                return (
                  <tr key={row.key} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-sans font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{cfg?.code}</span>
                        <span className="text-slate-500 font-normal">({row.name.split('(')[0].trim()})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-slate-900">{formatPercent(row.shareT8, false)}</div>
                      <div className="text-[10px] text-slate-400 font-sans">Chuẩn: {formatPercent(row.shareMedian, false)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-slate-900">{formatNumber(row.t8)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-semibold text-slate-700">{formatNumber(row.median)}</div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {isYoYMode ? 'Cùng kỳ 2025' : 'Chuẩn 2026'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className={`font-bold ${isDrop ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatDelta(row.deltaMedian)} ({formatPercent(row.pctChangeMedian)})
                      </div>
                      <div className="w-full max-w-[170px] h-1.5 bg-slate-100 rounded-full overflow-hidden relative mt-1.5 ml-auto flex justify-end">
                        <div
                          className={`h-full rounded-full transition-all ${isDrop ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${barWidthPct}%` }}
                        />
                      </div>
                    </td>
                    {isYoYMode && (
                      <td className="py-3.5 px-3 text-center align-middle">
                        <YoYMonthlySparkline data={getYoYSeries(row.key as string)} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: THỊ TRƯỜNG ĐỊA LÝ (MARKETS) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {isYoYMode
                  ? 'Động thái & Phân Bố Thị Trường (Tổng 2026 vs Cùng kỳ 2025)'
                  : 'Động thái & Phân Bố Thị Trường (Markets: Domestic vs Overseas)'}
              </h2>
            </div>
          </div>

          {/* Top Right: Toggle Trend Chart */}
          <button
            onClick={() => setShowMarketChart(!showMarketChart)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer shrink-0 self-start sm:self-center ${
              showMarketChart
                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>{showMarketChart ? 'Ẩn Biểu đồ Xu hướng' : 'Hiện Biểu đồ Xu hướng'}</span>
          </button>
        </div>

        {/* Collapsible Chart */}
        {showMarketChart && (
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 transition-all">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-slate-800">
                {isYoYMode
                  ? 'Xu hướng lưu lượng theo thị trường từ 2025 đến tháng mới nhất (Triệu PV)'
                  : 'Xu hướng lưu lượng theo thị trường qua 8 tháng (Triệu PV)'}
              </span>
              <span className="text-slate-500 text-[11px]">Đơn vị: Triệu PV</span>
            </div>
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={marketChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${v}M`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '0.5rem',
                      color: '#0f172a',
                      fontSize: '11px',
                    }}
                    formatter={(val: any, name: any) => [`${val}M PV`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Line type="monotone" dataKey="M_Domestic" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="M_Overseas" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Market Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/90">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-sans">Thị Trường Địa Lý</th>
                <th className="py-3 px-4 text-right font-sans">
                  {isYoYMode ? 'Tỷ Trọng Tổng 2026' : 'Tỷ Trọng Tháng Này'}
                </th>
                <th className="py-3 px-4 text-right font-sans">
                  {isYoYMode
                    ? 'Tổng 2026'
                    : (selectedMonth ? `Tháng ${selectedMonth}` : 'Tháng Này (Tháng 8)')}
                </th>
                <th className="py-3 px-4 text-right font-sans">
                  {isYoYMode ? 'Cùng Kỳ 2025' : 'Mốc Trung Vị (2026)'}
                </th>
                <th className="py-3 px-4 text-right font-sans min-w-[200px]">
                  {isYoYMode ? 'Lệch vs. Cùng Kỳ' : 'Lệch vs. Trung Vị'}
                </th>
                {isYoYMode && (
                  <th className="py-3 px-3 text-center font-sans min-w-[155px]">
                    <div>Xu Hướng Tháng (YoY)</div>
                    <div className="text-[9px] font-normal text-slate-400 flex items-center justify-center gap-1 mt-0.5 whitespace-nowrap">
                      <span className="text-emerald-600 font-bold">● '26 &ge; '25</span>
                      <span>|</span>
                      <span className="text-rose-600 font-bold">● '26 &lt; '25</span>
                      <span>|</span>
                      <span className="text-slate-400">--- '25</span>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marketSummary.rows.map((row) => {
                const cfg = marketConfig.find((m) => m.key === row.key);
                const isDrop = row.deltaMedian < 0;
                const barWidthPct = Math.min(100, Math.max(8, (Math.abs(row.deltaMedian) / maxMarketAbsDeficit) * 100));

                return (
                  <tr key={row.key} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-sans font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{cfg?.code}</span>
                        <span className="text-slate-500 font-normal">({row.name.split('(')[0].trim()})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-slate-900">{formatPercent(row.shareT8, false)}</div>
                      <div className="text-[10px] text-slate-400 font-sans">Chuẩn: {formatPercent(row.shareMedian, false)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-slate-900">{formatNumber(row.t8)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-semibold text-slate-700">{formatNumber(row.median)}</div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {isYoYMode ? 'Cùng kỳ 2025' : 'Chuẩn 2026'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className={`font-bold ${isDrop ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatDelta(row.deltaMedian)} ({formatPercent(row.pctChangeMedian)})
                      </div>
                      <div className="w-full max-w-[170px] h-1.5 bg-slate-100 rounded-full overflow-hidden relative mt-1.5 ml-auto flex justify-end">
                        <div
                          className={`h-full rounded-full transition-all ${isDrop ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${barWidthPct}%` }}
                        />
                      </div>
                    </td>
                    {isYoYMode && (
                      <td className="py-3.5 px-3 text-center align-middle">
                        <YoYMonthlySparkline data={getYoYSeries(row.key as string)} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
