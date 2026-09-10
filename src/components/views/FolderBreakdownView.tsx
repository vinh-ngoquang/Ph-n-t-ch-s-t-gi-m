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
import { computeFolderRanking, FolderComparisonItem, isSpecialPublication } from '../../utils/timeSeriesAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../../utils/formatters';
import { LineChart as LineChartIcon, Search, Filter, X, Eye } from 'lucide-react';
import { RAW_DATASET } from '../../data/dataset';
import { NewsRecord } from '../../types';

interface FolderBreakdownViewProps {
  dataset?: NewsRecord[];
  currentScope?: string;
  onScopeChange?: (scope: string) => void;
  selectedMonth?: string;
}

export const FolderBreakdownView: React.FC<FolderBreakdownViewProps> = ({
  dataset,
  currentScope = 'ALL_FOLDERS_AGG',
  onScopeChange,
  selectedMonth = '8/2026',
}) => {
  const currentData = dataset || RAW_DATASET;
  const allRankingList = useMemo(
    () => computeFolderRanking(currentData, selectedMonth),
    [currentData, selectedMonth]
  );

  const isSingleScope = Boolean(currentScope && currentScope !== 'ALL_FOLDERS_AGG' && currentScope !== 'ALL_VNE_AGG');
  const selectedFolder = useMemo(() => {
    if (!isSingleScope) return null;
    return allRankingList.find((r) => r.folderId === currentScope) || null;
  }, [allRankingList, isSingleScope, currentScope]);

  const overallRank = useMemo(() => {
    if (!selectedFolder) return 0;
    return allRankingList.findIndex((r) => r.folderId === currentScope) + 1;
  }, [allRankingList, selectedFolder, currentScope]);

  const totalMonthAll = useMemo(() => {
    return allRankingList.reduce((sum, item) => sum + item.curPV, 0);
  }, [allRankingList]);

  const folderShareMonth = useMemo(() => {
    if (!selectedFolder || totalMonthAll === 0) return 0;
    return (selectedFolder.curPV / totalMonthAll) * 100;
  }, [selectedFolder, totalMonthAll]);

  // When a specific scope is selected, user can optionally toggle to see all 24 rows
  const [showAllRowsWhenFiltered, setShowAllRowsWhenFiltered] = useState(false);

  const rankingList = useMemo(() => {
    if (isSingleScope && !showAllRowsWhenFiltered) {
      return selectedFolder ? [selectedFolder] : [];
    }
    return allRankingList;
  }, [allRankingList, isSingleScope, showAllRowsWhenFiltered, selectedFolder]);

  const [filterType, setFilterType] = useState<'all' | 'vne' | 'ngoisao' | 'english' | 'drop' | 'gain'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [sortBy, setSortBy] = useState<'deficit' | 'volume' | 'articles' | 'growth'>('deficit');

  const months2026 = ['1/2026', '2/2026', '3/2026', '4/2026', '5/2026', '6/2026', '7/2026', '8/2026'];

  // Top 6 folders by traffic for the all-folders trend chart
  const top6FolderIds = ['1001002', '1002835', '1001005', '1001007', '1002565', '1003159'];
  const top6ChartData = useMemo(() => {
    return months2026.map((m, idx) => {
      const mo = idx + 1;
      const pt: any = {
        month: `T${mo}`,
      };
      top6FolderIds.forEach((fId) => {
        const rec = currentData.find((r) => r.month === m && r.folder_id === fId);
        const name = rec?.folder || fId;
        pt[name] = Number(((rec?.pageviews || 0) / 1_000_000).toFixed(2));
      });
      return pt;
    });
  }, [currentData]);

  // Single folder trend chart data when filtered
  const singleFolderChartData = useMemo(() => {
    if (!selectedFolder) return [];
    return months2026.map((m, idx) => {
      const mo = idx + 1;
      const rec = currentData.find(
        (r) =>
          r.month === m &&
          (r.folder_id === selectedFolder.folderId ||
            (r.folder && r.folder.toLowerCase() === selectedFolder.folderName.toLowerCase()))
      );
      const pv = Number(((rec?.pageviews || 0) / 1_000_000).toFixed(2));
      const med = Number((selectedFolder.median2026PV / 1_000_000).toFixed(2));
      return {
        month: `T${mo}`,
        'Pageviews Thực Tế': pv,
        'Mốc Trung Vị 2026': med,
      };
    });
  }, [currentData, selectedFolder]);

  const top6Colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  // Deepest drop & best gain
  const dropsOnly = rankingList.filter((r) => r.deltaMedianPV < 0);
  const deepestDrop = dropsOnly.length > 0 ? dropsOnly[0] : null;

  const gainsOnly = rankingList.filter((r) => r.deltaMedianPV >= 0);
  const bestGain = gainsOnly.length > 0 ? [...gainsOnly].sort((a, b) => b.deltaMedianPV - a.deltaMedianPV)[0] : null;

  // VnExpress departments vs Separated special publications (Ngôi Sao & English)
  const vneOnly = rankingList.filter((r) => !isSpecialPublication(r.folderId, r.folderName));
  const ngoiSaoOnly = rankingList.filter((r) => r.folderId === '1002835' || r.folderName.toLowerCase().includes('ngôi sao'));
  const englishOnly = rankingList.filter((r) => r.folderId === '1003888' || r.folderName.toLowerCase().includes('english'));

  const maxAbsDeficit = Math.max(...rankingList.map((r) => Math.abs(r.deltaMedianPV)), 1);

  // Filtered and sorted rows
  const displayedRows = useMemo(() => {
    let list = rankingList.filter((item) => {
      const isSpecial = isSpecialPublication(item.folderId, item.folderName);
      if (filterType === 'vne' && isSpecial) return false;
      if (filterType === 'ngoisao' && item.folderId !== '1002835' && !item.folderName.toLowerCase().includes('ngôi sao')) return false;
      if (filterType === 'english' && item.folderId !== '1003888' && !item.folderName.toLowerCase().includes('english')) return false;
      if (filterType === 'drop' && item.deltaMedianPV >= 0) return false;
      if (filterType === 'gain' && item.deltaMedianPV < 0) return false;
      if (
        searchTerm &&
        !item.folderName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !item.folderId.includes(searchTerm)
      ) {
        return false;
      }
      return true;
    });

    if (sortBy === 'deficit') {
      list.sort((a, b) => a.deltaMedianPV - b.deltaMedianPV);
    } else if (sortBy === 'volume') {
      list.sort((a, b) => b.curPV - a.curPV);
    } else if (sortBy === 'articles') {
      list.sort((a, b) => b.curArticles - a.curArticles);
    } else if (sortBy === 'growth') {
      list.sort((a, b) => b.pctMedianPV - a.pctMedianPV);
    }
    return list;
  }, [rankingList, filterType, searchTerm, sortBy]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      {/* 1. Header Bar with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <h2 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
              {isSingleScope && selectedFolder
                ? `Động thái & Ma Trận: Ban ${selectedFolder.folderName}`
                : 'Động thái & Ma Trận Chuyên Mục & Trang Home'}
            </h2>
            {isSingleScope && selectedFolder ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Đang lọc: {selectedFolder.folderName} ({selectedFolder.folderId})
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                23 Ban Nội Dung + Trang Home
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSingleScope && selectedFolder
              ? `Hiển thị chi tiết theo phạm vi ban được chọn (${selectedMonth}). Thứ hạng thâm hụt PV: #${overallRank} / ${allRankingList.length} toàn tòa soạn.`
              : `Xếp hạng chi tiết 23 ban nội dung và Trang Home trong kỳ Tháng ${selectedMonth} so với mốc Trung Vị 2026.`}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Clear Scope Filter button if single scope */}
          {isSingleScope && onScopeChange && (
            <button
              onClick={() => {
                onScopeChange('ALL_FOLDERS_AGG');
                setShowAllRowsWhenFiltered(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xem tất cả 24 chuyên mục</span>
            </button>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm chuyên mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

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
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/70 flex-wrap gap-0.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({rankingList.length})
            </button>
            <button
              onClick={() => setFilterType('vne')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'vne'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              VnExpress ({vneOnly.length})
            </button>
            <button
              onClick={() => setFilterType('ngoisao')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'ngoisao'
                  ? 'bg-white text-amber-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-amber-800'
              }`}
            >
              Ngôi Sao ({ngoiSaoOnly.length})
            </button>
            <button
              onClick={() => setFilterType('english')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'english'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-indigo-700'
              }`}
            >
              English ({englishOnly.length})
            </button>
            <button
              onClick={() => setFilterType('drop')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'drop'
                  ? 'bg-white text-rose-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Sụt giảm ({dropsOnly.length})
            </button>
            <button
              onClick={() => setFilterType('gain')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'gain'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Tăng trưởng ({gainsOnly.length})
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
              <option value="volume">Lượng Pageview cao nhất</option>
              <option value="articles">Sản lượng bài viết cao nhất</option>
              <option value="growth">Tăng trưởng tốt nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scope Banner if Filtered */}
      {isSingleScope && selectedFolder && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-blue-950 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
            <span>
              Bộ lọc phạm vi đang kích hoạt cho: <strong>Ban {selectedFolder.folderName}</strong>. Box đang hiển thị số liệu phân tích chuyên biệt của ban này.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <button
              onClick={() => setShowAllRowsWhenFiltered(!showAllRowsWhenFiltered)}
              className="px-2.5 py-1 rounded-md bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition font-medium cursor-pointer"
            >
              {showAllRowsWhenFiltered ? 'Chỉ xem ban này' : 'Xem ma trận đầy đủ 24 ban'}
            </button>
            {onScopeChange && (
              <button
                onClick={() => onScopeChange('ALL_FOLDERS_AGG')}
                className="px-2.5 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition font-medium cursor-pointer shadow-2xs"
              >
                Bỏ lọc ban
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Top 3 Highlight Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {isSingleScope && selectedFolder ? (
          <>
            {/* Card 1 for Single Scope: Deficit vs Median */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Sụt Giảm vs. Trung Vị 2026 ({selectedFolder.folderName})
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    selectedFolder.deltaMedianPV < 0
                      ? 'bg-rose-50 text-rose-600 border border-rose-200/70'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                  }`}
                >
                  {selectedFolder.deltaMedianPV < 0 ? 'Thâm hụt' : 'Tăng trưởng'}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <div
                  className={`text-base font-bold font-mono flex items-center gap-2 ${
                    selectedFolder.deltaMedianPV < 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  <span>{formatDelta(selectedFolder.deltaMedianPV)} PV</span>
                  <span className="text-xs font-semibold">
                    ({formatPercent(selectedFolder.pctMedianPV)})
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Tháng {selectedMonth}: <strong className="text-slate-700">{formatNumber(selectedFolder.curPV)}</strong>
                  {'  '}| Trung vị: <strong className="text-slate-700">{formatNumber(selectedFolder.median2026PV)}</strong>
                </div>
              </div>
            </div>

            {/* Card 2 for Single Scope: P-Detail vs Median */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Lượt Xem Bài Chi Tiết (P-Detail)</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    selectedFolder.deltaMedianDetail < 0
                      ? 'bg-rose-50 text-rose-600 border border-rose-200/70'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                  }`}
                >
                  {selectedFolder.deltaMedianDetail < 0 ? 'Thâm hụt' : 'Tăng trưởng'}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <div
                  className={`text-base font-bold font-mono flex items-center gap-2 ${
                    selectedFolder.deltaMedianDetail < 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  <span>{formatDelta(selectedFolder.deltaMedianDetail)} PV</span>
                  <span className="text-xs font-semibold">({formatPercent(selectedFolder.pctMedianDetail)})</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Tháng {selectedMonth}: <strong className="text-slate-700">{formatNumber(selectedFolder.curDetail)}</strong>
                  {'  '}| Trung vị: <strong className="text-slate-700">{formatNumber(selectedFolder.median2026Detail)}</strong>
                </div>
              </div>
            </div>

            {/* Card 3 for Single Scope: Overall Rank & Share */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Vị Thế Trong Tòa Soạn & Quy Mô</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Quy mô
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="text-base font-bold text-slate-900 font-mono flex items-center gap-2">
                  <span>Hạng #{overallRank}</span>
                  <span className="text-xs text-slate-500 font-normal">/ {allRankingList.length} ban</span>
                  <span className="text-xs font-semibold text-blue-700 ml-auto">
                    Chiếm {folderShareMonth.toFixed(1)}% PV
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Sản lượng Tháng {selectedMonth}: <strong className="text-slate-700">{formatNumber(selectedFolder.curArticles)}</strong> bài viết
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Card 1: Deepest Drop Folder */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Chuyên Mục Sụt Giảm Sâu Nhất</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200/70">
                  Điểm nghẽn
                </span>
              </div>
              {deepestDrop ? (
                <div className="mt-2 space-y-1">
                  <div className="text-base font-bold text-rose-600 font-mono flex items-center gap-2">
                    <span>{deepestDrop.folderName}</span>
                    <span>{formatDelta(deepestDrop.deltaMedianPV)} PV</span>
                    <span className="text-xs font-semibold">({formatPercent(deepestDrop.pctMedianPV)})</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Tháng {selectedMonth}: <strong className="text-slate-700">{formatNumber(deepestDrop.curPV)}</strong>
                    {'  '}| Trung vị: <strong className="text-slate-700">{formatNumber(deepestDrop.median2026PV)}</strong>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Card 2: Drop vs Gain Ratio */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Tỷ Lệ Chuyên Mục Giảm vs. Tăng</div>
              <div className="mt-2 space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-sans">Mục sụt giảm so với Trung vị:</span>
                  <span className="font-bold text-rose-600">
                    {dropsOnly.length} / {rankingList.length} chuyên mục ({rankingList.length > 0 ? Math.round((dropsOnly.length / rankingList.length) * 100) : 0}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-sans">Mục tăng trưởng/giữ vững:</span>
                  <span className="font-bold text-emerald-600">
                    {gainsOnly.length} / {rankingList.length} chuyên mục ({rankingList.length > 0 ? Math.round((gainsOnly.length / rankingList.length) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Best Growing Folder */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Chuyên Mục Tăng Trưởng Tốt Nhất</div>
              {bestGain ? (
                <div className="mt-2 space-y-1">
                  <div className="text-base font-bold text-emerald-600 font-mono flex items-center gap-2">
                    <span>{bestGain.folderName}</span>
                    <span>{formatDelta(bestGain.deltaMedianPV)} PV</span>
                    <span className="text-xs font-semibold">({formatPercent(bestGain.pctMedianPV)})</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Tháng {selectedMonth}: <strong className="text-slate-700">{formatNumber(bestGain.curPV)}</strong>
                    {'  '}| Trung vị: <strong className="text-slate-700">{formatNumber(bestGain.median2026PV)}</strong>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 mt-2 italic">Không có chuyên mục tăng trưởng</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 3. Collapsible Trend Line Chart */}
      {showChart && (
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 transition-all">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-800">
              {isSingleScope && selectedFolder
                ? `Đường xu hướng 2026: Ban ${selectedFolder.folderName} (Triệu PV qua 8 tháng so với Trung vị)`
                : 'Đường xu hướng 2026: Top 6 Chuyên mục lớn nhất (Triệu PV qua 8 tháng)'}
            </span>
            <span className="text-slate-500 text-[11px]">
              {isSingleScope && selectedFolder
                ? `Mốc trung vị 2026: ${formatNumber(selectedFolder.median2026PV)} PV`
                : 'Thế giới, Ngôi sao, Thời sự, Pháp luật, Thể thao, Kinh doanh'}
            </span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              {isSingleScope && selectedFolder ? (
                <LineChart data={singleFolderChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                  <Line
                    type="monotone"
                    dataKey="Pageviews Thực Tế"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#2563eb' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Mốc Trung Vị 2026"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#f59e0b' }}
                  />
                </LineChart>
              ) : (
                <LineChart data={top6ChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                  {Object.keys(top6ChartData[0] || {})
                    .filter((k) => k !== 'month')
                    .map((name, i) => (
                      <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={top6Colors[i % top6Colors.length]}
                        strokeWidth={2}
                        dot={{ r: 3, fill: top6Colors[i % top6Colors.length] }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Main Clean Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/90">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3 px-3">#</th>
              <th className="py-3 px-4 font-sans">Chuyên Mục</th>
              <th className="py-3 px-4 text-right font-sans">Tháng {selectedMonth} (PV)</th>
              <th className="py-3 px-3 text-right font-sans">Mốc Trung Vị</th>
              <th className="py-3 px-4 text-right font-sans min-w-[190px]">
                <div>Lệch vs. Trung Vị</div>
                <div className="text-[9px] text-slate-400 font-normal">Hụt PV & % Sụt giảm</div>
              </th>
              <th className="py-3 px-3 text-center font-sans">
                <div>Đánh Giá</div>
                <div className="text-[9px] text-slate-400 font-normal">Mốc 10%</div>
              </th>
              <th className="py-3 px-3 text-center font-sans">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-xs">
            {displayedRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400 font-sans">
                  Không tìm thấy chuyên mục phù hợp với điều kiện tìm kiếm/lọc.
                </td>
              </tr>
            ) : (
              displayedRows.map((item, idx) => {
                const isDrop = item.deltaMedianPV < 0;
                const barWidthPct = Math.min(100, Math.max(8, (Math.abs(item.deltaMedianPV) / maxAbsDeficit) * 100));
                const isCurrentActive = item.folderId === currentScope;

                return (
                  <tr
                    key={item.folderId}
                    className={`transition ${
                      isCurrentActive
                        ? 'bg-blue-50/60 font-semibold'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-3 px-3 text-slate-400 font-sans">
                      {isCurrentActive ? (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                      ) : (
                        idx + 1
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-900">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold">{item.folderName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({item.folderId})</span>
                        {isSpecialPublication(item.folderId, item.folderName) ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            Chuyên trang riêng
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                            VnExpress
                          </span>
                        )}
                        {isCurrentActive && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                            Đang chọn
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatNumber(item.curPV)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 font-semibold">
                      {formatNumber(item.median2026PV)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className={`font-bold ${!isDrop ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatDelta(item.deltaMedianPV)} ({formatPercent(item.pctMedianPV)})
                      </div>
                      <div className="w-full max-w-[150px] h-1.5 bg-slate-100 rounded-full overflow-hidden relative mt-1.5 ml-auto flex justify-end">
                        <div
                          className={`h-full rounded-full transition-all ${
                            !isDrop ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${barWidthPct}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      {item.pctMedianPV < -10 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
                          Giảm mạnh
                        </span>
                      ) : item.pctMedianPV < 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/70">
                          Giảm nhẹ
                        </span>
                      ) : item.pctMedianPV > 10 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                          Tăng mạnh
                        </span>
                      ) : item.pctMedianPV > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200/70">
                          Tăng nhẹ
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200/70">
                          Ổn định
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      {isCurrentActive ? (
                        <button
                          onClick={() => onScopeChange?.('ALL_FOLDERS_AGG')}
                          className="px-2 py-1 text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition cursor-pointer"
                          title="Bỏ lọc riêng ban này"
                        >
                          Bỏ lọc
                        </button>
                      ) : (
                        <button
                          onClick={() => onScopeChange?.(item.folderId)}
                          className="px-2 py-1 text-[10px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition cursor-pointer flex items-center gap-1 mx-auto"
                          title="Lọc riêng ban này trên toàn hệ thống"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Lọc</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
