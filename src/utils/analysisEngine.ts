import { NewsRecord } from '../types';

export interface ValidationIssue {
  date: string;
  folder: string;
  dimension: string;
  expected: number;
  actual: number;
  diff: number;
  diffPct: number;
  severity: 'WARNING' | 'ERROR';
}

export interface ValidationSummary {
  periodT: string;
  periodT1: string;
  daysT: number;
  daysT1: number;
  daysEqual: boolean;
  articlesValid: boolean;
  pageviewsValid: boolean;
  totalIssuesCount: number;
  issues: ValidationIssue[];
}

export interface MetricSummary {
  base: number;
  target: number;
  delta: number;
  pctGrowth: number;
}

export interface OverviewMetrics {
  pageviews: MetricSummary;
  articles: MetricSummary;
  yield: MetricSummary; // PV / Article
  dailyPV: MetricSummary;
  dailyArticles: MetricSummary;
  oneSentenceVerdict: string;
}

export interface LMDIResult {
  deltaPV: number;
  volumeEffect: number;
  volumeEffectPct: number;
  yieldEffect: number;
  yieldEffectPct: number;
  L: number;
  primaryDriver: 'VOLUME' | 'YIELD' | 'BALANCED';
  verdictText: string;
  shapleyVolumeEffect: number;
  shapleyYieldEffect: number;
}

export interface DimensionRow {
  key: string;
  name: string;
  baseVal: number;
  targetVal: number;
  delta: number;
  pctGrowth: number;
  baseShare: number;
  targetShare: number;
  deltaShare: number;
  contributionPct: number; // (delta / |totalDelta|) * 100
  rateEffect: number;      // Kitagawa: ((w_T + w_0)/2) * deltaTotal
  mixEffect: number;       // Kitagawa: (w_T - w_0) * ((Y_T + Y_0)/2)
  rateEffectPct: number;
  mixEffectPct: number;
}

export interface DimensionReport {
  dimensionKey: string;
  dimensionName: string;
  totalBase: number;
  totalTarget: number;
  totalDelta: number;
  pctGrowthTotal: number;
  rows: DimensionRow[];
  topDrivers: DimensionRow[]; // Top 2 positive contribution
  topDrags: DimensionRow[];   // Top 2 negative contribution
}

export interface CrossMatrixInsight {
  id: string;
  title: string;
  pairName: string;
  keyTakeaway: string;
  evidence: string;
  supportingData: { label: string; value: string; delta?: string }[];
  implication: string;
}

export interface RankedCauseItem {
  rank: number;
  name: string;
  type: 'NỘI TẠI' | 'NGOẠI CẢNH';
  impactPV: number;
  impactPctOfTotalChange: number;
  evidence: string;
  detailStory: string;
  actionableDirection: string;
}

export interface VerificationRequirement {
  id: string;
  area: string;
  missingData: string;
  whyNeeded: string;
  recommendedAction: string;
}

export interface FullAnalysisResult {
  periodT: string;
  periodT1: string;
  folderFilter: string;
  isNormalizedByDays: boolean;
  validation: ValidationSummary;
  overview: OverviewMetrics;
  lmdi: LMDIResult;
  dimensions: {
    ads: DimensionReport;
    sources: DimensionReport;
    layers: DimensionReport;
    markets: DimensionReport;
    platforms: DimensionReport;
    articleSources: DimensionReport;
    articlePositions: DimensionReport;
  };
  crossMatrix: CrossMatrixInsight[];
  topCauses: RankedCauseItem[];
  verificationList: VerificationRequirement[];
}

// Helper: Get label for period
export function getPeriodLabel(p: string): string {
  if (p === 'AVG_2026') return 'Trung bình năm 2026 (T1-T8/2026)';
  if (p === 'AVG_2026_PREV') return 'Trung bình 7 tháng đầu 2026 (T1-T7/2026)';
  if (p === 'AVG_2025') return 'Trung bình năm 2025 (Cả năm)';
  return `Tháng ${p}`;
}

// Get array of months for a period
export function getMonthsForPeriod(period: string): string[] {
  if (period === 'AVG_2026') {
    return ['1/2026', '2/2026', '3/2026', '4/2026', '5/2026', '6/2026', '7/2026', '8/2026'];
  }
  if (period === 'AVG_2026_PREV') {
    return ['1/2026', '2/2026', '3/2026', '4/2026', '5/2026', '6/2026', '7/2026'];
  }
  if (period === 'AVG_2025') {
    return Array.from({ length: 12 }, (_, i) => `${i + 1}/2025`);
  }
  return [period];
}

