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
  ReferenceLine,
} from 'recharts';
import { MonthlyDataPoint, calculateMedian } from '../../utils/timeSeriesAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../../utils/formatters';
import { LineChart as LineChartIcon, Info, Layers } from 'lucide-react';

interface Props {
  monthlyData: MonthlyDataPoint[];
}

export const OverviewVolumeYieldView: React.FC<Props> = ({ monthlyData }) => {
  const [showChart, setShowChart] = useState(false);

  const months2026 = monthlyData.filter((d) => d.year === 2026);
  const t8 = months2026.find((d) => d.month === '8/2026') || months2026[months2026.length - 1];
  const t7 = months2026.find((d) => d.month === '7/2026') || months2026[months2026.length - 2];

  // Raw arrays
  const pvList = months2026.map((d) => d.record.pageviews || 0);
  const detailList = months2026.map((d) => d.record.pDetail || 0);
  const artList = months2026.map((d) => d.record.articles || 0);

  // Yield calculation using P-Detail / Articles (Yield = P-Detail / Bài)
  const yieldList = months2026.map((d) =>
    (d.record.articles || 0) > 0 ? (d.record.pDetail || 0) / (d.record.articles || 1) : 0
  );

  const t8PV = t8?.record.pageviews || 0;
  const t7PV = t7?.record.pageviews || 0;
  const medPV = calculateMedian(pvList);

  const t8Detail = t8?.record.pDetail || 0;
  const t7Detail = t7?.record.pDetail || 0;
  const medDetail = calculateMedian(detailList);

  const t8Art = t8?.record.articles || 0;
  const t7Art = t7?.record.articles || 0;
  const medArt = calculateMedian(artList);

  const t8Yield = t8Art > 0 ? t8Detail / t8Art : 0;
  const t7Yield = t7Art > 0 ? t7Detail / t7Art : 0;
  const medYield = calculateMedian(yieldList);

  // LMDI vs Median on P-Detail (P-Detail = Articles * Yield)
  const deltaDetailMed = t8Detail - medDetail;
  let volEffectMed = 0;
  let yieldEffectMed = 0;
  if (t8Detail > 0 && medDetail > 0 && t8Detail !== medDetail) {
    const L = (t8Detail - medDetail) / (Math.log(t8Detail) - Math.log(medDetail));
    volEffectMed = L * Math.log(t8Art / (medArt || 1));
    yieldEffectMed = L * Math.log(t8Yield / (medYield || 1));
  }

  // LMDI vs MoM on P-Detail
  const deltaDetailMom = t8Detail - t7Detail;
  let volEffectMom = 0;
  let yieldEffectMom = 0;
  if (t8Detail > 0 && t7Detail > 0 && t8Detail !== t7Detail) {
    const L = (t8Detail - t7Detail) / (Math.log(t8Detail) - Math.log(t7Detail));
    volEffectMom = L * Math.log(t8Art / (t7Art || 1));
    yieldEffectMom = L * Math.log(t8Yield / (t7Yield || 1));
  }

  // Also calculate PV vs Median for context
  const deltaPVMed = t8PV - medPV;
  const deltaPVMom = t8PV - t7PV;

  // Chart data
  const chartData = months2026.map((d) => {
    const p = d.record.pageviews || 0;
    const dt = d.record.pDetail || 0;
    const a = d.record.articles || 0;
    const y = a > 0 ? dt / a : 0;
    return {
      month: d.label.split('/')[0] ? `T${d.label.split('/')[0]}` : d.month,
      pageviewsM: Number((p / 1_000_000).toFixed(2)),
      detailM: Number((dt / 1_000_000).toFixed(2)),
      yieldK: Number((y / 1_000).toFixed(1)),
      articles: a,
    };
  });

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      {/* 1. Header Bar with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Động thái & Phân Rã Quy Mô vs Hiệu Suất (Volume & Yield)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bóc tách tác động Lượng (Volume) vs Chất (Yield) chu kỳ 2026 bằng mô hình phân rã toán học LMDI
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
        {/* Card 1: Yield Performance */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Hiệu Suất Yield</span>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                (Công thức: P-Detail / Bài)
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200/70">
              Chất lượng giảm
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="text-base font-bold text-rose-600 font-mono flex items-center gap-2">
              <span>{formatNumber(t8Yield)}</span>
              <span className="text-xs font-normal text-slate-500 font-sans">P-Detail/bài</span>
              <span className="text-xs font-semibold">
                ({formatPercent(medYield > 0 ? ((t8Yield - medYield) / medYield) * 100 : 0)})
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Tháng này: <strong className="text-slate-700">{formatNumber(t8Yield)}</strong>
              {'  '}| Trung vị: <strong className="text-slate-700">{formatNumber(medYield)}</strong>
            </div>
          </div>
        </div>

        {/* Card 2: LMDI Decomposition */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">Phân Rã LMDI (Lượng vs. Chất)</span>
            <span className="text-[10px] text-slate-400 font-medium">Trên P-Detail</span>
          </div>
          <div className="mt-2 space-y-1 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Tác động Lượng (Bài):</span>
              <span className={`font-semibold ${volEffectMed >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatDelta(volEffectMed)} P-Detail
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Tác động Chất (Yield):</span>
              <span className={`font-semibold ${yieldEffectMed >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatDelta(yieldEffectMed)} P-Detail
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Article Production */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Sản Lượng Bài Viết (Articles)</div>
          <div className="mt-2 space-y-1">
            <div className="text-base font-bold text-emerald-600 font-mono flex items-center gap-2">
              <span>{formatNumber(t8Art)} bài</span>
              <span className="text-xs font-semibold">
                ({formatPercent(medArt > 0 ? ((t8Art - medArt) / medArt) * 100 : 0)})
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Tháng này: <strong className="text-slate-700">{formatNumber(t8Art)}</strong>
              {'  '}| Trung vị: <strong className="text-slate-700">{formatNumber(medArt)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Collapsible Trend Line Chart */}
      {showChart && (
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 transition-all">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-800">
              Đường xu hướng Pageviews (Triệu PV) & Hiệu suất Yield (Nghìn P-Detail/bài: P-Detail / Bài) qua 8 tháng
            </span>
            <span className="text-slate-500 text-[11px]">Đường nét đứt: Mốc Trung vị chuẩn chu kỳ</span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis
                  yAxisId="left"
                  stroke="#3b82f6"
                  tick={{ fill: '#3b82f6', fontSize: 11 }}
                  tickFormatter={(v) => `${v}M`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#f59e0b"
                  tick={{ fill: '#f59e0b', fontSize: 11 }}
                  tickFormatter={(v) => `${v}k`}
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
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <ReferenceLine
                  yAxisId="left"
                  y={Number((medPV / 1_000_000).toFixed(2))}
                  stroke="#93c5fd"
                  strokeDasharray="4 4"
                />
                <ReferenceLine
                  yAxisId="right"
                  y={Number((medYield / 1_000).toFixed(1))}
                  stroke="#fde68a"
                  strokeDasharray="4 4"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="pageviewsM"
                  name="Pageviews (Triệu PV)"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2563eb' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="yieldK"
                  name="Yield (Nghìn P-Detail/bài)"
                  stroke="#d97706"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#d97706' }}
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
              <th className="py-3 px-4 font-sans">Chỉ Số Hiệu Suất</th>
              <th className="py-3 px-4 text-right font-sans">Tháng 8/2026</th>
              <th className="py-3 px-4 text-right font-sans">MoM (T7/2026)</th>
              <th className="py-3 px-4 text-right font-sans">Mốc Trung Vị (2026)</th>
              <th className="py-3 px-4 text-right font-sans min-w-[200px]">Lệch vs. Trung Vị</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Row 1: Pageviews */}
            <tr className="hover:bg-slate-50/70 transition">
              <td className="py-3.5 px-4 font-sans font-medium text-slate-900">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-900">Tổng Pageviews (PV)</span>
                </div>
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                {formatNumber(t8PV)}
              </td>
              <td className="py-3.5 px-4 text-right font-mono">
                <div>{formatNumber(t7PV)}</div>
                <div className={`text-[10px] ${deltaPVMom >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatDelta(deltaPVMom)} ({formatPercent(t7PV > 0 ? (deltaPVMom / t7PV) * 100 : 0)})
                </div>
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                {formatNumber(medPV)}
              </td>
              <td className="py-3.5 px-4 text-right font-mono">
                <div className={`font-bold ${deltaPVMed >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatDelta(deltaPVMed)} ({formatPercent(medPV > 0 ? (deltaPVMed / medPV) * 100 : 0)})
                </div>
                <div className="w-full max-w-[170px] h-1.5 bg-slate-100 rounded-full overflow-hidden relative mt-1.5 ml-auto flex justify-end">
                  <div
                    className={`h-full rounded-full ${deltaPVMed >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: '100%' }}
                  />
                </div>
              </td>
            </tr>

            {/* Row 2: P-Detail */}
            <tr className="hover:bg-slate-50/70 transition bg-slate-50/30">
              <td className="py-3.5 px-4 font-sans font-medium text-slate-900">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900">Lượt Xem Bài Chi Tiết (P-Detail)</span>
                    <span className="text-[10px] text-slate-400 font-normal block">Tử số tính Yield</span>
                  </div>
                </div>
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                {formatNumber(t8Detail)}
              </td>
              <td className="py-3.5 px-4 text-right font-mono">
                <div>{formatNumber(t7Detail)}</div>
                <div className={`text-[10px] ${deltaDetailMom >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatDelta(deltaDetailMom)} ({formatPercent(t7Detail > 0 ? (deltaDetailMom / t7Detail) * 100 : 0)})
                </div>
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                {formatNumber(medDetail)}
              </td>
              <td className="py-3.5 px-4 text-right font-mono">
                <div className={`font-bold ${deltaDetailMed >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatDelta(deltaDetailMed)} ({formatPercent(medDetail > 0 ? (deltaDetailMed / medDetail) * 100 : 0)})
                </div>
                <div className="w-full max-w-[170px] h-1.5 bg-slate-100 rounded-full overflow-hidden relative mt-1.5 ml-auto flex justify-end">
                  <div
                    className={`h-full rounded-full ${deltaDetailMed >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: '90%' }}
                  />
                </div>
              </td>
            </tr>

            {/* Row 3: Articles */}
            <tr className="hover:bg-slate-50/70 transition">
              <td className="py-3.5 px-4 font-sans font-medium text-slate-900">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900">Sản lượng Bài viết (Articles)</span>
                    <span className="text-[10px] text-slate-400 font-normal block">Mẫu số tính Yield</span>
                  </div>
                </div>
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                {formatNumber(t8Art)}
              </td>
              <td className="py-3.5 px-4 text-right font-mono">
                <div>{formatNumber(t7Art)}</div>
                <div className={`text-[10px] ${t8Art - t7Art >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatDelta(t8Art - t7Art, false)} ({formatPercent(t7Art > 0 ? ((t8Art - t7Art) / t7Art) * 100 : 0)})
                </div>
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                {formatNumber(medArt)}
              </td>
              <td className="py-3.5 px-4 text-right font-mono">
                <div className={`font-bold ${t8Art - medArt >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatDelta(t8Art - medArt, false)} ({formatPercent(medArt > 0 ? ((t8Art - medArt) / medArt) * 100 : 0)})
                </div>
                <div className="w-full max-w-[170px] h-1.5 bg-slate-100 rounded-full overflow-hidden relative mt-1.5 ml-auto flex justify-end">
                  <div
                    className={`h-full rounded-full ${t8Art - medArt >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: '40%' }}
                  />
                </div>
              </td>
            </tr>

            {/* Row 4: Yield */}
            <tr className="hover:bg-slate-50/70 transition bg-amber-50/30">
              <td className="py-3.5 px-4 font-sans font-medium text-slate-900">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900">Hiệu suất Yield (P-Detail / Bài)</span>
                    <span className="text-[10px] text-amber-700 font-medium block">
                      (Công thức: P-Detail / Bài viết)
                    </span>
                  </div>
                </div>
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                {formatNumber(t8Yield)}
              </td>
              <td className="py-3.5 px-4 text-right font-mono">
                <div>{formatNumber(t7Yield)}</div>
                <div className={`text-[10px] ${t8Yield - t7Yield >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatDelta(t8Yield - t7Yield, false)}
                </div>
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                {formatNumber(medYield)}
              </td>
              <td className="py-3.5 px-4 text-right font-mono">
                <div className={`font-bold ${t8Yield - medYield >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatDelta(t8Yield - medYield, false)} ({formatPercent(medYield > 0 ? ((t8Yield - medYield) / medYield) * 100 : 0)})
                </div>
                <div className="w-full max-w-[170px] h-1.5 bg-slate-100 rounded-full overflow-hidden relative mt-1.5 ml-auto flex justify-end">
                  <div
                    className={`h-full rounded-full ${t8Yield - medYield >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: '80%' }}
                  />
                </div>
              </td>
            </tr>
          </tbody>

          {/* LMDI Breakdown Footer */}
          <tfoot className="bg-slate-50 font-sans border-t-2 border-slate-200">
            <tr>
              <td colSpan={5} className="py-3 px-4 text-xs text-slate-600">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mô hình LMDI giải trình lượng hao hụt P-Detail so với Trung vị ({formatDelta(deltaDetailMed)} lượt đọc):</span>
                  </div>
                  <div className="flex items-center gap-4 font-mono font-semibold">
                    <span className="text-emerald-600">
                      Do Lượng bài: {formatDelta(volEffectMed)} P-Detail
                    </span>
                    <span className="text-rose-600">
                      Do Sức hút (Yield = P-Detail/Bài): {formatDelta(yieldEffectMed)} P-Detail
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
