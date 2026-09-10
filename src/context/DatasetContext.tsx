import React, { createContext, useContext, useState, useEffect } from 'react';
import { NewsRecord } from '../types';
import { RAW_DATASET } from '../data/dataset';

interface CustomDataMeta {
  fileName: string;
  importedAt: string;
  rowsCount: number;
  months: string[];
  totalPV: number;
}

interface DatasetContextType {
  dataset: NewsRecord[];
  isCustomData: boolean;
  customMeta: CustomDataMeta | null;
  importRecords: (newRecords: NewsRecord[], mode: 'merge' | 'replace', fileName?: string) => void;
  resetToDefault: () => void;
}

const STORAGE_KEY = 'vne_custom_dataset_v2';
const META_STORAGE_KEY = 'vne_custom_meta_v2';

// Purge any stale v1 cache where Pageviews ($) collided with Pageviews
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

  const isCustomData = customMeta !== null;

  const importRecords = (newRecords: NewsRecord[], mode: 'merge' | 'replace', fileName: string = 'Imported_Data.xlsx') => {
    let finalDataset: NewsRecord[] = [];

    const months = Array.from(new Set(newRecords.map((r) => r.month)));
    const totalPV = newRecords.reduce((sum, r) => sum + (r.pageviews || 0), 0);

    if (mode === 'merge') {
      // Keep records from other months, replace records from the months present in the uploaded file
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
    };

    setDataset(finalDataset);
    setCustomMeta(meta);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalDataset));
      localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
    } catch (e) {
      console.warn('Storage quota exceeded or error storing dataset:', e);
    }
  };

  const resetToDefault = () => {
    setDataset(RAW_DATASET);
    setCustomMeta(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(META_STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
  };

  return (
    <DatasetContext.Provider
      value={{
        dataset,
        isCustomData,
        customMeta,
        importRecords,
        resetToDefault,
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
