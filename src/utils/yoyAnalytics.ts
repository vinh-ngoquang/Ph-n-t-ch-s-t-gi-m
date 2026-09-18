import { NewsRecord } from '../types';
import { RAW_DATASET } from '../data/dataset';
import { isSpecialPublication } from './timeSeriesAnalytics';

export interface MonthPair {
  monthNum: number;
  label2026: string; // "T1/26"
  label2025: string; // "T1/25"
  shortLabel: string; // "T1"
  month2026: string; // "1/2026"
  month2025: string; // "1/2025"
  record2026: NewsRecord;
  record2025: NewsRecord;
}

export interface YoYDimensionRow {
  key: string;
  name: string;
  code: string;
  type?: string;
  color?: string;
  val2026: number;
  val2025: number;
  delta: number;
  pctDelta: number;
  share2026: number;
  share2025: number;
  deltaShare: number;
}

export interface YoYSummaryData {
  scope: string;
  monthsCount: number;
  monthsRangeLabel: string; // e.g. "T1 - T8"
  sumRecord2026: NewsRecord;
  sumRecord2025: NewsRecord;
  monthPairs: MonthPair[];
  // Key KPIs
  pv2026: number;
  pv2025: number;
  deltaPV: number;
  pctDeltaPV: number;

  sessions2026: number;
  sessions2025: number;
  deltaSessions: number;
  pctDeltaSessions: number;
  pvPerSession2026: number;
  pvPerSession2025: number;

  articles2026: number;
  articles2025: number;
  deltaArticles: number;
  pctDeltaArticles: number;

  buildTop2026: number;
  buildTop2025: number;
  deltaBuildTop: number;
  pctDeltaBuildTop: number;
  buildRate2026: number;
  buildRate2025: number;
}

export interface YoYFolderItem {
  folderId: string;
  folderName: string;
  isSpecial: boolean;
  pv2026: number;
  pv2025: number;
  deltaPV: number;
  pctDeltaPV: number;
  share2026: number;
  share2025: number;
  deltaShare: number;
  articles2026: number;
  articles2025: number;
  deltaArticles: number;
  detail2026: number;
  detail2025: number;
  trend2026: number[];
  trend2025: number[];
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
    pExDirectBrandname: 0,
    pExGoogle: 0,
    pExGoogleSearch: 0,
    pExGoogleDiscover: 0,
    pExSocial: 0,
    pInHome: 0,
    pInFolder: 0,
    pInDetail: 0,
    pInOther: 0,
    pListing: 0,
    pDetail: 0,
    pDO: 0,
    pOV: 0,
    pUnknown: 0,
    pMobile: 0,
    pPC: 0,
    pApp: 0,
    pTablet: 0,
  };
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
    if (r.pExDirectBrandname) {
      init.pExDirectBrandname = (init.pExDirectBrandname || 0) + r.pExDirectBrandname;
    }
    init.pExGoogle += r.pExGoogle || 0;
    if (r.pExGoogleSearch) {
      init.pExGoogleSearch = (init.pExGoogleSearch || 0) + r.pExGoogleSearch;
    }
    if (r.pExGoogleDiscover) {
      init.pExGoogleDiscover = (init.pExGoogleDiscover || 0) + r.pExGoogleDiscover;
    }
    init.pExSocial += r.pExSocial || 0;
    init.pInHome += r.pInHome || 0;
    init.pInFolder += r.pInFolder || 0;
    init.pInDetail += r.pInDetail || 0;
    init.pInOther += r.pInOther || 0;
    init.pListing += r.pListing || 0;
    init.pDetail += r.pDetail || 0;
    init.pDO += r.pDO || 0;
    init.pOV += r.pOV || 0;
    init.pUnknown += r.pUnknown || 0;
    init.pMobile += r.pMobile || 0;
    init.pPC += r.pPC || 0;
    init.pApp += r.pApp || 0;
    init.pTablet += r.pTablet || 0;
  }
  return init;
}

