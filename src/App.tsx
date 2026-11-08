import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ServiceCalculator } from './components/ServiceCalculator';
import { CustomerBookingForm } from './components/BookingForm';
import { OrderTracker } from './components/OrderTracker';
import { QualityFeatures } from './components/QualityFeatures';
import { Footer } from './components/Footer';
import { BookingReceiptModal } from './components/BookingReceiptModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminLoginPage } from './components/AdminLoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { SideDrawer } from './components/SideDrawer';
import { PromoMediaSlider } from './components/PromoMediaSlider';
import { MediaGallerySection } from './components/MediaGallerySection';
import { CarWashBookingSection } from './components/CarWashBookingSection';
import { StoreLockedScreen } from './components/StoreLockedScreen';
import { MobileCustomerView } from './components/mobile/MobileCustomerView';
import { MobileAdminDashboard } from './components/mobile/MobileAdminDashboard';
import { useDeviceMode } from './hooks/useDeviceMode';
import { Booking, DynamicService, AppSettings, SiteFeature, PromoMediaItem } from './types';
import { DEFAULT_SETTINGS, DEFAULT_SERVICES, DEFAULT_FEATURES } from './constants';
import {
  fetchAppSettings,
  subscribeToAppSettings,
  subscribeToServices,
  seedDefaultServicesIfEmpty,
  subscribeToFeatures,
  seedDefaultFeaturesIfEmpty,
  subscribeToPromoMedia,
} from './services/bookingService';
import { testFirestoreConnection } from './firebase';
import { Sparkles } from 'lucide-react';

