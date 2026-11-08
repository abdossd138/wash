import React, { useState } from 'react';
import {
  CheckCircle,
  Copy,
  Check,
  Printer,
  Search,
  X,
  Phone,
  Calendar,
  MapPin,
  Truck,
  Store,
} from 'lucide-react';
import { Booking, DynamicService, AppSettings } from '../types';
import { buildWhatsAppMessage, getWhatsAppUrl } from '../services/bookingService';

interface BookingReceiptModalProps {
  booking: Booking | null;
  services: DynamicService[];
  settings: AppSettings;
  onClose: () => void;
  onTrackThisOrder: (orderId: string) => void;
}

export const BookingReceiptModal: React.FC<BookingReceiptModalProps> = ({
  booking,
  services,
  settings,
  onClose,
  onTrackThisOrder,
}) => {
  const [copied, setCopied] = useState(false);

  if (!booking) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(booking.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = buildWhatsAppMessage(booking, settings.businessPhone, services, settings.brandName);
  const whatsappUrl = getWhatsAppUrl(settings.businessPhone, whatsappMessage);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl glass-panel-cyan p-6 sm:p-8 my-8 shadow-2xl border border-cyan-500/40 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-full bg-slate-900/80 border border-slate-700/80 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.3)]">
            <CheckCircle className="w-9 h-9 text-emerald-400" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            الخطوة 3: تأكيد الحجز والفاتورة الإلكترونية (تم الحفظ بالسحابة)
          </span>

          <h3 className="text-2xl font-black text-white font-['Alexandria',sans-serif]">
            إيصال حجز CleanPro Express
          </h3>
          <p className="text-xs text-slate-400">
            تم حفظ الطلب في قاعدة البيانات برقم تسلسلي بسيط لتسهيل المتابعة.
          </p>
        </div>

        {/* Simple Numeric ID Stamp Box */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/40 flex items-center justify-between mb-6 shadow-inner">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 block font-semibold">رقم الطلب (Order #):</span>
            <span className="text-3xl font-black text-cyan-400 font-['Alexandria',sans-serif] tracking-wider">
              #{booking.orderId}
            </span>
          </div>

          <button
            onClick={handleCopyId}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 active:scale-95 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>تم النسخ!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>نسخ الرقم</span>
              </>
            )}
          </button>
        </div>

        {/* Details Grid */}
        <div className="space-y-4 text-xs text-slate-300 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 mb-6">
          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800">
            <div>
              <span className="text-slate-500 block mb-0.5">اسم العميل:</span>
              <span className="font-bold text-white text-sm">{booking.customerName}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">رقم الهاتف (المشتري):</span>
              <span className="font-bold text-white font-mono text-sm">{booking.phone}</span>
            </div>
          </div>

          {booking.carDetails && (
            <div className="pb-3 border-b border-slate-800">
              <span className="text-slate-500 block mb-0.5">بيانات السيارة:</span>
              <span className="font-bold text-purple-300 text-sm">
                🚗 {booking.carDetails.brand} - {booking.carDetails.model}
              </span>
            </div>
          )}

          <div className="pb-3 border-b border-slate-800">
            <span className="text-slate-500 block mb-0.5">طريقة الاستلام:</span>
            <div className="flex items-center gap-2">
              {booking.deliveryType === 'pickup' ? (
                <>
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-slate-200">استلام وتوصيل للمنزل ({booking.address})</span>
                </>
              ) : (
                <>
                  <Store className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-slate-200">تسليم ذاتي بالفرع</span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-800">
            <div>
              <span className="text-slate-500 block mb-0.5">التاريخ:</span>
              <span className="font-semibold text-cyan-300">{booking.deliveryDate}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">الفترة الزمنية:</span>
              <span className="font-semibold text-slate-200">{booking.timeSlot}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-1.5 pt-1">
            <span className="text-slate-500 block font-semibold mb-2">الأصناف المحجوزة:</span>
            {services.map((srv) => {
              const count = booking.items[srv.id] || 0;
              if (count === 0) return null;
              return (
                <div key={srv.id} className="flex justify-between items-center text-xs text-slate-300">
                  <span>{srv.name} × {count}</span>
                  <span className="font-bold text-white font-['Alexandria',sans-serif]">
                    {srv.price * count} ج.م
                  </span>
                </div>
              );
            })}
          </div>

          {/* Delivery Fee line */}
          <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>رسوم التوصيل:</span>
            <span className="font-semibold text-slate-200">
              {booking.deliveryFee > 0 ? `${booking.deliveryFee} ج.م` : 'مجاناً'}
            </span>
          </div>

          {/* Total Cost */}
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
            <span className="font-bold text-white">الإجمالي المستحق:</span>
            <span className="text-xl font-black text-cyan-400 font-['Alexandria',sans-serif]">
              {booking.totalPrice} جنيه
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,211,102,0.3)] transition-all cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>إرسال تفاصيل الفاتورة مباشرة لواتساب المغسلة</span>
          </a>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                onClose();
                onTrackThisOrder(booking.orderId);
              }}
              className="py-3 px-4 rounded-xl font-bold text-xs bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>تتبع هذا الطلب الآن</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-3 px-4 rounded-xl font-bold text-xs bg-slate-900 text-slate-300 border border-slate-700 hover:text-white hover:border-slate-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ الفاتورة</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
