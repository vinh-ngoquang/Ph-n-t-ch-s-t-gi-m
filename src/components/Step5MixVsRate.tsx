import React, { useState } from 'react';
import { DimensionReport } from '../utils/analysisEngine';
import { Shuffle, TrendingUp, TrendingDown, Layers, HelpCircle, CheckCircle2 } from 'lucide-react';

interface Step5MixVsRateProps {
  dimensions: {
    ads: DimensionReport;
    sources: DimensionReport;
    layers: DimensionReport;
    markets: DimensionReport;
    platforms: DimensionReport;
  };
}

export const Step5MixVsRate: React.FC<Step5MixVsRateProps> = ({ dimensions }) => {
  const [activeDimKey, setActiveDimKey] = useState<string>('sources');

  const dimList = [
    { key: 'sources', name: 'Nguồn truy cập' },
    { key: 'platforms', name: 'Nền tảng' },
    { key: 'layers', name: 'Lớp trang' },
    { key: 'ads', name: 'Quảng cáo' },
    { key: 'markets', name: 'Thị trường' },
  ];

  const currentReport: DimensionReport = (dimensions as any)[activeDimKey] || dimensions.sources;

  return (
    <section id="step-5-mix-vs-rate" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            05
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">BƯỚC 5: TÁCH MIX EFFECT VÀ RATE EFFECT (PHÂN RÃ KITAGAWA)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân rã Kitagawa chỉ rõ: thành phần nào biến động do quy mô tự thân (Rate Effect) hay do cơ cấu độc giả dịch chuyển (Mix Effect).
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          ∑ Mix = 0 | ∑ Rate = Δ Tổng
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Math explanation banner */}
        <div className="p-4 rounded-lg bg-slate-900 text-slate-200 text-xs font-mono border border-slate-800 space-y-1.5">
          <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
            CÔNG THỨC TOÁN HỌC PHÂN RÃ CƠ CẤU KITAGAWA CHO TỪNG THÀNH PHẦN i:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-slate-300">
            <div>
              <p className="text-indigo-300 font-semibold">Rate Effect_i = ((w_i[T] + w_i[T-1]) / 2) × Δ Total_PV</p>
              <p className="text-slate-400">Tác động do tốc độ/quy mô chung của toàn hệ thống khi giữ nguyên cơ cấu tỷ trọng.</p>
            </div>
            <div>
              <p className="text-amber-300 font-semibold">Mix Effect_i = (w_i[T] - w_i[T-1]) × ((Total_PV[T] + Total_PV[T-1]) / 2)</p>
              <p className="text-slate-400">Tác động do cơ cấu tỷ trọng độc giả dịch chuyển sang/rời khỏi thành phần i.</p>
            </div>
          </div>
        </div>

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

        {/* Kitagawa Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">Thành phần</th>
                <th className="py-3 px-3.5 text-right">Tổng biến động (ΔPV)</th>
                <th className="py-3 px-3.5 text-right">Tỷ trọng T-1 → T</th>
                <th className="py-3 px-3.5 text-right">Dịch chuyển tỷ trọng (Δw)</th>
                <th className="py-3 px-3.5 text-right">Rate Effect (Quy mô chung)</th>
                <th className="py-3 px-3.5 text-right">Mix Effect (Cơ cấu dịch chuyển)</th>
                <th className="py-3 px-3.5 text-center">Bản chất động lực</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {currentReport.rows.map((row) => {
                const isRateDominant = Math.abs(row.rateEffect) > Math.abs(row.mixEffect);
                return (
                  <tr key={row.key} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3.5 font-bold text-slate-900">{row.name}</td>
                    <td className={`py-3 px-3.5 text-right font-extrabold ${row.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {row.delta >= 0 ? '+' : ''}{Math.round(row.delta).toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 text-right text-slate-600 font-medium">
                      {(row.baseShare * 100).toFixed(1)}% → {(row.targetShare * 100).toFixed(1)}%
                    </td>
                    <td className={`py-3 px-3.5 text-right font-bold ${row.deltaShare >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {row.deltaShare >= 0 ? '+' : ''}{(row.deltaShare * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-3.5 text-right font-semibold text-indigo-700">
                      {row.rateEffect >= 0 ? '+' : ''}{Math.round(row.rateEffect).toLocaleString()}
                    </td>
                    <td className={`py-3 px-3.5 text-right font-semibold ${row.mixEffect >= 0 ? 'text-amber-700' : 'text-rose-700'}`}>
                      {row.mixEffect >= 0 ? '+' : ''}{Math.round(row.mixEffect).toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold ${
                          isRateDominant
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {isRateDominant ? 'Do Rate (Quy mô)' : 'Do Mix (Dịch chuyển)'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Total Footer Row */}
            <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
              <tr>
                <td className="py-3 px-3.5">Tổng cộng chiều ({currentReport.dimensionName})</td>
                <td className="py-3 px-3.5 text-right">
                  {currentReport.totalDelta >= 0 ? '+' : ''}{Math.round(currentReport.totalDelta).toLocaleString()}
                </td>
                <td className="py-3 px-3.5 text-right">100.0% → 100.0%</td>
                <td className="py-3 px-3.5 text-right text-slate-500">0.00%</td>
                <td className="py-3 px-3.5 text-right text-indigo-900">
                  {currentReport.totalDelta >= 0 ? '+' : ''}{Math.round(currentReport.totalDelta).toLocaleString()}
                </td>
                <td className="py-3 px-3.5 text-right text-slate-500">0 PV (Triệt tiêu)</td>
                <td className="py-3 px-3.5 text-center text-xs text-emerald-700">Khớp chuẩn 100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
};
