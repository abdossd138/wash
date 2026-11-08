import React, { useState, useEffect } from 'react';
import { X, Printer, Tag, FileText, Truck, Store } from 'lucide-react';
import { Booking, AppSettings } from '../types';
import { STATUS_METADATA } from '../constants';

interface PrintInvoiceModalProps {
  booking: Booking | null;
  settings: AppSettings;
  onClose: () => void;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  booking,
  settings,
  onClose,
}) => {
  const [printFormat, setPrintFormat] = useState<'invoice' | 'bundleTag'>('bundleTag');

  useEffect(() => {
    if (!booking) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [booking, onClose]);

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const deliveryLabel =
    booking.deliveryType === 'pickup'
      ? 'استلام وتوصيل للمنزل'
      : 'تسليم بالفرع بنفسي';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-3xl p-6 sm:p-8 my-8 shadow-2xl print:m-0 print:p-0 print:shadow-none print:w-full">
        
        {/* Controls bar (hidden during print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-6 gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPrintFormat('bundleTag')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                printFormat === 'bundleTag'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>كارت تعريف الحزمة (Rug Bundle Tag)</span>
            </button>

            <button
              onClick={() => setPrintFormat('invoice')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                printFormat === 'invoice'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>فاتورة تفصيلية A4</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الآن (Print)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FORMAT 1: THERMAL / RUG BUNDLE TAG FORMAT (Attach to rug packages) */}
        {printFormat === 'bundleTag' && (
          <div className="border-4 border-dashed border-slate-900 p-6 rounded-2xl space-y-5 text-slate-900 bg-white" dir="rtl">
            
            {/* Tag Header with Big Numeric Order ID */}
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
              <div>
                <span className="text-xl font-black text-slate-950 font-['Alexandria',sans-serif]">
                  {settings.brandName || 'CleanPro Express'}
                </span>
                <span className="block text-xs font-bold text-slate-600">
                  كارت تعريف مغسلة السجاد والمفروشات
                </span>
              </div>

              <div className="text-left bg-slate-900 text-white px-5 py-2 rounded-xl">
                <span className="text-[10px] block uppercase font-mono tracking-widest text-cyan-300">ORDER NO</span>
                <span className="text-3xl font-black font-['Alexandria',sans-serif]">#{booking.orderId}</span>
              </div>
            </div>

            {/* Customer & Route Details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-300 font-sans">
              <div>
                <span className="text-slate-500 block font-semibold">العميل:</span>
                <span className="font-black text-base text-slate-950">{booking.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold">الهاتف:</span>
                <span className="font-bold text-sm text-slate-950 font-mono">{booking.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold">طريقة الاستلام:</span>
                <span className="font-bold text-slate-900">{deliveryLabel}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold">تاريخ الاستلام:</span>
                <span className="font-bold text-slate-900">{booking.deliveryDate} ({booking.timeSlot})</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200">
                <span className="text-slate-500 block font-semibold">العنوان:</span>
                <span className="font-bold text-xs text-slate-900">{booking.address}</span>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 block">قطع وحزم السجاد والمفروشات:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {booking.itemsDetails && booking.itemsDetails.length > 0 ? (
                  booking.itemsDetails.map((item, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-100 border border-slate-300 flex justify-between font-bold">
                      <span>{item.name}</span>
                      <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-xs">× {item.count}</span>
                    </div>
                  ))
                ) : (
                  Object.entries(booking.items).map(([key, count]) => {
                    if (!count) return null;
                    return (
                      <div key={key} className="p-2 rounded-lg bg-slate-100 border border-slate-300 flex justify-between font-bold">
                        <span>{key}</span>
                        <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-xs">× {count}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Total and Notes */}
            <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900">
              <div className="text-xs">
                {booking.notes && (
                  <p className="text-slate-600 font-semibold">
                    ملاحظات: <span className="text-slate-900">{booking.notes}</span>
                  </p>
                )}
                <span className="text-[11px] text-slate-500 block">رسوم التوصيل: {booking.deliveryFee} ج.م</span>
              </div>

              <div className="text-left">
                <span className="text-[10px] text-slate-500 block">المبلغ المطلوب تحصيله:</span>
                <span className="text-2xl font-black text-slate-950 font-['Alexandria',sans-serif]">
                  {booking.totalPrice} ج.م
                </span>
              </div>
            </div>

            {/* Barcode Visual Simulation */}
            <div className="text-center pt-2">
              <div className="inline-block font-mono tracking-[0.4em] text-xs font-bold text-slate-800 border-y-2 border-slate-800 py-1 px-8">
                ||| | |||| | ||||| | ||| || #{booking.orderId} ||| |
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">يتم تثبيت هذا الكارت على حزمة السجاد بعد التغليف</span>
            </div>

          </div>
        )}

        {/* FORMAT 2: DETAILED A4 INVOICE */}
        {printFormat === 'invoice' && (
          <div className="space-y-6 text-slate-900 font-sans" dir="rtl">
            
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-slate-950 font-['Alexandria',sans-serif]">
                    {settings.brandName || 'CleanPro Express'}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                    فاتورة رسمية
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  مغسلة السجاد والمفروشات الفاخرة بالبخار والأوزون
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  هاتف الإدارة: {settings.businessPhone}
                </p>
              </div>

              <div className="text-left font-mono">
                <span className="text-xs text-slate-500 block">رقم الفاتورة:</span>
                <span className="text-2xl font-black text-slate-900">#{booking.orderId}</span>
                <span className="text-xs text-slate-500 block mt-1">
                  التاريخ: {new Date(booking.createdAt).toLocaleDateString('ar-EG')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs border border-slate-200">
              <div>
                <span className="text-slate-500 block mb-0.5">اسم العميل:</span>
                <span className="font-bold text-sm text-slate-900">{booking.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">رقم الهاتف:</span>
                <span className="font-bold text-sm text-slate-900 font-mono">{booking.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">طريقة الاستلام:</span>
                <span className="font-bold text-slate-900">{deliveryLabel}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">موعد التسليم:</span>
                <span className="font-bold text-slate-900">{booking.deliveryDate} ({booking.timeSlot})</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200">
                <span className="text-slate-500 block mb-0.5">العنوان:</span>
                <span className="font-semibold text-slate-800">{booking.address}</span>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">الصنف / الخدمة</th>
                    <th className="p-3 text-center">الكمية</th>
                    <th className="p-3 text-left">سعر الوحدة</th>
                    <th className="p-3 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {booking.itemsDetails && booking.itemsDetails.length > 0 ? (
                    booking.itemsDetails.map((item, index) => (
                      <tr key={index}>
                        <td className="p-3 text-slate-500 font-mono">{index + 1}</td>
                        <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                        <td className="p-3 text-center font-bold">{item.count}</td>
                        <td className="p-3 text-left font-mono">{item.unitPrice} ج.م</td>
                        <td className="p-3 text-left font-bold font-mono">{item.subtotal} ج.م</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-3 text-center text-slate-500">
                        راجع تفاصيل الطلب المسجلة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1.5 text-xs text-left">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">رسوم التوصيل:</span>
                  <span className="font-bold text-slate-900">
                    {booking.deliveryFee > 0 ? `${booking.deliveryFee} ج.م` : '0 ج.م (بالفرع)'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b-2 border-slate-900 text-sm">
                  <span className="font-bold text-slate-900">الإجمالي المستحق:</span>
                  <span className="font-black text-xl text-slate-950 font-['Alexandria',sans-serif]">
                    {booking.totalPrice} جنيه مصري
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block pt-0.5">
                  طريقة الدفع: نقداً عند المعاينة والاستلام
                </span>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-dashed border-slate-300 text-xs text-center text-slate-600">
              <div>
                <p className="font-bold mb-8">توقيع مندوب كلين برو</p>
                <div className="border-b border-slate-400 w-36 mx-auto" />
              </div>
              <div>
                <p className="font-bold mb-8">توقيع واستلام العميل</p>
                <div className="border-b border-slate-400 w-36 mx-auto" />
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
