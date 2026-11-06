import React, { useState } from 'react';
import { Lock, KeyRound, X, AlertCircle, ArrowLeft } from 'lucide-react';
import { AppSettings } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  settings: AppSettings;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  settings,
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inputPasscode = passcode.trim();

    // STRICT CHECK: Hardcoded "2255" strictly required
    if (inputPasscode === "2255") {
      onLoginSuccess();
      onClose();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        className={`relative w-full max-w-md rounded-3xl glass-panel-cyan p-6 sm:p-8 border border-cyan-500/40 shadow-2xl transition-all ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-full bg-slate-900/80 border border-slate-700/80 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <Lock className="w-7 h-7 text-cyan-400" />
          </div>

          <h3 className="text-xl font-black text-white font-['Alexandria',sans-serif]">
            بوابة الإدارة المركزية (CRM)
          </h3>
          <p className="text-xs text-slate-400">
            مخصص فقط لإدارة مغسلة {settings.brandName || 'CleanPro Express'} لمتابعة دورة الغسيل، وتعديل الأسعار والمنتجات.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>رمز المرور غير صحيح! يرجى إدخال الرمز السري للإدارة للمتابعة.</span>
          </div>
        )}

        {/* Passcode Form */}
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
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            <span>تسجيل الدخول إلى لوحة التحكم</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
