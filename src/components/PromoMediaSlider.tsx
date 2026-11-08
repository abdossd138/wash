import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Play, Image as ImageIcon, Video as VideoIcon, ExternalLink, Sparkles } from 'lucide-react';
import { PromoMediaItem } from '../types';

import { formatVideoEmbedInfo } from '../utils/mediaUpload';

interface PromoMediaSliderProps {
  items: PromoMediaItem[];
}

export const PromoMediaSlider: React.FC<PromoMediaSliderProps> = ({ items = [] }) => {
  const activeItems = items.filter((item) => item.active !== false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance slider if more than 1 item and not interacting
  useEffect(() => {
    if (activeItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeItems.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeItems.length]);

  // CRITICAL REQUIREMENT: "لو ضيفنا صور وفيديوهات تظهر لنا على الصفحة، لو ما ضيفناش ما تظهرش"
  if (activeItems.length === 0) {
    return null;
  }

  const currentItem = activeItems[currentIndex] || activeItems[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeItems.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length);
  };

  const videoInfo = currentItem.type === 'video' ? formatVideoEmbedInfo(currentItem.url) : null;

  return (
    <section className="py-6 px-4 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.15)] bg-slate-950">
        
        {/* Top Mini Header / Tag */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-950/80 backdrop-blur-md text-cyan-300 border border-cyan-500/40 shadow-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>عروض وتجارب الغسيل الحية</span>
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-800">
            {currentIndex + 1} / {activeItems.length}
          </span>
        </div>

        {/* Media Content Display */}
        <div className="relative w-full aspect-[16/8] sm:aspect-[21/9] min-h-[260px] sm:min-h-[380px] max-h-[500px] flex items-center justify-center bg-black/60">
          
          {currentItem.type === 'video' && videoInfo ? (
            videoInfo.isIframe ? (
              <iframe
                src={videoInfo.embedUrl}
                title={currentItem.title || 'فيديو إعلاني للمغسلة'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <video
                src={videoInfo.embedUrl}
                controls
                playsInline
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <img
              src={currentItem.url}
              alt={currentItem.title || 'إعلان المغسلة'}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
          )}

          {/* Bottom Gradient Overlay for Captions */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pointer-events-none">
            <div className="space-y-1.5 max-w-2xl">
              {currentItem.type === 'video' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  <VideoIcon className="w-3 h-3" />
                  <span>فيديو توضيحي</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <ImageIcon className="w-3 h-3" />
                  <span>بانر إعلاني</span>
                </span>
              )}

              {currentItem.title && (
                <h3 className="text-lg sm:text-2xl font-black text-white font-['Alexandria',sans-serif] drop-shadow-md">
                  {currentItem.title}
                </h3>
              )}
              {currentItem.subtitle && (
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 drop-shadow">
                  {currentItem.subtitle}
                </p>
              )}
            </div>

            {currentItem.linkUrl && (
              <a
                href={currentItem.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all pointer-events-auto shadow-lg self-start sm:self-auto cursor-pointer"
              >
                <span>المزيد من التفاصيل</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Navigation Arrows (if more than 1 item) */}
        {activeItems.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-950/80 hover:bg-cyan-500 hover:text-slate-950 text-white border border-slate-700/80 flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-lg"
              title="السابق"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-950/80 hover:bg-cyan-500 hover:text-slate-950 text-white border border-slate-700/80 flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-lg"
              title="التالي"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-full border border-slate-800 backdrop-blur-md">
              {activeItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-600 hover:bg-slate-400'
                  }`}
                  title={`الشريحة ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}

      </div>
    </section>
  );
};
