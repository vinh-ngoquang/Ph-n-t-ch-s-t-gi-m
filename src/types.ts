export interface NewsRecord {
  month: string; // "M/YYYY"
  folder_id: string;
  folder: string;
  articles: number;
  articleThuong: number;
  articleThuongMai: number;
  aBuildTop: number;
  aNonBuildTop: number;
  pageviews: number;
  pageviewsNoAds: number; // (-$)
  pageviewsAds: number;   // ($)
  sessions?: number;      // Lượt truy cập / Phiên (Cột Z)
  pExDirect: number;
  pExGoogle: number;
  pExSocial: number;
  pInHome: number;
  pInFolder: number;
  pInDetail: number;
  pInOther: number;
  pListing: number;
  pDetail: number;
  pDO: number;
  pOV: number;
  pUnknown: number;
  pMobile: number;
  pPC: number;
  pApp: number;
  pTablet: number;
}

export interface DimensionComponent {
  id: string;
  name: string;
  baseVal: number;
  targetVal: number;
  delta: number;
  pctGrowth: number;
  contributionPct: number;
  baseShare: number;
  targetShare: number;
  deltaShare: number;
  isMixShiftPositive: boolean;
}

export interface DimensionAnalysis {
  dimensionKey: string;
  dimensionName: string;
  metricType: 'articles' | 'pageviews';
  baseTotal: number;
  targetTotal: number;
  deltaTotal: number;
  pctGrowthTotal: number;
  components: DimensionComponent[];
  validationDiffBase: number;
  validationDiffTarget: number;
  isValid: boolean;
}

export interface QuantityQualityDecomposition {
  articlesBase: number;
  articlesTarget: number;
  articlesDelta: number;
  articlesDeltaPct: number;
  pvPerArticleBase: number;
  pvPerArticleTarget: number;
  pvPerArticleDelta: number;
  pvPerArticleDeltaPct: number;
  pvBase: number;
  pvTarget: number;
  pvDelta: number;
  pvDeltaPct: number;
  volumeEffect: number; // Due to change in article count
  volumeEffectPct: number;
  qualityEffect: number; // Due to change in PV/article
  qualityEffectPct: number;
  primaryDriver: 'VOLUME' | 'QUALITY' | 'BOTH';
}

export interface HypothesisCheck {
  id: string;
  title: string;
  hypothesis: string;
  status: 'SUPPORTED' | 'REJECTED' | 'NOT_APPLICABLE' | 'NEEDS_VERIFY';
  evidence: string;
  metrics: { name: string; value: string }[];
  implication: string;
  verificationNeeded: string;
}

export interface RankedCause {
  rank: number;
  title: string;
  deltaPV: number;
  shareOfTotalLossPct: number;
  evidenceNumbers: string;
  category: string;
}
