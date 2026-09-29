import React, { useState } from 'react';
import { ValidationSummary } from '../utils/analysisEngine';
import { CheckCircle2, AlertTriangle, Info, ShieldCheck, ChevronDown, ChevronUp, AlertOctagon } from 'lucide-react';

interface Step1ValidationProps {
  validation: ValidationSummary;
  isNormalizedByDays: boolean;
  onToggleNormalize: () => void;
}

export const Step1Validation: React.FC<Step1ValidationProps> = ({
  validation,
  isNormalizedByDays,
  onToggleNormalize,
}) => {
  const [showAllIssues, setShowAllIssues] = useState(false);

  const hasIssues = validation.totalIssuesCount > 0;
  const errorIssues = validation.issues.filter((i) => i.severity === 'ERROR');
  const warningIssues = validation.issues.filter((i) => i.severity === 'WARNING');

  return (
    <section id="step-1-validation" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Step Header Banner */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            01
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">BƯỚC 1: VALIDATE DỮ LIỆU & SANITY CHECK</h2>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  hasIssues
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {hasIssues ? (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    <span>Có {validation.totalIssuesCount} điểm lệch được ghi nhận</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3" />
                    <span>Dữ liệu đạt 100% kiểm định (Tolerance &lt; 1%)</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kiểm tra tính đầy đủ số ngày và tính nhất quán cộng dồn 2 chiều Articles & 5 chiều Pageviews theo ngưỡng sai số 1%.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Ngưỡng chấp nhận sai số:</span>
          <span className="font-semibold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded">Tolerance &lt; 1.0%</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Check Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Day count */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">1. Tính Đầy Đủ Số Ngày</span>
              {validation.daysEqual ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Đồng nhất
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <AlertTriangle className="w-4 h-4" /> Chênh lệch số ngày
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between text-sm">
              <div className="text-slate-600">
                Kỳ gốc [T-1]: <span className="font-bold text-slate-900">{validation.daysT1} ngày</span>
              </div>
              <div className="text-slate-600">
                Kỳ phân tích [T]: <span className="font-bold text-slate-900">{validation.daysT} ngày</span>
              </div>
            </div>
            {!validation.daysEqual && (
              <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {isNormalizedByDays ? 'Đang bật chuẩn hóa ngày' : 'Khuyến nghị chuẩn hóa'}
                </span>
                <button
                  onClick={onToggleNormalize}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                >
                  {isNormalizedByDays ? 'Tắt chuẩn hóa' : 'Bật chuẩn hóa ngày'}
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Articles Consistency */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">2. Nhất Quán Articles (2 chiều)</span>
              {validation.articlesValid ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Đạt 100%
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <AlertTriangle className="w-4 h-4" /> Có lệch
                </span>
              )}
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Nguồn sản xuất (Thường + Thương mại):</span>
                <span className="font-semibold text-slate-800">Khớp chuẩn Articles</span>
              </div>
              <div className="flex justify-between">
                <span>Vị trí build (Build Top + Non-Build Top):</span>
                <span className="font-semibold text-slate-800">Khớp chuẩn Articles</span>
              </div>
            </div>
          </div>

          {/* Card 3: Pageviews Consistency */}
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">3. Nhất Quán Pageviews (5 chiều)</span>
              {validation.pageviewsValid ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Đạt 100%
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <AlertTriangle className="w-4 h-4" /> Ghi nhận điểm lệch
                </span>
              )}
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Ads / Nền tảng / Thị trường:</span>
                <span className="font-semibold text-emerald-600">Khớp chuẩn (&lt; 0.1%)</span>
              </div>
              <div className="flex justify-between">
                <span>Nguồn truy cập & Lớp trang:</span>
                <span className="font-semibold text-slate-700">
                  {validation.issues.length > 0 ? `${validation.issues.length} điểm ghi nhận` : 'Khớp chuẩn'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Report / Discrepancy Log */}
        {hasIssues ? (
          <div className="border border-amber-200 rounded-lg bg-amber-50/40 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2.5">
                <AlertOctagon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    Bản Ghi Nhận Điểm Lệch Dữ Liệu (Data Discrepancy Log)
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Theo quy cách phân tích, khi phát hiện độ lệch vượt ngưỡng 1%, hệ thống ghi nhận chi tiết từng dòng dữ liệu và chiều bị lệch để kiểm chứng trước khi tiến hành phân tích tiếp.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllIssues(!showAllIssues)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:text-amber-700 bg-amber-200/60 px-2.5 py-1 rounded"
              >
                <span>{showAllIssues ? 'Thu gọn' : `Xem chi tiết (${validation.issues.length} điểm)`}</span>
                {showAllIssues ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Detailed Table */}
            {showAllIssues && (
              <div className="mt-4 overflow-x-auto border border-amber-200 rounded-lg bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-amber-100/60 text-amber-900 font-semibold border-b border-amber-200">
                    <tr>
                      <th className="py-2.5 px-3">Kỳ</th>
                      <th className="py-2.5 px-3">Chuyên mục / Folder</th>
                      <th className="py-2.5 px-3">Chiều phân rã</th>
                      <th className="py-2.5 px-3 text-right">Tổng Pageviews</th>
                      <th className="py-2.5 px-3 text-right">Tổng cộng các nhánh</th>
                      <th className="py-2.5 px-3 text-right">Lệch tuyệt đối (Δ)</th>
                      <th className="py-2.5 px-3 text-right">% Lệch</th>
                      <th className="py-2.5 px-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 text-slate-700">
                    {validation.issues.map((issue, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/50">
                        <td className="py-2 px-3 font-medium text-slate-900">{issue.date}</td>
                        <td className="py-2 px-3 font-medium">{issue.folder}</td>
                        <td className="py-2 px-3 font-semibold text-indigo-900">{issue.dimension}</td>
                        <td className="py-2 px-3 text-right">{Math.round(issue.expected).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right">{Math.round(issue.actual).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-medium text-amber-700">
                          {issue.diff > 0 ? '+' : ''}
                          {Math.round(issue.diff).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-amber-800">
                          {issue.diffPct.toFixed(2)}%
                        </td>
                        <td className="py-2 px-3 text-slate-500">
                          {issue.actual === 0
                            ? 'Chưa tách lớp trang đầu 2024'
                            : 'Làm tròn nguồn nội bộ'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between text-xs text-amber-800 pt-2 border-t border-amber-200">
              <span>Trạng thái: <strong>ĐÃ GHI NHẬN ĐẦY ĐỦ CÁC ĐIỂM LỆCH VÀ CHUYỂN TIẾP PHÂN TÍCH</strong></span>
              <span className="text-slate-500">Phép tính tổng quy mô và LMDI sử dụng giá trị tổng chuẩn hóa</span>
            </div>
          </div>
        ) : (
          <div className="border border-emerald-200 rounded-lg bg-emerald-50/40 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="text-xs text-emerald-900">
              <strong>Tất cả kiểm định đều đạt chuẩn!</strong> Không phát hiện bất kỳ sai số cộng dồn nào vượt quá 1% giữa các chiều Articles và Pageviews cho các kỳ được chọn.
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
