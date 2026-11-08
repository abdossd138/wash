import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Package,
  Truck,
  AlertCircle,
  Loader2,
  Phone,
  Calendar,
  MapPin,
  X,
} from 'lucide-react';
import { Booking, OrderStatus, AppSettings } from '../types';
import { STATUS_METADATA, SERVICE_ITEMS } from '../constants';
import { searchBookingsForCustomer, getWhatsAppUrl } from '../services/bookingService';

interface OrderTrackerProps {
  initialSearchTerm?: string;
  settings: AppSettings;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  initialSearchTerm = '',
  settings,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
      handleSearch(initialSearchTerm);
    }
  }, [initialSearchTerm]);

  const handleSearch = async (termToSearch?: string) => {
    const query = (termToSearch !== undefined ? termToSearch : searchTerm).trim();
    if (!query) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const bookings = await searchBookingsForCustomer(query);
      setResults(bookings);
      if (bookings.length > 0) {
        setSelectedBooking(bookings[0]);
      } else {
        setSelectedBooking(null);
      }
    } catch (err) {
      console.error('Error searching bookings:', err);
      setResults([]);
      setSelectedBooking(null);
    } finally {
      setIsSearching(false);
    }
  };

  const getStepStatus = (stepIndex: number, currentStatus: OrderStatus) => {
    const currentStepIndex = STATUS_METADATA[currentStatus]?.stepIndex || 1;
    if (currentStatus === 'cancelled') return 'cancelled';
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <section id="tracker" className="py-12 sm:py-16 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>نظام التتبع المباشر البسيط</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white font-['Alexandria',sans-serif]">
            تتبع حالة سجادك برقم الطلب البسيط (#)
          </h2>
          <p className="text-sm text-slate-400">
            أدخل رقم طلبك التسلسلي السهل (مثال: 1 أو 14) أو رقم الهاتف لمعرفة مرحلة الغسيل الحالية فوراً.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="max-w-2xl mx-auto mb-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="relative flex items-center"
          >
            <div className="absolute right-4 text-cyan-400 pointer-events-none">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="اكتب رقم الطلب البسيط (مثل 1 أو 14) أو رقم هاتفك..."
              className="w-full pr-12 pl-32 py-4 rounded-2xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-white placeholder-slate-500 text-sm sm:text-base outline-none shadow-xl transition-all"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setHasSearched(false);
                  setResults([]);
                  setSelectedBooking(null);
                }}
                className="absolute left-28 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={isSearching || !searchTerm.trim()}
              className="absolute left-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:bg-slate-800 disabled:text-slate-500 transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>بحث</span>
              )}
            </button>
          </form>

          {/* Quick Search Helper Tags */}
          <div className="flex items-center justify-center gap-3 mt-3 text-xs text-slate-500">
            <span>أمثلة سريعة:</span>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('1');
                handleSearch('1');
              }}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              طلب رقم #1
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('2');
                handleSearch('2');
              }}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              طلب رقم #2
            </button>
          </div>
        </div>

        {/* Results Area */}
        {isSearching && (
          <div className="py-16 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">جاري الاستعلام اللحظي من قاعدة البيانات...</p>
          </div>
        )}

        {!isSearching && hasSearched && results.length === 0 && (
          <div className="glass-panel p-8 rounded-2xl border-slate-800 text-center max-w-lg mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <AlertCircle className="w-6 h-6 text-amber-400" />
            </div>
            <h4 className="text-base font-bold text-white">لم نتمكن من العثور على طلب مطابق</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              تأكد من إدخال رقم الطلب الصحيح (مثال: 14) أو نفس رقم الهاتف المستخدم أثناء الحجز.
            </p>
            <a
              href={getWhatsAppUrl(
                settings.businessPhone,
                `مرحباً، أبحث عن حالة طلبي ولم أجده برقم: ${searchTerm}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all mt-2"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>مراسلة خدمة العملاء واتساب</span>
            </a>
          </div>
        )}

        {/* Found Results */}
        {!isSearching && results.length > 0 && selectedBooking && (
          <div className="space-y-6">
            
            {/* If multiple orders match */}
            {results.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <span className="text-xs text-slate-400 whitespace-nowrap">الطلبات المسجلة برقمك ({results.length}):</span>
                {results.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedBooking.id === b.id
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    #{b.orderId} ({STATUS_METADATA[b.status]?.label})
                  </button>
                ))}
              </div>
            )}

            {/* Main Order Status Card */}
            <div className="glass-panel-cyan rounded-3xl p-6 sm:p-8 space-y-8">
              
              {/* Order Meta Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cyan-500/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-['Alexandria',sans-serif]">
                      طلب رقم #{selectedBooking.orderId}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        STATUS_METADATA[selectedBooking.status]?.bgColor || 'bg-cyan-500/10'
                      } ${
                        STATUS_METADATA[selectedBooking.status]?.color || 'text-cyan-400'
                      } ${
                        STATUS_METADATA[selectedBooking.status]?.borderColor || 'border-cyan-500/30'
                      }`}
                    >
                      {STATUS_METADATA[selectedBooking.status]?.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    العميل: <span className="text-white font-semibold">{selectedBooking.customerName}</span> | تاريخ الحجز: {new Date(selectedBooking.createdAt).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}
                  </p>
                </div>

                {/* Direct WhatsApp follow-up */}
                <a
                  href={getWhatsAppUrl(
                    settings.businessPhone,
                    `مرحباً كلين برو إكسبريس، أستفسر عن طلبي رقم #${selectedBooking.orderId} المسجل باسم ${selectedBooking.customerName}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40 hover:bg-[#25D366]/30 transition-all self-start sm:self-auto cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>تواصل بالواتساب عن هذا الطلب</span>
                </a>
              </div>

              {/* Progress Steps Timeline */}
              <div className="space-y-6">
                <h4 className="text-sm font-bold text-slate-300">مراحل سير وتجهيز المفروشات:</h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                  
                  {/* Step 1: Received */}
                  {(() => {
                    const stepState = getStepStatus(1, selectedBooking.status);
                    return (
                      <div className={`p-4 rounded-2xl border transition-all relative ${
                        stepState === 'current'
                          ? 'bg-amber-500/10 border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.15)] ring-1 ring-amber-400'
                          : stepState === 'completed'
                          ? 'bg-slate-900/80 border-slate-700/80'
                          : 'bg-slate-950/40 border-slate-800/40 opacity-40'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-400">المرحلة 1</span>
                          {stepState === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : stepState === 'current' ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                          )}
                        </div>
                        <h5 className="text-sm font-bold text-white mb-1">الاستلام والفرز</h5>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          استلام السجاد وفحص الأنسجة وتصنيف البقع.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Step 2: Washing & Steam */}
                  {(() => {
                    const stepState = getStepStatus(2, selectedBooking.status);
                    return (
                      <div className={`p-4 rounded-2xl border transition-all relative ${
                        stepState === 'current'
                          ? 'bg-cyan-500/10 border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.2)] ring-1 ring-cyan-400'
                          : stepState === 'completed'
                          ? 'bg-slate-900/80 border-slate-700/80'
                          : 'bg-slate-950/40 border-slate-800/40 opacity-40'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-400">المرحلة 2</span>
                          {stepState === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : stepState === 'current' ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                          )}
                        </div>
                        <h5 className="text-sm font-bold text-white mb-1">جاري الغسيل والتعقيم</h5>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          فرش دوارة، شطف مركزي، وبخار 120°C وأوزون.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Step 3: Quality Check & Packing */}
                  {(() => {
                    const stepState = getStepStatus(3, selectedBooking.status);
                    return (
                      <div className={`p-4 rounded-2xl border transition-all relative ${
                        stepState === 'current'
                          ? 'bg-purple-500/10 border-purple-400/50 shadow-[0_0_20px_rgba(139,92,246,0.2)] ring-1 ring-purple-400'
                          : stepState === 'completed'
                          ? 'bg-slate-900/80 border-slate-700/80'
                          : 'bg-slate-950/40 border-slate-800/40 opacity-40'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-400">المرحلة 3</span>
                          {stepState === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : stepState === 'current' ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                          )}
                        </div>
                        <h5 className="text-sm font-bold text-white mb-1">جاهز ومغلف للتسليم</h5>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          تجفيف حراري تام، تعطير، وتغليف محكم عازل.
                        </p>
                      </div>
                    );
                  })()}

                  {/* Step 4: Delivered */}
                  {(() => {
                    const stepState = getStepStatus(4, selectedBooking.status);
                    return (
                      <div className={`p-4 rounded-2xl border transition-all relative ${
                        stepState === 'current' || selectedBooking.status === 'delivered'
                          ? 'bg-emerald-500/10 border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.2)] ring-1 ring-emerald-400'
                          : stepState === 'completed'
                          ? 'bg-slate-900/80 border-slate-700/80'
                          : 'bg-slate-950/40 border-slate-800/40 opacity-40'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-400">المرحلة 4</span>
                          {selectedBooking.status === 'delivered' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Truck className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <h5 className="text-sm font-bold text-white mb-1">تم التسليم بنجاح</h5>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          تسليم نظيف حتى باب منزلك مع ضمان النظافة.
                        </p>
                      </div>
                    );
                  })()}

                </div>

                {/* Current Stage Notification */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-cyan-300">
                      توضيح الحالة الحالية: {STATUS_METADATA[selectedBooking.status]?.label}
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {STATUS_METADATA[selectedBooking.status]?.description}
                    </p>
                  </div>
                </div>

              </div>

              {/* Items & Address Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80 text-xs">
                <div className="glass-panel p-4 rounded-xl border-slate-800 space-y-2">
                  <span className="text-slate-400 font-bold block mb-1">محتويات الطلب:</span>
                  <div className="space-y-1.5">
                    {selectedBooking.itemsDetails && selectedBooking.itemsDetails.length > 0 ? (
                      selectedBooking.itemsDetails.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-slate-300">
                          <span>{item.name}</span>
                          <span className="font-bold text-cyan-400">{item.count} قطع</span>
                        </div>
                      ))
                    ) : (
                      SERVICE_ITEMS.map((item) => {
                        const count = selectedBooking.items?.[item.id] || 0;
                        if (count === 0) return null;
                        return (
                          <div key={item.id} className="flex justify-between items-center text-slate-300">
                            <span>{item.name}</span>
                            <span className="font-bold text-cyan-400">{count} {item.unit}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
                    <span className="text-white">إجمالي الفاتورة:</span>
                    <span className="text-cyan-400 font-['Alexandria',sans-serif]">{selectedBooking.totalPrice} ج.م</span>
                  </div>
                </div>

                <div className="glass-panel p-4 rounded-xl border-slate-800 space-y-2">
                  <span className="text-slate-400 font-bold block mb-1">بيانات التسليم:</span>
                  <div className="space-y-2 text-slate-300">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{selectedBooking.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>موعد التسليم: {selectedBooking.deliveryDate} ({selectedBooking.timeSlot})</span>
                    </div>
                    {selectedBooking.notes && (
                      <p className="text-slate-400 text-[11px] pt-1">
                        ملاحظات العميل: {selectedBooking.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </section>
  );
};
