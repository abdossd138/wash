import React from 'react';
import { Sparkles, Shield, Flame, Droplets, Wind, HeartHandshake } from 'lucide-react';

export const QualityFeatures: React.FC = () => {
  return (
    <section id="features" className="py-16 sm:py-20 relative border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>لماذا CleanPro Express؟</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white font-['Alexandria',sans-serif]">
            دورة غسيل متطورة تتجاوز الطرق التقليدية
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            نحن لا نقوم بمجرد تنظيف سطحي، بل نطبق بروتوكول غسيل وتعقيم علمي يضمن حماية أنسجة السجاد وإعادتها كأنها جديدة تماماً.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="glass-panel p-6 rounded-2xl border-slate-800 hover:border-cyan-500/40 transition-all duration-300 group space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Droplets className="w-7 h-7 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
              غسيل آلي بالفرش الدوارة المتوازنة
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              ماكينات هيدروليكية ذات فرش ناعمة ذات حركة دائرية متعاكسة تنفذ إلى أعماق النسيج دون أن تجرح وبرة الصوف أو تقطع الخيوط الحساسة.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-slate-800 hover:border-purple-500/40 transition-all duration-300 group space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wind className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
              طرد مركزي فائق وتجفيف حراري
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              حوض طرد مركزي يدور بسرعة 1400 لفة بالدقيقة لعصر 95% من المياه في ثوانٍ، يتبعه غرف تجفيف معقمة بدون تعريض السجاد لأشعة الشمس الحارقة أو الأتربة.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-slate-800 hover:border-rose-500/40 transition-all duration-300 group space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Flame className="w-7 h-7 text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
              تعقيم بالبخار الجاف 120°C والأوزون
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              إبادة فورية للميكروبات، عثة الفراش، وحبوب اللقاح المسببة للحساسية والربو باستخدام بخار عالي الحرارة بدون تبليل النسيج.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
