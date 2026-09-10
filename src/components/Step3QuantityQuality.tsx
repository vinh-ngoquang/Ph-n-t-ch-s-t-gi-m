import React from 'react';
import { LMDIResult, OverviewMetrics } from '../utils/analysisEngine';
import { Scale, ArrowRight, CheckCircle2, TrendingUp, TrendingDown, Layers, Sparkles } from 'lucide-react';

interface Step3QuantityQualityProps {
  lmdi: LMDIResult;
  overview: OverviewMetrics;
}

export const Step3QuantityQuality: React.FC<Step3QuantityQualityProps> = ({ lmdi, overview }) => {
  const { volumeEffect, volumeEffectPct, yieldEffect, yieldEffectPct, primaryDriver, verdictText, shapleyVolumeEffect, shapleyYieldEffect } = lmdi;
  const deltaPV = overview.pageviews.delta;

  return (
    <section id="step-3-quantity-quality" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            03
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">BƯỚC 3: TÁCH LƯỢNG VÀ CHẤT (TÁC ĐỘNG TỔNG THỂ)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân rã biến động Pageviews theo phương pháp LMDI (Logarithmic Mean Divisia Index) & Shapley Decomposition.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200">
          Không phần dư (Zero Residual)
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Formula Box */}
        <div className="p-4 rounded-lg bg-slate-900 text-slate-200 text-xs font-mono border border-slate-800 space-y-2">
          <div className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            CÔNG THỨC TOÁN HỌC PHÂN RÃ LMDI (LOGARITHMIC MEAN DIVISIA INDEX):
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-slate-300">
            <div>
              <p className="text-white font-semibold">Pageviews (Y) = Articles (A) × Yield (Q)</p>
              <p className="text-slate-400 mt-0.5">Hàm log trung bình: L(Y_T, Y_0) = (Y_T - Y_0) / (ln(Y_T) - ln(Y_0))</p>
            </div>
            <div>
              <p className="text-emerald-400">ΔY_Volume (Lượng) = L(Y_T, Y_0) × ln(A_T / A_0)</p>
              <p className="text-amber-400">ΔY_Yield (Chất) = L(Y_T, Y_0) × ln(Q_T / Q_0)</p>
              <p className="text-slate-400 mt-0.5">Tổng: ΔY_Volume + ΔY_Yield = Δ Pageviews (Chính xác 100%)</p>
            </div>
          </div>
        </div>

        {/* Decomposition Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Volume Effect */}
          <div className={`p-5 rounded-xl border ${volumeEffect >= 0 ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                1. Tác Động Quy Mô (Volume Effect - Lượng)
              </span>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${volumeEffect >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {volumeEffect >= 0 ? '+' : ''}{volumeEffectPct.toFixed(1)}% biến động
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 my-1">
              {volumeEffect >= 0 ? '+' : ''}{Math.round(volumeEffect).toLocaleString()} <span className="text-xs font-medium text-slate-500">PV</span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Tác động thuần túy do thay đổi <strong>số lượng bài viết xuất bản</strong> (từ {Math.round(overview.articles.base).toLocaleString()} lên {Math.round(overview.articles.target).toLocaleString()} bài, Δ: {overview.articles.delta >= 0 ? '+' : ''}{overview.articles.pctGrowth.toFixed(1)}%).
            </p>
            <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 flex justify-between">
              <span>Kiểm chứng Shapley Decomposition:</span>
              <strong className="text-slate-700">{shapleyVolumeEffect >= 0 ? '+' : ''}{Math.round(shapleyVolumeEffect).toLocaleString()} PV</strong>
            </div>
          </div>

          {/* Card 2: Yield Effect */}
          <div className={`p-5 rounded-xl border ${yieldEffect >= 0 ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                2. Tác Động Chất Lượng (Yield Effect - Chất)
              </span>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${yieldEffect >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {yieldEffect >= 0 ? '+' : ''}{yieldEffectPct.toFixed(1)}% biến động
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 my-1">
              {yieldEffect >= 0 ? '+' : ''}{Math.round(yieldEffect).toLocaleString()} <span className="text-xs font-medium text-slate-500">PV</span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Tác động thuần túy do thay đổi <strong>số PV trung bình trên mỗi bài viết</strong> (từ {overview.yield.base.toFixed(0)} sang {overview.yield.target.toFixed(0)} PV/bài, Δ: {overview.yield.delta >= 0 ? '+' : ''}{overview.yield.pctGrowth.toFixed(1)}%).
            </p>
            <div className="mt-3 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 flex justify-between">
              <span>Kiểm chứng Shapley Decomposition:</span>
              <strong className="text-slate-700">{shapleyYieldEffect >= 0 ? '+' : ''}{Math.round(shapleyYieldEffect).toLocaleString()} PV</strong>
            </div>
          </div>
        </div>

        {/* Visual Waterfall Balance Bar */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
            <span>Cân bằng phân rã LMDI:</span>
            <span>
              Δ Pageviews = {deltaPV >= 0 ? '+' : ''}{Math.round(deltaPV).toLocaleString()} PV
            </span>
          </div>
          <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${Math.min(Math.max((Math.abs(volumeEffect) / (Math.abs(volumeEffect) + Math.abs(yieldEffect) || 1)) * 100, 10), 90)}%` }}
              className={`h-full ${volumeEffect >= 0 ? 'bg-emerald-500' : 'bg-rose-500'} transition-all`}
              title={`Volume Effect: ${Math.round(volumeEffect).toLocaleString()}`}
            />
            <div
              style={{ width: `${Math.min(Math.max((Math.abs(yieldEffect) / (Math.abs(volumeEffect) + Math.abs(yieldEffect) || 1)) * 100, 10), 90)}%` }}
              className={`h-full ${yieldEffect >= 0 ? 'bg-indigo-500' : 'bg-amber-500'} transition-all`}
              title={`Yield Effect: ${Math.round(yieldEffect).toLocaleString()}`}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 mt-2">
            <span className="flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded-full ${volumeEffect >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              Lượng (Volume Effect): {volumeEffect >= 0 ? '+' : ''}{Math.round(volumeEffect).toLocaleString()} PV
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded-full ${yieldEffect >= 0 ? 'bg-indigo-500' : 'bg-amber-500'}`} />
              Chất (Yield Effect): {yieldEffect >= 0 ? '+' : ''}{Math.round(yieldEffect).toLocaleString()} PV
            </span>
          </div>
        </div>

        {/* Diagnostic Verdict */}
        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-start gap-3.5 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              KẾT LUẬN ĐỘNG LỰC CHÍNH (KEY DRIVER VERDICT)
            </div>
            <p className="text-sm font-semibold text-slate-100 leading-relaxed">
              {verdictText}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
