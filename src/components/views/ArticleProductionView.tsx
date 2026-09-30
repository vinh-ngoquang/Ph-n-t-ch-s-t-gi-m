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
import { MonthlyDataPoint, calculateMedian } from '../../utils/timeSeriesAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../../utils/formatters';
import { LineChart as LineChartIcon } from 'lucide-react';
import { YoYMonthlySparkline, YoYMonthlyPoint, LongTermPoint } from '../common/YoYMonthlySparkline';

interface Props {
  monthlyData: MonthlyDataPoint[];
  selectedMonth?: string;
  isYoYMode?: boolean;
}

export const ArticleProductionView: React.FC<Props> = ({ monthlyData, selectedMonth, isYoYMode }) => {
  const [showChart, setShowChart] = useState(false);
  const [sparkMode, setSparkMode] = useState<'yoy' | 'longterm'>('yoy');

  const months2026 = useMemo(() => monthlyData.filter((d) => d.year === 2026), [monthlyData]);
  const months2025 = useMemo(() => monthlyData.filter((d) => d.year === 2025), [monthlyData]);

  const availableMonthNums = useMemo(() => new Set(months2026.map((d) => d.monthNum)), [months2026]);
  const sortedAvailableMonthNums = useMemo(() => {
    return Array.from(availableMonthNums).sort((a, b) => a - b);
  }, [availableMonthNums]);

  const getArticleYoYSeries = (code: string): YoYMonthlyPoint[] => {
    return sortedAvailableMonthNums.map((mNum) => {
      const d26 = months2026.find((d) => d.monthNum === mNum);
      const d25 = months2025.find((d) => d.monthNum === mNum);
      let val26 = 0;
      let val25 = 0;

      if (code === 'A_Total') {
        val26 = d26?.record.articles || 0;
        val25 = d25?.record.articles || 0;
      } else if (code === 'A_Editorial') {
        val26 = d26?.record.articleThuong || 0;
        val25 = d25?.record.articleThuong || 0;
      } else if (code === 'A_Commercial') {
        val26 = d26?.record.articleThuongMai || 0;
        val25 = d25?.record.articleThuongMai || 0;
      } else if (code === 'A_BuildTop') {
        val26 = d26?.record.aBuildTop || 0;
        val25 = d25?.record.aBuildTop || 0;
      } else if (code === 'R_BuildTop') {
        const art26 = d26?.record.articles || 0;
        const bt26 = d26?.record.aBuildTop || 0;
        val26 = art26 > 0 ? (bt26 / art26) * 100 : 0;

        const art25 = d25?.record.articles || 0;
        const bt25 = d25?.record.aBuildTop || 0;
        val25 = art25 > 0 ? (bt25 / art25) * 100 : 0;
      }

      return {
        monthNum: mNum,
        monthLabel: `T${mNum}`,
        val2026: Number(val26.toFixed(1)),
        val2025: Number(val25.toFixed(1)),
      };
    });
  };

  const getArticleLongTermSeries = (code: string): LongTermPoint[] => {
    const sorted = [...monthlyData].sort((a, b) => (a.year !== b.year ? a.year - b.year : a.monthNum - b.monthNum));
    return sorted.map((d) => {
      let val = 0;
      if (code === 'A_Total') {
        val = d.record.articles || 0;
      } else if (code === 'A_Editorial') {
        val = d.record.articleThuong || 0;
      } else if (code === 'A_Commercial') {
        val = d.record.articleThuongMai || 0;
      } else if (code === 'A_BuildTop') {
        val = d.record.aBuildTop || 0;
      } else if (code === 'R_BuildTop') {
        const art = d.record.articles || 0;
        const bt = d.record.aBuildTop || 0;
        val = art > 0 ? (bt / art) * 100 : 0;
      }
      return {
        month: d.month,
        monthLabel: `T${d.monthNum}/${String(d.year).slice(-2)}`,
        year: d.year,
        val: Number(val.toFixed(1)),
      };
    });
  };

  const matched2025 = useMemo(
    () => months2025.filter((d) => availableMonthNums.has(d.monthNum)),
    [months2025, availableMonthNums]
  );

  const targetIdx = selectedMonth
    ? months2026.findIndex((d) => d.month === selectedMonth)
    : months2026.length - 1;
  const safeIdx = targetIdx >= 0 ? targetIdx : months2026.length - 1;
  const t8 = months2026[safeIdx] || months2026[months2026.length - 1];

  // YoY sums (Matching 2026 months with exact same 2025 months, e.g. T1..T8)
  const totalArt2026 = useMemo(() => months2026.reduce((sum, d) => sum + (d.record.articles || 0), 0), [months2026]);
  const artThuong2026 = useMemo(() => months2026.reduce((sum, d) => sum + (d.record.articleThuong || 0), 0), [months2026]);
  const artTmai2026 = useMemo(() => months2026.reduce((sum, d) => sum + (d.record.articleThuongMai || 0), 0), [months2026]);
  const buildTop2026 = useMemo(() => months2026.reduce((sum, d) => sum + (d.record.aBuildTop || 0), 0), [months2026]);

  const totalArt2025 = useMemo(() => matched2025.reduce((sum, d) => sum + (d.record.articles || 0), 0), [matched2025]);
  const artThuong2025 = useMemo(() => matched2025.reduce((sum, d) => sum + (d.record.articleThuong || 0), 0), [matched2025]);
  const artTmai2025 = useMemo(() => matched2025.reduce((sum, d) => sum + (d.record.articleThuongMai || 0), 0), [matched2025]);
  const buildTop2025 = useMemo(() => matched2025.reduce((sum, d) => sum + (d.record.aBuildTop || 0), 0), [matched2025]);

  // Raw arrays for production in monthly mode
  const artThuongList = months2026.map((d) => d.record.articleThuong || 0);
  const artTmaiList = months2026.map((d) => d.record.articleThuongMai || 0);
  const buildTopList = months2026.map((d) => d.record.aBuildTop || 0);
  const totalArtList = months2026.map((d) => d.record.articles || 0);

  const buildRateList = months2026.map((d) =>
    (d.record.articles || 0) > 0 ? ((d.record.aBuildTop || 0) / (d.record.articles || 1)) * 100 : 0
  );

  const targetMonths = isYoYMode ? monthlyData : months2026;

  const chartData = targetMonths.map((d) => {
    const total = d.record.articles || 0;
    const bt = d.record.aBuildTop || 0;
    const rate = total > 0 ? (bt / total) * 100 : 0;
    return {
      month: isYoYMode ? d.label : d.shortLabel,
      'A_Editorial': d.record.articleThuong || 0,
      'A_Commercial': d.record.articleThuongMai || 0,
      'A_BuildTop': bt,
      'Tỷ lệ Build Top (%)': Number(rate.toFixed(1)),
    };
  });

  interface ItemRow {
    code: string;
    name: string;
    type: string;
    color: string;
    t8: number;
    median: number;
    isPercent?: boolean;
  }

  const items: ItemRow[] = isYoYMode
    ? [
        {
          code: 'A_Total',
          name: 'Tổng Bài viết Xuất bản',
          type: 'All',
          color: '#3b82f6',
          t8: totalArt2026,
          median: totalArt2025,
        },
        {
          code: 'A_Editorial',
          name: 'Bài Thường (Nội dung Biên tập)',
          type: 'Editorial',
          color: '#10b981',
          t8: artThuong2026,
          median: artThuong2025,
        },
        {
          code: 'A_Commercial',
          name: 'Bài Thương Mại (Sponsored / PR)',
          type: 'Commercial',
          color: '#f59e0b',
          t8: artTmai2026,
          median: artTmai2025,
        },
        {
          code: 'A_BuildTop',
          name: 'Bài được Build Top (Lên Trang Bìa)',
          type: 'Featured',
          color: '#8b5cf6',
          t8: buildTop2026,
          median: buildTop2025,
        },
        {
          code: 'R_BuildTop',
          name: 'Tỷ lệ Bài Viết Được Build Top (%)',
          type: 'Ratio',
          color: '#ec4899',
          t8: totalArt2026 > 0 ? (buildTop2026 / totalArt2026) * 100 : 0,
          median: totalArt2025 > 0 ? (buildTop2025 / totalArt2025) * 100 : 0,
          isPercent: true,
        },
      ]
    : [
        {
          code: 'A_Total',
          name: 'Tổng Bài viết Xuất bản',
          type: 'All',
          color: '#3b82f6',
          t8: t8?.record.articles || 0,
          median: calculateMedian(totalArtList),
        },
        {
          code: 'A_Editorial',
          name: 'Bài Thường (Nội dung Biên tập)',
          type: 'Editorial',
          color: '#10b981',
          t8: t8?.record.articleThuong || 0,
          median: calculateMedian(artThuongList),
        },
        {
          code: 'A_Commercial',
          name: 'Bài Thương Mại (Sponsored / PR)',
          type: 'Commercial',
          color: '#f59e0b',
          t8: t8?.record.articleThuongMai || 0,
          median: calculateMedian(artTmaiList),
        },
        {
          code: 'A_BuildTop',
          name: 'Bài được Build Top (Lên Trang Bìa)',
          type: 'Featured',
          color: '#8b5cf6',
          t8: t8?.record.aBuildTop || 0,
          median: calculateMedian(buildTopList),
        },
        {
          code: 'R_BuildTop',
          name: 'Tỷ lệ Bài Viết Được Build Top (%)',
          type: 'Ratio',
          color: '#ec4899',
          t8: (t8?.record.articles || 0) > 0 ? ((t8?.record.aBuildTop || 0) / t8.record.articles) * 100 : 0,
          median: calculateMedian(buildRateList),
          isPercent: true,
        },
      ];

  const totalArtRow = items[0];
  const buildTopRow = items[3];
  const buildRateRow = items[4];
  const commercialRow = items[2];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      {/* 1. Header Bar with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {isYoYMode
                ? 'Động thái & Sản Lượng Bài Viết (Tổng 2026 vs Cùng kỳ 2025)'
                : 'Động thái & Sản Lượng Bài Viết (Articles: Editorial vs Commercial & Build Top)'}
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

      {/* 2. Top 3 Highlight Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Total Output */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {isYoYMode ? 'Tổng Sản Lượng (Tổng 2026)' : 'Tổng Sản Lượng Bài Viết'}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              Duy trì tốt
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-base font-bold text-slate-900 font-mono flex items-center gap-2">
              <span>{formatNumber(totalArtRow.t8)} bài</span>
              <span className={`text-xs font-semibold ${totalArtRow.t8 >= totalArtRow.median ? 'text-emerald-600' : 'text-rose-600'}`}>
                ({formatDelta(totalArtRow.t8 - totalArtRow.median, false)})
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              {isYoYMode ? 'Tổng 2026: ' : 'Tháng này: '}
              <strong className="text-slate-700">{formatNumber(totalArtRow.t8)}</strong>
              {'  '}| {isYoYMode ? 'Cùng kỳ 2025: ' : 'Trung vị: '}
              <strong className="text-slate-700">{formatNumber(totalArtRow.median)}</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Build Top Articles */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Số Bài Build Top (Trang Bìa)</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/70">
              {buildRateRow.t8.toFixed(1)}% tổng bài
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-base font-bold text-purple-700 font-mono flex items-center gap-2">
              <span>{formatNumber(buildTopRow.t8)} bài</span>
              <span className={`text-xs font-semibold ${buildTopRow.t8 >= buildTopRow.median ? 'text-emerald-600' : 'text-rose-600'}`}>
                ({formatDelta(buildTopRow.t8 - buildTopRow.median, false)})
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              {isYoYMode ? 'Tổng 2026: ' : 'Tháng này: '}
              <strong className="text-slate-700">{formatNumber(buildTopRow.t8)}</strong>
              {'  '}| {isYoYMode ? 'Cùng kỳ 2025: ' : 'Trung vị: '}
              <strong className="text-slate-700">{formatNumber(buildTopRow.median)}</strong>
            </div>
          </div>
        </div>

        {/* Card 3: Commercial Content */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Bài Thương Mại (Sponsored/PR)</div>
          <div className="mt-2 space-y-1">
            <div className="text-base font-bold text-amber-600 font-mono flex items-center gap-2">
              <span>{formatNumber(commercialRow.t8)} bài</span>
              <span className="text-xs font-semibold text-slate-500">
                ({formatPercent(totalArtRow.t8 > 0 ? (commercialRow.t8 / totalArtRow.t8) * 100 : 0, false)})
              </span>
            </div>
            <div className="text-xs text-slate-500 font-sans">
              Tỷ lệ bài PR thương mại nằm trong giới hạn kiểm soát biên tập.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Collapsible Trend Line Chart */}
      {showChart && (
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 transition-all">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-800">
              {isYoYMode
                ? 'Xu hướng sản lượng bài viết và số bài Build Top từ 2025 đến tháng mới nhất'
                : 'Xu hướng sản lượng bài viết và số bài Build Top qua 8 tháng'}
            </span>
            <span className="text-slate-500 text-[11px]">Đơn vị: Bài viết</span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '0.5rem',
                    color: '#0f172a',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Line
                  type="monotone"
                  dataKey="A_Editorial"
                  name="Bài Thường (Editorial)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="A_Commercial"
                  name="Bài Thương Mại"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="A_BuildTop"
                  name="Bài Build Top"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
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
              <th className="py-3 px-4 font-sans">Loại Nội Dung</th>
              <th className="py-3 px-4 text-right font-sans">
                {isYoYMode
                  ? 'Tổng 2026'
                  : (selectedMonth ? `Tháng ${selectedMonth}` : 'Tháng 8/2026')}
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
            {items.map((row) => {
              const deltaMed = row.t8 - row.median;
              const isDrop = deltaMed < 0;

              return (
                <tr key={row.code} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-sans font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{row.code}</span>
                      <span className="text-slate-500 font-normal">({row.name})</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    {row.isPercent ? `${row.t8.toFixed(1)}%` : formatNumber(row.t8)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                    {row.isPercent ? `${row.median.toFixed(1)}%` : formatNumber(row.median)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className={`font-bold ${isDrop ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {row.isPercent
                        ? `${deltaMed > 0 ? '+' : ''}${deltaMed.toFixed(1)}%`
                        : `${formatDelta(deltaMed, false)} (${formatPercent(row.median > 0 ? (deltaMed / row.median) * 100 : 0)})`}
                    </div>
                    {!row.isPercent && (
                      <div className="w-full max-w-[170px] h-1.5 bg-slate-100 rounded-full overflow-hidden relative mt-1.5 ml-auto flex justify-end">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isDrop ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: '40%' }}
                        />
                      </div>
                    )}
                  </td>

                  {isYoYMode && (
                    <td className="py-3.5 px-3 text-center align-middle">
                      <YoYMonthlySparkline
                        data={getArticleYoYSeries(row.code)}
                        longTermData={getArticleLongTermSeries(row.code)}
                        mode={sparkMode}
                        isPercent={row.isPercent}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
