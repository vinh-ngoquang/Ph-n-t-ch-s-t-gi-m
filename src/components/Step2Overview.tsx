import React from 'react';
import { OverviewMetrics } from '../utils/analysisEngine';
import { TrendingUp, TrendingDown, ArrowRight, Eye, FileText, Zap, Calendar, Sparkles } from 'lucide-react';

interface Step2OverviewProps {
  overview: OverviewMetrics;
  periodT1: string;
  periodT: string;
  folderName: string;
}

export const Step2Overview: React.FC<Step2OverviewProps> = ({
  overview,
  periodT1,
  periodT,
  folderName,
}) => {
  const { pageviews, articles, yield: yieldMetric, dailyPV, dailyArticles, oneSentenceVerdict } = overview;

  return (
    <section id="step-2-overview" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            02
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">BƯỚC 2: BỨC TRANH TỔNG QUAN — QUY MÔ</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              So sánh quy mô tăng trưởng tổng thể: Pageviews, Articles và Tỷ lệ chuyển đổi hiệu quả PV/Article.
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold px-3 py-1 bg-slate-100 border border-slate-300 rounded-full text-slate-700">
          Phạm vi: {folderName === '1000000' ? 'Toàn trang VnExpress' : folderName}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Pageviews */}
          <div className="p-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white relative shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Eye className="w-4 h-4 text-indigo-600" />
                Tổng Pageviews
              </span>
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                  pageviews.delta >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {pageviews.delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {pageviews.delta >= 0 ? '+' : ''}
                {pageviews.pctGrowth.toFixed(2)}%
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {Math.round(pageviews.target).toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-medium">PV</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div>
                Kỳ [T-1]: <span className="font-semibold text-slate-800">{Math.round(pageviews.base).toLocaleString()}</span>
              </div>
              <div>
                Δ: <span className={`font-bold ${pageviews.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {pageviews.delta >= 0 ? '+' : ''}{Math.round(pageviews.delta).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Articles */}
          <div className="p-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white relative shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <FileText className="w-4 h-4 text-blue-600" />
                Tổng Bài Xuất Bản (Articles)
              </span>
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                  articles.delta >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {articles.delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {articles.delta >= 0 ? '+' : ''}
                {articles.pctGrowth.toFixed(2)}%
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {Math.round(articles.target).toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-medium">Bài</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div>
                Kỳ [T-1]: <span className="font-semibold text-slate-800">{Math.round(articles.base).toLocaleString()}</span>
              </div>
              <div>
                Δ: <span className={`font-bold ${articles.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {articles.delta >= 0 ? '+' : ''}{Math.round(articles.delta).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Yield (PV/Article) */}
          <div className="p-5 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white relative shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Zap className="w-4 h-4 text-amber-600" />
                Hiệu Suất PV / Bài (Yield)
              </span>
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                  yieldMetric.delta >= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {yieldMetric.delta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {yieldMetric.delta >= 0 ? '+' : ''}
                {yieldMetric.pctGrowth.toFixed(2)}%
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {yieldMetric.target.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
              <span className="text-xs text-slate-500 font-medium">PV/bài</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div>
                Kỳ [T-1]: <span className="font-semibold text-slate-800">{yieldMetric.base.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
              </div>
              <div>
                Δ: <span className={`font-bold ${yieldMetric.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {yieldMetric.delta >= 0 ? '+' : ''}{yieldMetric.delta.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 1-Sentence Preliminary Verdict */}
        <div className="p-5 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-1">
              ĐÁNH GIÁ SƠ BỘ BẰNG 1 CÂU (PRELIMINARY VERDICT)
            </div>
            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
              {oneSentenceVerdict}
            </p>
          </div>
        </div>

        {/* Daily Averages Sub-bar */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Chỉ số trung bình ngày (Daily Averages):</span>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-500">PV Trung bình ngày: </span>
              <strong className="text-slate-900">{Math.round(dailyPV.target).toLocaleString()} PV/ngày</strong>
              <span className={`ml-1 font-semibold ${dailyPV.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ({dailyPV.delta >= 0 ? '+' : ''}{dailyPV.pctGrowth.toFixed(1)}%)
              </span>
            </div>
            <div>
              <span className="text-slate-500">Bài xuất bản / ngày: </span>
              <strong className="text-slate-900">{dailyArticles.target.toFixed(1)} bài/ngày</strong>
              <span className={`ml-1 font-semibold ${dailyArticles.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ({dailyArticles.delta >= 0 ? '+' : ''}{dailyArticles.pctGrowth.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
