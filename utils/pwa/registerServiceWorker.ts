/**
 * Service Worker Registration Utility
 * Registers the service worker for PWA functionality
 */

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[PWA] Service Worker registered successfully:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('[PWA] New service worker available. Please reload to update.');
              // You could show a toast/notification here to prompt user to reload
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      return null;
    }
  } else {
    console.warn('[PWA] Service Workers are not supported in this browser');
    return null;
  }
};

/**
 * Unregister all service workers (useful for debugging)
 */
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const unregisterPromises = registrations.map((registration) => registration.unregister());
      await Promise.all(unregisterPromises);
      console.log('[PWA] All service workers unregistered');
      return true;
    } catch (error) {
      console.error('[PWA] Service Worker unregistration failed:', error);
      return false;
    }
  }
  return false;
};

/**
 * Check if app is running as PWA (installed)
 */
export const isPWA = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

/**
 * Prompt user to install PWA
 */
export const promptPWAInstall = (() => {
  let deferredPrompt: any = null;

  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] Install prompt available');
  });

  return async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('[PWA] Install prompt not available');
      return false;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);

    // Clear the deferred prompt
    deferredPrompt = null;

    return outcome === 'accepted';
  };
})();
