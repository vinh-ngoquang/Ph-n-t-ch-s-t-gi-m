import React, { useMemo } from 'react';
import {
  Compass,
  MonitorSmartphone,
  FolderTree,
  Globe,
  ArrowRight,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { MonthlyDataPoint, calculateMedian } from '../utils/timeSeriesAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../utils/formatters';
import { NewsRecord } from '../types';

interface ExecutiveDropSummaryProps {
  monthlyData: MonthlyDataPoint[];
  selectedMonth: string;
  dataset: NewsRecord[];
  onTabChange: (tab: string) => void;
  currentScope?: string;
  onScopeChange?: (scope: string) => void;
}

export const ExecutiveDropSummary: React.FC<ExecutiveDropSummaryProps> = ({
  monthlyData,
  selectedMonth,
  dataset,
  onTabChange,
  currentScope = 'ALL_FOLDERS_AGG',
  onScopeChange,
}) => {
  const months2026 = monthlyData.filter((d) => d.year === 2026);
  const targetIdx = months2026.findIndex((d) => d.month === selectedMonth);
  const safeIdx = targetIdx >= 0 ? targetIdx : months2026.length - 1;
  const curPoint = months2026[safeIdx] || months2026[months2026.length - 1];

  // 1. Core Totals
  const curPV = curPoint?.record.pageviews || 0;
  const medPV = calculateMedian(months2026.map((d) => d.record.pageviews || 0));
  const deltaMedPV = curPV - medPV;
  const pctMedPV = medPV > 0 ? (deltaMedPV / medPV) * 100 : 0;

  const curArt = curPoint?.record.articles || 0;
  const medArt = calculateMedian(months2026.map((d) => d.record.articles || 0));

  const curDetail = curPoint?.record.pDetail || 0;
  const medDetail = calculateMedian(months2026.map((d) => d.record.pDetail || 0));

  // 2. Traffic Sources Breakdown (Find Deepest Drop)
  const sourcesDef = [
    { key: 'pInHome' as const, name: 'P- In-Home', desc: 'P- In-Home' },
    { key: 'pInDetail' as const, name: 'P- In-Detail', desc: 'P- In-Detail' },
    { key: 'pExGoogle' as const, name: 'P- Ex-Google', desc: 'P- Ex-Google' },
    { key: 'pExDirect' as const, name: 'P- Ex-Direct', desc: 'P- Ex-Direct' },
    { key: 'pExSocial' as const, name: 'P- Ex-Social', desc: 'P- Ex-Social' },
    { key: 'pInFolder' as const, name: 'P- In-Folder', desc: 'P- In-Folder' },
    { key: 'pInOther' as const, name: 'P- In-Other', desc: 'P- In-Other' },
  ];

  const sourcesRanked = useMemo(() => {
    return sourcesDef.map((s) => {
      const vals = months2026.map((d) => (d.record[s.key] as number) || 0);
      const cur = (curPoint?.record[s.key] as number) || 0;
      const med = calculateMedian(vals);
      const deltaMed = cur - med;
      const pctMed = med > 0 ? (deltaMed / med) * 100 : 0;
      return { ...s, cur, med, deltaMed, pctMed };
    }).sort((a, b) => a.deltaMed - b.deltaMed);
  }, [months2026, curPoint]);

  const sourcesWithDrop = useMemo(() => sourcesRanked.filter((s) => s.deltaMed < 0), [sourcesRanked]);
  const hasSourceDrop = sourcesWithDrop.length > 0;
  const deepestSource = hasSourceDrop ? sourcesWithDrop[0] : null;

  // 3. Platforms Breakdown (Find Deepest Drop)
  const platformsDef = [
    { key: 'pMobile' as const, name: 'Mobile Web (Điện thoại)', desc: 'Trình duyệt điện thoại' },
    { key: 'pPC' as const, name: 'PC Desktop (Máy tính)', desc: 'Desktop văn phòng' },
    { key: 'pApp' as const, name: 'VnExpress App', desc: 'Ứng dụng di động' },
    { key: 'pTablet' as const, name: 'Tablet', desc: 'Máy tính bảng' },
  ];

  const platformsRanked = useMemo(() => {
    return platformsDef.map((p) => {
      const vals = months2026.map((d) => (d.record[p.key] as number) || 0);
      const cur = (curPoint?.record[p.key] as number) || 0;
      const med = calculateMedian(vals);
      const deltaMed = cur - med;
      const pctMed = med > 0 ? (deltaMed / med) * 100 : 0;
      return { ...p, cur, med, deltaMed, pctMed };
    }).sort((a, b) => a.deltaMed - b.deltaMed);
  }, [months2026, curPoint]);

  const platformsWithDrop = useMemo(() => platformsRanked.filter((p) => p.deltaMed < 0), [platformsRanked]);
  const hasPlatformDrop = platformsWithDrop.length > 0;
  const deepestPlatform = hasPlatformDrop ? platformsWithDrop[0] : null;

  // 4. Folder Breakdown (Deepest Dropping Folder)
  const foldersRanked = useMemo(() => {
    const months = ['1/2026', '2/2026', '3/2026', '4/2026', '5/2026', '6/2026', '7/2026', '8/2026'];
    const folderMap = new Map<string, string>();
    dataset.forEach((r) => {
      if (r.folder_id !== '-1' && r.folder && !folderMap.has(r.folder_id)) {
        folderMap.set(r.folder_id, r.folder);
      }
    });

    const items: Array<{
      id: string;
      name: string;
      curPV: number;
      medPV: number;
      deltaMed: number;
      pctMed: number;
    }> = [];

    folderMap.forEach((fName, fId) => {
      const recs = months.map((m) => dataset.find((r) => r.month === m && r.folder_id === fId));
      const pvs = recs.map((r) => r?.pageviews || 0);
      const cur = pvs[safeIdx] || 0;
      const med = calculateMedian(pvs);
      const deltaMed = cur - med;
      const pctMed = med > 0 ? (deltaMed / med) * 100 : 0;
      items.push({ id: fId, name: fName, curPV: cur, medPV: med, deltaMed, pctMed });
    });

    return items.sort((a, b) => a.deltaMed - b.deltaMed);
  }, [dataset, safeIdx]);

  const foldersWithDrop = useMemo(() => foldersRanked.filter((f) => f.deltaMed < 0), [foldersRanked]);
  const hasFolderDrop = foldersWithDrop.length > 0;
  const deepestFolder = hasFolderDrop ? foldersWithDrop[0] : null;
  const isSingleScope = Boolean(currentScope && currentScope !== 'ALL_FOLDERS_AGG' && currentScope !== 'ALL_VNE_AGG');
  const selectedFolderInfo = useMemo(() => {
    if (!isSingleScope) return null;
    const item = foldersRanked.find((f) => f.id === currentScope);
    const rank = foldersRanked.findIndex((f) => f.id === currentScope) + 1;
    return item ? { ...item, rank } : null;
  }, [foldersRanked, isSingleScope, currentScope]);

  // 5. Page Layers (Listing vs Detail)
  const deltaDetail = curDetail - medDetail;
  const pctDetail = medDetail > 0 ? (deltaDetail / medDetail) * 100 : 0;

  const curListing = curPoint?.record.pListing || 0;
  const medListing = calculateMedian(months2026.map((d) => d.record.pListing || 0));
  const deltaListing = curListing - medListing;
  const pctListing = medListing > 0 ? (deltaListing / medListing) * 100 : 0;

  const listingItem = {
    id: 'listing',
    name: 'Chuyên Trang (Listing)',
    shortName: 'Listing',
    cur: curListing,
    med: medListing,
    delta: deltaListing,
    pct: pctListing,
  };

  const detailItem = {
    id: 'detail',
    name: 'Bài Chi Tiết (Detail)',
    shortName: 'Detail',
    cur: curDetail,
    med: medDetail,
    delta: deltaDetail,
    pct: pctDetail,
  };

  const pageLayersSorted = useMemo(() => {
    return [listingItem, detailItem].sort((a, b) => a.delta - b.delta);
  }, [listingItem, detailItem]);
  const pageLayersWithDrop = pageLayersSorted.filter((l) => l.delta < 0);
  const hasPageLayerDrop = pageLayersWithDrop.length > 0;
  const deepestPageLayer = hasPageLayerDrop ? pageLayersWithDrop[0] : null;

  // 6. Markets (Domestic vs Overseas)
  const curDO = curPoint?.record.pDO || 0;
  const medDO = calculateMedian(months2026.map((d) => d.record.pDO || 0));
  const deltaDO = curDO - medDO;
  const pctDO = medDO > 0 ? (deltaDO / medDO) * 100 : 0;

  const curOV = curPoint?.record.pOV || 0;
  const medOV = calculateMedian(months2026.map((d) => d.record.pOV || 0));
  const deltaOV = curOV - medOV;
  const pctOV = medOV > 0 ? (deltaOV / medOV) * 100 : 0;

  const doItem = {
    id: 'do',
    name: 'Trong Nước (Domestic - DO)',
    shortName: 'Nội địa (DO)',
    cur: curDO,
    med: medDO,
    delta: deltaDO,
    pct: pctDO,
  };

  const ovItem = {
    id: 'ov',
    name: 'Hải Ngoại (Overseas - OV)',
    shortName: 'Hải ngoại (OV)',
    cur: curOV,
    med: medOV,
    delta: deltaOV,
    pct: pctOV,
  };

  const marketsSorted = useMemo(() => {
    return [doItem, ovItem].sort((a, b) => a.delta - b.delta);
  }, [doItem, ovItem]);
  const marketsWithDrop = marketsSorted.filter((m) => m.delta < 0);
  const hasMarketDrop = marketsWithDrop.length > 0;
  const deepestMarket = hasMarketDrop ? marketsWithDrop[0] : null;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
              <TrendingDown className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Kết Luận Nơi Sụt Giảm Chính Theo Các Góc Nhìn
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              Kỳ: Tháng {curPoint?.month || selectedMonth}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Đối chiếu: Chuẩn Trung vị 2026
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp số liệu sụt giảm lớn nhất theo từng chiều dữ liệu (đối chiếu với mốc trung vị 2026)
          </p>
        </div>

        {/* Total Deficit Pill */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">Chênh lệch tổng PV:</span>
          <span className={`text-sm font-extrabold font-mono ${deltaMedPV >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatDelta(deltaMedPV)}
          </span>
          <span className={`text-xs font-bold font-mono ${deltaMedPV >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ({formatPercent(pctMedPV)})
          </span>
        </div>
      </div>

      {/* 5-Column Grid of Findings Across Views */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 pt-1">
        {/* Card 1: Nguồn Lưu Lượng */}
        <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <Compass className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Nguồn Lưu Lượng</span>
            </div>

            {hasSourceDrop && deepestSource ? (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-900 truncate" title={deepestSource.name}>
                  {deepestSource.name}
                </div>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-base font-extrabold text-rose-600">
                    {formatDelta(deepestSource.deltaMed)}
                  </span>
                  <span className="text-xs font-bold text-rose-600">
                    {formatPercent(deepestSource.pctMed)}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] pt-1.5 border-t border-slate-200/60 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Tháng {curPoint?.monthNum || selectedMonth}:</span>
                    <span className="font-bold text-slate-800">{formatNumber(deepestSource.cur)} PV</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Mức trung vị:</span>
                    <span className="font-medium text-slate-700">{formatNumber(deepestSource.med)} PV</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 py-1">
                <div className="text-xs font-semibold text-emerald-700">
                  Không có nguồn nào giảm
                </div>
                <div className="text-[11px] text-slate-600 font-mono space-y-1 pt-1.5 border-t border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Nguồn cao nhất:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[110px]">{sourcesRanked[sourcesRanked.length - 1]?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Chênh lệch:</span>
                    <span className="text-emerald-600 font-bold">{formatDelta(sourcesRanked[sourcesRanked.length - 1]?.deltaMed || 0)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onTabChange('sources')}
            className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
          >
            <span>Xem chi tiết 7 nguồn</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 2: Nền Tảng Thiết Bị */}
        <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <MonitorSmartphone className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <span>Thiết Bị & Nền Tảng</span>
            </div>

            {hasPlatformDrop && deepestPlatform ? (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-900 truncate" title={deepestPlatform.name}>
                  {deepestPlatform.name}
                </div>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-base font-extrabold text-rose-600">
                    {formatDelta(deepestPlatform.deltaMed)}
                  </span>
                  <span className="text-xs font-bold text-rose-600">
                    {formatPercent(deepestPlatform.pctMed)}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] pt-1.5 border-t border-slate-200/60 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Tháng {curPoint?.monthNum || selectedMonth}:</span>
                    <span className="font-bold text-slate-800">{formatNumber(deepestPlatform.cur)} PV</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Mức trung vị:</span>
                    <span className="font-medium text-slate-700">{formatNumber(deepestPlatform.med)} PV</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 py-1">
                <div className="text-xs font-semibold text-emerald-700">
                  Không có thiết bị nào giảm
                </div>
                <div className="text-[11px] text-slate-600 font-mono space-y-1 pt-1.5 border-t border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Tất cả thiết bị:</span>
                    <span className="font-bold text-emerald-600">≥ mốc trung vị</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onTabChange('platforms')}
            className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
          >
            <span>Xem thiết bị & nền tảng</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 3: Ban / Chuyên Mục */}
        <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <FolderTree className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Ban / Chuyên Mục</span>
            </div>

            {isSingleScope && selectedFolderInfo ? (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-900 truncate" title={selectedFolderInfo.name}>
                  {selectedFolderInfo.name}
                </div>
                {selectedFolderInfo.deltaMed < 0 ? (
                  <>
                    <div className="flex items-baseline gap-2 font-mono">
                      <span className="text-base font-extrabold text-rose-600">
                        {formatDelta(selectedFolderInfo.deltaMed)}
                      </span>
                      <span className="text-xs font-bold text-rose-600">
                        {formatPercent(selectedFolderInfo.pctMed)}
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] pt-1.5 border-t border-slate-200/60 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Tháng {curPoint?.monthNum || selectedMonth}:</span>
                        <span className="font-bold text-slate-800">{formatNumber(selectedFolderInfo.curPV)} PV</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Mức trung vị:</span>
                        <span className="font-medium text-slate-700">{formatNumber(selectedFolderInfo.medPV)} PV</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-semibold text-emerald-700">
                      Không có sụt giảm
                    </div>
                    <div className="flex items-baseline gap-2 font-mono">
                      <span className="text-base font-extrabold text-emerald-600">
                        {formatDelta(selectedFolderInfo.deltaMed)}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">
                        {formatPercent(selectedFolderInfo.pctMed)}
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px] pt-1.5 border-t border-slate-200/60 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Tháng {curPoint?.monthNum || selectedMonth}:</span>
                        <span className="font-bold text-slate-800">{formatNumber(selectedFolderInfo.curPV)} PV</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Mức trung vị:</span>
                        <span className="font-medium text-slate-700">{formatNumber(selectedFolderInfo.medPV)} PV</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : hasFolderDrop && deepestFolder ? (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-900 truncate" title={deepestFolder.name}>
                  {deepestFolder.name}
                </div>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-base font-extrabold text-rose-600">
                    {formatDelta(deepestFolder.deltaMed)}
                  </span>
                  <span className="text-xs font-bold text-rose-600">
                    {formatPercent(deepestFolder.pctMed)}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] pt-1.5 border-t border-slate-200/60 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Tháng {curPoint?.monthNum || selectedMonth}:</span>
                    <span className="font-bold text-slate-800">{formatNumber(deepestFolder.curPV)} PV</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Mức trung vị:</span>
                    <span className="font-medium text-slate-700">{formatNumber(deepestFolder.medPV)} PV</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 py-1">
                <div className="text-xs font-semibold text-emerald-700">
                  Không có chuyên mục nào giảm
                </div>
                <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60 font-mono">
                  Tất cả các ban đều đạt hoặc vượt mức trung vị.
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onTabChange('folders')}
            className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
          >
            <span>{isSingleScope ? 'Xem chi tiết ban này' : 'Xem ma trận 24 ban'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 4: Lớp Trang */}
        <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Lớp Trang</span>
            </div>

            {hasPageLayerDrop && deepestPageLayer ? (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-900 truncate" title={deepestPageLayer.name}>
                  {deepestPageLayer.name}
                </div>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-base font-extrabold text-rose-600">
                    {formatDelta(deepestPageLayer.delta)}
                  </span>
                  <span className="text-xs font-bold text-rose-600">
                    {formatPercent(deepestPageLayer.pct)}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] pt-1.5 border-t border-slate-200/60 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">{deepestPageLayer.shortName} T{curPoint?.monthNum || selectedMonth}:</span>
                    <span className="font-bold text-slate-800">{formatNumber(deepestPageLayer.cur)} PV</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Mức trung vị:</span>
                    <span className="font-medium text-slate-700">{formatNumber(deepestPageLayer.med)} PV</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 py-1">
                <div className="text-xs font-semibold text-emerald-700">
                  Không có lớp trang nào giảm
                </div>
                <div className="space-y-1 text-[11px] pt-1.5 border-t border-slate-200/60 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Listing:</span>
                    <span className="font-bold text-emerald-600">{formatDelta(deltaListing)} ({formatPercent(pctListing)})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Detail:</span>
                    <span className="font-bold text-emerald-600">{formatDelta(deltaDetail)} ({formatPercent(pctDetail)})</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onTabChange('pages')}
            className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
          >
            <span>Xem chi tiết lớp trang</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 5: Thị Trường */}
        <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <Globe className="w-3.5 h-3.5 text-violet-600 shrink-0" />
              <span>Thị Trường Độc Giả</span>
            </div>

            {hasMarketDrop && deepestMarket ? (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-900 truncate" title={deepestMarket.name}>
                  {deepestMarket.name}
                </div>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-base font-extrabold text-rose-600">
                    {formatDelta(deepestMarket.delta)}
                  </span>
                  <span className="text-xs font-bold text-rose-600">
                    {formatPercent(deepestMarket.pct)}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] pt-1.5 border-t border-slate-200/60 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">{deepestMarket.shortName} T{curPoint?.monthNum || selectedMonth}:</span>
                    <span className="font-bold text-slate-800">{formatNumber(deepestMarket.cur)} PV</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Mức trung vị:</span>
                    <span className="font-medium text-slate-700">{formatNumber(deepestMarket.med)} PV</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 py-1">
                <div className="text-xs font-semibold text-emerald-700">
                  Không có thị trường nào giảm
                </div>
                <div className="space-y-1 text-[11px] pt-1.5 border-t border-slate-200/60 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Nội địa (DO):</span>
                    <span className="font-bold text-emerald-600">{formatDelta(deltaDO)} ({formatPercent(pctDO)})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Hải ngoại (OV):</span>
                    <span className="font-bold text-emerald-600">{formatDelta(deltaOV)} ({formatPercent(pctOV)})</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onTabChange('pages')}
            className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
          >
            <span>Xem chi tiết thị trường</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
