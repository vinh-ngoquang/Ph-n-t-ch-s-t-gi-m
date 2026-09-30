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
import {
  MonthlyDataPoint,
  analyzeDimensionSeries,
  analyzeDimensionSeriesYoY,
} from '../../utils/timeSeriesAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../../utils/formatters';
import {
  LineChart as LineChartIcon,
} from 'lucide-react';
import { NewsRecord } from '../../types';
import { YoYMonthlySparkline, YoYMonthlyPoint, LongTermPoint } from '../common/YoYMonthlySparkline';

interface Props {
  monthlyData: MonthlyDataPoint[];
  selectedMonth?: string;
  currentScope?: string;
  folderOptions?: { id: string; name: string }[];
  isYoYMode?: boolean;
}

export const ReaderSegmentsView: React.FC<Props> = ({
  monthlyData,
  selectedMonth = '8/2026',
  isYoYMode,
}) => {

  // 3 distinct reader segments configuration
  const readerConfig: {
    key: 'pNew' | 'pReturn' | 'pLover';
    code: string;
    name: string;
    type: string;
    desc: string;
    color: string;
  }[] = [
    {
      key: 'pNew',
      code: 'P- New',
      name: 'Độc Giả Mới',
      type: 'Tân khách',
      desc: 'Người dùng mới lần đầu tiếp cận và truy cập đọc bài viết',
      color: '#3b82f6', // Slate blue
    },
    {
      key: 'pReturn',
      code: 'P- Return',
      name: 'Độc Giả Quay Lại',
      type: 'Định kỳ',
      desc: 'Người dùng định kỳ quay trở lại đọc báo theo thói quen định kỳ',
      color: '#6366f1', // Indigo
    },
    {
      key: 'pLover',
      code: 'P- Lover',
      name: 'Độc Giả Trung Thành',
      type: 'Thân thiết',
      desc: 'Độc giả gắn bó sâu sắc, có tần suất và thời lượng đọc cao nhất',
      color: '#0f766e', // Teal / Dark cyan
    },
  ];

  // Analyze high-level dimension series (Aggregate across months)
  const summary = useMemo(() => {
    if (isYoYMode) {
      return analyzeDimensionSeriesYoY(monthlyData, readerConfig, 'pageviews');
    }
    return analyzeDimensionSeries(monthlyData, readerConfig, 'pageviews', selectedMonth);
  }, [monthlyData, selectedMonth, isYoYMode]);

  // States
  const [showChart, setShowChart] = useState(false);
  const [sortBy, setSortBy] = useState<'deficit' | 'share' | 'volume' | 'growth'>('deficit');
  const [sparkMode, setSparkMode] = useState<'yoy' | 'longterm'>('yoy');

  // Total metrics
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
      const v26 = readerConfig.reduce((sum, p) => sum + (Number(d26?.record[p.key]) || 0), 0);
      const v25 = readerConfig.reduce((sum, p) => sum + (Number(d25?.record[p.key]) || 0), 0);
      return {
        monthNum: mNum,
        monthLabel: `T${mNum}`,
        val2026: v26,
        val2025: v25,
      };
    });
  };

  // Long-term continuous 2025 -> 2026 series
  const getLongTermSeries = (key: string): LongTermPoint[] => {
    return monthlyData.map((d) => ({
      month: d.month,
      monthLabel: d.label,
      year: d.year,
      val: Number(d.record[key as keyof NewsRecord]) || 0,
    }));
  };

  const getTotalLongTermSeries = (): LongTermPoint[] => {
    return monthlyData.map((d) => {
      const v = readerConfig.reduce((sum, p) => sum + (Number(d.record[p.key]) || 0), 0);
      return {
        month: d.month,
        monthLabel: d.label,
        year: d.year,
        val: v,
      };
    });
  };

  // Process rows with metadata
  const processedRows = useMemo(() => {
    return summary.rows.map((row) => {
      const cfg = readerConfig.find((s) => s.key === row.key);
      return {
        ...row,
        code: cfg?.code || row.key,
        name: cfg?.name || row.key,
        type: cfg?.type || 'Loại độc giả',
        desc: cfg?.desc || '',
        color: cfg?.color || '#64748b',
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

  // Individual segments
  const pNewRow = processedRows.find((r) => r.key === 'pNew');
  const pReturnRow = processedRows.find((r) => r.key === 'pReturn');
  const pLoverRow = processedRows.find((r) => r.key === 'pLover');

  // Retention / Loyalty: Return + Lover
  const loyaltyT8 = (pReturnRow?.t8 || 0) + (pLoverRow?.t8 || 0);
  const loyaltyMed = (pReturnRow?.median || 0) + (pLoverRow?.median || 0);
  const loyaltyDelta = loyaltyT8 - loyaltyMed;
  const loyaltyPct = loyaltyMed > 0 ? (loyaltyDelta / loyaltyMed) * 100 : 0;
  const loyaltyShareT8 = totalT8 > 0 ? (loyaltyT8 / totalT8) * 100 : 0;

  // Max absolute delta for relative bar scaling
  const maxAbsDeficit = Math.max(...processedRows.map((r) => Math.abs(r.deltaMedian)), 1);

  // Filter & Sort for main dimension table
  const displayedRows = useMemo(() => {
    let list = [...processedRows];

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
  }, [processedRows, sortBy]);

  // Recharts trend data
  const chartData = useMemo(() => {
    return summary.trendSeries.map((item) => {
      const pt: any = {
        month: isYoYMode ? (item.label || item.shortLabel) : item.shortLabel,
      };
      readerConfig.forEach((cfg) => {
        pt[cfg.code] = Number(((item[cfg.key] || 0) / 1_000_000).toFixed(2));
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
                ? 'Động thái & Nguồn Sụt giảm theo Loại Độc Giả (Tổng 2026 vs Cùng kỳ 2025)'
                : 'Động thái & Nguồn Sụt giảm theo Loại Độc Giả (Reader Segments)'}
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

      {/* 2. Filter & Controls Toolbar */}
      <div className="flex justify-end items-center gap-2.5 pt-1">
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
            <option value="growth">Tăng trưởng cao nhất</option>
          </select>
        </div>
      </div>

      {/* 3. Collapsible Trend Line Chart */}
      {showChart && (
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 transition-all space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              {isYoYMode
                ? 'Đường xu hướng lượt xem theo loại độc giả từ 2025 đến tháng mới nhất (Triệu PV)'
                : 'Đường xu hướng lượt xem của 3 nhóm độc giả qua 8 tháng (Triệu PV)'}
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
                {readerConfig.map((cfg) => (
                  <Line
                    key={cfg.code}
                    type="monotone"
                    dataKey={cfg.code}
                    name={`${cfg.code} (${cfg.name})`}
                    stroke={cfg.color}
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: cfg.color }}
                    activeDot={{ r: 4.5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Main Clean Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-sans">Phân Khúc Độc Giả (Reader Segment)</th>
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
                <th className="py-2.5 px-3 text-center font-sans min-w-[175px]">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="font-semibold text-slate-700">Xu Hướng</span>
                    <div className="inline-flex bg-slate-200/90 p-0.5 rounded text-[10px] font-medium">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSparkMode('yoy'); }}
                        className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                          sparkMode === 'yoy'
                            ? 'bg-white text-blue-700 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="So sánh cùng kỳ 2026 vs 2025 theo từng tháng"
                      >
                        YoY
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSparkMode('longterm'); }}
                        className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                          sparkMode === 'longterm'
                            ? 'bg-white text-blue-700 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Đường xu hướng dài hạn liên tục từ 2025 đến 2026"
                      >
                        2025→2026
                      </button>
                    </div>
                  </div>
                  <div className="text-[9px] font-normal text-slate-400 flex items-center justify-center gap-1 mt-0.5 whitespace-nowrap">
                    {sparkMode === 'yoy' ? (
                      <>
                        <span className="text-emerald-600 font-bold">● '26 &ge; '25</span>
                        <span>|</span>
                        <span className="text-rose-600 font-bold">● '26 &lt; '25</span>
                        <span>|</span>
                        <span className="text-slate-400">--- '25</span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-500 font-medium">Xám: '25</span>
                        <span>→</span>
                        <span className="text-blue-600 font-bold">Xanh: '26</span>
                      </>
                    )}
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedRows.map((row) => {
              const isDrop = row.deltaMedian < 0;
              const barWidthPct = Math.min(100, Math.max(8, (Math.abs(row.deltaMedian) / maxAbsDeficit) * 100));

              return (
                <tr
                  key={row.key}
                  className="transition hover:bg-slate-50/70"
                >
                  {/* Cột 1: Phân Khúc Độc Giả */}
                  <td className="py-3.5 px-4 font-sans font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{row.code}</span>
                      <span className="text-slate-500 font-sans">({row.name})</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200/70">
                        {row.type}
                      </span>
                    </div>
                  </td>

                  {/* Cột 2: Tỷ Trọng */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="font-bold text-slate-900">{formatPercent(row.shareT8, false)}</div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      Chuẩn: {formatPercent(row.shareMedian, false)}
                    </div>
                  </td>

                  {/* Cột 3: Tháng Này / Tổng 2026 */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="font-bold text-slate-900">{formatNumber(row.t8)}</div>
                  </td>

                  {/* Cột 4: Trung Vị / Cùng Kỳ */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="font-semibold text-slate-700">{formatNumber(row.median)}</div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      {isYoYMode ? 'Cùng kỳ 2025' : 'Chuẩn 2026'}
                    </div>
                  </td>

                  {/* Cột 5: Lệch vs Mốc Chuẩn */}
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
                      <YoYMonthlySparkline
                        data={getYoYSeries(row.key as string)}
                        longTermData={getLongTermSeries(row.key as string)}
                        mode={sparkMode}
                      />
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
                TỔNG TOÀN BỘ ĐỘC GIẢ (P- NEW + P- RETURN + P- LOVER)
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
                  <YoYMonthlySparkline
                    data={getTotalSeries()}
                    longTermData={getTotalLongTermSeries()}
                    mode={sparkMode}
                  />
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};


