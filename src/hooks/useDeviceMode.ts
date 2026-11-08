import { useState, useEffect } from 'react';

export type DeviceMode = 'auto' | 'mobile' | 'desktop';

function detectIsMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. User Agent inspection for real mobile browsers (iOS, Android, etc.)
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);

  // 2. Screen width viewport check (< 768px is mobile)
  const isMobileWidth = window.innerWidth < 768;

  // 3. Touch points check combined with small viewport
  const isTouchDevice = (navigator.maxTouchPoints > 0 || 'ontouchstart' in window) && window.innerWidth < 1024;

  return isMobileUA || isMobileWidth || isTouchDevice;
}

export function useDeviceMode() {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('cleanpro_device_override');
      if (saved === 'mobile' || saved === 'desktop') {
        return saved;
      }
    }
    return 'auto';
  });

  const [isDetectedMobile, setIsDetectedMobile] = useState<boolean>(() => {
    return detectIsMobileDevice();
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDetectedMobile(detectIsMobileDevice());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isMobile =
    deviceMode === 'mobile'
      ? true
      : deviceMode === 'desktop'
      ? false
      : isDetectedMobile;

  const toggleDeviceMode = (forcedMode?: 'mobile' | 'desktop' | 'auto') => {
    let next: DeviceMode;
    if (forcedMode) {
      next = forcedMode;
    } else {
      next = isMobile ? 'desktop' : 'mobile';
    }

    setDeviceMode(next);
    if (typeof window !== 'undefined') {
      if (next === 'auto') {
        sessionStorage.removeItem('cleanpro_device_override');
      } else {
        sessionStorage.setItem('cleanpro_device_override', next);
      }
    }
  };

  return {
    isMobile,
    deviceMode,
    toggleDeviceMode,
  };
}
