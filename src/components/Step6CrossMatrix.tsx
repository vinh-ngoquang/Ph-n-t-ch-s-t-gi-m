import React from 'react';
import { CrossMatrixInsight } from '../utils/analysisEngine';
import { Grid, ArrowRight, Smartphone, Compass, Globe2, LayoutTemplate, ShieldAlert } from 'lucide-react';

interface Step6CrossMatrixProps {
  insights: CrossMatrixInsight[];
}

export const Step6CrossMatrix: React.FC<Step6CrossMatrixProps> = ({ insights }) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'source-x-platform':
        return <Smartphone className="w-5 h-5 text-blue-600" />;
      case 'layer-x-source':
        return <LayoutTemplate className="w-5 h-5 text-indigo-600" />;
      case 'market-x-source':
        return <Globe2 className="w-5 h-5 text-emerald-600" />;
      case 'source-x-buildtop':
        return <Compass className="w-5 h-5 text-amber-600" />;
      default:
        return <Grid className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <section id="step-6-cross-matrix" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            06
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">BƯỚC 6: ĐỊNH VỊ NGUYÊN NHÂN QUA MA TRẬN GIAO THOA</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Đối chiếu chéo 4 cặp chiều dữ liệu để tìm câu chuyện bản chất nhất quán về luồng traffic và hành vi độc giả.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                      {getIcon(insight.id)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{insight.title}</h3>
                      <span className="text-[11px] text-slate-500 font-medium">{insight.pairName}</span>
                    </div>
                  </div>
                </div>

                {/* Key Takeaway */}
                <div className="p-3 bg-white rounded-lg border border-slate-200/80 mb-3.5">
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    {insight.keyTakeaway}
                  </p>
                </div>

                {/* Supporting metrics pill tags */}
                <div className="grid grid-cols-2 gap-2 mb-3.5">
                  {insight.supportingData.map((d, i) => (
                    <div key={i} className="p-2 rounded bg-slate-100/80 border border-slate-200/60 text-xs">
                      <span className="text-slate-500 block text-[10px] truncate">{d.label}</span>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <strong className="text-slate-900">{d.value}</strong>
                        {d.delta && (
                          <span className="text-[11px] font-bold text-indigo-600">
                            {d.delta}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Implication */}
              <div className="pt-3 border-t border-slate-200 text-xs text-slate-600 flex items-start gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Hàm ý phân tích:</strong> {insight.implication}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
