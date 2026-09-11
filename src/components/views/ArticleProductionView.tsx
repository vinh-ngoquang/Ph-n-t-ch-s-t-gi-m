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
import { MonthlyDataPoint, calculateMedian } from '../../utils/timeSeriesAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../../utils/formatters';
import { LineChart as LineChartIcon } from 'lucide-react';

interface Props {
  monthlyData: MonthlyDataPoint[];
  selectedMonth?: string;
}

export const ArticleProductionView: React.FC<Props> = ({ monthlyData, selectedMonth }) => {
  const [showChart, setShowChart] = useState(false);

  const months2026 = monthlyData.filter((d) => d.year === 2026);
  const targetIdx = selectedMonth
    ? months2026.findIndex((d) => d.month === selectedMonth)
    : months2026.length - 1;
  const safeIdx = targetIdx >= 0 ? targetIdx : months2026.length - 1;
  const t8 = months2026[safeIdx] || months2026[months2026.length - 1];

  // Raw arrays for production
  const artThuongList = months2026.map((d) => d.record.articleThuong || 0);
  const artTmaiList = months2026.map((d) => d.record.articleThuongMai || 0);
  const buildTopList = months2026.map((d) => d.record.aBuildTop || 0);
  const totalArtList = months2026.map((d) => d.record.articles || 0);

  const buildRateList = months2026.map((d) =>
    (d.record.articles || 0) > 0 ? ((d.record.aBuildTop || 0) / (d.record.articles || 1)) * 100 : 0
  );

  const chartData = months2026.map((d) => {
    const total = d.record.articles || 0;
    const bt = d.record.aBuildTop || 0;
    const rate = total > 0 ? (bt / total) * 100 : 0;
    return {
      month: d.shortLabel,
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

  const items: ItemRow[] = [
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Động thái & Sản Lượng Bài Viết (Articles: Editorial vs Commercial & Build Top)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Đánh giá năng suất toà soạn và tỷ lệ tuyển chọn bài viết lên trang bìa (Build Top)
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
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
        </div>
      </div>

      {/* 2. Top 3 Highlight Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Total Output */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng Sản Lượng Bài Viết</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              Duy trì tốt
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-base font-bold text-slate-900 font-mono flex items-center gap-2">
              <span>{formatNumber(totalArtRow.t8)} bài</span>
              <span className="text-xs font-semibold text-emerald-600">
                ({formatDelta(totalArtRow.t8 - totalArtRow.median, false)})
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Tháng này: <strong className="text-slate-700">{formatNumber(totalArtRow.t8)}</strong>
              {'  '}| Trung vị: <strong className="text-slate-700">{formatNumber(totalArtRow.median)}</strong>
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
              Tháng này: <strong className="text-slate-700">{formatNumber(buildTopRow.t8)}</strong>
              {'  '}| Trung vị: <strong className="text-slate-700">{formatNumber(buildTopRow.median)}</strong>
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
              Xu hướng sản lượng bài viết và số bài Build Top qua 8 tháng
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
                {selectedMonth ? `Tháng ${selectedMonth}` : 'Tháng 8/2026'}
              </th>
              <th className="py-3 px-4 text-right font-sans">Mốc Trung Vị (2026)</th>
              <th className="py-3 px-4 text-right font-sans min-w-[200px]">Lệch vs. Trung Vị</th>
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
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: row.color }}
                      />
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
