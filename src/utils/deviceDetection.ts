// Utilidad avanzada para detección de dispositivos y optimización multiplataforma

export interface DeviceInfo {
  os: {
    android: boolean;
    ios: boolean;
    windows: boolean;
    macos: boolean;
    linux: boolean;
    name: string;
    version: string;
  };
  browser: {
    chrome: boolean;
    firefox: boolean;
    safari: boolean;
    edge: boolean;
    opera: boolean;
    brave: boolean;
    name: string;
    version: string;
  };
  device: {
    mobile: boolean;
    tablet: boolean;
    desktop: boolean;
    type: 'mobile' | 'tablet' | 'desktop';
  };
  screen: {
    width: number;
    height: number;
    windowWidth: number;
    windowHeight: number;
    pixelRatio: number;
    isRetina: boolean;
    isLandscape: boolean;
    isPortrait: boolean;
    touchPoints: number;
    hasTouch: boolean;
  };
  capabilities: {
    webgl: boolean;
    webp: boolean;
    avif: boolean;
    serviceWorker: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
    geolocation: boolean;
    camera: boolean;
    microphone: boolean;
    notifications: boolean;
    vibration: boolean;
  };
  network: {
    online: boolean;
    connectionType: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
}

class DeviceDetectionService {
  private static instance: DeviceDetectionService;
  private deviceInfo: DeviceInfo | null = null;
  private listeners: Set<(info: DeviceInfo) => void> = new Set();

  static getInstance(): DeviceDetectionService {
    if (!DeviceDetectionService.instance) {
      DeviceDetectionService.instance = new DeviceDetectionService();
    }
    return DeviceDetectionService.instance;
  }

  constructor() {
    this.detectDevice();
    this.setupEventListeners();
  }

  private detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    // Detectar sistema operativo
    const osDetection = this.detectOS(userAgent, platform, maxTouchPoints);
    
    // Detectar navegador
    const browserDetection = this.detectBrowser(userAgent);
    
    // Detectar tipo de dispositivo
    const deviceDetection = this.detectDeviceType(windowWidth, maxTouchPoints, userAgent);
    
    // Información de pantalla
    const screenInfo = {
      width: screenWidth,
      height: screenHeight,
      windowWidth,
      windowHeight,
      pixelRatio,
      isRetina: pixelRatio > 1,
      isLandscape: screenWidth > screenHeight,
      isPortrait: screenHeight >= screenWidth,
      touchPoints: maxTouchPoints,
      hasTouch: maxTouchPoints > 0
    };

    // Detectar capacidades del dispositivo
    const capabilities = this.detectCapabilities();
    
    // Información de red
    const networkInfo = this.detectNetworkInfo();

    this.deviceInfo = {
      os: osDetection,
      browser: browserDetection,
      device: deviceDetection,
      screen: screenInfo,
      capabilities,
      network: networkInfo
    };

    return this.deviceInfo;
  }

  private detectOS(userAgent: string, platform: string, maxTouchPoints: number) {
    const isAndroid = /android/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent) || (platform === 'macintel' && maxTouchPoints > 1);
    const isWindows = /windows/.test(userAgent) || /win32|win64/.test(platform);
    const isMacOS = /macintosh|mac os x/.test(userAgent) && !isIOS;
    const isLinux = /linux/.test(userAgent) && !isAndroid;

    let osName = 'Unknown';
    let osVersion = '';

    if (isAndroid) {
      osName = 'Android';
      const match = userAgent.match(/android\s([0-9\.]*)/);
      osVersion = match ? match[1] : '';
    } else if (isIOS) {
      osName = 'iOS';
      const match = userAgent.match(/os\s([0-9_]*)/);
      osVersion = match ? match[1].replace(/_/g, '.') : '';
    } else if (isWindows) {
      osName = 'Windows';
      if (userAgent.includes('windows nt 10.0')) osVersion = '10/11';
      else if (userAgent.includes('windows nt 6.3')) osVersion = '8.1';
      else if (userAgent.includes('windows nt 6.2')) osVersion = '8';
      else if (userAgent.includes('windows nt 6.1')) osVersion = '7';
    } else if (isMacOS) {
      osName = 'macOS';
      const match = userAgent.match(/mac os x\s([0-9_]*)/);
      osVersion = match ? match[1].replace(/_/g, '.') : '';
    } else if (isLinux) {
      osName = 'Linux';
    }

