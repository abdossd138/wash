import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Droplets,
  Wind,
  Flame,
  Shield,
  Zap,
  Clock,
  HeartHandshake,
  CheckCircle2,
  Award,
  Layers,
  Truck,
  Sun,
  type LucideIcon,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';
import { SiteFeature } from '../types';
import {
  createFeatureInFirestore,
  updateFeatureInFirestore,
  deleteFeatureInFirestore,
} from '../services/bookingService';

interface FeaturesManagerTabProps {
  features: SiteFeature[];
  brandName?: string;
}

const AVAILABLE_ICONS: Array<{ key: string; label: string; icon: LucideIcon }> = [
  { key: 'Sparkles', label: 'لمعان ونظافة', icon: Sparkles },
  { key: 'Droplets', label: 'غسيل مائي', icon: Droplets },
  { key: 'Wind', label: 'طرد وتجفيف', icon: Wind },
  { key: 'Flame', label: 'بخار وحرارة', icon: Flame },
  { key: 'Shield', label: 'حماية وضمان', icon: Shield },
  { key: 'Zap', label: 'سرعة فائقة', icon: Zap },
  { key: 'Clock', label: 'التزام بالمواعيد', icon: Clock },
  { key: 'HeartHandshake', label: 'ثقة وأمانة', icon: HeartHandshake },
  { key: 'Award', label: 'جودة معتمدة', icon: Award },
  { key: 'Truck', label: 'توصيل منزلي', icon: Truck },
  { key: 'Sun', label: 'تعقيم طبيعي', icon: Sun },
  { key: 'Layers', label: 'عناية بالأنسجة', icon: Layers },
];

const COLOR_OPTIONS = [
  { key: 'cyan', label: 'سماوي (Cyan)', class: 'bg-cyan-500' },
  { key: 'purple', label: 'بنفسجي (Purple)', class: 'bg-purple-500' },
  { key: 'emerald', label: 'أخضر (Emerald)', class: 'bg-emerald-500' },
  { key: 'rose', label: 'وردي/أحمر (Rose)', class: 'bg-rose-500' },
  { key: 'amber', label: 'كهرماني (Amber)', class: 'bg-amber-500' },
];

