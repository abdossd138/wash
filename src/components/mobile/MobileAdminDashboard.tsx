import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Package,
  Layers,
  Image as ImageIcon,
  DollarSign,
  Search,
  Plus,
  Phone,
  MessageCircle,
  Truck,
  Store,
  CheckCircle,
  LogOut,
  Monitor,
  Lock,
  Unlock,
  Trash2,
  Printer,
  FileSpreadsheet,
  Settings as SettingsIcon,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import {
  Booking,
  OrderStatus,
  AppSettings,
  DynamicService,
  SiteFeature,
  PromoMediaItem,
} from '../../types';
import { STATUS_METADATA } from '../../constants';
import {
  subscribeToBookings,
  updateBookingStatus,
  deleteBooking,
  exportBookingsToCSV,
  buildStatusWhatsAppUrl,
  saveAppSettings,
} from '../../services/bookingService';
import { PromoMediaManagerTab } from '../PromoMediaManagerTab';
import { StoreLockModal } from '../StoreLockModal';
import { ManualOrderModal } from '../ManualOrderModal';
import { ServicesManagerModal } from '../ServicesManagerModal';
import { PrintInvoiceModal } from '../PrintInvoiceModal';

interface MobileAdminDashboardProps {
  services: DynamicService[];
  features?: SiteFeature[];
  mediaItems?: PromoMediaItem[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onLogout: () => void;
  onBackToStore: () => void;
  onSwitchToDesktop: () => void;
}

export const MobileAdminDashboard: React.FC<MobileAdminDashboardProps> = ({
  services,
  features = [],
  mediaItems = [],
  settings,
  onUpdateSettings,
  onLogout,
  onBackToStore,
  onSwitchToDesktop,
}) => {
  // Navigation tab for mobile admin
  const [activeTab, setActiveTab] = useState<'orders' | 'media' | 'pricing' | 'settings'>('orders');

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Status filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isStoreLockModalOpen, setIsStoreLockModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);

  // Quick brand name editing
  const [quickBrandName, setQuickBrandName] = useState(settings.brandName || 'CleanPro Express');
  const [quickPhone, setQuickPhone] = useState(settings.businessPhone || '');
  const [quickDeliveryFee, setQuickDeliveryFee] = useState(settings.deliveryFee ?? 30);
  const [isSavingQuickSettings, setIsSavingQuickSettings] = useState(false);

