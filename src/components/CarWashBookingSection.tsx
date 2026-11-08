import React, { useState, useMemo } from 'react';
import {
  Car,
  Check,
  ChevronDown,
  Search,
  Sparkles,
  Truck,
  Building2,
  Calendar,
  Clock,
  Phone,
  User,
  MapPin,
  MessageCircle,
  AlertCircle,
  ShieldCheck,
  Wrench,
  Flame,
  Droplets,
  Layers,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { DynamicService, AppSettings, Booking, DeliveryType } from '../types';
import { EGYPTIAN_CAR_BRANDS, CarBrandInfo } from '../data/egyptianCars';
import {
  createBookingInFirestore,
  buildWhatsAppMessage,
  getWhatsAppUrl,
  getNextSequentialOrderId,
} from '../services/bookingService';

interface CarWashBookingSectionProps {
  services: DynamicService[];
  settings: AppSettings;
  onBookingSuccess: (booking: Booking) => void;
  onSwitchToCarpets: () => void;
}

export const CarWashBookingSection: React.FC<CarWashBookingSectionProps> = ({
  services = [],
  settings,
  onBookingSuccess,
  onSwitchToCarpets,
}) => {
  // Car filter services: filter by category === 'cars' or IDs starting with 'car-'
  const carServices = useMemo(() => {
    return services.filter(
      (s) => s.category === 'cars' || s.id.startsWith('car-') || s.unit === 'سيارة'
    );
  }, [services]);

  // Progressive Disclosure Step state (1: Brand -> 2: Model -> 3: Services -> 4: Location & Booking)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Selected Brand & Model
  const [brandSearch, setBrandSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<CarBrandInfo | null>(() => {
    return EGYPTIAN_CAR_BRANDS.find((b) => b.id === 'hyundai') || EGYPTIAN_CAR_BRANDS[0];
  });
  const [selectedModel, setSelectedModel] = useState<string>('فيرنا (Verna)');
  const [customModelInput, setCustomModelInput] = useState('');
  const [isCarConfirmed, setIsCarConfirmed] = useState(false);

  // Step 2: Selected Car Services (serviceId -> selected boolean)
  const [selectedServiceIds, setSelectedServiceIds] = useState<Record<string, boolean>>({
    'car-exterior-wash': true,
    'car-interior-steam': true,
  });

  // Step 3: Customer Booking Form
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('morning');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered brands list based on search
  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return EGYPTIAN_CAR_BRANDS;
    const query = brandSearch.trim().toLowerCase();
    return EGYPTIAN_CAR_BRANDS.filter(
      (b) =>
        b.nameAr.toLowerCase().includes(query) ||
        b.nameEn.toLowerCase().includes(query) ||
        b.popularModels.some((m) => m.toLowerCase().includes(query))
    );
  }, [brandSearch]);

  // Toggle car service selection
  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  // Pricing calculations
  const selectedCarServicesList = useMemo(() => {
    return carServices.filter((s) => selectedServiceIds[s.id]);
  }, [carServices, selectedServiceIds]);

  const servicesSubtotal = useMemo(() => {
    return selectedCarServicesList.reduce((sum, s) => sum + s.price, 0);
  }, [selectedCarServicesList]);

  const effectiveDeliveryFee = deliveryType === 'pickup' ? (settings.deliveryFee ?? 30) : 0;
  const grandTotal = servicesSubtotal + (selectedCarServicesList.length > 0 ? effectiveDeliveryFee : 0);

  // Selected car full name
  const effectiveCarName = useMemo(() => {
    const brandName = selectedBrand ? selectedBrand.nameAr.split('(')[0].trim() : 'سيارة خاصة';
    const modelName = customModelInput.trim() ? customModelInput.trim() : selectedModel;
    return `${brandName} - ${modelName}`;
  }, [selectedBrand, selectedModel, customModelInput]);

  // Handle Form Submission
  const handleSubmitCarBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (selectedCarServicesList.length === 0) {
      setFormError('يرجى اختيار خدمة واحدة على الأقل لسيارتك (مثال: غسيل برة، غسيل جوة، إلخ).');
      return;
    }

    if (!customerName.trim()) {
      setFormError('يرجى كتابة اسم العميل بالكامل.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setFormError('يرجى إدخال رقم هاتف صحيح (11 رقم مصري للتواصل وتأكيد الحجز).');
      return;
    }

    if (deliveryType === 'pickup' && !address.trim()) {
      setFormError('يرجى كتابة عنوان تواجد السيارة أو موقع الجراج لاستقبال المغسلة المتنقلة.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Get next sequential order ID (#1, #2, #3, ...)
      const nextId = await getNextSequentialOrderId();
      const orderIdStr = String(nextId);

      // Build items map & itemsDetails
      const itemsMap: Record<string, number> = {};
      const itemsDetails: Array<{
        serviceId: string;
        name: string;
        count: number;
        unitPrice: number;
        subtotal: number;
      }> = [];

      selectedCarServicesList.forEach((srv) => {
        itemsMap[srv.id] = 1;
        itemsDetails.push({
          serviceId: srv.id,
          name: srv.name,
          count: 1,
          unitPrice: srv.price,
          subtotal: srv.price,
        });
      });

      const finalBrand = selectedBrand ? selectedBrand.nameAr.split('(')[0].trim() : 'سيارة خاصة';
      const finalModel = customModelInput.trim() ? customModelInput.trim() : selectedModel;

      const newBooking = await createBookingInFirestore({
        orderId: orderIdStr,
        orderNumber: nextId,
        serviceCategory: 'cars',
        carDetails: {
          brand: finalBrand,
          model: finalModel,
          selectedServicesList: selectedCarServicesList.map((s) => s.name),
        },
        customerName: customerName.trim(),
        phone: phone.trim(),
        deliveryType,
        address: deliveryType === 'pickup' ? address.trim() : 'مقر المغسلة الرئيسي',
        deliveryDate,
        timeSlot: timeSlot === 'morning' ? 'صباحاً (9:00 ص - 2:00 م)' : 'مساءً (3:00 م - 9:00 م)',
        items: itemsMap,
        itemsDetails,
        deliveryFee: effectiveDeliveryFee,
        totalPrice: grandTotal,
        notes: notes.trim(),
        source: 'website',
      });

      // 2. Build structured WhatsApp invoice & trigger URL
      const whatsappText = buildWhatsAppMessage(
        newBooking,
        settings.businessPhone,
        carServices,
        settings.brandName
      );
      const whatsappUrl = getWhatsAppUrl(settings.businessPhone, whatsappText);

      onBookingSuccess(newBooking);

      // 3. Open WhatsApp cleanly
      try {
        const link = document.createElement('a');
        link.href = whatsappUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        window.open(whatsappUrl, '_blank');
      }
    } catch (err: any) {
      console.error('Car booking error:', err);
      setFormError(err?.message || 'تعذر تسجيل حجز السيارة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="car-services" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20 space-y-10 animate-in fade-in duration-300">
      
      {/* 1. Header & Service Switcher */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        
        {/* Toggle between Carpets & Cars */}
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl gap-2">
          <button
            onClick={onSwitchToCarpets}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-400 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>🧺 غسيل سجاد ومفروشات</span>
          </button>

          <button
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg flex items-center gap-2 cursor-default"
          >
            <Car className="w-4 h-4 text-white" />
            <span>🚗 غسيل وتفصيل سيارات</span>
          </button>
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-white font-['Alexandria',sans-serif] leading-tight">
          مغسلة سيارات احترافية متنقلة وبالفرع
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
          اختار نوع وموديل عربيتك من بين أكثر من 90% من سيارات مصر، وحدد الخدمات المطلوبة (غسيل برة، صالون جوة، شنطة، شاسيه ومحرك، وتغيير زيت) وسنصلك أينما كنت!
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs">
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            <span>مغسلة دليفري أمام بيتك أو في جراجك</span>
          </span>
          <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>خامات ألمانية وبخار جاف لحماية الدهان</span>
          </span>
        </div>
      </div>

      {/* 2. Step by Step Flow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left/Main Column: Sequential Step-by-Step Flow */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Top Step Progress Indicator */}
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
              <span className="truncate">1. الشركة</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (selectedBrand) setActiveStep(2);
              }}
              disabled={!selectedBrand}
              className={`py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeStep === 2
                  ? 'bg-purple-500 text-white shadow-md font-black'
                  : activeStep > 2
                  ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                  : 'text-slate-500 bg-slate-950/40 cursor-not-allowed'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-950/40 flex items-center justify-center text-[10px] font-black">
                {activeStep > 2 ? '✓' : '2'}
              </span>
              <span className="truncate">2. الموديل</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (selectedBrand) setActiveStep(3);
              }}
              disabled={activeStep < 2}
              className={`py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeStep === 3
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : activeStep > 3
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-500 bg-slate-950/40 cursor-not-allowed'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-950/40 flex items-center justify-center text-[10px] font-black">
                {activeStep > 3 ? '✓' : '3'}
              </span>
              <span className="truncate">3. الخدمات</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (selectedCarServicesList.length > 0) setActiveStep(4);
              }}
              disabled={selectedCarServicesList.length === 0}
              className={`hidden sm:flex py-2 px-2.5 rounded-xl font-bold items-center justify-center gap-1.5 transition-all ${
                activeStep === 4
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-500 bg-slate-950/40 cursor-not-allowed'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-950/40 flex items-center justify-center text-[10px] font-black">
                4
              </span>
              <span className="truncate">4. تأكيد الحجز</span>
            </button>
          </div>

          {/* STEP 1: SELECT CAR BRAND */}
          {activeStep === 1 ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/40 space-y-5 shadow-2xl animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white font-['Alexandria',sans-serif]">
                      الخطوة 1: اختار ماركة / شركة عربيتك
                    </h3>
                    <span className="text-xs text-slate-400">
                      اضغط على شركتك ليفتح لك الموديلات فوراً (أكثر من 26 ماركة تغطي 90% من سيارات مصر)
                    </span>
                  </div>
                </div>

                {/* Brand Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    placeholder="ابحث عن ماركة (بي إم، هيونداي...)"
                    className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Brand Chips Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                {filteredBrands.map((brand) => {
                  const isSelected = selectedBrand?.id === brand.id;
                  return (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => {
                        setSelectedBrand(brand);
                        setSelectedModel(brand.popularModels[0] || '');
                        setCustomModelInput('');
                        setIsCarConfirmed(true);
                        setActiveStep(2); // Automatically unlock & advance to Step 2!
                      }}
                      className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between gap-2 cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-950 to-slate-900 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate font-['Alexandria',sans-serif]">
                          {brand.nameAr.split('(')[0].trim()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono truncate block">
                          {brand.nameEn}
                        </span>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
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
                  <span className="text-slate-400 block text-[11px]">الخطوة 1: ماركة السيارة المحددة:</span>
                  <strong className="text-white text-sm font-['Alexandria',sans-serif]">
                    {selectedBrand?.nameAr || 'سيارة خاصة'}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold transition-all text-xs cursor-pointer flex items-center gap-1"
              >
                <span>تغيير الماركة</span>
                <span>✏️</span>
              </button>
            </div>
          )}

          {/* STEP 2: SELECT CAR MODEL & TRIM */}
          {activeStep === 2 ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-purple-500/40 space-y-5 shadow-2xl animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
                    2
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white font-['Alexandria',sans-serif]">
                      الخطوة 2: اختار نسخة / موديل عربيتك لـ ({selectedBrand?.nameAr.split('(')[0].trim()})
                    </h3>
                    <span className="text-xs text-slate-400">
                      حدد الفئة أو الموديل للانتقال فوراً لاختيار الخدمات المطلوبة
                    </span>
                  </div>
                </div>

                <span className="text-xs text-purple-300 font-bold hidden sm:inline">
                  {selectedBrand?.popularModels.length || 0} موديل متوفر
                </span>
              </div>

              {/* Model Selection Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                {selectedBrand?.popularModels.map((model) => {
                  const isSelected = selectedModel === model && !customModelInput.trim();
                  return (
                    <button
                      key={model}
                      type="button"
                      onClick={() => {
                        setSelectedModel(model);
                        setCustomModelInput('');
                        setIsCarConfirmed(true);
                        setActiveStep(3); // Automatically advance to Step 3!
                      }}
                      className={`p-3 rounded-xl border text-right text-xs font-bold transition-all flex items-center justify-between gap-1.5 cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-purple-950/90 border-purple-400 text-purple-200 shadow-sm font-black'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{model}</span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      ) : (
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Or Write-in Custom Model */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  أو اكتب نسخة / فئة عربيتك يدوياً إن لم تجدها بالأعلى:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customModelInput}
                    onChange={(e) => {
                      setCustomModelInput(e.target.value);
                      setIsCarConfirmed(true);
                    }}
                    placeholder="مثال: إم 4 كومبيتيشن 2024 / فئة تانية سبورت..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCarConfirmed(true);
                      setActiveStep(3); // Advance to Step 3!
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-500 cursor-pointer shadow-md"
                  >
                    تأكيد الموديل ⬅️
                  </button>
                </div>
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
                  <span className="text-slate-400 block text-[11px]">الخطوة 2: موديل وفئة السيارة:</span>
                  <strong className="text-white text-sm font-['Alexandria',sans-serif]">
                    {effectiveCarName}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold transition-all text-xs cursor-pointer flex items-center gap-1"
              >
                <span>تعديل الموديل</span>
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
                <span className="font-bold text-slate-400 block">الخطوة 2: اختيار موديل وفئة السيارة</span>
                <span className="text-[11px]">سيتم فتح هذه الخطوة تلقائياً بعد تحديد ماركة سيارتك في الخطوة 1</span>
              </div>
            </div>
          )}

          {/* STEP 3: SELECT CAR SERVICES (هتعمل إيه في العربية) */}
          {activeStep === 3 ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/40 space-y-5 shadow-2xl animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white font-['Alexandria',sans-serif]">
                      الخطوة 3: اختار هتعمل إيه في عربيتك ({effectiveCarName})
                    </h3>
                    <span className="text-xs text-slate-400">
                      حدد الخدمات المطلوبة (غسيل برة، صالون بخار، شنطة، شاسيه ومحرك، زيت وفلتر...)
                    </span>
                  </div>
                </div>

                <span className="text-xs text-emerald-400 font-bold">
                  {selectedCarServicesList.length} خدمات محددة ({servicesSubtotal} ج)
                </span>
              </div>

              {/* Services Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {carServices.map((service) => {
                  const isChecked = Boolean(selectedServiceIds[service.id]);
                  return (
                    <div
                      key={service.id}
                      onClick={() => handleToggleService(service.id)}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer select-none active:scale-98 ${
                        isChecked
                          ? 'bg-gradient-to-br from-emerald-950/60 to-slate-900 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold font-['Alexandria',sans-serif] ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                            {service.name}
                          </span>
                        </div>
                        {service.subname && (
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {service.subname}
                          </p>
                        )}
                        <div className="pt-1">
                          <span className="inline-block px-2 py-0.5 rounded-md text-xs font-black font-['Alexandria',sans-serif] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            {service.price} ج.م
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                            : 'bg-slate-900 border-slate-700 text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Advance to Step 4 Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(4)}
                  disabled={selectedCarServicesList.length === 0}
                  className={`w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl font-['Alexandria',sans-serif] ${
                    selectedCarServicesList.length > 0
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:from-emerald-400 hover:to-cyan-400 cursor-pointer active:scale-98 shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>
                    تأكيد الخدمات ومتابعة الحجز ({selectedCarServicesList.length} خدمات - {servicesSubtotal} ج)
                  </span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : activeStep > 3 ? (
            /* Completed Step 3 Summary Card */
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">الخطوة 3: خدمات الغسيل المختارة:</span>
                  <strong className="text-emerald-300 text-xs font-['Alexandria',sans-serif]">
                    {selectedCarServicesList.map((s) => s.name).join(' • ') || 'لم تحدد'} ({servicesSubtotal} ج)
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold transition-all text-xs cursor-pointer flex items-center gap-1"
              >
                <span>تعديل الخدمات</span>
                <span>✏️</span>
              </button>
            </div>
          ) : (
            /* Locked Step 3 Placeholder */
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex items-center gap-3 text-xs text-slate-500">
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 font-bold">
                🔒
              </div>
              <div>
                <span className="font-bold text-slate-400 block">الخطوة 3: اختيار خدمات الغسيل والعناية</span>
                <span className="text-[11px]">سيتم فتح قائمة الخدمات فور تأكيد الموديل في الخطوة 2</span>
              </div>
            </div>
          )}

        </div>

        {/* Right/Sticky Column: Summary & Checkout Form */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          
          <form
            onSubmit={handleSubmitCarBooking}
            className="p-6 rounded-3xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl space-y-5"
          >
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                ملخص وتأكيد الطلب
              </span>
              <h3 className="text-lg font-black text-white font-['Alexandria',sans-serif]">
                حجز موعد غسيل العربية
              </h3>
            </div>

            {/* Selected Car Box */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <span className="text-slate-400 font-bold block">السيارة المختارة:</span>
              <span className="text-sm font-black text-white font-['Alexandria',sans-serif] block">
                {effectiveCarName}
              </span>
            </div>

            {/* Selected Services Breakdown */}
            <div className="space-y-1.5 text-xs">
              <span className="text-slate-400 font-bold block">الخدمات المحددة ({selectedCarServicesList.length}):</span>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {selectedCarServicesList.length === 0 ? (
                  <span className="text-[11px] text-amber-400">يرجى تحديد خدمة واحدة على الأقل</span>
                ) : (
                  selectedCarServicesList.map((srv) => (
                    <div key={srv.id} className="flex justify-between items-center text-slate-300 py-0.5 border-b border-slate-800/50">
                      <span className="truncate">{srv.name}</span>
                      <span className="font-bold text-cyan-300 font-mono shrink-0">{srv.price} ج.م</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Location Type */}
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-bold block">مكان ومقر الخدمة:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`p-2.5 rounded-xl border text-center font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    deliveryType === 'pickup'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span className="text-[11px]">مغسلة متنقلة لبيتك</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('dropoff')}
                  className={`p-2.5 rounded-xl border text-center font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    deliveryType === 'dropoff'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-400 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="text-[11px]">في مقر المغسلة</span>
                </button>
              </div>
            </div>

            {/* Customer Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم العميل *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: محمد أحمد"
                    className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم الهاتف (المشتري) *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010xxxxxxxx"
                    className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {deliveryType === 'pickup' && (
                <div>
                  <label className="block text-slate-300 font-bold mb-1">عنوان تواجد السيارة أو الجراج *</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="العنوان التفصيلي ومكان ركن السيارة لاستقبال سيارة المغسلة..."
                      className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">تاريخ الموعد</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-[11px] outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">الفترة الزمنية</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-[11px] outline-none focus:border-cyan-400"
                  >
                    <option value="morning">صباحاً (9ص - 2ظ)</option>
                    <option value="evening">مساءً (3ع - 9م)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">ملاحظات خاصة (اختياري)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="نوع الفرش، بقع معينة، موعد محدد..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Grand Total Bar */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950 to-purple-950 border border-cyan-500/40 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block font-bold">الإجمالي المستحق:</span>
                <span className="text-xl font-black text-white font-['Alexandria',sans-serif]">
                  {grandTotal} ج.م
                </span>
              </div>

              {effectiveDeliveryFee > 0 && (
                <span className="text-[10px] text-cyan-300 bg-cyan-500/20 px-2 py-1 rounded-md font-bold">
                  شامل دليفري {effectiveDeliveryFee} ج.م
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-98 transition-all cursor-pointer font-['Alexandria',sans-serif]"
            >
              <MessageCircle className="w-5 h-5 text-slate-950" />
              <span>
                {isSubmitting ? 'جاري تسجيل الطلب...' : 'تأكيد حجز السيارة وفتح الواتساب'}
              </span>
            </button>

            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              سيتم تسجيل طلبك فوراً برقم تتبع تسلسلي، وفتح محادثة واتساب موثقة مع إدارة المغسلة.
            </p>

          </form>

        </div>

      </div>

    </section>
  );
};
