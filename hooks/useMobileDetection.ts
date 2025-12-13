import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  orientation: 'portrait' | 'landscape';
  platform: string;
}

/**
 * Hook to detect mobile devices and screen characteristics
 */
export const useMobileDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => getDeviceInfo());

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };

    const handleOrientationChange = () => {
      setDeviceInfo(getDeviceInfo());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return deviceInfo;
};

/**
 * Get device information
 */
const getDeviceInfo = (): DeviceInfo => {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      screenSize: 'lg',
      orientation: 'landscape',
      platform: 'unknown',
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const userAgent = navigator.userAgent.toLowerCase();

  // Touch device detection
  const isTouchDevice =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0;

  // Platform detection
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isMobileUA = /mobile/.test(userAgent);
  const isTabletUA = /tablet|ipad/.test(userAgent);

  // Screen size detection (Tailwind breakpoints)
  let screenSize: DeviceInfo['screenSize'] = 'xs';
  if (width >= 1536) screenSize = '2xl';
  else if (width >= 1280) screenSize = 'xl';
  else if (width >= 1024) screenSize = 'lg';
  else if (width >= 768) screenSize = 'md';
  else if (width >= 640) screenSize = 'sm';

  // Device type detection
  const isMobile = (width < 768 && isMobileUA) || (width < 768 && isTouchDevice);
  const isTablet = ((width >= 768 && width < 1024) || isTabletUA) && isTouchDevice;
  const isDesktop = !isMobile && !isTablet;

  // Orientation
  const orientation: 'portrait' | 'landscape' = height > width ? 'portrait' : 'landscape';

  // Platform
  let platform = 'unknown';
  if (isIOS) platform = 'ios';
  else if (isAndroid) platform = 'android';
  else if (/windows/.test(userAgent)) platform = 'windows';
  else if (/mac/.test(userAgent)) platform = 'mac';
  else if (/linux/.test(userAgent)) platform = 'linux';

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    screenSize,
    orientation,
    platform,
  };
};

/**
 * Check if running on iOS
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
};

/**
 * Check if running on Android
 */
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /android/.test(navigator.userAgent.toLowerCase());
};

/**
 * Check if running as PWA
 */
export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};
