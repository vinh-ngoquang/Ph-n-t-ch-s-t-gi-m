import React, { useState, useMemo } from 'react';
import {
  computeYoYFolderRanking,
  YoYFolderItem,
} from '../../../utils/yoyAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../../../utils/formatters';
import {
  FolderTree,
  Search,
  Filter,
  TrendingDown,
  TrendingUp,
  ArrowUpDown,
  Eye,
  X,
} from 'lucide-react';
import { RAW_DATASET } from '../../../data/dataset';
import { NewsRecord } from '../../../types';

interface Props {
  dataset?: NewsRecord[];
  currentScope?: string;
  onScopeChange?: (scope: string) => void;
  monthsRangeLabel?: string;
}

export const FolderBreakdownYoYView: React.FC<Props> = ({
  dataset,
  currentScope = 'ALL_FOLDERS_AGG',
  onScopeChange,
  monthsRangeLabel = 'T1 - T8',
}) => {
  const currentData = dataset || RAW_DATASET;

  const { items, totalPV2026, totalPV2025, deltaPVTotal, pctDeltaTotal } = useMemo(() => {
    return computeYoYFolderRanking(currentData);
  }, [currentData]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'vne' | 'ngoisao' | 'english' | 'drop' | 'gain'>('all');
  const [sortBy, setSortBy] = useState<'deficit' | 'volume26' | 'growth' | 'articles'>('deficit');

  // Filter items
  const filteredList = useMemo(() => {
    return items.filter((item) => {
      // 1. Search filter
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = item.folderName.toLowerCase().includes(q);
        const matchId = item.folderId.toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }

      // 2. Type filter
      if (filterType === 'vne') {
        if (item.isSpecial) return false;
      } else if (filterType === 'ngoisao') {
        if (!item.folderName.toLowerCase().includes('ngôi sao') && item.folderId !== '1002835') return false;
      } else if (filterType === 'english') {
        if (!item.folderName.toLowerCase().includes('english') && item.folderId !== '1003888') return false;
      } else if (filterType === 'drop') {
        if (item.deltaPV >= 0) return false;
      } else if (filterType === 'gain') {
        if (item.deltaPV < 0) return false;
      }

      return true;
    });
  }, [items, searchTerm, filterType]);

  // Sort items
  const sortedList = useMemo(() => {
    return [...filteredList].sort((a, b) => {
      if (sortBy === 'deficit') {
        return a.deltaPV - b.deltaPV; // deepest drop first
      } else if (sortBy === 'volume26') {
        return b.pv2026 - a.pv2026; // largest 2026 volume first
      } else if (sortBy === 'growth') {
        return b.pctDeltaPV - a.pctDeltaPV; // highest growth first
      } else if (sortBy === 'articles') {
        return b.articles2026 - a.articles2026;
      }
      return 0;
    });
  }, [filteredList, sortBy]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                24 Chuyên Mục: Đối Chiếu Tổng 2026 so với Cùng Kỳ 2025
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Lũy kế {monthsRangeLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Bảng theo dõi toàn diện 24 ban chuyên mục và chuyên trang, đối chiếu tăng trưởng/sụt giảm YoY, tỷ trọng đóng góp và hiệu suất bài viết.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Tổng 24 Ban:</span>
          <span className={`font-bold font-mono px-2.5 py-1 rounded-md border ${
            deltaPVTotal >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {formatDelta(deltaPVTotal)} ({formatPercent(pctDeltaTotal)})
          </span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            Tất cả (24 Ban)
          </button>
          <button
            onClick={() => setFilterType('vne')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              filterType === 'vne'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            VnExpress
          </button>
          <button
            onClick={() => setFilterType('ngoisao')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              filterType === 'ngoisao'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            Ngôi Sao
          </button>
          <button
            onClick={() => setFilterType('english')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              filterType === 'english'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setFilterType('drop')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              filterType === 'drop'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
            }`}
          >
            Chỉ xem Ban Giảm
          </button>
          <button
            onClick={() => setFilterType('gain')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              filterType === 'gain'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            Chỉ xem Ban Tăng
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm chuyên mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 sm:w-56"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-slate-500 font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="deficit">Giảm nhiều nhất</option>
              <option value="volume26">Lưu lượng 2026 cao nhất</option>
              <option value="growth">Tăng trưởng % cao nhất</option>
              <option value="articles">Sản lượng bài nhiều nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto border border-slate-200/90 rounded-xl shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold select-none">
              <th className="py-3 px-3.5 text-slate-900">STT & Chuyên Mục</th>
              <th className="py-3 px-3 text-right">Tổng 2026 (PV)</th>
              <th className="py-3 px-3 text-right">Cùng Kỳ 2025 (PV)</th>
              <th className="py-3 px-3 text-right">Chênh Lệch (+/-)</th>
              <th className="py-3 px-3 text-right">% YoY</th>
              <th className="py-3 px-3 text-right">Tỷ Trọng 2026</th>
              <th className="py-3 px-3 text-right">Tỷ Trọng 2025</th>
              <th className="py-3 px-3 text-right">Tổng Bài 2026</th>
              <th className="py-3 px-3 text-right">PV/Bài (2026)</th>
              <th className="py-3 px-3.5 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedList.map((item, idx) => {
              const isDrop = item.deltaPV < 0;
              const isSelected = currentScope === item.folderId;
              const pvPerArt = item.articles2026 > 0 ? Math.round(item.pv2026 / item.articles2026) : 0;

              return (
                <tr
                  key={item.folderId}
                  className={`transition ${isSelected ? 'bg-blue-50/70 font-medium' : 'hover:bg-slate-50/80'}`}
                >
                  <td className="py-2.5 px-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center text-[10px] font-mono text-slate-400 font-medium">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{item.folderName}</span>
                          {item.isSpecial && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              Chuyên trang
                            </span>
                          )}
                          {isSelected && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-600 text-white">
                              Đang xem
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">ID: {item.folderId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatNumber(item.pv2026)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    {formatNumber(item.pv2025)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    <span className={isDrop ? 'text-rose-600' : 'text-emerald-600'}>
                      {formatDelta(item.deltaPV)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    <span className={`inline-flex items-center gap-0.5 ${isDrop ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isDrop ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                      <span>{formatPercent(item.pctDeltaPV)}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                    {formatPercent(item.share2026)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                    {formatPercent(item.share2025)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    {formatNumber(item.articles2026)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600 font-medium">
                    {formatNumber(pvPerArt)}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    {onScopeChange && (
                      <button
                        onClick={() => onScopeChange(item.folderId)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                        title={`Lọc xem chi tiết ban ${item.folderName}`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>{isSelected ? 'Đang chọn' : 'Xem Ban'}</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100/80 font-bold border-t border-slate-200 text-slate-900">
              <td className="py-3 px-3.5">
                Tổng Số ({sortedList.length} Chuyên mục hiển thị)
              </td>
              <td className="py-3 px-3 text-right font-mono">{formatNumber(totalPV2026)}</td>
              <td className="py-3 px-3 text-right font-mono">{formatNumber(totalPV2025)}</td>
              <td className="py-3 px-3 text-right font-mono">
                <span className={deltaPVTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {formatDelta(deltaPVTotal)}
                </span>
              </td>
              <td className="py-3 px-3 text-right font-mono">
                <span className={deltaPVTotal >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {formatPercent(pctDeltaTotal)}
                </span>
              </td>
              <td className="py-3 px-3 text-right font-mono">100.0%</td>
              <td className="py-3 px-3 text-right font-mono">100.0%</td>
              <td className="py-3 px-3 text-right font-mono" colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
