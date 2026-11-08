import React, { useState } from 'react';
import { ShieldAlert, Lock, Unlock, X, AlertTriangle } from 'lucide-react';
import { setStoreLockInFirestore } from '../services/bookingService';

interface StoreLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCurrentlyLocked: boolean;
  currentMessage?: string;
  onSuccess?: () => void;
}

export const StoreLockModal: React.FC<StoreLockModalProps> = ({
  isOpen,
  onClose,
  isCurrentlyLocked,
  currentMessage,
  onSuccess,
}) => {
  const [passcode, setPasscode] = useState('');
  const [customMessage, setCustomMessage] = useState(
    currentMessage || 'نعتذر لعملائنا الكرام، الخدمة متوقفة مؤقتاً لأعمال الصيانة والتحديث والتطوير. سنعود للعمل قريباً.'
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Strict validation against the secret key (without revealing it in any feedback)
    if (!passcode.trim()) {
      setError('يرجى إدخال رمز الأمان السري لتأكيد العملية.');
      return;
    }

    if (passcode.trim() !== '1177') {
      setError('رمز الأمان السري غير صحيح. تم رفض العملية لأسباب أمنية.');
      return;
    }

    setIsLoading(true);
    try {
      const targetState = !isCurrentlyLocked;
      const result = await setStoreLockInFirestore(targetState, passcode.trim(), customMessage.trim());

      if (result.success) {
        setPasscode('');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(result.error || 'حدث خطأ أثناء حفظ الحالة.');
      }
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء حفظ الحالة.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0F172A] border border-rose-500/40 rounded-2xl shadow-2xl p-6 text-slate-100 font-['Cairo',sans-serif]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isCurrentlyLocked
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {isCurrentlyLocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-black text-white font-['Alexandria',sans-serif]">
              {isCurrentlyLocked ? 'فك قفل وتشغيل الموقع' : 'إغلاق الموقع (تعليق الخدمة)'}
            </h3>
            <p className="text-xs text-slate-400">
              {isCurrentlyLocked
                ? 'إعادة فتح الموقع لجميع العملاء وتفعيل الحجز المباشر'
                : 'تجميد واجهة العملاء فوراً ومنع استقبال أي طلبات جديدة'}
            </p>
          </div>
        </div>

        {/* Warning Callout */}
        <div
          className={`p-3.5 rounded-xl mb-4 text-xs flex items-start gap-2.5 ${
            isCurrentlyLocked
              ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/40 border border-rose-500/30 text-rose-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            {isCurrentlyLocked ? (
              <span>
                عند فك القفل، ستعود الصفحة الرئيسية للعمل فوراً لجميع الزوار على كافة الأجهزة وسيتاح تقديم الطلبات بشكل طبيعي.
              </span>
            ) : (
              <span>
                عند إغلاق الموقع، سيظهر للعملاء شاشة تنبيه بتعليق الخدمة فوراً، ولن يتمكن أي شخص من طلب أي حجز إلا عبر فك القفل من لوحة المالك.
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Custom Suspension Message (Only when locking) */}
          {!isCurrentlyLocked && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الرسالة التي ستظهر للعملاء عند محاولة الدخول:
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-rose-500 focus:outline-none text-xs text-white resize-none"
              />
            </div>
          )}

          {/* Secret Passcode Input - Absolutely NO hint of 1177 */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              رمز الأمان السري للمالك:
            </label>
            <div className="relative">
              <input
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setError(null);
                }}
                placeholder="أدخل رمز الأمان السري..."
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-rose-500 focus:outline-none text-sm text-white font-mono tracking-widest"
              />
              <ShieldAlert className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isCurrentlyLocked
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.3)]'
              }`}
            >
              {isLoading ? (
                <span>جاري الحفظ والمزامنة السحابية...</span>
              ) : isCurrentlyLocked ? (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>تأكيد فك القفل وتشغيل الموقع</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>تأكيد إغلاق الموقع فوراً</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
