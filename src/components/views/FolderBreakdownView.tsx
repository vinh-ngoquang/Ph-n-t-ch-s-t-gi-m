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
} from 'recharts';
import { computeFolderRanking, FolderComparisonItem } from '../../utils/timeSeriesAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../../utils/formatters';
import { LineChart as LineChartIcon, Search, ArrowUpDown } from 'lucide-react';
import { RAW_DATASET } from '../../data/dataset';
import { NewsRecord } from '../../types';

interface FolderBreakdownViewProps {
  dataset?: NewsRecord[];
}

export const FolderBreakdownView: React.FC<FolderBreakdownViewProps> = ({ dataset }) => {
  const currentData = dataset || RAW_DATASET;
  const rankingList = useMemo(() => computeFolderRanking(currentData), [currentData]);
  const [filterType, setFilterType] = useState<'all' | 'drop' | 'gain'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [sortBy, setSortBy] = useState<'deficit' | 'volume' | 'yield' | 'growth'>('deficit');

  // Top 6 folders by traffic for the trend chart
  const top6FolderIds = ['1001002', '1002835', '1001005', '1001007', '1002565', '1003159'];
  const months2026 = ['1/2026', '2/2026', '3/2026', '4/2026', '5/2026', '6/2026', '7/2026', '8/2026'];

  const top6ChartData = useMemo(() => {
    return months2026.map((m, idx) => {
      const mo = idx + 1;
      const pt: any = {
        month: `T${mo}`,
      };
      top6FolderIds.forEach((fId) => {
        const rec = currentData.find((r) => r.month === m && r.folder_id === fId);
        const name = rec?.folder || fId;
        pt[name] = Number(((rec?.pageviews || 0) / 1_000_000).toFixed(2));
      });
      return pt;
    });
  }, [currentData]);

  const top6Colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  // Deepest drop & best gain
  const dropsOnly = rankingList.filter((r) => r.deltaMedianPV < 0);
  const deepestDrop = dropsOnly.length > 0 ? dropsOnly[0] : null;

  const gainsOnly = rankingList.filter((r) => r.deltaMedianPV >= 0);
  const bestGain = gainsOnly.length > 0 ? [...gainsOnly].sort((a, b) => b.deltaMedianPV - a.deltaMedianPV)[0] : null;

  const maxAbsDeficit = Math.max(...rankingList.map((r) => Math.abs(r.deltaMedianPV)), 1);

  // Filtered and sorted rows
  const displayedRows = useMemo(() => {
    let list = rankingList.filter((item) => {
      if (filterType === 'drop' && item.deltaMedianPV >= 0) return false;
      if (filterType === 'gain' && item.deltaMedianPV < 0) return false;
      if (searchTerm && !item.folderName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    if (sortBy === 'deficit') {
      list.sort((a, b) => a.deltaMedianPV - b.deltaMedianPV);
    } else if (sortBy === 'volume') {
      list.sort((a, b) => b.t8PV - a.t8PV);
    } else if (sortBy === 'yield') {
      list.sort((a, b) => b.t8Yield - a.t8Yield);
    } else if (sortBy === 'growth') {
      list.sort((a, b) => b.pctMedianPV - a.pctMedianPV);
    }
    return list;
  }, [rankingList, filterType, searchTerm, sortBy]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      {/* 1. Header Bar with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <h2 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
              Động thái & Ma Trận Chuyên Mục & Trang Home
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
              23 Ban Nội Dung + Trang Home
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Xếp hạng chi tiết 23 ban nội dung và Trang Home. Chỉ số Yield tính theo công thức: P-Detail / Bài viết.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm chuyên mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Toggle Trend Chart */}
          <button
            onClick={() => setShowChart(!showChart)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
              showChart
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>{showChart ? 'Ẩn Biểu đồ Xu hướng' : 'Hiện Biểu đồ Xu hướng'}</span>
          </button>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/70">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({rankingList.length})
            </button>
            <button
              onClick={() => setFilterType('drop')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'drop'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Sụt giảm ({dropsOnly.length})
            </button>
            <button
              onClick={() => setFilterType('gain')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filterType === 'gain'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Tăng trưởng ({gainsOnly.length})
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 text-slate-500 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-[11px] whitespace-nowrap">Xếp theo:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="deficit">Giảm sâu nhất vs Trung vị (Mặc định)</option>
              <option value="volume">Lượng Pageview cao nhất</option>
              <option value="yield">Hiệu suất Yield cao nhất</option>
              <option value="growth">Tăng trưởng tốt nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Top 3 Highlight Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Deepest Drop Folder */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Chuyên Mục Sụt Giảm Sâu Nhất</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200/70">
              Điểm nghẽn
            </span>
          </div>
          {deepestDrop ? (
            <div className="mt-2 space-y-1">
              <div className="text-base font-bold text-rose-600 font-mono flex items-center gap-2">
                <span>{deepestDrop.folderName}</span>
                <span>{formatDelta(deepestDrop.deltaMedianPV)} PV</span>
                <span className="text-xs font-semibold">({formatPercent(deepestDrop.pctMedianPV)})</span>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Tháng này: <strong className="text-slate-700">{formatNumber(deepestDrop.t8PV)}</strong>
                {'  '}| Trung vị: <strong className="text-slate-700">{formatNumber(deepestDrop.median2026PV)}</strong>
              </div>
            </div>
          ) : null}
        </div>

        {/* Card 2: Drop vs Gain Ratio */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Tỷ Lệ Chuyên Mục Giảm vs. Tăng</div>
          <div className="mt-2 space-y-1 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Mục sụt giảm so với Trung vị:</span>
              <span className="font-bold text-rose-600">
                {dropsOnly.length} / {rankingList.length} chuyên mục ({Math.round((dropsOnly.length / rankingList.length) * 100)}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Mục tăng trưởng/giữ vững:</span>
              <span className="font-bold text-emerald-600">
                {gainsOnly.length} / {rankingList.length} chuyên mục ({Math.round((gainsOnly.length / rankingList.length) * 100)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Best Growing Folder */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Chuyên Mục Tăng Trưởng Tốt Nhất</div>
          {bestGain ? (
            <div className="mt-2 space-y-1">
              <div className="text-base font-bold text-emerald-600 font-mono flex items-center gap-2">
                <span>{bestGain.folderName}</span>
                <span>{formatDelta(bestGain.deltaMedianPV)} PV</span>
                <span className="text-xs font-semibold">({formatPercent(bestGain.pctMedianPV)})</span>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Tháng này: <strong className="text-slate-700">{formatNumber(bestGain.t8PV)}</strong>
                {'  '}| Trung vị: <strong className="text-slate-700">{formatNumber(bestGain.median2026PV)}</strong>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-2 italic">Không có chuyên mục tăng trưởng</div>
          )}
        </div>
      </div>

      {/* 3. Collapsible Trend Line Chart */}
      {showChart && (
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 transition-all">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-800">
              Đường xu hướng 2026: Top 6 Chuyên mục lớn nhất (Triệu PV qua 8 tháng)
            </span>
            <span className="text-slate-500 text-[11px]">Thế giới, Ngôi sao, Thời sự, Pháp luật, Thể thao, Kinh doanh</span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={top6ChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                {Object.keys(top6ChartData[0] || {})
                  .filter((k) => k !== 'month')
                  .map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={top6Colors[i % top6Colors.length]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: top6Colors[i % top6Colors.length] }}
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
              <th className="py-3 px-3">#</th>
              <th className="py-3 px-4 font-sans">Chuyên Mục</th>
              <th className="py-3 px-4 text-right font-sans">Tháng 8/2026 (PV)</th>
              <th className="py-3 px-3 text-right font-sans">
                <div>MoM (T7/2026)</div>
                <div className="text-[9px] text-slate-400 font-normal">Chênh lệch & %</div>
              </th>
              <th className="py-3 px-3 text-right font-sans">Mốc Trung Vị</th>
              <th className="py-3 px-4 text-right font-sans min-w-[190px]">
                <div>Lệch vs. Trung Vị</div>
                <div className="text-[9px] text-slate-400 font-normal">Hụt PV & % Sụt giảm</div>
              </th>
              <th className="py-3 px-3 text-right font-sans">
                <div>Yield T8</div>
                <div className="text-[9px] text-slate-400 font-normal">(P-Detail/bài)</div>
              </th>
              <th className="py-3 px-3 text-right font-sans">
                <div>Yield Trung Vị</div>
                <div className="text-[9px] text-slate-400 font-normal">(P-Detail/bài)</div>
              </th>
              <th className="py-3 px-3 text-center font-sans">Đánh Giá</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-xs">
            {displayedRows.map((item, idx) => {
              const isDrop = item.deltaMedianPV < 0;
              const barWidthPct = Math.min(100, Math.max(8, (Math.abs(item.deltaMedianPV) / maxAbsDeficit) * 100));

              return (
                <tr key={item.folderId} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 text-slate-400 font-sans">{idx + 1}</td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-900">
                    <span>{item.folderName}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({item.folderId})</span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatNumber(item.t8PV)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">
                    <div>{formatNumber(item.momPV)}</div>
                    <div className={`text-[10px] font-semibold ${item.deltaMoMPV >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatDelta(item.deltaMoMPV)} ({formatPercent(item.pctMoMPV)})
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700 font-semibold">
                    {formatNumber(item.median2026PV)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className={`font-bold ${!isDrop ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatDelta(item.deltaMedianPV)} ({formatPercent(item.pctMedianPV)})
                    </div>
                    <div className="w-full max-w-[150px] h-1.5 bg-slate-100 rounded-full overflow-hidden relative mt-1.5 ml-auto flex justify-end">
                      <div
                        className={`h-full rounded-full transition-all ${
                          !isDrop ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${barWidthPct}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-800">
                    {item.t8Articles > 0 ? (
                      formatNumber(item.t8Yield)
                    ) : (
                      <span className="text-slate-400 font-sans text-[11px]">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500">
                    {item.median2026Articles > 0 ? (
                      formatNumber(item.median2026Yield)
                    ) : (
                      <span className="text-slate-400 font-sans text-[11px]">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-sans">
                    {item.pctMedianPV <= -15 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200/70">
                        Báo động
                      </span>
                    ) : item.pctMedianPV < 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/70">
                        Giảm nhẹ
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                        Tăng trưởng
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
