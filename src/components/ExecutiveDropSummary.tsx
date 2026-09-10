import React, { useMemo } from 'react';
import {
  Compass,
  BarChart3,
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
}

export const ExecutiveDropSummary: React.FC<ExecutiveDropSummaryProps> = ({
  monthlyData,
  selectedMonth,
  dataset,
  onTabChange,
}) => {
  const months2026 = monthlyData.filter((d) => d.year === 2026);
  const targetIdx = months2026.findIndex((d) => d.month === selectedMonth);
  const safeIdx = targetIdx >= 0 ? targetIdx : months2026.length - 1;
  const curPoint = months2026[safeIdx] || months2026[months2026.length - 1];
  const prevPoint = safeIdx > 0 ? months2026[safeIdx - 1] : null;

  // 1. Core Totals
  const curPV = curPoint?.record.pageviews || 0;
  const medPV = calculateMedian(months2026.map((d) => d.record.pageviews || 0));
  const deltaMedPV = curPV - medPV;
  const pctMedPV = medPV > 0 ? (deltaMedPV / medPV) * 100 : 0;

  const curArt = curPoint?.record.articles || 0;
  const medArt = calculateMedian(months2026.map((d) => d.record.articles || 0));

  // Yield calculated using P-Detail / Articles
  const curDetail = curPoint?.record.pDetail || 0;
  const medDetail = calculateMedian(months2026.map((d) => d.record.pDetail || 0));

  const curYield = curArt > 0 ? curDetail / curArt : 0;
  const medYield = medArt > 0 ? medDetail / medArt : 0;
  const deltaMedYield = curYield - medYield;
  const pctMedYield = medYield > 0 ? (deltaMedYield / medYield) * 100 : 0;

  // LMDI Yield Effect on P-Detail
  const yieldEffectDetail = curArt * (curYield - medYield);
  const volumeEffectDetail = (curArt - medArt) * medYield;

  // 2. Traffic Sources Breakdown (Find Deepest Drop)
  const sourcesDef = [
    { key: 'pInHome' as const, name: 'Từ Trang Bìa (In-Home)', desc: 'Độc giả bấm từ trang chủ' },
    { key: 'pInDetail' as const, name: 'Giữa Các Bài (In-Detail)', desc: 'Đọc tiếp luồng bài chi tiết' },
    { key: 'pExGoogle' as const, name: 'Tìm Kiếm Google (SEO)', desc: 'Organic Search ngoài site' },
    { key: 'pExDirect' as const, name: 'Trực Tiếp (Direct)', desc: 'Gõ trực tiếp / Bookmark' },
    { key: 'pExSocial' as const, name: 'Mạng Xã Hội (Social)', desc: 'Facebook, Zalo, chia sẻ' },
    { key: 'pInFolder' as const, name: 'Chuyên Mục (In-Folder)', desc: 'Duyệt danh sách chuyên trang' },
    { key: 'pInOther' as const, name: 'Nội Bộ Khác (In-Other)', desc: 'Widget, tag, tìm kiếm nội bộ' },
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

  const topDroppingSource = sourcesRanked[0];
  const secondDroppingSource = sourcesRanked[1];

  // 3. Platforms Breakdown (Find Deepest Drop)
  const platformsDef = [
    { key: 'pPC' as const, name: 'Máy tính PC', desc: 'Desktop văn phòng' },
    { key: 'pMobile' as const, name: 'Mobile Web', desc: 'Trình duyệt điện thoại' },
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

  const topDroppingPlatform = platformsRanked[0];

  // 4. Folder Breakdown (Top 3 Dropping Folders)
  const foldersRanked = useMemo(() => {
    const months = ['1/2026', '2/2026', '3/2026', '4/2026', '5/2026', '6/2026', '7/2026', '8/2026'];
    const folderMap = new Map<string, string>();
    dataset.forEach((r) => {
      if (r.folder_id !== '-1' && r.folder && !folderMap.has(r.folder_id)) {
        folderMap.set(r.folder_id, r.folder);
      }
    });

    const items: Array<{ id: string; name: string; curPV: number; medPV: number; deltaMed: number; pctMed: number }> = [];

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

  const top3DroppingFolders = foldersRanked.slice(0, 3);

  // 5. Page Layers & Markets Breakdown
  const deltaDetail = curDetail - medDetail;
  const pctDetail = medDetail > 0 ? (deltaDetail / medDetail) * 100 : 0;

  const curDO = curPoint?.record.pDO || 0;
  const medDO = calculateMedian(months2026.map((d) => d.record.pDO || 0));
  const deltaDO = curDO - medDO;
  const pctDO = medDO > 0 ? (deltaDO / medDO) * 100 : 0;

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
            Tổng hợp nhanh các điểm nghẽn và nguyên nhân cốt lõi gây sụt giảm lưu lượng theo từng chiều dữ liệu
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

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-900">
                {topDroppingSource?.name}
              </div>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-base font-extrabold text-rose-600">
                  {formatDelta(topDroppingSource?.deltaMed || 0)}
                </span>
                <span className="text-xs font-bold text-rose-600">
                  {formatPercent(topDroppingSource?.pctMed || 0)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Sức dẫn từ trang chủ vào bài đọc suy yếu, tiếp theo là {secondDroppingSource?.name} ({formatDelta(secondDroppingSource?.deltaMed || 0)}).
              </p>
            </div>
          </div>

          <button
            onClick={() => onTabChange('sources')}
            className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
          >
            <span>Xem chi tiết 7 nguồn</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 2: Quy Mô vs Yield */}
        <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Quy Mô vs Hiệu Suất</span>
            </div>

            <div className="space-y-1.5">
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Hiệu Suất Yield
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  (Công thức: P-Detail / Bài)
                </div>
              </div>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-base font-extrabold text-rose-600">
                  {formatNumber(curYield)}
                </span>
                <span className="text-[11px] font-medium text-slate-400 font-sans">P-Detail/bài</span>
                <span className="text-xs font-bold text-rose-600 ml-auto">
                  {formatPercent(pctMedYield)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Sản lượng bài đạt {formatNumber(curArt)} bài, nhưng hiệu suất đọc chi tiết/bài giảm làm hụt ~{(Math.abs(yieldEffectDetail) / 1_000_000).toFixed(1)}M lượt đọc theo LMDI.
              </p>
            </div>
          </div>

          <button
            onClick={() => onTabChange('overview')}
            className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
          >
            <span>Xem phân rã LMDI</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 3: Nền Tảng Thiết Bị */}
        <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <MonitorSmartphone className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <span>Thiết Bị & Nền Tảng</span>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-900">
                {topDroppingPlatform?.name}
              </div>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-base font-extrabold text-rose-600">
                  {formatDelta(topDroppingPlatform?.deltaMed || 0)}
                </span>
                <span className="text-xs font-bold text-rose-600">
                  {formatPercent(topDroppingPlatform?.pctMed || 0)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Máy tính để bàn sụt giảm thói quen đọc trong giờ làm việc; Mobile Web vẫn giữ vững tỷ trọng áp đảo.
              </p>
            </div>
          </div>

          <button
            onClick={() => onTabChange('platforms')}
            className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
          >
            <span>Xem thiết bị & nền tảng</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 4: 24 Chuyên Mục */}
        <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <FolderTree className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Ban / Chuyên Mục</span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-900 mb-1">
                3 Ban thâm hụt PV lớn nhất:
              </div>
              {top3DroppingFolders.map((f, i) => (
                <div key={f.id} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 last:border-0 gap-1.5">
                  <span className="text-slate-700 font-medium truncate flex-1" title={f.name}>
                    {i + 1}. {f.name}
                  </span>
                  <div className="flex items-baseline gap-1 shrink-0 font-mono text-right">
                    <span className="font-bold text-rose-600">
                      {formatDelta(f.deltaMed)}
                    </span>
                    <span className="text-[10px] font-bold text-rose-600">
                      ({formatPercent(f.pctMed)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onTabChange('folders')}
            className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
          >
            <span>Xem ma trận 24 ban</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 5: Lớp Trang & Thị Trường */}
        <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-300 transition">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <Globe className="w-3.5 h-3.5 text-violet-600 shrink-0" />
              <span>Lớp Trang & Thị Trường</span>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-900">
                Đọc Chi Tiết & Độc Giả Nội Địa
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Lớp Detail:</span>
                  <span className="font-mono font-bold text-rose-600">{formatDelta(deltaDetail)} ({formatPercent(pctDetail)})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Trong nước (DO):</span>
                  <span className="font-mono font-bold text-rose-600">{formatDelta(deltaDO)} ({formatPercent(pctDO)})</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug pt-0.5">
                Độc giả trong nước đọc bài chi tiết chiếm 88% lượng suy giảm chung.
              </p>
            </div>
          </div>

          <button
            onClick={() => onTabChange('pages')}
            className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
          >
            <span>Xem lớp trang & thị trường</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
