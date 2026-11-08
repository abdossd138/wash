import React, { useState } from 'react';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  FileText,
  ArrowRight,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Truck,
  Store,
  Building,
} from 'lucide-react';
import { Booking, DynamicService, AppSettings, DeliveryType } from '../types';
import { TIME_SLOTS } from '../constants';
import { createBookingInFirestore, buildWhatsAppMessage, getWhatsAppUrl } from '../services/bookingService';

interface CustomerBookingFormProps {
  services: DynamicService[];
  items: Record<string, number>;
  settings: AppSettings;
  onBackToCalculator: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

export const CustomerBookingForm: React.FC<CustomerBookingFormProps> = ({
  services,
  items,
  settings,
  onBackToCalculator,
  onBookingSuccess,
}) => {
  // Service Type selection (Home Pickup vs Self Drop-off)
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');

  // Customer form fields state
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Date & Time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateString = tomorrow.toISOString().split('T')[0];

  const [deliveryDate, setDeliveryDate] = useState(minDateString);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0].label);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute selected items breakdown
  const selectedItemsDetails = services
    .map((srv) => {
      const count = items[srv.id] || 0;
      if (count > 0) {
        return {
          serviceId: srv.id,
          name: srv.name,
          count,
          unitPrice: srv.price,
          subtotal: srv.price * count,
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{
    serviceId: string;
    name: string;
    count: number;
    unitPrice: number;
    subtotal: number;
  }>;

  const itemsSubtotal = selectedItemsDetails.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Delivery fee is applied ONLY if Home Pickup is chosen
  const actualDeliveryFee = deliveryType === 'pickup' ? (settings.deliveryFee || 0) : 0;
  const grandTotal = itemsSubtotal + actualDeliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage('يرجى إدخال اسم العميل بالكامل.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setErrorMessage('يرجى إدخال رقم هاتف صحيح للتواصل وتتبع الطلب.');
      return;
    }
    if (deliveryType === 'pickup' && (!address.trim() || address.trim().length < 5)) {
      setErrorMessage('يرجى كتابة عنوان الاستلام بالتفصيل للمندوب.');
      return;
    }

    try {
      setIsSubmitting(true);

      const finalAddress =
        deliveryType === 'pickup'
          ? address.trim()
          : (address.trim() || settings.shopBranchAddress || 'تسليم ذاتي بالفرع');

      // Save to Firebase Firestore with sequential ID
      const newBooking = await createBookingInFirestore({
        serviceCategory: 'carpets',
        customerName,
        phone,
        deliveryType,
        address: finalAddress,
        deliveryDate,
        timeSlot,
        items,
        itemsDetails: selectedItemsDetails,
        deliveryFee: actualDeliveryFee,
        totalPrice: grandTotal,
        notes,
        source: 'website',
      });

      // Build structured WhatsApp message
      const whatsappText = buildWhatsAppMessage(newBooking, settings.businessPhone, services, settings.brandName);
      const whatsappUrl = getWhatsAppUrl(settings.businessPhone, whatsappText);

      onBookingSuccess(newBooking);

      // Auto trigger WhatsApp
      try {
        const link = document.createElement('a');
        link.href = whatsappUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.warn('Popup blocked by browser:', e);
      }
    } catch (err: any) {
      console.error('Booking submission error:', err);
      setErrorMessage('حدث خطأ أثناء حفظ الطلب، يرجى المحاولة مرة أخرى أو التواصل معنا مباشرة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="booking-form" className="py-12 sm:py-16 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back and Header */}
        <div className="mb-8">
          <button
            onClick={onBackToCalculator}
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors mb-4 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لتعديل الأصناف والكميات</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
            <span>الخطوة 2 من 3</span>
            <span>•</span>
            <span>طريقة الاستلام وبيانات الحجز</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Alexandria',sans-serif]">
            تأكيد الحجز وتحديد طريقة الاستلام
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            اختر ما إذا كنت تفضل استلام المندوب من منزلك أو تسليم السجاد بنفسك في مقر المغسلة.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form Area */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-2xl border-slate-800 space-y-6">
              
              {/* Delivery Option Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-3">
                  اختر طريقة استلام وتسليم السجاد والمفروشات:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Option 1: Home Pickup & Delivery */}
                  <div
                    onClick={() => setDeliveryType('pickup')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      deliveryType === 'pickup'
                        ? 'glass-panel-cyan border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.2)] ring-1 ring-cyan-400'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                          <Truck className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          {settings.deliveryFee > 0 ? `+${settings.deliveryFee} ج.م` : 'مجاناً'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">
                        استلام وتوصيل للمنزل
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        يصلك مندوبنا بسيارة مجهزة لاستلام وتوصيل السجاد حتى باب منزلك.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Self Drop-off at Shop */}
                  <div
                    onClick={() => setDeliveryType('dropoff')}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      deliveryType === 'dropoff'
                        ? 'glass-panel-purple border-purple-400/60 shadow-[0_0_20px_rgba(139,92,246,0.2)] ring-1 ring-purple-400'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                          <Store className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          0 ج.م توصيل
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">
                        تسليم بالفرع بنفسي
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        تسليم واستلام السجاد مباشرة في مقر المغسلة الرئيسي بدون رسوم نقل.
                      </p>
                    </div>
                  </div>

                </div>

                {deliveryType === 'dropoff' && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 flex items-start gap-2">
                    <Building className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">عنوان مقر المغسلة للاستلام والتسليم:</span>
                      <span className="text-slate-400">{settings.shopBranchAddress}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  الاسم بالكامل <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4 text-cyan-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: أحمد عبد الله"
                    className="w-full pr-10 pl-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  رقم الهاتف / الواتساب <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4 text-cyan-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 01012345678"
                    className="w-full pr-10 pl-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  يستخدم هذا الرقم في تتبع حالة الطلب وتأكيد الاستلام.
                </p>
              </div>

              {/* Address (Required if Pickup, optional if Drop-off) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  {deliveryType === 'pickup' ? (
                    <>عنوان المنزل بالتفصيل <span className="text-rose-400">*</span></>
                  ) : (
                    <>عنوان العميل أو المنطقة (اختياري)</>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute top-3.5 right-3.5 pointer-events-none text-slate-500">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                  </div>
                  <textarea
                    required={deliveryType === 'pickup'}
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={
                      deliveryType === 'pickup'
                        ? 'المدينة، الحي، اسم الشارع، رقم العمارة والشقة، علامة مميزة...'
                        : 'المنطقة أو الحي السكني (اختياري)...'
                    }
                    className="w-full pr-10 pl-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm resize-none"
                  />
                </div>
              </div>

              {/* Delivery Date & Time Slot Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    {deliveryType === 'pickup' ? 'تاريخ استلام المندوب' : 'تاريخ تسليمك بالفرع'} <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                    </div>
                    <input
                      type="date"
                      required
                      min={minDateString}
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full pr-10 pl-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    الفترة المفضلة
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                      <Clock className="w-4 h-4 text-cyan-400" />
                    </div>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full pr-10 pl-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm appearance-none cursor-pointer"
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot.id} value={slot.label} className="bg-slate-900 text-white">
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  ملاحظات خاصة بنوع البقع أو النسيج (اختياري)
                </label>
                <div className="relative">
                  <div className="absolute top-3.5 right-3.5 pointer-events-none text-slate-500">
                    <FileText className="w-4 h-4 text-cyan-400" />
                  </div>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: بقع قهوة قديمة، سجاد حرير طبيعي، الاتصال قبل الوصول..."
                    className="w-full pr-10 pl-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm resize-none"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl text-base font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(16,185,129,0.3)] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                    <span>جاري حفظ الحجز وإصدار رقم الطلب...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 text-slate-950" />
                    <span>تأكيد الحجز وإرسال الفاتورة عبر واتساب</span>
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Clean Itemized Breakdown Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-panel p-5 rounded-2xl border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
                <span>تفاصيل الفاتورة المقدرة</span>
                <span className="text-xs text-cyan-400 font-normal">CleanPro</span>
              </h3>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {selectedItemsDetails.map((item) => (
                  <div key={item.serviceId} className="flex items-center justify-between text-xs">
                    <div className="text-slate-300">
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-slate-500 mr-1.5">× {item.count}</span>
                    </div>
                    <span className="font-bold text-white font-['Alexandria',sans-serif]">
                      {item.subtotal} ج.م
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>مجموع المفروشات</span>
                  <span className="text-slate-200 font-bold">{itemsSubtotal} ج.م</span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>طريقة الاستلام</span>
                  <span className="text-cyan-400 font-semibold">
                    {deliveryType === 'pickup' ? 'استلام وتوصيل منزلي' : 'تسليم بالفرع'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>رسوم النقل والتوصيل</span>
                  <span className={actualDeliveryFee > 0 ? 'text-cyan-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {actualDeliveryFee > 0 ? `${actualDeliveryFee} ج.م` : 'مجاناً (0 ج.م)'}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-white">الإجمالي المستحق</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-cyan-400 font-['Alexandria',sans-serif]">
                      {grandTotal}
                    </span>
                    <span className="text-xs text-slate-400 mr-1">جنيه</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-[11px] text-cyan-300 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                  رقم تتبع تسلسلي بسيط:
                </p>
                <p className="text-slate-400">
                  يحصل كل حجز على رقم تسلسلي سهل (مثل #1, #2, #14) لتسهيل المعاينة والمتابعة.
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
