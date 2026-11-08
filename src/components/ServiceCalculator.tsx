import React, { useState, useMemo } from 'react';
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
  Check,
  Feather,
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

// Carpet / Furnishing Categories for Step 1
interface CarpetCategoryDef {
  id: string;
  name: string;
  subname: string;
  description: string;
  icon: 'Layers' | 'Sparkles' | 'CloudRain' | 'Armchair' | 'ShieldCheck';
  keywords: string[];
}

const CARPET_CATEGORIES: CarpetCategoryDef[] = [
  {
    id: 'wool-carpets',
    name: 'سجاد صوف وميكانيكي (صالونات وممرات)',
    subname: 'سجاد صالون فاخر، مشايات ممرات وغرف نوم تركي ومصري',
    description: 'غسيل آلي عميق بالفرش الدوارة مع شطف بالطرد المركزي السريع للمحافظة على ألوان الصوف.',
    icon: 'Layers',
    keywords: ['سجاد', 'مشايات', 'ممرات'],
  },
  {
    id: 'silk-carpets',
    name: 'سجاد حرير يدوي فاخر وجوبلان',
    subname: 'سجاد إيراني، أصفهاني، حرير طبيعي، كشمير وستاير مطرزة',
    description: 'تنظيف جاف ناعم بمذيبات ألمانية خالية من الماء لحماية الخيوط الحساسة وألوان التحف الفنية.',
    icon: 'Sparkles',
    keywords: ['حرير', 'جاف', 'حساسة', 'إيراني'],
  },
  {
    id: 'blankets',
    name: 'بطاطين وألحفة ومفارش شتوية',
    subname: 'بطاطين مورا وإسباني، ألحفة عرائس، فايبر دبل ومفارش سرير',
    description: 'غسيل بماء دافئ معقم مع معطرات فرنسية وتجفيف حراري يمنع التكتل ويمنح نعومة فائقة.',
    icon: 'CloudRain',
    keywords: ['بطانية', 'بطاطين', 'لحاف', 'ألحفة'],
  },
  {
    id: 'sofas',
    name: 'صالونات وأنتريهات وأطقم كنب',
    subname: 'ركنات مودرن، أطقم صالون مذهب، كراسي سفرة وأقمشة شانيل ومخمل',
    description: 'تنظيف بالرغوة الجافة وحقن وشفط بالبخار 120°C لإزالة بقع الدهون والروائح العالقة.',
    icon: 'Armchair',
    keywords: ['كنب', 'صالون', 'أنتريه', 'ركنة'],
  },
  {
    id: 'moquette',
    name: 'موكيت مساحات وقاعات ومكاتب',
    subname: 'موكيت شركات، مساجد، قاعات وفيلات بالمتر المربع',
    description: 'شفط عميق وتجفيف سريع بماكينات هيدروليكية مخصصة للمساحات الكبيرة بدون فك.',
    icon: 'ShieldCheck',
    keywords: ['موكيت', 'مساحات', 'مكتب'],
  },
];

// Wash & Care Treatment Options for Step 3 (هتعمل إيه في السجاد)
interface WashTreatment {
  id: string;
  name: string;
  subname: string;
  badge: string;
  isIncludedByDefault?: boolean;
}

const WASH_TREATMENTS: WashTreatment[] = [
  {
    id: 'deep-foam-wash',
    name: 'غسيل عميق آلي بالرغوة النشطة والفرش الدوارة',
    subname: 'إزالة الأتربة الناعمة والأوساخ المتراكمة من عمق الوبرة بشامبو إيطالي متعادل الحموضة',
    badge: 'أساسي ومشمول',
    isIncludedByDefault: true,
  },
  {
    id: 'steam-sanitation',
    name: 'تعقيم نانو بخار جاف 120°C وأوزون طبي',
    subname: 'إبادة 99.9% من البكتيريا وحشرات الفراش ومسببات الحساسية والربو بدون تبليل زائد',
    badge: 'موصى به للأطفال',
    isIncludedByDefault: true,
  },
  {
    id: 'stain-removal',
    name: 'معالجة البقع العنيدة والمستعصية',
    subname: 'إزالة بقع القهوة، الشاي، الزيوت، الحبر، وألوان الأطفال باستخدام مستحلبات متخصصة',
    badge: 'عناية دقيقة',
    isIncludedByDefault: true,
  },
  {
    id: 'royal-lavender-scent',
    name: 'تعطير ملكي بزيوت لافندر فرنسية تدوم طويلاً',
    subname: 'تعطير ألياف السجاد برائحة زكية منعشة تدوم لأسابيع بعد الفرش',
    badge: 'انتعاش يدوم',
    isIncludedByDefault: true,
  },
  {
    id: 'thermal-packaging',
    name: 'تغليف حراري معقم محكم ضد الأتربة والرطوبة',
    subname: 'تغليف نايلون متين مفرغ لحماية السجاد حتى موعد فرشه في منزلك بأمان تام',
    badge: 'حماية وتخزين',
    isIncludedByDefault: true,
  },
];

