import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { NewsRecord } from '../types';
import { RAW_DATASET } from '../data/dataset';
import { syncGoogleSheetData } from '../utils/googleSheetService';
import { ParsedExcelResult } from '../utils/excelService';

export interface CustomDataMeta {
  fileName: string;
  importedAt: string;
  rowsCount: number;
  months: string[];
  totalPV: number;
  sourceType?: 'excel' | 'google_sheet';
}

export interface GoogleSheetConfig {
  url: string;
  autoSync: boolean;
  sheetTitle?: string;
  lastSyncAt?: string;
  lastRowCount?: number;
  lastTotalPV?: number;
  months?: string[];
  syncMode?: 'replace' | 'merge';
}

interface DatasetContextType {
  dataset: NewsRecord[];
  isCustomData: boolean;
  customMeta: CustomDataMeta | null;
  googleSheetConfig: GoogleSheetConfig | null;
  isSyncingSheet: boolean;
  sheetSyncError: string | null;
  importRecords: (
    newRecords: NewsRecord[],
    mode: 'merge' | 'replace',
    fileName?: string,
    sourceType?: 'excel' | 'google_sheet'
  ) => void;
  resetToDefault: () => void;
  saveGoogleSheetConfig: (config: GoogleSheetConfig) => void;
  syncFromGoogleSheet: (overrideUrl?: string, mode?: 'merge' | 'replace') => Promise<ParsedExcelResult>;
  disconnectGoogleSheet: () => void;
}

const STORAGE_KEY = 'vne_custom_dataset_v2';
const META_STORAGE_KEY = 'vne_custom_meta_v2';
const GSHEET_CONFIG_KEY = 'vne_gsheet_config_v1';

// Purge any stale v1 cache
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('vne_custom_dataset_v1');
    window.localStorage.removeItem('vne_custom_meta_v1');
  }
} catch (_) {}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataset, setDataset] = useState<NewsRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load custom dataset from storage:', e);
    }
    return RAW_DATASET;
  });

  const [customMeta, setCustomMeta] = useState<CustomDataMeta | null>(() => {
    try {
      const stored = localStorage.getItem(META_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load custom meta from storage:', e);
    }
    return null;
  });

  const [googleSheetConfig, setGoogleSheetConfig] = useState<GoogleSheetConfig | null>(() => {
    try {
      const stored = localStorage.getItem(GSHEET_CONFIG_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load Google Sheet config from storage:', e);
    }
    return null;
  });

  const [isSyncingSheet, setIsSyncingSheet] = useState<boolean>(false);
  const [sheetSyncError, setSheetSyncError] = useState<string | null>(null);
  const initialSyncAttempted = useRef<boolean>(false);

  const isCustomData = customMeta !== null;

  const importRecords = useCallback(
    (
      newRecords: NewsRecord[],
      mode: 'merge' | 'replace',
      fileName: string = 'Imported_Data.xlsx',
      sourceType: 'excel' | 'google_sheet' = 'excel'
    ) => {
      let finalDataset: NewsRecord[] = [];

      const months = Array.from(new Set(newRecords.map((r) => r.month)));
      const totalPV = newRecords.reduce((sum, r) => sum + (r.pageviews || 0), 0);

      if (mode === 'merge') {
        const monthSet = new Set(months);
        const remainingOldRecords = dataset.filter((r) => !monthSet.has(r.month));
        finalDataset = [...remainingOldRecords, ...newRecords];
      } else {
        finalDataset = newRecords;
      }

      const meta: CustomDataMeta = {
        fileName,
        importedAt: new Date().toLocaleString('vi-VN'),
        rowsCount: newRecords.length,
        months,
        totalPV,
        sourceType,
      };

      setDataset(finalDataset);
      setCustomMeta(meta);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalDataset));
        localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
      } catch (e) {
        console.warn('Storage quota exceeded or error storing dataset:', e);
      }
    },
    [dataset]
  );

  const saveGoogleSheetConfig = useCallback((config: GoogleSheetConfig) => {
    setGoogleSheetConfig(config);
    try {
      localStorage.setItem(GSHEET_CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Error saving Google Sheet config:', e);
    }
  }, []);

  const disconnectGoogleSheet = useCallback(() => {
    setGoogleSheetConfig(null);
    setSheetSyncError(null);
    try {
      localStorage.removeItem(GSHEET_CONFIG_KEY);
    } catch (e) {
      console.error('Error removing Google Sheet config:', e);
    }
  }, []);

  const syncFromGoogleSheet = useCallback(
    async (overrideUrl?: string, mode: 'merge' | 'replace' = 'replace'): Promise<ParsedExcelResult> => {
      const targetUrl = overrideUrl || googleSheetConfig?.url;
      if (!targetUrl) {
        throw new Error('Chưa thiết lập đường dẫn Google Sheets.');
      }

      setIsSyncingSheet(true);
      setSheetSyncError(null);

      try {
        const parsed = await syncGoogleSheetData(targetUrl);
        const effectiveMode = mode || googleSheetConfig?.syncMode || 'replace';

        importRecords(
          parsed.records,
          effectiveMode,
          'Google Sheets (Trực tuyến)',
          'google_sheet'
        );

        const updatedConfig: GoogleSheetConfig = {
          ...(googleSheetConfig || { url: targetUrl, autoSync: true }),
          url: targetUrl,
          lastSyncAt: new Date().toLocaleString('vi-VN'),
          lastRowCount: parsed.records.length,
          lastTotalPV: parsed.summary.totalPV,
          months: parsed.summary.months,
          syncMode: effectiveMode,
        };

        saveGoogleSheetConfig(updatedConfig);
        return parsed;
      } catch (err: any) {
        const msg = err?.message || 'Đồng bộ từ Google Sheets thất bại.';
        setSheetSyncError(msg);
        throw err;
      } finally {
        setIsSyncingSheet(false);
      }
    },
    [googleSheetConfig, importRecords, saveGoogleSheetConfig]
  );

  const resetToDefault = useCallback(() => {
    setDataset(RAW_DATASET);
    setCustomMeta(null);
    setSheetSyncError(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(META_STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
  }, []);

  // Background Auto-sync on app load if configured
  useEffect(() => {
    if (initialSyncAttempted.current) return;
    initialSyncAttempted.current = true;

    if (googleSheetConfig?.autoSync && googleSheetConfig?.url) {
      // Run background sync silently so cached UI renders instantly
      syncFromGoogleSheet(googleSheetConfig.url, googleSheetConfig.syncMode || 'replace')
        .then(() => {
          console.log('[GoogleSheetSync] Background sync succeeded on app load.');
        })
        .catch((err) => {
          console.warn('[GoogleSheetSync] Background auto-sync failed, keeping cached data:', err);
        });
    }
  }, [googleSheetConfig, syncFromGoogleSheet]);

  return (
    <DatasetContext.Provider
      value={{
        dataset,
        isCustomData,
        customMeta,
        googleSheetConfig,
        isSyncingSheet,
        sheetSyncError,
        importRecords,
        resetToDefault,
        saveGoogleSheetConfig,
        syncFromGoogleSheet,
        disconnectGoogleSheet,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
};

export function useDataset(): DatasetContextType {
  const ctx = useContext(DatasetContext);
  if (!ctx) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return ctx;
}
