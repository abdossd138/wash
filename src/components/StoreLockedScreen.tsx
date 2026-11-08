import React from 'react';
import { ShieldAlert, Lock, AlertTriangle, ArrowRight } from 'lucide-react';
import { AppSettings } from '../types';

interface StoreLockedScreenProps {
  settings: AppSettings;
  onOpenAdmin: () => void;
}

export const StoreLockedScreen: React.FC<StoreLockedScreenProps> = ({ settings, onOpenAdmin }) => {
  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col justify-between text-slate-100 font-['Cairo',sans-serif] selection:bg-rose-500/30 selection:text-rose-200">
      
      {/* Top Header */}
      <header className="border-b border-rose-500/20 bg-rose-950/20 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-white text-base font-['Alexandria',sans-serif]">
                {settings.brandName || 'CleanPro Express'}
              </span>
              <p className="text-[11px] text-rose-300">حالة النظام: معلّق ومغلق</p>
            </div>
          </div>

          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>بوابة الإدارة</span>
          </button>
        </div>
      </header>

      {/* Main Suspension Notice Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-3xl glass-panel p-8 sm:p-10 border border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.15)] text-center space-y-6">
          
          <div className="w-20 h-20 rounded-3xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(244,63,94,0.3)] animate-pulse">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
              تنبيه إداري: الخدمة متوقفة مؤقتاً
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Alexandria',sans-serif]">
              هذا الموقع معلّق ومغلق مؤقتاً
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg mx-auto">
              {settings.storeLockMessage ||
                'هذا الموقع معلّق ومغلق مؤقتاً لأسباب تتعلق بالترخيص والصيانة. يُرجى مراجعة المطور لتفعيل الخدمة وتسوية المستحقات.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex items-center justify-center gap-2 text-rose-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>تم إيقاف استقبال الطلبات وحاسبة الحجوزات</span>
            </div>
            <p className="text-[11px] text-slate-500">
              إذا كنت صاحب هذا المتجر، يرجى تسوية مستحقات الترخيص لإعادة تشغيل النظام فورياً.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>دخول المالك للإدارة وفك القفل (/admin)</span>
            </button>
          </div>

        </div>
      </main>

      {/* Developer Footer Credits */}
      <footer className="py-4 border-t border-slate-900 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs opacity-60 text-slate-400 select-none">
          <span dir="rtl">تم تطوير الموقع بواسطة عبد الرحمن - 01554544459</span>
          <span dir="ltr" className="font-mono text-[11px]">Developed by Abdelrahman - 01554544459</span>
        </div>
      </footer>

    </div>
  );
};
