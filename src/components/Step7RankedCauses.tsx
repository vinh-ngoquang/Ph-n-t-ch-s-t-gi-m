import React from 'react';
import { RankedCauseItem } from '../utils/analysisEngine';
import { Award, Compass, ExternalLink, Lightbulb, ArrowUpRight, TrendingDown, CheckCircle2 } from 'lucide-react';

interface Step7RankedCausesProps {
  topCauses: RankedCauseItem[];
}

export const Step7RankedCauses: React.FC<Step7RankedCausesProps> = ({ topCauses }) => {
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-amber-500 text-white ring-4 ring-amber-100';
      case 2:
        return 'bg-slate-400 text-white ring-4 ring-slate-100';
      case 3:
        return 'bg-amber-700 text-white ring-4 ring-amber-100';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  return (
    <section id="step-7-ranked-causes" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            07
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">BƯỚC 7: KẾT LUẬN — 3 NGUYÊN NHÂN LỚN NHẤT</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Xếp hạng 3 nguyên nhân cốt lõi theo mức độ ảnh hưởng giảm dần, phân định rõ Nội tại vs Ngoại cảnh kèm bằng chứng số liệu.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {topCauses.map((cause) => (
          <div
            key={cause.rank}
            className="p-5 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50/70 via-white to-white relative shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs flex-shrink-0 ${getRankBadge(
                    cause.rank
                  )}`}
                >
                  #{cause.rank}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">{cause.name}</h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    cause.type === 'NỘI TẠI'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {cause.type}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
                  Tác động: {cause.impactPV >= 0 ? '+' : ''}{Math.round(cause.impactPV).toLocaleString()} PV
                </span>
              </div>
            </div>

            {/* Evidence & Story */}
            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-3 bg-slate-100/70 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block mb-1">📊 Bằng chứng số liệu (từ Bước 3-6):</strong>
                <p className="font-mono text-slate-800 leading-relaxed">{cause.evidence}</p>
              </div>

              <p className="leading-relaxed text-slate-600">
                <strong className="text-slate-800">Diễn giải bản chất:</strong> {cause.detailStory}
              </p>

              <div className="pt-2 flex items-start gap-1.5 text-indigo-700 font-medium">
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Đề xuất can thiệp:</strong> {cause.actionableDirection}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
