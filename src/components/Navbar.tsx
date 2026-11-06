import React from 'react';
import { Sparkles, Phone, ShieldCheck, Lock, Search, Calculator, Menu } from 'lucide-react';
import { AppSettings } from '../types';

interface NavbarProps {
  settings: AppSettings;
  activeSection: string;
  onNavigate: (section: string) => void;
  onOpenAdminModal: () => void;
  isAdminLoggedIn: boolean;
  onOpenAdminDashboard: () => void;
  onOpenMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  activeSection,
  onNavigate,
  onOpenAdminModal,
  isAdminLoggedIn,
  onOpenAdminDashboard,
  onOpenMenu,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-cyan-500/20 bg-[#0A0F1D]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Tagline */}
        <div 
          onClick={() => onNavigate('home')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/30 border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.25)] group-hover:border-cyan-300 transition-all duration-300">
            <Sparkles className="w-6 h-6 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
            <div className="absolute -inset-0.5 rounded-xl bg-cyan-400/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-['Alexandria',sans-serif]">
                {settings.brandName || 'CleanPro Express'}
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase tracking-widest">
                Lux Laundry
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {settings.brandTagline || 'مغسلة السجاد والمفروشات الفاخرة بالبخار والأوزون'}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => onNavigate('calculator')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'calculator'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Calculator className="w-4 h-4" />
            حاسبة الأسعار والطلب
          </button>

          <button
            onClick={() => onNavigate('tracker')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'tracker'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-4 h-4" />
            تتبع طلبك (#)
          </button>

          <button
            onClick={() => onNavigate('features')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'features'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            معايير الجودة
          </button>
        </nav>

        {/* Actions (WhatsApp Contact & Owner Admin Access) */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Direct WhatsApp Callout */}
          <a
            href={`https://wa.me/${settings.businessPhone.replace(/\D/g, '')}?text=${encodeURIComponent('مرحباً CleanPro Express، أود الاستفسار عن خدمات غسيل السجاد والمفروشات')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">خدمة العملاء</span>
            <span className="sm:hidden">واتساب</span>
          </a>

          {/* Secure Admin Portal Trigger */}
          {isAdminLoggedIn ? (
            <button
              onClick={onOpenAdminDashboard}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-400/50 hover:bg-cyan-900/50 transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>لوحة الإدارة</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdminModal}
              title="دخول الإدارة"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-900/80 border border-slate-700/60 hover:text-slate-200 hover:border-slate-500 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">إدارة المغسلة</span>
            </button>
          )}

          {/* Side Drawer Menu Button (Hamburger ☰) */}
          <button
            onClick={onOpenMenu}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/90 border border-slate-700/80 hover:border-cyan-400/50 hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="القائمة الجانبية (☰)"
          >
            <Menu className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-bold hidden sm:inline">القائمة</span>
          </button>

        </div>

      </div>
    </header>
  );
};
