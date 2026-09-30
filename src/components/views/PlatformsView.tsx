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

export const PlatformsView: React.FC<Props> = ({ monthlyData, selectedMonth, isYoYMode }) => {
  const platformConfig: { key: keyof NewsRecord; code: string; name: string; type: string; color: string }[] = [
    { key: 'pMobile', code: 'Mobile', name: 'Mobile Web', type: 'Web', color: '#10b981' },
    { key: 'pPC', code: 'PC', name: 'PC Desktop', type: 'Desktop', color: '#3b82f6' },
    { key: 'pApp', code: 'App', name: 'VnExpress App', type: 'App', color: '#8b5cf6' },
    { key: 'pTablet', code: 'Tablet', name: 'Tablet', type: 'Tablet', color: '#f59e0b' },
    { key: 'pOtherPlatform', code: 'Other Platform', name: 'Other Platform', type: 'Other', color: '#64748b' },
  ];

  const summary = useMemo(() => {
    if (isYoYMode) {
      return analyzeDimensionSeriesYoY(monthlyData, platformConfig, 'pageviews');
    }
    return analyzeDimensionSeries(monthlyData, platformConfig, 'pageviews', selectedMonth);
  }, [monthlyData, selectedMonth, isYoYMode]);

  const [showChart, setShowChart] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>('pPC');

  const totalT8 = summary.totalT8;
  const totalMed = summary.totalMedian;
  const totalDeltaMed = totalT8 - totalMed;

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

  const getTotalSeries = (): YoYMonthlyPoint[] => {
    return availableMonthNums.map((mNum) => {
      const d26 = months2026.find((d) => d.monthNum === mNum);
      const d25 = months2025.find((d) => d.monthNum === mNum);
      const v26 = platformConfig.reduce((sum, p) => sum + (Number(d26?.record[p.key]) || 0), 0);
      const v25 = platformConfig.reduce((sum, p) => sum + (Number(d25?.record[p.key]) || 0), 0);
      return {
        monthNum: mNum,
        monthLabel: `T${mNum}`,
        val2026: v26,
        val2025: v25,
      };
    });
  };

  const processedRows = useMemo(() => {
    return summary.rows.map((row) => {
      const cfg = platformConfig.find((s) => s.key === row.key);
      return {
        ...row,
        code: cfg?.code || row.key,
        type: cfg?.type || 'Device',
        color: cfg?.color || '#64748b',
      };
    });
  }, [summary.rows]);

  const dropsOnly = processedRows.filter((r) => r.deltaMedian < 0);
  const deepestDrop = dropsOnly.length > 0
    ? [...dropsOnly].sort((a, b) => a.deltaMedian - b.deltaMedian)[0]
    : null;

  const maxAbsDeficit = Math.max(...processedRows.map((r) => Math.abs(r.deltaMedian)), 1);

  const chartData = useMemo(() => {
    return summary.trendSeries.map((item) => {
      const pt: any = {
        month: isYoYMode ? (item.label || item.shortLabel) : item.shortLabel,
      };
      platformConfig.forEach((p) => {
        pt[p.code] = Number(((item[p.key] || 0) / 1_000_000).toFixed(2));
      });
      return pt;
    });
  }, [summary.trendSeries, isYoYMode]);

  const dropSharePct = (deepestDrop && totalDeltaMed < 0)
    ? Math.round((deepestDrop.deltaMedian / totalDeltaMed) * 100)
    : 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      {/* 1. Header Bar with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {isYoYMode
                ? 'Động thái & Nguồn Sụt giảm Nền tảng (Tổng 2026 vs Cùng kỳ 2025)'
                : 'Động thái & Nguồn Sụt giảm Nền tảng (Platforms & Devices)'}
            </h2>
          </div>
        </div>

        {/* Top Right: Toggle Trend Chart */}
        <button
          onClick={() => setShowChart(!showChart)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer shrink-0 self-start sm:self-center ${
            showChart
              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
          }`}
        >
          <LineChartIcon className="w-3.5 h-3.5 text-blue-600" />
          <span>{showChart ? 'Ẩn Biểu đồ Xu hướng' : 'Hiện Biểu đồ Xu hướng'}</span>
        </button>
      </div>

      {/* 3. Collapsible Trend Line Chart */}
      {showChart && (
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 transition-all">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-800">
              {isYoYMode
                ? 'Đường xu hướng lượt xem trên từng nền tảng từ 2025 đến tháng mới nhất (Triệu PV)'
                : 'Đường xu hướng lượt xem trên từng nền tảng qua 8 tháng (Triệu PV)'}
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
                {platformConfig.map((p) => (
                  <Line
                    key={p.code}
                    type="monotone"
                    dataKey={p.code}
                    stroke={p.color}
                    strokeWidth={p.key === selectedKey ? 3.5 : 2}
                    dot={{ r: 3, fill: p.color }}
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
              <th className="py-3 px-4 font-sans">Nền Tảng Thiết Bị</th>
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
            {processedRows.map((row) => {
              const isSelected = selectedKey === row.key;
              const isDrop = row.deltaMedian < 0;
              const barWidthPct = Math.min(100, Math.max(8, (Math.abs(row.deltaMedian) / maxAbsDeficit) * 100));

              return (
                <tr
                  key={row.key}
                  onClick={() => setSelectedKey(row.key as string)}
                  className={`cursor-pointer transition hover:bg-slate-50/70 ${
                    isSelected ? 'bg-blue-50/40 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-sans font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{row.code}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200/70">
                        {row.type}
                      </span>
                      {isSelected && (
                        <span className="text-[11px] text-blue-600 font-semibold">Đang chọn</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="font-bold text-slate-900">{formatPercent(row.shareT8, false)}</div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      Chuẩn: {formatPercent(row.shareMedian, false)}
                    </div>
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
                        className={`h-full rounded-full transition-all ${
                          isDrop ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
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

          {/* Table Total Summary Footer */}
          <tfoot className="bg-slate-50 font-sans border-t-2 border-slate-200">
            <tr className="font-semibold text-slate-900">
              <td className="py-3.5 px-4 font-bold text-xs uppercase tracking-tight">
                TỔNG TOÀN BỘ NỀN TẢNG (MOBILE + PC + APP + TABLET)
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-bold text-xs">
                100%
              </td>
              <td className="py-3.5 px-4 text-right font-mono">
                <div className="font-bold text-xs text-slate-900">{formatNumber(totalT8)}</div>
              </td>
              <td className="py-3.5 px-4 text-right font-mono">
                <div className="font-bold text-xs text-slate-900">{formatNumber(totalMed)}</div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {isYoYMode ? 'Cùng kỳ 2025' : 'Chuẩn 2026'}
                </div>
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
              {isYoYMode && (
                <td className="py-3.5 px-3 text-center align-middle">
                  <YoYMonthlySparkline data={getTotalSeries()} />
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

