import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Award,
  Sparkles,
  Save,
  Loader2,
  Check,
} from 'lucide-react';
import { Booking, CustomerCRMRecord } from '../types';
import { STATUS_METADATA, SERVICE_ITEMS } from '../constants';
import { updateBookingStatus } from '../services/bookingService';

interface ClientProfileDrawerProps {
  client: CustomerCRMRecord | null;
  onClose: () => void;
  onStatusChange: (bookingId: string, newStatus: any) => void;
}

export const ClientProfileDrawer: React.FC<ClientProfileDrawerProps> = ({
  client,
  onClose,
  onStatusChange,
}) => {
  const [notes, setNotes] = useState(client?.customerNotes || '');
  const [savingNote, setSavingNote] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!client) return null;

  const handleSaveNotes = async () => {
    if (!client.orders.length) return;
    setSavingNote(true);
    try {
      // Save to latest booking's internal notes
      await updateBookingStatus(client.orders[0].id, client.orders[0].status, notes);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (e) {
      console.error('Error saving notes:', e);
    } finally {
      setSavingNote(false);
    }
  };

  const getTierBadge = () => {
    if (client.totalSpent >= 1000 || client.totalOrders >= 5) {
      return { label: 'عميل VIP ماسي 💎', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
    }
    if (client.totalSpent >= 400 || client.totalOrders >= 2) {
      return { label: 'عميل ذهبي مميز ⭐', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    }
    return { label: 'عميل جديد 🌟', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
  };

  const tier = getTierBadge();

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl h-full bg-[#0A0F1D] border-r border-cyan-500/30 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white font-['Alexandria',sans-serif]">
                    {client.name}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.color}`}>
                    {tier.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{client.phone}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CRM Metric Stats Grid */}
          <div className="grid grid-cols-2 gap-3 my-6">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">إجمالي ما أنفقه (Lifetime Value):</span>
              <span className="text-2xl font-black text-cyan-400 font-['Alexandria',sans-serif]">
                {client.totalSpent}
              </span>
              <span className="text-xs text-slate-400 mr-1">ج.م</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">إجمالي الطلبات المسجلة:</span>
              <span className="text-2xl font-black text-purple-400 font-['Alexandria',sans-serif]">
                {client.totalOrders}
              </span>
              <span className="text-xs text-slate-400 mr-1">طلبات</span>
            </div>
          </div>

          {/* Customer Address Info */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 mb-6 text-xs text-slate-300 space-y-1">
            <span className="text-slate-500 block font-semibold">عنوان التوصيل المعتاد:</span>
            <p className="text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{client.address}</span>
            </p>
          </div>

          {/* Private Owner Notes */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">
                ملاحظات المالك السرية (CRM Notes)
              </label>
              {savedSuccess && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5" /> تم الحفظ بنجاح
                </span>
              )}
            </div>

            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: يفضل الاتصال قبل الموعد، سجاد كاشان ثمين، طلب خصم في المرة القادمة..."
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
            />

            <button
              onClick={handleSaveNotes}
              disabled={savingNote}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>حفظ الملاحظة في السحابة</span>
            </button>
          </div>

          {/* Orders History Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              سجل طلبات العميل ({client.orders.length})
            </h4>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {client.orders.map((order) => (
                <div
                  key={order.id}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-400 text-sm">#{order.orderId}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        STATUS_METADATA[order.status]?.bgColor || 'bg-slate-800'
                      } ${
                        STATUS_METADATA[order.status]?.color || 'text-slate-300'
                      } ${
                        STATUS_METADATA[order.status]?.borderColor || 'border-slate-700'
                      }`}
                    >
                      {STATUS_METADATA[order.status]?.label}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>تاريخ الحجز: {new Date(order.createdAt).toLocaleDateString('ar-EG')}</span>
                    <span className="font-bold text-white font-['Alexandria',sans-serif]">
                      {order.totalPrice} ج.م
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    {order.itemsDetails && order.itemsDetails.length > 0
                      ? order.itemsDetails.map((it) => `${it.name} (${it.count})`).join(' • ')
                      : SERVICE_ITEMS.map((item) => {
                          const count = order.items?.[item.id] || 0;
                          if (!count) return null;
                          return `${item.name} (${count})`;
                        })
                          .filter(Boolean)
                          .join(' • ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800">
          <a
            href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl font-bold text-xs bg-[#25D366] text-white flex items-center justify-center gap-2 hover:bg-[#20ba59] transition-all"
          >
            <Phone className="w-4 h-4" />
            <span>فتح محادثة واتساب مباشرة مع العميل</span>
          </a>
        </div>

      </div>
    </div>
  );
};
