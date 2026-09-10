import * as XLSX from 'xlsx';
import { NewsRecord } from '../types';

export interface ParsedExcelResult {
  records: NewsRecord[];
  summary: {
    totalRows: number;
    months: string[];
    totalPV: number;
    totalArticles: number;
    folderCount: number;
  };
  sampleRows: Partial<NewsRecord>[];
}

// Clean number strings or values like "42,251,883", 42251883, etc.
export function cleanNumeric(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim().replace(/,/g, '').replace(/\s/g, '');
  const num = Number(str);
  return isNaN(num) ? 0 : num;
}

// Normalize column key for flexible matching
function normalizeKey(header: string): string {
  let h = header.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Specifically map negative ads vs positive ads before removing non-alphanumerics:
  // (-$) or (- $) or -$ or -ads
  h = h.replace(/\(\s*-\s*\$?\s*\)/g, '_noads');
  h = h.replace(/-\s*\$/g, '_noads');
  // ($) or ($ ) or $
  h = h.replace(/\(\s*\$\s*\)/g, '_ads');
  h = h.replace(/\$/g, '_ads');
  return h.replace(/[^a-z0-9_]/g, '');
}

// Map row object with varied header names to NewsRecord
export function mapRowToNewsRecord(rawRow: Record<string, any>): NewsRecord | null {
  const normMap = new Map<string, any>();
  for (const [k, v] of Object.entries(rawRow)) {
    normMap.set(normalizeKey(k), v);
  }

  const getVal = (...possibleKeys: string[]): any => {
    for (const k of possibleKeys) {
      const nKey = normalizeKey(k);
      if (normMap.has(nKey) && normMap.get(nKey) !== undefined && normMap.get(nKey) !== '') {
        return normMap.get(nKey);
      }
    }
    return undefined;
  };

  // Month
  let month = String(getVal('month', 'thang', 'time', 'ky') || '').trim();
  if (!month) {
    return null;
  }
  // If month is Excel date serial number or Date object
  if (typeof getVal('month', 'thang') === 'number' && getVal('month', 'thang') > 40000) {
    const d = XLSX.SSF.parse_date_code(getVal('month', 'thang'));
    month = `${d.m}/${d.y}`;
  }

  // Folder ID
  const folder_id = String(getVal('folder_id', 'folderid', 'id', 'maban', 'idban') || '0').trim();

  // Folder Name
  const folder = String(getVal('folder', 'chuyenmuc', 'ban', 'tenban', 'tenchuyenmuc') || 'Chuyên mục').trim();

  // CRITICAL: Ensure Total Pageviews is strictly read from 'Pageviews' column,
  // and NEVER from 'Pageviews ($)' (Commercial Ads) or 'Pageviews (-$)' (Non-Ads).
  const pageviewsNoAds = cleanNumeric(
    rawRow['Pageviews (-$)'] ??
    rawRow['Pageviews(-$)'] ??
    rawRow['PV (-$)'] ??
    rawRow['PV(-$)'] ??
    getVal('pageviews_noads', 'pageviewsnoads', 'pv_noads', 'pvnoads', 'khongquangcao', 'noads')
  );

  const pageviewsAds = cleanNumeric(
    rawRow['Pageviews ($)'] ??
    rawRow['Pageviews($)'] ??
    rawRow['PV ($)'] ??
    rawRow['PV($)'] ??
    getVal('pageviews_ads', 'pageviewsads', 'pv_ads', 'pvads', 'quangcao', 'ads')
  );

  let pageviews = cleanNumeric(
    rawRow['Pageviews'] ??
    rawRow['pageviews'] ??
    rawRow['PAGEVIEWS'] ??
    rawRow['Tổng Pageviews'] ??
    rawRow['Tong Pageviews'] ??
    rawRow['Lượt xem'] ??
    rawRow['Luot xem'] ??
    getVal('pageviews', 'tongpageviews', 'totalpageviews', 'luotxem', 'tongluotxem', 'pv', 'views', 'view')
  );

  // Fallback: If only Pageviews (-$) and Pageviews ($) are present and total pageviews is 0
  if (pageviews === 0 && (pageviewsNoAds > 0 || pageviewsAds > 0)) {
    pageviews = pageviewsNoAds + pageviewsAds;
  }

  const record: NewsRecord = {
    month,
    folder_id,
    folder,
    articles: cleanNumeric(getVal('articles', 'baiviet', 'tongbaiviet', 'tongbai')),
    articleThuong: cleanNumeric(getVal('articlethuong', 'baithuong', 'thuong')),
    articleThuongMai: cleanNumeric(getVal('articlethuongmai', 'baithuongmai', 'thuongmai', 'tm')),
    aBuildTop: cleanNumeric(getVal('abuildtop', 'buildtop', 'abuildtop')),
    aNonBuildTop: cleanNumeric(getVal('anonbuildtop', 'nonbuildtop', 'khongbuildtop')),
    pageviews,
    pageviewsNoAds,
    pageviewsAds,
    pExDirect: cleanNumeric(getVal('pexdirect', 'p-ex-direct', 'direct', 'tructiep')),
    pExGoogle: cleanNumeric(getVal('pexgoogle', 'p-ex-google', 'google', 'search')),
    pExSocial: cleanNumeric(getVal('pexsocial', 'p-ex-social', 'social', 'mangxahoi')),
    pInHome: cleanNumeric(getVal('pinhome', 'p-in-home', 'home', 'trangchu', 'trangbia')),
    pInFolder: cleanNumeric(getVal('pinfolder', 'p-in-folder', 'folder', 'trangchuyenmuc')),
    pInDetail: cleanNumeric(getVal('pindetail', 'p-in-detail', 'detail', 'bailienquan', 'trongbai')),
    pInOther: cleanNumeric(getVal('pinother', 'p-in-other', 'other', 'khac')),
    pListing: cleanNumeric(getVal('plisting', 'p-listing', 'listing', 'danhmuc')),
    pDetail: cleanNumeric(getVal('pdetail', 'p-detail', 'chitiet')),
    pDO: cleanNumeric(getVal('pdo', 'p-do', 'do', 'trongnuoc', 'domestic')),
    pOV: cleanNumeric(getVal('pov', 'p-ov', 'ov', 'nuocngoai', 'oversea')),
    pUnknown: cleanNumeric(getVal('punknown', 'p-unknown', 'unknown')),
    pMobile: cleanNumeric(getVal('pmobile', 'p-mobile', 'mobile', 'didong')),
    pPC: cleanNumeric(getVal('ppc', 'p-pc', 'pc', 'desktop', 'maytinh')),
    pApp: cleanNumeric(getVal('papp', 'p-app', 'app', 'ungdung')),
    pTablet: cleanNumeric(getVal('ptablet', 'p-tablet', 'tablet', 'maytimbang')),
  };

  return record;
}

