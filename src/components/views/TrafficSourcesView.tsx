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
  ReferenceLine,
} from 'recharts';
import { MonthlyDataPoint, analyzeDimensionSeries, analyzeDimensionSeriesYoY, calculateMedian } from '../../utils/timeSeriesAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../../utils/formatters';
import {
  LineChart as LineChartIcon,
  ArrowUpDown,
  Search,
  Compass,
  Info,
  X,
  ChevronRight,
  Sparkles,
  Layers,
  TrendingDown,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { NewsRecord } from '../../types';
import { YoYMonthlySparkline, YoYMonthlyPoint, LongTermPoint } from '../common/YoYMonthlySparkline';

interface Props {
  monthlyData: MonthlyDataPoint[];
  selectedMonth?: string;
  currentScope?: string;
  folderOptions?: { id: string; name: string }[];
  isYoYMode?: boolean;
}

export const TrafficSourcesView: React.FC<Props> = ({
  monthlyData,
  selectedMonth,
  currentScope,
  folderOptions,
  isYoYMode,
}) => {
  const sourcesConfig: {
    key: keyof NewsRecord;
    code: string;
    name: string;
    type: 'Internal' | 'External';
    color: string;
  }[] = [
    { key: 'pInHome', code: 'P- In-Home', name: 'P- In-Home', type: 'Internal', color: '#6366f1' },
    { key: 'pExGoogle', code: 'P- Ex-Google', name: 'P- Ex-Google', type: 'External', color: '#f59e0b' },
    { key: 'pInOther', code: 'P- In-Other', name: 'P- In-Other', type: 'Internal', color: '#94a3b8' },
    { key: 'pInDetail', code: 'P- In-Detail', name: 'P- In-Detail', type: 'Internal', color: '#06b6d4' },
    { key: 'pExDirect', code: 'P- Ex-Direct', name: 'P- Ex-Direct', type: 'External', color: '#10b981' },
    { key: 'pInFolder', code: 'P- In-Folder', name: 'P- In-Folder', type: 'Internal', color: '#ec4899' },
    { key: 'pExSocial', code: 'P- Ex-Social', name: 'P- Ex-Social', type: 'External', color: '#3b82f6' },
    { key: 'pInTagTopic24h', code: 'P- In-Tag&Topic&24H', name: 'P- In-Tag&Topic&24H', type: 'Internal', color: '#8b5cf6' },
  ];

  // Điều kiện hiển thị Search & Discover và Brandname:
  // Xuất hiện khi lọc ở cấp Site / Toàn soạn:
  // 1. Toàn bộ Hệ thống (Tổng tất cả) - ALL_FOLDERS_AGG / ALL / ALL_SYSTEM
  // 2. Toàn bộ VnExpress - ALL_VNE_AGG / VnExpress / Trang Home (1000000)
  // 3. Ngôi sao - 1002835 / Ngoi sao
  // 4. English - 1003888 / English
  // Nếu lọc từng ban/chuyên mục đơn lẻ con (Thời sự, Thế giới...) thì sẽ không hiện Search & Discover và Brandname (do dữ liệu chỉ đo ở cấp site/toàn soạn)
  const isSearchDiscoverAllowed = useMemo(() => {
    if (!currentScope) return true;
    const scope = currentScope.trim();
    const lower = scope.toLowerCase();

    // 1. Toàn bộ Hệ thống (Tổng tất cả)
    if (scope === 'ALL_FOLDERS_AGG' || scope === 'ALL' || scope === 'ALL_SYSTEM' || !scope) return true;

    // 2. Toàn bộ Vnexpress / Site VnExpress / Trang Home VnExpress
    if (scope === 'ALL_VNE_AGG' || lower === 'vnexpress' || scope === '1000000') return true;

    // 3. Ngôi sao
    if (scope === '1002835' || lower === 'ngoi sao' || lower === 'ngôi sao') return true;

    // 4. English
    if (scope === '1003888' || lower === 'english') return true;

    // Check by name in folderOptions or scope string
    const match = folderOptions?.find((f) => f.id === scope || f.name.toLowerCase() === lower);
    const targetName = (match ? match.name : scope).toLowerCase();

    if (
      targetName === 'vnexpress' ||
      targetName.includes('toàn bộ vnexpress') ||
      targetName.includes('tất cả ban vne') ||
      targetName.includes('trang home')
    ) {
      return true;
    }
    if (targetName.includes('ngôi sao') || targetName.includes('ngoi sao')) return true;
    if (targetName.includes('english')) return true;
    if (targetName.includes('toàn bộ hệ thống') || targetName.includes('tổng tất cả') || targetName.includes('tất cả')) {
      return true;
    }

    return false;
  }, [currentScope, folderOptions]);

  // Logic hiển thị Brandname tương tự bóc tách Search & Discover
  const isBrandnameAllowed = isSearchDiscoverAllowed;

  const summary = useMemo(() => {
    if (isYoYMode) {
      return analyzeDimensionSeriesYoY(monthlyData, sourcesConfig, 'pageviews');
    }
    return analyzeDimensionSeries(monthlyData, sourcesConfig, 'pageviews', selectedMonth);
  }, [monthlyData, selectedMonth, isYoYMode]);

  // Google Details: Bóc tách Search & Discover cấu thành nên P- Ex-Google (Dữ liệu tham khảo)
  // Google Details: Bóc tách Search & Discover (Chỉ lấy khi thực sự có dữ liệu ghi nhận, không tự suy diễn tỷ lệ)
  const googleDetails = useMemo(() => {
    if (!isSearchDiscoverAllowed) return null;

    const months2026 = monthlyData.filter((d) => d.year === 2026);
    const months2025 = monthlyData.filter((d) => d.year === 2025);
    const availableMonthNums = new Set(months2026.map((d) => d.monthNum));
    const matched2025 = months2025.filter((d) => availableMonthNums.has(d.monthNum));
    const targetIdx = selectedMonth
      ? months2026.findIndex((d) => d.month === selectedMonth)
      : months2026.length - 1;
    const safeTargetIdx = targetIdx >= 0 ? targetIdx : months2026.length - 1;
    const curPoint = months2026[safeTargetIdx] || months2026[months2026.length - 1];

    if (!curPoint) return null;

    const curGoogleTotal = curPoint.record.pExGoogle || 0;

    // Lọc các tháng thực sự có dữ liệu Search / Discover ghi nhận - TUYỆT ĐỐI KHÔNG TỰ SUY DIỄN TỶ LỆ
    const monthsSource = isYoYMode ? monthlyData : months2026;
    const monthsWithGoogleData = monthsSource.filter((d) => {
      const s = d.record.pExGoogleSearch;
      const disc = d.record.pExGoogleDiscover;
      return (s !== undefined && s !== null && s > 0) || (disc !== undefined && disc !== null && disc > 0);
    });

    const isFromSheet = monthsWithGoogleData.length > 0;

    // Chuỗi số liệu thực tế
    const searchSeries = monthsWithGoogleData
      .map((d) => d.record.pExGoogleSearch)
      .filter((v): v is number => v !== undefined && v !== null && v > 0);
    const discoverSeries = monthsWithGoogleData
      .map((d) => d.record.pExGoogleDiscover)
      .filter((v): v is number => v !== undefined && v !== null && v > 0);

    const medSearch = searchSeries.length > 0 ? calculateMedian(searchSeries) : 0;
    const medDiscover = discoverSeries.length > 0 ? calculateMedian(discoverSeries) : 0;

    const hasCurSearch = curPoint.record.pExGoogleSearch !== undefined && curPoint.record.pExGoogleSearch !== null && curPoint.record.pExGoogleSearch > 0;
    const hasCurDiscover = curPoint.record.pExGoogleDiscover !== undefined && curPoint.record.pExGoogleDiscover !== null && curPoint.record.pExGoogleDiscover > 0;

    let curSearch = 0;
    let curDiscover = 0;
    let deltaSearch: number | null = null;
    let deltaDiscover: number | null = null;
    let pctSearch: number | null = null;
    let pctDiscover: number | null = null;

    if (isYoYMode) {
      let sumSearch26 = 0;
      let sumDiscover26 = 0;
      let sumSearch25 = 0;
      let sumDiscover25 = 0;
      let has26Search = false;
      let has26Discover = false;

      months2026.forEach((d) => {
        if (d.record.pExGoogleSearch && d.record.pExGoogleSearch > 0) {
          sumSearch26 += d.record.pExGoogleSearch;
          has26Search = true;
        }
        if (d.record.pExGoogleDiscover && d.record.pExGoogleDiscover > 0) {
          sumDiscover26 += d.record.pExGoogleDiscover;
          has26Discover = true;
        }
      });

      matched2025.forEach((d) => {
        if (d.record.pExGoogleSearch && d.record.pExGoogleSearch > 0) {
          sumSearch25 += d.record.pExGoogleSearch;
        }
        if (d.record.pExGoogleDiscover && d.record.pExGoogleDiscover > 0) {
          sumDiscover25 += d.record.pExGoogleDiscover;
        }
      });

      curSearch = sumSearch26;
      curDiscover = sumDiscover26;
      if (has26Search && sumSearch25 > 0) {
        deltaSearch = curSearch - sumSearch25;
        pctSearch = (deltaSearch / sumSearch25) * 100;
      }
      if (has26Discover && sumDiscover25 > 0) {
        deltaDiscover = curDiscover - sumDiscover25;
        pctDiscover = (deltaDiscover / sumDiscover25) * 100;
      }
    } else {
      curSearch = hasCurSearch ? (curPoint.record.pExGoogleSearch as number) : 0;
      curDiscover = hasCurDiscover ? (curPoint.record.pExGoogleDiscover as number) : 0;

      if (hasCurSearch && medSearch > 0) {
        deltaSearch = curSearch - medSearch;
        pctSearch = (deltaSearch / medSearch) * 100;
      }
      if (hasCurDiscover && medDiscover > 0) {
        deltaDiscover = curDiscover - medDiscover;
        pctDiscover = (deltaDiscover / medDiscover) * 100;
      }
    }

    const curMonthLabel = isYoYMode ? 'Tổng 2026' : (curPoint?.shortLabel || '');

    const trendSearchDiscover = monthsWithGoogleData.map((d) => {
      const sVal = Number(d.record.pExGoogleSearch) || 0;
      const dVal = Number(d.record.pExGoogleDiscover) || 0;
      return {
        month: isYoYMode ? d.label : d.shortLabel,
        rawMonth: d.month,
        search: Number((sVal / 1_000_000).toFixed(2)),
        discover: Number((dVal / 1_000_000).toFixed(2)),
        searchRaw: sVal,
        discoverRaw: dVal,
      };
    });

    const earliestDataMonth = monthsWithGoogleData.length > 0 ? (isYoYMode ? monthsWithGoogleData[0].label : monthsWithGoogleData[0].shortLabel) : 'T1';
    const latestDataMonth = monthsWithGoogleData.length > 0 ? (isYoYMode ? monthsWithGoogleData[monthsWithGoogleData.length - 1].label : monthsWithGoogleData[monthsWithGoogleData.length - 1].shortLabel) : 'T8';

    return {
      isFromSheet,
      hasCurSearch,
      hasCurDiscover,
      curMonthLabel,
      curGoogleTotal,
      curSearch,
      curDiscover,
      medSearch,
      medDiscover,
      deltaSearch,
      deltaDiscover,
      pctSearch,
      pctDiscover,
      trendSearchDiscover,
      earliestDataMonth,
      latestDataMonth,
      countRecordedMonths: monthsWithGoogleData.length,
    };
  }, [monthlyData, selectedMonth, isYoYMode, isSearchDiscoverAllowed]);

  // Direct Details: Bóc tách Brandname (Dữ liệu tham khảo mức độ tìm kiếm chủ động thương hiệu VnExpress, từ T3/2026)
  const directDetails = useMemo(() => {
    if (!isBrandnameAllowed) return null;

    const months2026 = monthlyData.filter((d) => d.year === 2026);
    const targetIdx = selectedMonth
      ? months2026.findIndex((d) => d.month === selectedMonth)
      : months2026.length - 1;
    const curPoint = targetIdx >= 0 ? months2026[targetIdx] : months2026[months2026.length - 1];

    if (!curPoint) return null;

    const curDirectTotal = curPoint.record.pExDirect || 0;

    // Lọc các tháng thực sự có dữ liệu Brandname - TUYỆT ĐỐI KHÔNG BỊA SỐ
    const monthsSource = isYoYMode ? monthlyData : months2026;
    const monthsWithBrandname = monthsSource.filter((d) => {
      const v = d.record.pExDirectBrandname;
      return v !== undefined && v !== null && v > 0;
    });

    const isFromSheet = monthsWithBrandname.length > 0;

    // Chuỗi giá trị thực tế của Brandname chỉ lấy từ các tháng có dữ liệu
    const brandnameSeries = monthsWithBrandname.map((d) => d.record.pExDirectBrandname as number);
    const directSeries = (isYoYMode ? monthlyData : months2026).map((d) => d.record.pExDirect || 0);

    // Mốc chuẩn trung vị Brandname tính trên các tháng có số liệu thực tế
    const medBrandname = brandnameSeries.length > 0 ? calculateMedian(brandnameSeries) : 0;
    const medDirect = calculateMedian(directSeries);

    // Tháng hiện tại được chọn: Kiểm tra xem tháng này có dữ liệu Brandname hay chưa
    const curBrandnameRaw = curPoint.record.pExDirectBrandname;
    const hasCurBrandname = curBrandnameRaw !== undefined && curBrandnameRaw !== null && curBrandnameRaw > 0;
    const curBrandname = hasCurBrandname ? curBrandnameRaw : 0;

    const deltaBrandname = hasCurBrandname ? curBrandname - medBrandname : null;
    const pctBrandname = (hasCurBrandname && medBrandname > 0 && deltaBrandname !== null)
      ? (deltaBrandname / medBrandname) * 100
      : null;

    const deltaDirect = curDirectTotal - medDirect;
    const pctDirect = medDirect > 0 ? (deltaDirect / medDirect) * 100 : 0;

    const curMonthLabel = isYoYMode ? 'Tổng 2026' : (curPoint?.shortLabel || '');

    // Biểu đồ xu hướng: CHỈ thể hiện các tháng thực sự có dữ liệu ghi nhận
    const trendDirectBrandname = monthsWithBrandname.map((d) => {
      const bVal = d.record.pExDirectBrandname as number;

      return {
        month: isYoYMode ? d.label : d.shortLabel,
        rawMonth: d.month,
        brandname: Number((bVal / 1_000_000).toFixed(2)),
        brandnameRaw: bVal,
      };
    });

    const earliestDataMonth = monthsWithBrandname.length > 0 ? (isYoYMode ? monthsWithBrandname[0].label : monthsWithBrandname[0].shortLabel) : 'T3';
    const latestDataMonth = monthsWithBrandname.length > 0 ? (isYoYMode ? monthsWithBrandname[monthsWithBrandname.length - 1].label : monthsWithBrandname[monthsWithBrandname.length - 1].shortLabel) : 'T8';

    return {
      isFromSheet,
      hasCurBrandname,
      curMonthLabel,
      curDirectTotal,
      curBrandname,
      medBrandname,
      medDirect,
      deltaBrandname,
      pctBrandname,
      deltaDirect,
      pctDirect,
      trendDirectBrandname,
      earliestDataMonth,
      latestDataMonth,
      countRecordedMonths: monthsWithBrandname.length,
    };
  }, [monthlyData, selectedMonth, isBrandnameAllowed, isYoYMode]);

  // States
  const [showChart, setShowChart] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'drop' | 'internal' | 'external'>('all');
  const [sortBy, setSortBy] = useState<'deficit' | 'share' | 'volume' | 'growth'>('deficit');
  const [selectedKey, setSelectedKey] = useState<string>('pInHome');

  // Total metrics
  const totalT8 = summary.totalT8;
  const totalMed = summary.totalMedian;
  const totalDeltaMed = totalT8 - totalMed;

  // Process rows with internal/external classification
  const processedRows = useMemo(() => {
    return summary.rows.map((row) => {
      const cfg = sourcesConfig.find((s) => s.key === row.key);
      const isInternal = cfg?.type === 'Internal';
      return {
        ...row,
        code: cfg?.code || row.key,
        type: cfg?.type || 'Internal',
        color: cfg?.color || '#64748b',
        isInternal,
      };
    });
  }, [summary.rows]);

  // Deepest drop
  const dropsOnly = processedRows.filter((r) => r.deltaMedian < 0);
  const deepestDrop = dropsOnly.length > 0
    ? [...dropsOnly].sort((a, b) => a.deltaMedian - b.deltaMedian)[0]
    : null;

  // Best growth
  const gainsOnly = processedRows.filter((r) => r.deltaMedian >= 0);
  const bestGain = gainsOnly.length > 0
    ? [...gainsOnly].sort((a, b) => b.deltaMedian - a.deltaMedian)[0]
    : null;

  // External vs Internal balance
  const internalRows = processedRows.filter((r) => r.isInternal);
  const externalRows = processedRows.filter((r) => !r.isInternal);

  const internalT8 = internalRows.reduce((sum, r) => sum + r.t8, 0);
  const internalMed = internalRows.reduce((sum, r) => sum + r.median, 0);
  const internalDelta = internalT8 - internalMed;
  const internalPct = internalMed > 0 ? (internalDelta / internalMed) * 100 : 0;

  const externalT8 = externalRows.reduce((sum, r) => sum + r.t8, 0);
  const externalMed = externalRows.reduce((sum, r) => sum + r.median, 0);
  const externalDelta = externalT8 - externalMed;
  const externalPct = externalMed > 0 ? (externalDelta / externalMed) * 100 : 0;

  // Share % of total
  const internalShare = totalT8 > 0 ? (internalT8 / totalT8) * 100 : 0;
  const externalShare = totalT8 > 0 ? (externalT8 / totalT8) * 100 : 0;

  // Max absolute delta for relative bar scaling
  const maxAbsDeficit = Math.max(...processedRows.map((r) => Math.abs(r.deltaMedian)), 1);

  // Filter & Sort
  const displayedRows = useMemo(() => {
    let list = [...processedRows];
    if (filterType === 'drop') {
      list = list.filter((r) => r.deltaMedian < 0);
    } else if (filterType === 'internal') {
      list = list.filter((r) => r.isInternal);
    } else if (filterType === 'external') {
      list = list.filter((r) => !r.isInternal);
    }

    if (sortBy === 'deficit') {
      list.sort((a, b) => a.deltaMedian - b.deltaMedian);
    } else if (sortBy === 'share') {
      list.sort((a, b) => b.shareT8 - a.shareT8);
    } else if (sortBy === 'volume') {
      list.sort((a, b) => b.t8 - a.t8);
    } else if (sortBy === 'growth') {
      list.sort((a, b) => b.pctChangeMedian - a.pctChangeMedian);
    }
    return list;
  }, [processedRows, filterType, sortBy]);

  // Chart data
  const chartData = useMemo(() => {
    return summary.trendSeries.map((item) => {
      const pt: any = {
        month: isYoYMode ? (item.label || item.shortLabel) : item.shortLabel,
      };
      sourcesConfig.forEach((src) => {
        pt[src.code] = Number(((item[src.key] || 0) / 1_000_000).toFixed(2));
      });
      return pt;
    });
  }, [summary.trendSeries, isYoYMode]);

  // Helper YoY monthly series for Sparklines
  const months2026 = useMemo(() => monthlyData.filter((d) => d.year === 2026), [monthlyData]);
  const months2025 = useMemo(() => monthlyData.filter((d) => d.year === 2025), [monthlyData]);
  const availableMonthNums = useMemo(() => {
    return Array.from(new Set(months2026.map((d) => d.monthNum))).sort((a, b) => a - b);
  }, [months2026]);

  const getYoYSeries = (key: string): YoYMonthlyPoint[] => {
    return availableMonthNums.map((mNum) => {
      const d26 = months2026.find((d) => d.monthNum === mNum);
      const d25 = months2025.find((d) => d.monthNum === mNum);
      return {
        monthNum: mNum,
        monthLabel: `T${mNum}`,
        val2026: Number(d26?.record[key as keyof NewsRecord]) || 0,
        val2025: Number(d25?.record[key as keyof NewsRecord]) || 0,
      };
    });
  };

  const getGoogleSearchSeries = (): YoYMonthlyPoint[] => {
    return availableMonthNums.map((mNum) => {
      const d26 = months2026.find((d) => d.monthNum === mNum);
      const d25 = months2025.find((d) => d.monthNum === mNum);
      const v26 = Number(d26?.record.pExGoogleSearch) || 0;
      const v25 = Number(d25?.record.pExGoogleSearch) || 0;
      return { monthNum: mNum, monthLabel: `T${mNum}`, val2026: v26, val2025: v25 };
    });
  };

  const getGoogleDiscoverSeries = (): YoYMonthlyPoint[] => {
    return availableMonthNums.map((mNum) => {
      const d26 = months2026.find((d) => d.monthNum === mNum);
      const d25 = months2025.find((d) => d.monthNum === mNum);
      const v26 = Number(d26?.record.pExGoogleDiscover) || 0;
      const v25 = Number(d25?.record.pExGoogleDiscover) || 0;
      return { monthNum: mNum, monthLabel: `T${mNum}`, val2026: v26, val2025: v25 };
    });
  };

  const getDirectBrandnameSeries = (): YoYMonthlyPoint[] => {
    return availableMonthNums.map((mNum) => {
      const d26 = months2026.find((d) => d.monthNum === mNum);
      const d25 = months2025.find((d) => d.monthNum === mNum);
      return {
        monthNum: mNum,
        monthLabel: `T${mNum}`,
        val2026: Number(d26?.record.pExDirectBrandname) || 0,
        val2025: Number(d25?.record.pExDirectBrandname) || 0,
      };
    });
  };

  const getInternalSeries = (): YoYMonthlyPoint[] => {
    return availableMonthNums.map((mNum) => {
      const d26 = months2026.find((d) => d.monthNum === mNum);
      const d25 = months2025.find((d) => d.monthNum === mNum);
      const v26 = (d26?.record.pInHome || 0) + (d26?.record.pInFolder || 0) + (d26?.record.pInDetail || 0) + (d26?.record.pInOther || 0) + (d26?.record.pInTagTopic24h || 0);
      const v25 = (d25?.record.pInHome || 0) + (d25?.record.pInFolder || 0) + (d25?.record.pInDetail || 0) + (d25?.record.pInOther || 0) + (d25?.record.pInTagTopic24h || 0);
      return { monthNum: mNum, monthLabel: `T${mNum}`, val2026: v26, val2025: v25 };
    });
  };

  const getExternalSeries = (): YoYMonthlyPoint[] => {
    return availableMonthNums.map((mNum) => {
      const d26 = months2026.find((d) => d.monthNum === mNum);
      const d25 = months2025.find((d) => d.monthNum === mNum);
      const v26 = (d26?.record.pExGoogle || 0) + (d26?.record.pExDirect || 0) + (d26?.record.pExSocial || 0);
      const v25 = (d25?.record.pExGoogle || 0) + (d25?.record.pExDirect || 0) + (d25?.record.pExSocial || 0);
      return { monthNum: mNum, monthLabel: `T${mNum}`, val2026: v26, val2025: v25 };
    });
  };

  const getTotalSeries = (): YoYMonthlyPoint[] => {
    return availableMonthNums.map((mNum) => {
      const d26 = months2026.find((d) => d.monthNum === mNum);
      const d25 = months2025.find((d) => d.monthNum === mNum);
      return {
        monthNum: mNum,
        monthLabel: `T${mNum}`,
        val2026: Number(d26?.record.pageviews) || 0,
        val2025: Number(d25?.record.pageviews) || 0,
      };
    });
  };

  const [sparkMode, setSparkMode] = useState<'yoy' | 'longterm'>('yoy');

  // Long-term continuous 2025 -> 2026 series
  const getLongTermSeries = (key: string): LongTermPoint[] => {
    return monthlyData.map((d) => ({
      month: d.month,
      monthLabel: d.label,
      year: d.year,
      val: Number(d.record[key as keyof NewsRecord]) || 0,
    }));
  };

  const getGoogleSearchLongTermSeries = (): LongTermPoint[] => {
    return monthlyData.map((d) => ({
      month: d.month,
      monthLabel: d.label,
      year: d.year,
      val: Number(d.record.pExGoogleSearch) || 0,
    }));
  };

  const getGoogleDiscoverLongTermSeries = (): LongTermPoint[] => {
    return monthlyData.map((d) => ({
      month: d.month,
      monthLabel: d.label,
      year: d.year,
      val: Number(d.record.pExGoogleDiscover) || 0,
    }));
  };

  const getDirectBrandnameLongTermSeries = (): LongTermPoint[] => {
    return monthlyData.map((d) => ({
      month: d.month,
      monthLabel: d.label,
      year: d.year,
      val: Number(d.record.pExDirectBrandname) || 0,
    }));
  };

  const getInternalLongTermSeries = (): LongTermPoint[] => {
    return monthlyData.map((d) => {
      const v = (d.record.pInHome || 0) + (d.record.pInFolder || 0) + (d.record.pInDetail || 0) + (d.record.pInOther || 0) + (d.record.pInTagTopic24h || 0);
      return { month: d.month, monthLabel: d.label, year: d.year, val: v };
    });
  };

  const getExternalLongTermSeries = (): LongTermPoint[] => {
    return monthlyData.map((d) => {
      const v = (d.record.pExGoogle || 0) + (d.record.pExDirect || 0) + (d.record.pExSocial || 0);
      return { month: d.month, monthLabel: d.label, year: d.year, val: v };
    });
  };

  const getTotalLongTermSeries = (): LongTermPoint[] => {
    return monthlyData.map((d) => ({
      month: d.month,
      monthLabel: d.label,
      year: d.year,
      val: Number(d.record.pageviews) || 0,
    }));
  };

  const dropSharePct = (deepestDrop && totalDeltaMed < 0)
    ? Math.round((deepestDrop.deltaMedian / totalDeltaMed) * 100)
    : 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      {/* 1. Header Bar with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {isYoYMode
                ? 'Động thái & Nguồn Sụt giảm Pageview (Tổng 2026 vs Cùng kỳ 2025)'
                : 'Động thái & Nguồn Sụt giảm Pageview theo Tháng'}
            </h2>
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

      {/* Filter & Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
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
            Tất cả ({processedRows.length})
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
            onClick={() => setFilterType('internal')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
              filterType === 'internal'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nội bộ (P- In-*)
          </button>
          {/* External */}
          <button
            onClick={() => setFilterType('external')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
              filterType === 'external'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nguồn ngoài (P- Ex-*)
          </button>

          {/* Google Search & Discover quick tab - CHỈ HIỆN Ở 4 PHẠM VI HỖ TRỢ */}
          {isSearchDiscoverAllowed && (
            <button
              onClick={() => {
                setSelectedKey('pExGoogle');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                selectedKey === 'pExGoogle'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                  : 'text-amber-800 hover:bg-amber-50 hover:text-amber-900'
              }`}
              title="Bấm để xem dữ liệu tham khảo Search & Discover"
            >
              <Search className="w-3 h-3 text-amber-600" />
              <span>P- Ex-Google</span>
              <span className="text-[9px] px-1 py-0.2 bg-amber-200/80 rounded text-amber-900 font-bold">Tham khảo</span>
            </button>
          )}

          {/* Direct Brandname quick tab - CHỈ HIỆN Ở 4 PHẠM VI HỖ TRỢ */}
          {isBrandnameAllowed && directDetails && (
            <button
              onClick={() => {
                setSelectedKey('pExDirect');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                selectedKey === 'pExDirect'
                  ? 'bg-blue-100 text-blue-900 border border-blue-300 shadow-xs'
                  : 'text-blue-800 hover:bg-blue-50 hover:text-blue-900'
              }`}
              title="Bấm để xem dữ liệu tham khảo Brandname cho P- Ex-Direct"
            >
              <Compass className="w-3 h-3 text-blue-600" />
              <span>P- Ex-Direct</span>
              <span className="text-[9px] px-1 py-0.2 bg-blue-200/80 rounded text-blue-900 font-bold">Brandname</span>
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1 text-slate-500 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
          <span className="text-[11px] whitespace-nowrap">Xếp theo:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="deficit">
              {isYoYMode ? 'Giảm sâu nhất (Tuyệt đối)' : 'Giảm sâu nhất vs Trung vị (Mặc định)'}
            </option>
            <option value="share">Tỷ trọng cao nhất</option>
            <option value="volume">Lượng Pageview cao nhất</option>
            <option value="growth">Tăng trưởng tốt nhất</option>
          </select>
        </div>
      </div>

      {/* 3. Collapsible Trend Line Chart */}
      {showChart && (
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 transition-all">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-800">
              {isYoYMode
                ? 'Đường xu hướng các nguồn truy cập từ 2025 đến 2026 (Triệu PV)'
                : 'Đường xu hướng các nguồn truy cập qua các tháng (Triệu PV)'}
            </span>
            <span className="text-slate-500 text-[11px]">Đơn vị: Triệu Pageviews</span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                {sourcesConfig.map((src) => (
                  <Line
                    key={src.code}
                    type="monotone"
                    dataKey={src.code}
                    stroke={src.color}
                    strokeWidth={src.key === selectedKey ? 3.5 : 2}
                    dot={{ r: 3, fill: src.color }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Main Clean Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/90">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-sans">Kênh Nguồn (Channel)</th>
              <th className="py-3 px-4 text-right font-sans">
                {isYoYMode ? 'Tỷ Trọng Tổng 2026' : 'Tỷ Trọng Tháng Này'}
              </th>
              <th className="py-3 px-4 text-right font-sans">
                {isYoYMode
                  ? 'Tổng 2026'
                  : (selectedMonth ? `Tháng ${selectedMonth}` : 'Tháng Này (Tháng 8)')}
              </th>
              <th className="py-3 px-4 text-right font-sans">
                {isYoYMode ? 'Cùng Kỳ 2025' : 'Mốc Trung Vị (2026)'}
              </th>
              <th className="py-3 px-4 text-right font-sans min-w-[190px]">
                {isYoYMode ? 'Lệch vs. Cùng Kỳ' : 'Lệch vs. Trung Vị'}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedRows.map((row) => {
              const isSelected = selectedKey === row.key;
              const isDrop = row.deltaMedian < 0;
              const barWidthPct = Math.min(100, Math.max(8, (Math.abs(row.deltaMedian) / maxAbsDeficit) * 100));

              return (
                <React.Fragment key={row.key}>
                  <tr
                    onClick={() => setSelectedKey(row.key as string)}
                    className={`cursor-pointer transition hover:bg-slate-50/70 ${
                      isSelected
                        ? row.key === 'pExGoogle' && isSearchDiscoverAllowed
                          ? 'bg-amber-50/50 border-l-4 border-l-amber-500'
                          : 'bg-blue-50/40 border-l-4 border-l-blue-600'
                        : ''
                    }`}
                  >
                    {/* Channel with Badge */}
                    <td className="py-3.5 px-4 font-sans font-medium text-slate-900">
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <span className="font-semibold text-slate-900">{row.code}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200/70">
                          {row.type}
                        </span>
                        {isSelected && (
                          <span
                            className={`text-[11px] font-semibold ${
                              row.key === 'pExGoogle' && isSearchDiscoverAllowed
                                ? 'text-amber-700'
                                : 'text-blue-600'
                            }`}
                          >
                            Đang chọn
                          </span>
                        )}

                        {/* Special Google Badge / Action - CHỈ HIỆN Ở 4 PHẠM VI ĐƯỢC PHÉP */}
                        {row.key === 'pExGoogle' && isSearchDiscoverAllowed && (
                          <div className="ml-auto">
                            {isSelected ? (
                              <span className="inline-block text-[10px] font-bold text-amber-900 bg-amber-200/80 border border-amber-400/80 rounded px-2 py-0.5">
                                Search & Discover
                              </span>
                            ) : (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedKey('pExGoogle');
                                }}
                                className="inline-block text-[10px] font-semibold text-amber-800 bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300 rounded px-2 py-0.5 transition cursor-pointer"
                                title="Bấm để xem Search & Discover"
                              >
                                Search & Discover ↗
                              </span>
                            )}
                          </div>
                        )}

                        {/* Special Direct Brandname Badge / Action - CHỈ HIỆN Ở 4 PHẠM VI ĐƯỢC PHÉP */}
                        {row.key === 'pExDirect' && isBrandnameAllowed && directDetails && (
                          <div className="ml-auto">
                            {isSelected ? (
                              <span className="inline-block text-[10px] font-bold text-blue-900 bg-blue-200/80 border border-blue-400/80 rounded px-2 py-0.5">
                                Brandname
                              </span>
                            ) : (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedKey('pExDirect');
                                }}
                                className="inline-block text-[10px] font-semibold text-blue-800 bg-blue-100/80 hover:bg-blue-200/80 border border-blue-300 rounded px-2 py-0.5 transition cursor-pointer"
                                title="Bấm để xem Brandname"
                              >
                                Brandname ↗
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Share % */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-slate-900">{formatPercent(row.shareT8, false)}</div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        Chuẩn: {formatPercent(row.shareMedian, false)}
                      </div>
                    </td>

                    {/* Month 8 Value */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-slate-900">{formatNumber(row.t8)}</div>
                    </td>

                    {/* Median Benchmark */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-semibold text-slate-700">{formatNumber(row.median)}</div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {isYoYMode ? 'Cùng kỳ 2025' : 'Chuẩn 2026'}
                      </div>
                    </td>

                    {/* Deviation vs Median + Sleek Progress Bar */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className={`font-bold ${isDrop ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatDelta(row.deltaMedian)} ({formatPercent(row.pctChangeMedian)})
                      </div>

                      {/* Deficit Bar indicator underneath number */}
                      <div className="w-full max-w-[170px] h-1.5 bg-slate-100 rounded-full overflow-hidden relative mt-1.5 ml-auto flex justify-end">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isDrop ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${barWidthPct}%` }}
                        />
                      </div>
                    </td>

                    {/* YoY Sparkline Column */}
                    {isYoYMode && (
                      <td className="py-3.5 px-3 text-center align-middle">
                        <YoYMonthlySparkline
                          data={getYoYSeries(row.key as string)}
                          longTermData={getLongTermSeries(row.key as string)}
                          mode={sparkMode}
                        />
                      </td>
                    )}
                  </tr>

                  {/* SUB-ROWS FOR P- Ex-Google: CHỈ XUẤT HIỆN KHI CHỌN NGUỒN P- Ex-Google VÀ Ở 4 PHẠM VI HỖ TRỢ */}
                  {row.key === 'pExGoogle' && isSelected && isSearchDiscoverAllowed && googleDetails && (
                    <>
                      {/* Sub-row 1: Google Search */}
                      <tr className="bg-amber-50/70 border-l-4 border-l-amber-500 hover:bg-amber-50 transition font-sans">
                        <td className="py-2.5 px-4 pl-10 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-600 font-bold text-xs">↳</span>
                            <span className="font-bold text-amber-950">P- Ex-Google | Search</span>
                            <span className="text-[11px] text-slate-500 hidden sm:inline">(Tìm kiếm tự nhiên)</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-400 text-xs">
                          —
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          {googleDetails.hasCurSearch || (isYoYMode && googleDetails.curSearch > 0) ? (
                            <div className="font-bold text-slate-900">{formatNumber(googleDetails.curSearch)}</div>
                          ) : (
                            <div className="text-xs text-slate-500 font-sans italic">
                              Chưa ghi nhận
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          <div className="font-semibold text-slate-700">{formatNumber(googleDetails.medSearch)}</div>
                          <div className="text-[10px] text-slate-400 font-sans">
                            {isYoYMode ? 'Cùng kỳ 2025' : 'Chuẩn 2026'}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          {googleDetails.deltaSearch !== null && googleDetails.pctSearch !== null ? (
                            <div className={`font-bold ${googleDetails.deltaSearch >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatDelta(googleDetails.deltaSearch)} ({formatPercent(googleDetails.pctSearch)})
                            </div>
                          ) : (
                            <div className="text-slate-400 font-sans text-xs">—</div>
                          )}
                        </td>
                        {isYoYMode && (
                          <td className="py-2.5 px-3 text-center align-middle">
                            <YoYMonthlySparkline
                              data={getGoogleSearchSeries()}
                              longTermData={getGoogleSearchLongTermSeries()}
                              mode={sparkMode}
                            />
                          </td>
                        )}
                      </tr>

                      {/* Sub-row 2: Google Discover */}
                      <tr className="bg-sky-50/70 border-l-4 border-l-sky-500 hover:bg-sky-50 transition font-sans">
                        <td className="py-2.5 px-4 pl-10 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="text-sky-600 font-bold text-xs">↳</span>
                            <span className="font-bold text-sky-950">P- Ex-Google | Discover</span>
                            <span className="text-[11px] text-slate-500 hidden sm:inline">(Gợi ý khám phá di động)</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-400 text-xs">
                          —
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          {googleDetails.hasCurDiscover || (isYoYMode && googleDetails.curDiscover > 0) ? (
                            <div className="font-bold text-slate-900">{formatNumber(googleDetails.curDiscover)}</div>
                          ) : (
                            <div className="text-xs text-slate-500 font-sans italic">
                              Chưa ghi nhận
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          <div className="font-semibold text-slate-700">{formatNumber(googleDetails.medDiscover)}</div>
                          <div className="text-[10px] text-slate-400 font-sans">
                            {isYoYMode ? 'Cùng kỳ 2025' : 'Chuẩn 2026'}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          {googleDetails.deltaDiscover !== null && googleDetails.pctDiscover !== null ? (
                            <div className={`font-bold ${googleDetails.deltaDiscover >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatDelta(googleDetails.deltaDiscover)} ({formatPercent(googleDetails.pctDiscover)})
                            </div>
                          ) : (
                            <div className="text-slate-400 font-sans text-xs">—</div>
                          )}
                        </td>
                        {isYoYMode && (
                          <td className="py-2.5 px-3 text-center align-middle">
                            <YoYMonthlySparkline
                              data={getGoogleDiscoverSeries()}
                              longTermData={getGoogleDiscoverLongTermSeries()}
                              mode={sparkMode}
                            />
                          </td>
                        )}
                      </tr>

                      {/* Info helper row */}
                      <tr className="bg-amber-50/40 text-[11px] text-amber-900 border-b border-amber-200/60 font-sans">
                        <td colSpan={isYoYMode ? 6 : 5} className="py-2 px-4 pl-10">
                          <span>
                            Search và Discover là các nguồn đo lường độc lập, không phải tập con của P- Ex-Google và không cộng dồn vào tổng nguồn.
                          </span>
                        </td>
                      </tr>
                    </>
                  )}

                  {/* SUB-ROWS FOR P- Ex-Direct: DỮ LIỆU THAM KHẢO BRANDNAME - CHỈ HIỆN KHI Ở 4 PHẠM VI HỖ TRỢ */}
                  {row.key === 'pExDirect' && isSelected && isBrandnameAllowed && directDetails && (
                    <>
                      {/* Sub-row 1: Brandname */}
                      <tr className="bg-blue-50/70 border-l-4 border-l-blue-600 hover:bg-blue-50 transition font-sans">
                        <td className="py-2.5 px-4 pl-10 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 font-bold text-xs">↳</span>
                            <span className="font-bold text-blue-950">P- Ex-Direct | Brandname</span>
                            <span className="text-[11px] text-slate-500 hidden sm:inline">
                              (Mức độ tìm kiếm thương hiệu VnExpress)
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-400 text-xs">
                          —
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          {directDetails.hasCurBrandname ? (
                            <div className="font-bold text-slate-900">{formatNumber(directDetails.curBrandname)}</div>
                          ) : (
                            <div className="text-xs text-slate-500 font-sans italic">
                              Chưa ghi nhận
                              <span className="text-[10px] text-slate-400 block font-normal">(Có từ T3/2026)</span>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          <div className="font-semibold text-slate-700">{formatNumber(directDetails.medBrandname)}</div>
                          <div className="text-[10px] text-slate-400 font-sans" title="Mốc chuẩn so sánh">
                            {isYoYMode ? 'Cùng kỳ 2025' : 'Chuẩn 2026 (từ T3)'}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono">
                          {directDetails.hasCurBrandname && directDetails.deltaBrandname !== null && directDetails.pctBrandname !== null ? (
                            <div
                              className={`font-bold ${
                                directDetails.deltaBrandname >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {formatDelta(directDetails.deltaBrandname)} ({formatPercent(directDetails.pctBrandname)})
                            </div>
                          ) : (
                            <div className="text-slate-400 font-sans text-xs">—</div>
                          )}
                        </td>
                        {isYoYMode && (
                          <td className="py-2.5 px-3 text-center align-middle">
                            <YoYMonthlySparkline
                              data={getDirectBrandnameSeries()}
                              longTermData={getDirectBrandnameLongTermSeries()}
                              mode={sparkMode}
                            />
                          </td>
                        )}
                      </tr>

                      {/* Info helper row */}
                      <tr className="bg-blue-50/40 text-[11px] text-blue-900 border-b border-blue-200/60 font-sans">
                        <td colSpan={isYoYMode ? 6 : 5} className="py-2 px-4 pl-10">
                          <span>
                            Chỉ số Brandname thể hiện mức độ tìm kiếm thương hiệu VnExpress (ghi nhận từ Tháng 3/2026), không phải tập con của P- Ex-Direct và không cộng dồn vào tổng nguồn.
                          </span>
                        </td>
                      </tr>
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Table Total Summary Footer */}
          <tfoot className="font-sans border-t-2 border-slate-300 divide-y divide-slate-200">
            {/* 1. TỔNG NGUỒN NỘI BỘ (INTERNAL) */}
            <tr className="bg-slate-50/80 hover:bg-slate-50 transition text-slate-800">
              <td className="py-2.5 px-4 font-semibold text-xs">
                <span className="font-bold text-slate-900 uppercase tracking-tight">
                  TỔNG NGUỒN NỘI BỘ (INTERNAL)
                </span>
              </td>
              <td className="py-2.5 px-4 text-right font-mono font-bold text-xs text-indigo-900">
                {formatPercent(internalShare, false)}
              </td>
              <td className="py-2.5 px-4 text-right font-mono">
                <div className="font-bold text-xs text-slate-900">{formatNumber(internalT8)}</div>
              </td>
              <td className="py-2.5 px-4 text-right font-mono">
                <div className="font-semibold text-xs text-slate-700">{formatNumber(internalMed)}</div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {isYoYMode ? 'Cùng kỳ 2025' : 'Chuẩn 2026'}
                </div>
              </td>
              <td className="py-2.5 px-4 text-right font-mono">
                <div
                  className={`font-bold text-xs ${
                    internalDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {formatDelta(internalDelta)} ({formatPercent(internalPct)})
                </div>
              </td>
              {isYoYMode && (
                <td className="py-2.5 px-3 text-center align-middle">
                  <YoYMonthlySparkline
                    data={getInternalSeries()}
                    longTermData={getInternalLongTermSeries()}
                    mode={sparkMode}
                  />
                </td>
              )}
            </tr>

            {/* 2. TỔNG NGUỒN NGOÀI (EXTERNAL) */}
            <tr className="bg-slate-50/80 hover:bg-slate-50 transition text-slate-800">
              <td className="py-2.5 px-4 font-semibold text-xs">
                <span className="font-bold text-slate-900 uppercase tracking-tight">
                  TỔNG NGUỒN NGOÀI (EXTERNAL)
                </span>
              </td>
              <td className="py-2.5 px-4 text-right font-mono font-bold text-xs text-amber-900">
                {formatPercent(externalShare, false)}
              </td>
              <td className="py-2.5 px-4 text-right font-mono">
                <div className="font-bold text-xs text-slate-900">{formatNumber(externalT8)}</div>
              </td>
              <td className="py-2.5 px-4 text-right font-mono">
                <div className="font-semibold text-xs text-slate-700">{formatNumber(externalMed)}</div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {isYoYMode ? 'Cùng kỳ 2025' : 'Chuẩn 2026'}
                </div>
              </td>
              <td className="py-2.5 px-4 text-right font-mono">
                <div
                  className={`font-bold text-xs ${
                    externalDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {formatDelta(externalDelta)} ({formatPercent(externalPct)})
                </div>
              </td>
              {isYoYMode && (
                <td className="py-2.5 px-3 text-center align-middle">
                  <YoYMonthlySparkline
                    data={getExternalSeries()}
                    longTermData={getExternalLongTermSeries()}
                    mode={sparkMode}
                  />
                </td>
              )}
            </tr>

            {/* 3. TỔNG TOÀN BỘ NGUỒN (INTERNAL + EXTERNAL) */}
            <tr className="bg-slate-100 font-semibold text-slate-900 border-t-2 border-slate-300">
              <td className="py-3 px-4 font-bold text-xs uppercase tracking-tight">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>TỔNG TOÀN BỘ NGUỒN (INTERNAL + EXTERNAL)</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-800 border border-slate-300 font-semibold">
                    100%
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 text-right font-mono font-bold text-xs">
                100.0%
              </td>
              <td className="py-3 px-4 text-right font-mono">
                <div className="font-bold text-xs text-slate-900">{formatNumber(totalT8)}</div>
              </td>
              <td className="py-3 px-4 text-right font-mono">
                <div className="font-bold text-xs text-slate-900">{formatNumber(totalMed)}</div>
                <div className="text-[10px] text-slate-400 font-sans">
                  {isYoYMode ? 'Cùng kỳ 2025' : 'Chuẩn 2026'}
                </div>
              </td>
              <td className="py-3 px-4 text-right font-mono">
                <div
                  className={`font-bold text-xs ${
                    totalDeltaMed >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {formatDelta(totalDeltaMed)} (
                  {formatPercent(totalMed > 0 ? (totalDeltaMed / totalMed) * 100 : 0)})
                </div>
              </td>
              {isYoYMode && (
                <td className="py-3 px-3 text-center align-middle">
                  <YoYMonthlySparkline
                    data={getTotalSeries()}
                    longTermData={getTotalLongTermSeries()}
                    mode={sparkMode}
                  />
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. Dedicated Reference Breakdown Panel for P- Ex-Google (CHỈ HIỂN THỊ KHI CHỌN NGUỒN P- Ex-Google VÀ Ở 4 PHẠM VI HỖ TRỢ) */}
      {selectedKey === 'pExGoogle' && isSearchDiscoverAllowed && googleDetails && (
        <div className="rounded-2xl border-2 border-amber-300/90 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-5 shadow-xs space-y-4 transition-all">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  P- Ex-Google | Search & Discover
                </h3>
                {googleDetails.isFromSheet && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ✓ Google Sheets
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 font-sans">
                {isYoYMode
                  ? 'Phân tích xu hướng Search & Discover từ 2025 đến 2026 (Triệu PV)'
                  : 'Phân tích xu hướng Search & Discover qua các tháng năm 2026 (Triệu PV)'}
              </p>
            </div>

            <button
              onClick={() => setSelectedKey('pInHome')}
              className="self-start sm:self-center flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 transition cursor-pointer shrink-0"
              title="Thu gọn bóc tách P- Ex-Google"
            >
              <X className="w-3.5 h-3.5" />
              <span>Đóng bóc tách</span>
            </button>
          </div>

          {/* High-Clarity Trend Visualization for Search & Discover */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="w-full h-72 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={googleDetails.trendSearchDiscover}
                  margin={{ top: 10, right: 20, left: -5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(v) => `${v}M`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const point = payload[0]?.payload;
                      if (!point) return null;
                      return (
                        <div className="bg-slate-900/95 text-white rounded-xl p-3 shadow-xl border border-slate-700/80 text-xs min-w-[200px] space-y-2">
                          <div className="border-b border-slate-700/80 pb-1.5 font-bold text-slate-200">
                            Tháng {point.month}
                          </div>
                          <div className="space-y-1.5 font-mono">
                            <div className="flex items-center justify-between text-amber-300">
                              <span className="text-slate-200 font-sans font-medium">Search:</span>
                              <span className="font-bold">{formatNumber(point.searchRaw)} PV</span>
                            </div>
                            <div className="flex items-center justify-between text-sky-300">
                              <span className="text-slate-200 font-sans font-medium">Discover:</span>
                              <span className="font-bold">{formatNumber(point.discoverRaw)} PV</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                  />
                  {(googleDetails.hasCurSearch || googleDetails.hasCurDiscover || isYoYMode) && googleDetails.curMonthLabel && (
                    <ReferenceLine
                      x={googleDetails.curMonthLabel}
                      stroke="#dc2626"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      label={{ value: 'Đang xem', fill: '#dc2626', fontSize: 10, position: 'insideTopRight' }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="search"
                    name="P- Ex-Google | Search (Triệu PV)"
                    stroke="#d97706"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#ffffff', stroke: '#d97706', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#d97706' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="discover"
                    name="P- Ex-Google | Discover (Triệu PV)"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#ffffff', stroke: '#0284c7', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#0284c7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 6. Dedicated Reference Breakdown Panel for P- Ex-Direct (CHỈ HIỂN THỊ KHI CHỌN NGUỒN P- Ex-Direct VÀ Ở 4 PHẠM VI HỖ TRỢ) */}
      {selectedKey === 'pExDirect' && isBrandnameAllowed && directDetails && (
        <div className="rounded-2xl border-2 border-blue-300/90 bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 p-5 shadow-xs space-y-4 transition-all">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-200/80 pb-3.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  P- Ex-Direct | Brandname
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  Từ T3/2026
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-sans">
                Đường xu hướng: Theo dõi biên độ và tốc độ tăng trưởng lưu lượng Brandname (Triệu PV) qua từng tháng.
              </p>
            </div>

            <button
              onClick={() => setSelectedKey('pInHome')}
              className="self-start sm:self-center flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 transition cursor-pointer shrink-0"
              title="Thu gọn bóc tách P- Ex-Direct"
            >
              <X className="w-3.5 h-3.5" />
              <span>Đóng bóc tách</span>
            </button>
          </div>

          {/* Recharts Canvas */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="h-72 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={directDetails.trendDirectBrandname}
                  margin={{ top: 10, right: 20, left: -5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(v) => `${v}M`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const point = payload[0]?.payload;
                      if (!point) return null;
                      return (
                        <div className="bg-slate-900/95 text-white rounded-xl p-3 shadow-xl border border-slate-700/80 text-xs min-w-[200px] space-y-2">
                          <div className="border-b border-slate-700/80 pb-1.5 font-bold text-slate-200">
                            Tháng {point.month}
                          </div>
                          <div className="flex items-center justify-between text-blue-300 font-mono">
                            <span className="text-slate-200 font-sans font-medium">Brandname:</span>
                            <span className="font-bold">{formatNumber(point.brandnameRaw)} PV</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                  />
                  {directDetails.curMonthLabel && directDetails.trendDirectBrandname.some((p) => p.month === directDetails.curMonthLabel) && (
                    <ReferenceLine
                      x={directDetails.curMonthLabel}
                      stroke="#dc2626"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      label={{ value: 'Đang xem', fill: '#dc2626', fontSize: 10, position: 'insideTopRight' }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="brandname"
                    name="P- Ex-Direct | Brandname (Triệu PV)"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#2563eb' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
