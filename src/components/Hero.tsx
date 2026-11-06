import React from 'react';
import { Sparkles, ArrowLeft, Search, ShieldCheck, Flame, Clock, Award, CheckCircle2 } from 'lucide-react';
import { AppSettings } from '../types';

interface HeroProps {
  settings: AppSettings;
  onStartBooking: () => void;
  onTrackOrder: () => void;
}

export const Hero: React.FC<HeroProps> = ({ settings, onStartBooking, onTrackOrder }) => {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 lg:py-24 cyber-grid-bg">
      {/* Background ambient light orbs */}
      <div className="absolute top-1/4 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Top Cyber Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 text-xs sm:text-sm font-semibold shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>العناية الملكية بالسجاد والمفروشات الفاخرة</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300 font-normal">تقنية النانو بخار والأوزون</span>
          </div>

          {/* Minimalist Glowing Animated Center Logo */}
          <div className="flex flex-col items-center justify-center pt-2 pb-2">
            <button
              onClick={onStartBooking}
              className="group relative cursor-pointer focus:outline-none transition-transform duration-500 hover:scale-105 active:scale-95"
              title="اضغط على الشعار التفاعلي لبدء الحجز الفوري"
            >
              {/* Outer pulsing radiant rings */}
              <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-cyan-500/30 via-purple-500/25 to-teal-400/30 blur-2xl group-hover:blur-3xl animate-pulse transition-all duration-700" />
              <div className="absolute -inset-3 rounded-full bg-cyan-400/20 blur-md opacity-40 animate-ping pointer-events-none" />
              
              {/* Core Emblem */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-[#111827] via-[#0A0F1D] to-[#1E1B4B] border-2 border-cyan-400/60 shadow-[0_0_40px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_70px_rgba(6,182,212,0.7)] group-hover:border-cyan-300 flex flex-col items-center justify-center transition-all duration-300">
                <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-400 group-hover:rotate-12 group-hover:text-cyan-300 transition-all duration-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
                <span className="text-[11px] sm:text-xs font-black tracking-wide text-cyan-300 font-['Alexandria',sans-serif] mt-1.5 text-center px-1 truncate max-w-[90%]">
                  {settings.brandName || 'CleanPro Express'}
                </span>
              </div>
            </button>
            <div className="text-xs text-slate-400 mt-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>اضغط على الشعار التفاعلي لبدء الحجز السريع</span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight font-['Alexandria',sans-serif]">
            غسيل وتعقيم السجاد والمفروشات
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400">
              بأعلى معايير النظافة الفندقية
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            نعتني بأدق تفاصيل السجاد العجمي، التركي، والحرير مع إزالة البقع المستعصية والتعقيم الحراري تحت 120°C. استلام وتوصيل منزلي مريح أو تسليم مباشر بالفرع.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onStartBooking}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300 flex items-center justify-center gap-3 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>احسب التكلفة واطلب الخدمة</span>
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              onClick={onTrackOrder}
              className="w-full sm:w-auto px-7 py-4 rounded-xl text-base font-bold text-slate-200 bg-slate-900/80 border border-slate-700/80 hover:border-cyan-400/50 hover:text-white transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"
            >
              <Search className="w-5 h-5 text-cyan-400" />
              <span>تتبع حالة طلبك برقم الطلب البسيط (#)</span>
            </button>
          </div>

          {/* Feature Pillars Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-12">
            
            <div className="glass-panel p-4 rounded-xl border border-slate-800/80 hover:border-cyan-500/30 transition-all text-right space-y-2 group">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <h4 className="text-sm font-bold text-white">تسليم 48 ساعة</h4>
              <p className="text-xs text-slate-400">طرد مركزي فائق وتجفيف حراري فوري بدون أي رطوبة.</p>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800/80 hover:border-purple-500/30 transition-all text-right space-y-2 group">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5 text-purple-400" />
              </div>
              <h4 className="text-sm font-bold text-white">تعقيم 120°C</h4>
              <p className="text-xs text-slate-400">القضاء على 99.9% من الجراثيم وحشرات الفراش بالأوزون والبخار.</p>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800/80 hover:border-cyan-500/30 transition-all text-right space-y-2 group">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
              </div>
              <h4 className="text-sm font-bold text-white">حماية ألياف الحرير</h4>
              <p className="text-xs text-slate-400">منظفات ألمانية بيولوجية تحافظ على نعومة وثبات الألوان الأصلية.</p>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-slate-800/80 hover:border-purple-500/30 transition-all text-right space-y-2 group">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-white">تغليف فندقي فاخر</h4>
              <p className="text-xs text-slate-400">تعطير فرنسي وتغليف سميك عازل للأتربة والغبار.</p>
            </div>

          </div>

          {/* Quick reassurance list (No fake discounts) */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-4 text-xs sm:text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              خيارات استلام منزلي أو بالفرع
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              أرقام تتبع تسلسلية بسيطة (#1, #2, #14)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              دفع عند المعاينة والاستلام
            </span>
          </div>

        </div>
      </div>
    </section>
  );
};
