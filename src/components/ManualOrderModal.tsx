import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Send,
  Loader2,
  Truck,
  Store,
  ArrowRight,
} from 'lucide-react';
import { DynamicService, AppSettings, DeliveryType } from '../types';
import { TIME_SLOTS } from '../constants';
import { createBookingInFirestore } from '../services/bookingService';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  services: DynamicService[];
  onOrderCreated?: () => void;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({
  isOpen,
  onClose,
  settings,
  services,
  onOrderCreated,
}) => {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0].label);
  const [notes, setNotes] = useState('');

  // Items quantity map: serviceId -> count
  const [items, setItems] = useState<Record<string, number>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const updateCount = (serviceId: string, delta: number) => {
    setItems((prev) => ({
      ...prev,
      [serviceId]: Math.max(0, (prev[serviceId] || 0) + delta),
    }));
  };

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
  const actualDeliveryFee = deliveryType === 'pickup' ? (settings.deliveryFee || 0) : 0;
  const totalPrice = itemsSubtotal + actualDeliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim()) return;

    try {
      setIsSubmitting(true);
      await createBookingInFirestore({
        customerName,
        phone,
        deliveryType,
        address:
          deliveryType === 'pickup'
            ? address.trim()
            : (address.trim() || settings.shopBranchAddress || 'تسليم بالفرع'),
        deliveryDate,
        timeSlot,
        items,
        itemsDetails: selectedItemsDetails,
        deliveryFee: actualDeliveryFee,
        totalPrice,
        notes,
        source: 'manual',
      });

      if (onOrderCreated) onOrderCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create manual order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl rounded-3xl glass-panel-cyan p-6 sm:p-8 my-8 shadow-2xl border border-cyan-500/40">
        
        {/* Top Header Row with Clear Prominent Close/Exit Button */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              تسجيل يدوي (هاتف / استلام مباشر)
            </span>
            <h3 className="text-xl font-black text-white font-['Alexandria',sans-serif] mt-1">
              إضافة طلب جديد يدوياً في النظام
            </h3>
            <p className="text-xs text-slate-400">
              أو اضغط زر الخروج (✕) في أي وقت للتراجع والعودة للوحة التحكم
            </p>
          </div>

          {/* Prominent High-Visibility Exit Button (X) */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            title="إلغاء وخروج (ESC)"
          >
            <X className="w-4 h-4 text-rose-400" />
            <span>خروج (إلغاء)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Delivery Option */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDeliveryType('pickup')}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                deliveryType === 'pickup'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>استلام وتوصيل منزلي (+{settings.deliveryFee} ج.م)</span>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryType('dropoff')}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                deliveryType === 'dropoff'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-400'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>تسليم بالفرع (0 ج.م)</span>
            </button>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم العميل</label>
              <div className="relative">
                <User className="w-4 h-4 text-cyan-400 absolute right-3 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="محمد علي"
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">رقم الهاتف</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-cyan-400 absolute right-3 top-3.5 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {deliveryType === 'pickup' ? 'العنوان بالتفصيل' : 'العنوان أو الفرع'}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-cyan-400 absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                required={deliveryType === 'pickup'}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={deliveryType === 'pickup' ? 'المنطقة، الشارع، العمارة' : 'تسليم بالفرع'}
                className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">تاريخ الاستلام</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-cyan-400 absolute right-3 top-3.5 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">الفترة الزمنية</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-cyan-400 absolute right-3 top-3.5 pointer-events-none" />
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  {TIME_SLOTS.map((s) => (
                    <option key={s.id} value={s.label}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dynamic Services Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block text-xs font-bold text-slate-300">تحديد الأصناف والكميات:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {services.map((srv) => {
                const count = items[srv.id] || 0;

                return (
                  <div
                    key={srv.id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-semibold text-white block truncate">{srv.name}</span>
                      <span className="text-[10px] text-cyan-400">{srv.price} ج.م / {srv.unit}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => updateCount(srv.id, -1)}
                        className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs text-white">{count}</span>
                      <button
                        type="button"
                        onClick={() => updateCount(srv.id, 1)}
                        className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-300 flex items-center justify-center hover:bg-cyan-500 hover:text-slate-950 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total & Submit / Cancel Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400 block">الإجمالي (شامل التوصيل):</span>
              <span className="text-xl font-black text-cyan-400 font-['Alexandria',sans-serif]">
                {totalPrice} ج.م
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4 text-slate-400" />
                <span>إلغاء وتراجع</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting || totalPrice === 0}
                className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-2 transition-all cursor-pointer disabled:bg-slate-800 disabled:text-slate-500 shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التسجيل...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>حفظ الطلب فوراً</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
