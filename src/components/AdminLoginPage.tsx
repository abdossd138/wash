import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, ArrowRight, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { AppSettings } from '../types';

interface AdminLoginPageProps {
  settings: AppSettings;
  onLoginSuccess: () => void;
  onBackToStore: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  settings,
  onLoginSuccess,
  onBackToStore,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inputPasscode = passcode.trim();

    // STRICT CHECK: Hardcoded "2255" strictly required
    if (inputPasscode === "2255" || inputPasscode === (settings.adminPasscode || "").trim()) {
      onLoginSuccess();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col justify-between text-slate-100 font-['Cairo',sans-serif] selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Header bar with Quick Return */}
      <header className="border-b border-slate-800/80 bg-[#0A0F1D]/80 backdrop-blur-md px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-white text-base font-['Alexandria',sans-serif]">
                {settings.brandName || 'CleanPro Express'}
              </span>
              <p className="text-[11px] text-slate-400">شاشة التحكم الإدارية والباك إند</p>
            </div>
          </div>

          <button
            onClick={onBackToStore}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-cyan-400 hover:text-white transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 text-cyan-400" />
            <span>العودة لصفحة الزبائن (الموقع العام)</span>
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div
          className={`w-full max-w-md rounded-3xl glass-panel-cyan p-8 border border-cyan-500/40 shadow-2xl space-y-6 transition-all ${
            shake ? 'animate-shake' : ''
          }`}
        >
          {/* Badge & Lock Icon */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(6,182,212,0.25)]">
              <Lock className="w-8 h-8 text-cyan-400" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 mb-2">
                لوحة تحكم النظام (Dedicated Admin Portal)
              </span>
              <h2 className="text-2xl font-black text-white font-['Alexandria',sans-serif]">
                تسجيل دخول الإدارة
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                أدخل رمز المرور السري المعتمد لفتح لوحة إدارة الطلبات، والمنتجات، والمميزات.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>رمز المرور غير صحيح! يرجى إعادة إدخال الرمز السري الصحيح.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                رمز المرور السري (Passcode)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  type="password"
                  required
                  autoFocus
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setError(false);
                  }}
                  placeholder="أدخل رمز المرور السري..."
                  className="w-full pr-10 pl-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm tracking-widest text-center font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-[1.02] active:scale-[0.98] text-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>دخول لوحة التحكم</span>
            </button>
          </form>

          {/* Quick Return to Public Store link */}
          <div className="pt-2 text-center border-t border-slate-800">
            <button
              onClick={onBackToStore}
              className="text-xs text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>تصفح صفحة الزبائن المباشرة</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </main>

      {/* Developer Footer Signature */}
      <footer className="py-4 border-t border-slate-900 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs opacity-60 text-slate-400 select-none">
          <span dir="rtl">تم تطوير الموقع بواسطة عبد الرحمن - 01554544459</span>
          <span dir="ltr" className="font-mono text-[11px]">Developed by Abdelrahman - 01554544459</span>
        </div>
      </footer>

    </div>
  );
};
