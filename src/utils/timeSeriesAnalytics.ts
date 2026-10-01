import { RAW_DATASET } from '../data/dataset';
import { NewsRecord } from '../types';

export interface MonthlyDataPoint {
  month: string; // e.g. "1/2026"
  label: string; // e.g. "T1/26"
  shortLabel: string; // e.g. "T1"
  year: number;
  monthNum: number;
  record: NewsRecord;
}

export interface MetricComparison {
  key: string;
  name: string;
  t8: number;
  mom: number; // T7-2026
  deltaMoM: number;
  pctMoM: number;
  pctChangeMoM?: number;
  median2026: number;
  median?: number;
  deltaMedian: number;
  pctMedian: number;
  pctChangeMedian?: number;
  mean2026: number;
  peak2026: number;
  peakMonth: string;
  shareT8?: number;
  shareMedian?: number;
  deltaShare?: number;
  rateEffect?: number;
  mixEffect?: number;
}

export interface DimensionTableSummary {
  dimensionName: string;
  rows: MetricComparison[];
  totalT8: number;
  totalMoM: number;
  totalMedian: number;
  totalDeltaMoM: number;
  totalPctMoM: number;
  totalDeltaMedian: number;
  totalPctMedian: number;
  trendSeries: any[]; // for recharts
}

