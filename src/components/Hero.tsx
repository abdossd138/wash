import React from 'react';
import { Sparkles, ArrowLeft, Search, ShieldCheck, Flame, Clock, Award, CheckCircle2, Car } from 'lucide-react';
import { AppSettings } from '../types';

interface HeroProps {
  settings: AppSettings;
  onStartBooking: () => void;
  onStartCarBooking?: () => void;
  onTrackOrder: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  settings,
  onStartBooking,
  onStartCarBooking,
  onTrackOrder,
}) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:py-20 cyber-grid-bg">
      {/* Background ambient light orbs */}
      <div className="absolute top-1/4 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Top Cyber Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 text-xs sm:text-sm font-semibold shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>مغسلة CleanPro المتطورة: سجاد ومفروشات فاخرة + سيارات متنقلة</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300 font-normal">تقنية النانو بخار 120°C</span>
          </div>

          {/* Minimalist Glowing Animated Center Logo */}
          <div className="flex flex-col items-center justify-center pt-2 pb-2">
            <button
              onClick={() => {
                const el = document.getElementById('service-selection-cards');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else onStartBooking();
              }}
              className="group relative cursor-pointer focus:outline-none transition-transform duration-500 hover:scale-105 active:scale-95"
              title="اضغط على الشعار لاختيار الخدمة (سجاد أو عربيات)"
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
              <span>اضغط على الشعار لاختيار الخدمة: سجاد أو سيارات</span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight font-['Alexandria',sans-serif]">
            غسيل سجاد ومفروشات & سيارات
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400">
              بالبخار والتعقيم الفندقي المتطور
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            خدمات متكاملة تحت سقف واحد: عناية ملكية بالسجاد والمفروشات + مغسلة سيارات احترافية متنقلة تصلك لباب بيتك أو في مقر المغسلة.
          </p>

          {/* DUAL SERVICE CHOICE CARDS (سجاد vs عربيات) */}
          <div id="service-selection-cards" className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4 scroll-mt-24">
            
            {/* 1. Carpets Card */}
            <button
              onClick={onStartBooking}
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-cyan-950/60 border border-cyan-500/40 hover:border-cyan-400 text-right group transition-all duration-300 shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white font-['Alexandria',sans-serif] group-hover:text-cyan-300 transition-colors">
                  🧺 غسيل سجاد ومفروشات
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  حاسبة أسعار فورية للسجاد، المشايات، الكنب، البطاطين مع تعقيم بالبخار 120°C واستلام منزلي.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-cyan-400">
                <span>احسب التكلفة واطلب الآن</span>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            {/* 2. Cars Card */}
            <button
              onClick={onStartCarBooking || onStartBooking}
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-purple-950/60 border border-purple-500/40 hover:border-purple-400 text-right group transition-all duration-300 shadow-lg hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  <Car className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white font-['Alexandria',sans-serif] group-hover:text-purple-300 transition-colors">
                  🚗 غسيل وخدمات سيارات
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  اختار نوع وموديل عربيتك، وحدد الخدمات: غسيل برة، جوة، شنطة، شاسيه تحت العربية، وتغيير زيت.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-purple-400">
                <span>اختار عربيتك والخدمات</span>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

          </div>

          {/* Quick Track order button */}
          <div className="pt-2">
            <button
              onClick={onTrackOrder}
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 hover:border-cyan-400/40 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span>تتبع حالة طلبك السابقة برقم الطلب البسيط (#1, #2)</span>
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
