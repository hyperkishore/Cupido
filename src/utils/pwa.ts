/**
 * Progressive Web App (PWA) Utilities
 * Handles PWA installation, updates, and offline capabilities
 */

import { environment, debugLog } from '../config/environment';

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAManager {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private isInstalled = false;
  private serviceWorker: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initializePWA();
  }

  private initializePWA() {
    if (typeof window === 'undefined') return;

    // Listen for PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      debugLog('PWA install prompt available');
      e.preventDefault();
      this.deferredPrompt = e as any;
      this.notifyInstallAvailable();
    });

    // Listen for PWA installation
    window.addEventListener('appinstalled', () => {
      debugLog('PWA was installed');
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.notifyInstalled();
    });

    // Check if already installed
    this.checkInstallStatus();

    // Register service worker
    if ('serviceWorker' in navigator && environment.app.environment === 'production') {
      this.registerServiceWorker();
    }
  }

  /**
   * Register service worker for offline functionality
   */
  private async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.serviceWorker = registration;
      
      debugLog('Service Worker registered', registration.scope);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.notifyUpdateAvailable();
            }
          });
        }
      });

    } catch (error) {
      debugLog('Service Worker registration failed:', error);
    }
  }

  /**
   * Check if app is installed
   */
  private checkInstallStatus() {
    // Check various indicators of PWA installation
    this.isInstalled = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    debugLog('PWA install status:', this.isInstalled);
  }

  /**
   * Trigger PWA installation prompt
   */
  async installPWA(): Promise<boolean> {
    if (!this.deferredPrompt) {
      debugLog('No install prompt available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      debugLog('Install prompt outcome:', outcome);
      
      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        return true;
      }
      
      return false;
    } catch (error) {
      debugLog('Install prompt failed:', error);
      return false;
    }
  }

  /**
   * Check if PWA can be installed
   */
  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  /**
   * Check if PWA is currently installed
   */
  isInstalled(): boolean {
    return this.isInstalled;
  }

  /**
   * Update the service worker
   */
  async updateServiceWorker(): Promise<boolean> {
    if (!this.serviceWorker) return false;

    try {
      await this.serviceWorker.update();
      
      // Skip waiting and activate new service worker
      if (this.serviceWorker.waiting) {
        this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
        return true;
      }
      
      return false;
    } catch (error) {
      debugLog('Service worker update failed:', error);
      return false;
    }
  }

  /**
   * Get PWA installation instructions for different platforms
   */
  getInstallInstructions(): { platform: string; instructions: string[] } {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return {
        platform: 'Chrome',
        instructions: [
          'Look for the install icon in the address bar',
          'Or use the menu → "Install Cupido"',
          'The app will be added to your home screen',
        ],
      };
    }
    
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      return {
        platform: 'Safari',
        instructions: [
          'Tap the Share button at the bottom',
          'Select "Add to Home Screen"',
          'Name the shortcut and tap "Add"',
        ],
      };
    }
    
    if (userAgent.includes('firefox')) {
      return {
        platform: 'Firefox',
        instructions: [
          'Look for the install icon in the address bar',
          'Or use the menu → "Install"',
          'Follow the installation prompts',
        ],
      };
    }
    
    return {
      platform: 'Browser',
      instructions: [
        'Look for an install or "Add to Home Screen" option',
        'This is usually found in your browser menu',
        'Follow your browser\'s installation process',
      ],
    };
  }

  /**
   * Notify that PWA can be installed
   */
  private notifyInstallAvailable() {
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  }

  /**
   * Notify that PWA has been installed
   */
  private notifyInstalled() {
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  }

  /**
   * Notify that PWA update is available
   */
  private notifyUpdateAvailable() {
    window.dispatchEvent(new CustomEvent('pwa-update-available'));
  }

  /**
   * Get offline status
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Listen to online/offline status changes
   */
  onNetworkStatusChange(callback: (isOnline: boolean) => void) {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}

// Global PWA manager instance
export const pwaManager = new PWAManager();

// React hook for PWA functionality
export const usePWA = () => {
  const [canInstall, setCanInstall] = React.useState(pwaManager.canInstall());
  const [isInstalled, setIsInstalled] = React.useState(pwaManager.isInstalled());
  const [updateAvailable, setUpdateAvailable] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(pwaManager.isOnline());

  React.useEffect(() => {
    const handleInstallAvailable = () => setCanInstall(true);
    const handleInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };
    const handleUpdateAvailable = () => setUpdateAvailable(true);

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-installed', handleInstalled);
    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    const unsubscribeNetwork = pwaManager.onNetworkStatusChange(setIsOnline);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-installed', handleInstalled);
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
      unsubscribeNetwork();
    };
  }, []);

  const installPWA = async () => {
    const success = await pwaManager.installPWA();
    if (success) {
      setCanInstall(false);
    }
    return success;
  };

  const updatePWA = async () => {
    const success = await pwaManager.updateServiceWorker();
    if (success) {
      setUpdateAvailable(false);
      // Refresh the page to load new version
      window.location.reload();
    }
    return success;
  };

  return {
    canInstall,
    isInstalled,
    updateAvailable,
    isOnline,
    installPWA,
    updatePWA,
    getInstallInstructions: pwaManager.getInstallInstructions.bind(pwaManager),
  };
};

export default pwaManager;