/**
 * Gets synthesized record for a specific scope and single month
 */
export function getSynthesizedRecordForScopeMonth(
  scope: string,
  month: string,
  dataset: NewsRecord[] = RAW_DATASET
): NewsRecord {
  const matched = dataset.filter((r) => r.month === month);

  if (scope === 'ALL_VNE_AGG') {
    const folderRecs = matched.filter((r) => {
      if (r.folder_id === '-1') return false;
      return !isSpecialPublication(r.folder_id, r.folder);
    });
    return sumRecords(folderRecs, month, 'ALL_VNE_AGG', 'Toàn bộ VnExpress (Chỉ các ban VnE)');
  }

  if (scope === 'ALL_FOLDERS_AGG' || scope === 'ALL') {
    const folderRecs = matched.filter((r) => r.folder_id !== '-1' || (r.pageviews || 0) > 0);
    return sumRecords(folderRecs, month, 'ALL_FOLDERS_AGG', 'Toàn bộ hệ thống (Tổng tất cả)');
  }

  const fRec = matched.find((r) => r.folder_id === scope || r.folder === scope);
  if (fRec) {
    return {
      ...fRec,
      sessions: fRec.sessions !== undefined ? fRec.sessions : Math.round((fRec.pageviews || 0) / 2.38),
    };
  }

  return createEmptyRecord(month, scope, scope);
}

/**
 * Calculates YoY Total 2026 vs same period 2025 for a given scope
 */
export function calculateYoYSummary(
  scope: string = 'ALL_FOLDERS_AGG',
  dataset: NewsRecord[] = RAW_DATASET
): YoYSummaryData {
  // 1. Identify all 2026 months present in dataset
  const monthNumSet = new Set<number>();
  dataset.forEach((r) => {
    if (r.month && r.month.includes('/2026')) {
      const [m] = r.month.split('/').map(Number);
      if (m >= 1 && m <= 12) monthNumSet.add(m);
    }
  });

  const sortedMonthNums = Array.from(monthNumSet).sort((a, b) => a - b);
  // Default to 1..8 if empty
  const activeMonthNums = sortedMonthNums.length > 0 ? sortedMonthNums : [1, 2, 3, 4, 5, 6, 7, 8];

  const minMonth = activeMonthNums[0];
  const maxMonth = activeMonthNums[activeMonthNums.length - 1];
  const monthsRangeLabel = `T${minMonth} - T${maxMonth}`;

  const monthPairs: MonthPair[] = [];
  const records2026: NewsRecord[] = [];
  const records2025: NewsRecord[] = [];

  for (const mNum of activeMonthNums) {
    const m26Str = `${mNum}/2026`;
    const m25Str = `${mNum}/2025`;

    const rec26 = getSynthesizedRecordForScopeMonth(scope, m26Str, dataset);
    const rec25 = getSynthesizedRecordForScopeMonth(scope, m25Str, dataset);

    records2026.push(rec26);
    records2025.push(rec25);

    monthPairs.push({
      monthNum: mNum,
      label2026: `T${mNum}/26`,
      label2025: `T${mNum}/25`,
      shortLabel: `T${mNum}`,
      month2026: m26Str,
      month2025: m25Str,
      record2026: rec26,
      record2025: rec25,
    });
  }

  // Aggregate sums
  const sumRecord2026 = sumRecords(records2026, `Total 2026 (${monthsRangeLabel})`, scope, scope);
  const sumRecord2025 = sumRecords(records2025, `Total 2025 (${monthsRangeLabel})`, scope, scope);

  // Key KPI math
  const pv2026 = sumRecord2026.pageviews || 0;
  const pv2025 = sumRecord2025.pageviews || 0;
  const deltaPV = pv2026 - pv2025;
  const pctDeltaPV = pv2025 > 0 ? (deltaPV / pv2025) * 100 : 0;

  const sessions2026 = sumRecord2026.sessions || 0;
  const sessions2025 = sumRecord2025.sessions || 0;
  const deltaSessions = sessions2026 - sessions2025;
  const pctDeltaSessions = sessions2025 > 0 ? (deltaSessions / sessions2025) * 100 : 0;
  const pvPerSession2026 = sessions2026 > 0 ? pv2026 / sessions2026 : 0;
  const pvPerSession2025 = sessions2025 > 0 ? pv2025 / sessions2025 : 0;

  const articles2026 = sumRecord2026.articles || 0;
  const articles2025 = sumRecord2025.articles || 0;
  const deltaArticles = articles2026 - articles2025;
  const pctDeltaArticles = articles2025 > 0 ? (deltaArticles / articles2025) * 100 : 0;

  const buildTop2026 = sumRecord2026.aBuildTop || 0;
  const buildTop2025 = sumRecord2025.aBuildTop || 0;
  const deltaBuildTop = buildTop2026 - buildTop2025;
  const pctDeltaBuildTop = buildTop2025 > 0 ? (deltaBuildTop / buildTop2025) * 100 : 0;
  const buildRate2026 = articles2026 > 0 ? (buildTop2026 / articles2026) * 100 : 0;
  const buildRate2025 = articles2025 > 0 ? (buildTop2025 / articles2025) * 100 : 0;

  return {
    scope,
    monthsCount: activeMonthNums.length,
    monthsRangeLabel,
    sumRecord2026,
    sumRecord2025,
    monthPairs,
    pv2026,
    pv2025,
    deltaPV,
    pctDeltaPV,
    sessions2026,
    sessions2025,
    deltaSessions,
    pctDeltaSessions,
    pvPerSession2026,
    pvPerSession2025,
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
  };
}