export const ServiceCalculator: React.FC<ServiceCalculatorProps> = ({
  services,
  items,
  onUpdateCount,
  onReset,
  onProceedToForm,
}) => {
  // Sequential Step State (1: Category -> 2: Items & Size -> 3: Wash Services -> 4: Delivery Form)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Selected Category in Step 1
  const [selectedCategory, setSelectedCategory] = useState<CarpetCategoryDef>(CARPET_CATEGORIES[0]);

  // Selected Wash Treatments in Step 3
  const [selectedTreatments, setSelectedTreatments] = useState<Record<string, boolean>>({
    'deep-foam-wash': true,
    'steam-sanitation': true,
    'stain-removal': true,
    'royal-lavender-scent': true,
    'thermal-packaging': true,
  });

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-teal-400" />;
      case 'Armchair':
        return <Armchair className="w-5 h-5 text-purple-400" />;
      case 'CloudRain':
        return <CloudRain className="w-5 h-5 text-blue-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-rose-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  // Only carpet services (exclude cars)
  const carpetServices = useMemo(() => {
    return services.filter(
      (srv) => srv.category !== 'cars' && !srv.id.startsWith('car-') && srv.unit !== 'سيارة'
    );
  }, [services]);

  // Filtered services for the currently selected category
  const currentCategoryServices = useMemo(() => {
    if (!selectedCategory) return carpetServices;
    const matches = carpetServices.filter((srv) => {
      const combined = `${srv.name} ${srv.subname || ''} ${srv.description || ''}`.toLowerCase();
      return selectedCategory.keywords.some((kw) => combined.includes(kw.toLowerCase()));
    });
    // Fallback if none match category keywords: return all carpet services
    return matches.length > 0 ? matches : carpetServices;
  }, [carpetServices, selectedCategory]);

  const totalItemsCount = useMemo(() => {
    return Object.values(items).reduce((acc, count) => acc + (count || 0), 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return carpetServices.reduce((sum, srv) => {
      const count = items[srv.id] || 0;
      return sum + srv.price * count;
    }, 0);
  }, [carpetServices, items]);

  const toggleTreatment = (treatmentId: string) => {
    setSelectedTreatments((prev) => ({
      ...prev,
      [treatmentId]: !prev[treatmentId],
    }));
  };

  return (
    <section id="calculator" className="py-12 sm:py-16 relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>🧺 غسيل المفروشات والسجاد</span>
              <span>•</span>
              <span>خطوات متتابعة لاختيار طلبك بدقة</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white font-['Alexandria',sans-serif]">
              حاسبة أسعار غسيل السجاد والمفروشات
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              اختر القسم، ثم حدد مقاسات وعدد القطع، ثم اختر مواصفات الغسيل والتعقيم لمتابعة حجزك.
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

        {/* Top Step Progress Stepper */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeStep === 1
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : activeStep > 1
                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-500 bg-slate-950/40'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-950/40 flex items-center justify-center text-[10px] font-black">
              {activeStep > 1 ? '✓' : '1'}
            </span>
            <span className="truncate">1. نوع المفروشات</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (selectedCategory) setActiveStep(2);
            }}
            className={`py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeStep === 2
                ? 'bg-teal-500 text-slate-950 shadow-md font-black'
                : activeStep > 2
                ? 'bg-teal-950/60 text-teal-300 border border-teal-500/30'
                : 'text-slate-500 bg-slate-950/40'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-950/40 flex items-center justify-center text-[10px] font-black">
              {activeStep > 2 ? '✓' : '2'}
            </span>
            <span className="truncate">2. المقاس والعدد</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (totalItemsCount > 0) setActiveStep(3);
            }}
            disabled={totalItemsCount === 0}
            className={`py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeStep === 3
                ? 'bg-purple-500 text-white shadow-md font-black'
                : totalItemsCount > 0
                ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30 cursor-pointer'
                : 'text-slate-500 bg-slate-950/40 cursor-not-allowed'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-950/40 flex items-center justify-center text-[10px] font-black">
              3
            </span>
            <span className="truncate">3. نوع الغسيل</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (totalItemsCount > 0) onProceedToForm();
            }}
            disabled={totalItemsCount === 0}
            className={`hidden sm:flex py-2 px-2.5 rounded-xl font-bold items-center justify-center gap-1.5 transition-all ${
              totalItemsCount > 0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 cursor-pointer'
                : 'text-slate-500 bg-slate-950/40 cursor-not-allowed'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-950/40 flex items-center justify-center text-[10px] font-black">
              4
            </span>
            <span className="truncate">4. مكان وتأكيد الحجز</span>
          </button>
        </div>

        {/* STEP 1: SELECT CARPET / FURNISHING CATEGORY */}
        {activeStep === 1 ? (
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/40 space-y-5 shadow-2xl animate-in fade-in duration-300">
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
                1
              </div>
              <div>
                <h3 className="text-base font-black text-white font-['Alexandria',sans-serif]">
                  الخطوة 1: اختار نوع المفروشات التي ترغب بغسيلها
                </h3>
                <span className="text-xs text-slate-400">
                  اضغط على نوع الصنف للانتقال فوراً لتحديد المقاسات والأعداد
                </span>
              </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {CARPET_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setActiveStep(2); // Automatically advance to Step 2!
                    }}
                    className={`p-4 sm:p-5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-3 cursor-pointer active:scale-98 ${
                      isSelected
                        ? 'bg-gradient-to-br from-cyan-950/80 to-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                          {getIcon(cat.icon)}
                        </div>
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        ) : (
                          <ArrowLeft className="w-4 h-4 text-slate-600" />
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-white font-['Alexandria',sans-serif]">
                        {cat.name}
                      </h4>
                      <p className="text-[11px] text-cyan-300 font-medium">
                        {cat.subname}
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-cyan-400">
                      <span>عرض المقاسات والأسعار</span>
                      <span>⬅️</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Completed Step 1 Summary Card */
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">الخطوة 1: نوع المفروشات المحدد:</span>
                <strong className="text-white text-sm font-['Alexandria',sans-serif]">
                  {selectedCategory.name}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold transition-all text-xs cursor-pointer flex items-center gap-1"
            >
              <span>تغيير القسم</span>
              <span>✏️</span>
            </button>
          </div>
        )}

        {/* STEP 2: SELECT SPECIFIC ITEMS, SIZES & QUANTITIES */}
        {activeStep === 2 ? (
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-teal-500/40 space-y-5 shadow-2xl animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-black">
                  2
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-['Alexandria',sans-serif]">
                    الخطوة 2: اختار مقاسات وعدد القطع لـ ({selectedCategory.name})
                  </h3>
                  <span className="text-xs text-slate-400">
                    استخدم عدادات (+) و (-) لتحديد كمية كل مقاس مطلوب غسيله
                  </span>
                </div>
              </div>

              {/* Quick switch category tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CARPET_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                      selectedCategory.id === c.id
                        ? 'bg-teal-500 text-slate-950 font-black'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {c.name.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* Items Grid for this Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentCategoryServices.map((srv) => {
                const currentCount = items[srv.id] || 0;
                const lineTotal = srv.price * currentCount;
                const isSelected = currentCount > 0;

                return (
                  <div
                    key={srv.id}
                    className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-teal-950/60 to-slate-900 border border-teal-400/60 shadow-[0_0_20px_rgba(20,184,166,0.15)]'
                        : 'bg-slate-950/70 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
                          {getIcon(srv.icon)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white truncate font-['Alexandria',sans-serif]">
                            {srv.name}
                          </h4>
                          {srv.subname && (
                            <p className="text-[11px] text-teal-300 truncate">{srv.subname}</p>
                          )}
                        </div>
                      </div>

                      {srv.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                          {srv.description}
                        </p>
                      )}

                      <div className="flex items-baseline gap-1.5 mb-4 pb-3 border-b border-slate-800/80">
                        <span className="text-xl font-black text-white font-['Alexandria',sans-serif]">
                          {srv.price}
                        </span>
                        <span className="text-xs text-slate-400">ج.م / {srv.unit}</span>
                      </div>
                    </div>

                    {/* Counter Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => onUpdateCount(srv.id, -1)}
                          disabled={currentCount === 0}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            currentCount === 0
                              ? 'text-slate-600 cursor-not-allowed'
                              : 'text-slate-200 bg-slate-800 hover:bg-slate-700 active:scale-95 cursor-pointer'
                          }`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span className="w-7 text-center font-bold text-base text-white font-['Alexandria',sans-serif]">
                          {currentCount}
                        </span>

                        <button
                          type="button"
                          onClick={() => onUpdateCount(srv.id, 1)}
                          className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500 hover:text-slate-950 active:scale-95 flex items-center justify-center transition-all cursor-pointer font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isSelected && (
                        <div className="text-left">
                          <span className="text-[10px] text-slate-400 block">إجمالي</span>
                          <span className="text-xs font-bold text-teal-300 font-['Alexandria',sans-serif]">
                            {lineTotal} ج.م
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Advance to Step 3 Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                disabled={totalItemsCount === 0}
                className={`w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl font-['Alexandria',sans-serif] ${
                  totalItemsCount > 0
                    ? 'bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-400 text-slate-950 hover:brightness-110 cursor-pointer active:scale-98 shadow-teal-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>
                  {totalItemsCount > 0
                    ? `تأكيد القطع والمقاس (${totalItemsCount} قطع - ${subtotal} ج) والانتقال لنوع الغسيل`
                    : 'حدد قطعة واحدة على الأقل للمتابعة'}
                </span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : activeStep > 2 ? (
          /* Completed Step 2 Summary Card */
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">الخطوة 2: القطع والمقاسات المحددة:</span>
                <strong className="text-teal-300 text-xs font-['Alexandria',sans-serif]">
                  {totalItemsCount} قطع مختارة بإجمالي {subtotal} جنيه مصري
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold transition-all text-xs cursor-pointer flex items-center gap-1"
            >
              <span>تعديل القطع والمقاس</span>
              <span>✏️</span>
            </button>
          </div>
        ) : (
          /* Locked Step 2 Placeholder */
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex items-center gap-3 text-xs text-slate-500">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 font-bold">
              🔒
            </div>
            <div>
              <span className="font-bold text-slate-400 block">الخطوة 2: اختيار المقاس والقطع والعدد</span>
              <span className="text-[11px]">سيتم فتح هذه الخطوة تلقائياً بعد تحديد نوع المفروشات في الخطوة 1</span>
            </div>
          </div>
        )}

        {/* STEP 3: SELECT WASH & CARE TREATMENTS (هتعمل إيه في السجاد) */}
        {activeStep === 3 ? (
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-purple-500/40 space-y-5 shadow-2xl animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
                  3
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-['Alexandria',sans-serif]">
                    الخطوة 3: اختار هتعمل إيه في السجاد (خدمات المعالجة والغسيل والعناية)
                  </h3>
                  <span className="text-xs text-slate-400">
                    حدد خيارات العناية الفائقة بمفروشاتك قبل الانتقال لتحديد موعد ومكان الاستلام
                  </span>
                </div>
              </div>

              <span className="text-xs text-purple-300 font-bold hidden sm:inline">
                {Object.values(selectedTreatments).filter(Boolean).length} مواصفات محددة
              </span>
            </div>

            {/* Wash Treatments Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WASH_TREATMENTS.map((treatment) => {
                const isChecked = Boolean(selectedTreatments[treatment.id]);
                return (
                  <div
                    key={treatment.id}
                    onClick={() => toggleTreatment(treatment.id)}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer select-none active:scale-98 ${
                      isChecked
                        ? 'bg-gradient-to-br from-purple-950/60 to-slate-900 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold font-['Alexandria',sans-serif] ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                          {treatment.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {treatment.subname}
                      </p>
                      <div className="pt-1">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                          {treatment.badge}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                        isChecked
                          ? 'bg-purple-500 border-purple-400 text-slate-950 font-bold'
                          : 'bg-slate-900 border-slate-700 text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Advance to Step 4 (Proceed to Form) */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-right w-full sm:w-auto">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-bold">
                    إجمالي المفروشات ({totalItemsCount} قطع):
                  </div>
                  <div className="text-2xl font-black text-white font-['Alexandria',sans-serif]">
                    {subtotal} <span className="text-xs font-normal text-cyan-400">جنيه مصري</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onProceedToForm}
                disabled={totalItemsCount === 0}
                className={`w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-3 shadow-lg font-['Alexandria',sans-serif] ${
                  totalItemsCount > 0
                    ? 'bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 text-slate-950 hover:brightness-110 active:scale-98 shadow-cyan-500/25 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>متابعة لتحديد مكان وموعد الاستلام وتأكيد الحجز</span>
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Locked Step 3 Placeholder */
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex items-center gap-3 text-xs text-slate-500">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 font-bold">
              🔒
            </div>
            <div>
              <span className="font-bold text-slate-400 block">الخطوة 3: اختيار نوع الغسيل والمعالجة والعناية</span>
              <span className="text-[11px]">سيتم فتح خيارات الغسيل والتعقيم فور تأكيد القطع في الخطوة 2</span>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
