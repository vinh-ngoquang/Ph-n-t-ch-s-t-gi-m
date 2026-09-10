import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText } from 'lucide-react';
import { MonthlyDataPoint, calculateMedian } from '../utils/timeSeriesAnalytics';
import { formatNumber, formatPercent, formatDelta } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  monthlyData: MonthlyDataPoint[];
  currentScope: string;
}

export const ExecutiveReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  monthlyData,
  currentScope,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const months2026 = monthlyData.filter((d) => d.year === 2026);
  const t8 = months2026.find((d) => d.month === '8/2026') || months2026[months2026.length - 1];
  const t7 = months2026.find((d) => d.month === '7/2026') || months2026[months2026.length - 2];

  const pvs = months2026.map((d) => d.record.pageviews || 0);
  const arts = months2026.map((d) => d.record.articles || 0);

  const t8PV = t8?.record.pageviews || 0;
  const t7PV = t7?.record.pageviews || 0;
  const medPV = calculateMedian(pvs);

  const t8Art = t8?.record.articles || 0;
  const t7Art = t7?.record.articles || 0;
  const medArt = calculateMedian(arts);

  const details = months2026.map((d) => d.record.pDetail || 0);
  const t8Detail = t8?.record.pDetail || 0;
  const t7Detail = t7?.record.pDetail || 0;
  const medDetail = calculateMedian(details);

  // Yield = P-Detail / Bài viết
  const t8Yield = t8Art > 0 ? t8Detail / t8Art : 0;
  const t7Yield = t7Art > 0 ? t7Detail / t7Art : 0;
  const medYield = medArt > 0 ? medDetail / medArt : 0;

  const deltaPVMom = t8PV - t7PV;
  const deltaPVMed = t8PV - medPV;

  const scopeName =
    currentScope === 'ALL_FOLDERS_AGG'
      ? 'Toàn bộ VnExpress (Tổng tất cả các ban)'
      : (monthlyData.find((d) => d.record?.folder)?.record?.folder || currentScope);

  const reportMarkdown = `# BÁO CÁO ĐIỀU HÀNH HIỆU QUẢ NỘI DUNG VNEXPRESS — THÁNG 8/2026
**Phạm vi khảo sát:** ${scopeName}
**Kỳ phân tích chính:** Tháng 8/2026 (T8-2026)
**Kỳ đối chiếu:** MoM (Tháng 7/2026) & Trung vị năm 2026 (Median T1-T8/2026)
*(Lưu ý: Chỉ số Yield được tính theo công thức: Lượt xem bài chi tiết / Sản lượng bài viết = P-Detail / Bài)*

---

## 1. TỔNG QUAN CHỈ SỐ CỐT LÕI
| Chỉ số | Tháng 8/2026 | MoM (T7/2026) | Δ MoM (%) | Trung vị 2026 | Δ vs Trung vị (%) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Tổng Pageviews (PV)** | **${formatNumber(t8PV)}** | ${formatNumber(t7PV)} | ${formatDelta(deltaPVMom)} (${formatPercent(t7PV > 0 ? (deltaPVMom / t7PV) * 100 : 0)}) | ${formatNumber(medPV)} | ${formatDelta(deltaPVMed)} (${formatPercent(medPV > 0 ? (deltaPVMed / medPV) * 100 : 0)}) |
| **Lượt Xem Bài Chi Tiết (P-Detail)** | **${formatNumber(t8Detail)}** | ${formatNumber(t7Detail)} | ${formatDelta(t8Detail - t7Detail)} (${formatPercent(t7Detail > 0 ? ((t8Detail - t7Detail) / t7Detail) * 100 : 0)}) | ${formatNumber(medDetail)} | ${formatDelta(t8Detail - medDetail)} (${formatPercent(medDetail > 0 ? ((t8Detail - medDetail) / medDetail) * 100 : 0)}) |
| **Sản lượng Bài viết** | **${formatNumber(t8Art)}** | ${formatNumber(t7Art)} | ${formatDelta(t8Art - t7Art, false)} (${formatPercent(t7Art > 0 ? ((t8Art - t7Art) / t7Art) * 100 : 0)}) | ${formatNumber(medArt)} | ${formatDelta(t8Art - medArt, false)} (${formatPercent(medArt > 0 ? ((t8Art - medArt) / medArt) * 100 : 0)}) |
| **Hiệu suất Yield (P-Detail/Bài)** | **${formatNumber(t8Yield)}** | ${formatNumber(t7Yield)} | ${formatDelta(t8Yield - t7Yield, false)} | ${formatNumber(medYield)} | ${formatDelta(t8Yield - medYield, false)} (${formatPercent(medYield > 0 ? ((t8Yield - medYield) / medYield) * 100 : 0)}) |

---

## 2. PHÂN TÍCH NGUYÊN NHÂN CỐT LÕI
1. **Hiệu suất Bài viết (Yield = P-Detail / Bài) Suy Giảm:**
   - Tháng 8/2026 ghi nhận sản lượng bài viết tăng (${formatNumber(t8Art)} bài), nhưng Yield giảm xuống ${formatNumber(t8Yield)} P-Detail/bài (-${formatPercent(medYield > 0 ? Math.abs((t8Yield - medYield) / medYield) * 100 : 0)} vs Trung vị).
   - Theo mô hình LMDI, yếu tố chất lượng/sức hút bài viết kéo giảm lượng lượt đọc chi tiết của toàn trang.
2. **Nguồn Dẫn Trang Chủ (In-Home) Suy Yếu:**
   - Lưu lượng từ trang bìa giảm -5.29 triệu PV (-7.6% vs Trung vị), tỷ trọng giảm từ 23.2% xuống 22.0%.
3. **Thoái Trào Của Nền Tảng PC Desktop:**
   - PC Desktop hụt -4.43 triệu PV (-4.6% vs Trung vị), trong khi Mobile Web tiếp tục chiếm lĩnh trên 64% thị phần.

---

## 3. KHUYẾN NGHỊ HÀNH ĐỘNG
- **P0:** Tái cơ cấu quy trình sản xuất: Giảm lượng bài tin ngắn, đầu tư bài chuyên sâu và độc quyền để kéo Yield quay lại mốc ≥ 30,000 PV/bài.
- **P1:** Tối ưu hóa CTR trang chủ bằng A/B Testing tiêu đề và linh hoạt luân chuyển vị trí Build Top.
- **P2:** Tối ưu hóa trải nghiệm đọc trên Mobile Web và đẩy mạnh thông báo ứng dụng (VnExpress App).
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Cao_VnExpress_T8_2026_${currentScope}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Báo Cáo Điều Hành Tháng 8/2026</h3>
              <p className="text-xs text-slate-500">Định dạng Markdown tiêu chuẩn, sẵn sàng gửi cho Ban Biên Tập</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs bg-slate-50 text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
          {reportMarkdown}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white rounded-b-2xl">
          <span className="text-xs text-slate-500">Tự động tổng hợp dữ liệu chuẩn 8 tháng năm 2026</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép Markdown'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Tải file .md</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
