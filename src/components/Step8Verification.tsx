import React from 'react';
import { VerificationRequirement } from '../utils/analysisEngine';
import { HelpCircle, CheckSquare, EyeOff, Activity, ArrowRight, ShieldCheck } from 'lucide-react';

interface Step8VerificationProps {
  verificationList: VerificationRequirement[];
}

export const Step8Verification: React.FC<Step8VerificationProps> = ({ verificationList }) => {
  return (
    <section id="step-8-verification" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            08
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">BƯỚC 8: CẦN KIỂM CHỨNG THÊM GÌ? (BLIND SPOTS & NEXT STEPS)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Chỉ ra các điểm mù của dataset hiện tại và đề xuất hành động đo lường tiếp theo để tránh suy đoán thiếu căn cứ.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-md border border-amber-200">
          Nguyên tắc: Không suy đoán khi thiếu dữ liệu
        </span>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-4">
          {verificationList.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <EyeOff className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900">{item.area}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-semibold block text-[11px] mb-1 uppercase tracking-wider">
                    Dữ liệu còn thiếu (Blind Spot)
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium">{item.missingData}</p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-semibold block text-[11px] mb-1 uppercase tracking-wider">
                    Lý do cần kiểm chứng
                  </span>
                  <p className="text-slate-700 leading-relaxed">{item.whyNeeded}</p>
                </div>

                <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100">
                  <span className="text-indigo-900 font-semibold block text-[11px] mb-1 uppercase tracking-wider">
                    Hành động đề xuất kế tiếp
                  </span>
                  <p className="text-indigo-950 font-medium leading-relaxed">{item.recommendedAction}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Closing principle callout */}
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>Kỷ luật Data Analyst:</strong> Toàn bộ 7 bước phân tích trước đó đều gắn với dữ liệu định lượng cụ thể. Các yếu tố chưa có số liệu được giữ nguyên trạng tại Bước 8 để đối soát bổ sung.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
