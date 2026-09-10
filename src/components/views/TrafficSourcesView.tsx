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
import { MonthlyDataPoint, analyzeDimensionSeries } from '../../utils/timeSeriesAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../../utils/formatters';
import { LineChart as LineChartIcon, ArrowUpDown } from 'lucide-react';
import { NewsRecord } from '../../types';

interface Props {
  monthlyData: MonthlyDataPoint[];
}

export const TrafficSourcesView: React.FC<Props> = ({ monthlyData }) => {
  const sourcesConfig: {
    key: keyof NewsRecord;
    code: string;
    name: string;
    type: 'Internal' | 'External';
    color: string;
  }[] = [
    { key: 'pInHome', code: 'I_Home', name: 'In-Home (Trang chủ)', type: 'Internal', color: '#6366f1' },
    { key: 'pExGoogle', code: 'E_Search', name: 'Google (Search/Discover)', type: 'External', color: '#f59e0b' },
    { key: 'pInOther', code: 'I_Other', name: 'In-Other (Nội bộ khác)', type: 'Internal', color: '#94a3b8' },
    { key: 'pInDetail', code: 'I_Detail', name: 'In-Detail (Giữa các bài)', type: 'Internal', color: '#06b6d4' },
    { key: 'pExDirect', code: 'E_Direct', name: 'Direct (Trực tiếp)', type: 'External', color: '#10b981' },
    { key: 'pInFolder', code: 'I_Folder', name: 'In-Folder (Trang chuyên mục)', type: 'Internal', color: '#ec4899' },
    { key: 'pExSocial', code: 'E_Social', name: 'Social (Mạng xã hội)', type: 'External', color: '#3b82f6' },
  ];

  const summary = useMemo(() => {
    return analyzeDimensionSeries(monthlyData, sourcesConfig, 'pageviews');
  }, [monthlyData]);

  // States
  const [showChart, setShowChart] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'drop' | 'internal' | 'external'>('all');
  const [sortBy, setSortBy] = useState<'deficit' | 'share' | 'volume' | 'growth'>('deficit');
  const [selectedKey, setSelectedKey] = useState<string>('pInHome');

  // Total metrics
  const totalT8 = summary.totalT8;
  const totalMom = summary.totalMoM;
  const totalMed = summary.totalMedian;
  const totalDeltaMed = totalT8 - totalMed;
  const totalDeltaMom = totalT8 - totalMom;

  // Process rows with internal/external classification
  const processedRows = useMemo(() => {
    return summary.rows.map((row) => {
      const cfg = sourcesConfig.find((s) => s.key === row.key);
      const isInternal = cfg?.type === 'Internal';
      return {
        ...row,
        code: cfg?.code || row.key,
        type: cfg?.type || 'Internal',
        color: cfg?.color || '#64748b',
        isInternal,
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

  // External vs Internal balance
  const internalRows = processedRows.filter((r) => r.isInternal);
  const externalRows = processedRows.filter((r) => !r.isInternal);

  const internalT8 = internalRows.reduce((sum, r) => sum + r.t8, 0);
  const internalMed = internalRows.reduce((sum, r) => sum + r.median, 0);
  const internalDelta = internalT8 - internalMed;
  const internalPct = internalMed > 0 ? (internalDelta / internalMed) * 100 : 0;

  const externalT8 = externalRows.reduce((sum, r) => sum + r.t8, 0);
  const externalMed = externalRows.reduce((sum, r) => sum + r.median, 0);
  const externalDelta = externalT8 - externalMed;
  const externalPct = externalMed > 0 ? (externalDelta / externalMed) * 100 : 0;

  // Max absolute delta for relative bar scaling
  const maxAbsDeficit = Math.max(...processedRows.map((r) => Math.abs(r.deltaMedian)), 1);

  // Filter & Sort
  const displayedRows = useMemo(() => {
    let list = [...processedRows];
    if (filterType === 'drop') {
      list = list.filter((r) => r.deltaMedian < 0);
    } else if (filterType === 'internal') {
      list = list.filter((r) => r.isInternal);
    } else if (filterType === 'external') {
      list = list.filter((r) => !r.isInternal);
    }

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
  }, [processedRows, filterType, sortBy]);

  // Chart data
  const chartData = useMemo(() => {
    return summary.trendSeries.map((item) => {
      const pt: any = {
        month: item.shortLabel,
      };
      sourcesConfig.forEach((src) => {
        pt[src.code] = Number(((item[src.key] || 0) / 1_000_000).toFixed(2));
      });
      return pt;
    });
  }, [summary.trendSeries]);

  const dropSharePct = (deepestDrop && totalDeltaMed < 0)
    ? Math.round((deepestDrop.deltaMedian / totalDeltaMed) * 100)
    : 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      {/* 1. Header Bar with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Động thái & Nguồn Sụt giảm Pageview theo Tháng
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bóc tách từng nguồn lưu lượng so với mốc Trung vị chuẩn chu kỳ năm 2026
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Toggle Trend Chart */}
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

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/70">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({processedRows.length})
            </button>
            <button
              onClick={() => setFilterType('drop')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'drop'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Sụt giảm ({dropsOnly.length})
            </button>
            <button
              onClick={() => setFilterType('internal')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'internal'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nội bộ (I_*)
            </button>
            <button
              onClick={() => setFilterType('external')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'external'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nguồn ngoài (E_*)
            </button>
          </div>

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
              <option value="growth">Tăng trưởng tốt nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Top 3 Highlight Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Deepest Deficit Source */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Nguồn Sụt Giảm Sâu Nhất</span>
            {dropSharePct > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200/70">
                Chiếm {dropSharePct}% lượng hụt
              </span>
            )}
          </div>
          {deepestDrop ? (
            <div className="mt-2 space-y-1">
              <div className="text-base font-bold text-rose-600 font-mono flex items-center gap-2">
                <span>{deepestDrop.code}</span>
                <span>{formatDelta(deepestDrop.deltaMedian)} PV</span>
                <span className="text-xs font-semibold">({formatPercent(deepestDrop.pctChangeMedian)})</span>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Tháng này: <strong className="text-slate-700">{formatNumber(deepestDrop.t8)}</strong>
                {'  '}| Trung vị: <strong className="text-slate-700">{formatNumber(deepestDrop.median)}</strong>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-2">Không có nguồn sụt giảm</div>
          )}
        </div>

        {/* Card 2: External vs Internal Balance */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Cán Cân External vs. Internal</div>
          <div className="mt-2 space-y-1 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">External:</span>
              <span className="font-semibold text-slate-700">
                {formatNumber(externalT8)} PV{' '}
                <span className={externalDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  ({formatDelta(externalDelta)} | {formatPercent(externalPct)})
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Internal:</span>
              <span className="font-semibold text-slate-700">
                {formatNumber(internalT8)} PV{' '}
                <span className={internalDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  ({formatDelta(internalDelta)} | {formatPercent(internalPct)})
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Best Performing Source */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Nguồn Tăng Trưởng Tốt Nhất</div>
          {bestGain ? (
            <div className="mt-2 space-y-1">
              <div className="text-base font-bold text-emerald-600 font-mono flex items-center gap-2">
                <span>{bestGain.code}</span>
                <span>{formatDelta(bestGain.deltaMedian)} PV</span>
                <span className="text-xs font-semibold">({formatPercent(bestGain.pctChangeMedian)})</span>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Tháng này: <strong className="text-slate-700">{formatNumber(bestGain.t8)}</strong>
                {'  '}| Trung vị: <strong className="text-slate-700">{formatNumber(bestGain.median)}</strong>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-2 italic">
              Chưa có nguồn nào vượt mốc trung vị trong tháng hiện tại.
            </div>
          )}
        </div>
      </div>

      {/* 3. Collapsible Trend Line Chart */}
      {showChart && (
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 transition-all">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-800">
              Đường xu hướng các nguồn truy cập qua 8 tháng (Triệu PV)
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
                {sourcesConfig.map((src) => (
                  <Line
                    key={src.code}
                    type="monotone"
                    dataKey={src.code}
                    stroke={src.color}
                    strokeWidth={src.key === selectedKey ? 3.5 : 2}
                    dot={{ r: 3, fill: src.color }}
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
              <th className="py-3 px-4 font-sans">Kênh Nguồn (Channel)</th>
              <th className="py-3 px-4 text-right font-sans">Tỷ Trọng Tháng Này</th>
              <th className="py-3 px-4 text-right font-sans">Tháng Này (Tháng 8)</th>
              <th className="py-3 px-4 text-right font-sans">Mốc Trung Vị (2026)</th>
              <th className="py-3 px-4 text-right font-sans min-w-[200px]">Lệch vs. Trung Vị</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedRows.map((row) => {
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
                  {/* Channel with Color Dot & Badge */}
                  <td className="py-3.5 px-4 font-sans font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="font-semibold text-slate-900">{row.code}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200/70">
                        {row.type}
                      </span>
                      {isSelected && (
                        <span className="text-[11px] text-blue-600 font-semibold">• Đang chọn</span>
                      )}
                    </div>
                  </td>

                  {/* Share % */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="font-bold text-slate-900">{formatPercent(row.shareT8, false)}</div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      Chuẩn: {formatPercent(row.shareMedian, false)}
                    </div>
                  </td>

                  {/* Month 8 Value + MoM subtext */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="font-bold text-slate-900">{formatNumber(row.t8)}</div>
                    <div
                      className={`text-[10px] font-sans ${
                        row.deltaMoM >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      MoM: {formatPercent(row.pctChangeMoM)}
                    </div>
                  </td>

                  {/* Median Benchmark */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="font-semibold text-slate-700">{formatNumber(row.median)}</div>
                    <div className="text-[10px] text-slate-400 font-sans">Chuẩn 2026</div>
                  </td>

                  {/* Deviation vs Median + Sleek Progress Bar */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className={`font-bold ${isDrop ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatDelta(row.deltaMedian)} ({formatPercent(row.pctChangeMedian)})
                    </div>

                    {/* Deficit Bar indicator underneath number */}
                    <div className="w-full max-w-[170px] h-1.5 bg-slate-100 rounded-full overflow-hidden relative mt-1.5 ml-auto flex justify-end">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isDrop ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${barWidthPct}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Table Total Summary Footer */}
          <tfoot className="bg-slate-50 font-sans border-t-2 border-slate-200">
            <tr className="font-semibold text-slate-900">
              <td className="py-3.5 px-4 font-bold text-xs uppercase tracking-tight">
                TỔNG TOÀN BỘ NGUỒN (INTERNAL + EXTERNAL)
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-bold text-xs">
                100%
              </td>
              <td className="py-3.5 px-4 text-right font-mono">
                <div className="font-bold text-xs text-slate-900">{formatNumber(totalT8)}</div>
                <div
                  className={`text-[10px] font-sans ${
                    totalDeltaMom >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  MoM: {formatPercent(totalMom > 0 ? (totalDeltaMom / totalMom) * 100 : 0)}
                </div>
              </td>
              <td className="py-3.5 px-4 text-right font-mono">
                <div className="font-bold text-xs text-slate-900">{formatNumber(totalMed)}</div>
                <div className="text-[10px] text-slate-400 font-sans">Chuẩn 2026</div>
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
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
