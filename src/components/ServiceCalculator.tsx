import React from 'react';
import {
  Sparkles,
  Layers,
  Armchair,
  CloudRain,
  ShieldCheck,
  Flame,
  Plus,
  Minus,
  RotateCcw,
  ShoppingBag,
  ArrowLeft,
  Package,
} from 'lucide-react';
import { DynamicService } from '../types';

interface ServiceCalculatorProps {
  services: DynamicService[];
  items: Record<string, number>;
  onUpdateCount: (serviceId: string, delta: number) => void;
  onReset: () => void;
  onProceedToForm: () => void;
}

export const ServiceCalculator: React.FC<ServiceCalculatorProps> = ({
  services,
  items,
  onUpdateCount,
  onReset,
  onProceedToForm,
}) => {
  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-cyan-400" />;
      case 'Layers':
        return <Layers className="w-6 h-6 text-teal-400" />;
      case 'Armchair':
        return <Armchair className="w-6 h-6 text-purple-400" />;
      case 'CloudRain':
        return <CloudRain className="w-6 h-6 text-blue-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-emerald-400" />;
      case 'Flame':
        return <Flame className="w-6 h-6 text-rose-400" />;
      default:
        return <Sparkles className="w-6 h-6 text-cyan-400" />;
    }
  };

  const totalItemsCount = Object.values(items).reduce((acc, count) => acc + (count || 0), 0);

  const subtotal = services.reduce((sum, srv) => {
    const count = items[srv.id] || 0;
    return sum + (srv.price * count);
  }, 0);

  return (
    <section id="calculator" className="py-12 sm:py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>الخطوة 1 من 3</span>
              <span>•</span>
              <span>اختيار الخدمات والمفروشات</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white font-['Alexandria',sans-serif]">
              حاسبة الأسعار الشفافة
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-1">
              حدد نوع وعدد القطع المطلوب تنظيفها أو تعقيمها لحساب التكلفة التقديرية بدقة.
            </p>
          </div>

          {totalItemsCount > 0 && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors self-start md:self-auto py-1 px-2.5 rounded-lg border border-rose-500/20 hover:border-rose-500/40 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط الأصناف</span>
            </button>
          )}
        </div>

        {/* Dynamic Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((srv) => {
            const currentCount = items[srv.id] || 0;
            const lineTotal = srv.price * currentCount;
            const isSelected = currentCount > 0;

            return (
              <div
                key={srv.id}
                className={`relative rounded-2xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? 'glass-panel-cyan shadow-[0_0_25px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/40'
                    : 'glass-panel border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center">
                      {getIcon(srv.icon)}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {srv.name}
                      </h3>
                      {srv.subname && (
                        <p className="text-xs text-cyan-400/80">{srv.subname}</p>
                      )}
                    </div>
                  </div>

                  {srv.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {srv.description}
                    </p>
                  )}

                  <div className="flex items-baseline gap-1.5 mb-5 pb-4 border-b border-slate-800/80">
                    <span className="text-2xl font-black text-white font-['Alexandria',sans-serif]">
                      {srv.price}
                    </span>
                    <span className="text-xs text-slate-400">جنيه مصري / {srv.unit}</span>
                  </div>
                </div>

                {/* Counter Controls */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-3 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => onUpdateCount(srv.id, -1)}
                      disabled={currentCount === 0}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                        currentCount === 0
                          ? 'text-slate-600 cursor-not-allowed'
                          : 'text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95 cursor-pointer'
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <span className="w-8 text-center font-bold text-lg text-white font-['Alexandria',sans-serif]">
                      {currentCount}
                    </span>

                    <button
                      type="button"
                      onClick={() => onUpdateCount(srv.id, 1)}
                      className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500 hover:text-slate-950 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {isSelected && (
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block">إجمالي البند</span>
                      <span className="text-sm font-bold text-cyan-400 font-['Alexandria',sans-serif]">
                        {lineTotal} ج.م
                      </span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Live Calculation Bottom Bar */}
        <div className="mt-10 p-5 sm:p-6 rounded-2xl glass-panel-cyan flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-cyan-300 font-semibold">ملخص المفروشات</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                  {totalItemsCount} قطع مختارة
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl sm:text-4xl font-black text-white font-['Alexandria',sans-serif]">
                  {subtotal}
                </span>
                <span className="text-sm font-bold text-cyan-400">جنيه مصري (EGP)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={onProceedToForm}
              disabled={totalItemsCount === 0}
              className={`w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-3 shadow-lg ${
                totalItemsCount > 0
                  ? 'bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 text-slate-950 hover:brightness-110 active:scale-98 shadow-cyan-500/25 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>{totalItemsCount > 0 ? 'متابعة لاختيار طريقة الاستلام وتأكيد الحجز' : 'اختر قطعة واحدة على الأقل'}</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
