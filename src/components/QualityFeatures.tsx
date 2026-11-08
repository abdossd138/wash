import React from 'react';
import {
  Sparkles,
  Shield,
  Flame,
  Droplets,
  Wind,
  HeartHandshake,
  Zap,
  Clock,
  CheckCircle2,
  Award,
  Layers,
  Truck,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import { SiteFeature } from '../types';

interface QualityFeaturesProps {
  features?: SiteFeature[];
  brandName?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Droplets,
  Wind,
  Flame,
  Shield,
  Sparkles,
  Zap,
  Clock,
  HeartHandshake,
  CheckCircle2,
  Award,
  Layers,
  Truck,
  Sun,
};

const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string; hover: string }> = {
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    hover: 'group-hover:text-cyan-300',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    hover: 'group-hover:text-purple-300',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    hover: 'group-hover:text-rose-300',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    hover: 'group-hover:text-emerald-300',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    hover: 'group-hover:text-amber-300',
  },
};

export const QualityFeatures: React.FC<QualityFeaturesProps> = ({
  features = [],
  brandName = 'CleanPro Express',
}) => {
  // Filter active features only
  const activeFeatures = features.filter((f) => f.active !== false);

  return (
    <section id="features" className="py-16 sm:py-20 relative border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>لماذا {brandName}؟</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white font-['Alexandria',sans-serif]">
            دورة غسيل متطورة تتجاوز الطرق التقليدية
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            نحن لا نقوم بمجرد تنظيف سطحي، بل نطبق بروتوكول غسيل وتعقيم علمي يضمن حماية أنسجة السجاد وإعادتها كأنها جديدة تماماً.
          </p>
        </div>

        {/* Feature Cards Grid (Dynamically populated from Backend) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeFeatures.map((feat) => {
            const IconComponent = ICON_MAP[feat.icon || 'Sparkles'] || Sparkles;
            const colorMeta = COLOR_CLASSES[feat.color || 'cyan'] || COLOR_CLASSES.cyan;

            return (
              <div
                key={feat.id}
                className="glass-panel p-6 rounded-2xl border-slate-800 hover:border-cyan-500/40 transition-all duration-300 group space-y-4"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${colorMeta.bg} border ${colorMeta.border} flex items-center justify-center group-hover:scale-105 transition-transform`}
                >
                  <IconComponent className={`w-7 h-7 ${colorMeta.text}`} />
                </div>
                <h3 className={`text-lg font-bold text-white ${colorMeta.hover} transition-colors`}>
                  {feat.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
