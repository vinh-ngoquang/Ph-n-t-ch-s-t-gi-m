import React, { useMemo } from 'react';
import { YoYSummaryData, computeYoYDimensionRows } from '../../../utils/yoyAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../../../utils/formatters';
import { Layout, TrendingDown, TrendingUp, Globe } from 'lucide-react';
import { NewsRecord } from '../../../types';

interface Props {
  yoyData: YoYSummaryData;
}

export const PageMarketYoYView: React.FC<Props> = ({ yoyData }) => {
  const { sumRecord2026, sumRecord2025, monthsRangeLabel } = yoyData;

  // 1. Page types (Detail vs Listing)
  const pageConfig: { key: keyof NewsRecord; code: string; name: string; color: string }[] = [
    { key: 'pDetail', code: 'Detail', name: 'Trang Bài viết (Detail)', color: '#10b981' },
    { key: 'pListing', code: 'Listing', name: 'Trang Danh mục (Listing)', color: '#3b82f6' },
  ];

  const pageSummary = useMemo(() => {
    return computeYoYDimensionRows(sumRecord2026, sumRecord2025, 'pageviews', pageConfig);
  }, [sumRecord2026, sumRecord2025]);

  // 2. Markets (Domestic DO vs Overseas OV)
  const marketConfig: { key: keyof NewsRecord; code: string; name: string; color: string }[] = [
    { key: 'pDO', code: 'DO', name: 'Trong nước (Domestic - DO)', color: '#0ea5e9' },
    { key: 'pOV', code: 'OV', name: 'Nước ngoài (Overseas - OV)', color: '#f59e0b' },
  ];

  const marketSummary = useMemo(() => {
    return computeYoYDimensionRows(sumRecord2026, sumRecord2025, 'pageviews', marketConfig);
  }, [sumRecord2026, sumRecord2025]);

  return (
    <div className="space-y-6">
      {/* SECTION 1: LỚP TRANG (PAGE LAYERS) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Lớp Trang (Page Types): Trang Bài Viết (Detail) vs Trang Danh Mục (Listing)
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Lũy kế {monthsRangeLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                So sánh hiệu quả phân phối lưu lượng giữa lớp nội dung đọc sâu (Trang bài viết) và lớp điều hướng duyệt mục (Trang danh mục).
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200/90 rounded-xl shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th className="py-3 px-3.5 text-slate-900">Lớp Trang</th>
                <th className="py-3 px-3 text-right">Tổng 2026 (PV)</th>
                <th className="py-3 px-3 text-right">Cùng Kỳ 2025 (PV)</th>
                <th className="py-3 px-3 text-right">Chênh Lệch (+/-)</th>
                <th className="py-3 px-3 text-right">% YoY</th>
                <th className="py-3 px-3 text-right">Tỷ Trọng 2026</th>
                <th className="py-3 px-3 text-right">Tỷ Trọng 2025</th>
                <th className="py-3 px-3.5 text-right">Thay Đổi Tỷ Trọng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageSummary.rows.map((row) => {
                const isDrop = row.delta < 0;
                return (
                  <tr key={row.key} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3.5 font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                      <span>{row.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatNumber(row.val2026)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {formatNumber(row.val2025)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={isDrop ? 'text-rose-600' : 'text-emerald-600'}>
                        {formatDelta(row.delta)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={`inline-flex items-center gap-0.5 ${isDrop ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isDrop ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        <span>{formatPercent(row.pctDelta)}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      {formatPercent(row.share2026)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {formatPercent(row.share2025)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                      <span className={row.deltaShare >= 0 ? 'text-emerald-600' : 'text-slate-500'}>
                        {row.deltaShare >= 0 ? `+${row.deltaShare.toFixed(2)} pts` : `${row.deltaShare.toFixed(2)} pts`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: THỊ TRƯỜNG (MARKETS) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Thị Trường Độc Giả: Trong Nước (DO) vs Nước Ngoài (OV)
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Lũy kế {monthsRangeLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Đối chiếu phân bổ lưu lượng từ độc giả nội địa (Domestic) và kiều bào hải ngoại (Overseas).
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200/90 rounded-xl shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th className="py-3 px-3.5 text-slate-900">Thị Trường</th>
                <th className="py-3 px-3 text-right">Tổng 2026 (PV)</th>
                <th className="py-3 px-3 text-right">Cùng Kỳ 2025 (PV)</th>
                <th className="py-3 px-3 text-right">Chênh Lệch (+/-)</th>
                <th className="py-3 px-3 text-right">% YoY</th>
                <th className="py-3 px-3 text-right">Tỷ Trọng 2026</th>
                <th className="py-3 px-3 text-right">Tỷ Trọng 2025</th>
                <th className="py-3 px-3.5 text-right">Thay Đổi Tỷ Trọng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marketSummary.rows.map((row) => {
                const isDrop = row.delta < 0;
                return (
                  <tr key={row.key} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3.5 font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                      <span>{row.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatNumber(row.val2026)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      {formatNumber(row.val2025)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={isDrop ? 'text-rose-600' : 'text-emerald-600'}>
                        {formatDelta(row.delta)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={`inline-flex items-center gap-0.5 ${isDrop ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isDrop ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        <span>{formatPercent(row.pctDelta)}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                      {formatPercent(row.share2026)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {formatPercent(row.share2025)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                      <span className={row.deltaShare >= 0 ? 'text-emerald-600' : 'text-slate-500'}>
                        {row.deltaShare >= 0 ? `+${row.deltaShare.toFixed(2)} pts` : `${row.deltaShare.toFixed(2)} pts`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
