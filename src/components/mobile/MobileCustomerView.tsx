import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Phone,
  Search,
  Plus,
  Minus,
  Truck,
  Store,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  MapPin,
  ChevronLeft,
  X,
  MessageCircle,
  HelpCircle,
  Smartphone,
  Monitor,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  Maximize2,
  Car,
  Check,
  Wrench,
} from 'lucide-react';
import {
  Booking,
  DynamicService,
  AppSettings,
  SiteFeature,
  PromoMediaItem,
  DeliveryType,
  OrderStatus,
} from '../../types';
import { PromoMediaSlider } from '../PromoMediaSlider';
import {
  createBookingInFirestore,
  buildWhatsAppMessage,
  getWhatsAppUrl,
  subscribeToBookings,
  normalizeWhatsAppPhone,
  getNextSequentialOrderId,
} from '../../services/bookingService';
import { EGYPTIAN_CAR_BRANDS, CarBrandInfo } from '../../data/egyptianCars';
import { STATUS_METADATA } from '../../constants';
import { formatVideoEmbedInfo } from '../../utils/mediaUpload';

const MOBILE_CARPET_CATEGORIES = [
  {
    id: 'wool',
    name: 'سجاد صوف وميكانيكي',
    subname: 'صالونات وممرات وغرف نوم',
    filterKeywords: ['سجاد', 'مشايات', 'ممرات'],
  },
  {
    id: 'silk',
    name: 'سجاد حرير يدوي فاخر',
    subname: 'إيراني، جوبلان وكشمير ومطرزات',
    filterKeywords: ['حرير', 'جاف', 'حساسة', 'إيراني'],
  },
  {
    id: 'blankets',
    name: 'بطاطين وألحفة ومفارش',
    subname: 'بطاطين مورا، فايبر دبل وألحفة',
    filterKeywords: ['بطانية', 'بطاطين', 'لحاف', 'ألحفة'],
  },
  {
    id: 'sofas',
    name: 'صالونات وكنب وأنتريهات',
    subname: 'ركنات مودرن، أطقم صالون ومخمل',
    filterKeywords: ['كنب', 'صالون', 'أنتريه', 'ركنة'],
  },
  {
    id: 'moquette',
    name: 'موكيت مساحات وقاعات',
    subname: 'موكيت مكاتب، شركات وقاعات',
    filterKeywords: ['موكيت', 'مساحات', 'مكتب'],
  },
];

const MOBILE_WASH_TREATMENTS = [
  {
    id: 'deep-foam-wash',
    name: 'غسيل عميق آلي بالرغوة والفرش الدوارة',
    subname: 'شامبو إيطالي متعادل يحمي خيوط الصوف والحرير',
    badge: 'مشمول أساسي',
  },
  {
    id: 'steam-sanitation',
    name: 'تعقيم نانو بخار جاف 120°C وأوزون',
    subname: 'إبادة 99.9% من البكتيريا وحشرات الفراش والروائح',
    badge: 'تعقيم طبي',
  },
  {
    id: 'stain-removal',
    name: 'إزالة ومعالجة البقع العنيدة والمستعصية',
    subname: 'بقع القهوة، الشاي، الزيوت، الحبر والألوان',
    badge: 'عناية دقيقة',
  },
  {
    id: 'royal-lavender-scent',
    name: 'تعطير ملكي بزيوت لافندر فرنسية تدوم طويلاً',
    subname: 'رائحة منعشة تدوم لأسابيع بعد فرش السجاد',
    badge: 'انتعاش يدوم',
  },
  {
    id: 'thermal-packaging',
    name: 'تغليف حراري معقم محكم ضد الأتربة والرطوبة',
    subname: 'أكياس نايلون متينة لحماية السجاد حتى موعد الفرش',
    badge: 'تخزين آمن',
  },
];

