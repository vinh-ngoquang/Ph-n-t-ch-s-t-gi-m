import React, { useState, useMemo } from 'react';
import { getMonthlyRecordsForScope } from './utils/timeSeriesAnalytics';
import { ExecutiveHeader } from './components/ExecutiveHeader';
import { ExecutiveDropSummary } from './components/ExecutiveDropSummary';
import { OverviewVolumeYieldView } from './components/views/OverviewVolumeYieldView';
import { TrafficSourcesView } from './components/views/TrafficSourcesView';
import { PlatformsView } from './components/views/PlatformsView';
import { PageMarketView } from './components/views/PageMarketView';
import { ArticleProductionView } from './components/views/ArticleProductionView';
import { FolderBreakdownView } from './components/views/FolderBreakdownView';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { DatasetProvider, useDataset } from './context/DatasetContext';

function DashboardContent() {
  const { dataset } = useDataset();

  // Folder options from active dataset - directly reflect actual departments/folders in data
  const folderOptions = useMemo(() => {
    const map = new Map<string, string>();
    dataset.forEach((r) => {
      if (!map.has(r.folder_id) && r.folder_id !== '-1' && r.folder) {
        map.set(r.folder_id, r.folder);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [dataset]);

  // Primary state: default to 'sources' to match the user's reference immediately
  const [currentScope, setCurrentScope] = useState<string>('ALL_FOLDERS_AGG');
  const [activeTab, setActiveTab] = useState<string>('sources');
  const [selectedMonth, setSelectedMonth] = useState<string>('8/2026');
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState<boolean>(false);

  // Time series monthly records for the selected scope & active dataset
  const monthlyData = useMemo(() => {
    return getMonthlyRecordsForScope(currentScope, dataset);
  }, [currentScope, dataset]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 space-y-5">
        {/* Executive Header with KPIs & Navigation */}
        <ExecutiveHeader
          monthlyData={monthlyData}
          currentScope={currentScope}
          onScopeChange={setCurrentScope}
          folderOptions={folderOptions}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenReport={() => setIsReportOpen(true)}
          onOpenExcelImport={() => setIsExcelImportOpen(true)}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />

        {/* Executive Summary: Kết Luận Nơi Sụt Giảm Chính Theo Các Góc Nhìn */}
        <ExecutiveDropSummary
          monthlyData={monthlyData}
          selectedMonth={selectedMonth}
          dataset={dataset}
          onTabChange={setActiveTab}
        />

        {/* Content Views */}
        <div className="space-y-6">
          {/* 1. Traffic Sources (Default View) */}
          {(activeTab === 'all' || activeTab === 'sources') && (
            <section id="view-sources">
              <TrafficSourcesView monthlyData={monthlyData} />
            </section>
          )}

          {/* 2. Overview Volume & Yield */}
          {(activeTab === 'all' || activeTab === 'overview') && (
            <section id="view-overview">
              <OverviewVolumeYieldView monthlyData={monthlyData} />
            </section>
          )}

          {/* 3. Platforms */}
          {(activeTab === 'all' || activeTab === 'platforms') && (
            <section id="view-platforms">
              <PlatformsView monthlyData={monthlyData} />
            </section>
          )}

          {/* 4. 24 Folders Matrix */}
          {(activeTab === 'all' || activeTab === 'folders') && (
            <section id="view-folders">
              <FolderBreakdownView dataset={dataset} />
            </section>
          )}

          {/* 5. Page Layers & Markets */}
          {(activeTab === 'all' || activeTab === 'pages') && (
            <section id="view-pages">
              <PageMarketView monthlyData={monthlyData} />
            </section>
          )}

          {/* 6. Articles & Build Top */}
          {(activeTab === 'all' || activeTab === 'articles') && (
            <section id="view-articles">
              <ArticleProductionView monthlyData={monthlyData} />
            </section>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/90 py-5 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">VnExpress Content Performance Analytics</span>
            <span>•</span>
            <span className="text-blue-600 font-mono font-medium">Tháng 8/2026 vs MoM vs Trung vị 2026</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Chuẩn hóa: LMDI, Kitagawa Decomposition, Median Benchmark</span>
          </div>
        </div>
      </footer>

      {/* Executive Report Modal */}
      <ExecutiveReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        monthlyData={monthlyData}
        currentScope={currentScope}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <DatasetProvider>
      <DashboardContent />
    </DatasetProvider>
  );
}