export default function App() {
  // Mobile vs Desktop intelligent viewport & mode detection
  const { isMobile, toggleDeviceMode } = useDeviceMode();

  // Global Settings from Firestore
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Dynamic Services loaded in real time from Firestore
  const [services, setServices] = useState<DynamicService[]>(DEFAULT_SERVICES);

  // Dynamic Site Features loaded in real time from Firestore
  const [features, setFeatures] = useState<SiteFeature[]>(DEFAULT_FEATURES);

  // Promotional Media Items (Images & Videos) loaded in real time from Firestore
  const [mediaItems, setMediaItems] = useState<PromoMediaItem[]>([]);

  // Active navigation section
  const [activeSection, setActiveSection] = useState<'home' | 'calculator' | 'booking-form' | 'cars' | 'tracker' | 'features' | 'media'>('home');

  // Calculator selected items state: serviceId -> count
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  // Check URL on initial boot for direct /admin route or #admin
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.location.pathname.startsWith('/admin') ||
        window.location.hash.includes('admin')
      );
    }
    return false;
  });

  // Admin authentication state (Strict session locking on reload)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);

  // Booking receipt modal
  const [submittedBooking, setSubmittedBooking] = useState<Booking | null>(null);

  // Order tracking search term
  const [trackerSearchTerm, setTrackerSearchTerm] = useState('');

  // Initial boot: test Firestore, seed defaults, and live subscriptions
  useEffect(() => {
    testFirestoreConnection();
    seedDefaultServicesIfEmpty();
    seedDefaultFeaturesIfEmpty();

    // Strict session locking: always start logged out on refresh
    localStorage.removeItem('cleanpro_admin_auth');
    localStorage.removeItem('cleanpro_admin_logged');
    setIsAdminLoggedIn(false);

    // Initial load of cloud settings from Firestore
    fetchAppSettings().then((cloudSettings) => {
      setSettings(cloudSettings);
    });

    // Live subscription to global settings (Branding, Phone, Fees, Announcements)
    const unsubscribeSettings = subscribeToAppSettings((liveSettings) => {
      setSettings(liveSettings);
    });

    // Real-time subscription to dynamic services
    const unsubscribeServices = subscribeToServices((liveServices) => {
      if (liveServices.length > 0) {
        setServices(liveServices);
      }
    });

    // Real-time subscription to dynamic site features
    const unsubscribeFeatures = subscribeToFeatures((liveFeatures) => {
      if (liveFeatures.length > 0) {
        setFeatures(liveFeatures);
      }
    });

    // Real-time subscription to promo media (Images & Videos)
    const unsubscribeMedia = subscribeToPromoMedia((items) => {
      setMediaItems(items);
    });

    // Listen to browser Back/Forward buttons (popstate)
    const handlePopState = () => {
      const isAdm =
        window.location.pathname.startsWith('/admin') ||
        window.location.hash.includes('admin');
      setIsAdminView(isAdm);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      unsubscribeSettings();
      unsubscribeServices();
      unsubscribeFeatures();
      unsubscribeMedia();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Update item count in calculator
  const handleUpdateItemCount = (serviceId: string, delta: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [serviceId]: Math.max(0, (prev[serviceId] || 0) + delta),
    }));
  };

  const handleResetCalculator = () => {
    setSelectedItems({});
  };

  // Switch to dedicated /admin route
  const handleOpenAdminRoute = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/admin');
    }
    setIsAdminView(true);
  };

  // Return to customer front-end (/)
  const handleBackToStore = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/');
    }
    setIsAdminView(false);
  };

  // Navigation handlers
  const handleNavigate = (section: string) => {
    if (isAdminView) {
      handleBackToStore();
    }

    if (section === 'calculator') {
      setActiveSection('calculator');
      const el = document.getElementById('calculator');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'cars') {
      setActiveSection('cars');
      const el = document.getElementById('car-services');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'tracker') {
      setActiveSection('tracker');
      const el = document.getElementById('tracker');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'features') {
      setActiveSection('features');
      const el = document.getElementById('features');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'media') {
      setActiveSection('media');
      const el = document.getElementById('media-gallery');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setActiveSection('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStartBooking = () => {
    setActiveSection('calculator');
    const el = document.getElementById('calculator');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTrackOrderFromHero = () => {
    setActiveSection('tracker');
    const el = document.getElementById('tracker');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleProceedToForm = () => {
    setActiveSection('booking-form');
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleBackToCalculator = () => {
    setActiveSection('calculator');
    const el = document.getElementById('calculator');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBookingSuccess = (booking: Booking) => {
    setSubmittedBooking(booking);
    setSelectedItems({});
    setActiveSection('home');
  };

  const handleTrackThisOrder = (orderId: string) => {
    setTrackerSearchTerm(orderId);
    setActiveSection('tracker');
    setTimeout(() => {
      const el = document.getElementById('tracker');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setIsAdminView(true);
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
      window.history.pushState(null, '', '/admin');
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('cleanpro_admin_auth');
    localStorage.removeItem('cleanpro_admin_logged');
    setIsAdminLoggedIn(false);
  };

  // DEDICATED BACKEND ADMIN SCREEN (/admin)
  if (isAdminView) {
    if (isAdminLoggedIn) {
      if (isMobile) {
        return (
          <MobileAdminDashboard
            services={services}
            features={features}
            mediaItems={mediaItems}
            settings={settings}
            onUpdateSettings={setSettings}
            onLogout={handleAdminLogout}
            onBackToStore={handleBackToStore}
            onSwitchToDesktop={() => toggleDeviceMode('desktop')}
          />
        );
      }

      return (
        <AdminDashboard
          services={services}
          features={features}
          mediaItems={mediaItems}
          settings={settings}
          onUpdateSettings={setSettings}
          onLogout={handleAdminLogout}
          onBackToStore={handleBackToStore}
          onSwitchToMobile={() => toggleDeviceMode('mobile')}
        />
      );
    }

    // Direct /admin unauthenticated access -> Render dedicated Admin Login Screen
    return (
      <AdminLoginPage
        settings={settings}
        onLoginSuccess={handleAdminLoginSuccess}
        onBackToStore={handleBackToStore}
      />
    );
  }

  // STORE SUSPENSION / LOCK CHECK (IF ACTIVATED BY OWNER VIA 1177 PASSCODE)
  if (settings.isStoreLocked) {
    return (
      <StoreLockedScreen
        settings={settings}
        onOpenAdmin={handleOpenAdminRoute}
      />
    );
  }

  // DEDICATED MOBILE CUSTOMER EXPERIENCE FOR SMARTPHONES
  if (isMobile) {
    return (
      <>
        <MobileCustomerView
          settings={settings}
          services={services}
          features={features}
          mediaItems={mediaItems}
          onOpenAdmin={handleOpenAdminRoute}
          onSwitchToDesktop={() => toggleDeviceMode('desktop')}
          onBookingSuccess={handleBookingSuccess}
        />

        {/* Booking Confirmation & Receipt Modal */}
        {submittedBooking && (
          <BookingReceiptModal
            booking={submittedBooking}
            services={services}
            settings={settings}
            onClose={() => setSubmittedBooking(null)}
            onTrackThisOrder={handleTrackThisOrder}
          />
        )}
      </>
    );
  }

  // PUBLIC CUSTOMER FRONT-END FOR DESKTOP (PRESERVED AS IS)
  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 font-['Cairo',sans-serif] selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Dynamic Top Announcement Alert Banner */}
      {settings.announcementActive && settings.announcementText && (
        <div className="bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600 text-white text-xs font-bold py-2.5 px-4 text-center border-b border-cyan-400/30 flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top-2 duration-300">
          <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse shrink-0" />
          <span>{settings.announcementText}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        settings={settings}
        activeSection={activeSection}
        hasMedia={mediaItems.filter((i) => i.active !== false).length > 0}
        onNavigate={handleNavigate}
        onOpenAdminModal={handleOpenAdminRoute}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminDashboard={handleOpenAdminRoute}
        onOpenMenu={() => setIsSideDrawerOpen(true)}
      />

      {/* Promotional Media Ads Slider (Photos & Videos) - Completely hidden if no media added */}
      <PromoMediaSlider items={mediaItems} />

      {/* Hero Section */}
      <Hero
        settings={settings}
        onStartBooking={handleStartBooking}
        onStartCarBooking={() => handleNavigate('cars')}
        onTrackOrder={handleTrackOrderFromHero}
      />

      {/* Main Flow: Interactive Calculator OR Customer Details Form */}
      <main>
        {activeSection === 'booking-form' ? (
          <CustomerBookingForm
            services={services}
            items={selectedItems}
            settings={settings}
            onBackToCalculator={handleBackToCalculator}
            onBookingSuccess={handleBookingSuccess}
          />
        ) : (
          <ServiceCalculator
            services={services}
            items={selectedItems}
            onUpdateCount={handleUpdateItemCount}
            onReset={handleResetCalculator}
            onProceedToForm={handleProceedToForm}
          />
        )}

        {/* Car Wash & Detailing Interactive Section */}
        <CarWashBookingSection
          services={services}
          settings={settings}
          onBookingSuccess={handleBookingSuccess}
          onSwitchToCarpets={handleStartBooking}
        />

        {/* Live Order Tracker Section with Sequential Numeric Lookup (#1, #2, #14) */}
        <OrderTracker
          initialSearchTerm={trackerSearchTerm}
          settings={settings}
        />

        {/* Dynamic Media Showcase (Photos & Videos) - Only shown if media items exist */}
        <MediaGallerySection
          items={mediaItems}
          brandName={settings.brandName}
        />

        {/* Dynamic Quality Standards & Cleaning Protocol (Loaded from Backend CMS) */}
        <QualityFeatures
          features={features}
          brandName={settings.brandName}
        />
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenAdminModal={handleOpenAdminRoute}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminDashboard={handleOpenAdminRoute}
        onSwitchToMobile={() => toggleDeviceMode('mobile')}
      />

      {/* Booking Confirmation & Receipt Modal */}
      {submittedBooking && (
        <BookingReceiptModal
          booking={submittedBooking}
          services={services}
          settings={settings}
          onClose={() => setSubmittedBooking(null)}
          onTrackThisOrder={handleTrackThisOrder}
        />
      )}

      {/* Side Navigation Menu (Hamburger ☰) */}
      <SideDrawer
        isOpen={isSideDrawerOpen}
        onClose={() => setIsSideDrawerOpen(false)}
        hasMedia={mediaItems.filter((i) => i.active !== false).length > 0}
        onNavigate={handleNavigate}
        onOpenAdminModal={handleOpenAdminRoute}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminDashboard={handleOpenAdminRoute}
        settings={settings}
      />

      {/* Owner Admin Passcode Modal (Fallback) */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        settings={settings}
      />

    </div>
  );
}
