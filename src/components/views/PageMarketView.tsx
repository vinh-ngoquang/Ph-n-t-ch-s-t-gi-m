import React, { useState } from 'react';
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
import { MonthlyDataPoint, analyzeDimensionSeries } from '../../utils/timeSeriesAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../../utils/formatters';
import { LineChart as LineChartIcon } from 'lucide-react';
import { NewsRecord } from '../../types';

interface Props {
  monthlyData: MonthlyDataPoint[];
  selectedMonth?: string;
}

export const PageMarketView: React.FC<Props> = ({ monthlyData, selectedMonth }) => {
  const [showPageChart, setShowPageChart] = useState(false);
  const [showMarketChart, setShowMarketChart] = useState(false);

  // Config for Page Types
  const pageTypeConfig: { key: keyof NewsRecord; code: string; name: string; color: string }[] = [
    { key: 'pDetail', code: 'P_Detail', name: 'Trang Bài viết (Detail)', color: '#10b981' },
    { key: 'pListing', code: 'P_Listing', name: 'Trang Danh mục (Listing)', color: '#3b82f6' },
  ];
  const pageTypeSummary = analyzeDimensionSeries(monthlyData, pageTypeConfig, 'pageviews', selectedMonth);

  // Config for Markets
  const marketConfig: { key: keyof NewsRecord; code: string; name: string; color: string }[] = [
    { key: 'pDO', code: 'M_Domestic', name: 'Trong nước (Domestic - DO)', color: '#0ea5e9' },
    { key: 'pOV', code: 'M_Overseas', name: 'Nước ngoài (Overseas - OV)', color: '#f59e0b' },
  ];
  const marketSummary = analyzeDimensionSeries(monthlyData, marketConfig, 'pageviews', selectedMonth);

  // Charts data
  const pageChartData = pageTypeSummary.trendSeries.map((item) => ({
    month: item.shortLabel,
    'P_Detail': Number(((item.pDetail || 0) / 1_000_000).toFixed(2)),
    'P_Listing': Number(((item.pListing || 0) / 1_000_000).toFixed(2)),
  }));

  const marketChartData = marketSummary.trendSeries.map((item) => ({
    month: item.shortLabel,
    'M_Domestic': Number(((item.pDO || 0) / 1_000_000).toFixed(2)),
    'M_Overseas': Number(((item.pOV || 0) / 1_000_000).toFixed(2)),
  }));

  const maxPageAbsDeficit = Math.max(...pageTypeSummary.rows.map((r) => Math.abs(r.deltaMedian)), 1);
  const maxMarketAbsDeficit = Math.max(...marketSummary.rows.map((r) => Math.abs(r.deltaMedian)), 1);

  return (
    <div className="space-y-6">
      {/* SECTION 1: LỚP TRANG (PAGE LAYERS) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Động thái & Phân Bố Lớp Trang (Page Layers: Listing vs Detail)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tỷ lệ độc giả đọc thẳng bài viết chi tiết (Detail) so với xem trang danh sách chuyên mục (Listing)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={() => setShowPageChart(!showPageChart)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                showPageChart
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>{showPageChart ? 'Ẩn Biểu đồ Xu hướng' : 'Hiện Biểu đồ Xu hướng'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Chart */}
        {showPageChart && (
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 transition-all">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-slate-800">
                Xu hướng lưu lượng giữa Detail vs Listing qua 8 tháng (Triệu PV)
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
                <th className="py-3 px-4 text-right font-sans">Tỷ Trọng Tháng Này</th>
                <th className="py-3 px-4 text-right font-sans">
                  {selectedMonth ? `Tháng ${selectedMonth}` : 'Tháng Này (Tháng 8)'}
                </th>
                <th className="py-3 px-4 text-right font-sans">Mốc Trung Vị (2026)</th>
                <th className="py-3 px-4 text-right font-sans min-w-[200px]">Lệch vs. Trung Vị</th>
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
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg?.color }} />
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
                      <div className="text-[10px] text-slate-400 font-sans">Chuẩn 2026</div>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: THỊ TRƯỜNG ĐỊA LÝ (MARKETS) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Động thái & Phân Bố Thị Trường (Markets: Domestic vs Overseas)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cán cân người đọc trong nước (DO) và độc giả kiều bào / quốc tế (OV)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={() => setShowMarketChart(!showMarketChart)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                showMarketChart
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>{showMarketChart ? 'Ẩn Biểu đồ Xu hướng' : 'Hiện Biểu đồ Xu hướng'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Chart */}
        {showMarketChart && (
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 transition-all">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold text-slate-800">
                Xu hướng lưu lượng theo thị trường qua 8 tháng (Triệu PV)
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
                <th className="py-3 px-4 text-right font-sans">Tỷ Trọng Tháng Này</th>
                <th className="py-3 px-4 text-right font-sans">
                  {selectedMonth ? `Tháng ${selectedMonth}` : 'Tháng Này (Tháng 8)'}
                </th>
                <th className="py-3 px-4 text-right font-sans">Mốc Trung Vị (2026)</th>
                <th className="py-3 px-4 text-right font-sans min-w-[200px]">Lệch vs. Trung Vị</th>
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
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg?.color }} />
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
                      <div className="text-[10px] text-slate-400 font-sans">Chuẩn 2026</div>
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
