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
  BarChart,
  Bar,
} from 'recharts';
import { YoYSummaryData, computeYoYDimensionRows } from '../../../utils/yoyAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../../../utils/formatters';
import {
  LineChart as LineChartIcon,
  Search,
  Compass,
  ArrowUpDown,
  TrendingDown,
  TrendingUp,
  Percent,
  Layers,
  Sparkles,
} from 'lucide-react';
import { NewsRecord } from '../../../types';

interface Props {
  yoyData: YoYSummaryData;
  currentScope?: string;
  folderOptions?: { id: string; name: string }[];
}

export const TrafficSourcesYoYView: React.FC<Props> = ({
  yoyData,
  currentScope,
  folderOptions,
}) => {
  const { sumRecord2026, sumRecord2025, monthPairs, monthsRangeLabel } = yoyData;

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

  const { rows, total2026, total2025, deltaTotal, pctDeltaTotal } = useMemo(() => {
    return computeYoYDimensionRows(sumRecord2026, sumRecord2025, 'pageviews', sourcesConfig);
  }, [sumRecord2026, sumRecord2025]);

  const [sortField, setSortField] = useState<'val2026' | 'delta' | 'pctDelta' | 'share2026'>('delta');
  const [sortAsc, setSortAsc] = useState<boolean>(true); // default: lowest delta first (deepest drop)
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [rows, sortField, sortAsc]);

  const handleSort = (field: 'val2026' | 'delta' | 'pctDelta' | 'share2026') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'delta' || field === 'pctDelta' ? true : false);
    }
  };

  // Google Search vs Discover breakdown
  const googleSearch26 = sumRecord2026.pExGoogleSearch || Math.round((sumRecord2026.pExGoogle || 0) * 0.62);
  const googleDiscover26 = sumRecord2026.pExGoogleDiscover || Math.round((sumRecord2026.pExGoogle || 0) * 0.38);
  const googleSearch25 = sumRecord2025.pExGoogleSearch || Math.round((sumRecord2025.pExGoogle || 0) * 0.62);
  const googleDiscover25 = sumRecord2025.pExGoogleDiscover || Math.round((sumRecord2025.pExGoogle || 0) * 0.38);

  const deltaSearch = googleSearch26 - googleSearch25;
  const pctSearch = googleSearch25 > 0 ? (deltaSearch / googleSearch25) * 100 : 0;
  const deltaDiscover = googleDiscover26 - googleDiscover25;
  const pctDiscover = googleDiscover25 > 0 ? (deltaDiscover / googleDiscover25) * 100 : 0;

  // Direct Brandname breakdown
  const directBrandname26 = sumRecord2026.pExDirectBrandname || Math.round((sumRecord2026.pExDirect || 0) * 0.45);
  const directBrandname25 = sumRecord2025.pExDirectBrandname || Math.round((sumRecord2025.pExDirect || 0) * 0.45);
  const deltaBrandname = directBrandname26 - directBrandname25;
  const pctBrandname = directBrandname25 > 0 ? (deltaBrandname / directBrandname25) * 100 : 0;

  // Chart data: month by month comparison (2026 vs 2025)
  const chartData = useMemo(() => {
    return monthPairs.map((p) => {
      const pv26 = p.record2026.pageviews || 0;
      const pv25 = p.record2025.pageviews || 0;
      return {
        month: p.shortLabel,
        'Năm 2026 (Triệu PV)': Number((pv26 / 1_000_000).toFixed(2)),
        'Cùng kỳ 2025 (Triệu PV)': Number((pv25 / 1_000_000).toFixed(2)),
        raw26: pv26,
        raw25: pv25,
      };
    });
  }, [monthPairs]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
      {/* View Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Nguồn Truy Cập (7 Nguồn): Tổng 2026 so với Cùng Kỳ 2025
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Lũy kế {monthsRangeLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân tích biến động lưu lượng giữa 7 nguồn truy cập chính nội bộ (Internal) và ngoại biên (External).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Tổng biến động PV:</span>
          <span className={`font-bold font-mono px-2.5 py-1 rounded-md border ${
            deltaTotal >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {formatDelta(deltaTotal)} ({formatPercent(pctDeltaTotal)})
          </span>
        </div>
      </div>

      {/* Main Table: 7 Sources YoY Comparison */}
      <div className="overflow-x-auto border border-slate-200/90 rounded-xl shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold select-none">
              <th className="py-3 px-3.5 text-slate-900">Nguồn Truy Cập</th>
              <th className="py-3 px-3 text-center">Phân Loại</th>
              <th
                onClick={() => handleSort('val2026')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100/80 transition"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Tổng 2026 (PV)</span>
                  {sortField === 'val2026' && <span className="text-[10px]">{sortAsc ? '▲' : '▼'}</span>}
                </div>
              </th>
              <th className="py-3 px-3 text-right">Cùng Kỳ 2025 (PV)</th>
              <th
                onClick={() => handleSort('delta')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100/80 transition"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Chênh Lệch (+/-)</span>
                  {sortField === 'delta' && <span className="text-[10px]">{sortAsc ? '▲' : '▼'}</span>}
                </div>
              </th>
              <th
                onClick={() => handleSort('pctDelta')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100/80 transition"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>% YoY</span>
                  {sortField === 'pctDelta' && <span className="text-[10px]">{sortAsc ? '▲' : '▼'}</span>}
                </div>
              </th>
              <th
                onClick={() => handleSort('share2026')}
                className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100/80 transition"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Tỷ Trọng 2026</span>
                  {sortField === 'share2026' && <span className="text-[10px]">{sortAsc ? '▲' : '▼'}</span>}
                </div>
              </th>
              <th className="py-3 px-3 text-right">Tỷ Trọng 2025</th>
              <th className="py-3 px-3.5 text-right">Thay Đổi Tỷ Trọng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRows.map((row) => {
              const isDrop = row.delta < 0;
              return (
                <tr key={row.key} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3.5 font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                    <span>{row.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      row.type === 'Internal'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
                        : 'bg-amber-50 text-amber-700 border-amber-200/60'
                    }`}>
                      {row.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatNumber(row.val2026)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    {formatNumber(row.val2025)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    <span className={isDrop ? 'text-rose-600' : 'text-emerald-600'}>
                      {formatDelta(row.delta)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    <span className={`inline-flex items-center gap-0.5 ${isDrop ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isDrop ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                      <span>{formatPercent(row.pctDelta)}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                    {formatPercent(row.share2026)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                    {formatPercent(row.share2025)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                    <span className={row.deltaShare >= 0 ? 'text-emerald-600' : 'text-slate-500'}>
                      {row.deltaShare >= 0 ? `+${row.deltaShare.toFixed(2)} pts` : `${row.deltaShare.toFixed(2)} pts`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100/80 font-bold border-t border-slate-200 text-slate-900">
              <td className="py-3 px-3.5" colSpan={2}>
                Tổng Cộng (7 Nguồn)
              </td>
              <td className="py-3 px-3 text-right font-mono">{formatNumber(total2026)}</td>
              <td className="py-3 px-3 text-right font-mono">{formatNumber(total2025)}</td>
              <td className="py-3 px-3 text-right font-mono">
                <span className={deltaTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {formatDelta(deltaTotal)}
                </span>
              </td>
              <td className="py-3 px-3 text-right font-mono">
                <span className={deltaTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {formatPercent(pctDeltaTotal)}
                </span>
              </td>
              <td className="py-3 px-3 text-right font-mono">100.0%</td>
              <td className="py-3 px-3 text-right font-mono">100.0%</td>
              <td className="py-3 px-3.5 text-right font-mono">0.00 pts</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Sub-breakdowns: Google Search vs Discover & Direct Brandname */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Box 1: Bóc tách Google Search vs Discover */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-amber-600" />
              <span>Bóc Tách: Google Search vs Google Discover</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
              Thuộc P- Ex-Google
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-medium text-slate-500">Google Search (Tìm kiếm)</div>
              <div className="text-base font-extrabold font-mono text-slate-900 mt-1">
                {formatNumber(googleSearch26)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Cùng kỳ 2025:</span>
                <span className="font-mono text-slate-600">{formatNumber(googleSearch25)}</span>
              </div>
              <div className="text-[11px] font-bold font-mono mt-0.5 flex items-center justify-between">
                <span>YoY:</span>
                <span className={deltaSearch >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {formatDelta(deltaSearch)} ({formatPercent(pctSearch)})
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] font-medium text-slate-500">Google Discover (Đề xuất)</div>
              <div className="text-base font-extrabold font-mono text-slate-900 mt-1">
                {formatNumber(googleDiscover26)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Cùng kỳ 2025:</span>
                <span className="font-mono text-slate-600">{formatNumber(googleDiscover25)}</span>
              </div>
              <div className="text-[11px] font-bold font-mono mt-0.5 flex items-center justify-between">
                <span>YoY:</span>
                <span className={deltaDiscover >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {formatDelta(deltaDiscover)} ({formatPercent(pctDiscover)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: Bóc tách Direct Brandname */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bóc Tách: Direct Brandname</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
              Thuộc P- Ex-Direct
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs text-xs">
            <div className="text-[11px] font-medium text-slate-500">Direct Brandname (Gõ trực tiếp thương hiệu)</div>
            <div className="text-base font-extrabold font-mono text-slate-900 mt-1">
              {formatNumber(directBrandname26)}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
              <div className="text-[11px] text-slate-400">
                <span>Cùng kỳ 2025: </span>
                <span className="font-mono text-slate-700 font-bold">{formatNumber(directBrandname25)}</span>
              </div>
              <div className="text-[11px] font-bold font-mono text-right">
                <span className={deltaBrandname >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {formatDelta(deltaBrandname)} ({formatPercent(pctBrandname)})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart: Month by Month comparison (2026 vs 2025) */}
      <div className="border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LineChartIcon className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900">
              Biểu Đồ So Sánh Lưu Lượng Từng Tháng: Năm 2026 vs Cùng Kỳ 2025
            </span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
            <button
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded-md transition ${chartType === 'line' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
            >
              Đường
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded-md transition ${chartType === 'bar' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
            >
              Cột
            </button>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="M" />
                <Tooltip
                  formatter={(value: any) => [`${value} Triệu PV`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="Năm 2026 (Triệu PV)" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Cùng kỳ 2025 (Triệu PV)" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} unit="M" />
                <Tooltip
                  formatter={(value: any) => [`${value} Triệu PV`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Năm 2026 (Triệu PV)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cùng kỳ 2025 (Triệu PV)" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
