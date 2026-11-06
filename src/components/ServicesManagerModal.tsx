import React, { useState } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Save,
  Loader2,
  Check,
  Package,
  Layers,
  Sparkles,
  Phone,
  Truck,
  Building,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { DynamicService, AppSettings } from '../types';
import {
  createServiceInFirestore,
  updateServiceInFirestore,
  deleteServiceFromFirestore,
  saveAppSettings,
} from '../services/bookingService';

interface ServicesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: DynamicService[];
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const ServicesManagerModal: React.FC<ServicesManagerModalProps> = ({
  isOpen,
  onClose,
  services,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'services' | 'settings'>('services');

  // New Service form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSubname, setNewSubname] = useState('');
  const [newUnit, setNewUnit] = useState('قطعة');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [newDescription, setNewDescription] = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);

  // Edit Service state
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSubname, setEditSubname] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editPrice, setEditPrice] = useState<number | ''>('');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // General Settings state
  const [brandName, setBrandName] = useState(settings.brandName || 'CleanPro Express');
  const [brandTagline, setBrandTagline] = useState(settings.brandTagline || 'مغسلة السجاد والمفروشات الفاخرة بالبخار والأوزون');
  const [businessPhone, setBusinessPhone] = useState(settings.businessPhone || '');
  const [deliveryFee, setDeliveryFee] = useState(settings.deliveryFee || 0);
  const [shopBranchAddress, setShopBranchAddress] = useState(settings.shopBranchAddress || '');
  const [adminPasscode, setAdminPasscode] = useState(settings.adminPasscode || '2255');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  if (!isOpen) return null;

  // Handle Add New Service
  const handleAddNewService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newPrice === '') return;

    setIsSavingNew(true);
    try {
      await createServiceInFirestore({
        name: newName.trim(),
        subname: newSubname.trim(),
        unit: newUnit.trim() || 'قطعة',
        price: Number(newPrice) || 0,
        description: newDescription.trim(),
        icon: 'Sparkles',
      });

      // Reset
      setNewName('');
      setNewSubname('');
      setNewUnit('قطعة');
      setNewPrice('');
      setNewDescription('');
      setIsAddingNew(false);
    } catch (err) {
      console.error('Error adding service:', err);
    } finally {
      setIsSavingNew(false);
    }
  };

  // Start editing a service
  const startEdit = (srv: DynamicService) => {
    setEditingServiceId(srv.id);
    setEditName(srv.name);
    setEditSubname(srv.subname || '');
    setEditUnit(srv.unit);
    setEditPrice(srv.price);
    setEditDescription(srv.description || '');
  };

  // Handle Save Edit
  const handleSaveEdit = async (serviceId: string) => {
    if (!editName.trim() || editPrice === '') return;

    setIsSavingEdit(true);
    try {
      await updateServiceInFirestore(serviceId, {
        name: editName.trim(),
        subname: editSubname.trim(),
        unit: editUnit.trim() || 'قطعة',
        price: Number(editPrice) || 0,
        description: editDescription.trim(),
      });
      setEditingServiceId(null);
    } catch (err) {
      console.error('Error updating service:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Delete Service
  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف خدمة "${serviceName}" نهائياً من قائمة الأسعار؟`)) {
      return;
    }
    try {
      await deleteServiceFromFirestore(serviceId);
    } catch (err) {
      console.error('Error deleting service:', err);
    }
  };

  // Handle Save General Settings (Delivery Fee, WhatsApp, etc.)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSuccess(false);

    try {
      const updated: AppSettings = {
        ...settings,
        brandName: brandName.trim() || 'CleanPro Express',
        brandTagline: brandTagline.trim() || 'مغسلة السجاد والمفروشات الفاخرة بالبخار والأوزون',
        businessPhone: businessPhone.trim(),
        deliveryFee: Number(deliveryFee) || 0,
        shopBranchAddress: shopBranchAddress.trim(),
        adminPasscode: '2255',
        updatedAt: new Date().toISOString(),
      };

      await saveAppSettings(updated);
      onUpdateSettings(updated);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 2000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl glass-panel-cyan p-6 sm:p-8 my-8 shadow-2xl border border-cyan-500/40">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-full bg-slate-900 border border-slate-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-['Alexandria',sans-serif]">
              إدارة المنتجات والخدمات وإعدادات التوصيل
            </h3>
            <p className="text-xs text-slate-400">
              إضافة وتعديل وحذف خدمات الغسيل فورياً، وتحديد رسوم التوصيل ورقم الواتساب.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'services'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>قائمة الخدمات والأسعار ({services.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>رسوم التوصيل والواتساب</span>
          </button>
        </div>

        {/* TAB 1: DYNAMIC SERVICES (FULL CRUD) */}
        {activeTab === 'services' && (
          <div className="space-y-5">
            
            {/* Top Action to Add New Service */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                الخدمات المعروضة في حاسبة العميل:
              </span>

              {!isAddingNew && (
                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ إضافة خدمة جديدة</span>
                </button>
              )}
            </div>

            {/* Add New Service Form Drawer */}
            {isAddingNew && (
              <form
                onSubmit={handleAddNewService}
                className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 space-y-4 animate-in fade-in duration-200"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-cyan-300">إضافة خدمة أو صنف جديد</h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-slate-500 hover:text-slate-300 text-xs"
                  >
                    إلغاء
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      اسم الخدمة / الصنف <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="مثال: سجادة حرير إيراني"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      الوصف المختصر / المقاس
                    </label>
                    <input
                      type="text"
                      value={newSubname}
                      onChange={(e) => setNewSubname(e.target.value)}
                      placeholder="مثال: حتى مقاس 2×3 متر"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      السعر (بالجنيه EGP) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="5"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="150"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      وحدة القياس / الحساب
                    </label>
                    <input
                      type="text"
                      required
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder="قطعة / متر / مقعد"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    شرح إضافي لطريقة الغسيل (اختياري)
                  </label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="مثال: غسيل لطيف بمذيبات مخصصة للحفاظ على الألوان"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingNew}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSavingNew ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>حفظ الخدمة في السحابة</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of Current Services */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {services.map((srv) => {
                const isEditing = editingServiceId === srv.id;

                if (isEditing) {
                  return (
                    <div
                      key={srv.id}
                      className="p-4 rounded-xl bg-slate-900 border border-cyan-500/50 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="اسم الخدمة"
                          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                        />
                        <input
                          type="text"
                          value={editSubname}
                          onChange={(e) => setEditSubname(e.target.value)}
                          placeholder="المقاس / المواصفات"
                          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-cyan-400"
                          />
                          <span className="text-[10px] text-slate-400">ج.م</span>
                        </div>
                        <input
                          type="text"
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value)}
                          placeholder="الوحدة (قطعة)"
                          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingServiceId(null)}
                          className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                        >
                          إلغاء
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(srv.id)}
                          disabled={isSavingEdit}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 flex items-center gap-1"
                        >
                          {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          <span>تحديث</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={srv.id}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{srv.name}</span>
                        {srv.subname && (
                          <span className="text-[10px] text-cyan-400/80">({srv.subname})</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {srv.price} جنيه مصري / {srv.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(srv)}
                        className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/20 cursor-pointer"
                        title="تعديل السعر والاسم"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteService(srv.id, srv.name)}
                        className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 cursor-pointer"
                        title="حذف الخدمة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* TAB 2: GENERAL SETTINGS (Delivery Fee, WhatsApp, Branch Address) */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-5">
            
            {settingsSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>تم تحديث الإعدادات ورسوم التوصيل بنجاح في السحابة!</span>
              </div>
            )}

            {/* Website Name & Branding */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  اسم المغسلة / المتجر الإلكتروني (Website & Shop Name) <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-cyan-400 absolute right-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="مثال: CleanPro Express"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <span className="text-[10px] text-slate-500">
                  يتغير اسم المغسلة فورياً في الهيدر والفوتر والفاتورة لجميع الزوار.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  الشعار والوصف الترويجي (Brand Tagline)
                </label>
                <input
                  type="text"
                  value={brandTagline}
                  onChange={(e) => setBrandTagline(e.target.value)}
                  placeholder="مغسلة السجاد والمفروشات الفاخرة بالبخار والأوزون"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
                <span className="text-[10px] text-slate-500">
                  يظهر أسفل الشعار الرئيسي وفي تفاصيل الفاتورة.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Delivery / Pickup Fee */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رسوم الاستلام والتوصيل المنزلي (Delivery Fee)
                </label>
                <div className="relative">
                  <Truck className="w-4 h-4 text-cyan-400 absolute right-3 top-3 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    step="5"
                    required
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Number(e.target.value))}
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold font-['Alexandria',sans-serif] focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <span className="text-[10px] text-slate-500">
                  تُضاف هذه الرسوم فقط عند اختيار العميل "استلام وتوصيل للمنزل".
                </span>
              </div>

              {/* WhatsApp Number */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رقم الواتساب الرئيسي لاستقبال الحجوزات
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-cyan-400 absolute right-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    placeholder="201023456789"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <span className="text-[10px] text-slate-500">
                  تُرسل فواتير الحجز مباشرة إلى هذا الرقم بدون أي وسيط.
                </span>
              </div>

            </div>

            {/* Shop Branch Address for Self Drop-offs */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                عنوان مقر المغسلة الرئيسي (لتسليم الفرع الذاتي)
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-purple-400 absolute right-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={shopBranchAddress}
                  onChange={(e) => setShopBranchAddress(e.target.value)}
                  placeholder="الفرع الرئيسي: التجمع الخامس، شارع التسعين الشمالي"
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
              <span className="text-[10px] text-slate-500">
                يظهر هذا العنوان للعملاء الذين يختارون "تسليم بالفرع بنفسي".
              </span>
            </div>

            {/* Admin Passcode */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رمز مرور الإدارة المشفر (Admin Passcode)
              </label>
              <div className="relative w-48">
                <KeyRound className="w-4 h-4 text-cyan-400 absolute right-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  disabled
                  value="••••"
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-mono font-bold tracking-widest cursor-not-allowed"
                />
              </div>
              <span className="text-[10px] text-slate-500">مؤمن بنظام تشفير محمي للإدارة فقط.</span>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-2 cursor-pointer shadow-md"
              >
                {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>حفظ التعديلات في السحابة</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