/**
 * Computes YoY breakdown rows for dimension components (Traffic sources, Platforms, etc.)
 */
export function computeYoYDimensionRows(
  sum2026: NewsRecord,
  sum2025: NewsRecord,
  totalKey: keyof NewsRecord,
  components: { key: keyof NewsRecord; name: string; code: string; type?: string; color?: string }[]
): {
  rows: YoYDimensionRow[];
  total2026: number;
  total2025: number;
  deltaTotal: number;
  pctDeltaTotal: number;
} {
  const total2026 = Number(sum2026[totalKey]) || 0;
  const total2025 = Number(sum2025[totalKey]) || 0;
  const deltaTotal = total2026 - total2025;
  const pctDeltaTotal = total2025 > 0 ? (deltaTotal / total2025) * 100 : 0;

  const rows: YoYDimensionRow[] = components.map((c) => {
    const val2026 = Number(sum2026[c.key]) || 0;
    const val2025 = Number(sum2025[c.key]) || 0;
    const delta = val2026 - val2025;
    const pctDelta = val2025 > 0 ? (delta / val2025) * 100 : 0;
    const share2026 = total2026 > 0 ? (val2026 / total2026) * 100 : 0;
    const share2025 = total2025 > 0 ? (val2025 / total2025) * 100 : 0;
    const deltaShare = share2026 - share2025;

    return {
      key: String(c.key),
      name: c.name,
      code: c.code,
      type: c.type,
      color: c.color,
      val2026,
      val2025,
      delta,
      pctDelta,
      share2026,
      share2025,
      deltaShare,
    };
  });

  return {
    rows,
    total2026,
    total2025,
    deltaTotal,
    pctDeltaTotal,
  };
}

/**
 * Computes YoY ranking for all 24 individual folders
 */