// Compute median of a numeric array
export function calculateMedian(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

// Compute mean of a numeric array
export function calculateMean(values: number[]): number {
  if (!values || values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Check if a folder belongs to specialized standalone publication (Ngôi Sao, English, Tia Sáng)
export function isSpecialPublication(folderId: string, folderName: string = '', siteName: string = ''): boolean {
  if (siteName) {
    return siteName.trim().toLowerCase() !== 'vnexpress';
  }
  const lower = (folderName || '').toLowerCase().trim();
  return (
    folderId === '1002835' ||
    folderId === '1003888' ||
    folderId === '1006614' ||
    lower.includes('ngôi sao') ||
    lower.includes('ngoi sao') ||
    lower.includes('english') ||
    lower.includes('tia sáng') ||
    lower.includes('tia sang')
  );
}

// Get synthesized monthly records for a given folder scope across months, optionally filtered by siteName
export function getMonthlyRecordsForScope(
  scope: string, // "ALL", "ALL_FOLDERS_AGG", "ALL_VNE_AGG", site name, or specific folder_id / name
  dataset: NewsRecord[] = RAW_DATASET,
  siteName: string = 'ALL'
): MonthlyDataPoint[] {
  // Extract all distinct months present in the dataset and sort chronologically
  const monthSet = new Set<string>();
  dataset.forEach((r) => {
    if (r.month && r.month.includes('/')) {
      monthSet.add(r.month.trim());
    }
  });

  const allMonths = Array.from(monthSet).sort((a, b) => {
    const [m1, y1] = a.split('/').map(Number);
    const [m2, y2] = b.split('/').map(Number);
    return y1 !== y2 ? y1 - y2 : m1 - m2;
  });

  // Fallback if dataset is somehow empty
  if (allMonths.length === 0) {
    allMonths.push(
      '1/2025', '2/2025', '3/2025', '4/2025', '5/2025', '6/2025',
      '7/2025', '8/2025', '9/2025', '10/2025', '11/2025', '12/2025',
      '1/2026', '2/2026', '3/2026', '4/2026', '5/2026', '6/2026', '7/2026', '8/2026'
    );
  }

  // Determine effective site filter
  let effectiveSite = siteName;
  const knownSites = ['vnexpress', 'ngoi sao', 'english', 'tia sáng', 'tia sang'];
  const lowerScope = (scope || '').toLowerCase().trim();

  if (knownSites.includes(lowerScope) && effectiveSite === 'ALL') {
    effectiveSite = scope;
  }

  const results: MonthlyDataPoint[] = [];

  for (const m of allMonths) {
    const [mo, yr] = m.split('/').map(Number);
    let matched = dataset.filter((r) => r.month === m);

    // Filter by site_name if specified and not 'ALL'
    if (effectiveSite && effectiveSite !== 'ALL') {
      matched = matched.filter(
        (r) => (r.site_name || '').trim().toLowerCase() === effectiveSite.trim().toLowerCase()
      );
    }

    let synthRecord: NewsRecord;

    const isAllScope =
      !scope ||
      scope === 'ALL' ||
      scope === 'ALL_FOLDERS_AGG' ||
      knownSites.includes(lowerScope);

    if (isAllScope) {
      const folderRecs = matched.filter((r) => r.folder_id !== '-1' || (r.pageviews || 0) > 0);
      const siteLabel =
        effectiveSite !== 'ALL'
          ? (effectiveSite === 'Ngoi sao' ? 'Ngôi sao' : effectiveSite)
          : 'Toàn bộ hệ thống';
      synthRecord = sumRecords(folderRecs, m, 'ALL', `Toàn bộ ${siteLabel}`);
    } else if (scope === 'ALL_VNE_AGG') {
      // Sum across ONLY sections/departments belonging to VnExpress
      const folderRecs = matched.filter((r) => {
        if (r.folder_id === '-1') return false;
        return !isSpecialPublication(r.folder_id, r.folder);
      });
      synthRecord = sumRecords(folderRecs, m, 'ALL_VNE_AGG', 'Toàn bộ VnExpress');
    } else {
      // Specific folder by ID or name
      const fRec =
        matched.find((r) => r.folder_id === scope || r.folder === scope) ||
        dataset.find((r) => r.month === m && (r.folder_id === scope || r.folder === scope));
      if (fRec) {
        synthRecord = {
          ...fRec,
          sessions: fRec.sessions !== undefined ? fRec.sessions : Math.round((fRec.pageviews || 0) / 2.38),
        };
      } else {
        synthRecord = createEmptyRecord(m, scope, scope);
      }
    }

    results.push({
      month: m,
      label: `T${mo}/${String(yr).slice(-2)}`,
      shortLabel: `T${mo}`,
      year: yr,
      monthNum: mo,
      record: synthRecord,
    });
  }

  return results;
}

function sumRecords(records: NewsRecord[], month: string, folderId: string, folderName: string): NewsRecord {
  const init = createEmptyRecord(month, folderId, folderName);
  for (const r of records) {
    init.articles += r.articles || 0;
    init.articleThuong += r.articleThuong || 0;
    init.articleThuongMai += r.articleThuongMai || 0;
    init.aBuildTop += r.aBuildTop || 0;
    init.aNonBuildTop += r.aNonBuildTop || 0;
    init.pageviews += r.pageviews || 0;
    init.pageviewsNoAds += r.pageviewsNoAds || 0;
    init.pageviewsAds += r.pageviewsAds || 0;
    const sVal = r.sessions !== undefined ? r.sessions : Math.round((r.pageviews || 0) / 2.38);
    init.sessions = (init.sessions || 0) + sVal;
    init.pExDirect += r.pExDirect || 0;
    if (r.pExDirectBrandname !== undefined && r.pExDirectBrandname !== null && r.pExDirectBrandname > 0) {
      init.pExDirectBrandname = (init.pExDirectBrandname || 0) + r.pExDirectBrandname;
    }
    init.pExGoogle += r.pExGoogle || 0;
    if (r.pExGoogleSearch !== undefined && r.pExGoogleSearch !== null && r.pExGoogleSearch > 0) {
      init.pExGoogleSearch = (init.pExGoogleSearch || 0) + r.pExGoogleSearch;
    }
    if (r.pExGoogleDiscover !== undefined && r.pExGoogleDiscover !== null && r.pExGoogleDiscover > 0) {
      init.pExGoogleDiscover = (init.pExGoogleDiscover || 0) + r.pExGoogleDiscover;
    }
    init.pExSocial += r.pExSocial || 0;
    init.pInHome += r.pInHome || 0;
    init.pInFolder += r.pInFolder || 0;
    init.pInDetail += r.pInDetail || 0;
    init.pInOther += r.pInOther || 0;
    init.pInTagTopic24h = (init.pInTagTopic24h || 0) + (r.pInTagTopic24h || 0);
    init.pListing += r.pListing || 0;
    init.pDetail += r.pDetail || 0;
    init.pDO += r.pDO || 0;
    init.pOV += r.pOV || 0;
    init.pUnknown += r.pUnknown || 0;
    init.pMobile += r.pMobile || 0;
    init.pPC += r.pPC || 0;
    init.pApp += r.pApp || 0;
    init.pTablet += r.pTablet || 0;
    init.pOtherPlatform = (init.pOtherPlatform || 0) + (r.pOtherPlatform || 0);
    init.pNew = (init.pNew || 0) + (r.pNew || 0);
    init.pReturn = (init.pReturn || 0) + (r.pReturn || 0);
    init.pLover = (init.pLover || 0) + (r.pLover || 0);
  }
  return init;
}

function createEmptyRecord(month: string, folderId: string, folderName: string): NewsRecord {
  return {
    month,
    folder_id: folderId,
    folder: folderName,
    articles: 0,
    articleThuong: 0,
    articleThuongMai: 0,
    aBuildTop: 0,
    aNonBuildTop: 0,
    pageviews: 0,
    pageviewsNoAds: 0,
    pageviewsAds: 0,
    sessions: 0,
    pExDirect: 0,
    pExDirectBrandname: undefined,
    pExGoogle: 0,
    pExGoogleSearch: undefined,
    pExGoogleDiscover: undefined,
    pExSocial: 0,
    pInHome: 0,
    pInFolder: 0,
    pInDetail: 0,
    pInOther: 0,
    pInTagTopic24h: 0,
    pListing: 0,
    pDetail: 0,
    pDO: 0,
    pOV: 0,
    pUnknown: 0,
    pMobile: 0,
    pPC: 0,
    pApp: 0,
    pTablet: 0,
    pOtherPlatform: 0,
    pNew: 0,
    pReturn: 0,
    pLover: 0,
  };
}

// Compute comparison metrics for an array of component keys
export function analyzeDimensionSeries(
  monthlyData: MonthlyDataPoint[], // 2026 data points
  components: { key: keyof NewsRecord; name: string }[],
  totalKey: keyof NewsRecord,
  targetMonth?: string
): DimensionTableSummary {
  const months2026 = monthlyData.filter((d) => d.year === 2026);
  const targetIdx = targetMonth
    ? months2026.findIndex((d) => d.month === targetMonth)
    : months2026.length - 1;
  const safeTargetIdx = targetIdx >= 0 ? targetIdx : months2026.length - 1;
  const t8Point = months2026[safeTargetIdx] || months2026[months2026.length - 1];
  const t7Point = safeTargetIdx > 0 ? months2026[safeTargetIdx - 1] : t8Point;

  const totalT8 = Number(t8Point.record[totalKey]) || 0;
  const totalMoM = Number(t7Point.record[totalKey]) || 0;
  const totalValues2026 = months2026.map((d) => Number(d.record[totalKey]) || 0);
  const totalMedian = calculateMedian(totalValues2026);

  const rows: MetricComparison[] = [];

  for (const comp of components) {
    const t8Val = Number(t8Point.record[comp.key]) || 0;
    const momVal = Number(t7Point.record[comp.key]) || 0;
    const series2026 = months2026.map((d) => Number(d.record[comp.key]) || 0);

    const medianVal = calculateMedian(series2026);
    const meanVal = calculateMean(series2026);

    let maxVal = -Infinity;
    let maxMonth = '';
    months2026.forEach((d) => {
      const v = Number(d.record[comp.key]) || 0;
      if (v > maxVal) {
        maxVal = v;
        maxMonth = d.shortLabel;
      }
    });

    const deltaMoM = t8Val - momVal;
    const pctMoM = momVal > 0 ? (deltaMoM / momVal) * 100 : 0;

    const deltaMedian = t8Val - medianVal;
    const pctMedian = medianVal > 0 ? (deltaMedian / medianVal) * 100 : 0;

    const shareT8 = totalT8 > 0 ? (t8Val / totalT8) * 100 : 0;
    const shareMedian = totalMedian > 0 ? (medianVal / totalMedian) * 100 : 0;
    const deltaShare = shareT8 - shareMedian;

    // Kitagawa decomposition (T8 vs Median)
    const wT = totalT8 > 0 ? t8Val / totalT8 : 0;
    const w0 = totalMedian > 0 ? medianVal / totalMedian : 0;
    const totalDelta = totalT8 - totalMedian;
    const avgTotal = (totalT8 + totalMedian) / 2;

    const rateEffect = ((wT + w0) / 2) * totalDelta;
    const mixEffect = (wT - w0) * avgTotal;

    rows.push({
      key: String(comp.key),
      name: comp.name,
      t8: t8Val,
      mom: momVal,
      deltaMoM,
      pctMoM,
      pctChangeMoM: pctMoM,
      median2026: medianVal,
      median: medianVal,
      deltaMedian,
      pctMedian,
      pctChangeMedian: pctMedian,
      mean2026: meanVal,
      peak2026: maxVal,
      peakMonth: maxMonth,
      shareT8,
      shareMedian,
      deltaShare,
      rateEffect,
      mixEffect,
    });
  }

  // Trend series for Recharts
  const trendSeries = months2026.map((d) => {
    const point: any = {
      month: d.month,
      shortLabel: d.shortLabel,
      label: d.label,
      total: Number(d.record[totalKey]) || 0,
    };
    for (const comp of components) {
      point[comp.key] = Number(d.record[comp.key]) || 0;
    }
    return point;
  });

  const totalDeltaMoM = totalT8 - totalMoM;
  const totalPctMoM = totalMoM > 0 ? (totalDeltaMoM / totalMoM) * 100 : 0;
  const totalDeltaMedian = totalT8 - totalMedian;
  const totalPctMedian = totalMedian > 0 ? (totalDeltaMedian / totalMedian) * 100 : 0;

  return {
    dimensionName: String(totalKey),
    rows,
    totalT8,
    totalMoM,
    totalMedian,
    totalDeltaMoM,
    totalPctMoM,
    totalDeltaMedian,
    totalPctMedian,
    trendSeries,
  };
}

// Folder ranking across all individual folders
export interface FolderComparisonItem {
  folderId: string;
  folderName: string;
  siteName?: string;
  curPV: number;
  t8PV: number; // alias for curPV
  median2026PV: number;
  deltaMedianPV: number;
  pctMedianPV: number;
  curArticles: number;
  t8Articles: number; // alias for curArticles
  median2026Articles: number;
  curDetail: number;
  t8Detail: number; // alias for curDetail
  median2026Detail: number;
  deltaMedianDetail: number;
  pctMedianDetail: number;
  curNew?: number;
  curReturn?: number;
  curLover?: number;
  pctNew?: number;
  pctReturn?: number;
  pctLover?: number;
  pctNewYoY?: number;
  pctReturnYoY?: number;
  pctLoverYoY?: number;
  trend: number[];
}

export function computeFolderRanking(
  dataset: NewsRecord[] = RAW_DATASET,
  selectedMonth: string = '8/2026'
): FolderComparisonItem[] {
  // Extract all 2026 months available in dataset
  const mSet = new Set<string>();
  dataset.forEach((r) => {
    if (r.month && r.month.includes('/2026')) {
      mSet.add(r.month.trim());
    }
  });

  const months2026 = Array.from(mSet).sort((a, b) => {
    const [m1] = a.split('/').map(Number);
    const [m2] = b.split('/').map(Number);
    return m1 - m2;
  });

  if (months2026.length === 0) {
    months2026.push('1/2026', '2/2026', '3/2026', '4/2026', '5/2026', '6/2026', '7/2026', '8/2026');
  }

  const folderMap = new Map<string, { folderName: string; siteName?: string }>();

  dataset.forEach((r) => {
    if (r.folder_id && r.folder_id !== '-1' && r.folder && !folderMap.has(r.folder_id)) {
      folderMap.set(r.folder_id, {
        folderName: r.folder_id === '1000000' ? 'Trang Home (Trang chủ)' : r.folder,
        siteName: r.site_name,
      });
    }
  });

  // Target index for selectedMonth
  const targetIdx = months2026.indexOf(selectedMonth);
  const safeIdx = targetIdx >= 0 ? targetIdx : months2026.length - 1;

  const items: FolderComparisonItem[] = [];

  for (const [fId, info] of folderMap.entries()) {
    const recs2026 = months2026.map((m) => {
      const match = dataset.find((r) => r.month === m && r.folder_id === fId);
      return match || createEmptyRecord(m, fId, info.folderName);
    });

    const pvs = recs2026.map((r) => r.pageviews || 0);
    const arts = recs2026.map((r) => r.articles || 0);
    const details = recs2026.map((r) => r.pDetail ?? 0);

    const curPV = pvs[safeIdx] || 0;
    const median2026PV = calculateMedian(pvs);
    const deltaMedianPV = curPV - median2026PV;
    const pctMedianPV = median2026PV > 0 ? (deltaMedianPV / median2026PV) * 100 : 0;

    const curArticles = arts[safeIdx] || 0;
    const median2026Articles = calculateMedian(arts);

    const curDetail = details[safeIdx] || 0;
    const median2026Detail = calculateMedian(details);
    const deltaMedianDetail = curDetail - median2026Detail;
    const pctMedianDetail = median2026Detail > 0 ? (deltaMedianDetail / median2026Detail) * 100 : 0;

    const news = recs2026.map((r) => r.pNew || 0);
    const rets = recs2026.map((r) => r.pReturn || 0);
    const lovs = recs2026.map((r) => r.pLover || 0);
    const curNew = news[safeIdx] || 0;
    const curReturn = rets[safeIdx] || 0;
    const curLover = lovs[safeIdx] || 0;
    const totReader = curNew + curReturn + curLover || curPV || 1;
    const pctNew = (curNew / totReader) * 100;
    const pctReturn = (curReturn / totReader) * 100;
    const pctLover = (curLover / totReader) * 100;

    items.push({
      folderId: fId,
      folderName: info.folderName,
      siteName: info.siteName,
      curPV,
      t8PV: curPV,
      median2026PV,
      deltaMedianPV,
      pctMedianPV,
      curArticles,
      t8Articles: curArticles,
      median2026Articles,
      curDetail,
      t8Detail: curDetail,
      median2026Detail,
      deltaMedianDetail,
      pctMedianDetail,
      curNew,
      curReturn,
      curLover,
      pctNew,
      pctReturn,
      pctLover,
      trend: pvs,
    });
  }

  // Sort by biggest drop vs median (ascending deltaMedianPV)
  items.sort((a, b) => a.deltaMedianPV - b.deltaMedianPV);
  return items;
}

// Compute comparison metrics for YoY (Sum 2026 vs Sum 2025 across matching months)
export function analyzeDimensionSeriesYoY(
  monthlyData: MonthlyDataPoint[],
  components: { key: keyof NewsRecord; name: string }[],
  totalKey: keyof NewsRecord
): DimensionTableSummary {
  const months2026 = monthlyData.filter((d) => d.year === 2026);
  const months2025 = monthlyData.filter((d) => d.year === 2025);

  // Match month numbers (e.g. 1..8)
  const availableMonthNums = new Set(months2026.map((d) => d.monthNum));
  const matched2025 = months2025.filter((d) => availableMonthNums.has(d.monthNum));

  let total2026 = 0;
  let total2025 = 0;
  months2026.forEach((d) => {
    total2026 += Number(d.record[totalKey]) || 0;
  });
  matched2025.forEach((d) => {
    total2025 += Number(d.record[totalKey]) || 0;
  });

  const rows: MetricComparison[] = [];

  for (const comp of components) {
    let sum26 = 0;
    let sum25 = 0;
    months2026.forEach((d) => {
      sum26 += Number(d.record[comp.key]) || 0;
    });
    matched2025.forEach((d) => {
      sum25 += Number(d.record[comp.key]) || 0;
    });

    const deltaMedian = sum26 - sum25;
    const pctMedian = sum25 > 0 ? (deltaMedian / sum25) * 100 : 0;

    const shareT8 = total2026 > 0 ? (sum26 / total2026) * 100 : 0;
    const shareMedian = total2025 > 0 ? (sum25 / total2025) * 100 : 0;
    const deltaShare = shareT8 - shareMedian;

    let maxVal = -Infinity;
    let maxMonth = '';
    months2026.forEach((d) => {
      const v = Number(d.record[comp.key]) || 0;
      if (v > maxVal) {
        maxVal = v;
        maxMonth = d.shortLabel;
      }
    });

    rows.push({
      key: String(comp.key),
      name: comp.name,
      t8: sum26,
      mom: sum25,
      deltaMoM: deltaMedian,
      pctMoM: pctMedian,
      pctChangeMoM: pctMedian,
      median2026: sum25,
      median: sum25,
      deltaMedian,
      pctMedian,
      pctChangeMedian: pctMedian,
      mean2026: sum26 / (months2026.length || 1),
      peak2026: maxVal,
      peakMonth: maxMonth,
      shareT8,
      shareMedian,
      deltaShare,
    });
  }

  // Monthly trend series for Recharts: full timeline from 2025 to latest month
  const trendSeries = monthlyData.map((d) => {
    const point: any = {
      month: d.label,
      shortLabel: d.label,
      label: d.label,
      rawMonth: d.month,
      year: d.year,
      total: Number(d.record[totalKey]) || 0,
    };
    for (const comp of components) {
      point[comp.key] = Number(d.record[comp.key]) || 0;
    }
    return point;
  });

  const totalDeltaMedian = total2026 - total2025;
  const totalPctMedian = total2025 > 0 ? (totalDeltaMedian / total2025) * 100 : 0;

  return {
    dimensionName: String(totalKey),
    rows,
    totalT8: total2026,
    totalMoM: total2025,
    totalMedian: total2025,
    totalDeltaMoM: totalDeltaMedian,
    totalPctMoM: totalPctMedian,
    totalDeltaMedian,
    totalPctMedian,
    trendSeries,
  };
}

// Folder ranking across all 24 individual folders in YoY mode (Sum 2026 vs Sum 2025)
export function computeFolderRankingYoY(
  dataset: NewsRecord[] = RAW_DATASET
): FolderComparisonItem[] {
  // Extract all 2026 and 2025 months available in dataset
  const mSet26 = new Set<number>();
  dataset.forEach((r) => {
    if (r.month && r.month.includes('/2026')) {
      const [m] = r.month.split('/').map(Number);
      if (m >= 1 && m <= 12) mSet26.add(m);
    }
  });
  const sortedMonths = Array.from(mSet26).sort((a, b) => a - b);
  const activeMonths = sortedMonths.length > 0 ? sortedMonths : [1, 2, 3, 4, 5, 6, 7, 8];

  const months2026 = activeMonths.map((m) => `${m}/2026`);
  const months2025 = activeMonths.map((m) => `${m}/2025`);
  const folderMap = new Map<string, { folderName: string; siteName?: string }>();

  dataset.forEach((r) => {
    if (r.folder_id && r.folder_id !== '-1' && r.folder && !folderMap.has(r.folder_id)) {
      folderMap.set(r.folder_id, {
        folderName: r.folder_id === '1000000' ? 'Trang Home (Trang chủ)' : r.folder,
        siteName: r.site_name,
      });
    }
  });

  const items: FolderComparisonItem[] = [];

  for (const [fId, info] of folderMap.entries()) {
    let sumPV26 = 0;
    let sumPV25 = 0;
    let sumArts26 = 0;
    let sumArts25 = 0;
    let sumDetail26 = 0;
    let sumDetail25 = 0;
    let sumNew26 = 0;
    let sumReturn26 = 0;
    let sumLover26 = 0;
    let sumNew25 = 0;
    let sumReturn25 = 0;
    let sumLover25 = 0;

    const monthlyPVs26: number[] = [];

    months2026.forEach((m) => {
      const match = dataset.find((r) => r.month === m && r.folder_id === fId);
      const pv = match?.pageviews || 0;
      sumPV26 += pv;
      sumArts26 += match?.articles || 0;
      sumDetail26 += match?.pDetail || 0;
      sumNew26 += match?.pNew || 0;
      sumReturn26 += match?.pReturn || 0;
      sumLover26 += match?.pLover || 0;
      monthlyPVs26.push(pv);
    });

    months2025.forEach((m) => {
      const match = dataset.find((r) => r.month === m && r.folder_id === fId);
      sumPV25 += match?.pageviews || 0;
      sumArts25 += match?.articles || 0;
      sumDetail25 += match?.pDetail || 0;
      sumNew25 += match?.pNew || 0;
      sumReturn25 += match?.pReturn || 0;
      sumLover25 += match?.pLover || 0;
    });

    const deltaPV = sumPV26 - sumPV25;
    const pctPV = sumPV25 > 0 ? (deltaPV / sumPV25) * 100 : 0;

    const deltaDetail = sumDetail26 - sumDetail25;
    const pctDetail = sumDetail25 > 0 ? (deltaDetail / sumDetail25) * 100 : 0;

    const totReader = sumNew26 + sumReturn26 + sumLover26 || sumPV26 || 1;
    const pctNew = (sumNew26 / totReader) * 100;
    const pctReturn = (sumReturn26 / totReader) * 100;
    const pctLover = (sumLover26 / totReader) * 100;

    const deltaNew = sumNew26 - sumNew25;
    const pctNewYoY = sumNew25 > 0 ? (deltaNew / sumNew25) * 100 : 0;

    const deltaReturn = sumReturn26 - sumReturn25;
    const pctReturnYoY = sumReturn25 > 0 ? (deltaReturn / sumReturn25) * 100 : 0;

    const deltaLover = sumLover26 - sumLover25;
    const pctLoverYoY = sumLover25 > 0 ? (deltaLover / sumLover25) * 100 : 0;

    items.push({
      folderId: fId,
      folderName: info.folderName,
      siteName: info.siteName,
      curPV: sumPV26,
      t8PV: sumPV26,
      median2026PV: sumPV25,
      deltaMedianPV: deltaPV,
      pctMedianPV: pctPV,
      curArticles: sumArts26,
      t8Articles: sumArts26,
      median2026Articles: sumArts25,
      curDetail: sumDetail26,
      t8Detail: sumDetail26,
      median2026Detail: sumDetail25,
      deltaMedianDetail: deltaDetail,
      pctMedianDetail: pctDetail,
      curNew: sumNew26,
      curReturn: sumReturn26,
      curLover: sumLover26,
      pctNew,
      pctReturn,
      pctLover,
      pctNewYoY,
      pctReturnYoY,
      pctLoverYoY,
      trend: monthlyPVs26,
    });
  }

  // Sort by biggest drop vs 2025
  items.sort((a, b) => a.deltaMedianPV - b.deltaMedianPV);
  return items;
}
