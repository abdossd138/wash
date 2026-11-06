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
import { AdminDashboard } from './components/AdminDashboard';
import { SideDrawer } from './components/SideDrawer';
import { Booking, DynamicService, AppSettings } from './types';
import { DEFAULT_SETTINGS, DEFAULT_SERVICES } from './constants';
import {
  fetchAppSettings,
  subscribeToAppSettings,
  subscribeToServices,
  seedDefaultServicesIfEmpty,
} from './services/bookingService';
import { testFirestoreConnection } from './firebase';

export default function App() {
  // Global Settings from Firestore
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Dynamic Services loaded in real time from Firestore
  const [services, setServices] = useState<DynamicService[]>(DEFAULT_SERVICES);

  // Active navigation section
  const [activeSection, setActiveSection] = useState<'home' | 'calculator' | 'booking-form' | 'tracker' | 'features'>('home');

  // Calculator selected items state: serviceId -> count
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  // Admin authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);

  // Booking receipt modal
  const [submittedBooking, setSubmittedBooking] = useState<Booking | null>(null);

  // Order tracking search term
  const [trackerSearchTerm, setTrackerSearchTerm] = useState('');

  // Initial boot: test Firestore connection, seed services if empty, and subscribe to services and settings
  useEffect(() => {
    testFirestoreConnection();
    seedDefaultServicesIfEmpty();

    // Strict session locking: always start logged out on refresh
    localStorage.removeItem('cleanpro_admin_auth');
    setIsAdminLoggedIn(false);

    // Initial load of cloud settings from Firestore
    fetchAppSettings().then((cloudSettings) => {
      setSettings(cloudSettings);
    });

    // Live subscription to global settings (Branding, Phone, Fees)
    const unsubscribeSettings = subscribeToAppSettings((liveSettings) => {
      setSettings(liveSettings);
    });

    // Real-time subscription to dynamic services
    const unsubscribeServices = subscribeToServices((liveServices) => {
      if (liveServices.length > 0) {
        setServices(liveServices);
      }
    });

    return () => {
      unsubscribeSettings();
      unsubscribeServices();
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

  // Navigation handlers
  const handleNavigate = (section: string) => {
    if (isAdminView) {
      setIsAdminView(false);
    }

    if (section === 'calculator') {
      setActiveSection('calculator');
      const el = document.getElementById('calculator');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'tracker') {
      setActiveSection('tracker');
      const el = document.getElementById('tracker');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'features') {
      setActiveSection('features');
      const el = document.getElementById('features');
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
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('cleanpro_admin_auth');
    setIsAdminLoggedIn(false);
    setIsAdminView(false);
  };

  // If Admin View is active and authenticated, show full Admin CRM
  if (isAdminView && isAdminLoggedIn) {
    return (
      <AdminDashboard
        services={services}
        settings={settings}
        onUpdateSettings={setSettings}
        onLogout={handleAdminLogout}
        onBackToStore={() => {
          setIsAdminView(false);
          setIsAdminLoggedIn(false);
        }}
      />
    );
  }

  // Public Customer Front-End
  return (
    <div className="min-h-screen bg-[#0A0F1D] text-slate-100 font-['Cairo',sans-serif] selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Navigation Header */}
      <Navbar
        settings={settings}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminDashboard={() => setIsAdminView(true)}
        onOpenMenu={() => setIsSideDrawerOpen(true)}
      />

      {/* Hero Section (No hardcoded discounts) */}
      <Hero
        settings={settings}
        onStartBooking={handleStartBooking}
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

        {/* Live Order Tracker Section with Sequential Numeric Lookup (#1, #2, #14) */}
        <OrderTracker
          initialSearchTerm={trackerSearchTerm}
          settings={settings}
        />

        {/* Quality Standards & Cleaning Protocol */}
        <QualityFeatures />
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminDashboard={() => setIsAdminView(true)}
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
        onNavigate={handleNavigate}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminDashboard={() => setIsAdminView(true)}
        settings={settings}
      />

      {/* Owner Admin Passcode Modal (Passcode: 2255) */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        settings={settings}
      />

    </div>
  );
}