export function computeYoYFolderRanking(dataset: NewsRecord[] = RAW_DATASET): {
  items: YoYFolderItem[];
  totalPV2026: number;
  totalPV2025: number;
  deltaPVTotal: number;
  pctDeltaTotal: number;
} {
  // 1. Identify 2026 months
  const monthNumSet = new Set<number>();
  dataset.forEach((r) => {
    if (r.month && r.month.includes('/2026')) {
      const [m] = r.month.split('/').map(Number);
      if (m >= 1 && m <= 12) monthNumSet.add(m);
    }
  });
  const sortedMonthNums = Array.from(monthNumSet).sort((a, b) => a - b);
  const activeMonthNums = sortedMonthNums.length > 0 ? sortedMonthNums : [1, 2, 3, 4, 5, 6, 7, 8];

  const folderMap = new Map<string, string>();
  dataset.forEach((r) => {
    if (r.folder_id !== '-1' && r.folder && !folderMap.has(r.folder_id)) {
      folderMap.set(r.folder_id, r.folder);
    }
  });

  const rawItems: {
    folderId: string;
    folderName: string;
    isSpecial: boolean;
    pv2026: number;
    pv2025: number;
    articles2026: number;
    articles2025: number;
    detail2026: number;
    detail2025: number;
    trend2026: number[];
    trend2025: number[];
  }[] = [];

  let totalPV2026 = 0;
  let totalPV2025 = 0;

  for (const [fId, fName] of folderMap.entries()) {
    let sumPV26 = 0;
    let sumPV25 = 0;
    let sumArt26 = 0;
    let sumArt25 = 0;
    let sumDetail26 = 0;
    let sumDetail25 = 0;
    const trend26: number[] = [];
    const trend25: number[] = [];

    for (const mNum of activeMonthNums) {
      const m26 = `${mNum}/2026`;
      const m25 = `${mNum}/2025`;

      const match26 = dataset.find((r) => r.month === m26 && r.folder_id === fId);
      const match25 = dataset.find((r) => r.month === m25 && r.folder_id === fId);

      const pv26 = match26?.pageviews || 0;
      const pv25 = match25?.pageviews || 0;

      sumPV26 += pv26;
      sumPV25 += pv25;
      sumArt26 += match26?.articles || 0;
      sumArt25 += match25?.articles || 0;
      sumDetail26 += match26?.pDetail || 0;
      sumDetail25 += match25?.pDetail || 0;

      trend26.push(pv26);
      trend25.push(pv25);
    }

    totalPV2026 += sumPV26;
    totalPV2025 += sumPV25;

    rawItems.push({
      folderId: fId,
      folderName: fName,
      isSpecial: isSpecialPublication(fId, fName),
      pv2026: sumPV26,
      pv2025: sumPV25,
      articles2026: sumArt26,
      articles2025: sumArt25,
      detail2026: sumDetail26,
      detail2025: sumDetail25,
      trend2026: trend26,
      trend2025: trend25,
    });
  }

  const deltaPVTotal = totalPV2026 - totalPV2025;
  const pctDeltaTotal = totalPV2025 > 0 ? (deltaPVTotal / totalPV2025) * 100 : 0;

  const items: YoYFolderItem[] = rawItems.map((item) => {
    const deltaPV = item.pv2026 - item.pv2025;
    const pctDeltaPV = item.pv2025 > 0 ? (deltaPV / item.pv2025) * 100 : 0;
    const share2026 = totalPV2026 > 0 ? (item.pv2026 / totalPV2026) * 100 : 0;
    const share2025 = totalPV2025 > 0 ? (item.pv2025 / totalPV2025) * 100 : 0;
    const deltaShare = share2026 - share2025;
    const deltaArticles = item.articles2026 - item.articles2025;

    return {
      ...item,
      deltaPV,
      pctDeltaPV,
      share2026,
      share2025,
      deltaShare,
      deltaArticles,
    };
  });

  // Default sort by biggest drop (ascending deltaPV)
  items.sort((a, b) => a.deltaPV - b.deltaPV);

  return {
    items,
    totalPV2026,
    totalPV2025,
    deltaPVTotal,
    pctDeltaTotal,
  };
}
