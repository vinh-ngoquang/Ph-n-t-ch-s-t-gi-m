import React, { useState, useMemo } from 'react';
import { getMonthlyRecordsForScope } from './utils/timeSeriesAnalytics';
import { ExecutiveHeader } from './components/ExecutiveHeader';
import { ExecutiveDropSummary } from './components/ExecutiveDropSummary';
import { TrafficSourcesView } from './components/views/TrafficSourcesView';
import { PlatformsView } from './components/views/PlatformsView';
import { PageMarketView } from './components/views/PageMarketView';
import { ArticleProductionView } from './components/views/ArticleProductionView';
import { FolderBreakdownView } from './components/views/FolderBreakdownView';
import { ReaderSegmentsView } from './components/views/ReaderSegmentsView';
import { VietnamMarketOverviewView } from './components/views/VietnamMarketOverviewView';
import { VnExpressYoYDetailView } from './components/views/VnExpressYoYDetailView';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { DatasetProvider, useDataset } from './context/DatasetContext';
import { SidebarNavigation, MainDashboardType, ReportTabType } from './components/navigation/SidebarNavigation';
import { TopNavBar } from './components/navigation/TopNavBar';

function DashboardContent() {
  const { dataset } = useDataset();

  // Top-level Dashboard switcher: 'vne_detail' (Content Analytics) | 'vne_yoy' (Historical) | 'market_overview' (Thị trường)
  const [mainDashboard, setMainDashboard] = useState<MainDashboardType>('vne_detail');

  // Primary sub-view tab within Content Analytics
  const [activeTab, setActiveTab] = useState<ReportTabType>('sources');

  // Mobile sidebar drawer state
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Primary state: site, category (catename), and month
  const [selectedSite, setSelectedSite] = useState<string>('ALL');
  const [selectedCate, setSelectedCate] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('8/2026');

  // Modals
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState<boolean>(false);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState<boolean>(false);

  // Handle site change: if currently selected category doesn't belong to new site, reset to 'ALL'
  const handleSiteChange = (newSite: string) => {
    setSelectedSite(newSite);
    if (newSite !== 'ALL' && selectedCate !== 'ALL') {
      const match = dataset.find(
        (r) =>
          (r.folder_id === selectedCate || r.folder === selectedCate) &&
          (r.site_name || '').trim().toLowerCase() === newSite.trim().toLowerCase()
      );
      if (!match) {
        setSelectedCate('ALL');
      }
    }
  };

  const handleCateChange = (newCate: string) => {
    setSelectedCate(newCate);
    if (newCate !== 'ALL') {
      const match = dataset.find((r) => r.folder_id === newCate || r.folder === newCate);
      if (match?.site_name) {
        setSelectedSite(match.site_name);
      }
    }
  };

  // Derive currentScope for backward-compatible child components
  const currentScope = useMemo(() => {
    if (selectedCate !== 'ALL') return selectedCate;
    if (selectedSite !== 'ALL') return selectedSite;
    return 'ALL_FOLDERS_AGG';
  }, [selectedCate, selectedSite]);

  const handleScopeChange = (newScope: string) => {
    if (newScope === 'ALL_FOLDERS_AGG' || newScope === 'ALL') {
      setSelectedCate('ALL');
    } else if (['VnExpress', 'Ngoi sao', 'English', 'Tia sáng'].includes(newScope)) {
      setSelectedSite(newScope);
      setSelectedCate('ALL');
    } else {
      setSelectedCate(newScope);
      const match = dataset.find((r) => r.folder_id === newScope || r.folder === newScope);
      if (match?.site_name) {
        setSelectedSite(match.site_name);
      }
    }
  };

  // Folder options from active dataset, filtered by site if selected
  const folderOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; site_name?: string }>();
    dataset.forEach((r) => {
      if (r.folder_id && r.folder_id !== '-1' && r.folder) {
        if (!map.has(r.folder_id)) {
          map.set(r.folder_id, {
            id: r.folder_id,
            name: r.folder,
            site_name: r.site_name,
          });
        }
      }
    });
    let list = Array.from(map.values());
    if (selectedSite && selectedSite !== 'ALL') {
      list = list.filter(
        (f) => (f.site_name || '').trim().toLowerCase() === selectedSite.trim().toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [dataset, selectedSite, searchQuery]);

  // Time series monthly records for the selected site & category
  const monthlyData = useMemo(() => {
    return getMonthlyRecordsForScope(selectedCate, dataset, selectedSite);
  }, [selectedCate, dataset, selectedSite]);

  // Compute header title based on current dashboard view
  const headerTitle = useMemo(() => {
    if (mainDashboard === 'vne_detail') return 'Content Analytics';
    if (mainDashboard === 'vne_yoy') return 'Historical: Tổng 2026 vs Cùng kỳ 2025';
    return 'Toàn Cảnh Báo Chí Việt Nam';
  }, [mainDashboard]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex selection:bg-rose-600 selection:text-white">
      {/* ─── 1. LEFT SIDEBAR NAVIGATION (VnExpress Internal Theme) ─── */}
      <SidebarNavigation
        mainDashboard={mainDashboard}
        setMainDashboard={setMainDashboard}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenExcelImport={() => setIsExcelImportOpen(true)}
        onOpenGoogleSheetSync={() => setIsGoogleSheetModalOpen(true)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* ─── 2. MAIN APPLICATION WORKSPACE ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Sticky Top Header Bar */}
        <TopNavBar
          title={headerTitle}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
        />

        {/* Workspace Content */}
        <main className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 flex-1">
          {/* ─── VIEW 1: CONTENT ANALYTICS (CHI TIẾT THEO THÁNG) ─── */}
          {mainDashboard === 'vne_detail' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Executive Header with KPIs & Navigation */}
              <ExecutiveHeader
                monthlyData={monthlyData}
                currentScope={currentScope}
                onScopeChange={handleScopeChange}
                folderOptions={folderOptions}
                selectedSite={selectedSite}
                onSiteChange={handleSiteChange}
                selectedCate={selectedCate}
                onCateChange={handleCateChange}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as ReportTabType)}
                onOpenReport={() => setIsReportOpen(true)}
                onOpenExcelImport={() => setIsExcelImportOpen(true)}
                onOpenGoogleSheetSync={() => setIsGoogleSheetModalOpen(true)}
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
                hideImportAndExport={true}
              />

              {/* Executive Summary: Kết Luận Nơi Sụt Giảm Chính Theo Các Góc Nhìn */}
              <ExecutiveDropSummary
                monthlyData={monthlyData}
                selectedMonth={selectedMonth}
                dataset={dataset}
                onTabChange={(tab) => setActiveTab(tab as ReportTabType)}
                currentScope={currentScope}
                onScopeChange={handleScopeChange}
                selectedSite={selectedSite}
                selectedCate={selectedCate}
              />

              {/* Detailed Views by Category */}
              <div className="space-y-6">
                {/* 1. Traffic Sources */}
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

                {/* 3. Loại Độc Giả (P- New, P- Return, P- Lover) */}
                {(activeTab === 'all' || activeTab === 'readers') && (
                  <section id="view-readers">
                    <ReaderSegmentsView
                      monthlyData={monthlyData}
                      selectedMonth={selectedMonth}
                      currentScope={currentScope}
                      folderOptions={folderOptions}
                    />
                  </section>
                )}

                {/* 4. Folder Matrix */}
                {(activeTab === 'all' || activeTab === 'folders') && (
                  <section id="view-folders">
                    <FolderBreakdownView
                      dataset={dataset}
                      currentScope={currentScope}
                      onScopeChange={handleScopeChange}
                      selectedMonth={selectedMonth}
                      selectedSite={selectedSite}
                      onSiteChange={handleSiteChange}
                      selectedCate={selectedCate}
                      onCateChange={handleCateChange}
                    />
                  </section>
                )}

                {/* 4. Page Layers & Markets */}
                {(activeTab === 'all' || activeTab === 'pages') && (
                  <section id="view-pages">
                    <PageMarketView monthlyData={monthlyData} selectedMonth={selectedMonth} />
                  </section>
                )}

                {/* 5. Articles & Build Top */}
                {(activeTab === 'all' || activeTab === 'articles') && (
                  <section id="view-articles">
                    <ArticleProductionView monthlyData={monthlyData} selectedMonth={selectedMonth} />
                  </section>
                )}
              </div>
            </div>
          )}

          {/* ─── VIEW 2: HISTORICAL (VNEXPRESS TỔNG 2026 VS 2025) ─── */}
          {mainDashboard === 'vne_yoy' && (
            <VnExpressYoYDetailView
              dataset={dataset}
              folderOptions={folderOptions}
              currentScope={currentScope}
              onScopeChange={handleScopeChange}
              selectedSite={selectedSite}
              onSiteChange={handleSiteChange}
              selectedCate={selectedCate}
              onCateChange={handleCateChange}
              onOpenReport={() => setIsReportOpen(true)}
              onOpenExcelImport={() => setIsExcelImportOpen(true)}
              onOpenGoogleSheetSync={() => setIsGoogleSheetModalOpen(true)}
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab as ReportTabType)}
            />
          )}

          {/* ─── VIEW 3: THỊ TRƯỜNG BÁO CHÍ VIỆT NAM ─── */}
          {mainDashboard === 'market_overview' && (
            <div className="animate-in fade-in duration-200">
              <VietnamMarketOverviewView selectedMonth={selectedMonth} />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200/90 py-4 px-4 sm:px-6 text-xs text-slate-500 mt-12">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">VnExpress Analytics</span>
              <span className="text-slate-300">|</span>
              <span className="text-[#9c1f35] font-medium">Hệ Thống Phân Tích Nội Dung & Tòa Soạn Số</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span>Chuẩn hóa: LMDI, Kitagawa Decomposition, Median Benchmark</span>
            </div>
          </div>
        </footer>
      </div>

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
