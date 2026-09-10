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
import { LineChart as LineChartIcon } from 'lucide-react';
import { NewsRecord } from '../../types';

interface Props {
  monthlyData: MonthlyDataPoint[];
}

export const PlatformsView: React.FC<Props> = ({ monthlyData }) => {
  const platformConfig: { key: keyof NewsRecord; code: string; name: string; type: string; color: string }[] = [
    { key: 'pMobile', code: 'D_Mobile', name: 'Mobile Web (Điện thoại)', type: 'Web', color: '#10b981' },
    { key: 'pPC', code: 'D_PC', name: 'PC Desktop (Máy tính)', type: 'Desktop', color: '#3b82f6' },
    { key: 'pApp', code: 'D_App', name: 'VnExpress App (Ứng dụng)', type: 'App', color: '#8b5cf6' },
    { key: 'pTablet', code: 'D_Tablet', name: 'Tablet (Máy tính bảng)', type: 'Tablet', color: '#f59e0b' },
  ];

  const summary = useMemo(() => {
    return analyzeDimensionSeries(monthlyData, platformConfig, 'pageviews');
  }, [monthlyData]);

  const [showChart, setShowChart] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>('pPC');

  const totalT8 = summary.totalT8;
  const totalMom = summary.totalMoM;
  const totalMed = summary.totalMedian;
  const totalDeltaMed = totalT8 - totalMed;
  const totalDeltaMom = totalT8 - totalMom;

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
        month: item.shortLabel,
      };
      platformConfig.forEach((p) => {
        pt[p.code] = Number(((item[p.key] || 0) / 1_000_000).toFixed(2));
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
              Động thái & Nguồn Sụt giảm Nền tảng (Platforms & Devices)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Bóc tách lưu lượng theo thiết bị: Xác định đà suy yếu của PC Desktop so với Mobile Web
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
        {/* Card 1: Deepest Drop */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Nền Tảng Sụt Giảm Sâu Nhất</span>
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
            <div className="text-xs text-slate-400 mt-2">Không có nền tảng sụt giảm</div>
          )}
        </div>

        {/* Card 2: Mobile vs PC Balance */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Cán Cân Mobile Web vs. PC Desktop</div>
          <div className="mt-2 space-y-1 text-xs font-mono">
            {processedRows.slice(0, 2).map((r) => (
              <div key={r.key} className="flex items-center justify-between">
                <span className="text-slate-500 font-sans">{r.code}:</span>
                <span className="font-semibold text-slate-700">
                  {formatNumber(r.t8)} PV{' '}
                  <span className={r.deltaMedian >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    ({formatDelta(r.deltaMedian)} | {formatPercent(r.pctChangeMedian)})
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: App Status */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Tỷ Trọng Thiết Bị Di Động (Mobile + App)</div>
          <div className="mt-2 space-y-1">
            <div className="text-base font-bold text-slate-800 font-mono flex items-center gap-2">
              <span>
                {formatPercent(
                  ((processedRows.find((r) => r.key === 'pMobile')?.t8 || 0) +
                    (processedRows.find((r) => r.key === 'pApp')?.t8 || 0)) /
                    (totalT8 || 1) *
                    100,
                  false
                )}
              </span>
              <span className="text-xs font-semibold text-slate-500">(Áp đảo thị phần)</span>
            </div>
            <div className="text-xs text-slate-500 font-sans">
              Độc giả dịch chuyển mạnh mẽ sang smartphone và thói quen đọc nhanh.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Collapsible Trend Line Chart */}
      {showChart && (
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 transition-all">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-800">
              Đường xu hướng lượt xem trên từng nền tảng qua 8 tháng (Triệu PV)
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
              <th className="py-3 px-4 text-right font-sans">Tỷ Trọng Tháng Này</th>
              <th className="py-3 px-4 text-right font-sans">Tháng Này (Tháng 8)</th>
              <th className="py-3 px-4 text-right font-sans">Mốc Trung Vị (2026)</th>
              <th className="py-3 px-4 text-right font-sans min-w-[200px]">Lệch vs. Trung Vị</th>
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

                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="font-bold text-slate-900">{formatPercent(row.shareT8, false)}</div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      Chuẩn: {formatPercent(row.shareMedian, false)}
                    </div>
                  </td>

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
                TỔNG TOÀN BỘ NỀN TẢNG (MOBILE + PC + APP + TABLET)
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
