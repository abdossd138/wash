import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  Settings as SettingsIcon,
  LogOut,
  RefreshCw,
  Phone,
  Tag,
  DollarSign,
  Package,
  Users,
  CheckCircle,
  Bell,
  ArrowRight,
  Eye,
  ChevronDown,
  AlertTriangle,
  Truck,
  Store,
  Layers,
  Trash2,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Booking,
  OrderStatus,
  AppSettings,
  CustomerCRMRecord,
  DynamicService,
} from '../types';
import { STATUS_METADATA } from '../constants';
import {
  subscribeToBookings,
  updateBookingStatus,
  deleteBooking,
  buildStatusWhatsAppUrl,
  exportBookingsToCSV,
} from '../services/bookingService';
import { ClientProfileDrawer } from './ClientProfileDrawer';
import { ManualOrderModal } from './ManualOrderModal';
import { ServicesManagerModal } from './ServicesManagerModal';
import { PrintInvoiceModal } from './PrintInvoiceModal';

interface AdminDashboardProps {
  services: DynamicService[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onLogout: () => void;
  onBackToStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  services,
  settings,
  onUpdateSettings,
  onLogout,
  onBackToStore,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [selectedClient, setSelectedClient] = useState<CustomerCRMRecord | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Notification for new incoming orders
  const [newOrderAlert, setNewOrderAlert] = useState<Booking | null>(null);
  const prevBookingsCountRef = useRef<number | null>(null);

  // Play audio chime for new incoming orders
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn('Audio chime unsupported or blocked', e);
    }
  };

  // Real-Time Sync Subscription via Firestore onSnapshot
  useEffect(() => {
    setIsLoading(true);

    const unsubscribe = subscribeToBookings(
      (updatedBookings) => {
        if (
          prevBookingsCountRef.current !== null &&
          updatedBookings.length > prevBookingsCountRef.current
        ) {
          const newest = updatedBookings[0];
          setNewOrderAlert(newest);
          playChime();
          setTimeout(() => setNewOrderAlert(null), 7000);
        }
        prevBookingsCountRef.current = updatedBookings.length;
        setBookings(updatedBookings);
        setIsLoading(false);
      },
      (error) => {
        console.error('Subscription error in dashboard:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Compute CRM aggregation: group by customer phone
  const clientsMap = useMemo(() => {
    const map = new Map<string, CustomerCRMRecord>();

    bookings.forEach((b) => {
      const phoneKey = b.phone.replace(/\D/g, '');
      const existing = map.get(phoneKey);

      if (!existing) {
        map.set(phoneKey, {
          phone: b.phone,
          name: b.customerName,
          address: b.address,
          totalOrders: 1,
          totalSpent: b.totalPrice,
          lastOrderDate: b.createdAt,
          orders: [b],
          tier: b.totalPrice > 1000 ? 'vip' : 'regular',
          customerNotes: b.internalNotes,
        });
      } else {
        existing.totalOrders += 1;
        existing.totalSpent += b.totalPrice;
        existing.orders.push(b);
        if (new Date(b.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = b.createdAt;
          existing.name = b.customerName;
          existing.address = b.address;
        }
        if (b.internalNotes && !existing.customerNotes) {
          existing.customerNotes = b.internalNotes;
        }
        if (existing.totalSpent >= 1000 || existing.totalOrders >= 5) {
          existing.tier = 'vip';
        } else if (existing.totalSpent >= 400 || existing.totalOrders >= 2) {
          existing.tier = 'gold';
        }
      }
    });

    return map;
  }, [bookings]);

  // Financial & Operational Metrics
  const metrics = useMemo(() => {
    const totalEarnings = bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const activeJobs = bookings.filter(
      (b) => b.status === 'received' || b.status === 'washing' || b.status === 'ready'
    ).length;

    const completedJobs = bookings.filter((b) => b.status === 'delivered').length;

    const clientsServed = clientsMap.size;

    return {
      totalEarnings,
      activeJobs,
      completedJobs,
      clientsServed,
    };
  }, [bookings, clientsMap]);

  // Filtered Bookings for Table
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      const q = searchQuery.toLowerCase().trim().replace(/[#\s]/g, '');
      const orderIdClean = String(b.orderId || '').toLowerCase().replace(/[#\s]/g, '');
      
      const matchesSearch =
        !q ||
        orderIdClean.includes(q) ||
        b.customerName?.toLowerCase().includes(q) ||
        b.phone?.includes(q) ||
        b.address?.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [bookings, statusFilter, searchQuery]);

  // Quick Status Transition Pipeline
  const handleStatusUpdate = async (bookingId: string, newStatus: OrderStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  // Next status in pipeline helper
  const advanceStatusInPipeline = async (booking: Booking) => {
    const pipeline: OrderStatus[] = ['received', 'washing', 'ready', 'delivered'];
    const currentIndex = pipeline.indexOf(booking.status);
    if (currentIndex >= 0 && currentIndex < pipeline.length - 1) {
      const nextStatus = pipeline[currentIndex + 1];
      await handleStatusUpdate(booking.id, nextStatus);
    }
  };

  // Delete booking handler
  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await deleteBooking(bookingId);
      setDeleteConfirmId(null);
    } catch (e) {
      console.error('Failed to delete booking:', e);
    }
  };

  // Open CRM Drawer for customer
  const handleOpenClientCRM = (booking: Booking) => {
    const phoneKey = booking.phone.replace(/\D/g, '');
    const clientRecord = clientsMap.get(phoneKey);
    if (clientRecord) {
      setSelectedClient(clientRecord);
    } else {
      setSelectedClient({
        name: booking.customerName,
        phone: booking.phone,
        address: booking.address,
        totalOrders: 1,
        totalSpent: booking.totalPrice,
        lastOrderDate: booking.createdAt,
        orders: [booking],
        tier: 'regular',
        customerNotes: booking.internalNotes,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-['Cairo',sans-serif] pb-16">
      
      {/* Real-time Order Alert Toast */}
      {newOrderAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-in slide-in-from-top-4 duration-300">
          <div className="p-4 rounded-2xl glass-panel-cyan bg-cyan-950/95 border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <span className="text-xs font-bold text-cyan-300 block">طلب حجز جديد وصل الآن!</span>
                <p className="text-sm font-bold">
                  {newOrderAlert.customerName} (طلب #{newOrderAlert.orderId}) - {newOrderAlert.totalPrice} ج.م
                </p>
              </div>
            </div>
            <button
              onClick={() => setNewOrderAlert(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 cursor-pointer"
            >
              عرض
            </button>
          </div>
        </div>
      )}

      {/* Top Admin Header */}
      <header className="glass-panel border-b border-cyan-500/20 bg-[#0A0F1D]/90 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/30 border border-cyan-400/40 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white font-['Alexandria',sans-serif]">
                  لوحة تحكم {settings.brandName || 'CleanPro Express'}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  لوحة المالك (CRM)
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>مزامنة سحابية حية (Firebase Firestore) نشطة</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>طلب يدوي</span>
            </button>

            {/* Dynamic Products & Services Manager (Full CRUD) */}
            <button
              onClick={() => setIsServicesModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] cursor-pointer"
              title="إدارة المنتجات والخدمات (إضافة، تعديل، حذف) ورسوم التوصيل"
            >
              <Layers className="w-4 h-4" />
              <span>إدارة المنتجات والأسعار (CMS)</span>
            </button>

            {/* Excel / CSV Report Export with UTF-8 BOM */}
            <button
              onClick={() => exportBookingsToCSV(bookings, settings.brandName || 'CleanPro')}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
              title="تصدير تقرير إكسيل كامل بكافة الطلبات والعملاء والمفروشات"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-950" />
              <span>تصدير تقرير Excel</span>
            </button>

            {/* Standalone Single-file Download */}
            <a
              href="/standalone_index.html"
              download="index.html"
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 flex items-center gap-1.5 transition-all cursor-pointer"
              title="تحميل كود الصفحة الواحدة (index.html) الجاهز للنشر المباشر على Vercel أو GitHub Pages"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline">تحميل كود الصفحة الواحدة</span>
            </a>

            <button
              onClick={onBackToStore}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
              title="معاينة واجهة العملاء"
            >
              <ArrowRight className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">واجهة العملاء</span>
            </button>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 bg-slate-900/80 border border-slate-800 transition-colors cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Financial & Operational Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="p-4 sm:p-5 rounded-2xl glass-panel-cyan border-cyan-500/30 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">إجمالي الأرباح والإيرادات</span>
              <DollarSign className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1 pt-1">
              <span className="text-2xl sm:text-3xl font-black text-white font-['Alexandria',sans-serif]">
                {metrics.totalEarnings.toLocaleString()}
              </span>
              <span className="text-xs text-cyan-400 font-bold">ج.م</span>
            </div>
            <span className="text-[10px] text-slate-500 block">إجمالي قيمة الطلبات في النظام</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl glass-panel-purple border-purple-500/30 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">طلبات نشطة قيد التشغيل</span>
              <Package className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-1 pt-1">
              <span className="text-2xl sm:text-3xl font-black text-white font-['Alexandria',sans-serif]">
                {metrics.activeJobs}
              </span>
              <span className="text-xs text-purple-400 font-bold">طلب نشط</span>
            </div>
            <span className="text-[10px] text-slate-500 block">استلام • غسيل • جاهز للتسليم</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl glass-panel border-emerald-500/30 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">طلبات مكتملة تم تسليمها</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1 pt-1">
              <span className="text-2xl sm:text-3xl font-black text-white font-['Alexandria',sans-serif]">
                {metrics.completedJobs}
              </span>
              <span className="text-xs text-emerald-400 font-bold">مكتمل</span>
            </div>
            <span className="text-[10px] text-slate-500 block">تم تسليمها للعميل بنجاح</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl glass-panel border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold">إجمالي العملاء</span>
              <Users className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex items-baseline gap-1 pt-1">
              <span className="text-2xl sm:text-3xl font-black text-white font-['Alexandria',sans-serif]">
                {metrics.clientsServed}
              </span>
              <span className="text-xs text-teal-400 font-bold">عميل مسجل</span>
            </div>
            <span className="text-[10px] text-slate-500 block">قاعدة بيانات العملاء الفريدة</span>
          </div>

        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl border-slate-800">
          
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              جميع الطلبات ({bookings.length})
            </button>

            <button
              onClick={() => setStatusFilter('received')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'received'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              تم الاستلام ({bookings.filter((b) => b.status === 'received').length})
            </button>

            <button
              onClick={() => setStatusFilter('washing')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'washing'
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              جاري الغسيل ({bookings.filter((b) => b.status === 'washing').length})
            </button>

            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'ready'
                  ? 'bg-purple-400 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              جاهز للتسليم ({bookings.filter((b) => b.status === 'ready').length})
            </button>

            <button
              onClick={() => setStatusFilter('delivered')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'delivered'
                  ? 'bg-emerald-400 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              مكتمل ({bookings.filter((b) => b.status === 'delivered').length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، الهاتف، أو رقم الطلب (#1)..."
              className="w-full pr-9 pl-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

        </div>

        {/* Master Customer & Order Table */}
        <div className="glass-panel rounded-2xl border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-4">رقم الطلب (#)</th>
                  <th className="py-4 px-4">العميل</th>
                  <th className="py-4 px-4">الهاتف</th>
                  <th className="py-4 px-4">طريقة الاستلام</th>
                  <th className="py-4 px-4">المفروشات</th>
                  <th className="py-4 px-4">العنوان والتاريخ</th>
                  <th className="py-4 px-4">الفاتورة</th>
                  <th className="py-4 px-4">الحالة (Pipeline)</th>
                  <th className="py-4 px-4 text-center">إجراءات / طباعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
                      <span>جاري مزامنة الطلبات اللحظية من السحابة...</span>
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      لا توجد طلبات مطابقة للفلتر أو البحث المحدد.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => {
                    const statusMeta = STATUS_METADATA[b.status] || STATUS_METADATA.received;

                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-slate-900/60 transition-colors group"
                      >
                        {/* Simple Numeric Order ID */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-cyan-400 text-base">
                              #{b.orderId}
                            </span>
                            {b.source === 'manual' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                يدوي
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {new Date(b.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                        </td>

                        {/* Customer Name */}
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleOpenClientCRM(b)}
                            className="font-bold text-white hover:text-cyan-300 transition-colors flex items-center gap-1.5 text-right cursor-pointer group-hover:underline"
                            title="عرض سجل العميل"
                          >
                            <span>{b.customerName}</span>
                            <Eye className="w-3 h-3 text-cyan-400 opacity-60 group-hover:opacity-100" />
                          </button>
                        </td>

                        {/* Phone with WhatsApp */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-300">{b.phone}</span>
                            <a
                              href={`https://wa.me/${b.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                              title="محادثة واتساب"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>

                        {/* Delivery Option */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {b.deliveryType === 'pickup' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                              <Truck className="w-3 h-3" />
                              <span>توصيل منزلي</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                              <Store className="w-3 h-3" />
                              <span>بالفرع</span>
                            </span>
                          )}
                        </td>

                        {/* Items Breakdown */}
                        <td className="py-4 px-4 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {b.itemsDetails && b.itemsDetails.length > 0 ? (
                              b.itemsDetails.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-slate-300"
                                >
                                  {item.name}: <strong className="text-white">{item.count}</strong>
                                </span>
                              ))
                            ) : (
                              Object.entries(b.items || {}).map(([key, count]) => {
                                if (!count) return null;
                                return (
                                  <span
                                    key={key}
                                    className="inline-block text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-slate-300"
                                  >
                                    {key}: <strong className="text-white">{count}</strong>
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </td>

                        {/* Address & Delivery Date */}
                        <td className="py-4 px-4 max-w-xs">
                          <p className="text-slate-300 truncate font-semibold" title={b.address}>
                            {b.address}
                          </p>
                          <span className="text-[10px] text-cyan-400 block mt-0.5">
                            {b.deliveryDate} ({b.timeSlot})
                          </span>
                        </td>

                        {/* Total Cost */}
                        <td className="py-4 px-4 whitespace-nowrap font-bold text-sm text-white font-['Alexandria',sans-serif]">
                          {b.totalPrice} <span className="text-xs text-slate-400 font-normal">ج.م</span>
                        </td>

                        {/* Status Pipeline */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className="relative inline-block">
                              <select
                                value={b.status}
                                onChange={(e) => handleStatusUpdate(b.id, e.target.value as OrderStatus)}
                                className={`text-xs font-bold py-1.5 px-3 rounded-xl border appearance-none pr-7 cursor-pointer outline-none transition-all ${statusMeta.bgColor} ${statusMeta.color} ${statusMeta.borderColor}`}
                              >
                                <option value="received" className="bg-slate-900 text-amber-300">
                                  تم الاستلام والفرز
                                </option>
                                <option value="washing" className="bg-slate-900 text-cyan-300">
                                  جاري الغسيل والتعقيم
                                </option>
                                <option value="ready" className="bg-slate-900 text-purple-300">
                                  جاهز ومغلف للتسليم
                                </option>
                                <option value="delivered" className="bg-slate-900 text-emerald-300">
                                  تم التسليم بنجاح
                                </option>
                                <option value="cancelled" className="bg-slate-900 text-rose-300">
                                  ملغي
                                </option>
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 absolute left-2 top-2.5 pointer-events-none opacity-70" />
                            </div>

                            {/* One-click Pipeline Advance */}
                            {b.status !== 'delivered' && b.status !== 'cancelled' && (
                              <button
                                onClick={() => advanceStatusInPipeline(b)}
                                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition-all cursor-pointer"
                                title="تقديم لمرحلة الغسيل/التسليم التالية"
                              >
                                تقدم ➔
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            <a
                              href={buildStatusWhatsAppUrl(
                                b,
                                statusMeta.label,
                                settings.businessPhone
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 cursor-pointer"
                              title="إرسال إشعار للعميل عبر واتساب"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>

                            <button
                              onClick={() => setInvoiceBooking(b)}
                              className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-500/10 border border-purple-500/20 cursor-pointer"
                              title="طباعة كارت الحزمة أو الفاتورة"
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </button>

                            {b.status === 'delivered' ? (
                              <button
                                onClick={() => setDeleteConfirmId(b.id)}
                                className="px-2.5 py-1.5 rounded-lg text-rose-300 bg-rose-500/15 border border-rose-500/40 hover:bg-rose-500/25 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                title="حذف الطلب المكتمل نهائياً من خط العمل السحابي"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                <span>حذف المكتمل</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(b.id)}
                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 cursor-pointer"
                                title="حذف هذا الطلب"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl max-w-sm w-full border-rose-500/40 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">تأكيد حذف الطلب؟</h4>
            <p className="text-xs text-slate-400">
              سيتم حذف الطلب نهائياً من قاعدة البيانات السحابية.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDeleteBooking(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
              >
                نعم، احذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client CRM Profile Drawer */}
      {selectedClient && (
        <ClientProfileDrawer
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onStatusChange={handleStatusUpdate}
        />
      )}

      {/* Manual Order Modal */}
      {isManualModalOpen && (
        <ManualOrderModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          settings={settings}
          services={services}
        />
      )}

      {/* Full CRUD Products & Services Manager Modal */}
      {isServicesModalOpen && (
        <ServicesManagerModal
          isOpen={isServicesModalOpen}
          onClose={() => setIsServicesModalOpen(false)}
          services={services}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
        />
      )}

      {/* Print Invoice / Bundle Tag Modal */}
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