export const FeaturesManagerTab: React.FC<FeaturesManagerTabProps> = ({
  features,
  brandName = 'CleanPro Express',
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New feature form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIcon, setNewIcon] = useState('Sparkles');
  const [newColor, setNewColor] = useState('cyan');
  const [isSaving, setIsSaving] = useState(false);

  // Edit feature form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('Sparkles');
  const [editColor, setEditColor] = useState('cyan');

  // Handle Add Feature
  const handleAddFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setIsSaving(true);
    try {
      await createFeatureInFirestore({
        title: newTitle.trim(),
        description: newDescription.trim(),
        icon: newIcon,
        color: newColor,
        active: true,
      });

      // Reset
      setNewTitle('');
      setNewDescription('');
      setNewIcon('Sparkles');
      setNewColor('cyan');
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to create feature:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Start editing
  const startEdit = (feat: SiteFeature) => {
    setEditingId(feat.id);
    setEditTitle(feat.title);
    setEditDescription(feat.description);
    setEditIcon(feat.icon || 'Sparkles');
    setEditColor(feat.color || 'cyan');
  };

  // Save edit
  const handleSaveEdit = async (id: string) => {
    if (!editTitle.trim() || !editDescription.trim()) return;

    setIsSaving(true);
    try {
      await updateFeatureInFirestore(id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        icon: editIcon,
        color: editColor,
      });
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update feature:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle active state
  const handleToggleActive = async (feat: SiteFeature) => {
    try {
      await updateFeatureInFirestore(feat.id, {
        active: feat.active === false ? true : false,
      });
    } catch (err) {
      console.error('Failed to toggle feature:', err);
    }
  };

  // Delete feature
  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف خاصية "${title}" نهائياً من الموقع؟`)) {
      return;
    }
    try {
      await deleteFeatureInFirestore(id);
    } catch (err) {
      console.error('Failed to delete feature:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Informational Live Sync Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 to-cyan-950/60 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white text-sm block">
              التحكم في مميزات وخصائص الموقع (Features Manager)
            </span>
            <p className="text-slate-300 text-xs">
              أي خاصية تضيفها أو تعدلها هنا تظهر فوراً في قسم «لماذا {brandName}؟» في صفحة الزبائن الحية.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isAdding ? 'إلغاء الإضافة' : '+ إضافة ميزة جديدة'}</span>
        </button>
      </div>

      {/* Add New Feature Form Card */}
      {isAdding && (
        <form
          onSubmit={handleAddFeature}
          className="p-6 rounded-2xl glass-panel-cyan border border-cyan-500/40 space-y-4 animate-in slide-in-from-top-4 duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>إضافة ميزة أو بروتوكول غسيل جديد</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                عنوان الميزة * (مثال: تعقيم بالموجات فوق الصوتية)
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="عنوان الخاصية..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                اللون المميز للأيقونة
              </label>
              <div className="flex items-center gap-2 pt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setNewColor(c.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      newColor === c.key
                        ? 'border-white text-white bg-slate-800'
                        : 'border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${c.class}`} />
                    <span>{c.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              وصف الميزة والتفاصيل العلمية *
            </label>
            <textarea
              required
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="اكتب شرحاً مختصراً يوضح للزبون فائدة هذه الميزة للمفروشات..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              اختر الأيقونة المناسبة:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {AVAILABLE_ICONS.map((item) => {
                const Icon = item.icon;
                const isSelected = newIcon === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setNewIcon(item.key)}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[11px] truncate max-w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all cursor-pointer shadow-md disabled:bg-slate-800"
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ ونشر في صفحة الزبون فوراً'}
            </button>
          </div>
        </form>
      )}

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feat) => {
          const isEditing = editingId === feat.id;
          const matchedIconObj = AVAILABLE_ICONS.find((i) => i.key === feat.icon) || AVAILABLE_ICONS[0];
          const IconComp = matchedIconObj.icon;
          const isActive = feat.active !== false;

          if (isEditing) {
            return (
              <div
                key={feat.id}
                className="p-5 rounded-2xl glass-panel-purple border border-purple-500/40 space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-purple-300">تعديل الميزة</span>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">العنوان</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">الوصف</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">الأيقونة</label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {AVAILABLE_ICONS.map((i) => {
                      const I = i.icon;
                      return (
                        <button
                          key={i.key}
                          type="button"
                          onClick={() => setEditIcon(i.key)}
                          className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                            editIcon === i.key
                              ? 'bg-purple-500/30 text-purple-300 border-purple-400'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                          title={i.label}
                        >
                          <I className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(feat.id)}
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-500 hover:bg-purple-400 text-white shadow-md cursor-pointer"
                  >
                    حفظ
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={feat.id}
              className={`p-5 rounded-2xl glass-panel border transition-all duration-200 flex flex-col justify-between gap-4 ${
                isActive
                  ? 'border-slate-800 hover:border-cyan-500/40'
                  : 'border-slate-900 bg-slate-950/40 opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{feat.title}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {feat.id}</span>
                    </div>
                  </div>

                  {/* Active / Inactive Badge & Toggle */}
                  <button
                    onClick={() => handleToggleActive(feat)}
                    className="flex items-center gap-1 cursor-pointer"
                    title={isActive ? 'الخاصية نشطة - انقر للتعطيل' : 'الخاصية معطلة - انقر للتفعيل'}
                  >
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>نشطة للزبائن</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        <span>معطلة</span>
                      </span>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                <button
                  onClick={() => handleToggleActive(feat)}
                  className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {isActive ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-400" />
                      <span>تعطيل مؤقت</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-slate-500" />
                      <span>تفعيل في الموقع</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(feat)}
                    className="p-1.5 rounded-lg text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/30 transition-all cursor-pointer"
                    title="تعديل الميزة"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(feat.id, feat.title)}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-all cursor-pointer"
                    title="حذف الميزة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
