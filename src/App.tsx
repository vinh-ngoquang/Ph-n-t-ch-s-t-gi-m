import React, { useState, useMemo } from 'react';
import { getMonthlyRecordsForScope } from './utils/timeSeriesAnalytics';
import { ExecutiveHeader } from './components/ExecutiveHeader';
import { ExecutiveDropSummary } from './components/ExecutiveDropSummary';
import { TrafficSourcesView } from './components/views/TrafficSourcesView';
import { PlatformsView } from './components/views/PlatformsView';
import { PageMarketView } from './components/views/PageMarketView';
import { ArticleProductionView } from './components/views/ArticleProductionView';
import { FolderBreakdownView } from './components/views/FolderBreakdownView';
import { VietnamMarketOverviewView } from './components/views/VietnamMarketOverviewView';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { DatasetProvider, useDataset } from './context/DatasetContext';
import { Globe, Layers, BarChart2 } from 'lucide-react';

function DashboardContent() {
  const { dataset } = useDataset();

  // Top-level Dashboard switcher: "Chi tiết Vnexpress" or "Tổng quan thị trường báo chí Việt Nam"
  const [mainDashboard, setMainDashboard] = useState<'vne_detail' | 'market_overview'>('vne_detail');

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
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState<boolean>(false);

  // Time series monthly records for the selected scope & active dataset
  const monthlyData = useMemo(() => {
    return getMonthlyRecordsForScope(currentScope, dataset);
  }, [currentScope, dataset]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 space-y-5">
        {/* Top-Level Main Dashboard Switcher */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-xs flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setMainDashboard('vne_detail')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                mainDashboard === 'vne_detail'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Layers className={`w-4 h-4 ${mainDashboard === 'vne_detail' ? 'text-red-600' : 'text-slate-400'}`} />
              <span>Chi tiết Vnexpress</span>
            </button>

            <button
              onClick={() => setMainDashboard('market_overview')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                mainDashboard === 'market_overview'
                  ? 'bg-white text-blue-700 shadow-xs border border-blue-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Globe className={`w-4 h-4 ${mainDashboard === 'market_overview' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Tổng quan thị trường báo chí Việt Nam</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 pr-2">
            <span className="hidden sm:inline font-medium">Chế độ xem:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {mainDashboard === 'vne_detail' ? 'Chi tiết Vnexpress' : 'Toàn Cảnh Báo Chí Việt Nam'}
            </span>
          </div>
        </div>

        {/* ─── 1. DASHBOARD 1: CHI TIẾT VNEXPRESS ─── */}
        {mainDashboard === 'vne_detail' && (
          <div className="space-y-5 animate-in fade-in duration-200">
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
              onOpenGoogleSheetSync={() => setIsGoogleSheetModalOpen(true)}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />

            {/* Executive Summary: Kết Luận Nơi Sụt Giảm Chính Theo Các Góc Nhìn */}
            <ExecutiveDropSummary
              monthlyData={monthlyData}
              selectedMonth={selectedMonth}
              dataset={dataset}
              onTabChange={setActiveTab}
              currentScope={currentScope}
              onScopeChange={setCurrentScope}
            />

            {/* Content Views */}
            <div className="space-y-6">
              {/* 1. Traffic Sources (Default View) */}
              {(activeTab === 'all' || activeTab === 'sources') && (
                <section id="view-sources">
                  <TrafficSourcesView
                    monthlyData={monthlyData}
                    selectedMonth={selectedMonth}
                    currentScope={currentScope}
                    folderOptions={folderOptions}
                  />
                </section>
              )}

              {/* 2. Platforms */}
              {(activeTab === 'all' || activeTab === 'platforms') && (
                <section id="view-platforms">
                  <PlatformsView monthlyData={monthlyData} selectedMonth={selectedMonth} />
                </section>
              )}

              {/* 4. 24 Folders Matrix */}
              {(activeTab === 'all' || activeTab === 'folders') && (
                <section id="view-folders">
                  <FolderBreakdownView
                    dataset={dataset}
                    currentScope={currentScope}
                    onScopeChange={setCurrentScope}
                    selectedMonth={selectedMonth}
                  />
                </section>
              )}

              {/* 5. Page Layers & Markets */}
              {(activeTab === 'all' || activeTab === 'pages') && (
                <section id="view-pages">
                  <PageMarketView monthlyData={monthlyData} selectedMonth={selectedMonth} />
                </section>
              )}

              {/* 6. Articles & Build Top */}
              {(activeTab === 'all' || activeTab === 'articles') && (
                <section id="view-articles">
                  <ArticleProductionView monthlyData={monthlyData} selectedMonth={selectedMonth} />
                </section>
              )}
            </div>
          </div>
        )}

        {/* ─── 2. DASHBOARD 2: TỔNG QUAN THỊ TRƯỜNG BÁO CHÍ VIỆT NAM ─── */}
        {mainDashboard === 'market_overview' && (
          <div className="animate-in fade-in duration-200">
            <VietnamMarketOverviewView selectedMonth={selectedMonth} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/90 py-5 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Hệ Thống Phân Tích Dữ Liệu Báo Chí Số Việt Nam</span>
            <span>•</span>
            <span className="text-blue-600 font-mono font-medium">Chi tiết VnExpress & Toàn cảnh Thị trường</span>
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

      {/* Google Sheet Sync Modal */}
      <GoogleSheetSyncModal
        isOpen={isGoogleSheetModalOpen}
        onClose={() => setIsGoogleSheetModalOpen(false)}
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
