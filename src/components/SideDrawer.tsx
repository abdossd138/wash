import React from 'react';
import {
  X,
  Calculator,
  Search,
  Lock,
  ShieldCheck,
  Phone,
  Sparkles,
  MapPin,
  Clock,
  ArrowLeft,
  Image as ImageIcon,
  Car,
} from 'lucide-react';
import { AppSettings } from '../types';
import { normalizeWhatsAppPhone } from '../services/bookingService';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
  onOpenAdminModal: () => void;
  isAdminLoggedIn: boolean;
  onOpenAdminDashboard: () => void;
  settings: AppSettings;
  hasMedia?: boolean;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenAdminModal,
  isAdminLoggedIn,
  onOpenAdminDashboard,
  settings,
  hasMedia = false,
}) => {
  if (!isOpen) return null;

  const handleAction = (callback: () => void) => {
    callback();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Content */}
      <div className="relative w-full max-w-xs sm:max-w-sm h-full bg-[#0A0F1D] border-r border-cyan-500/30 p-6 shadow-2xl flex flex-col justify-between z-10 overflow-y-auto animate-in slide-in-from-right duration-300">
        
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-white text-base font-['Alexandria',sans-serif] block">
                  {settings.brandName || 'CleanPro Express'}
                </span>
                <span className="text-[11px] text-cyan-400">القائمة الرئيسية</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <div className="py-6 space-y-2">
            
            {/* New Booking */}
            <button
              onClick={() => handleAction(() => onNavigate('calculator'))}
              className="w-full p-3.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-right flex items-center justify-between group transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block group-hover:text-cyan-300 transition-colors">
                    غسيل سجاد ومفروشات
                  </span>
                  <span className="text-[11px] text-slate-400">حاسبة تكلفة السجاد والكنب</span>
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* Car Wash & Detailing */}
            <button
              onClick={() => handleAction(() => onNavigate('cars'))}
              className="w-full p-3.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-right flex items-center justify-between group transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block group-hover:text-purple-300 transition-colors">
                    غسيل وخدمات سيارات
                  </span>
                  <span className="text-[11px] text-slate-400">اختار نوع وموديل عربيتك والخدمات</span>
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-purple-400 group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* Track Order */}
            <button
              onClick={() => handleAction(() => onNavigate('tracker'))}
              className="w-full p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/30 text-right flex items-center justify-between group transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block group-hover:text-purple-300 transition-colors">
                    تتبع حالة الطلب (#)
                  </span>
                  <span className="text-[11px] text-slate-400">برقم الطلب البسيط أو الهاتف</span>
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* Quality Standards */}
            <button
              onClick={() => handleAction(() => onNavigate('features'))}
              className="w-full p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/30 text-right flex items-center justify-between group transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block group-hover:text-teal-300 transition-colors">
                    معايير الجودة والتعقيم
                  </span>
                  <span className="text-[11px] text-slate-400">تقنية البخار 120°C والأوزون</span>
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* Photos & Videos Section */}
            {hasMedia && (
              <button
                onClick={() => handleAction(() => onNavigate('media'))}
                className="w-full p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/30 text-right flex items-center justify-between group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block group-hover:text-cyan-300 transition-colors">
                      صور وفيديوهات عن المكان
                    </span>
                    <span className="text-[11px] text-slate-400">إعلانات وصور حصرية للمغسلة</span>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:-translate-x-1 transition-transform" />
              </button>
            )}

            {/* Admin Portal */}
            <div className="pt-2">
              <button
                onClick={() =>
                  handleAction(() => {
                    if (isAdminLoggedIn) {
                      onOpenAdminDashboard();
                    } else {
                      onOpenAdminModal();
                    }
                  })
                }
                className="w-full p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-right flex items-center justify-between group transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-cyan-300 block">
                      بوابة الإدارة المركزية (CRM)
                    </span>
                    <span className="text-[11px] text-slate-400">لوحة المالك وإدارة الأسعار والطلبات</span>
                  </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>

        {/* Footer in Drawer */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="line-clamp-1">{settings.shopBranchAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>مواعيد العمل: يومياً من 10:00 ص إلى 10:00 م</span>
            </div>
          </div>

          <a
            href={`https://wa.me/${normalizeWhatsAppPhone(settings.businessPhone)}?text=${encodeURIComponent('مرحباً CleanPro Express، أود الاستفسار عن خدمة غسيل السجاد والمفروشات')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>محادثة واتساب مباشرة</span>
          </a>
        </div>

      </div>
    </div>
  );
};
