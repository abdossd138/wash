import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Plus,
  Trash2,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  X,
  Play,
  Sparkles,
  Upload,
  Link as LinkIcon,
  AlertTriangle,
  Loader2,
  Check,
} from 'lucide-react';
import { PromoMediaItem } from '../types';
import {
  createPromoMediaInFirestore,
  updatePromoMediaInFirestore,
  deletePromoMediaFromFirestore,
} from '../services/bookingService';
import { compressImageFile, readVideoFileAsDataUrl, formatVideoEmbedInfo } from '../utils/mediaUpload';

interface PromoMediaManagerTabProps {
  mediaItems: PromoMediaItem[];
}

export const PromoMediaManagerTab: React.FC<PromoMediaManagerTabProps> = ({ mediaItems = [] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState<'image' | 'video'>('image');
  const [sourceMode, setSourceMode] = useState<'upload' | 'url'>('upload');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setIsProcessingFile(true);
    setFileName(file.name);

    try {
      if (type === 'image') {
        const compressedBase64 = await compressImageFile(file);
        setUrl(compressedBase64);
      } else {
        const result = await readVideoFileAsDataUrl(file);
        if (result.error) {
          setFileError(result.error);
        } else if (result.sizeMB > 0.75) {
          setFileError(`حجم ملف الفيديو (${result.sizeMB.toFixed(1)} ميجابايت) أكبر من الحد المباشر للسحابة (1 ميجابايت). للمحافظة على سرعة تصفح العملاء يرجى نسخ رابط الفيديو من يوتيوب أو تيك توك ووضعه في خانة 'رابط من الإنترنت'.`);
        } else if (result.dataUrl) {
          setUrl(result.dataUrl);
        }
      }
    } catch (err: any) {
      setFileError(err?.message || 'فشل في معالجة الملف المحدد من الجهاز.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setFileError('يرجى اختيار صورة/فيديو من جهازك أو وضع رابط صالح.');
      return;
    }

    setIsSaving(true);
    try {
      await createPromoMediaInFirestore({
        type,
        url: url.trim(),
        title: title.trim(),
        subtitle: subtitle.trim(),
        linkUrl: linkUrl.trim(),
        active: true,
      });

      // Reset form
      setUrl('');
      setTitle('');
      setSubtitle('');
      setLinkUrl('');
      setFileName(null);
      setFileError(null);
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to create media item:', err);
      setFileError('فشل حفظ العنصر في قاعدة البيانات.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (item: PromoMediaItem) => {
    try {
      await updatePromoMediaInFirestore(item.id, {
        active: item.active === false ? true : false,
      });
    } catch (err) {
      console.error('Failed to toggle media item:', err);
    }
  };

  const handleDelete = async (id: string, itemTitle?: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف ${itemTitle ? `"${itemTitle}"` : 'هذا العنصر الإعلاني'} نهائياً؟`)) {
      return;
    }
    try {
      await deletePromoMediaFromFirestore(id);
    } catch (err) {
      console.error('Failed to delete media item:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Info Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/70 to-purple-950/70 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white text-sm block">
              إدارة إعلانات الصور والفيديوهات في الواجهة الرئيسية
            </span>
            <p className="text-slate-300 text-xs">
              يمكنك رفع صور وفيديوهات مباشرة من جهازك أو وضع رابط من الإنترنت أو يوتيوب. عند وجود إعلانات تظهر للعملاء فوراً، وعند عدم وجودها يختفي القسم بالكامل بدون ترك أي فراغ.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setUrl('');
            setFileName(null);
            setFileError(null);
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isAdding ? 'إلغاء الإضافة' : '+ إضافة صورة أو فيديو جديد'}</span>
        </button>
      </div>

      {/* Add Media Form Drawer */}
      {isAdding && (
        <form
          onSubmit={handleAddMedia}
          className="p-6 rounded-2xl glass-panel-cyan border border-cyan-500/40 space-y-4 animate-in slide-in-from-top-4 duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>إضافة إعلان جديد (صورة أو فيديو)</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Type Selector (Image vs Video) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setType('image');
                setUrl('');
                setFileName(null);
              }}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                type === 'image'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>صورة إعلانية (Photo Banner)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('video');
                setUrl('');
                setFileName(null);
              }}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                type === 'video'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-400'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              <VideoIcon className="w-4 h-4" />
              <span>فيديو ترويجي (Video Banner)</span>
            </button>
          </div>

          {/* 2. Source Mode Selector (Upload from Device vs URL from Web) */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setSourceMode('upload')}
              className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sourceMode === 'upload'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>رفع من جهازك / الاستوديو (Gallery & Files)</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceMode('url')}
              className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sourceMode === 'url'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>رابط من الإنترنت (YouTube / رابط مباشر)</span>
            </button>
          </div>

          {/* 3. Source Input */}
          {sourceMode === 'upload' ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                اختر {type === 'image' ? 'الصورة' : 'ملف الفيديو'} من هاتفك أو جهازك:
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept={type === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-slate-950/60 hover:bg-slate-900/60 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  {isProcessingFile ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>

                <div className="text-xs">
                  <span className="font-bold text-cyan-300">
                    {fileName ? `الملف المحدد: ${fileName}` : `انقر لاختيار ${type === 'image' ? 'صورة من الاستوديو' : 'فيديو من الهاتف أو الكمبيوتر'}`}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {type === 'image'
                      ? 'يتم ضغط الصورة تلقائياً لتسريع تحميلها للعملاء على الموبايل'
                      : 'يدعم الفيديوهات حتى 25 ميجابايت (وللفيديوهات الكبيرة يفضل رابط يوتيوب)'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                رابط {type === 'image' ? 'الصورة المباشر (Image URL)' : 'الفيديو (YouTube أو رابط MP4 مباشر)'} *
              </label>
              <input
                type="url"
                required={sourceMode === 'url'}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={
                  type === 'image'
                    ? 'https://example.com/carpet-cleaning-banner.jpg'
                    : 'https://www.youtube.com/watch?v=... أو رابط mp4'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {fileError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Live Preview If URL/File is available */}
          {url && (
            <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-2">
              <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>معاينة الإعلان قبل الحفظ:</span>
              </span>

              <div className="relative aspect-video max-h-52 w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                {type === 'image' ? (
                  <img
                    src={url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (() => {
                  const vInfo = formatVideoEmbedInfo(url);
                  return vInfo.isIframe ? (
                    <iframe
                      src={vInfo.embedUrl}
                      title="Preview"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={vInfo.embedUrl}
                      controls
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  );
                })()}
              </div>
            </div>
          )}

          {/* Details & Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                عنوان الإعلان (اختياري)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: خصم 20% على غسيل سجاد الصالون الفاخر"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                رابط فتح عند النقر (اختياري)
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="رابط صفحة أو واتساب عند النقر..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              وصف فرعي توضيحي (اختياري)
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="شرح موجز يظهر أسفل عنوان الإعلان..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
            />
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
              disabled={isSaving || isProcessingFile}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all cursor-pointer shadow-md disabled:bg-slate-800 flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الحفظ والمزامنة...</span>
                </>
              ) : (
                <span>حفظ ونشر في الواجهة فوراً</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Media Items Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold text-slate-300">
            قائمة الإعلانات المنشورة ({mediaItems.length})
          </span>
          <span>
            {mediaItems.filter((i) => i.active !== false).length} مفعل حالياً للزوار
          </span>
        </div>

        {mediaItems.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 space-y-2">
            <ImageIcon className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">لا توجد صور أو فيديوهات إعلانية مضافة حالياً.</p>
            <p className="text-[11px] text-slate-500">
              واجهة العملاء حالياً مخفية تماماً بدون أي فراغ. اضغط زر الإضافة أعلاه لنشر أول إعلان!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border overflow-hidden transition-all flex flex-col justify-between ${
                  item.active !== false
                    ? 'bg-slate-900/90 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 opacity-60'
                }`}
              >
                {/* Media Preview Box */}
                <div className="relative aspect-video w-full bg-black overflow-hidden group">
                  {item.type === 'video' ? (
                    (() => {
                      const vInfo = formatVideoEmbedInfo(item.url);
                      return vInfo.thumbnailUrl ? (
                        <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
                          <img
                            src={vInfo.thumbnailUrl}
                            alt={item.title || 'فيديو'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-md">
                              <Play className="w-5 h-5 ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <video
                          src={vInfo.embedUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                      );
                    })()
                  ) : (
                    <img
                      src={item.url}
                      alt={item.title || 'إعلان'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {/* Type Badge */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur-md text-white border border-white/10 flex items-center gap-1">
                    {item.type === 'video' ? (
                      <>
                        <VideoIcon className="w-3 h-3 text-purple-400" />
                        <span>فيديو</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3 text-cyan-400" />
                        <span>صورة</span>
                      </>
                    )}
                  </div>

                  {/* Active / Inactive Status Badge */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        item.active !== false
                          ? 'bg-emerald-500/90 text-slate-950'
                          : 'bg-slate-800/90 text-slate-300'
                      }`}
                    >
                      {item.active !== false ? 'معروض للزوار' : 'معطل'}
                    </span>
                  </div>
                </div>

                {/* Content info */}
                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-white text-sm line-clamp-1">
                      {item.title || (item.type === 'video' ? 'فيديو ترويجي' : 'بانر إعلاني')}
                    </h4>
                    {item.subtitle && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                    {item.linkUrl && (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 mt-1 truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.linkUrl}</span>
                      </a>
                    )}
                  </div>

                  {/* Card Controls */}
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 mt-2">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                        item.active !== false
                          ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.active !== false ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-400" />
                          <span>مفعل</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-slate-400" />
                          <span>معطل</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="حذف هذا الإعلان"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
