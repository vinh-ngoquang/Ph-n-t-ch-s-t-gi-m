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
import {
  computeFolderRanking,
  computeFolderRankingYoY,
  FolderComparisonItem,
  isSpecialPublication,
} from '../../utils/timeSeriesAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../../utils/formatters';
import { LineChart as LineChartIcon, Search, Filter, X, Eye, RotateCcw, Users, Heart } from 'lucide-react';
import { RAW_DATASET } from '../../data/dataset';
import { NewsRecord } from '../../types';
import { YoYMonthlySparkline, YoYMonthlyPoint, LongTermPoint } from '../common/YoYMonthlySparkline';

interface FolderBreakdownViewProps {
  dataset?: NewsRecord[];
  currentScope?: string;
  onScopeChange?: (scope: string) => void;
  selectedMonth?: string;
  isYoYMode?: boolean;
  selectedSite?: string;
  onSiteChange?: (site: string) => void;
  selectedCate?: string;
  onCateChange?: (cate: string) => void;
}

export const FolderBreakdownView: React.FC<FolderBreakdownViewProps> = ({
  dataset,
  currentScope = 'ALL_FOLDERS_AGG',
  onScopeChange,
  selectedMonth = '8/2026',
  isYoYMode,
  selectedSite,
  onSiteChange,
  selectedCate,
  onCateChange,
}) => {
  const currentData = dataset || RAW_DATASET;

  // 1. Calculate the full ranking across all folders
  const allRankingList = useMemo(
    () => (isYoYMode ? computeFolderRankingYoY(currentData) : computeFolderRanking(currentData, selectedMonth)),
    [currentData, selectedMonth, isYoYMode]
  );

  // 2. Active site filter: either passed via selectedSite prop or from currentScope if scope is a known site
  const activeSite = useMemo(() => {
    if (selectedSite && selectedSite !== 'ALL') return selectedSite;
    if (['VnExpress', 'Ngoi sao', 'English', 'Tia sáng'].includes(currentScope || '')) {
      return currentScope!;
    }
    return 'ALL';
  }, [selectedSite, currentScope]);

  // 3. Active folder filter: either passed via selectedCate prop or from currentScope (if numeric folderId)
  const activeFolderId = useMemo(() => {
    if (selectedCate && selectedCate !== 'ALL') return selectedCate;
    if (
      currentScope &&
      !['ALL', 'ALL_FOLDERS_AGG', 'ALL_VNE_AGG', 'VnExpress', 'Ngoi sao', 'English', 'Tia sáng'].includes(currentScope)
    ) {
      return currentScope;
    }
    return null;
  }, [selectedCate, currentScope]);

  const isSingleFolderActive = Boolean(activeFolderId);
  const selectedFolder = useMemo(() => {
    if (!activeFolderId) return null;
    return allRankingList.find((r) => r.folderId === activeFolderId || r.folderName === activeFolderId) || null;
  }, [allRankingList, activeFolderId]);

  // Rank in entire publication
  const overallRank = useMemo(() => {
    if (!selectedFolder) return 0;
    return allRankingList.findIndex((r) => r.folderId === selectedFolder.folderId) + 1;
  }, [allRankingList, selectedFolder]);

  const totalMonthAll = useMemo(() => {
    return allRankingList.reduce((sum, item) => sum + item.curPV, 0);
  }, [allRankingList]);

  const folderShareMonth = useMemo(() => {
    if (!selectedFolder || totalMonthAll === 0) return 0;
    return (selectedFolder.curPV / totalMonthAll) * 100;
  }, [selectedFolder, totalMonthAll]);

  // Option for user to isolate single folder or view all
  const [showOnlySelectedFolder, setShowOnlySelectedFolder] = useState<boolean>(false);

  // Filtered ranking list by active site
  const rankingList = useMemo(() => {
    let list = allRankingList;
    if (activeSite !== 'ALL') {
      list = list.filter((r) => (r.siteName || '').trim().toLowerCase() === activeSite.trim().toLowerCase());
    }
    if (showOnlySelectedFolder && selectedFolder) {
      return [selectedFolder];
    }
    return list;
  }, [allRankingList, activeSite, showOnlySelectedFolder, selectedFolder]);

  // Pills and toolbar controls
  const [viewPerspective, setViewPerspective] = useState<'pv' | 'readers' | 'sources' | 'platforms' | 'layers'>('pv');
  const [filterType, setFilterType] = useState<'all' | 'vne' | 'ngoisao' | 'english' | 'tiasang' | 'drop' | 'gain'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [sortBy, setSortBy] = useState<'deficit' | 'volume' | 'articles' | 'growth'>('deficit');

  // Breakdown counts for filter pills (based on all ranking list or current site)
  const vneOnly = useMemo(
    () => allRankingList.filter((r) => (r.siteName || '').toLowerCase() === 'vnexpress' || (!r.siteName && !isSpecialPublication(r.folderId, r.folderName))),
    [allRankingList]
  );
  const ngoiSaoOnly = useMemo(
    () => allRankingList.filter((r) => (r.siteName || '').toLowerCase() === 'ngoi sao' || r.folderId === '1002835' || r.folderName.toLowerCase().includes('ngôi sao')),
    [allRankingList]
  );
  const englishOnly = useMemo(
    () => allRankingList.filter((r) => (r.siteName || '').toLowerCase() === 'english' || r.folderId === '1003888' || r.folderName.toLowerCase().includes('english')),
    [allRankingList]
  );
  const tiaSangOnly = useMemo(
    () => allRankingList.filter((r) => (r.siteName || '').toLowerCase() === 'tia sáng' || (r.siteName || '').toLowerCase() === 'tia sang' || r.folderId === '1006614' || r.folderName.toLowerCase().includes('tia sáng')),
    [allRankingList]
  );

  const dropsOnly = useMemo(() => rankingList.filter((r) => r.deltaMedianPV < 0), [rankingList]);
  const gainsOnly = useMemo(() => rankingList.filter((r) => r.deltaMedianPV >= 0), [rankingList]);
  const deepestDrop = dropsOnly.length > 0 ? dropsOnly[0] : null;
  const bestGain = gainsOnly.length > 0 ? [...gainsOnly].sort((a, b) => b.deltaMedianPV - a.deltaMedianPV)[0] : null;

  const maxAbsDeficit = Math.max(...rankingList.map((r) => Math.abs(r.deltaMedianPV)), 1);

  // Sorted list of months in dataset
  const allMonthsList = useMemo(() => {
    const set = new Set<string>();
    currentData.forEach((r) => {
      if (r.month) set.add(r.month.trim());
    });
    return Array.from(set).sort((a, b) => {
      const [m1, y1] = a.split('/').map(Number);
      const [m2, y2] = b.split('/').map(Number);
      if (y1 !== y2) return y1 - y2;
      return m1 - m2;
    });
  }, [currentData]);

  const targetMonths = useMemo(() => {
    if (isYoYMode) {
      return allMonthsList;
    }
    return allMonthsList.filter((m) => m.endsWith('/2026'));
  }, [allMonthsList, isYoYMode]);

  // Dynamic top 6 folders by volume for chart
  const top6FolderIds = useMemo(() => {
    return [...rankingList].sort((a, b) => b.curPV - a.curPV).slice(0, 6).map((item) => item.folderId);
  }, [rankingList]);

  const top6ChartData = useMemo(() => {
    return targetMonths.map((m) => {
      const [mo, yr] = m.split('/').map(Number);
      const label = isYoYMode ? `T${mo}/${String(yr).slice(-2)}` : `T${mo}`;
      const pt: any = {
        month: label,
        rawMonth: m,
      };
      top6FolderIds.forEach((fId) => {
        const rec = currentData.find((r) => r.month === m && r.folder_id === fId);
        const name = rec?.folder_id === '1000000' ? 'Trang Home' : (rec?.folder || fId);
        pt[name] = Number(((rec?.pageviews || 0) / 1_000_000).toFixed(2));
      });
      return pt;
    });
  }, [currentData, targetMonths, isYoYMode, top6FolderIds]);

  // Single folder trend chart data when filtered
  const singleFolderChartData = useMemo(() => {
    if (!selectedFolder) return [];
    return targetMonths.map((m) => {
      const [mo, yr] = m.split('/').map(Number);
      const label = isYoYMode ? `T${mo}/${String(yr).slice(-2)}` : `T${mo}`;
      const rec = currentData.find((r) => {
        if (r.month !== m) return false;
        if (
          selectedFolder.siteName &&
          selectedFolder.siteName !== 'ALL' &&
          r.site_name &&
          r.site_name.trim().toLowerCase() !== selectedFolder.siteName.trim().toLowerCase()
        ) {
          return false;
        }
        if (selectedFolder.folderId && r.folder_id === selectedFolder.folderId) return true;
        return Boolean(r.folder && r.folder.trim().toLowerCase() === selectedFolder.folderName.trim().toLowerCase());
      });
      const pv = Number(((rec?.pageviews || 0) / 1_000_000).toFixed(2));
      const med = Number((selectedFolder.median2026PV / 1_000_000).toFixed(2));
      return {
        month: label,
        rawMonth: m,
        'Pageviews Thực Tế': pv,
        ...(isYoYMode ? {} : { 'Mốc Trung Vị 2026': med }),
      };
    });
  }, [currentData, selectedFolder, targetMonths, isYoYMode]);

  const top6Colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  const availableMonthNums = useMemo(() => {
    const set26 = new Set<number>();
    currentData.forEach((r) => {
      if (r.month && r.month.endsWith('/2026')) {
        const m = parseInt(r.month.split('/')[0], 10);
        if (!isNaN(m)) set26.add(m);
      }
    });
    return Array.from(set26).sort((a, b) => a - b);
  }, [currentData]);

  const getFolderYoYSeries = (folderId: string, folderName: string, siteName?: string): YoYMonthlyPoint[] => {
    return availableMonthNums.map((mNum) => {
      const match26 = `${mNum}/2026`;
      const match25 = `${mNum}/2025`;

      const rec26 = currentData.find((r) => {
        if (r.month !== match26) return false;
        if (siteName && siteName !== 'ALL' && r.site_name && r.site_name.trim().toLowerCase() !== siteName.trim().toLowerCase()) {
          return false;
        }
        if (folderId && r.folder_id === folderId) return true;
        return Boolean(r.folder && r.folder.trim().toLowerCase() === folderName.trim().toLowerCase());
      });

      const rec25 = currentData.find((r) => {
        if (r.month !== match25) return false;
        if (siteName && siteName !== 'ALL' && r.site_name && r.site_name.trim().toLowerCase() !== siteName.trim().toLowerCase()) {
          return false;
        }
        if (folderId && r.folder_id === folderId) return true;
        return Boolean(r.folder && r.folder.trim().toLowerCase() === folderName.trim().toLowerCase());
      });

      return {
        monthNum: mNum,
        monthLabel: `T${mNum}`,
        val2026: Number(rec26?.pageviews) || 0,
        val2025: Number(rec25?.pageviews) || 0,
      };
    });
  };

  const [sparkMode, setSparkMode] = useState<'yoy' | 'longterm'>('yoy');

  const getFolderLongTermSeries = (folderId: string, folderName: string, siteName?: string): LongTermPoint[] => {
    return allMonthsList.map((m) => {
      const [mo, yr] = m.split('/').map(Number);
      const rec = currentData.find((r) => {
        if (r.month !== m) return false;
        if (siteName && siteName !== 'ALL' && r.site_name && r.site_name.trim().toLowerCase() !== siteName.trim().toLowerCase()) {
          return false;
        }
        if (folderId && r.folder_id === folderId) return true;
        return Boolean(r.folder && r.folder.trim().toLowerCase() === folderName.trim().toLowerCase());
      });
      return {
        month: m,
        monthLabel: `T${mo}/${String(yr).slice(-2)}`,
        year: yr,
        val: Number(rec?.pageviews) || 0,
      };
    });
  };

  // Final filtered and sorted rows for the table
  const displayedRows = useMemo(() => {
    let list = rankingList.filter((item) => {
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
  }, [rankingList, searchTerm, sortBy]);

  const handleSelectFolder = (folderId: string) => {
    if (onCateChange) onCateChange(folderId);
    if (onScopeChange) onScopeChange(folderId);
  };

  const handleClearFolder = () => {
    if (onCateChange) onCateChange('ALL');
    if (onScopeChange) {
      if (activeSite !== 'ALL') {
        onScopeChange(activeSite);
      } else {
        onScopeChange('ALL_FOLDERS_AGG');
      }
    }
    setShowOnlySelectedFolder(false);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      {/* 1. Header Bar with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <h2 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
              {isSingleFolderActive && selectedFolder
                ? `Động thái & Ma Trận: Folder ${selectedFolder.folderName}`
                : 'Động thái & Ma Trận Folder & Trang Home'}
            </h2>
            {isSingleFolderActive && selectedFolder && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Đang chọn: {selectedFolder.folderName} ({selectedFolder.folderId})
              </span>
            )}
          </div>
        </div>

        {/* Top Right: Toggle Trend Chart */}
        <button
          onClick={() => setShowChart(!showChart)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer shrink-0 self-start sm:self-center ${
            showChart
              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
          }`}
        >
          <LineChartIcon className="w-3.5 h-3.5 text-blue-600" />
          <span>{showChart ? 'Ẩn Biểu đồ Xu hướng' : 'Hiện Biểu đồ Xu hướng'}</span>
        </button>
      </div>

      {/* 2. Controls & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        {/* Left Side: Perspective + Search + Clear */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Perspective Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 flex-wrap gap-0.5">
            <button
              onClick={() => setViewPerspective('pv')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                viewPerspective === 'pv'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chỉ số PV & Độ lệch
            </button>
            <button
              onClick={() => setViewPerspective('readers')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                viewPerspective === 'readers'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Loại độc giả
            </button>
            <button
              onClick={() => setViewPerspective('sources')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                viewPerspective === 'sources'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nguồn truy cập
            </button>
            <button
              onClick={() => setViewPerspective('platforms')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                viewPerspective === 'platforms'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nền tảng thiết bị
            </button>
            <button
              onClick={() => setViewPerspective('layers')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                viewPerspective === 'layers'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lớp trang
            </button>
          </div>

          {/* Clear Scope Filter button if single folder active */}
          {isSingleFolderActive && (
            <button
              onClick={handleClearFolder}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xem toàn bộ danh sách</span>
            </button>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm folder..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Right Side: Sort Dropdown */}
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

      {/* Scope Banner if Filtered */}
      {isSingleFolderActive && selectedFolder && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-blue-950 font-medium">
            <span>
              Đang chọn xem phân tích chuyên biệt cho: <strong>Ban {selectedFolder.folderName}</strong> ({selectedFolder.folderId}).
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-xs">
            <button
              onClick={() => setShowOnlySelectedFolder(!showOnlySelectedFolder)}
              className="px-2.5 py-1 rounded-md bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition font-medium cursor-pointer"
            >
              {showOnlySelectedFolder ? 'Hiện toàn bộ danh mục' : 'Chỉ xem ban này'}
            </button>
            <button
              onClick={handleClearFolder}
              className="px-2.5 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition font-medium cursor-pointer shadow-2xs"
            >
              Bỏ lọc ban
            </button>
          </div>
        </div>
      )}

      {/* 2. Top 3 Highlight Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {isSingleFolderActive && selectedFolder ? (
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
                  {isYoYMode ? 'Tổng 2026' : `Tháng ${selectedMonth}`}: <strong className="text-slate-700">{formatNumber(selectedFolder.curPV)}</strong>
                  {'  '}| {isYoYMode ? 'Cùng kỳ 2025' : 'Trung vị'}: <strong className="text-slate-700">{formatNumber(selectedFolder.median2026PV)}</strong>
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
                  {isYoYMode ? 'Tổng 2026' : `Tháng ${selectedMonth}`}: <strong className="text-slate-700">{formatNumber(selectedFolder.curDetail)}</strong>
                  {'  '}| {isYoYMode ? 'Cùng kỳ 2025' : 'Trung vị'}: <strong className="text-slate-700">{formatNumber(selectedFolder.median2026Detail)}</strong>
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
                  Sản lượng {isYoYMode ? 'Tổng 2026' : `Tháng ${selectedMonth}`}: <strong className="text-slate-700">{formatNumber(selectedFolder.curArticles)}</strong> bài viết
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
                  <div className="text-base font-bold text-rose-600 font-mono flex items-center gap-2 flex-wrap">
                    <span>{deepestDrop.folderName}</span>
                    <span>{formatDelta(deepestDrop.deltaMedianPV)} PV</span>
                    <span className="text-xs font-semibold">({formatPercent(deepestDrop.pctMedianPV)})</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {isYoYMode ? 'Tổng 2026' : `Tháng ${selectedMonth}`}: <strong className="text-slate-700">{formatNumber(deepestDrop.curPV)}</strong>
                    {'  '}| {isYoYMode ? 'Cùng kỳ 2025' : 'Trung vị'}: <strong className="text-slate-700">{formatNumber(deepestDrop.median2026PV)}</strong>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Card 2: Drop vs Gain Ratio */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Tỷ Lệ Chuyên Mục Giảm vs. Tăng</div>
              <div className="mt-2 space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-sans">
                    Mục sụt giảm so với {isYoYMode ? 'Cùng kỳ' : 'Trung vị'}:
                  </span>
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
                  <div className="text-base font-bold text-emerald-600 font-mono flex items-center gap-2 flex-wrap">
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
          <div className="flex items-center justify-between mb-3 text-xs flex-wrap gap-2">
            <span className="font-bold text-slate-800">
              {isYoYMode
                ? (isSingleFolderActive && selectedFolder
                  ? `Đường xu hướng từ 2025 đến 2026: Ban ${selectedFolder.folderName} (Triệu PV)`
                  : 'Đường xu hướng từ 2025 đến 2026: Top Chuyên mục lớn nhất (Triệu PV)')
                : (isSingleFolderActive && selectedFolder
                  ? `Đường xu hướng 2026: Ban ${selectedFolder.folderName} (Triệu PV so với Trung vị)`
                  : 'Đường xu hướng 2026: Top Chuyên mục lớn nhất (Triệu PV)')}
            </span>
            <span className="text-slate-500 text-[11px]">
              {isSingleFolderActive && selectedFolder
                ? `Mốc trung vị 2026: ${formatNumber(selectedFolder.median2026PV)} PV`
                : 'Theo khối lượng Pageview thực tế'}
            </span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              {isSingleFolderActive && selectedFolder ? (
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
                    .filter((k) => k !== 'month' && k !== 'rawMonth')
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
      <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200 select-none">
            {viewPerspective === 'readers' ? (
              <tr>
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4 font-sans min-w-[200px]">Folder</th>
                <th className="py-3 px-3 text-right font-sans">Tổng PV</th>
                <th className="py-3 px-3 text-right font-sans min-w-[110px]">P- New</th>
                <th className="py-3 px-3 text-right font-sans min-w-[110px]">P- Return</th>
                <th className="py-3 px-3 text-right font-sans min-w-[110px]">P- Lover</th>
                <th className="py-3 px-3 text-right font-sans min-w-[90px]">% Lover</th>
                {isYoYMode && (
                  <th className="py-2.5 px-3 text-center font-sans min-w-[175px]">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-semibold text-slate-700">Xu Hướng</span>
                      <div className="inline-flex bg-slate-200/90 p-0.5 rounded text-[10px] font-medium">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSparkMode('yoy'); }}
                          className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                            sparkMode === 'yoy'
                              ? 'bg-white text-blue-700 shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="So sánh cùng kỳ 2026 vs 2025 theo từng tháng"
                        >
                          YoY
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSparkMode('longterm'); }}
                          className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                            sparkMode === 'longterm'
                              ? 'bg-white text-blue-700 shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Đường xu hướng dài hạn liên tục từ 2025 đến 2026"
                        >
                          2025→2026
                        </button>
                      </div>
                    </div>
                    <div className="text-[9px] font-normal text-slate-400 flex items-center justify-center gap-1 mt-0.5 whitespace-nowrap">
                      {sparkMode === 'yoy' ? (
                        <>
                          <span className="text-emerald-600 font-bold">● '26 &ge; '25</span>
                          <span>|</span>
                          <span className="text-rose-600 font-bold">● '26 &lt; '25</span>
                          <span>|</span>
                          <span className="text-slate-400">--- '25</span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-500 font-medium">Xám: '25</span>
                          <span>→</span>
                          <span className="text-blue-600 font-bold">Xanh: '26</span>
                          <span>|</span>
                          <span className="text-amber-500 font-semibold">--- Trend</span>
                        </>
                      )}
                    </div>
                  </th>
                )}
                <th className="py-3 px-3 text-center font-sans">Thao Tác</th>
              </tr>
            ) : viewPerspective === 'sources' ? (
              <tr>
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4 font-sans min-w-[200px]">Folder</th>
                <th className="py-3 px-3 text-right font-sans">Tổng PV</th>
                <th className="py-3 px-3 text-right font-sans min-w-[100px]">Direct</th>
                <th className="py-3 px-3 text-right font-sans min-w-[100px]">Google</th>
                <th className="py-3 px-3 text-right font-sans min-w-[100px]">Social</th>
                <th className="py-3 px-3 text-right font-sans min-w-[100px]">In-Home</th>
                <th className="py-3 px-3 text-right font-sans min-w-[100px]">In-Folder</th>
                <th className="py-3 px-3 text-right font-sans min-w-[100px]">In-Detail</th>
                <th className="py-3 px-3 text-right font-sans min-w-[100px]">In-Other</th>
                {isYoYMode && (
                  <th className="py-2.5 px-3 text-center font-sans min-w-[175px]">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-semibold text-slate-700">Xu Hướng</span>
                      <div className="inline-flex bg-slate-200/90 p-0.5 rounded text-[10px] font-medium">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSparkMode('yoy'); }}
                          className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                            sparkMode === 'yoy'
                              ? 'bg-white text-blue-700 shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="So sánh cùng kỳ 2026 vs 2025 theo từng tháng"
                        >
                          YoY
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSparkMode('longterm'); }}
                          className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                            sparkMode === 'longterm'
                              ? 'bg-white text-blue-700 shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Đường xu hướng dài hạn liên tục từ 2025 đến 2026"
                        >
                          2025→2026
                        </button>
                      </div>
                    </div>
                    <div className="text-[9px] font-normal text-slate-400 flex items-center justify-center gap-1 mt-0.5 whitespace-nowrap">
                      {sparkMode === 'yoy' ? (
                        <>
                          <span className="text-emerald-600 font-bold">● '26 &ge; '25</span>
                          <span>|</span>
                          <span className="text-rose-600 font-bold">● '26 &lt; '25</span>
                          <span>|</span>
                          <span className="text-slate-400">--- '25</span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-500 font-medium">Xám: '25</span>
                          <span>→</span>
                          <span className="text-blue-600 font-bold">Xanh: '26</span>
                          <span>|</span>
                          <span className="text-amber-500 font-semibold">--- Trend</span>
                        </>
                      )}
                    </div>
                  </th>
                )}
                <th className="py-3 px-3 text-center font-sans">Thao Tác</th>
              </tr>
            ) : viewPerspective === 'platforms' ? (
              <tr>
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4 font-sans min-w-[200px]">Folder</th>
                <th className="py-3 px-3 text-right font-sans">Tổng PV</th>
                <th className="py-3 px-3 text-right font-sans min-w-[105px]">Mobile</th>
                <th className="py-3 px-3 text-right font-sans min-w-[105px]">PC</th>
                <th className="py-3 px-3 text-right font-sans min-w-[105px]">App</th>
                <th className="py-3 px-3 text-right font-sans min-w-[95px]">Tablet</th>
                <th className="py-3 px-3 text-right font-sans min-w-[110px]">Other Platform</th>
                {isYoYMode && (
                  <th className="py-2.5 px-3 text-center font-sans min-w-[175px]">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-semibold text-slate-700">Xu Hướng</span>
                      <div className="inline-flex bg-slate-200/90 p-0.5 rounded text-[10px] font-medium">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSparkMode('yoy'); }}
                          className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                            sparkMode === 'yoy'
                              ? 'bg-white text-blue-700 shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="So sánh cùng kỳ 2026 vs 2025 theo từng tháng"
                        >
                          YoY
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSparkMode('longterm'); }}
                          className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                            sparkMode === 'longterm'
                              ? 'bg-white text-blue-700 shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Đường xu hướng dài hạn liên tục từ 2025 đến 2026"
                        >
                          2025→2026
                        </button>
                      </div>
                    </div>
                    <div className="text-[9px] font-normal text-slate-400 flex items-center justify-center gap-1 mt-0.5 whitespace-nowrap">
                      {sparkMode === 'yoy' ? (
                        <>
                          <span className="text-emerald-600 font-bold">● '26 &ge; '25</span>
                          <span>|</span>
                          <span className="text-rose-600 font-bold">● '26 &lt; '25</span>
                          <span>|</span>
                          <span className="text-slate-400">--- '25</span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-500 font-medium">Xám: '25</span>
                          <span>→</span>
                          <span className="text-blue-600 font-bold">Xanh: '26</span>
                          <span>|</span>
                          <span className="text-amber-500 font-semibold">--- Trend</span>
                        </>
                      )}
                    </div>
                  </th>
                )}
                <th className="py-3 px-3 text-center font-sans">Thao Tác</th>
              </tr>
            ) : viewPerspective === 'layers' ? (
              <tr>
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4 font-sans min-w-[200px]">Folder</th>
                <th className="py-3 px-3 text-right font-sans">Tổng PV</th>
                <th className="py-3 px-3 text-right font-sans min-w-[110px]">Detail</th>
                <th className="py-3 px-3 text-right font-sans min-w-[110px]">Listing</th>
                <th className="py-3 px-3 text-right font-sans min-w-[95px]">% Detail</th>
                {isYoYMode && (
                  <th className="py-2.5 px-3 text-center font-sans min-w-[175px]">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-semibold text-slate-700">Xu Hướng</span>
                      <div className="inline-flex bg-slate-200/90 p-0.5 rounded text-[10px] font-medium">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSparkMode('yoy'); }}
                          className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                            sparkMode === 'yoy'
                              ? 'bg-white text-blue-700 shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="So sánh cùng kỳ 2026 vs 2025 theo từng tháng"
                        >
                          YoY
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSparkMode('longterm'); }}
                          className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                            sparkMode === 'longterm'
                              ? 'bg-white text-blue-700 shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Đường xu hướng dài hạn liên tục từ 2025 đến 2026"
                        >
                          2025→2026
                        </button>
                      </div>
                    </div>
                    <div className="text-[9px] font-normal text-slate-400 flex items-center justify-center gap-1 mt-0.5 whitespace-nowrap">
                      {sparkMode === 'yoy' ? (
                        <>
                          <span className="text-emerald-600 font-bold">● '26 &ge; '25</span>
                          <span>|</span>
                          <span className="text-rose-600 font-bold">● '26 &lt; '25</span>
                          <span>|</span>
                          <span className="text-slate-400">--- '25</span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-500 font-medium">Xám: '25</span>
                          <span>→</span>
                          <span className="text-blue-600 font-bold">Xanh: '26</span>
                          <span>|</span>
                          <span className="text-amber-500 font-semibold">--- Trend</span>
                        </>
                      )}
                    </div>
                  </th>
                )}
                <th className="py-3 px-3 text-center font-sans">Thao Tác</th>
              </tr>
            ) : (
              <tr>
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4 font-sans">Folder</th>
                <th className="py-3 px-4 text-right font-sans">
                  {isYoYMode ? 'Tổng 2026 (PV)' : `Tháng ${selectedMonth} (PV)`}
                </th>
                <th className="py-3 px-3 text-right font-sans">
                  {isYoYMode ? 'Cùng Kỳ 2025' : 'Mốc Trung Vị'}
                </th>
                <th className="py-3 px-4 text-right font-sans min-w-[190px]">
                  <div>{isYoYMode ? 'Lệch vs. Cùng Kỳ' : 'Lệch vs. Trung Vị'}</div>
                  <div className="text-[9px] text-slate-400 font-normal">Hụt PV & % Sụt giảm</div>
                </th>
                {isYoYMode && (
                  <th className="py-2.5 px-3 text-center font-sans min-w-[175px]">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-semibold text-slate-700">Xu Hướng</span>
                      <div className="inline-flex bg-slate-200/90 p-0.5 rounded text-[10px] font-medium">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSparkMode('yoy'); }}
                          className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                            sparkMode === 'yoy'
                              ? 'bg-white text-blue-700 shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="So sánh cùng kỳ 2026 vs 2025 theo từng tháng"
                        >
                          YoY
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSparkMode('longterm'); }}
                          className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                            sparkMode === 'longterm'
                              ? 'bg-white text-blue-700 shadow-2xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Đường xu hướng dài hạn liên tục từ 2025 đến 2026"
                        >
                          2025→2026
                        </button>
                      </div>
                    </div>
                    <div className="text-[9px] font-normal text-slate-400 flex items-center justify-center gap-1 mt-0.5 whitespace-nowrap">
                      {sparkMode === 'yoy' ? (
                        <>
                          <span className="text-emerald-600 font-bold">● '26 &ge; '25</span>
                          <span>|</span>
                          <span className="text-rose-600 font-bold">● '26 &lt; '25</span>
                          <span>|</span>
                          <span className="text-slate-400">--- '25</span>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-500 font-medium">Xám: '25</span>
                          <span>→</span>
                          <span className="text-blue-600 font-bold">Xanh: '26</span>
                          <span>|</span>
                          <span className="text-amber-500 font-semibold">--- Trend</span>
                        </>
                      )}
                    </div>
                  </th>
                )}
                <th className="py-3 px-3 text-center font-sans">
                  <div>Đánh Giá</div>
                  <div className="text-[9px] text-slate-400 font-normal">Mốc 10%</div>
                </th>
                <th className="py-3 px-3 text-center font-sans">Thao Tác</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-xs">
            {displayedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    viewPerspective === 'sources'
                      ? isYoYMode ? 12 : 11
                      : viewPerspective === 'platforms'
                      ? isYoYMode ? 10 : 9
                      : viewPerspective === 'readers'
                      ? isYoYMode ? 9 : 8
                      : isYoYMode ? 8 : 7
                  }
                  className="text-center py-8 text-slate-400 font-sans"
                >
                  Không tìm thấy folder phù hợp với điều kiện tìm kiếm/lọc.
                </td>
              </tr>
            ) : (
              displayedRows.map((item, idx) => {
                const isDrop = item.deltaMedianPV < 0;
                const barWidthPct = Math.min(100, Math.max(8, (Math.abs(item.deltaMedianPV) / maxAbsDeficit) * 100));
                const isCurrentActive = Boolean(activeFolderId && (item.folderId === activeFolderId || item.folderName === activeFolderId));
                const isHome = item.folderId === '1000000';

                return (
                  <tr
                    key={item.folderId}
                    className={`transition ${
                      isCurrentActive
                        ? 'bg-blue-50/70 font-semibold'
                        : isHome
                        ? 'bg-slate-50/40 hover:bg-slate-50'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-3 px-3 text-slate-400 font-sans text-center">
                      {isCurrentActive ? (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold mx-auto">
                          {idx + 1}
                        </span>
                      ) : (
                        idx + 1
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-900">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-900">
                          {isHome ? 'Trang Home (Trang chủ)' : item.folderName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">({item.folderId})</span>
                        
                        {isHome ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Trang Home
                          </span>
                        ) : null}

                        {item.siteName ? (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${
                              item.siteName === 'VnExpress'
                                ? 'bg-slate-100 text-slate-700 border-slate-200/80'
                                : item.siteName === 'Ngoi sao'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : item.siteName === 'English'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {item.siteName === 'Ngoi sao' ? 'Ngôi sao' : item.siteName}
                          </span>
                        ) : isSpecialPublication(item.folderId, item.folderName) ? (
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

                    {/* Columns branch based on viewPerspective */}
                    {viewPerspective === 'readers' ? (
                      <>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatNumber(item.curPV)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-800">{formatNumber(item.curNew || 0)}</div>
                          {isYoYMode ? (
                            <div
                              className={`text-[10px] font-semibold ${
                                (item.pctNewYoY || 0) > 0
                                  ? 'text-emerald-600'
                                  : (item.pctNewYoY || 0) < 0
                                  ? 'text-rose-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {formatPercent(item.pctNewYoY || 0)}
                            </div>
                          ) : (
                            <div
                              className={`text-[10px] font-semibold ${
                                (item.pctMedianNew || 0) > 0
                                  ? 'text-emerald-600'
                                  : (item.pctMedianNew || 0) < 0
                                  ? 'text-rose-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {formatPercent(item.pctMedianNew || 0)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-800">{formatNumber(item.curReturn || 0)}</div>
                          {isYoYMode ? (
                            <div
                              className={`text-[10px] font-semibold ${
                                (item.pctReturnYoY || 0) > 0
                                  ? 'text-emerald-600'
                                  : (item.pctReturnYoY || 0) < 0
                                  ? 'text-rose-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {formatPercent(item.pctReturnYoY || 0)}
                            </div>
                          ) : (
                            <div
                              className={`text-[10px] font-semibold ${
                                (item.pctMedianReturn || 0) > 0
                                  ? 'text-emerald-600'
                                  : (item.pctMedianReturn || 0) < 0
                                  ? 'text-rose-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {formatPercent(item.pctMedianReturn || 0)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-800">{formatNumber(item.curLover || 0)}</div>
                          {isYoYMode ? (
                            <div
                              className={`text-[10px] font-semibold ${
                                (item.pctLoverYoY || 0) > 0
                                  ? 'text-emerald-600'
                                  : (item.pctLoverYoY || 0) < 0
                                  ? 'text-rose-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {formatPercent(item.pctLoverYoY || 0)}
                            </div>
                          ) : (
                            <div
                              className={`text-[10px] font-semibold ${
                                (item.pctMedianLover || 0) > 0
                                  ? 'text-emerald-600'
                                  : (item.pctMedianLover || 0) < 0
                                  ? 'text-rose-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {formatPercent(item.pctMedianLover || 0)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-800">
                          {formatPercent(item.pctLover || 0, false)}
                        </td>
                        {isYoYMode && (
                          <td className="py-3.5 px-3 text-center align-middle font-sans">
                            <YoYMonthlySparkline
                              data={getFolderYoYSeries(item.folderId, item.folderName, item.siteName)}
                              longTermData={getFolderLongTermSeries(item.folderId, item.folderName, item.siteName)}
                              mode={sparkMode}
                            />
                          </td>
                        )}
                      </>
                    ) : viewPerspective === 'sources' ? (
                      <>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatNumber(item.curPV)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-800">{formatNumber(item.curExDirect || 0)}</div>
                          {isYoYMode ? (
                            <div className={`text-[10px] font-semibold ${(item.pctExDirectYoY || 0) > 0 ? 'text-emerald-600' : (item.pctExDirectYoY || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctExDirectYoY || 0)}
                            </div>
                          ) : (
                            <div className={`text-[10px] font-semibold ${(item.pctMedianExDirect || 0) > 0 ? 'text-emerald-600' : (item.pctMedianExDirect || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctMedianExDirect || 0)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-800">{formatNumber(item.curExGoogle || 0)}</div>
                          {isYoYMode ? (
                            <div className={`text-[10px] font-semibold ${(item.pctExGoogleYoY || 0) > 0 ? 'text-emerald-600' : (item.pctExGoogleYoY || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctExGoogleYoY || 0)}
                            </div>
                          ) : (
                            <div className={`text-[10px] font-semibold ${(item.pctMedianExGoogle || 0) > 0 ? 'text-emerald-600' : (item.pctMedianExGoogle || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctMedianExGoogle || 0)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-800">{formatNumber(item.curExSocial || 0)}</div>
                          {isYoYMode ? (
                            <div className={`text-[10px] font-semibold ${(item.pctExSocialYoY || 0) > 0 ? 'text-emerald-600' : (item.pctExSocialYoY || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctExSocialYoY || 0)}
                            </div>
                          ) : (
                            <div className={`text-[10px] font-semibold ${(item.pctMedianExSocial || 0) > 0 ? 'text-emerald-600' : (item.pctMedianExSocial || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctMedianExSocial || 0)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-800">{formatNumber(item.curInHome || 0)}</div>
                          {isYoYMode ? (
                            <div className={`text-[10px] font-semibold ${(item.pctInHomeYoY || 0) > 0 ? 'text-emerald-600' : (item.pctInHomeYoY || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctInHomeYoY || 0)}
                            </div>
                          ) : (
                            <div className={`text-[10px] font-semibold ${(item.pctMedianInHome || 0) > 0 ? 'text-emerald-600' : (item.pctMedianInHome || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctMedianInHome || 0)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-800">{formatNumber(item.curInFolder || 0)}</div>
                          {isYoYMode ? (
                            <div className={`text-[10px] font-semibold ${(item.pctInFolderYoY || 0) > 0 ? 'text-emerald-600' : (item.pctInFolderYoY || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctInFolderYoY || 0)}
                            </div>
                          ) : (
                            <div className={`text-[10px] font-semibold ${(item.pctMedianInFolder || 0) > 0 ? 'text-emerald-600' : (item.pctMedianInFolder || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctMedianInFolder || 0)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-800">{formatNumber(item.curInDetail || 0)}</div>
                          {isYoYMode ? (
                            <div className={`text-[10px] font-semibold ${(item.pctInDetailYoY || 0) > 0 ? 'text-emerald-600' : (item.pctInDetailYoY || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctInDetailYoY || 0)}
                            </div>
                          ) : (
                            <div className={`text-[10px] font-semibold ${(item.pctMedianInDetail || 0) > 0 ? 'text-emerald-600' : (item.pctMedianInDetail || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctMedianInDetail || 0)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-800">{formatNumber(item.curInOther || 0)}</div>
                          {isYoYMode ? (
                            <div className={`text-[10px] font-semibold ${(item.pctInOtherYoY || 0) > 0 ? 'text-emerald-600' : (item.pctInOtherYoY || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctInOtherYoY || 0)}
                            </div>
                          ) : (
                            <div className={`text-[10px] font-semibold ${(item.pctMedianInOther || 0) > 0 ? 'text-emerald-600' : (item.pctMedianInOther || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctMedianInOther || 0)}
                            </div>
                          )}
                        </td>
                        {isYoYMode && (
                          <td className="py-3.5 px-3 text-center align-middle font-sans">
                            <YoYMonthlySparkline
                              data={getFolderYoYSeries(item.folderId, item.folderName, item.siteName)}
                              longTermData={getFolderLongTermSeries(item.folderId, item.folderName, item.siteName)}
                              mode={sparkMode}
                            />
                          </td>
                        )}
                      </>
                    ) : viewPerspective === 'platforms' ? (
                      <>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatNumber(item.curPV)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-800">{formatNumber(item.curMobile || 0)}</div>
                          {isYoYMode ? (
                            <div className={`text-[10px] font-semibold ${(item.pctMobileYoY || 0) > 0 ? 'text-emerald-600' : (item.pctMobileYoY || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctMobileYoY || 0)}
                            </div>
                          ) : (
                            <div className={`text-[10px] font-semibold ${(item.pctMedianMobile || 0) > 0 ? 'text-emerald-600' : (item.pctMedianMobile || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctMedianMobile || 0)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-800">{formatNumber(item.curPC || 0)}</div>
                          {isYoYMode ? (
                            <div className={`text-[10px] font-semibold ${(item.pctPCYoY || 0) > 0 ? 'text-emerald-600' : (item.pctPCYoY || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctPCYoY || 0)}
                            </div>
                          ) : (
                            <div className={`text-[10px] font-semibold ${(item.pctMedianPC || 0) > 0 ? 'text-emerald-600' : (item.pctMedianPC || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctMedianPC || 0)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-800">{formatNumber(item.curApp || 0)}</div>
                          {isYoYMode ? (
                            <div className={`text-[10px] font-semibold ${(item.pctAppYoY || 0) > 0 ? 'text-emerald-600' : (item.pctAppYoY || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctAppYoY || 0)}
                            </div>
                          ) : (
                            <div className={`text-[10px] font-semibold ${(item.pctMedianApp || 0) > 0 ? 'text-emerald-600' : (item.pctMedianApp || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctMedianApp || 0)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-800">{formatNumber(item.curTablet || 0)}</div>
                          {isYoYMode ? (
                            <div className={`text-[10px] font-semibold ${(item.pctTabletYoY || 0) > 0 ? 'text-emerald-600' : (item.pctTabletYoY || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctTabletYoY || 0)}
                            </div>
                          ) : (
                            <div className={`text-[10px] font-semibold ${(item.pctMedianTablet || 0) > 0 ? 'text-emerald-600' : (item.pctMedianTablet || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctMedianTablet || 0)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-800">{formatNumber(item.curOtherPlatform || 0)}</div>
                          {isYoYMode ? (
                            <div className={`text-[10px] font-semibold ${(item.pctOtherPlatformYoY || 0) > 0 ? 'text-emerald-600' : (item.pctOtherPlatformYoY || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctOtherPlatformYoY || 0)}
                            </div>
                          ) : (
                            <div className={`text-[10px] font-semibold ${(item.pctMedianOtherPlatform || 0) > 0 ? 'text-emerald-600' : (item.pctMedianOtherPlatform || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctMedianOtherPlatform || 0)}
                            </div>
                          )}
                        </td>
                        {isYoYMode && (
                          <td className="py-3.5 px-3 text-center align-middle font-sans">
                            <YoYMonthlySparkline
                              data={getFolderYoYSeries(item.folderId, item.folderName, item.siteName)}
                              longTermData={getFolderLongTermSeries(item.folderId, item.folderName, item.siteName)}
                              mode={sparkMode}
                            />
                          </td>
                        )}
                      </>
                    ) : viewPerspective === 'layers' ? (
                      <>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatNumber(item.curPV)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-800">{formatNumber(item.curDetail || 0)}</div>
                          {isYoYMode ? (
                            <div className={`text-[10px] font-semibold ${(item.pctDetailYoY || 0) > 0 ? 'text-emerald-600' : (item.pctDetailYoY || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctDetailYoY || 0)}
                            </div>
                          ) : (
                            <div className={`text-[10px] font-semibold ${(item.pctMedianDetail || 0) > 0 ? 'text-emerald-600' : (item.pctMedianDetail || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctMedianDetail || 0)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-slate-800">{formatNumber(item.curListing || 0)}</div>
                          {isYoYMode ? (
                            <div className={`text-[10px] font-semibold ${(item.pctListingYoY || 0) > 0 ? 'text-emerald-600' : (item.pctListingYoY || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctListingYoY || 0)}
                            </div>
                          ) : (
                            <div className={`text-[10px] font-semibold ${(item.pctMedianListing || 0) > 0 ? 'text-emerald-600' : (item.pctMedianListing || 0) < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {formatPercent(item.pctMedianListing || 0)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-800">
                          {formatPercent(item.pctDetailShare || 0, false)}
                        </td>
                        {isYoYMode && (
                          <td className="py-3.5 px-3 text-center align-middle font-sans">
                            <YoYMonthlySparkline
                              data={getFolderYoYSeries(item.folderId, item.folderName, item.siteName)}
                              longTermData={getFolderLongTermSeries(item.folderId, item.folderName, item.siteName)}
                              mode={sparkMode}
                            />
                          </td>
                        )}
                      </>
                    ) : (
                      <>
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
                        {isYoYMode && (
                          <td className="py-3.5 px-3 text-center align-middle font-sans">
                            <YoYMonthlySparkline
                              data={getFolderYoYSeries(item.folderId, item.folderName, item.siteName)}
                              longTermData={getFolderLongTermSeries(item.folderId, item.folderName, item.siteName)}
                              mode={sparkMode}
                            />
                          </td>
                        )}
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
                      </>
                    )}
                    <td className="py-3 px-3 text-center font-sans">
                      {isCurrentActive ? (
                        <button
                          onClick={handleClearFolder}
                          className="px-2 py-1 text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition cursor-pointer"
                          title="Bỏ lọc riêng chuyên mục này"
                        >
                          Bỏ lọc
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSelectFolder(item.folderId)}
                          className="px-2 py-1 text-[10px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition cursor-pointer flex items-center gap-1 mx-auto"
                          title="Lọc riêng chuyên mục này"
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