    return {
      android: isAndroid,
      ios: isIOS,
      windows: isWindows,
      macos: isMacOS,
      linux: isLinux,
      name: osName,
      version: osVersion
    };
  }

  private detectBrowser(userAgent: string) {
    const isChrome = /chrome/.test(userAgent) && !/edge|edg/.test(userAgent);
    const isFirefox = /firefox/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isEdge = /edge|edg/.test(userAgent);
    const isOpera = /opera|opr/.test(userAgent);
    const isBrave = /brave/.test(userAgent);

    let browserName = 'Unknown';
    let browserVersion = '';

    if (isChrome) {
      browserName = 'Chrome';
      const match = userAgent.match(/chrome\/([0-9\.]*)/);
      browserVersion = match ? match[1] : '';
    } else if (isFirefox) {
      browserName = 'Firefox';
      const match = userAgent.match(/firefox\/([0-9\.]*)/);
      browserVersion = match ? match[1] : '';
    } else if (isSafari) {
      browserName = 'Safari';
      const match = userAgent.match(/version\/([0-9\.]*)/);
      browserVersion = match ? match[1] : '';
    } else if (isEdge) {
      browserName = 'Edge';
      const match = userAgent.match(/edge?\/([0-9\.]*)/);
      browserVersion = match ? match[1] : '';
    } else if (isOpera) {
      browserName = 'Opera';
      const match = userAgent.match(/(?:opera|opr)\/([0-9\.]*)/);
      browserVersion = match ? match[1] : '';
    } else if (isBrave) {
      browserName = 'Brave';
    }

    return {
      chrome: isChrome,
      firefox: isFirefox,
      safari: isSafari,
      edge: isEdge,
      opera: isOpera,
      brave: isBrave,
      name: browserName,
      version: browserVersion
    };
  }

  private detectDeviceType(windowWidth: number, maxTouchPoints: number, userAgent: string) {
    const isMobile = windowWidth <= 768 || (maxTouchPoints > 0 && windowWidth <= 1024);
    const isTablet = (windowWidth > 768 && windowWidth <= 1024) || 
                    (maxTouchPoints > 0 && windowWidth > 768 && windowWidth <= 1366) ||
                    /ipad/.test(userAgent);
    const isDesktop = windowWidth > 1024 && maxTouchPoints === 0;

    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    if (isMobile) deviceType = 'mobile';
    else if (isTablet) deviceType = 'tablet';

    return {
      mobile: isMobile,
      tablet: isTablet,
      desktop: isDesktop,
      type: deviceType
    };
  }

  private detectCapabilities() {
    const canvas = document.createElement('canvas');
    const webglContext = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    return {
      webgl: !!webglContext,
      webp: this.supportsWebP(),
      avif: this.supportsAVIF(),
      serviceWorker: 'serviceWorker' in navigator,
      localStorage: this.supportsLocalStorage(),
      sessionStorage: this.supportsSessionStorage(),
      indexedDB: 'indexedDB' in window,
      geolocation: 'geolocation' in navigator,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      notifications: 'Notification' in window,
      vibration: 'vibrate' in navigator
    };
  }

  private detectNetworkInfo() {
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

    return {
      online: navigator.onLine,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0
    };
  }

  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  private supportsAVIF(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    try {
      return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    } catch {
      return false;
    }
  }

  private supportsLocalStorage(): boolean {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private supportsSessionStorage(): boolean {
    try {
      const test = 'test';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private setupEventListeners() {
    // Escuchar cambios de red
    window.addEventListener('online', () => {
      this.updateNetworkInfo();
    });

    window.addEventListener('offline', () => {
      this.updateNetworkInfo();
    });

    // Escuchar cambios de orientación y tamaño
    window.addEventListener('resize', () => {
      this.updateDeviceInfo();
    });

    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.updateDeviceInfo();
      }, 100);
    });
  }

  private updateNetworkInfo() {
    if (this.deviceInfo) {
      this.deviceInfo.network = this.detectNetworkInfo();
      this.notifyListeners();
    }
  }

  private updateDeviceInfo() {
    this.deviceInfo = this.detectDevice();
    this.notifyListeners();
  }

  private notifyListeners() {
    if (this.deviceInfo) {
      this.listeners.forEach(listener => {
        try {
          listener(this.deviceInfo!);
        } catch (error) {
          console.error('Error in device info listener:', error);
        }
      });
    }
  }

  // Métodos públicos
  getDeviceInfo(): DeviceInfo {
    if (!this.deviceInfo) {
      this.deviceInfo = this.detectDevice();
    }
    return this.deviceInfo;
  }

  subscribe(callback: (info: DeviceInfo) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Optimizaciones específicas por dispositivo
  getOptimizedSettings(): {
    animationDuration: number;
    cacheSize: number;
    imageQuality: 'low' | 'medium' | 'high';
    prefetchEnabled: boolean;
    lazyLoadingThreshold: number;
  } {
    const info = this.getDeviceInfo();
    
    if (info.device.mobile) {
      return {
        animationDuration: 200,
        cacheSize: 50,
        imageQuality: 'medium',
        prefetchEnabled: false,
        lazyLoadingThreshold: 0.1
      };
    } else if (info.device.tablet) {
      return {
        animationDuration: 250,
        cacheSize: 100,
        imageQuality: 'high',
        prefetchEnabled: true,
        lazyLoadingThreshold: 0.2
      };
    } else {
      return {
        animationDuration: 300,
        cacheSize: 200,
        imageQuality: 'high',
        prefetchEnabled: true,
        lazyLoadingThreshold: 0.3
      };
    }
  }

  // Verificar compatibilidad con WhatsApp
  getWhatsAppCompatibility(): {
    hasApp: boolean;
    supportsWeb: boolean;
    recommendedMethod: 'app' | 'web' | 'universal';
    openMethod: 'same-window' | 'new-tab' | 'popup';
  } {
    const info = this.getDeviceInfo();
    
    const hasApp = info.os.android || info.os.ios;
    const supportsWeb = info.browser.chrome || info.browser.firefox || info.browser.safari || info.browser.edge;
    
    let recommendedMethod: 'app' | 'web' | 'universal' = 'universal';
    let openMethod: 'same-window' | 'new-tab' | 'popup' = 'new-tab';
    
    if (info.device.mobile) {
      recommendedMethod = hasApp ? 'app' : 'web';
      openMethod = 'same-window';
    } else if (info.device.tablet) {
      recommendedMethod = hasApp ? 'app' : 'web';
      openMethod = info.os.ios ? 'same-window' : 'new-tab';
    } else {
      recommendedMethod = 'web';
      openMethod = 'new-tab';
    }

    return {
      hasApp,
      supportsWeb,
      recommendedMethod,
      openMethod
    };
  }

  // Obtener configuración de viewport optimizada
  getOptimizedViewport(): string {
    const info = this.getDeviceInfo();
    
    let viewport = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    
    if (info.os.ios) {
      viewport += ', viewport-fit=cover';
    }
    
    if (info.device.mobile) {
      viewport += ', shrink-to-fit=no';
    }
    
    return viewport;
  }

  // Aplicar optimizaciones CSS específicas
  applyCSSOptimizations() {
    const info = this.getDeviceInfo();
    const root = document.documentElement;
    
    // Variables CSS dinámicas basadas en el dispositivo
    if (info.device.mobile) {
      root.style.setProperty('--spacing-unit', '0.5rem');
      root.style.setProperty('--font-size-base', '14px');
      root.style.setProperty('--animation-duration', '200ms');
      root.style.setProperty('--touch-target-size', '48px');
    } else if (info.device.tablet) {
      root.style.setProperty('--spacing-unit', '1rem');
      root.style.setProperty('--font-size-base', '16px');
      root.style.setProperty('--animation-duration', '250ms');
      root.style.setProperty('--touch-target-size', '44px');
    } else {
      root.style.setProperty('--spacing-unit', '1.5rem');
      root.style.setProperty('--font-size-base', '16px');
      root.style.setProperty('--animation-duration', '300ms');
      root.style.setProperty('--touch-target-size', '40px');
    }

    // Optimizaciones específicas por OS
    if (info.os.ios) {
      document.body.style.webkitOverflowScrolling = 'touch';
    }
    
    if (info.os.android) {
      document.body.style.overscrollBehavior = 'contain';
    }
    
    if (info.screen.isRetina) {
      root.style.setProperty('--image-rendering', 'crisp-edges');
    }
  }

  // Destructor
  destroy() {
    this.listeners.clear();
  }
}

export const deviceDetectionService = DeviceDetectionService.getInstance();