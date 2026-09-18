import React, { useMemo } from 'react';
import { YoYSummaryData } from '../../../utils/yoyAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../../../utils/formatters';
import { Edit3, TrendingDown, TrendingUp, Sparkles } from 'lucide-react';

interface Props {
  yoyData: YoYSummaryData;
}

export const ArticleProductionYoYView: React.FC<Props> = ({ yoyData }) => {
  const {
    sumRecord2026,
    sumRecord2025,
    monthsRangeLabel,
    pv2026,
    pv2025,
    articles2026,
    articles2025,
    deltaArticles,
    pctDeltaArticles,
    buildTop2026,
    buildTop2025,
    deltaBuildTop,
    pctDeltaBuildTop,
    buildRate2026,
    buildRate2025,
  } = yoyData;

  const thuong26 = sumRecord2026.articleThuong || 0;
  const thuong25 = sumRecord2025.articleThuong || 0;
  const deltaThuong = thuong26 - thuong25;
  const pctThuong = thuong25 > 0 ? (deltaThuong / thuong25) * 100 : 0;

  const tmai26 = sumRecord2026.articleThuongMai || 0;
  const tmai25 = sumRecord2025.articleThuongMai || 0;
  const deltaTmai = tmai26 - tmai25;
  const pctTmai = tmai25 > 0 ? (deltaTmai / tmai25) * 100 : 0;

  const nonBt26 = sumRecord2026.aNonBuildTop || 0;
  const nonBt25 = sumRecord2025.aNonBuildTop || 0;
  const deltaNonBt = nonBt26 - nonBt25;
  const pctNonBt = nonBt25 > 0 ? (deltaNonBt / nonBt25) * 100 : 0;

  const pvPerArt26 = articles2026 > 0 ? Math.round(pv2026 / articles2026) : 0;
  const pvPerArt25 = articles2025 > 0 ? Math.round(pv2025 / articles2025) : 0;
  const deltaPvPerArt = pvPerArt26 - pvPerArt25;
  const pctDeltaPvPerArt = pvPerArt25 > 0 ? (deltaPvPerArt / pvPerArt25) * 100 : 0;

  const rows = [
    {
      name: 'Tổng Sản Lượng Bài Viết',
      code: 'Articles',
      val26: articles2026,
      val25: articles2025,
      delta: deltaArticles,
      pct: pctDeltaArticles,
      color: '#3b82f6',
    },
    {
      name: 'Bài Biên Tập Thường (Editorial)',
      code: 'ArticleThuong',
      val26: thuong26,
      val25: thuong25,
      delta: deltaThuong,
      pct: pctThuong,
      color: '#10b981',
    },
    {
      name: 'Bài Thương Mại (Commercial)',
      code: 'ArticleThuongMai',
      val26: tmai26,
      val25: tmai25,
      delta: deltaTmai,
      pct: pctTmai,
      color: '#f59e0b',
    },
    {
      name: 'Bài Build Top (Trọng điểm)',
      code: 'BuildTop',
      val26: buildTop2026,
      val25: buildTop2025,
      delta: deltaBuildTop,
      pct: pctDeltaBuildTop,
      color: '#ef4444',
    },
    {
      name: 'Bài Non-Build Top',
      code: 'NonBuildTop',
      val26: nonBt26,
      val25: nonBt25,
      delta: deltaNonBt,
      pct: pctNonBt,
      color: '#64748b',
    },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Sản Lượng Bài Viết & Chất Lượng Nội Dung: Tổng 2026 vs Cùng Kỳ 2025
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Lũy kế {monthsRangeLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi sản lượng xuất bản, tỷ lệ bài Build Top và hiệu suất Pageviews trung bình trên mỗi bài viết (PV/bài).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Biến động sản lượng:</span>
          <span className={`font-bold font-mono px-2.5 py-1 rounded-md border ${
            deltaArticles >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {formatDelta(deltaArticles)} bài ({formatPercent(pctDeltaArticles)})
          </span>
        </div>
      </div>

      {/* 3 Key Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-500">Tỷ Lệ Bài Build Top</div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
            {buildRate2026.toFixed(1)}%
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2">
            <span>Cùng kỳ 2025: <strong className="font-mono text-slate-700">{buildRate2025.toFixed(1)}%</strong></span>
            <span className={`font-bold font-mono ${buildRate2026 >= buildRate2025 ? 'text-emerald-600' : 'text-slate-500'}`}>
              {buildRate2026 >= buildRate2025 ? `+${(buildRate2026 - buildRate2025).toFixed(1)} pts` : `${(buildRate2026 - buildRate2025).toFixed(1)} pts`}
            </span>
          </div>
        </div>

        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-500">Hiệu Suất PV Trung Bình / Bài</div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
            {formatNumber(pvPerArt26)} <span className="text-xs font-normal text-slate-400">PV/bài</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2">
            <span>Cùng kỳ 2025: <strong className="font-mono text-slate-700">{formatNumber(pvPerArt25)}</strong></span>
            <span className={`font-bold font-mono ${deltaPvPerArt >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatDelta(deltaPvPerArt)} ({formatPercent(pctDeltaPvPerArt)})
            </span>
          </div>
        </div>

        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-500">Tỷ Lệ Bài Thương Mại / Tổng Bài</div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
            {articles2026 > 0 ? ((tmai26 / articles2026) * 100).toFixed(1) : '0'}%
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-200/60 pt-2">
            <span>Tổng thương mại 2026: <strong className="font-mono text-slate-700">{formatNumber(tmai26)}</strong> bài</span>
            <span className={`font-bold font-mono ${deltaTmai >= 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
              {formatDelta(deltaTmai)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto border border-slate-200/90 rounded-xl shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold select-none">
              <th className="py-3 px-3.5 text-slate-900">Loại Bài Viết</th>
              <th className="py-3 px-3 text-right">Tổng 2026 (Bài)</th>
              <th className="py-3 px-3 text-right">Cùng Kỳ 2025 (Bài)</th>
              <th className="py-3 px-3 text-right">Chênh Lệch (+/-)</th>
              <th className="py-3 px-3 text-right">% YoY</th>
              <th className="py-3 px-3 text-right">Tỷ Trọng trong Tổng Bài (2026)</th>
              <th className="py-3 px-3.5 text-right">Tỷ Trọng trong Tổng Bài (2025)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const isDrop = row.delta < 0;
              const share26 = articles2026 > 0 ? (row.val26 / articles2026) * 100 : 0;
              const share25 = articles2025 > 0 ? (row.val25 / articles2025) * 100 : 0;
              return (
                <tr key={row.code} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3.5 font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                    <span>{row.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatNumber(row.val26)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    {formatNumber(row.val25)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    <span className={isDrop ? 'text-rose-600' : 'text-emerald-600'}>
                      {formatDelta(row.delta)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    <span className={`inline-flex items-center gap-0.5 ${isDrop ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isDrop ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                      <span>{formatPercent(row.pct)}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                    {row.code === 'Articles' ? '100.0%' : formatPercent(share26)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono text-slate-500">
                    {row.code === 'Articles' ? '100.0%' : formatPercent(share25)}
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
