export interface NewsRecord {
  month: string; // "M/YYYY"
  site_name?: string; // Tên ấn phẩm: VnExpress, English, Ngoi sao, Tia sáng...
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
  sessions?: number;      // Lượt truy cập / Phiên (Cột Session)
  pExDirect: number;
  pExDirectBrandname?: number; // P- Ex-Direct | Brandname (Chỉ số tham khảo cho P- Ex-Direct)
  pExGoogle: number;
  pExGoogleSearch?: number;   // P- Ex-Google | Search (Cấu phần tham khảo tạo nên P- Ex-Google)
  pExGoogleDiscover?: number; // P- Ex-Google | Discover (Cấu phần tham khảo tạo nên P- Ex-Google)
  pExSocial: number;
  pInHome: number;
  pInFolder: number;
  pInDetail: number;
  pInOther: number;
  pInTagTopic24h?: number;    // P- In-Tag&Topic&24H (Thuộc nguồn nội bộ)
  pListing: number;
  pDetail: number;
  pDO: number;
  pOV: number;
  pUnknown: number;
  pMobile: number;
  pPC: number;
  pApp: number;
  pTablet: number;
  pOtherPlatform?: number;    // P- Other Platform (Thuộc nền tảng thiết bị)
  pNew?: number;              // P- New (Độc giả mới)
  pReturn?: number;           // P- Return (Độc giả quay lại)
  pLover?: number;            // P- Lover (Độc giả thân thiết / trung thành)
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
