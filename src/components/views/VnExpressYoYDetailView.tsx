import React, { useState, useMemo } from 'react';
import { getMonthlyRecordsForScope } from '../../utils/timeSeriesAnalytics';
import { ExecutiveHeader } from '../ExecutiveHeader';
import { ExecutiveDropSummary } from '../ExecutiveDropSummary';
import { TrafficSourcesView } from './TrafficSourcesView';
import { PlatformsView } from './PlatformsView';
import { FolderBreakdownView } from './FolderBreakdownView';
import { PageMarketView } from './PageMarketView';
import { ArticleProductionView } from './ArticleProductionView';
import { NewsRecord } from '../../types';

interface Props {
  dataset: NewsRecord[];
  folderOptions: { id: string; name: string }[];
  currentScope: string;
  onScopeChange: (scope: string) => void;
  onOpenReport: () => void;
  onOpenExcelImport: () => void;
  onOpenGoogleSheetSync: () => void;
}

export const VnExpressYoYDetailView: React.FC<Props> = ({
  dataset,
  folderOptions,
  currentScope,
  onScopeChange,
  onOpenReport,
  onOpenExcelImport,
  onOpenGoogleSheetSync,
}) => {
  const [activeTab, setActiveTab] = useState<string>('sources');

  // Time series monthly records for the selected scope & active dataset
  const monthlyData = useMemo(() => {
    return getMonthlyRecordsForScope(currentScope, dataset);
  }, [currentScope, dataset]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Executive Header: KPIs & Navigation (No "Kỳ phân tích" box, default Total 2026 vs 2025) */}
      <ExecutiveHeader
        monthlyData={monthlyData}
        currentScope={currentScope}
        onScopeChange={onScopeChange}
        folderOptions={folderOptions}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenReport={onOpenReport}
        onOpenExcelImport={onOpenExcelImport}
        onOpenGoogleSheetSync={onOpenGoogleSheetSync}
        isYoYMode={true}
      />

      {/* 2. Executive Drop Summary: YoY Insights & Key Drop Points */}
      <ExecutiveDropSummary
        monthlyData={monthlyData}
        dataset={dataset}
        onTabChange={setActiveTab}
        currentScope={currentScope}
        onScopeChange={onScopeChange}
        isYoYMode={true}
      />

      {/* 3. Sub-views by Tab */}
      <div className="space-y-6">
        {/* 1. Traffic Sources */}
        {(activeTab === 'all' || activeTab === 'sources') && (
          <section id="yoy-view-sources">
            <TrafficSourcesView
              monthlyData={monthlyData}
              currentScope={currentScope}
              folderOptions={folderOptions}
              isYoYMode={true}
            />
          </section>
        )}

        {/* 2. Platforms */}
        {(activeTab === 'all' || activeTab === 'platforms') && (
          <section id="yoy-view-platforms">
            <PlatformsView monthlyData={monthlyData} isYoYMode={true} />
          </section>
        )}

        {/* 3. 24 Folders Breakdown */}
        {(activeTab === 'all' || activeTab === 'folders') && (
          <section id="yoy-view-folders">
            <FolderBreakdownView
              dataset={dataset}
              currentScope={currentScope}
              onScopeChange={onScopeChange}
              isYoYMode={true}
            />
          </section>
        )}

        {/* 4. Page Layers & Markets */}
        {(activeTab === 'all' || activeTab === 'pages') && (
          <section id="yoy-view-pages">
            <PageMarketView monthlyData={monthlyData} isYoYMode={true} />
          </section>
        )}

        {/* 5. Article Production & Quality */}
        {(activeTab === 'all' || activeTab === 'articles') && (
          <section id="yoy-view-articles">
            <ArticleProductionView monthlyData={monthlyData} isYoYMode={true} />
          </section>
        )}
      </div>
    </div>
  );
};