// Days in month lookup (assuming 2024 is leap year)
export function getDaysInMonth(monthStr: string): number {
  if (monthStr === 'AVG_2026') return 30.4;
  if (monthStr === 'AVG_2026_PREV') return 30.3;
  if (monthStr === 'AVG_2025') return 30.4;
  if (!monthStr || !monthStr.includes('/')) return 30;
  const [mStr, yStr] = monthStr.split('/');
  const month = parseInt(mStr, 10);
  const year = parseInt(yStr, 10);

  if (month === 2) {
    // Leap year check
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return isLeap ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

// Helper: aggregate records for a given filter
export function filterRecords(
  dataset: NewsRecord[],
  period: string,
  folderFilter: string // "ALL_FOLDERS_AGG", "1000000" (VnExpress total), or folder name
): NewsRecord[] {
  const months = getMonthsForPeriod(period);

  if (months.length === 1) {
    let matched = dataset.filter((r) => r.month === period);
    if (folderFilter === 'ALL_FOLDERS_AGG' || folderFilter === 'ALL') {
      return matched.filter((r) => r.folder_id !== '-1' || (r.pageviews || 0) > 0);
    }
    return matched.filter((r) => r.folder_id === folderFilter || r.folder === folderFilter);
  }

  // Multi-month average
  const matchingRecords = dataset.filter((r) => months.includes(r.month));
  let filtered = matchingRecords;
  if (folderFilter === 'ALL_FOLDERS_AGG' || folderFilter === 'ALL') {
    filtered = matchingRecords.filter((r) => r.folder_id !== '-1' || (r.pageviews || 0) > 0);
  } else {
    filtered = matchingRecords.filter((r) => r.folder_id === folderFilter || r.folder === folderFilter);
  }

  // Group by folder_id
  const folderMap = new Map<string, NewsRecord[]>();
  for (const r of filtered) {
    if (!folderMap.has(r.folder_id)) {
      folderMap.set(r.folder_id, []);
    }
    folderMap.get(r.folder_id)!.push(r);
  }

  const count = months.length;
  const averagedRecords: NewsRecord[] = [];
  for (const [fId, recs] of folderMap.entries()) {
    const baseRec = recs[0];
    const avgRec: NewsRecord = {
      month: period,
      folder_id: fId,
      folder: baseRec.folder,
      articles: recs.reduce((acc, r) => acc + r.articles, 0) / count,
      articleThuong: recs.reduce((acc, r) => acc + r.articleThuong, 0) / count,
      articleThuongMai: recs.reduce((acc, r) => acc + r.articleThuongMai, 0) / count,
      aBuildTop: recs.reduce((acc, r) => acc + r.aBuildTop, 0) / count,
      aNonBuildTop: recs.reduce((acc, r) => acc + r.aNonBuildTop, 0) / count,
      pageviews: recs.reduce((acc, r) => acc + r.pageviews, 0) / count,
      pageviewsNoAds: recs.reduce((acc, r) => acc + r.pageviewsNoAds, 0) / count,
      pageviewsAds: recs.reduce((acc, r) => acc + r.pageviewsAds, 0) / count,
      pExDirect: recs.reduce((acc, r) => acc + r.pExDirect, 0) / count,
      pExGoogle: recs.reduce((acc, r) => acc + r.pExGoogle, 0) / count,
      pExSocial: recs.reduce((acc, r) => acc + r.pExSocial, 0) / count,
      pInHome: recs.reduce((acc, r) => acc + r.pInHome, 0) / count,
      pInFolder: recs.reduce((acc, r) => acc + r.pInFolder, 0) / count,
      pInDetail: recs.reduce((acc, r) => acc + r.pInDetail, 0) / count,
      pInOther: recs.reduce((acc, r) => acc + r.pInOther, 0) / count,
      pListing: recs.reduce((acc, r) => acc + r.pListing, 0) / count,
      pDetail: recs.reduce((acc, r) => acc + r.pDetail, 0) / count,
      pDO: recs.reduce((acc, r) => acc + r.pDO, 0) / count,
      pOV: recs.reduce((acc, r) => acc + r.pOV, 0) / count,
      pUnknown: recs.reduce((acc, r) => acc + r.pUnknown, 0) / count,
      pMobile: recs.reduce((acc, r) => acc + r.pMobile, 0) / count,
      pPC: recs.reduce((acc, r) => acc + r.pPC, 0) / count,
      pApp: recs.reduce((acc, r) => acc + r.pApp, 0) / count,
      pTablet: recs.reduce((acc, r) => acc + r.pTablet, 0) / count,
    };
    averagedRecords.push(avgRec);
  }

  return averagedRecords;
}

// Sum multiple records into a single synthesized NewsRecord
export function sumRecords(records: NewsRecord[], month: string, folderName: string): NewsRecord {
  const sum: NewsRecord = {
    month,
    folder_id: 'AGG',
    folder: folderName,
    articles: 0,
    articleThuong: 0,
    articleThuongMai: 0,
    aBuildTop: 0,
    aNonBuildTop: 0,
    pageviews: 0,
    pageviewsNoAds: 0,
    pageviewsAds: 0,
    pExDirect: 0,
    pExGoogle: 0,
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

  for (const r of records) {
    sum.articles += r.articles;
    sum.articleThuong += r.articleThuong;
    sum.articleThuongMai += r.articleThuongMai;
    sum.aBuildTop += r.aBuildTop;
    sum.aNonBuildTop += r.aNonBuildTop;
    sum.pageviews += r.pageviews;
    sum.pageviewsNoAds += r.pageviewsNoAds;
    sum.pageviewsAds += r.pageviewsAds;
    sum.pExDirect += r.pExDirect;
    sum.pExGoogle += r.pExGoogle;
    sum.pExSocial += r.pExSocial;
    sum.pInHome += r.pInHome;
    sum.pInFolder += r.pInFolder;
    sum.pInDetail += r.pInDetail;
    sum.pInOther += r.pInOther;
    sum.pListing += r.pListing;
    sum.pDetail += r.pDetail;
    sum.pDO += r.pDO;
    sum.pOV += r.pOV;
    sum.pUnknown += r.pUnknown;
    sum.pMobile += r.pMobile;
    sum.pPC += r.pPC;
    sum.pApp += r.pApp;
    sum.pTablet += r.pTablet;
  }
  return sum;
}

// Validation Step 1
export function runValidation(
  recordsT0: NewsRecord[],
  recordsT1: NewsRecord[],
  periodT1: string,
  periodT: string
): ValidationSummary {
  const daysT1 = getDaysInMonth(periodT1);
  const daysT = getDaysInMonth(periodT);
  const daysEqual = daysT1 === daysT;

  const issues: ValidationIssue[] = [];

  const checkRec = (r: NewsRecord, date: string) => {
    // Check Articles breakdown
    if (r.articles > 0) {
      const artSrc = r.articleThuong + r.articleThuongMai;
      if (Math.abs(r.articles - artSrc) / r.articles > 0.01) {
        issues.push({
          date,
          folder: r.folder,
          dimension: 'Articles: Thường + Thương mại',
          expected: r.articles,
          actual: artSrc,
          diff: artSrc - r.articles,
          diffPct: (Math.abs(artSrc - r.articles) / r.articles) * 100,
          severity: 'WARNING',
        });
      }
      const artPos = r.aBuildTop + r.aNonBuildTop;
      if (Math.abs(r.articles - artPos) / r.articles > 0.01) {
        issues.push({
          date,
          folder: r.folder,
          dimension: 'Articles: Build Top + Non-Build Top',
          expected: r.articles,
          actual: artPos,
          diff: artPos - r.articles,
          diffPct: (Math.abs(artPos - r.articles) / r.articles) * 100,
          severity: 'WARNING',
        });
      }
    }

    // Check Pageviews breakdown
    if (r.pageviews > 0) {
      // Ads
      const pvAds = r.pageviewsNoAds + r.pageviewsAds;
      if (Math.abs(r.pageviews - pvAds) / r.pageviews > 0.01) {
        issues.push({
          date,
          folder: r.folder,
          dimension: 'Pageviews: (-$) Ads + ($) Ads',
          expected: r.pageviews,
          actual: pvAds,
          diff: pvAds - r.pageviews,
          diffPct: (Math.abs(pvAds - r.pageviews) / r.pageviews) * 100,
          severity: 'WARNING',
        });
      }
      // Traffic Source (7 items)
      const pvSrc =
        r.pExDirect +
        r.pExGoogle +
        r.pExSocial +
        r.pInHome +
        r.pInFolder +
        r.pInDetail +
        r.pInOther;
      if (Math.abs(r.pageviews - pvSrc) / r.pageviews > 0.01) {
        issues.push({
          date,
          folder: r.folder,
          dimension: 'Pageviews: Nguồn truy cập (7 nguồn)',
          expected: r.pageviews,
          actual: pvSrc,
          diff: pvSrc - r.pageviews,
          diffPct: (Math.abs(pvSrc - r.pageviews) / r.pageviews) * 100,
          severity: 'WARNING',
        });
      }
      // Layer (Listing + Detail)
      const pvLayer = r.pListing + r.pDetail;
      if (Math.abs(r.pageviews - pvLayer) / r.pageviews > 0.01) {
        issues.push({
          date,
          folder: r.folder,
          dimension: 'Pageviews: Lớp trang (Listing + Detail)',
          expected: r.pageviews,
          actual: pvLayer,
          diff: pvLayer - r.pageviews,
          diffPct: (Math.abs(pvLayer - r.pageviews) / r.pageviews) * 100,
          severity: pvLayer === 0 ? 'ERROR' : 'WARNING',
        });
      }
      // Market (DO + OV + Unknown)
      const pvMarket = r.pDO + r.pOV + r.pUnknown;
      if (Math.abs(r.pageviews - pvMarket) / r.pageviews > 0.01) {
        issues.push({
          date,
          folder: r.folder,
          dimension: 'Pageviews: Thị trường (DO + OV + Unknown)',
          expected: r.pageviews,
          actual: pvMarket,
          diff: pvMarket - r.pageviews,
          diffPct: (Math.abs(pvMarket - r.pageviews) / r.pageviews) * 100,
          severity: 'WARNING',
        });
      }
      // Platform (Mobile + PC + App + Tablet)
      const pvPlatform = r.pMobile + r.pPC + r.pApp + r.pTablet;
      if (Math.abs(r.pageviews - pvPlatform) / r.pageviews > 0.01) {
        issues.push({
          date,
          folder: r.folder,
          dimension: 'Pageviews: Nền tảng (Mobile + PC + App + Tablet)',
          expected: r.pageviews,
          actual: pvPlatform,
          diff: pvPlatform - r.pageviews,
          diffPct: (Math.abs(pvPlatform - r.pageviews) / r.pageviews) * 100,
          severity: 'WARNING',
        });
      }
    }
  };

  recordsT0.forEach((r) => checkRec(r, periodT1));
  recordsT1.forEach((r) => checkRec(r, periodT));

  return {
    periodT,
    periodT1,
    daysT,
    daysT1,
    daysEqual,
    articlesValid: !issues.some((i) => i.dimension.startsWith('Articles')),
    pageviewsValid: !issues.some((i) => i.dimension.startsWith('Pageviews')),
    totalIssuesCount: issues.length,
    issues,
  };
}

// Helper: build dimension breakdown with Kitagawa decomposition
export function buildDimensionReport(
  dimKey: string,
  dimName: string,
  items: { key: string; name: string; base: number; target: number }[],
  totalDeltaPV: number
): DimensionReport {
  const totalBase = items.reduce((acc, curr) => acc + curr.base, 0);
  const totalTarget = items.reduce((acc, curr) => acc + curr.target, 0);
  const totalDelta = totalTarget - totalBase;
  const pctGrowthTotal = totalBase > 0 ? (totalDelta / totalBase) * 100 : 0;
  const avgTotal = (totalTarget + totalBase) / 2;
  const absDeltaTotal = Math.abs(totalDeltaPV) > 0 ? Math.abs(totalDeltaPV) : 1;

  const rows: DimensionRow[] = items.map((item) => {
    const delta = item.target - item.base;
    const pctGrowth = item.base > 0 ? (delta / item.base) * 100 : item.target > 0 ? 100 : 0;
    const baseShare = totalBase > 0 ? item.base / totalBase : 0;
    const targetShare = totalTarget > 0 ? item.target / totalTarget : 0;
    const deltaShare = targetShare - baseShare;
    const contributionPct = (delta / absDeltaTotal) * 100;

    // Kitagawa decomposition:
    // Rate Effect = ((w_T + w_0) / 2) * totalDelta
    // Mix Effect  = (w_T - w_0) * avgTotal
    const rateEffect = ((targetShare + baseShare) / 2) * totalDelta;
    const mixEffect = deltaShare * avgTotal;

    const rateEffectPct = Math.abs(delta) > 0 ? (rateEffect / delta) * 100 : 0;
    const mixEffectPct = Math.abs(delta) > 0 ? (mixEffect / delta) * 100 : 0;

    return {
      key: item.key,
      name: item.name,
      baseVal: item.base,
      targetVal: item.target,
      delta,
      pctGrowth,
      baseShare,
      targetShare,
      deltaShare,
      contributionPct,
      rateEffect,
      mixEffect,
      rateEffectPct,
      mixEffectPct,
    };
  });

  // Sort rows by delta descending
  const sorted = [...rows].sort((a, b) => b.delta - a.delta);
  const topDrivers = sorted.filter((r) => r.delta > 0).slice(0, 2);
  const topDrags = [...sorted].reverse().filter((r) => r.delta < 0).slice(0, 2);

  return {
    dimensionKey: dimKey,
    dimensionName: dimName,
    totalBase,
    totalTarget,
    totalDelta,
    pctGrowthTotal,
    rows: sorted,
    topDrivers,
    topDrags,
  };
}

// Master Analysis Function
export function executeFullAnalysis(
  dataset: NewsRecord[],
  periodT1: string,
  periodT: string,
  folderFilter: string = '1000000',
  normalizeByDays: boolean = false
): FullAnalysisResult {
  // 1. Get raw records
  const rawRecordsT1 = filterRecords(dataset, periodT1, folderFilter);
  const rawRecordsT = filterRecords(dataset, periodT, folderFilter);

  // Run validation on raw records first
  const validation = runValidation(rawRecordsT1, rawRecordsT, periodT1, periodT);

  // If folderFilter is '1000000' (VnExpress site-wide), its row articles count is 0 because
  // articles are tracked across individual folders. To calculate total articles and PV/Article
  // accurately for site-wide VnExpress, we sum articles across all other folders for that month!
  let articlesSumT1 = 0;
  let articlesSumT = 0;
  let articleThuongSumT1 = 0;
  let articleThuongSumT = 0;
  let articleThuongMaiSumT1 = 0;
  let articleThuongMaiSumT = 0;
  let aBuildTopSumT1 = 0;
  let aBuildTopSumT = 0;
  let aNonBuildTopSumT1 = 0;
  let aNonBuildTopSumT = 0;

  if (folderFilter === '1000000') {
    const monthsT1 = getMonthsForPeriod(periodT1);
    const monthsT = getMonthsForPeriod(periodT);

    const allFolderRecsT1 = dataset.filter((r) => monthsT1.includes(r.month) && r.folder_id !== '1000000');
    const allFolderRecsT = dataset.filter((r) => monthsT.includes(r.month) && r.folder_id !== '1000000');

    articlesSumT1 = allFolderRecsT1.reduce((acc, r) => acc + r.articles, 0) / monthsT1.length;
    articlesSumT = allFolderRecsT.reduce((acc, r) => acc + r.articles, 0) / monthsT.length;
    articleThuongSumT1 = allFolderRecsT1.reduce((acc, r) => acc + r.articleThuong, 0) / monthsT1.length;
    articleThuongSumT = allFolderRecsT.reduce((acc, r) => acc + r.articleThuong, 0) / monthsT.length;
    articleThuongMaiSumT1 = allFolderRecsT1.reduce((acc, r) => acc + r.articleThuongMai, 0) / monthsT1.length;
    articleThuongMaiSumT = allFolderRecsT.reduce((acc, r) => acc + r.articleThuongMai, 0) / monthsT.length;
    aBuildTopSumT1 = allFolderRecsT1.reduce((acc, r) => acc + r.aBuildTop, 0) / monthsT1.length;
    aBuildTopSumT = allFolderRecsT.reduce((acc, r) => acc + r.aBuildTop, 0) / monthsT.length;
    aNonBuildTopSumT1 = allFolderRecsT1.reduce((acc, r) => acc + r.aNonBuildTop, 0) / monthsT1.length;
    aNonBuildTopSumT = allFolderRecsT.reduce((acc, r) => acc + r.aNonBuildTop, 0) / monthsT.length;
  }

  // Aggregate into single base and target records
  let r0 = sumRecords(rawRecordsT1, periodT1, folderFilter);
  let r1 = sumRecords(rawRecordsT, periodT, folderFilter);

  // If site-wide, assign aggregated articles
  if (folderFilter === '1000000') {
    r0.articles = articlesSumT1;
    r0.articleThuong = articleThuongSumT1;
    r0.articleThuongMai = articleThuongMaiSumT1;
    r0.aBuildTop = aBuildTopSumT1;
    r0.aNonBuildTop = aNonBuildTopSumT1;

    r1.articles = articlesSumT;
    r1.articleThuong = articleThuongSumT;
    r1.articleThuongMai = articleThuongMaiSumT;
    r1.aBuildTop = aBuildTopSumT;
    r1.aNonBuildTop = aNonBuildTopSumT;
  }

  // Normalization if requested
  const daysT1 = validation.daysT1;
  const daysT = validation.daysT;

  if (normalizeByDays && daysT1 !== daysT) {
    const factor0 = 30 / daysT1;
    const factor1 = 30 / daysT;

    const scale = (r: NewsRecord, f: number) => ({
      ...r,
      articles: r.articles * f,
      articleThuong: r.articleThuong * f,
      articleThuongMai: r.articleThuongMai * f,
      aBuildTop: r.aBuildTop * f,
      aNonBuildTop: r.aNonBuildTop * f,
      pageviews: r.pageviews * f,
      pageviewsNoAds: r.pageviewsNoAds * f,
      pageviewsAds: r.pageviewsAds * f,
      pExDirect: r.pExDirect * f,
      pExGoogle: r.pExGoogle * f,
      pExSocial: r.pExSocial * f,
      pInHome: r.pInHome * f,
      pInFolder: r.pInFolder * f,
      pInDetail: r.pInDetail * f,
      pInOther: r.pInOther * f,
      pListing: r.pListing * f,
      pDetail: r.pDetail * f,
      pDO: r.pDO * f,
      pOV: r.pOV * f,
      pUnknown: r.pUnknown * f,
      pMobile: r.pMobile * f,
      pPC: r.pPC * f,
      pApp: r.pApp * f,
      pTablet: r.pTablet * f,
    });

    r0 = scale(r0, factor0);
    r1 = scale(r1, factor1);
  }

  // STEP 2: Overview Metrics
  const dPV = r1.pageviews - r0.pageviews;
  const pctPV = r0.pageviews > 0 ? (dPV / r0.pageviews) * 100 : 0;

  const dArt = r1.articles - r0.articles;
  const pctArt = r0.articles > 0 ? (dArt / r0.articles) * 100 : 0;

  const yield0 = r0.articles > 0 ? r0.pageviews / r0.articles : 0;
  const yield1 = r1.articles > 0 ? r1.pageviews / r1.articles : 0;
  const dYield = yield1 - yield0;
  const pctYield = yield0 > 0 ? (dYield / yield0) * 100 : 0;

  const dailyPV0 = r0.pageviews / daysT1;
  const dailyPV1 = r1.pageviews / daysT;
  const dDailyPV = dailyPV1 - dailyPV0;
  const pctDailyPV = dailyPV0 > 0 ? (dDailyPV / dailyPV0) * 100 : 0;

  const dailyArt0 = r0.articles / daysT1;
  const dailyArt1 = r1.articles / daysT;
  const dDailyArt = dailyArt1 - dailyArt0;
  const pctDailyArt = dailyArt0 > 0 ? (dDailyArt / dailyArt0) * 100 : 0;

  // 1-sentence verdict
  let oneSentenceVerdict = '';
  if (dPV >= 0) {
    if (dArt > 0 && dYield <= 0) {
      oneSentenceVerdict = `Kỳ này Pageviews tăng +${pctPV.toFixed(1)}% chủ yếu nhờ tăng lượng bài xuất bản (+${pctArt.toFixed(1)}%), trong khi hiệu quả trung bình mỗi bài (PV/bài) bị suy giảm (-${Math.abs(pctYield).toFixed(1)}%).`;
    } else if (dArt <= 0 && dYield > 0) {
      oneSentenceVerdict = `Kỳ này Pageviews tăng +${pctPV.toFixed(1)}% hoàn toàn nhờ chất lượng bài viết vượt trội (PV/bài tăng +${pctYield.toFixed(1)}%) dù sản xuất ít bài hơn (${pctArt.toFixed(1)}%).`;
    } else {
      oneSentenceVerdict = `Kỳ này Pageviews tăng trưởng tích cực (+${pctPV.toFixed(1)}%) nhờ sự cộng hưởng cả về số lượng bài (+${pctArt.toFixed(1)}%) lẫn chất lượng trung bình (+${pctYield.toFixed(1)}%).`;
    }
  } else {
    if (dArt >= 0 && dYield < 0) {
      oneSentenceVerdict = `Kỳ này Pageviews giảm -${Math.abs(pctPV).toFixed(1)}% do chất lượng/hiệu quả thu hút độc giả sụt giảm nghiêm trọng (-${Math.abs(pctYield).toFixed(1)}% PV/bài), dù sản lượng bài viết vẫn duy trì hoặc tăng (+${pctArt.toFixed(1)}%).`;
    } else if (dArt < 0 && dYield >= 0) {
      oneSentenceVerdict = `Kỳ này Pageviews giảm -${Math.abs(pctPV).toFixed(1)}% chủ yếu do giảm quy mô sản xuất bài (${pctArt.toFixed(1)}%), trong khi chất lượng bài viết vẫn giữ vững (+${pctYield.toFixed(1)}% PV/bài).`;
    } else {
      oneSentenceVerdict = `Kỳ này Pageviews suy giảm -${Math.abs(pctPV).toFixed(1)}% do sụt giảm đồng thời cả quy mô xuất bản (${pctArt.toFixed(1)}%) lẫn hiệu quả tương tác trung bình (-${Math.abs(pctYield).toFixed(1)}% PV/bài).`;
    }
  }

  const overview: OverviewMetrics = {
    pageviews: { base: r0.pageviews, target: r1.pageviews, delta: dPV, pctGrowth: pctPV },
    articles: { base: r0.articles, target: r1.articles, delta: dArt, pctGrowth: pctArt },
    yield: { base: yield0, target: yield1, delta: dYield, pctGrowth: pctYield },
    dailyPV: { base: dailyPV0, target: dailyPV1, delta: dDailyPV, pctGrowth: pctDailyPV },
    dailyArticles: { base: dailyArt0, target: dailyArt1, delta: dDailyArt, pctGrowth: pctDailyArt },
    oneSentenceVerdict,
  };

  // STEP 3: LMDI & Shapley Decomposition
  let L = 0;
  let volumeEffect = 0;
  let yieldEffect = 0;
  if (r0.pageviews > 0 && r1.pageviews > 0 && r0.pageviews !== r1.pageviews) {
    L = (r1.pageviews - r0.pageviews) / (Math.log(r1.pageviews) - Math.log(r0.pageviews));
  } else {
    L = r0.pageviews;
  }

  if (r0.articles > 0 && r1.articles > 0) {
    volumeEffect = L * Math.log(r1.articles / r0.articles);
  }
  if (yield0 > 0 && yield1 > 0) {
    yieldEffect = L * Math.log(yield1 / yield0);
  }

  // Shapley verification
  const shapleyVolumeEffect = dArt * ((yield0 + yield1) / 2);
  const shapleyYieldEffect = dYield * ((r0.articles + r1.articles) / 2);

  const absDPV = Math.abs(dPV) > 0 ? Math.abs(dPV) : 1;
  const volumeEffectPct = (volumeEffect / absDPV) * 100;
  const yieldEffectPct = (yieldEffect / absDPV) * 100;

  let primaryDriver: 'VOLUME' | 'YIELD' | 'BALANCED' = 'BALANCED';
  if (Math.abs(volumeEffect) > Math.abs(yieldEffect) * 1.5) {
    primaryDriver = 'VOLUME';
  } else if (Math.abs(yieldEffect) > Math.abs(volumeEffect) * 1.5) {
    primaryDriver = 'YIELD';
  }

  let lmdiVerdictText = '';
  if (primaryDriver === 'VOLUME') {
    lmdiVerdictText = `LƯỢNG (Volume Effect) là động lực chi phối chính (${volumeEffect >= 0 ? '+' : ''}${Math.round(volumeEffect).toLocaleString()} PV, chiếm ${volumeEffectPct.toFixed(1)}% biến động).`;
  } else if (primaryDriver === 'YIELD') {
    lmdiVerdictText = `CHẤT (Yield Effect - PV/bài) là động lực chi phối chính (${yieldEffect >= 0 ? '+' : ''}${Math.round(yieldEffect).toLocaleString()} PV, chiếm ${yieldEffectPct.toFixed(1)}% biến động).`;
  } else {
    lmdiVerdictText = `Cả LƯỢNG và CHẤT đều tác động tương đương lên tổng biến động Pageviews.`;
  }

  const lmdi: LMDIResult = {
    deltaPV: dPV,
    volumeEffect,
    volumeEffectPct,
    yieldEffect,
    yieldEffectPct,
    L,
    primaryDriver,
    verdictText: lmdiVerdictText,
    shapleyVolumeEffect,
    shapleyYieldEffect,
  };

  // STEP 4 & 5: 5 Dimensions of Pageviews + 2 Dimensions of Articles
  const ads = buildDimensionReport(
    'ads',
    'Quảng cáo',
    [
      { key: 'pageviewsAds', name: 'Pageviews ($) Có Ads', base: r0.pageviewsAds, target: r1.pageviewsAds },
      { key: 'pageviewsNoAds', name: 'Pageviews (-$) Không Ads', base: r0.pageviewsNoAds, target: r1.pageviewsNoAds },
    ],
    dPV
  );

  const sources = buildDimensionReport(
    'sources',
    'Nguồn truy cập',
    [
      { key: 'pExDirect', name: 'P- Ex-Direct (Trực tiếp gõ URL)', base: r0.pExDirect, target: r1.pExDirect },
      { key: 'pExGoogle', name: 'P- Ex-Google (Tìm kiếm tự nhiên)', base: r0.pExGoogle, target: r1.pExGoogle },
      { key: 'pExSocial', name: 'P- Ex-Social (Mạng xã hội)', base: r0.pExSocial, target: r1.pExSocial },
      { key: 'pInHome', name: 'P- In-Home (Từ trang chủ)', base: r0.pInHome, target: r1.pInHome },
      { key: 'pInFolder', name: 'P- In-Folder (Từ trang chuyên mục)', base: r0.pInFolder, target: r1.pInFolder },
      { key: 'pInDetail', name: 'P- In-Detail (Từ bài viết khác)', base: r0.pInDetail, target: r1.pInDetail },
      { key: 'pInOther', name: 'P- In-Other (Nguồn nội bộ khác)', base: r0.pInOther, target: r1.pInOther },
    ],
    dPV
  );

  const layers = buildDimensionReport(
    'layers',
    'Lớp trang',
    [
      { key: 'pListing', name: 'P- Listing (Trang chủ + Chuyên mục)', base: r0.pListing, target: r1.pListing },
      { key: 'pDetail', name: 'P- Detail (Trang chi tiết bài viết)', base: r0.pDetail, target: r1.pDetail },
    ],
    dPV
  );

  const markets = buildDimensionReport(
    'markets',
    'Thị trường',
    [
      { key: 'pDO', name: 'P- DO (Trong nước)', base: r0.pDO, target: r1.pDO },
      { key: 'pOV', name: 'P- OV (Nước ngoài)', base: r0.pOV, target: r1.pOV },
      { key: 'pUnknown', name: 'P- Unknown (Chưa xác định)', base: r0.pUnknown, target: r1.pUnknown },
    ],
    dPV
  );

  const platforms = buildDimensionReport(
    'platforms',
    'Nền tảng',
    [
      { key: 'pMobile', name: 'P- Mobile (Web di động)', base: r0.pMobile, target: r1.pMobile },
      { key: 'pPC', name: 'P- PC (Máy tính để bàn)', base: r0.pPC, target: r1.pPC },
      { key: 'pApp', name: 'P- App (Ứng dụng VnExpress)', base: r0.pApp, target: r1.pApp },
      { key: 'pTablet', name: 'P- Tablet (Máy tính bảng)', base: r0.pTablet, target: r1.pTablet },
    ],
    dPV
  );

  const articleSources = buildDimensionReport(
    'articleSources',
    'Nguồn sản xuất bài viết',
    [
      { key: 'articleThuong', name: 'Article Thường (Tự sản xuất)', base: r0.articleThuong, target: r1.articleThuong },
      { key: 'articleThuongMai', name: 'Article Thương mại (PR/Booking)', base: r0.articleThuongMai, target: r1.articleThuongMai },
    ],
    dArt
  );

  const articlePositions = buildDimensionReport(
    'articlePositions',
    'Vị trí build bài viết',
    [
      { key: 'aBuildTop', name: 'A- Build Top (Lên trang chủ)', base: r0.aBuildTop, target: r1.aBuildTop },
      { key: 'aNonBuildTop', name: 'A- Non-Build Top (Không lên trang chủ)', base: r0.aNonBuildTop, target: r1.aNonBuildTop },
    ],
    dArt
  );

  // STEP 6: Cross Matrix Insights
  const crossMatrix: CrossMatrixInsight[] = [];

  // Insight 1: Traffic Source x Platform
  const dGoogle = r1.pExGoogle - r0.pExGoogle;
  const dMobile = r1.pMobile - r0.pMobile;
  const dPC = r1.pPC - r0.pPC;
  const dApp = r1.pApp - r0.pApp;
  crossMatrix.push({
    id: 'source-x-platform',
    title: 'Nguồn truy cập × Nền tảng',
    pairName: 'P- Ex-Google / P- Ex-Social vs P- Mobile / P- PC / P- App',
    keyTakeaway:
      dGoogle < 0
        ? `Lưu lượng tìm kiếm Google biến động ${dGoogle > 0 ? '+' : ''}${Math.round(dGoogle).toLocaleString()} PV song hành cùng xu hướng dịch chuyển thiết bị (${dMobile >= 0 ? 'Mobile tăng' : 'Mobile giảm'} ${Math.round(dMobile).toLocaleString()}, PC ${dPC >= 0 ? '+' : ''}${Math.round(dPC).toLocaleString()}).`
        : `Nguồn tìm kiếm Google tăng trưởng +${Math.round(dGoogle).toLocaleString()} PV, là trụ cột kéo tăng lượng độc giả trên các nền tảng chính.`,
    evidence: `Google: ${Math.round(r0.pExGoogle).toLocaleString()} → ${Math.round(r1.pExGoogle).toLocaleString()} (Δ: ${Math.round(dGoogle).toLocaleString()}). Mobile: ${Math.round(r0.pMobile).toLocaleString()} → ${Math.round(r1.pMobile).toLocaleString()} (Δ: ${Math.round(dMobile).toLocaleString()}).`,
    supportingData: [
      { label: 'P- Ex-Google', value: `${Math.round(r1.pExGoogle).toLocaleString()}`, delta: `${dGoogle >= 0 ? '+' : ''}${Math.round(dGoogle).toLocaleString()}` },
      { label: 'P- Mobile', value: `${Math.round(r1.pMobile).toLocaleString()}`, delta: `${dMobile >= 0 ? '+' : ''}${Math.round(dMobile).toLocaleString()}` },
      { label: 'P- PC', value: `${Math.round(r1.pPC).toLocaleString()}`, delta: `${dPC >= 0 ? '+' : ''}${Math.round(dPC).toLocaleString()}` },
      { label: 'P- App', value: `${Math.round(r1.pApp).toLocaleString()}`, delta: `${dApp >= 0 ? '+' : ''}${Math.round(dApp).toLocaleString()}` },
    ],
    implication:
      dGoogle < 0
        ? 'Cần rà soát các đợt cập nhật thuật toán Google Search (Core Update) và trải nghiệm đọc trên Web di động (Core Web Vitals).'
        : 'Chiến lược SEO nội dung và từ khóa đang duy trì phong độ tốt.',
  });

  // Insight 2: Page Layer x Traffic Source
  const dInHome = r1.pInHome - r0.pInHome;
  const dListing = r1.pListing - r0.pListing;
  const dDetail = r1.pDetail - r0.pDetail;
  const inHomeStatus =
    dInHome < 0
      ? `Lưu lượng chuyển đổi từ Trang chủ (In-Home) giảm ${Math.round(dInHome).toLocaleString()} PV. Điều này phản ánh sức hút của trang bìa hoặc tỷ lệ click-through vào bài chi tiết suy giảm.`
      : `Lưu lượng chuyển đổi từ Trang chủ (In-Home) tăng +${Math.round(dInHome).toLocaleString()} PV, cho thấy trang chủ giữ chân độc giả và điều phối traffic hiệu quả.`;
  crossMatrix.push({
    id: 'layer-x-source',
    title: 'Lớp trang × Nguồn truy cập',
    pairName: 'P- Listing / P- Detail vs P- In-Home / P- In-Folder',
    keyTakeaway: inHomeStatus,
    evidence: `Listing: Δ ${Math.round(dListing).toLocaleString()} PV. Detail: Δ ${Math.round(dDetail).toLocaleString()} PV. In-Home: ${Math.round(r0.pInHome).toLocaleString()} → ${Math.round(r1.pInHome).toLocaleString()} (Δ: ${Math.round(dInHome).toLocaleString()}).`,
    supportingData: [
      { label: 'P- Listing', value: `${Math.round(r1.pListing).toLocaleString()}`, delta: `${dListing >= 0 ? '+' : ''}${Math.round(dListing).toLocaleString()}` },
      { label: 'P- Detail', value: `${Math.round(r1.pDetail).toLocaleString()}`, delta: `${dDetail >= 0 ? '+' : ''}${Math.round(dDetail).toLocaleString()}` },
      { label: 'P- In-Home', value: `${Math.round(r1.pInHome).toLocaleString()}`, delta: `${dInHome >= 0 ? '+' : ''}${Math.round(dInHome).toLocaleString()}` },
      { label: 'P- In-Folder', value: `${Math.round(r1.pInFolder).toLocaleString()}`, delta: `${(r1.pInFolder - r0.pInFolder) >= 0 ? '+' : ''}${Math.round(r1.pInFolder - r0.pInFolder).toLocaleString()}` },
    ],
    implication:
      dListing < 0 && dInHome < 0
        ? 'Trang chủ giảm sức hút đọc tiếp. Cần tối ưu lại layout tin top 1-5, giật tít hấp dẫn hơn, và đổi mới cụm block đa phương tiện.'
        : 'Cấu trúc dẫn luồng từ Listing sang Detail đang hoạt động ổn định.',
  });

  // Insight 3: Market x Source
  const dDO = r1.pDO - r0.pDO;
  const dOV = r1.pOV - r0.pOV;
  crossMatrix.push({
    id: 'market-x-source',
    title: 'Thị trường × Nguồn truy cập',
    pairName: 'P- DO (Trong nước) vs P- OV (Nước ngoài)',
    keyTakeaway: `Thị trường trong nước (DO) biến động ${dDO >= 0 ? '+' : ''}${Math.round(dDO).toLocaleString()} PV (${((dDO / (r0.pDO || 1)) * 100).toFixed(1)}%), trong khi thị trường kiều bào/nước ngoài (OV) biến động ${dOV >= 0 ? '+' : ''}${Math.round(dOV).toLocaleString()} PV.`,
    evidence: `DO: ${Math.round(r0.pDO).toLocaleString()} → ${Math.round(r1.pDO).toLocaleString()}. OV: ${Math.round(r0.pOV).toLocaleString()} → ${Math.round(r1.pOV).toLocaleString()}.`,
    supportingData: [
      { label: 'P- DO (Trong nước)', value: `${Math.round(r1.pDO).toLocaleString()}`, delta: `${dDO >= 0 ? '+' : ''}${Math.round(dDO).toLocaleString()}` },
      { label: 'P- OV (Nước ngoài)', value: `${Math.round(r1.pOV).toLocaleString()}`, delta: `${dOV >= 0 ? '+' : ''}${Math.round(dOV).toLocaleString()}` },
      { label: 'Tỷ trọng DO kỳ T', value: `${((r1.pDO / (r1.pageviews || 1)) * 100).toFixed(1)}%` },
    ],
    implication:
      dOV < 0
        ? 'Thị trường nước ngoài sụt giảm, cần kiểm tra thời điểm múi giờ đăng tải tin tức quốc tế và nội dung kiều bào quan tâm.'
        : 'Thị trường nội địa là động lực nòng cốt chi phối toàn bộ bức tranh tăng trưởng.',
  });

  // Insight 4: Article Production Source x Build Top Position
  const dArtThuong = r1.articleThuong - r0.articleThuong;
  const dArtTM = r1.articleThuongMai - r0.articleThuongMai;
  const dBuildTop = r1.aBuildTop - r0.aBuildTop;
  const buildTopRate0 = r0.articles > 0 ? (r0.aBuildTop / r0.articles) * 100 : 0;
  const buildTopRate1 = r1.articles > 0 ? (r1.aBuildTop / r1.articles) * 100 : 0;
  const dBuildTopRate = buildTopRate1 - buildTopRate0;

  crossMatrix.push({
    id: 'source-x-buildtop',
    title: 'Nguồn sản xuất × Vị trí Build Top',
    pairName: 'Article Thường / Thương Mại vs A- Build Top / Non-Build Top',
    keyTakeaway: `Tỷ lệ bài lên Build Top thay đổi từ ${buildTopRate0.toFixed(1)}% sang ${buildTopRate1.toFixed(1)}% (Δ: ${dBuildTopRate >= 0 ? '+' : ''}${dBuildTopRate.toFixed(1)}%). Bài thương mại ${dArtTM >= 0 ? 'tăng' : 'giảm'} ${Math.round(dArtTM).toLocaleString()} bài, bài thường ${dArtThuong >= 0 ? 'tăng' : 'giảm'} ${Math.round(dArtThuong).toLocaleString()} bài.`,
    evidence: `Build Top: ${Math.round(r0.aBuildTop).toLocaleString()} → ${Math.round(r1.aBuildTop).toLocaleString()} (Δ: ${Math.round(dBuildTop).toLocaleString()}). Bài thương mại: ${Math.round(r0.articleThuongMai).toLocaleString()} → ${Math.round(r1.articleThuongMai).toLocaleString()}.`,
    supportingData: [
      { label: 'Tỷ lệ Build Top kỳ T', value: `${buildTopRate1.toFixed(1)}%`, delta: `${dBuildTopRate >= 0 ? '+' : ''}${dBuildTopRate.toFixed(1)}%` },
      { label: 'Article Thường', value: `${Math.round(r1.articleThuong).toLocaleString()}`, delta: `${dArtThuong >= 0 ? '+' : ''}${Math.round(dArtThuong).toLocaleString()}` },
      { label: 'Article Thương mại', value: `${Math.round(r1.articleThuongMai).toLocaleString()}`, delta: `${dArtTM >= 0 ? '+' : ''}${Math.round(dArtTM).toLocaleString()}` },
    ],
    implication:
      dBuildTopRate < 0
        ? 'Tỷ lệ bài được đẩy lên trang chủ bị pha loãng do số lượng bài viết tăng nhanh hơn diện tích hiển thị trang chủ.'
        : 'Khâu tuyển chọn bài lên trang chủ được duy trì với tỷ trọng ổn định.',
  });

  // STEP 7: Top 3 Core Root Causes
  // Find largest movers across all dimension items
  interface CandidateCause {
    name: string;
    type: 'NỘI TẠI' | 'NGOẠI CẢNH';
    impactPV: number;
    impactPct: number;
    evidence: string;
    story: string;
    direction: string;
  }

  const candidates: CandidateCause[] = [];

  // Check Volume vs Yield
  if (Math.abs(yieldEffect) > Math.abs(dPV) * 0.3) {
    candidates.push({
      name: yieldEffect < 0 ? 'Hiệu suất chất lượng bài viết (PV/Article) suy giảm' : 'Chất lượng bài viết vượt trội kéo tăng trưởng',
      type: 'NỘI TẠI',
      impactPV: yieldEffect,
      impactPct: (Math.abs(yieldEffect) / absDPV) * 100,
      evidence: `Yield (PV/bài) biến động từ ${yield0.toFixed(0)} xuống ${yield1.toFixed(0)} (${pctYield >= 0 ? '+' : ''}${pctYield.toFixed(1)}%). Phân rã LMDI ghi nhận Yield Effect tác động ${Math.round(yieldEffect).toLocaleString()} PV.`,
      story: `Sản lượng bài viết tăng nhanh nhưng khả năng tạo viral hoặc giữ chân độc giả đọc sâu chưa tương xứng, làm loãng hiệu suất trung bình mỗi bài.`,
      direction: 'Tập trung vào chất lượng đề tài chuyên sâu, bài Emagazine, Long-form và tối ưu tít/hình ảnh đại diện.',
    });
  }

  // Check Ex-Google
  candidates.push({
    name: dGoogle >= 0 ? 'Tăng trưởng mạnh từ kênh Tìm kiếm Google (Organic Search)' : 'Suy giảm lưu lượng tìm kiếm từ Google (Organic Search)',
    type: 'NGOẠI CẢNH',
    impactPV: dGoogle,
    impactPct: (Math.abs(dGoogle) / absDPV) * 100,
    evidence: `Traffic P- Ex-Google biến động ${dGoogle >= 0 ? '+' : ''}${Math.round(dGoogle).toLocaleString()} PV (${((dGoogle / (r0.pExGoogle || 1)) * 100).toFixed(1)}%), đóng góp ${((dGoogle / absDPV) * 100).toFixed(1)}% vào tổng biến động.`,
    story: dGoogle >= 0
      ? 'Chiến lược SEO nội dung và độ uy tín tên miền VnExpress trên công cụ tìm kiếm tiếp tục phát huy hiệu quả mạnh.'
      : 'Sự thay đổi thuật toán xếp hạng tìm kiếm của Google (Core Update/AI Overviews) hoặc biến động từ khóa thời sự làm giảm traffic tự nhiên.',
    direction: 'Kiểm tra Google Search Console: các cụm từ khóa bị tụt hạng, Core Web Vitals trên di động và cấu trúc dữ liệu schema bài viết.',
  });

  // Check In-Home
  candidates.push({
    name: dInHome >= 0 ? 'Sức hút trang chủ (In-Home) gia tăng dẫn dắt độc giả' : 'Sức hút trang chủ (In-Home) và tỷ lệ click-through sụt giảm',
    type: 'NỘI TẠI',
    impactPV: dInHome,
    impactPct: (Math.abs(dInHome) / absDPV) * 100,
    evidence: `Lưu lượng chuyển từ Trang chủ vào bài (P- In-Home) biến động ${dInHome >= 0 ? '+' : ''}${Math.round(dInHome).toLocaleString()} PV (${((dInHome / (r0.pInHome || 1)) * 100).toFixed(1)}%).`,
    story: dInHome >= 0
      ? 'Trang chủ được biên tập hấp dẫn, vị trí tin nóng và tiêu đề kích thích độc giả bấm đọc sâu liên tục.'
      : 'Độc giả vào trang chủ nhưng tỷ lệ nhấp vào đọc bài chi tiết thấp hơn, hoặc thời gian lưu lại trang bìa ngắn hơn.',
    direction: 'A/B testing tiêu đề, ảnh thumbnail trên top trang chủ, thử nghiệm các vị trí tin đinh và tin đa phương tiện nổi bật.',
  });

  // Check Mobile / Platform shift
  candidates.push({
    name: dMobile >= 0 ? 'Dịch chuyển độc giả đọc trên Mobile Web bùng nổ' : 'Hụt chân lưu lượng trên nền tảng Web Di Động (P- Mobile)',
    type: 'NGOẠI CẢNH',
    impactPV: dMobile,
    impactPct: (Math.abs(dMobile) / absDPV) * 100,
    evidence: `P- Mobile biến động ${dMobile >= 0 ? '+' : ''}${Math.round(dMobile).toLocaleString()} PV (${((dMobile / (r0.pMobile || 1)) * 100).toFixed(1)}%), chiếm ${((r1.pMobile / (r1.pageviews || 1)) * 100).toFixed(1)}% tổng thị phần.`,
    story: 'Hành vi tiêu thụ tin tức ngày càng dồn trọng tâm vào smartphone. Mọi trải nghiệm tải trang hay quảng cáo che khuất trên mobile đều tác động trực tiếp đến dung lượng traffic.',
    direction: 'Tối ưu tốc độ tải trang di động (AMP/PWA), giảm bớt quảng cáo pop-up cản trở trên mobile, nâng cao trải nghiệm đọc mượt mà.',
  });

  // Sort candidates by impact absolute descending and take top 3
  const topCauses: RankedCauseItem[] = candidates
    .sort((a, b) => Math.abs(b.impactPV) - Math.abs(a.impactPV))
    .slice(0, 3)
    .map((c, idx) => ({
      rank: idx + 1,
      name: c.name,
      type: c.type,
      impactPV: c.impactPV,
      impactPctOfTotalChange: c.impactPct,
      evidence: c.evidence,
      detailStory: c.story,
      actionableDirection: c.direction,
    }));

  // STEP 8: Verification List
  const verificationList: VerificationRequirement[] = [
    {
      id: 'v1',
      area: 'Hành vi độc giả & Trải nghiệm đọc sâu',
      missingData: 'Time-on-page (Thời gian lưu lại trên trang), Bounce Rate (Tỷ lệ thoát), và Scroll Depth (Độ sâu cuộn trang).',
      whyNeeded: 'Để phân biệt bài viết có chất lượng thấp thực sự hay do độc giả đọc nhanh lướt qua; đánh giá xem bài thương mại có bị độc giả thoát ngay hay không.',
      recommendedAction: 'Gắn thẻ đo lường GA4 / Custom Event tracking thời gian đọc thực tế (>15s, >45s) và tỷ lệ cuộn qua 50% nội dung.',
    },
    {
      id: 'v2',
      area: 'Xếp hạng tìm kiếm Google Search Console',
      missingData: 'Dữ liệu Google Search Console chi tiết: Impressions, CTR, Average Ranking theo từng nhóm từ khóa và danh mục.',
      whyNeeded: 'Xác minh nguyên nhân biến động P- Ex-Google đến từ việc rớt thứ hạng từ khóa chính hay do nhu cầu tìm kiếm của xã hội giảm theo mùa.',
      recommendedAction: 'Tích hợp báo cáo API Google Search Console, theo dõi biến động top 100 từ khóa mang lại traffic lớn nhất cho VnExpress.',
    },
    {
      id: 'v3',
      area: 'Dữ liệu chuyên mục con & Phân tích tin tức nóng (Event Spikes)',
      missingData: 'Dữ liệu các chuyên mục con cấp 2-3 và danh sách các bài viết viral đột biến (Tin bão lũ, bầu cử, thể thao lớn).',
      whyNeeded: 'Tránh kết luận sai lệch do tác động của một vài "siêu sự kiện" bất thường trong kỳ đối chiếu kéo lệch toàn bộ bức tranh chung.',
      recommendedAction: 'Thiết lập dashboard theo dõi "Base Traffic" (lưu lượng thường xuyên) tách biệt với "Spike Traffic" (lưu lượng đột biến sự kiện).',
    },
  ];

  return {
    periodT,
    periodT1,
    folderFilter,
    isNormalizedByDays: normalizeByDays,
    validation,
    overview,
    lmdi,
    dimensions: {
      ads,
      sources,
      layers,
      markets,
      platforms,
      articleSources,
      articlePositions,
    },
    crossMatrix,
    topCauses,
    verificationList,
  };
}
