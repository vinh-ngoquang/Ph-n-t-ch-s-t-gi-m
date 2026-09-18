import React, { useMemo } from 'react';
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
import { YoYSummaryData, computeYoYDimensionRows } from '../../../utils/yoyAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../../../utils/formatters';
import { Smartphone, LineChart as LineChartIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { NewsRecord } from '../../../types';

interface Props {
  yoyData: YoYSummaryData;
}

export const PlatformsYoYView: React.FC<Props> = ({ yoyData }) => {
  const { sumRecord2026, sumRecord2025, monthPairs, monthsRangeLabel } = yoyData;

  const platformConfig: { key: keyof NewsRecord; code: string; name: string; type: string; color: string }[] = [
    { key: 'pMobile', code: 'Mobile', name: 'Mobile Web (Điện thoại)', type: 'Web Mobile', color: '#10b981' },
    { key: 'pPC', code: 'PC', name: 'PC Desktop (Máy tính)', type: 'Desktop', color: '#3b82f6' },
    { key: 'pApp', code: 'App', name: 'VnExpress App (Ứng dụng)', type: 'App Mobile', color: '#8b5cf6' },
    { key: 'pTablet', code: 'Tablet', name: 'Tablet (Máy tính bảng)', type: 'Tablet', color: '#f59e0b' },
  ];

  const { rows, total2026, total2025, deltaTotal, pctDeltaTotal } = useMemo(() => {
    return computeYoYDimensionRows(sumRecord2026, sumRecord2025, 'pageviews', platformConfig);
  }, [sumRecord2026, sumRecord2025]);

  const chartData = useMemo(() => {
    return monthPairs.map((p) => {
      const pt: any = { month: p.shortLabel };
      platformConfig.forEach((cfg) => {
        const v26 = (p.record2026[cfg.key] as number) || 0;
        pt[`${cfg.name} (2026)`] = Number((v26 / 1_000_000).toFixed(2));
      });
      return pt;
    });
  }, [monthPairs]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Nền Tảng Thiết Bị: Tổng 2026 so với Cùng Kỳ 2025
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Lũy kế {monthsRangeLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cơ cấu lưu lượng theo thiết bị truy cập: Mobile Web, Máy tính bàn (PC Desktop), Ứng dụng VnExpress App và Tablet.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Tổng thiết bị:</span>
          <span className={`font-bold font-mono px-2.5 py-1 rounded-md border ${
            deltaTotal >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {formatDelta(deltaTotal)} ({formatPercent(pctDeltaTotal)})
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto border border-slate-200/90 rounded-xl shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold select-none">
              <th className="py-3 px-3.5 text-slate-900">Nền Tảng Thiết Bị</th>
              <th className="py-3 px-3 text-center">Phân Loại</th>
              <th className="py-3 px-3 text-right">Tổng 2026 (PV)</th>
              <th className="py-3 px-3 text-right">Cùng Kỳ 2025 (PV)</th>
              <th className="py-3 px-3 text-right">Chênh Lệch (+/-)</th>
              <th className="py-3 px-3 text-right">% YoY</th>
              <th className="py-3 px-3 text-right">Tỷ Trọng 2026</th>
              <th className="py-3 px-3 text-right">Tỷ Trọng 2025</th>
              <th className="py-3 px-3.5 text-right">Thay Đổi Tỷ Trọng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const isDrop = row.delta < 0;
              return (
                <tr key={row.key} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3.5 font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                    <span>{row.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
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
                Tổng Nền Tảng
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

      {/* Monthly Chart */}
      <div className="border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <LineChartIcon className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-900">
            Diễn Biến Lưu Lượng Từng Nền Tảng Trong Năm 2026 (Triệu PV)
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} unit="M" />
              <Tooltip
                formatter={(value: any) => [`${value} Triệu PV`, '']}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              {platformConfig.map((cfg) => (
                <Line
                  key={cfg.key}
                  type="monotone"
                  dataKey={`${cfg.name} (2026)`}
                  stroke={cfg.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