// Parse raw workbook data (ArrayBuffer or CSV text string)
export function parseExcelOrCsvData(data: ArrayBuffer | string): ParsedExcelResult {
  const workbook = typeof data === 'string'
    ? XLSX.read(data, { type: 'string' })
    : XLSX.read(data, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Tệp dữ liệu không chứa sheet nào.');
  }

  // Use the first sheet
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to json objects
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('Sheet dữ liệu không có dòng nào hoặc bị trống.');
  }

  const records: NewsRecord[] = [];
  const monthSet = new Set<string>();
  const folderSet = new Set<string>();
  let totalPV = 0;
  let totalArticles = 0;

  for (const raw of rawRows) {
    const parsed = mapRowToNewsRecord(raw);
    if (parsed && parsed.month) {
      records.push(parsed);
      monthSet.add(parsed.month);
      if (parsed.folder_id && parsed.folder_id !== '-1') {
        folderSet.add(parsed.folder_id);
      }
      totalPV += parsed.pageviews || 0;
      totalArticles += parsed.articles || 0;
    }
  }

  if (records.length === 0) {
    throw new Error('Không nhận diện được dòng dữ liệu hợp lệ nào. Vui lòng kiểm tra lại cấu trúc cột trong tệp dữ liệu.');
  }

  return {
    records,
    summary: {
      totalRows: records.length,
      months: Array.from(monthSet),
      totalPV,
      totalArticles,
      folderCount: folderSet.size,
    },
    sampleRows: records.slice(0, 10),
  };
}

// Parse an uploaded file (xlsx, xls, csv)
export async function parseExcelOrCsvFile(file: File): Promise<ParsedExcelResult> {
  const arrayBuffer = await file.arrayBuffer();
  return parseExcelOrCsvData(arrayBuffer);
}

