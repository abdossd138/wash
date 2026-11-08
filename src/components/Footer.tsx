import React from 'react';
import { Sparkles, Phone, MapPin, Clock, ShieldCheck, Lock, Smartphone } from 'lucide-react';
import { AppSettings } from '../types';
import { normalizeWhatsAppPhone } from '../services/bookingService';

interface FooterProps {
  settings: AppSettings;
  onOpenAdminModal: () => void;
  isAdminLoggedIn: boolean;
  onOpenAdminDashboard: () => void;
  onSwitchToMobile?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenAdminModal,
  isAdminLoggedIn,
  onOpenAdminDashboard,
  onSwitchToMobile,
}) => {
  return (
    <footer className="glass-panel border-t border-slate-800 bg-[#070B14] pt-14 pb-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/30 border border-cyan-400/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-lg font-black text-white font-['Alexandria',sans-serif]">
                {settings.brandName || 'CleanPro Express'}
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              المغسلة الأولى المتخصصة في الغسيل والتعقيم الآلي للسجاد الفاخر، المشايات، والمفروشات بالبخار والأوزون مع التوصيل السريع.
            </p>
          </div>

          {/* Service Coverage Areas */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>مناطق التغطية السريعة</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {settings.coverageText || 'التجمع الخامس، الشيخ زايد، 6 أكتوبر، مصر الجديدة، مدينة نصر، المعادي، المهندسين، الدقي'}
            </p>
          </div>

          {/* Operational Hours */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>مواعيد العمل والاستلام</span>
            </h4>
            <div className="space-y-1.5 text-xs text-slate-400">
              <p>حجز إلكتروني متاح: <span className="text-cyan-400 font-semibold">24 ساعة / 7 أيام</span></p>
              <p className="text-slate-300">
                {settings.workHoursText || 'يومياً من 10:00 صباحاً حتى 10:00 مساءً'}
              </p>
            </div>
          </div>

          {/* Quick Contact & WhatsApp */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-cyan-400" />
              <span>التواصل المباشر</span>
            </h4>
            <p className="text-xs text-slate-400">
              لأي استفسار طارئ أو تغيير موعد التسليم:
            </p>
            <a
              href={`https://wa.me/${normalizeWhatsAppPhone(settings.businessPhone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-all"
            >
              <span>واتساب: {settings.businessPhone}</span>
            </a>
          </div>

        </div>

        {/* Bottom Bar with Discreet Admin Access */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} {settings.brandName || 'CleanPro Express'}. جميع الحقوق محفوظة.</p>

          <div className="flex items-center gap-4">
            {onSwitchToMobile && (
              <button
                onClick={onSwitchToMobile}
                className="text-slate-500 hover:text-cyan-400 flex items-center gap-1 transition-colors cursor-pointer"
                title="التبديل إلى نسخة الهاتف"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>عرض نسخة الهاتف</span>
              </button>
            )}

            {isAdminLoggedIn ? (
              <button
                onClick={onOpenAdminDashboard}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <span>الانتقال للوحة التحكم النشطة</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdminModal}
                className="text-slate-600 hover:text-slate-400 flex items-center gap-1 transition-colors cursor-pointer"
                title="بوابة المالك والإدارة"
              >
                <Lock className="w-3 h-3" />
                <span>دخول الإدارة</span>
              </button>
            )}
          </div>
        </div>

        {/* Subtle Developer Signature Line */}
        <div className="pt-3 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs opacity-60 text-slate-400 select-none">
          <span dir="rtl">تم تطوير الموقع بواسطة عبد الرحمن - 01554544459</span>
          <span dir="ltr" className="font-mono text-[11px]">Developed by Abdelrahman - 01554544459</span>
        </div>

      </div>
    </footer>
  );
};
