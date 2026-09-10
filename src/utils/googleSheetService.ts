import { parseExcelOrCsvData, ParsedExcelResult } from './excelService';

export interface ExtractedSheetInfo {
  sheetId: string;
  gid: string;
  isPublished: boolean;
  exportUrl: string;
  gvizUrl: string;
}

/**
 * Parses any Google Sheets URL or ID into actionable CSV endpoint URLs
 */
export function parseGoogleSheetUrl(inputUrl: string): ExtractedSheetInfo | null {
  if (!inputUrl) return null;
  const trimmed = inputUrl.trim();
  if (!trimmed) return null;

  // Case 1: Published to web URL (contains /d/e/2PACX-...)
  if (trimmed.includes('/d/e/')) {
    const match = trimmed.match(/\/d\/e\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const pubId = match[1];
      const gidMatch = trimmed.match(/[?&]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      const exportUrl = `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv${
        gid !== '0' ? `&gid=${gid}` : ''
      }`;
      return {
        sheetId: pubId,
        gid,
        isPublished: true,
        exportUrl,
        gvizUrl: exportUrl,
      };
    }
  }

  // Case 2: Standard spreadsheet URL (contains /spreadsheets/d/...)
  let sheetId = '';
  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (idMatch && idMatch[1]) {
    sheetId = idMatch[1];
  } else if (/^[a-zA-Z0-9-_]{25,}$/.test(trimmed)) {
    // Direct raw ID passed
    sheetId = trimmed;
  }

  if (!sheetId) return null;

  // Extract gid (tab ID) if present in URL
  let gid = '0';
  const gidMatch = trimmed.match(/[#?&]gid=([0-9]+)/);
  if (gidMatch && gidMatch[1]) {
    gid = gidMatch[1];
  }

  // Google Visualization API endpoint offers the best CORS support for web clients
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

  return {
    sheetId,
    gid,
    isPublished: false,
    exportUrl,
    gvizUrl,
  };
}

/**
 * Fetches CSV data from Google Sheet with fallback strategies and validation
 */
export async function fetchGoogleSheetCsv(inputUrl: string): Promise<{ csvText: string; urlUsed: string }> {
  const info = parseGoogleSheetUrl(inputUrl);
  if (!info) {
    throw new Error(
      'Đường link Google Sheets không đúng định dạng. Vui lòng dán link đầy đủ (ví dụ: https://docs.google.com/spreadsheets/d/.../edit).'
    );
  }

  const endpointsToTry = info.isPublished ? [info.exportUrl] : [info.gvizUrl, info.exportUrl];

  let lastError: any = null;

  for (const url of endpointsToTry) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          Accept: 'text/csv, text/plain, */*',
        },
      });

      if (response.ok) {
        const text = await response.text();

        // Check if response is Google's login HTML redirect
        if (
          text.includes('<!DOCTYPE html>') ||
          text.includes('<html') ||
          text.includes('accounts.google.com') ||
          text.includes('ServiceLogin')
        ) {
          throw new Error(
            'Google Sheet đang ở chế độ Riêng tư (Private). Vui lòng mở Google Sheet, bấm nút "Chia sẻ" ở góc phải và đổi Quyền truy cập chung thành "Bất kỳ ai có đường liên kết" (Người xem).'
          );
        }

        if (text.trim().length === 0) {
          throw new Error('Nội dung nhận được từ Google Sheet bị trống.');
        }

        return { csvText: text, urlUsed: url };
      } else {
        lastError = new Error(`Lỗi kết nối máy chủ Google Sheets (${response.status} ${response.statusText})`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw (
    lastError ||
    new Error(
      'Không thể kết nối đến Google Sheets. Hãy đảm bảo đường link chính xác và sheet đã được bật chia sẻ xem công khai.'
    )
  );
}

/**
 * Downloads and parses Google Sheet into standard NewsRecord dataset
 */
export async function syncGoogleSheetData(inputUrl: string): Promise<ParsedExcelResult> {
  const { csvText } = await fetchGoogleSheetCsv(inputUrl);
  return parseExcelOrCsvData(csvText);
}
