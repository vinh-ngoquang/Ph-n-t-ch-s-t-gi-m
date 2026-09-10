import React, { useState } from 'react';
import {
  Link2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Sliders,
  Unlink,
  Download,
  Info,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';
import { downloadExcelTemplate } from '../utils/excelService';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    googleSheetConfig,
    isSyncingSheet,
    sheetSyncError,
    syncFromGoogleSheet,
    saveGoogleSheetConfig,
    disconnectGoogleSheet,
    customMeta,
  } = useDataset();

  const [inputUrl, setInputUrl] = useState<string>(googleSheetConfig?.url || '');
  const [autoSync, setAutoSync] = useState<boolean>(googleSheetConfig?.autoSync ?? true);
  const [syncMode, setSyncMode] = useState<'replace' | 'merge'>(googleSheetConfig?.syncMode || 'replace');
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSync = async (overrideUrl?: string) => {
    const urlToUse = (overrideUrl !== undefined ? overrideUrl : inputUrl).trim();
    if (!urlToUse) {
      setLocalError('Vui lòng nhập đường link Google Sheets.');
      return;
    }

    setLocalError(null);
    setLocalSuccess(null);

    try {
      const result = await syncFromGoogleSheet(urlToUse, syncMode);
      setLocalSuccess(
        `Đồng bộ thành công! Đã nạp ${result.summary.totalRows} dòng (${result.summary.months.join(', ')}).`
      );
    } catch (err: any) {
      setLocalError(err.message || 'Không thể đồng bộ từ Google Sheet.');
    }
  };

  const handleToggleAutoSync = (checked: boolean) => {
    setAutoSync(checked);
    if (googleSheetConfig) {
      saveGoogleSheetConfig({
        ...googleSheetConfig,
        autoSync: checked,
      });
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Bạn có chắc chắn muốn ngắt kết nối với Google Sheet này?')) {
      disconnectGoogleSheet();
      setInputUrl('');
      setLocalSuccess(null);
      setLocalError(null);
    }
  };

  const isConnected = !!googleSheetConfig?.url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <RefreshCw className={`w-5 h-5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Đồng Bộ Dữ Liệu Tự Động Từ Google Sheets
              </h3>
              <p className="text-xs text-slate-500">
                Tự động tải số liệu mới nhất mỗi khi mở trang mà không cần đẩy file Excel thủ công
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Active Connection Status Card */}
          {isConnected ? (
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                      Đang kết nối trực tuyến với Google Sheets
                    </h4>
                    <p className="text-xs text-emerald-700 break-all font-mono truncate max-w-md">
                      {googleSheetConfig?.url}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={googleSheetConfig?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-lg transition"
                    title="Mở Google Sheet trên tab mới"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100/70 rounded-lg border border-rose-200 transition cursor-pointer"
                    title="Ngắt kết nối"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Ngắt kết nối</span>
                  </button>
                </div>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-2 border-t border-emerald-200/60">
                <div className="bg-white/80 rounded-lg px-2.5 py-1.5 border border-emerald-100">
                  <span className="text-slate-500 block text-[11px]">Đồng bộ lần cuối:</span>
                  <span className="font-semibold text-slate-800">{googleSheetConfig?.lastSyncAt || 'Vừa xong'}</span>
                </div>
                <div className="bg-white/80 rounded-lg px-2.5 py-1.5 border border-emerald-100">
                  <span className="text-slate-500 block text-[11px]">Quy mô dữ liệu:</span>
                  <span className="font-semibold text-slate-800">{googleSheetConfig?.lastRowCount || 0} dòng bản ghi</span>
                </div>
                <div className="bg-white/80 rounded-lg px-2.5 py-1.5 border border-emerald-100 col-span-2 sm:col-span-1">
                  <span className="text-slate-500 block text-[11px]">Các tháng có sẵn:</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {googleSheetConfig?.months?.join(', ') || 'Đang cập nhật'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs flex items-start gap-3 shadow-2xs">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Tiện ích tự động hóa báo cáo:</strong>
                Chỉ cần dán link Google Sheets của tòa soạn 1 lần duy nhất. Bất cứ khi nào bạn cập nhật thêm dòng số liệu tháng mới trên Google Sheets, Dashboard sẽ tự động cập nhật ngay lập tức.
              </div>
            </div>
          )}

          {/* URL Input Form */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
              Đường link Google Sheets (URL)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Link2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
              <button
                onClick={() => handleSync()}
                disabled={isSyncingSheet || !inputUrl.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingSheet ? 'animate-spin' : ''}`} />
                <span>{isSyncingSheet ? 'Đang đồng bộ...' : isConnected ? 'Đồng bộ lại' : 'Kết nối & Đồng bộ'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Hỗ trợ link chỉnh sửa thông thường (edit), link chia sẻ xem (view), hoặc link xuất bản lên web (pub/csv).
            </p>
          </div>

          {/* Options: Auto Sync & Merge Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => handleToggleAutoSync(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Tự động đồng bộ khi mở trang</span>
                <span className="text-[11px] text-slate-500">
                  Mỗi khi mở ứng dụng, hệ thống sẽ tự động tải số liệu mới nhất trong nền.
                </span>
              </div>
            </label>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800">Quy tắc nạp dữ liệu:</span>
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSyncMode('replace')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    syncMode === 'replace'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Ghi đè toàn bộ
                </button>
                <button
                  type="button"
                  onClick={() => setSyncMode('merge')}
                  className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    syncMode === 'merge'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Gộp theo tháng
                </button>
              </div>
            </div>
          </div>

          {/* Success / Error Alerts */}
          {localSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{localSuccess}</span>
            </div>
          )}

          {(localError || sheetSyncError) && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="block font-semibold">Lỗi đồng bộ:</strong>
                <p>{localError || sheetSyncError}</p>
              </div>
            </div>
          )}

          {/* 3 Step Setup Guide */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              Hướng dẫn bật quyền Google Sheets trong 15 giây:
            </h4>
            <ol className="space-y-2 text-xs text-slate-600 list-decimal pl-4">
              <li>
                Mở file Google Sheets chứa dữ liệu báo cáo trên trình duyệt.
              </li>
              <li>
                Bấm nút <strong>Chia sẻ (Share)</strong> màu xanh ở góc trên bên phải màn hình.
              </li>
              <li>
                Tại mục <em>Quyền truy cập chung (General access)</em>, chuyển thành <strong>"Bất kỳ ai có đường liên kết"</strong> với vai trò là <strong>"Người xem" (Viewer)</strong>.
              </li>
              <li>
                Sao chép đường link trên thanh địa chỉ hoặc bấm nút <strong>"Sao chép đường liên kết"</strong>, sau đó dán vào ô bên trên và bấm <strong>"Kết nối & Đồng bộ"</strong>.
              </li>
            </ol>
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500">
              <span>Định dạng bảng tính cần có các cột: <code>month, folder_id, folder, Pageviews, articles...</code></span>
              <button
                onClick={downloadExcelTemplate}
                className="text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Tải file mẫu để đưa lên Google Sheets
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Dữ liệu đồng bộ sẽ được lưu an toàn trên máy và cập nhật tự động.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition cursor-pointer"
          >
            Hoàn tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
