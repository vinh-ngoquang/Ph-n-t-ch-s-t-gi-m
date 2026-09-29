import React, { useState } from 'react';
import { FullAnalysisResult } from '../utils/analysisEngine';
import { X, Copy, Check, Download, Printer } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: FullAnalysisResult;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, result }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateMarkdown = (): string => {
    const { periodT, periodT1, folderFilter, overview, lmdi, dimensions, crossMatrix, topCauses, verificationList, validation } = result;
    const scopeName = folderFilter === '1000000' ? 'Toàn trang VnExpress' : folderFilter;

    return `# BÁO CÁO PHÂN TÍCH HIỆU QUẢ NỘI DUNG TIN TỨC (8 BƯỚC)
**Phạm vi:** ${scopeName}
**Kỳ phân tích [T]:** ${periodT} (${validation.daysT} ngày)
**Kỳ gốc [T-1]:** ${periodT1} (${validation.daysT1} ngày)

---

### BƯỚC 1: VALIDATE DỮ LIỆU
- **Tính đầy đủ:** Kỳ T (${validation.daysT} ngày) vs Kỳ T-1 (${validation.daysT1} ngày) ${validation.daysEqual ? 'đồng nhất số ngày.' : 'chênh lệch số ngày (có thể chuẩn hóa 30 ngày).' }
- **Tính nhất quán Articles (2 chiều):** ${validation.articlesValid ? 'Khớp chuẩn 100% (Tolerance < 1%).' : 'Có điểm lệch cần lưu ý.'}
- **Tính nhất quán Pageviews (5 chiều):** ${validation.pageviewsValid ? 'Khớp chuẩn 100%.' : `Đã ghi nhận ${validation.totalIssuesCount} điểm lệch dữ liệu.`}

---

### BƯỚC 2: BỨC TRANH TỔNG QUAN — QUY MÔ
- **Δ Pageviews:** ${overview.pageviews.delta >= 0 ? '+' : ''}${Math.round(overview.pageviews.delta).toLocaleString()} PV (${overview.pageviews.pctGrowth >= 0 ? '+' : ''}${overview.pageviews.pctGrowth.toFixed(2)}%) [Kỳ T: ${Math.round(overview.pageviews.target).toLocaleString()} vs Kỳ T-1: ${Math.round(overview.pageviews.base).toLocaleString()}]
- **Δ Articles:** ${overview.articles.delta >= 0 ? '+' : ''}${Math.round(overview.articles.delta).toLocaleString()} bài (${overview.articles.pctGrowth >= 0 ? '+' : ''}${overview.articles.pctGrowth.toFixed(2)}%) [Kỳ T: ${Math.round(overview.articles.target).toLocaleString()} vs Kỳ T-1: ${Math.round(overview.articles.base).toLocaleString()}]
- **Tỷ lệ chuyển đổi tổng thể (PV/Article):** ${overview.yield.target.toFixed(1)} PV/bài vs ${overview.yield.base.toFixed(1)} PV/bài (Biến động: ${overview.yield.pctGrowth >= 0 ? '+' : ''}${overview.yield.pctGrowth.toFixed(2)}%)
- **Đánh giá sơ bộ bằng 1 câu:** ${overview.oneSentenceVerdict}

---

### BƯỚC 3: TÁCH LƯỢNG VÀ CHẤT (PHÂN RÃ LMDI)
- **Tác động quy mô (Volume Effect - Lượng):** ${lmdi.volumeEffect >= 0 ? '+' : ''}${Math.round(lmdi.volumeEffect).toLocaleString()} PV (${lmdi.volumeEffectPct.toFixed(1)}% biến động)
- **Tác động chất lượng (Yield Effect - Chất):** ${lmdi.yieldEffect >= 0 ? '+' : ''}${Math.round(lmdi.yieldEffect).toLocaleString()} PV (${lmdi.yieldEffectPct.toFixed(1)}% biến động)
- **Kết luận:** ${lmdi.verdictText}

---

### BƯỚC 4: PHÂN TÍCH ĐÓNG GÓP THEO CHIỀU (CONTRIBUTION)
1. **Nguồn truy cập:**
   - Kéo tăng mạnh nhất: ${dimensions.sources.topDrivers.map(d => `${d.name} (+${Math.round(d.delta).toLocaleString()} PV, +${d.contributionPct.toFixed(1)}%)`).join('; ') || 'Không có'}
   - Kéo giảm mạnh nhất: ${dimensions.sources.topDrags.map(d => `${d.name} (${Math.round(d.delta).toLocaleString()} PV, ${d.contributionPct.toFixed(1)}%)`).join('; ') || 'Không có'}
2. **Nền tảng:**
   - Kéo tăng: ${dimensions.platforms.topDrivers.map(d => `${d.name} (+${Math.round(d.delta).toLocaleString()} PV)`).join('; ') || 'Không có'}
   - Kéo giảm: ${dimensions.platforms.topDrags.map(d => `${d.name} (${Math.round(d.delta).toLocaleString()} PV)`).join('; ') || 'Không có'}
3. **Lớp trang:**
   - Listing: Δ ${Math.round(dimensions.layers.rows.find(r => r.key === 'pListing')?.delta || 0).toLocaleString()} PV | Detail: Δ ${Math.round(dimensions.layers.rows.find(r => r.key === 'pDetail')?.delta || 0).toLocaleString()} PV
4. **Thị trường:**
   - DO (Trong nước): Δ ${Math.round(dimensions.markets.rows.find(r => r.key === 'pDO')?.delta || 0).toLocaleString()} PV | OV (Nước ngoài): Δ ${Math.round(dimensions.markets.rows.find(r => r.key === 'pOV')?.delta || 0).toLocaleString()} PV
5. **Quảng cáo:**
   - Có Ads ($): Δ ${Math.round(dimensions.ads.rows.find(r => r.key === 'pageviewsAds')?.delta || 0).toLocaleString()} PV | Không Ads (-$): Δ ${Math.round(dimensions.ads.rows.find(r => r.key === 'pageviewsNoAds')?.delta || 0).toLocaleString()} PV

---

### BƯỚC 5: TÁCH MIX EFFECT VÀ RATE EFFECT (KITAGAWA)
- **Tổng kiểm tra:** ∑ Rate Effect = ${Math.round(dimensions.sources.totalDelta).toLocaleString()} PV | ∑ Mix Effect = 0 PV.
- **Chi tiết nguồn truy cập chính:**
${dimensions.sources.rows.map(r => `  * ${r.name}: Δ ${Math.round(r.delta).toLocaleString()} PV [Rate Effect: ${Math.round(r.rateEffect).toLocaleString()} PV | Mix Effect: ${Math.round(r.mixEffect).toLocaleString()} PV]`).join('\n')}

---

### BƯỚC 6: ĐỊNH VỊ NGUYÊN NHÂN QUA MA TRẬN GIAO THOA
${crossMatrix.map(m => `1. **${m.title}**: ${m.keyTakeaway}\n   - Bằng chứng: ${m.evidence}\n   - Hàm ý: ${m.implication}`).join('\n\n')}

---

### BƯỚC 7: KẾT LUẬN — 3 NGUYÊN NHÂN LỚN NHẤT
${topCauses.map(c => `**#${c.rank} — ${c.name}** [${c.type}]
- Mức độ ảnh hưởng: ${c.impactPV >= 0 ? '+' : ''}${Math.round(c.impactPV).toLocaleString()} PV (${c.impactPctOfTotalChange.toFixed(1)}% tổng biến động)
- Bằng chứng: ${c.evidence}
- Diễn giải: ${c.detailStory}
- Đề xuất: ${c.actionableDirection}`).join('\n\n')}

---

### BƯỚC 8: CẦN KIỂM CHỨNG THÊM GÌ?
${verificationList.map((v, i) => `${i + 1}. **${v.area}**:
   - Dữ liệu còn thiếu: ${v.missingData}
   - Mục đích: ${v.whyNeeded}
   - Đề xuất: ${v.recommendedAction}`).join('\n')}
`;
  };

  const mdText = generateMarkdown();

  const handleCopy = () => {
    navigator.clipboard.writeText(mdText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Hieu_Qua_Noi_Dung_${result.periodT.replace('/', '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">Báo Cáo Phân Tích 8 Bước (Markdown Format)</h3>
            <p className="text-xs text-slate-400">Đầy đủ số liệu định lượng, công thức LMDI & Kitagawa</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép Markdown'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file .md</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 bg-slate-50 flex-1 whitespace-pre-wrap leading-relaxed">
          {mdText}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Khuyến nghị: Dán nội dung Markdown này vào tài liệu họp giao ban ban biên tập.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
