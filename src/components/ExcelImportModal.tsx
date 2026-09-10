import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  RotateCcw,
  Layers,
  FileText,
  HelpCircle,
} from 'lucide-react';
import {
  parseExcelOrCsvFile,
  ParsedExcelResult,
  downloadExcelTemplate,
  exportRecordsToExcel,
} from '../utils/excelService';
import { useDataset } from '../context/DatasetContext';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose }) => {
  const { dataset, isCustomData, customMeta, importRecords, resetToDefault } = useDataset();

  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParsedExcelResult | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setParsing(true);
    setParseError(null);
    setSuccessMessage(null);

    try {
      const result = await parseExcelOrCsvFile(file);
      setParseResult(result);
    } catch (err: any) {
      console.error('Error parsing excel file:', err);
      setParseError(err.message || 'Không thể đọc tệp Excel/CSV. Vui lòng kiểm tra lại định dạng tệp.');
      setParseResult(null);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.records.length === 0) return;

    importRecords(parseResult.records, importMode, selectedFile?.name || 'File_Excel_Imported.xlsx');
    setSuccessMessage(
      `Đã nạp thành công ${parseResult.summary.totalRows} dòng dữ liệu (${parseResult.summary.months.join(
        ', '
      )}) với tổng ${parseResult.summary.totalPV.toLocaleString('vi-VN')} Pageviews!`
    );

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleResetData = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục về bộ dữ liệu gốc ban đầu của hệ thống?')) {
      resetToDefault();
      setSelectedFile(null);
      setParseResult(null);
      setSuccessMessage('Đã khôi phục về bộ dữ liệu mặc định.');
    }
  };

  const handleExportCurrent = () => {
    exportRecordsToExcel(dataset, `VnExpress_Du_Lieu_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Nhập Dữ Liệu Excel / CSV
              </h3>
              <p className="text-xs text-slate-500">
                Tải lên tệp số liệu thực tế (.xlsx, .xls, .csv) để cập nhật bảng điều khiển và biểu đồ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Current Status Pill if Custom Data */}
          {isCustomData && customMeta && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-900 font-medium">
                  Đang sử dụng dữ liệu tùy chỉnh: <strong>{customMeta.fileName}</strong> ({customMeta.rowsCount} dòng, {customMeta.months.join(', ')})
                </span>
              </div>
              <button
                onClick={handleResetData}
                className="flex items-center gap-1 text-slate-600 hover:text-rose-600 font-medium transition cursor-pointer underline underline-offset-2 ml-2 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục gốc</span>
              </button>
            </div>
          )}

          {/* Upload Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="p-3 bg-white rounded-full shadow-xs border border-slate-100 text-blue-600">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Kéo thả tệp Excel hoặc CSV vào đây, hoặc{' '}
                <span className="text-blue-600 underline underline-offset-2">bấm để chọn file</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Hỗ trợ định dạng: <strong>.xlsx, .xls, .csv</strong> (Tự động nhận diện tên cột tiếng Việt/Anh)
              </p>
            </div>
            {selectedFile && (
              <div className="mt-1 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {/* Parsing Spinner */}
          {parsing && (
            <div className="flex items-center justify-center gap-2.5 py-4 text-xs font-medium text-slate-600">
              <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Đang đọc và phân tích tệp dữ liệu...</span>
            </div>
          )}

          {/* Parse Error */}
          {parseError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Lỗi đọc tệp:</strong>
                <span>{parseError}</span>
              </div>
            </div>
          )}

          {/* Success Notification */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Parse Result Summary & Mode Selection */}
          {parseResult && (
            <div className="space-y-4 border border-slate-200/80 rounded-xl p-4 bg-slate-50/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Kết Quả Phân Tích Tệp
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {parseResult.summary.totalRows} dòng hợp lệ
                </span>
              </div>

              {/* Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-medium">Kỳ ghi nhận</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5 font-mono">
                    {parseResult.summary.months.join(', ')}
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-medium">Tổng Pageviews</div>
                  <div className="text-xs font-bold text-emerald-600 mt-0.5 font-mono">
                    {parseResult.summary.totalPV.toLocaleString('vi-VN')}
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-medium">Tổng bài viết</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5 font-mono">
                    {parseResult.summary.totalArticles.toLocaleString('vi-VN')}
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-medium">Số chuyên mục</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5 font-mono">
                    {parseResult.summary.folderCount} ban
                  </div>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Phương thức nạp dữ liệu:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <label
                    onClick={() => setImportMode('merge')}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      importMode === 'merge'
                        ? 'bg-blue-50/70 border-blue-300 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold block">Cập nhật theo tháng (Khuyên dùng)</span>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        Chỉ ghi đè các tháng có trong tệp Excel (ví dụ T8/2026), giữ nguyên dữ liệu các tháng cũ để tính Trung vị chuẩn xác.
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportMode('replace')}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      importMode === 'replace'
                        ? 'bg-blue-50/70 border-blue-300 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold block">Thay thế toàn bộ cơ sở dữ liệu</span>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        Xóa sạch dữ liệu hiện tại và chỉ sử dụng các dòng có trong tệp tải lên.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Sample Rows Preview */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Xem trước 5 dòng đầu tiên:</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                    ✓ Tổng PV lấy chính xác từ cột <strong>Pageviews</strong> (không lấy từ Pageviews ($))
                  </span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-left text-[11px] text-slate-700">
                    <thead className="bg-slate-50 text-[10px] text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2.5">Tháng</th>
                        <th className="py-2 px-2.5">ID Ban</th>
                        <th className="py-2 px-2.5">Chuyên Mục</th>
                        <th className="py-2 px-2.5 text-right">Bài Viết</th>
                        <th className="py-2 px-2.5 text-right text-blue-700 font-bold bg-blue-50/50">Tổng Pageviews</th>
                        <th className="py-2 px-2.5 text-right text-emerald-700">PV ($) Ads</th>
                        <th className="py-2 px-2.5 text-right text-slate-600">PV (-$) NoAds</th>
                        <th className="py-2 px-2.5 text-right">In-Home</th>
                        <th className="py-2 px-2.5 text-right">Mobile</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
                      {parseResult.sampleRows.slice(0, 5).map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-1.5 px-2.5 text-slate-600">{r.month}</td>
                          <td className="py-1.5 px-2.5 text-slate-500">{r.folder_id}</td>
                          <td className="py-1.5 px-2.5 font-sans font-medium text-slate-800">
                            {r.folder}
                          </td>
                          <td className="py-1.5 px-2.5 text-right">{r.articles?.toLocaleString('vi-VN')}</td>
                          <td className="py-1.5 px-2.5 text-right font-bold text-blue-900 bg-blue-50/30">
                            {r.pageviews?.toLocaleString('vi-VN')}
                          </td>
                          <td className="py-1.5 px-2.5 text-right text-emerald-700 font-medium">
                            {r.pageviewsAds?.toLocaleString('vi-VN')}
                          </td>
                          <td className="py-1.5 px-2.5 text-right text-slate-500 font-medium">
                            {r.pageviewsNoAds?.toLocaleString('vi-VN')}
                          </td>
                          <td className="py-1.5 px-2.5 text-right text-slate-600">
                            {r.pInHome?.toLocaleString('vi-VN')}
                          </td>
                          <td className="py-1.5 px-2.5 text-right text-slate-600">
                            {r.pMobile?.toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Quick Helper Links: Download Template / Export Current */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={downloadExcelTemplate}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file mẫu Excel (.xlsx)</span>
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={handleExportCurrent}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 font-medium transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Xuất dữ liệu hiện tại ra Excel</span>
              </button>
            </div>
            {isCustomData && (
              <button
                onClick={handleResetData}
                className="text-rose-600 hover:text-rose-700 font-medium transition cursor-pointer"
              >
                Khôi phục về dữ liệu gốc
              </button>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={!parseResult || parseResult.records.length === 0 || parsing}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer ${
              !parseResult || parseResult.records.length === 0 || parsing
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Xác Nhận Nạp Dữ Liệu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