  // Subscribe to bookings in real-time
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToBookings((liveBookings) => {
      setBookings(liveBookings);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        !searchQuery.trim() ||
        b.orderId.includes(searchQuery.trim().replace('#', '')) ||
        b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.phone.includes(searchQuery.trim());

      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  // Operational metrics
  const metrics = useMemo(() => {
    const totalEarnings = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const activeJobs = bookings.filter((b) => b.status !== 'delivered' && b.status !== 'cancelled').length;
    const deliveredCount = bookings.filter((b) => b.status === 'delivered').length;
    return { totalEarnings, activeJobs, deliveredCount };
  }, [bookings]);

  // Handle status update from card
  const handleStatusChange = async (bookingId: string, newStatus: OrderStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Handle order deletion
  const handleDeleteOrder = async (booking: Booking) => {
    if (window.confirm(`هل أنت متأكد من حذف طلب #${booking.orderId} للعميل ${booking.customerName} نهائياً؟`)) {
      try {
        await deleteBooking(booking.id);
      } catch (e) {
        console.error('Failed to delete booking:', e);
      }
    }
  };

  // Save quick mobile settings
  const handleSaveQuickSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingQuickSettings(true);
    try {
      await saveAppSettings({
        brandName: quickBrandName.trim(),
        businessPhone: quickPhone.trim(),
        deliveryFee: Number(quickDeliveryFee),
      });
      onUpdateSettings({
        ...settings,
        brandName: quickBrandName.trim(),
        businessPhone: quickPhone.trim(),
        deliveryFee: Number(quickDeliveryFee),
      });
      alert('تم حفظ وتحديث إعدادات المتجر بنجاح!');
    } catch (e) {
      console.error('Failed to save settings:', e);
    } finally {
      setIsSavingQuickSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-['Cairo',sans-serif] pb-24 select-none">
      
      {/* 1. Mobile Top Admin Header */}
      <header className="sticky top-0 z-40 bg-[#0A0F1D]/95 backdrop-blur-md border-b border-cyan-500/20 px-3.5 py-3">
        <div className="flex items-center justify-between">
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white font-['Alexandria',sans-serif] leading-tight">
                {settings.brandName || 'CleanPro Express'}
              </h1>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>لوحة تحكم الموبايل (CRM)</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Store Lock Button */}
            <button
              onClick={() => setIsStoreLockModalOpen(true)}
              className={`p-1.5 px-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 ${
                settings.isStoreLocked
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500 animate-pulse'
                  : 'bg-slate-900 text-rose-400 border border-rose-500/30'
              }`}
              title="إغلاق أو فتح الموقع برمز الأمان 1177"
            >
              {settings.isStoreLocked ? <Lock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{settings.isStoreLocked ? 'مغلق (فك)' : 'إغلاق'}</span>
            </button>

            {/* Switch to Desktop View */}
            <button
              onClick={onSwitchToDesktop}
              className="p-1.5 px-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 active:scale-95 flex items-center gap-1 text-[11px] font-bold"
              title="عرض نسخة الكمبيوتر الكاملة"
            >
              <Monitor className="w-3.5 h-3.5 text-cyan-400" />
              <span>كمبيوتر</span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 active:scale-95"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. Quick Metrics Row */}
      <div className="px-3.5 pt-3">
        <div className="grid grid-cols-3 gap-2">
          
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-center space-y-0.5">
            <span className="text-[10px] text-slate-400 block">الإيرادات</span>
            <span className="text-sm font-black text-cyan-300 font-['Alexandria',sans-serif]">
              {metrics.totalEarnings.toLocaleString()}
            </span>
            <span className="text-[9px] text-slate-500 block">ج.م</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-purple-500/30 text-center space-y-0.5">
            <span className="text-[10px] text-slate-400 block">طلبات نشطة</span>
            <span className="text-sm font-black text-purple-300 font-['Alexandria',sans-serif]">
              {metrics.activeJobs}
            </span>
            <span className="text-[9px] text-slate-500 block">قيد التنفيذ</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-center space-y-0.5">
            <span className="text-[10px] text-slate-400 block">المكتملة</span>
            <span className="text-sm font-black text-emerald-300 font-['Alexandria',sans-serif]">
              {metrics.deliveredCount}
            </span>
            <span className="text-[9px] text-slate-500 block">تم تسليمها</span>
          </div>

        </div>
      </div>

      {/* 3. Main Admin Content based on tab */}
      <main className="px-3.5 pt-3 space-y-3">
        
        {/* TAB A: ORDERS LIST */}
        {activeTab === 'orders' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            
            {/* Action Bar (Manual Order + Excel Export) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل طلب يدوي</span>
              </button>

              <button
                onClick={() => exportBookingsToCSV(bookings, settings.brandName || 'CleanPro')}
                className="py-2.5 px-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                title="تصدير تقرير إكسيل"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>إكسيل</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، الهاتف، أو رقم الطلب..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-cyan-400 pl-9"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Status Filter Horizontal Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {[
                { id: 'all', label: `الكل (${bookings.length})` },
                { id: 'received', label: 'استلام' },
                { id: 'washing', label: 'غسيل' },
                { id: 'ready', label: 'جاهز' },
                { id: 'delivered', label: 'تم التسليم' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    statusFilter === st.id
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900/80 text-slate-400 border border-slate-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Mobile Order Cards List */}
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                جاري تحميل الطلبات والمزامنة السحابية...
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs">
                لا توجد طلبات تطابق هذا البحث أو الفلتر.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((b) => {
                  const phoneClean = b.phone.replace(/\D/g, '');
                  const currentStatusMeta = STATUS_METADATA[b.status] || { label: b.status, color: 'text-slate-300' };

                  return (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-cyan-400 text-sm">
                              #{b.orderId}
                            </span>
                            <span className="font-bold text-white text-sm">
                              {b.customerName}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              {b.deliveryType === 'pickup' ? (
                                <Truck className="w-3 h-3 text-cyan-400" />
                              ) : (
                                <Store className="w-3 h-3 text-purple-400" />
                              )}
                              <span>{b.deliveryType === 'pickup' ? 'توصيل منزلي' : 'تسليم فرع'}</span>
                            </span>
                            <span>•</span>
                            <span>{b.deliveryDate}</span>
                          </div>
                        </div>

                        {/* Price Tag */}
                        <div className="text-left shrink-0">
                          <span className="text-sm font-black text-white font-['Alexandria',sans-serif]">
                            {b.totalPrice}
                          </span>
                          <span className="text-[10px] text-cyan-400 font-bold mr-1">ج.م</span>
                        </div>
                      </div>

                      {/* Phone & Quick Contact Buttons */}
                      <div className="flex items-center justify-between text-xs bg-slate-950/70 p-2 rounded-xl border border-slate-800/60">
                        <span className="font-mono text-slate-300" dir="ltr">
                          {b.phone}
                        </span>

                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/${phoneClean}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 px-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 active:scale-95"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>واتساب</span>
                          </a>

                          <a
                            href={`tel:${phoneClean}`}
                            className="p-1 px-2 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold flex items-center gap-1 active:scale-95"
                          >
                            <Phone className="w-3 h-3 text-cyan-400" />
                            <span>اتصال</span>
                          </a>
                        </div>
                      </div>

                      {/* Car Details (if car wash booking) */}
                      {b.carDetails && (
                        <div className="text-xs">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-black">
                            🚗 <span>{b.carDetails.brand} - {b.carDetails.model}</span>
                          </span>
                        </div>
                      )}

                      {/* Items summary */}
                      <div className="text-xs text-slate-300">
                        <span className="text-[10px] text-slate-500 block mb-0.5 font-bold">
                          {b.serviceCategory === 'cars' ? 'خدمات السيارة:' : 'المفروشات:'}
                        </span>
                        <p className="line-clamp-2 leading-relaxed">
                          {b.itemsDetails && b.itemsDetails.length > 0
                            ? b.itemsDetails.map((it) => `${it.name} (${it.count})`).join(' • ')
                            : Object.entries(b.items || {})
                                .filter(([, c]) => c > 0)
                                .map(([k, c]) => `${k} (${c})`)
                                .join(' • ') || 'لم تحدد'}
                        </p>
                      </div>

                      {/* One-Tap Status Selector Pill Bar */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold block">
                          تحديث مرحلة الغسيل والتسليم:
                        </span>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { id: 'received', label: 'استلام' },
                            { id: 'washing', label: 'غسيل' },
                            { id: 'ready', label: 'جاهز' },
                            { id: 'delivered', label: 'تسليم' },
                          ].map((st) => {
                            const isCurrent = b.status === st.id;
                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => handleStatusChange(b.id, st.id as OrderStatus)}
                                className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                                  isCurrent
                                    ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                                    : 'bg-slate-950 text-slate-400 border border-slate-800/80 hover:text-white'
                                }`}
                              >
                                {st.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px]">
                        <button
                          onClick={() => setInvoiceBooking(b)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center gap-1 active:scale-95"
                        >
                          <Printer className="w-3.5 h-3.5 text-cyan-400" />
                          <span>فاتورة / باركود</span>
                        </button>

                        {/* Send Status on WhatsApp */}
                        <a
                          href={buildStatusWhatsAppUrl(
                            b,
                            currentStatusMeta.label,
                            settings.businessPhone,
                            settings.brandName
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold flex items-center gap-1 active:scale-95"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>إشعار الحالة</span>
                        </a>

                        {b.status === 'delivered' && (
                          <button
                            onClick={() => handleDeleteOrder(b)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="حذف الطلب المكتمل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB B: MEDIA MANAGER */}
        {activeTab === 'media' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <PromoMediaManagerTab mediaItems={mediaItems} />
          </div>
        )}

        {/* TAB C: PRICING & SERVICES (CMS) */}
        {activeTab === 'pricing' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-500/30 flex items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-white text-xs">
                  إدارة المنتجات والأسعار ({services.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  تعديل الأسعار وإضافة سجاد ومفروشات جديدة للعملاء.
                </p>
              </div>

              <button
                onClick={() => setIsServicesModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shrink-0 active:scale-95"
              >
                + إدارة الخدمات
              </button>
            </div>

            {/* Quick List of Services */}
            <div className="space-y-2">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{srv.name}</span>
                    <span className="text-[10px] text-slate-400">{srv.subname || srv.unit}</span>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 font-black font-['Alexandria',sans-serif]">
                    {srv.price} ج.م
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB D: SETTINGS & BRANDING */}
        {activeTab === 'settings' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <form onSubmit={handleSaveQuickSettings} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
              <h3 className="font-black text-white text-sm font-['Alexandria',sans-serif]">
                إعدادات وهوية المتجر
              </h3>

              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم الموقع / المتجر:</label>
                <input
                  type="text"
                  value={quickBrandName}
                  onChange={(e) => setQuickBrandName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم هاتف استقبال الواتساب:</label>
                <input
                  type="tel"
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono outline-none focus:border-cyan-400"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رسوم التوصيل الافتراضية (ج.م):</label>
                <input
                  type="number"
                  value={quickDeliveryFee}
                  onChange={(e) => setQuickDeliveryFee(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingQuickSettings}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black active:scale-98 transition-all"
              >
                {isSavingQuickSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات سحابياً'}
              </button>
            </form>

            <div className="p-3 text-center">
              <button
                onClick={onBackToStore}
                className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>معاينة صفحة العملاء المباشرة</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* 4. Mobile Admin Bottom Thumb Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0F1D]/95 backdrop-blur-md border-t border-slate-800/80 px-2 py-1.5">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-1.5 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
              activeTab === 'orders'
                ? 'text-cyan-400 font-bold bg-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="text-[11px]">الطلبات ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`py-1.5 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
              activeTab === 'media'
                ? 'text-cyan-400 font-bold bg-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span className="text-[11px]">الإعلانات</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`py-1.5 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
              activeTab === 'pricing'
                ? 'text-cyan-400 font-bold bg-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[11px]">الأسعار (CMS)</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-1.5 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'text-cyan-400 font-bold bg-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span className="text-[11px]">الإعدادات</span>
          </button>

        </div>
      </nav>

      {/* Modals */}
      {isStoreLockModalOpen && (
        <StoreLockModal
          isOpen={isStoreLockModalOpen}
          onClose={() => setIsStoreLockModalOpen(false)}
          isCurrentlyLocked={Boolean(settings.isStoreLocked)}
          currentMessage={settings.storeLockMessage}
        />
      )}

      {isManualModalOpen && (
        <ManualOrderModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          settings={settings}
          services={services}
        />
      )}

      {isServicesModalOpen && (
        <ServicesManagerModal
          isOpen={isServicesModalOpen}
          onClose={() => setIsServicesModalOpen(false)}
          services={services}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
        />
      )}

      {invoiceBooking && (
        <PrintInvoiceModal
          booking={invoiceBooking}
          settings={settings}
          onClose={() => setInvoiceBooking(null)}
        />
      )}

    </div>
  );
};
