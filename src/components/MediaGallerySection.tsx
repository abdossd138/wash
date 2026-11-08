import React, { useState, useMemo } from 'react';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  ExternalLink,
  X,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { PromoMediaItem } from '../types';
import { formatVideoEmbedInfo } from '../utils/mediaUpload';

interface MediaGallerySectionProps {
  items: PromoMediaItem[];
  brandName?: string;
}

export const MediaGallerySection: React.FC<MediaGallerySectionProps> = ({
  items = [],
  brandName = 'CleanPro Express',
}) => {
  const activeItems = useMemo(() => items.filter((i) => i.active !== false), [items]);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [selectedMedia, setSelectedMedia] = useState<PromoMediaItem | null>(null);

  if (activeItems.length === 0) {
    return null; // Zero space if no media items exist
  }

  const imagesCount = activeItems.filter((i) => i.type === 'image').length;
  const videosCount = activeItems.filter((i) => i.type === 'video').length;

  const filtered = activeItems.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  return (
    <section id="media-gallery" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24 space-y-8 animate-in fade-in duration-300">
      
      {/* Section Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>صور وفيديوهات عن المكان والخدمة</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white font-['Alexandria',sans-serif]">
          إعلانات وصور حصرية من داخل {brandName}
        </h2>

        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
          شاهد بأم عينك خطوط الغسيل الآلية، التعقيم بالبخار والأوزون، وتجارب ونتائج عملائنا قبل وبعد التنظيف.
        </p>

        {/* Filter Tabs */}
        {(imagesCount > 0 && videosCount > 0) && (
          <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل ({activeItems.length})
            </button>

            <button
              onClick={() => setFilterType('image')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === 'image'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>صور ({imagesCount})</span>
            </button>

            <button
              onClick={() => setFilterType('video')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === 'video'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <VideoIcon className="w-3.5 h-3.5" />
              <span>فيديوهات ({videosCount})</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid of Media Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="group rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]"
          >
            {/* Visual Media Box */}
            <div
              onClick={() => setSelectedMedia(item)}
              className="relative aspect-video w-full bg-black cursor-pointer overflow-hidden"
            >
              {item.type === 'video' ? (
                (() => {
                  const vInfo = formatVideoEmbedInfo(item.url);
                  return (
                    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
                      {vInfo.thumbnailUrl ? (
                        <img
                          src={vInfo.thumbnailUrl}
                          alt={item.title || 'فيديو'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <video
                          src={vInfo.embedUrl}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={item.url}
                    alt={item.title || 'صورة من المغسلة'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-[11px] text-cyan-300 font-bold flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>تكبير الصورة</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Type Badge */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-bold text-white border border-white/10 flex items-center gap-1.5">
                {item.type === 'video' ? (
                  <>
                    <VideoIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>فيديو</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>صورة</span>
                  </>
                )}
              </div>
            </div>

            {/* Description Info */}
            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-cyan-300 transition-colors">
                  {item.title || (item.type === 'video' ? 'فيديو توضيحي' : 'صورة من المغسلة')}
                </h3>
                {item.subtitle && (
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {item.subtitle}
                  </p>
                )}
              </div>

              {item.linkUrl && (
                <a
                  href={item.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold pt-2 border-t border-slate-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>انقر للمزيد من التفاصيل / العرض</span>
                </a>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Full-screen Lightbox & Video Player Modal */}
      {selectedMedia && (
        <div
          onClick={() => setSelectedMedia(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-slate-950 border border-cyan-500/40 rounded-2xl overflow-hidden shadow-2xl p-2 sm:p-4 text-slate-100"
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 left-4 z-20 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Media Player / Image Display */}
            <div className="relative aspect-video max-h-[75vh] w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
              {selectedMedia.type === 'video' ? (
                (() => {
                  const vInfo = formatVideoEmbedInfo(selectedMedia.url);
                  return vInfo.isIframe ? (
                    <iframe
                      src={vInfo.embedUrl}
                      title="Video Player"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={vInfo.embedUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  );
                })()
              ) : (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.title || 'صورة مكبرة'}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Title & Description Below Modal */}
            <div className="p-4 space-y-1">
              <h3 className="text-base font-bold text-white">
                {selectedMedia.title || (selectedMedia.type === 'video' ? 'فيديو' : 'صورة')}
              </h3>
              {selectedMedia.subtitle && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedMedia.subtitle}
                </p>
              )}
              {selectedMedia.linkUrl && (
                <a
                  href={selectedMedia.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline pt-2 font-bold"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح الرابط المرفق</span>
                </a>
              )}
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