interface MobileCustomerViewProps {
  settings: AppSettings;
  services: DynamicService[];
  features?: SiteFeature[];
  mediaItems: PromoMediaItem[];
  onOpenAdmin: () => void;
  onSwitchToDesktop: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

export const MobileCustomerView: React.FC<MobileCustomerViewProps> = ({
  settings,
  services,
  features = [],
  mediaItems,
  onOpenAdmin,
  onSwitchToDesktop,
  onBookingSuccess,
}) => {
  // Mobile Tab navigation: 'booking' | 'media' | 'tracker' | 'about'
  const [mobileTab, setMobileTab] = useState<'booking' | 'media' | 'tracker' | 'about'>('booking');
  const [selectedMedia, setSelectedMedia] = useState<PromoMediaItem | null>(null);

  // Dual Service Mode: 'carpets' (سجاد ومفروشات) vs 'cars' (غسيل وتفصيل سيارات)
  const [serviceCategory, setServiceCategory] = useState<'carpets' | 'cars'>('carpets');

  // Progressive Step state for Mobile Cars (1: Brand -> 2: Model -> 3: Services -> 4: Checkout)
  const [carStep, setCarStep] = useState<1 | 2 | 3>(1);

  // Progressive Step state for Mobile Carpets (1: Category -> 2: Item/Sizes & Count -> 3: Wash Options -> 4: Checkout)
  const [carpetStep, setCarpetStep] = useState<1 | 2 | 3>(1);

  // Wash treatments for carpets
  const [carpetTreatments, setCarpetTreatments] = useState<Record<string, boolean>>({
    'deep-foam-wash': true,
    'steam-sanitation': true,
    'stain-removal': true,
    'royal-lavender-scent': true,
    'thermal-packaging': true,
  });

  // CAR SERVICES STATE & SELECTIONS
  const [carBrandSearch, setCarBrandSearch] = useState('');
  const [selectedCarBrand, setSelectedCarBrand] = useState<CarBrandInfo>(() => {
    return EGYPTIAN_CAR_BRANDS.find((b) => b.id === 'hyundai') || EGYPTIAN_CAR_BRANDS[0];
  });
  const [selectedCarModel, setSelectedCarModel] = useState<string>('فيرنا (Verna)');
  const [customCarModel, setCustomCarModel] = useState<string>('');
  const [selectedCarServiceIds, setSelectedCarServiceIds] = useState<Record<string, boolean>>({
    'car-exterior-wash': true,
    'car-interior-steam': true,
  });

  // Selected items for carpets: serviceId -> count
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  // Active filter category for carpet services ('wool' by default)
  const [activeCategory, setActiveCategory] = useState<string>('wool');

  // Checkout Bottom Sheet state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Checkout Form fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
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

  // Mobile Order Tracker state
  const [trackerInput, setTrackerInput] = useState('');
  const [trackedBooking, setTrackedBooking] = useState<Booking | null>(null);
  const [trackerHasSearched, setTrackerHasSearched] = useState(false);
  const [trackerLoading, setTrackerLoading] = useState(false);

  // CARPET SERVICES & CALCULATIONS
  const carpetServices = useMemo(() => {
    return services.filter(
      (s) => s.category !== 'cars' && !s.id.startsWith('car-') && s.unit !== 'سيارة'
    );
  }, [services]);

  const carServices = useMemo(() => {
    return services.filter(
      (s) => s.category === 'cars' || s.id.startsWith('car-') || s.unit === 'سيارة'
    );
  }, [services]);

  const totalItemCount = useMemo(() => {
    return Object.values(selectedItems).reduce((sum, count) => sum + count, 0);
  }, [selectedItems]);

  const itemsSubtotal = useMemo(() => {
    return Object.entries(selectedItems).reduce((total, [serviceId, count]) => {
      const s = carpetServices.find((srv) => srv.id === serviceId);
      return total + (s ? s.price * count : 0);
    }, 0);
  }, [selectedItems, carpetServices]);

  const effectiveDeliveryFee = deliveryType === 'pickup' ? (settings.deliveryFee ?? 30) : 0;
  const grandTotal = itemsSubtotal + (totalItemCount > 0 ? effectiveDeliveryFee : 0);

  // CAR SELECTIONS CALCULATIONS
  const selectedCarServicesList = useMemo(() => {
    return carServices.filter((s) => selectedCarServiceIds[s.id]);
  }, [carServices, selectedCarServiceIds]);

  const carServicesSubtotal = useMemo(() => {
    return selectedCarServicesList.reduce((sum, s) => sum + s.price, 0);
  }, [selectedCarServicesList]);

  const carGrandTotal = carServicesSubtotal + (deliveryType === 'pickup' ? (settings.deliveryFee ?? 30) : 0);

  // Filtered brands for search
  const filteredBrands = useMemo(() => {
    if (!carBrandSearch.trim()) return EGYPTIAN_CAR_BRANDS;
    const q = carBrandSearch.trim().toLowerCase();
    return EGYPTIAN_CAR_BRANDS.filter(
      (b) =>
        b.nameAr.toLowerCase().includes(q) ||
        b.nameEn.toLowerCase().includes(q) ||
        b.popularModels.some((m) => m.toLowerCase().includes(q))
    );
  }, [carBrandSearch]);

  // Categories list based on common keywords
  const categories = useMemo(() => {
    return ['all', 'سجاد', 'بطانية', 'موكيت', 'صالون'];
  }, []);

  const filteredServices = useMemo(() => {
    if (activeCategory === 'all') return carpetServices;
    const cat = MOBILE_CARPET_CATEGORIES.find((c) => c.id === activeCategory);
    if (cat) {
      const matched = carpetServices.filter((s) => {
        const combined = `${s.name} ${s.subname || ''} ${s.description || ''}`.toLowerCase();
        return cat.filterKeywords.some((kw) => combined.includes(kw.toLowerCase()));
      });
      return matched.length > 0 ? matched : carpetServices;
    }
    return carpetServices.filter(
      (s) =>
        s.name.includes(activeCategory) ||
        (s.subname && s.subname.includes(activeCategory)) ||
        (s.description && s.description.includes(activeCategory))
    );
  }, [carpetServices, activeCategory]);

  const handleUpdateCount = (serviceId: string, delta: number) => {
    setSelectedItems((prev) => {
      const curr = prev[serviceId] || 0;
      const next = Math.max(0, curr + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[serviceId];
        return copy;
      }
      return { ...prev, [serviceId]: next };
    });
  };

  const handleToggleCarService = (serviceId: string) => {
    setSelectedCarServiceIds((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  // Submit Order from Mobile (Carpets OR Cars)
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError('يرجى كتابة الاسم الكريم.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setFormError('يرجى إدخال رقم هاتف صحيح مكون من 11 رقم.');
      return;
    }
    if (deliveryType === 'pickup' && !address.trim()) {
      setFormError(
        serviceCategory === 'cars'
          ? 'يرجى تحديد موقع تواجد السيارة / الجراج لخدمة الغسيل المتنقل.'
          : 'يرجى تحديد عنوان الاستلام والتوصيل بالتفصيل.'
      );
      return;
    }

    // Branch A: CAR WASH BOOKING
    if (serviceCategory === 'cars') {
      if (selectedCarServicesList.length === 0) {
        setFormError('يرجى اختيار خدمة واحدة على الأقل من باقات غسيل السيارات.');
        return;
      }

      setIsSubmitting(true);
      try {
        const nextId = await getNextSequentialOrderId();
        const orderIdStr = String(nextId);

        const itemsMap: Record<string, number> = {};
        const itemsDetails = selectedCarServicesList.map((srv) => {
          itemsMap[srv.id] = 1;
          return {
            serviceId: srv.id,
            name: srv.name,
            count: 1,
            unitPrice: srv.price,
            subtotal: srv.price,
          };
        });

        const finalBrand = selectedCarBrand ? selectedCarBrand.nameAr.split('(')[0].trim() : 'سيارة خاصة';
        const finalModel = customCarModel.trim() ? customCarModel.trim() : selectedCarModel;

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
          timeSlot: timeSlot === 'morning' ? 'صباحاً (10 ص - 2 ظ)' : 'مساءً (3 م - 8 م)',
          items: itemsMap,
          itemsDetails,
          deliveryFee: deliveryType === 'pickup' ? (settings.deliveryFee ?? 30) : 0,
          totalPrice: carGrandTotal,
          notes: notes.trim(),
          source: 'mobile-car',
        });

        const businessPhone = settings.businessPhone?.trim() || '';
        const invoiceText = buildWhatsAppMessage(newBooking, businessPhone, services, settings.brandName);
        const waUrl = getWhatsAppUrl(businessPhone, invoiceText);

        try {
          const link = document.createElement('a');
          link.href = waUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (e) {
          window.open(waUrl, '_blank');
        }

        setIsCheckoutOpen(false);
        onBookingSuccess(newBooking);
      } catch (err: any) {
        setFormError(err?.message || 'تعذر إرسال الحجز، يرجى المحاولة مرة أخرى.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Branch B: CARPETS & FURNITURE BOOKING
    if (totalItemCount === 0) {
      setFormError('يرجى اختيار عنصر واحد على الأقل من قائمة السجاد والمفروشات.');
      return;
    }

    setIsSubmitting(true);
    try {
      const nextId = await getNextSequentialOrderId();
      const orderIdStr = String(nextId);

      const itemsDetails = Object.entries(selectedItems)
        .filter(([, count]) => count > 0)
        .map(([serviceId, count]) => {
          const s = carpetServices.find((item) => item.id === serviceId);
          return {
            serviceId,
            name: s ? s.name : 'خدمة غسيل',
            count,
            unitPrice: s ? s.price : 0,
            subtotal: s ? s.price * count : 0,
          };
        });

      const newBooking = await createBookingInFirestore({
        orderId: orderIdStr,
        orderNumber: nextId,
        serviceCategory: 'carpets',
        customerName: customerName.trim(),
        phone: phone.trim(),
        deliveryType,
        address: address.trim(),
        deliveryDate,
        timeSlot: timeSlot === 'morning' ? 'صباحاً (10 ص - 2 ظ)' : 'مساءً (3 م - 8 م)',
        items: selectedItems,
        itemsDetails,
        deliveryFee: effectiveDeliveryFee,
        totalPrice: grandTotal,
        notes: notes.trim(),
        source: 'mobile-carpet',
      });

      // Launch WhatsApp with pre-formatted invoice sent to dynamic business phone
      const businessPhone = settings.businessPhone?.trim() || '';
      const invoiceText = buildWhatsAppMessage(newBooking, businessPhone, services, settings.brandName);
      const waUrl = getWhatsAppUrl(businessPhone, invoiceText);

      try {
        const link = document.createElement('a');
        link.href = waUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        window.open(waUrl, '_blank');
      }

      // Reset and close sheet
      setSelectedItems({});
      setIsCheckoutOpen(false);
      onBookingSuccess(newBooking);
    } catch (err: any) {
      setFormError(err?.message || 'تعذر إرسال الحجز، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Search in Order Tracker
  const handleSearchOrder = () => {
    if (!trackerInput.trim()) return;
    setTrackerLoading(true);
    setTrackerHasSearched(true);

    const cleanTerm = trackerInput.trim().replace('#', '');
    const unsubscribe = subscribeToBookings((allBookings) => {
      const found = allBookings.find(
        (b) =>
          b.orderId === cleanTerm ||
          b.phone.replace(/\D/g, '').includes(cleanTerm.replace(/\D/g, '')) ||
          b.customerName.toLowerCase().includes(cleanTerm.toLowerCase())
      );
      setTrackedBooking(found || null);
      setTrackerLoading(false);
      unsubscribe();
    });
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-['Cairo',sans-serif] pb-24 select-none">
      
      {/* 1. Mobile Top Header */}
      <header className="sticky top-0 z-40 bg-[#0A0F1D]/95 backdrop-blur-md border-b border-cyan-500/20 px-4 py-3">
        <div className="flex items-center justify-between">
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/30 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-base font-black text-white font-['Alexandria',sans-serif] leading-tight">
                {settings.brandName || 'CleanPro Express'}
              </h1>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>مفتوح لاستقبال الحجوزات 24/7</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {settings.businessPhone && (
              <a
                href={`https://wa.me/${normalizeWhatsAppPhone(settings.businessPhone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center active:scale-95 transition-transform"
                title="واتساب مباشر"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={onOpenAdmin}
              className="p-1.5 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 text-[11px] font-bold flex items-center gap-1 active:scale-95"
              title="لوحة الإدارة"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>إدارة</span>
            </button>
          </div>

        </div>

        {/* Dynamic Top Announcement for Mobile */}
        {settings.announcementActive && settings.announcementText && (
          <div className="mt-2 py-1 px-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-[11px] text-cyan-200 flex items-center gap-1.5 animate-in slide-in-from-top-1">
            <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">{settings.announcementText}</span>
          </div>
        )}
      </header>

      {/* 2. Main Body Content Based on Active Mobile Tab */}
      <main className="px-3.5 pt-3 space-y-4">

        {/* A. BOOKING TAB (Main Experience: Carpets & Cars) */}
        {mobileTab === 'booking' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Promo Media Slider (Completely hidden if no media added) */}
            <PromoMediaSlider items={mediaItems} />

            {/* DUAL SERVICE CATEGORY TOGGLE: CARPETS VS CARS */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-cyan-500/30 shadow-lg">
              <button
                type="button"
                onClick={() => setServiceCategory('carpets')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                  serviceCategory === 'carpets'
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>🧺 سجاد ومفروشات</span>
              </button>

              <button
                type="button"
                onClick={() => setServiceCategory('cars')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                  serviceCategory === 'cars'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>🚗 غسيل سيارات</span>
              </button>
            </div>

            {/* BRANCH 1: CARPETS & FURNITURE PROGRESSIVE SEQUENTIAL VIEW */}
            {serviceCategory === 'carpets' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                {/* Carpet Steps Indicator */}
                <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCarpetStep(1)}
                    className={`py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                      carpetStep === 1
                        ? 'bg-cyan-500 text-slate-950 shadow font-black'
                        : carpetStep > 1
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-500'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-slate-950/40 flex items-center justify-center text-[9px] font-black">
                      {carpetStep > 1 ? '✓' : '1'}
                    </span>
                    <span className="truncate">1. المفروشات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (activeCategory) setCarpetStep(2);
                    }}
                    className={`py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                      carpetStep === 2
                        ? 'bg-teal-500 text-slate-950 shadow font-black'
                        : carpetStep > 2
                        ? 'bg-teal-950/60 text-teal-300 border border-teal-500/30'
                        : 'text-slate-500'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-slate-950/40 flex items-center justify-center text-[9px] font-black">
                      {carpetStep > 2 ? '✓' : '2'}
                    </span>
                    <span className="truncate">2. المقاس والعدد</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (totalItemCount > 0) setCarpetStep(3);
                    }}
                    disabled={totalItemCount === 0}
                    className={`py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                      carpetStep === 3
                        ? 'bg-purple-500 text-white shadow font-black'
                        : totalItemCount > 0
                        ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                        : 'text-slate-600'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-slate-950/40 flex items-center justify-center text-[9px] font-black">
                      3
                    </span>
                    <span className="truncate">3. نوع الغسيل</span>
                  </button>
                </div>

                {/* STEP 1: SELECT CARPET CATEGORY */}
                {carpetStep === 1 ? (
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 space-y-3 shadow-lg animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                      <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xs">
                        1
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-white font-['Alexandria',sans-serif]">
                          الخطوة 1: اختار نوع المفروشات
                        </h3>
                        <span className="text-[10px] text-slate-400">
                          اضغط على نوع الصنف للانتقال فوراً لتحديد المقاسات
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {MOBILE_CARPET_CATEGORIES.map((cat) => {
                        const isSelected = activeCategory === cat.id;
                        return (
                          <div
                            key={cat.id}
                            onClick={() => {
                              setActiveCategory(cat.id);
                              setCarpetStep(2); // Automatically advance to Step 2!
                            }}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all active:scale-98 cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-sm'
                                : 'bg-slate-950/80 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <h4 className="text-xs font-bold text-white font-['Alexandria',sans-serif]">
                                {cat.name}
                              </h4>
                              <p className="text-[10px] text-cyan-300/80 truncate">
                                {cat.subname}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-cyan-400 font-bold">عرض المقاسات</span>
                              <ChevronLeft className="w-3.5 h-3.5 text-cyan-400" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Completed Step 1 Summary Card */
                  <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                        ✓
                      </span>
                      <div>
                        <span className="text-[10px] text-slate-400 block">1. نوع المفروشات:</span>
                        <strong className="text-white text-xs font-['Alexandria',sans-serif]">
                          {MOBILE_CARPET_CATEGORIES.find((c) => c.id === activeCategory)?.name || 'سجاد ومفروشات'}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCarpetStep(1)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-300 text-[11px] font-bold"
                    >
                      تغيير ✏️
                    </button>
                  </div>
                )}

                {/* STEP 2: SELECT SIZES, ITEMS & COUNTERS */}
                {carpetStep === 2 ? (
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-teal-500/40 space-y-3 shadow-lg animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-black text-xs">
                          2
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-white font-['Alexandria',sans-serif]">
                            الخطوة 2: اختار المقاسات وعدد القطع
                          </h3>
                          <span className="text-[10px] text-slate-400">
                            استخدم عدادات (+) و (-) لتحديد الكمية
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] text-teal-400 font-bold">
                        {totalItemCount} قطع ({itemsSubtotal} ج)
                      </span>
                    </div>

                    {/* Quick switch category tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {MOBILE_CARPET_CATEGORIES.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setActiveCategory(c.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all ${
                            activeCategory === c.id
                              ? 'bg-teal-500 text-slate-950 font-black'
                              : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {c.name.split(' ')[0]} {c.name.split(' ')[1] || ''}
                        </button>
                      ))}
                    </div>

                    {/* Items list with counters */}
                    <div className="space-y-2">
                      {filteredServices.map((service) => {
                        const count = selectedItems[service.id] || 0;
                        return (
                          <div
                            key={service.id}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                              count > 0
                                ? 'bg-teal-950/30 border-teal-500/50 shadow-sm'
                                : 'bg-slate-950/80 border-slate-800/80'
                            }`}
                          >
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-white text-xs truncate">
                                  {service.name}
                                </h4>
                                {count > 0 && (
                                  <span className="px-1.5 py-0.2 rounded bg-teal-500 text-slate-950 text-[9px] font-black shrink-0">
                                    {count}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <span className="text-teal-400 font-black font-['Alexandria',sans-serif]">
                                  {service.price} ج.م
                                </span>
                                <span className="text-[10px] text-slate-400">/ {service.unit || 'قطعة'}</span>
                              </div>
                              {service.subname && (
                                <p className="text-[10px] text-slate-400 truncate">
                                  {service.subname}
                                </p>
                              )}
                            </div>

                            {/* Touch Counter */}
                            <div className="flex items-center gap-1.5 shrink-0 bg-slate-900 p-1 rounded-xl border border-slate-800">
                              <button
                                type="button"
                                onClick={() => handleUpdateCount(service.id, -1)}
                                disabled={count === 0}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-all ${
                                  count > 0
                                    ? 'bg-slate-800 text-slate-200'
                                    : 'bg-slate-950 text-slate-700 cursor-not-allowed'
                                }`}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <span className="w-5 text-center text-xs font-black text-white font-mono">
                                {count}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleUpdateCount(service.id, 1)}
                                className="w-8 h-8 rounded-lg bg-teal-500 text-slate-950 font-bold flex items-center justify-center active:scale-90 transition-all"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Advance to Step 3 Button */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setCarpetStep(3)}
                        disabled={totalItemCount === 0}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all font-['Alexandria',sans-serif] ${
                          totalItemCount > 0
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 active:scale-98 shadow-md'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span>
                          {totalItemCount > 0
                            ? `تأكيد القطع (${totalItemCount} قطع - ${itemsSubtotal} ج) ⬅️`
                            : 'اختر قطعة واحدة على الأقل'}
                        </span>
                      </button>
                    </div>
                  </div>
                ) : carpetStep > 2 ? (
                  /* Completed Step 2 Summary Card */
                  <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                        ✓
                      </span>
                      <div>
                        <span className="text-[10px] text-slate-400 block">2. القطع المحددة:</span>
                        <strong className="text-teal-300 text-xs font-['Alexandria',sans-serif]">
                          {totalItemCount} قطع مختارة بإجمالي {itemsSubtotal} ج.م
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCarpetStep(2)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-teal-300 text-[11px] font-bold"
                    >
                      تعديل ✏️
                    </button>
                  </div>
                ) : null}

                {/* STEP 3: WASH & CARE TREATMENTS (هتعمل إيه في السجاد) */}
                {carpetStep === 3 && (
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-500/40 space-y-3 shadow-lg animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-xs">
                          3
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-white font-['Alexandria',sans-serif]">
                            الخطوة 3: اختار هتعمل إيه في السجاد
                          </h3>
                          <span className="text-[10px] text-slate-400">
                            مواصفات الغسيل، التعقيم بالبخار والتغليف
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {MOBILE_WASH_TREATMENTS.map((tr) => {
                        const isChecked = Boolean(carpetTreatments[tr.id]);
                        return (
                          <div
                            key={tr.id}
                            onClick={() =>
                              setCarpetTreatments((prev) => ({
                                ...prev,
                                [tr.id]: !prev[tr.id],
                              }))
                            }
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all active:scale-98 cursor-pointer ${
                              isChecked
                                ? 'bg-purple-950/40 border-purple-400/60 shadow-sm'
                                : 'bg-slate-950/70 border-slate-800'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-bold text-white font-['Alexandria',sans-serif]">
                                  {tr.name}
                                </h4>
                              </div>
                              <p className="text-[10px] text-slate-400 line-clamp-1">
                                {tr.subname}
                              </p>
                              <span className="inline-block px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 text-[9px] font-bold border border-purple-500/30">
                                {tr.badge}
                              </span>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                                isChecked
                                  ? 'bg-purple-500 border-purple-400 text-slate-950 font-bold'
                                  : 'bg-slate-900 border-slate-700 text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Open Checkout Bottom Sheet Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setIsCheckoutOpen(true)}
                        disabled={totalItemCount === 0}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-98 font-['Alexandria',sans-serif]"
                      >
                        <span>متابعة لتحديد مكان وموعد الاستلام وتأكيد الحجز ⬅️</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BRANCH 2: CAR WASH & DETAILING PROGRESSIVE SEQUENTIAL WIZARD */}
            {serviceCategory === 'cars' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                {/* Car Steps Indicator */}
                <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCarStep(1)}
                    className={`py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                      carStep === 1
                        ? 'bg-amber-500 text-slate-950 shadow font-black'
                        : carStep > 1
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                        : 'text-slate-500'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-slate-950/40 flex items-center justify-center text-[9px] font-black">
                      {carStep > 1 ? '✓' : '1'}
                    </span>
                    <span className="truncate">1. الشركة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedCarBrand) setCarStep(2);
                    }}
                    className={`py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                      carStep === 2
                        ? 'bg-cyan-500 text-slate-950 shadow font-black'
                        : carStep > 2
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-500'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-slate-950/40 flex items-center justify-center text-[9px] font-black">
                      {carStep > 2 ? '✓' : '2'}
                    </span>
                    <span className="truncate">2. الموديل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedCarBrand) setCarStep(3);
                    }}
                    className={`py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                      carStep === 3
                        ? 'bg-emerald-500 text-slate-950 shadow font-black'
                        : 'text-slate-500'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-slate-950/40 flex items-center justify-center text-[9px] font-black">
                      3
                    </span>
                    <span className="truncate">3. الخدمات</span>
                  </button>
                </div>

                {/* STEP 1: CAR BRAND SEARCH & SELECTION */}
                {carStep === 1 ? (
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-3 shadow-lg animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                          1
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-white font-['Alexandria',sans-serif]">
                            الخطوة 1: اختار شركة وماركة سيارتك
                          </h3>
                          <span className="text-[10px] text-slate-400">
                            اضغط على الماركة ليفتح لك الموديل فوراً
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Search box for brands */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={carBrandSearch}
                        onChange={(e) => setCarBrandSearch(e.target.value)}
                        placeholder="ابحث عن ماركة (بي إم دبليو، هيونداي، تويوتا، كيا...)"
                        className="w-full pr-8 pl-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Brands Grid */}
                    <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-0.5 scrollbar-thin">
                      {filteredBrands.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setSelectedCarBrand(b);
                            setSelectedCarModel(b.popularModels[0] || '');
                            setCustomCarModel('');
                            setCarStep(2); // Automatically advance to Step 2!
                          }}
                          className={`p-2.5 rounded-xl text-right text-xs font-bold transition-all active:scale-95 flex items-center justify-between gap-1.5 ${
                            selectedCarBrand?.id === b.id
                              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                              : 'bg-slate-950 text-slate-300 border border-slate-800 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{b.nameAr.split('(')[0].trim()}</span>
                          <ChevronLeft className="w-3 h-3 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Completed Step 1 Summary Card */
                  <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                        ✓
                      </span>
                      <div>
                        <span className="text-[10px] text-slate-400 block">1. ماركة السيارة:</span>
                        <strong className="text-white text-xs font-['Alexandria',sans-serif]">
                          {selectedCarBrand?.nameAr.split('(')[0].trim() || 'سيارة خاصة'}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCarStep(1)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 text-[11px] font-bold"
                    >
                      تغيير ✏️
                    </button>
                  </div>
                )}

                {/* STEP 2: CAR MODEL & TRIM */}
                {carStep === 2 ? (
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 space-y-3 shadow-lg animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xs">
                          2
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-white font-['Alexandria',sans-serif]">
                            الخطوة 2: اختار موديل ونسخة عربيتك
                          </h3>
                          <span className="text-[10px] text-slate-400">
                            حدد الفئة لـ ({selectedCarBrand?.nameAr.split('(')[0].trim()})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Popular models pills */}
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-0.5">
                      {selectedCarBrand?.popularModels.map((model) => (
                        <button
                          key={model}
                          type="button"
                          onClick={() => {
                            setSelectedCarModel(model);
                            setCustomCarModel('');
                            setCarStep(3); // Automatically advance to Step 3!
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                            selectedCarModel === model && !customCarModel
                              ? 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                              : 'bg-slate-950 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {model} ⬅️
                        </button>
                      ))}
                    </div>

                    {/* Custom Trim or Write-In Input */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-800">
                      <label className="block text-[10px] font-bold text-slate-400">
                        أو اكتب فئة مخصصة لعربيتك:
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={customCarModel}
                          onChange={(e) => setCustomCarModel(e.target.value)}
                          placeholder="مثال: إم 4 كومبيتيشن / فئة تانية سبورت..."
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                        />
                        <button
                          type="button"
                          onClick={() => setCarStep(3)} // Advance to Step 3!
                          className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black"
                        >
                          تأكيد ⬅️
                        </button>
                      </div>
                    </div>
                  </div>
                ) : carStep > 2 ? (
                  /* Completed Step 2 Summary Card */
                  <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                        ✓
                      </span>
                      <div>
                        <span className="text-[10px] text-slate-400 block">2. الموديل والفئة:</span>
                        <strong className="text-cyan-300 text-xs font-['Alexandria',sans-serif]">
                          {customCarModel.trim() || selectedCarModel}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCarStep(2)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-300 text-[11px] font-bold"
                    >
                      تعديل ✏️
                    </button>
                  </div>
                ) : null}

                {/* STEP 3: SELECT CAR SERVICES (هتعمل إيه في العربية) */}
                {carStep === 3 && (
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 space-y-3 shadow-lg animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                          3
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-white font-['Alexandria',sans-serif]">
                            الخطوة 3: اختار هتعمل إيه في عربيتك
                          </h3>
                          <span className="text-[10px] text-slate-400">
                            {selectedCarBrand?.nameAr.split('(')[0].trim()} - {customCarModel.trim() || selectedCarModel}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] text-emerald-400 font-bold">
                        {selectedCarServicesList.length} خدمات ({carServicesSubtotal} ج)
                      </span>
                    </div>

                    <div className="space-y-2">
                      {carServices.map((srv) => {
                        const isSelected = !!selectedCarServiceIds[srv.id];
                        return (
                          <div
                            key={srv.id}
                            onClick={() => handleToggleCarService(srv.id)}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer active:scale-98 ${
                              isSelected
                                ? 'bg-emerald-950/30 border-emerald-500/60 shadow-sm'
                                : 'bg-slate-950/70 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <div
                                className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
                                  isSelected
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                    : 'border-slate-700 bg-slate-900'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>

                              <div className="space-y-0.5">
                                <h4 className="font-bold text-white text-xs truncate">
                                  {srv.name}
                                </h4>
                                {srv.description && (
                                  <p className="text-[10px] text-slate-400 line-clamp-1">
                                    {srv.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-left shrink-0">
                              <span className="text-emerald-400 font-black text-xs font-['Alexandria',sans-serif]">
                                {srv.price} ج.م
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Open Checkout Bottom Sheet Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setIsCheckoutOpen(true)}
                        disabled={selectedCarServicesList.length === 0}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-98 font-['Alexandria',sans-serif]"
                      >
                        <span>تأكيد الخدمات ومتابعة الحجز ⬅️</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* B. TRACKER TAB */}
        {mobileTab === 'tracker' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <h2 className="text-base font-black text-white flex items-center gap-2 font-['Alexandria',sans-serif]">
                <Search className="w-4 h-4 text-cyan-400" />
                <span>تتبع حالة غسيل سجادك</span>
              </h2>
              <p className="text-xs text-slate-300">
                أدخل رقم الهاتف أو رقم الطلب (مثال: #1 أو #14) للاطلاع على المرحلة الحالية لمفروشاتك.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={trackerInput}
                  onChange={(e) => setTrackerInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchOrder()}
                  placeholder="رقم الهاتف أو رقم الطلب..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleSearchOrder}
                  disabled={trackerLoading}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 active:scale-95 transition-all shrink-0 font-['Alexandria',sans-serif]"
                >
                  {trackerLoading ? 'بحث...' : 'تتبع'}
                </button>
              </div>
            </div>

            {/* Tracker Result Card */}
            {trackerHasSearched && (
              trackedBooking ? (
                <div className="p-4 rounded-2xl glass-panel-cyan border border-cyan-500/40 space-y-3 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <span className="text-[10px] text-cyan-400 font-bold block">طلب رقم</span>
                      <span className="text-base font-black text-white font-mono">
                        #{trackedBooking.orderId}
                      </span>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {STATUS_METADATA[trackedBooking.status]?.label || trackedBooking.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-300">
                    <p><strong className="text-white">العميل:</strong> {trackedBooking.customerName}</p>
                    <p><strong className="text-white">تاريخ الاستلام:</strong> {trackedBooking.deliveryDate}</p>
                    <p><strong className="text-white">الإجمالي:</strong> {trackedBooking.totalPrice} ج.م</p>
                  </div>

                  {/* Status Progress Stepper */}
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 block mb-2">مراحل خط الإنتاج:</span>
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                      {['received', 'washing', 'ready', 'delivered'].map((st, idx) => {
                        const statusOrder = ['received', 'washing', 'ready', 'delivered'];
                        const currentIdx = statusOrder.indexOf(trackedBooking.status);
                        const isDone = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;

                        return (
                          <div
                            key={st}
                            className={`p-1.5 rounded-lg border flex flex-col items-center justify-center gap-1 ${
                              isCurrent
                                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                                : isDone
                                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 font-semibold'
                                : 'bg-slate-950 text-slate-600 border-slate-800'
                            }`}
                          >
                            <span className="text-[13px]">{STATUS_METADATA[st as OrderStatus]?.description ? '•' : '•'}</span>
                            <span className="leading-tight">{STATUS_METADATA[st as OrderStatus]?.label || st}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs">
                  لم يتم العثور على أي طلب برقم "{trackerInput}". يرجى التأكد من الرقم والمحاولة مرة أخرى.
                </div>
              )
            )}
          </div>
        )}

        {/* C. MEDIA GALLERY TAB (Photos & Videos) */}
        {mobileTab === 'media' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/80 via-slate-900 to-purple-950/80 border border-cyan-500/30 text-center space-y-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 inline-block">
                معرض المغسلة الحصري
              </span>
              <h2 className="text-base font-black text-white font-['Alexandria',sans-serif]">
                صور وفيديوهات عن المكان والخدمة
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                شاهد مراحل غسيل السجاد، أحدث ماكينات التعقيم، وعروضنا الحصرية بالفيديو والصور.
              </p>
            </div>

            {/* Media Items Cards */}
            <div className="space-y-3">
              {mediaItems.filter((i) => i.active !== false).length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs">
                  لا توجد صور أو فيديوهات معروضة حالياً.
                </div>
              ) : (
                mediaItems
                  .filter((i) => i.active !== false)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedMedia(item)}
                      className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 overflow-hidden active:scale-98 transition-all cursor-pointer"
                    >
                      <div className="relative aspect-video w-full bg-black">
                        {item.type === 'video' ? (
                          (() => {
                            const vInfo = formatVideoEmbedInfo(item.url);
                            return (
                              <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
                                {vInfo.thumbnailUrl ? (
                                  <img
                                    src={vInfo.thumbnailUrl}
                                    alt={item.title || 'فيديو'}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <video
                                    src={vInfo.embedUrl}
                                    className="w-full h-full object-cover"
                                    preload="metadata"
                                    muted
                                  />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <div className="w-11 h-11 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-md">
                                    <Play className="w-5 h-5 ml-0.5" />
                                  </div>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="relative w-full h-full">
                            <img src={item.url} alt={item.title || 'صورة'} className="w-full h-full object-cover" />
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] flex items-center gap-1">
                              <Maximize2 className="w-3 h-3 text-cyan-400" />
                              <span>اضغط للتكبير</span>
                            </div>
                          </div>
                        )}

                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                          {item.type === 'video' ? 'فيديو' : 'صورة'}
                        </div>
                      </div>

                      <div className="p-3 space-y-1">
                        <h3 className="font-bold text-white text-xs">
                          {item.title || (item.type === 'video' ? 'فيديو ترويجي' : 'صورة عن المكان')}
                        </h3>
                        {item.subtitle && (
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* D. ABOUT / FEATURES TAB */}
        {mobileTab === 'about' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <h2 className="text-base font-black text-white font-['Alexandria',sans-serif]">
                لماذا يفضل عملاؤنا {settings.brandName || 'CleanPro Express'}؟
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                نستخدم أحدث تكنولوجيا إيطالية وألمانية متخصصة في العناية بأنسجة السجاد اليدوي والميكانيكي والمفروشات الفاخرة.
              </p>
            </div>

            <div className="space-y-2">
              {(features.length > 0 ? features : []).map((feat, index) => (
                <div
                  key={feat.id || index}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-white text-xs">
                      {feat.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Branch Address info */}
            {settings.shopBranchAddress && (
              <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{settings.shopBranchAddress}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer Credits & Switch to Desktop View */}
        <div className="pt-6 pb-4 text-center space-y-3 border-t border-slate-800/80 text-xs text-slate-500">
          <button
            onClick={onSwitchToDesktop}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-[11px] font-semibold inline-flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span>التبديل إلى نسخة الكمبيوتر (Desktop View)</span>
          </button>

          <div className="flex flex-col items-center gap-0.5 text-[10px] opacity-60">
            <span>تم تطوير الموقع بواسطة عبد الرحمن - 01554544459</span>
            <span dir="ltr">Developed by Abdelrahman - 01554544459</span>
          </div>
        </div>

      </main>

      {/* 3. Sticky Quick Cart Bottom Bar (Only when items selected & in booking tab) */}
      {mobileTab === 'booking' && !isCheckoutOpen && (
        ((serviceCategory === 'carpets' && totalItemCount > 0) ||
         (serviceCategory === 'cars' && selectedCarServicesList.length > 0)) && (
          <div className="fixed bottom-16 left-0 right-0 z-40 p-3 bg-gradient-to-t from-[#070B14] via-[#070B14]/90 to-transparent pointer-events-none">
            <div className="max-w-md mx-auto pointer-events-auto">
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className={`w-full py-3.5 px-4 rounded-2xl text-slate-950 font-black flex items-center justify-between shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-98 transition-all cursor-pointer font-['Alexandria',sans-serif] ${
                  serviceCategory === 'cars'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 shadow-amber-500/30'
                    : 'bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 shadow-cyan-500/30'
                }`}
              >
                <div className="flex items-center gap-2 text-right">
                  <span className="w-7 h-7 rounded-full bg-slate-950 text-white text-xs flex items-center justify-center font-black">
                    {serviceCategory === 'cars' ? selectedCarServicesList.length : totalItemCount}
                  </span>
                  <span className="text-xs">
                    {serviceCategory === 'cars'
                      ? `غسيل ${selectedCarBrand?.nameAr.split('(')[0].trim() || 'سيارة'}: ${carGrandTotal} ج.م`
                      : `المجموع: ${grandTotal} ج.م`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-black">
                  <span>تأكيد بيانات الحجز</span>
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        )
      )}

      {/* 4. Streamlined Mobile Checkout Bottom Sheet */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg mx-auto bg-[#0F172A] border-t border-cyan-500/40 rounded-t-3xl p-5 text-slate-100 max-h-[90vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom-6 duration-300">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white font-['Alexandria',sans-serif]">
                  {serviceCategory === 'cars' ? 'إتمام حجز غسيل وتفصيل السيارة' : 'إتمام حجز غسيل المفروشات'}
                </h3>
                <span className={`text-xs font-bold ${serviceCategory === 'cars' ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {serviceCategory === 'cars'
                    ? `🚗 ${selectedCarBrand?.nameAr.split('(')[0].trim() || 'سيارة'} - ${customCarModel.trim() || selectedCarModel} (${selectedCarServicesList.length} خدمات) • الإجمالي: ${carGrandTotal} ج.م`
                    : `${totalItemCount} قطع • الإجمالي: ${grandTotal} ج.م`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBooking} className="space-y-3.5">
              
              {/* Delivery Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    deliveryType === 'pickup'
                      ? serviceCategory === 'cars' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>
                    {serviceCategory === 'cars'
                      ? `مغسلة دليفري متنقلة (+${settings.deliveryFee ?? 30} ج)`
                      : `توصيل للمنزل (+${settings.deliveryFee ?? 30} ج)`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('dropoff')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    deliveryType === 'dropoff'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>
                    {serviceCategory === 'cars' ? 'بمقر المغسلة الرئيسي (مجاني)' : 'تسليم بالفرع (مجاني)'}
                  </span>
                </button>
              </div>

              {/* Name & Phone */}
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الاسم بالكامل *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: محمد أحمد"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    رقم الهاتف (الواتساب) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono outline-none focus:border-cyan-400 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Address (If Home Delivery) */}
              {deliveryType === 'pickup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {serviceCategory === 'cars'
                      ? 'عنوان تواجد السيارة أو موقع الجراج لاستقبال المغسلة المتنقلة *'
                      : 'عنوان الاستلام والتوصيل بالتفصيل *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={
                      serviceCategory === 'cars'
                        ? 'المنطقة، الشارع، أمام العمارة أو رقم الجراج...'
                        : 'المنطقة، الشارع، العمارة، الشقة...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              {/* Date & Time Slot */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    موعد الاستلام
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    الفترة المفضلة
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
                  >
                    <option value="morning">صباحاً (10 ص - 2 ظ)</option>
                    <option value="evening">مساءً (3 م - 8 م)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  أي ملاحظات خاصة (اختياري)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="نوع البقع، أو تعليمات للمندوب..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {formError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-98 transition-all cursor-pointer font-['Alexandria',sans-serif]"
              >
                <MessageCircle className="w-5 h-5 text-slate-950" />
                <span>
                  {isSubmitting ? 'جاري تسجيل الطلب...' : 'تأكيد الحجز والإرسال على واتساب'}
                </span>
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 5. Mobile Fixed Bottom Navigation Bar (Thumb Bar) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0F1D]/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5">
        <div
          className={`max-w-md mx-auto grid gap-1 ${
            mediaItems.filter((i) => i.active !== false).length > 0 ? 'grid-cols-5' : 'grid-cols-4'
          }`}
        >
          <button
            onClick={() => setMobileTab('booking')}
            className={`py-1.5 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
              mobileTab === 'booking'
                ? 'text-cyan-400 font-bold bg-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px]">حجز جديد</span>
          </button>

          {mediaItems.filter((i) => i.active !== false).length > 0 && (
            <button
              onClick={() => setMobileTab('media')}
              className={`py-1.5 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                mobileTab === 'media'
                  ? 'text-cyan-400 font-bold bg-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-[10px]">صور وفيديوهات</span>
            </button>
          )}

          <button
            onClick={() => setMobileTab('tracker')}
            className={`py-1.5 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
              mobileTab === 'tracker'
                ? 'text-cyan-400 font-bold bg-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="text-[10px]">تتبع طلبك</span>
          </button>

          <button
            onClick={() => setMobileTab('about')}
            className={`py-1.5 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
              mobileTab === 'about'
                ? 'text-cyan-400 font-bold bg-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px]">عن المغسلة</span>
          </button>

          <button
            onClick={onOpenAdmin}
            className="py-1.5 flex flex-col items-center justify-center gap-1 rounded-xl text-slate-400 hover:text-purple-300 transition-all"
          >
            <Lock className="w-4 h-4 text-purple-400" />
            <span className="text-[10px]">المالك</span>
          </button>

        </div>
      </nav>

      {/* Full-screen Lightbox & Video Player Modal for Mobile */}
      {selectedMedia && (
        <div
          onClick={() => setSelectedMedia(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-slate-950 border border-cyan-500/40 rounded-2xl overflow-hidden p-3 text-slate-100 space-y-2 shadow-2xl"
          >
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-3 left-3 z-20 p-1.5 rounded-xl bg-slate-900/80 text-white border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative aspect-video max-h-[70vh] w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
              {selectedMedia.type === 'video' ? (
                (() => {
                  const vInfo = formatVideoEmbedInfo(selectedMedia.url);
                  return vInfo.isIframe ? (
                    <iframe
                      src={vInfo.embedUrl}
                      title="Video"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={vInfo.embedUrl}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  );
                })()
              ) : (
                <img src={selectedMedia.url} alt="Expanded" className="w-full h-full object-contain" />
              )}
            </div>

            <div className="p-1 space-y-1">
              <h4 className="text-xs font-bold text-white">
                {selectedMedia.title || (selectedMedia.type === 'video' ? 'فيديو' : 'صورة')}
              </h4>
              {selectedMedia.subtitle && (
                <p className="text-[11px] text-slate-400">
                  {selectedMedia.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