// Standard header definitions for export & template
export const STANDARD_COLUMNS: { key: keyof NewsRecord; header: string }[] = [
  { key: 'month', header: 'Month' },
  { key: 'folder_id', header: 'folder_id' },
  { key: 'folder', header: 'Folder' },
  { key: 'articles', header: 'Articles' },
  { key: 'articleThuong', header: 'Article thường' },
  { key: 'articleThuongMai', header: 'Article thương mại' },
  { key: 'aBuildTop', header: 'A- Build Top' },
  { key: 'aNonBuildTop', header: 'A- Non- Build Top' },
  { key: 'pageviews', header: 'Pageviews' },
  { key: 'pageviewsNoAds', header: 'Pageviews (-$)' },
  { key: 'pageviewsAds', header: 'Pageviews ($)' },
  { key: 'pExDirect', header: 'P- Ex-Direct' },
  { key: 'pExGoogle', header: 'P- Ex-Google' },
  { key: 'pExSocial', header: 'P- Ex-Social' },
  { key: 'pInHome', header: 'P- In-Home' },
  { key: 'pInFolder', header: 'P- In-Folder' },
  { key: 'pInDetail', header: 'P- In-Detail' },
  { key: 'pInOther', header: 'P- In-Other' },
  { key: 'pListing', header: 'P- Listing' },
  { key: 'pDetail', header: 'P- Detail' },
  { key: 'pDO', header: 'P- DO' },
  { key: 'pOV', header: 'P- OV' },
  { key: 'pUnknown', header: 'P- Unknown' },
  { key: 'pMobile', header: 'P- Mobile' },
  { key: 'pPC', header: 'P- PC' },
  { key: 'pApp', header: 'P- App' },
  { key: 'pTablet', header: 'P- Tablet' },
];

// Export records to an Excel .xlsx file
export function exportRecordsToExcel(records: NewsRecord[], fileName: string = 'VnExpress_Content_Data.xlsx') {
  const exportData = records.map((r) => {
    const rowObj: Record<string, any> = {};
    STANDARD_COLUMNS.forEach((col) => {
      rowObj[col.header] = r[col.key];
    });
    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, fileName);
}

// Download empty template with sample 8/2026 folders
export function downloadExcelTemplate() {
  const defaultFolders = [
    { id: '1005628', name: 'Bất động sản' },
    { id: '1002966', name: 'Đời sống' },
    { id: '1003231', name: 'Du lịch' },
    { id: '1003888', name: 'English' },
    { id: '1002691', name: 'Giải trí' },
    { id: '1003497', name: 'Giáo dục' },
    { id: '1003450', name: 'Góc nhìn' },
    { id: '1006219', name: 'Khoa học công nghệ' },
    { id: '1003159', name: 'Kinh doanh' },
    { id: '1004492', name: 'Mới nhất' },
    { id: '1002835', name: 'Ngôi sao' },
    { id: '1001007', name: 'Pháp luật' },
    { id: '1005858', name: 'Spotlight' },
    { id: '1003750', name: 'Sức khỏe' },
    { id: '1001014', name: 'Tâm sự' },
    { id: '1001002', name: 'Thế giới' },
    { id: '1002565', name: 'Thể thao' },
    { id: '1001005', name: 'Thời sự' },
    { id: '1001011', name: 'Thư giãn' },
    { id: '1006614', name: 'Tia sáng' },
    { id: '1006255', name: 'VnE-GO' },
    { id: '1000000', name: 'VnExpress' },
    { id: '1001006', name: 'Xe' },
    { id: '1001012', name: 'Ý kiến' },
  ];

  const templateRows = defaultFolders.map((f) => {
    const row: Record<string, any> = {
      Month: '8/2026',
      folder_id: f.id,
      Folder: f.name,
      Articles: 0,
      'Article thường': 0,
      'Article thương mại': 0,
      'A- Build Top': 0,
      'A- Non- Build Top': 0,
      Pageviews: 0,
      'Pageviews (-$)': 0,
      'Pageviews ($)': 0,
      'P- Ex-Direct': 0,
      'P- Ex-Google': 0,
      'P- Ex-Social': 0,
      'P- In-Home': 0,
      'P- In-Folder': 0,
      'P- In-Detail': 0,
      'P- In-Other': 0,
      'P- Listing': 0,
      'P- Detail': 0,
      'P- DO': 0,
      'P- OV': 0,
      'P- Unknown': 0,
      'P- Mobile': 0,
      'P- PC': 0,
      'P- App': 0,
      'P- Tablet': 0,
    };
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(templateRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_8_2026');
  XLSX.writeFile(workbook, 'Mau_Nhap_Lieu_VnExpress_T8_2026.xlsx');
}
