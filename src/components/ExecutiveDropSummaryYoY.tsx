import React, { useMemo } from 'react';
import {
  Compass,
  MonitorSmartphone,
  FolderTree,
  Globe,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Layers,
  Sparkles,
} from 'lucide-react';
import { YoYSummaryData, computeYoYFolderRanking } from '../utils/yoyAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../utils/formatters';
import { NewsRecord } from '../types';

interface Props {
  yoyData: YoYSummaryData;
  dataset: NewsRecord[];
  onTabChange: (tab: string) => void;
  currentScope?: string;
  onScopeChange?: (scope: string) => void;
}

export const ExecutiveDropSummaryYoY: React.FC<Props> = ({
  yoyData,
  dataset,
  onTabChange,
  currentScope = 'ALL_FOLDERS_AGG',
  onScopeChange,
}) => {
  const { sumRecord2026, sumRecord2025, monthsRangeLabel, pv2026, pv2025, deltaPV, pctDeltaPV } = yoyData;

  // 1. Traffic Sources YoY (Find Deepest Drop)
  const sourcesDef = [
    { key: 'pInHome' as const, name: 'P- In-Home' },
    { key: 'pInDetail' as const, name: 'P- In-Detail' },
    { key: 'pExGoogle' as const, name: 'P- Ex-Google' },
    { key: 'pExDirect' as const, name: 'P- Ex-Direct' },
    { key: 'pExSocial' as const, name: 'P- Ex-Social' },
    { key: 'pInFolder' as const, name: 'P- In-Folder' },
    { key: 'pInOther' as const, name: 'P- In-Other' },
  ];

  const sourcesRanked = useMemo(() => {
    return sourcesDef
      .map((s) => {
        const val26 = Number(sumRecord2026[s.key]) || 0;
        const val25 = Number(sumRecord2025[s.key]) || 0;
        const delta = val26 - val25;
        const pct = val25 > 0 ? (delta / val25) * 100 : 0;
        return { ...s, val26, val25, delta, pct };
      })
      .sort((a, b) => a.delta - b.delta);
  }, [sumRecord2026, sumRecord2025]);

  const deepestSource = sourcesRanked[0];
  const largestGainSource = [...sourcesRanked].reverse()[0];

  // 2. Platforms YoY (Find Deepest Drop)
  const platformsDef = [
    { key: 'pMobile' as const, name: 'Mobile Web' },
    { key: 'pPC' as const, name: 'PC Desktop' },
    { key: 'pApp' as const, name: 'VnExpress App' },
    { key: 'pTablet' as const, name: 'Tablet' },
  ];

  const platformsRanked = useMemo(() => {
    return platformsDef
      .map((p) => {
        const val26 = Number(sumRecord2026[p.key]) || 0;
        const val25 = Number(sumRecord2025[p.key]) || 0;
        const delta = val26 - val25;
        const pct = val25 > 0 ? (delta / val25) * 100 : 0;
        return { ...p, val26, val25, delta, pct };
      })
      .sort((a, b) => a.delta - b.delta);
  }, [sumRecord2026, sumRecord2025]);

  const deepestPlatform = platformsRanked[0];

  // 3. Folders YoY Ranking
  const folderRanking = useMemo(() => {
    return computeYoYFolderRanking(dataset);
  }, [dataset]);

  const deepestFolder = folderRanking.items[0];
  const largestGainFolder = [...folderRanking.items].reverse()[0];

  // 4. Page Layers & Markets
  const layersDef = [
    { key: 'pDetail' as const, name: 'Trang Bài viết (Detail)' },
    { key: 'pListing' as const, name: 'Trang Danh mục (Listing)' },
    { key: 'pDO' as const, name: 'Trong nước (Domestic - DO)' },
    { key: 'pOV' as const, name: 'Nước ngoài (Overseas - OV)' },
  ];

  const layersRanked = useMemo(() => {
    return layersDef
      .map((l) => {
        const val26 = Number(sumRecord2026[l.key]) || 0;
        const val25 = Number(sumRecord2025[l.key]) || 0;
        const delta = val26 - val25;
        const pct = val25 > 0 ? (delta / val25) * 100 : 0;
        return { ...l, val26, val25, delta, pct };
      })
      .sort((a, b) => a.delta - b.delta);
  }, [sumRecord2026, sumRecord2025]);

  const deepestLayer = layersRanked[0];

  const isOverallDrop = deltaPV < 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header of summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isOverallDrop ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {isOverallDrop ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Báo Cáo Điều Hành: Kết Luận Biến Động Lũy Kế 2026 vs Cùng Kỳ 2025
            </h2>
            <p className="text-xs text-slate-500">
              Tổng hợp điểm sụt giảm và tăng trưởng trọng điểm giữa <strong>Tổng 2026 ({monthsRangeLabel})</strong> và <strong>Cùng kỳ 2025</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Toàn hệ thống:</span>
          <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-md border ${
            isOverallDrop
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {formatDelta(deltaPV)} ({formatPercent(pctDeltaPV)})
          </span>
        </div>
      </div>

      {/* 4 Cards for 4 Dimensions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Dimension 1: Nguồn truy cập */}
        <div
          onClick={() => onTabChange('sources')}
          className="bg-slate-50/70 hover:bg-slate-100/70 transition rounded-xl p-3.5 border border-slate-200/80 cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between gap-1 text-slate-500 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                <span>Nguồn sụt giảm nhiều nhất</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition" />
            </div>

            {deepestSource && (
              <>
                <div className="text-sm font-bold text-slate-900">
                  {deepestSource.name}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xs font-medium text-slate-500">2026:</span>
                  <span className="text-xs font-bold font-mono text-slate-800">
                    {formatNumber(deepestSource.val26)}
                  </span>
                </div>
                <div className="mt-0.5 text-xs">
                  <span className={`font-bold font-mono ${deepestSource.delta < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatDelta(deepestSource.delta)} ({formatPercent(deepestSource.pct)})
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-blue-600 font-medium flex items-center gap-1">
            <span>Xem chi tiết 7 nguồn</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </div>
        </div>

        {/* Dimension 2: Nền tảng thiết bị */}
        <div
          onClick={() => onTabChange('platforms')}
          className="bg-slate-50/70 hover:bg-slate-100/70 transition rounded-xl p-3.5 border border-slate-200/80 cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between gap-1 text-slate-500 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <MonitorSmartphone className="w-3.5 h-3.5 text-indigo-600" />
                <span>Nền tảng giảm sâu nhất</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition" />
            </div>

            {deepestPlatform && (
              <>
                <div className="text-sm font-bold text-slate-900">
                  {deepestPlatform.name}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xs font-medium text-slate-500">2026:</span>
                  <span className="text-xs font-bold font-mono text-slate-800">
                    {formatNumber(deepestPlatform.val26)}
                  </span>
                </div>
                <div className="mt-0.5 text-xs">
                  <span className={`font-bold font-mono ${deepestPlatform.delta < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatDelta(deepestPlatform.delta)} ({formatPercent(deepestPlatform.pct)})
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-indigo-600 font-medium flex items-center gap-1">
            <span>Xem thiết bị & nền tảng</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </div>
        </div>

        {/* Dimension 3: Chuyên mục / Ban */}
        <div
          onClick={() => onTabChange('folders')}
          className="bg-slate-50/70 hover:bg-slate-100/70 transition rounded-xl p-3.5 border border-slate-200/80 cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between gap-1 text-slate-500 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <FolderTree className="w-3.5 h-3.5 text-amber-600" />
                <span>Ban sụt giảm nhiều nhất</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition" />
            </div>

            {deepestFolder && (
              <>
                <div className="text-sm font-bold text-slate-900 truncate" title={deepestFolder.folderName}>
                  {deepestFolder.folderName}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xs font-medium text-slate-500">2026:</span>
                  <span className="text-xs font-bold font-mono text-slate-800">
                    {formatNumber(deepestFolder.pv2026)}
                  </span>
                </div>
                <div className="mt-0.5 text-xs">
                  <span className={`font-bold font-mono ${deepestFolder.deltaPV < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatDelta(deepestFolder.deltaPV)} ({formatPercent(deepestFolder.pctDeltaPV)})
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-amber-600 font-medium flex items-center gap-1">
            <span>Xem bảng 24 chuyên mục</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </div>
        </div>

        {/* Dimension 4: Lớp trang & Thị trường */}
        <div
          onClick={() => onTabChange('pages')}
          className="bg-slate-50/70 hover:bg-slate-100/70 transition rounded-xl p-3.5 border border-slate-200/80 cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between gap-1 text-slate-500 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lớp trang giảm sâu nhất</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition" />
            </div>

            {deepestLayer && (
              <>
                <div className="text-sm font-bold text-slate-900 truncate" title={deepestLayer.name}>
                  {deepestLayer.name}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xs font-medium text-slate-500">2026:</span>
                  <span className="text-xs font-bold font-mono text-slate-800">
                    {formatNumber(deepestLayer.val26)}
                  </span>
                </div>
                <div className="mt-0.5 text-xs">
                  <span className={`font-bold font-mono ${deepestLayer.delta < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatDelta(deepestLayer.delta)} ({formatPercent(deepestLayer.pct)})
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <span>Xem lớp trang & thị trường</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </div>
        </div>
      </div>

      {/* Executive takeaway text card */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-blue-950">Nhận định lũy kế tổng thể: </span>
          <span>
            So với cùng kỳ 2025, tổng Pageviews năm 2026 {deltaPV >= 0 ? 'tăng trưởng' : 'sụt giảm'}{' '}
            <strong>{formatDelta(deltaPV)} PV ({formatPercent(pctDeltaPV)})</strong>. Nguồn biến động lớn nhất là{' '}
            <strong>{deepestSource?.name}</strong> ({formatDelta(deepestSource?.delta || 0)}), trong đó chuyên mục chịu tác động mạnh nhất là{' '}
            <strong>{deepestFolder?.folderName}</strong> ({formatDelta(deepestFolder?.deltaPV || 0)}).
            {largestGainFolder && largestGainFolder.deltaPV > 0 && (
              <span> Chuyên mục có mức tăng trưởng tốt nhất là <strong>{largestGainFolder.folderName}</strong> ({formatDelta(largestGainFolder.deltaPV)}).</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
