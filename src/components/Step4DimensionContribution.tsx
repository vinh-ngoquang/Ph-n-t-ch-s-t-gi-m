import React, { useState } from 'react';
import { DimensionReport, DimensionRow } from '../utils/analysisEngine';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Layers, Award, AlertCircle } from 'lucide-react';

interface Step4DimensionContributionProps {
  dimensions: {
    ads: DimensionReport;
    sources: DimensionReport;
    layers: DimensionReport;
    markets: DimensionReport;
    platforms: DimensionReport;
    articleSources: DimensionReport;
    articlePositions: DimensionReport;
  };
}

export const Step4DimensionContribution: React.FC<Step4DimensionContributionProps> = ({ dimensions }) => {
  const [activeDimKey, setActiveDimKey] = useState<string>('sources');

  const dimList = [
    { key: 'sources', name: 'Nguồn truy cập (7 nguồn)' },
    { key: 'platforms', name: 'Nền tảng (Mobile/PC/App)' },
    { key: 'layers', name: 'Lớp trang (Listing/Detail)' },
    { key: 'ads', name: 'Quảng cáo (-$ vs $)' },
    { key: 'markets', name: 'Thị trường (DO/OV)' },
    { key: 'articleSources', name: 'Nguồn sản xuất bài' },
    { key: 'articlePositions', name: 'Vị trí Build Top' },
  ];

  const currentReport: DimensionReport = (dimensions as any)[activeDimKey] || dimensions.sources;

  return (
    <section id="step-4-dimension-contribution" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            04
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">BƯỚC 4: PHÂN TÍCH ĐÓNG GÓP THEO CHIỀU (CONTRIBUTION)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Đo lường % đóng góp của từng thành phần vào tổng biến động theo công thức: (PV_i[T] - PV_i[T-1]) / |Tổng ΔPV| * 100%.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Dimension Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          {dimList.map((d) => (
            <button
              key={d.key}
              onClick={() => setActiveDimKey(d.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeDimKey === d.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{d.name}</span>
            </button>
          ))}
        </div>

        {/* Top 2 Drivers & Top 2 Drags Callout Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top 2 Drivers */}
          <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Top 2 Yếu Tố Kéo Tăng Mạnh Nhất ({currentReport.dimensionName})</span>
            </div>
            {currentReport.topDrivers.length > 0 ? (
              <div className="space-y-2">
                {currentReport.topDrivers.map((driver, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white p-2.5 rounded border border-emerald-100">
                    <div>
                      <strong className="text-slate-900">{driver.name}</strong>
                      <span className="text-slate-500 block text-[11px]">
                        Tăng +{Math.round(driver.delta).toLocaleString()} ({driver.pctGrowth >= 0 ? '+' : ''}{driver.pctGrowth.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                        +{driver.contributionPct.toFixed(1)}% đóng góp
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">Không có thành phần nào tăng trong chiều này.</div>
            )}
          </div>

          {/* Top 2 Drags */}
          <div className="p-4 rounded-lg bg-rose-50/60 border border-rose-200">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-900 mb-2">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <span>Top 2 Yếu Tố Kéo Giảm Mạnh Nhất ({currentReport.dimensionName})</span>
            </div>
            {currentReport.topDrags.length > 0 ? (
              <div className="space-y-2">
                {currentReport.topDrags.map((drag, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white p-2.5 rounded border border-rose-100">
                    <div>
                      <strong className="text-slate-900">{drag.name}</strong>
                      <span className="text-slate-500 block text-[11px]">
                        Giảm {Math.round(drag.delta).toLocaleString()} ({drag.pctGrowth.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
                        {drag.contributionPct.toFixed(1)}% kéo giảm
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">Không có thành phần nào giảm trong chiều này.</div>
            )}
          </div>
        </div>

        {/* Contribution Table (Ranked Descending) */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">Hạng</th>
                <th className="py-3 px-3.5">Thành phần ({currentReport.dimensionName})</th>
                <th className="py-3 px-3.5 text-right">Kỳ [T-1]</th>
                <th className="py-3 px-3.5 text-right">Kỳ [T]</th>
                <th className="py-3 px-3.5 text-right">Biến động (Δ)</th>
                <th className="py-3 px-3.5 text-right">% Tăng trưởng</th>
                <th className="py-3 px-3.5 text-right">Tỷ trọng T-1 → T</th>
                <th className="py-3 px-3.5 text-right">Contribution to Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {currentReport.rows.map((row, idx) => {
                const isPositive = row.delta >= 0;
                return (
                  <tr key={row.key} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3.5 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-900">{row.name}</td>
                    <td className="py-2.5 px-3.5 text-right text-slate-600">
                      {Math.round(row.baseVal).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-medium text-slate-900">
                      {Math.round(row.targetVal).toLocaleString()}
                    </td>
                    <td className={`py-2.5 px-3.5 text-right font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isPositive ? '+' : ''}{Math.round(row.delta).toLocaleString()}
                    </td>
                    <td className={`py-2.5 px-3.5 text-right font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isPositive ? '+' : ''}{row.pctGrowth.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-slate-500">
                      {(row.baseShare * 100).toFixed(1)}% → {(row.targetShare * 100).toFixed(1)}%
                      <span className={`ml-1 text-[11px] font-semibold ${row.deltaShare >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ({row.deltaShare >= 0 ? '+' : ''}{(row.deltaShare * 100).toFixed(1)}%)
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden flex justify-end">
                          <div
                            style={{ width: `${Math.min(Math.abs(row.contributionPct), 100)}%` }}
                            className={`h-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          />
                        </div>
                        <span className={`font-bold min-w-[50px] text-right ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isPositive ? '+' : ''}{row.contributionPct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
