import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AdminProvider } from './context/AdminContext';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Movies } from './pages/Movies';
import { TVShows } from './pages/TVShows';
import { Anime } from './pages/Anime';
import { SearchPage } from './pages/Search';
import { MovieDetail } from './pages/MovieDetail';
import { TVDetail } from './pages/TVDetail';
import { Cart } from './pages/Cart';
import { AdminPanel } from './pages/AdminPanel';

function App() {
  // Detectar refresh y optimizar para diferentes dispositivos
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem('pageRefreshed', 'true');
    };

    const handleLoad = () => {
      if (sessionStorage.getItem('pageRefreshed') === 'true') {
        sessionStorage.removeItem('pageRefreshed');
        if (window.location.pathname !== '/') {
          // Redirección optimizada para diferentes dispositivos
          const deviceInfo = (window as any).deviceInfo;
          if (deviceInfo?.device?.mobile || deviceInfo?.device?.tablet) {
            // En móviles y tablets, usar location.href para mejor compatibilidad
            window.location.href = window.location.origin;
          } else {
            // En desktop, usar replace para mejor UX
            window.location.replace(window.location.origin);
          }
          return;
        }
      }
    };

    // Verificar al montar el componente si fue un refresh
    if (sessionStorage.getItem('pageRefreshed') === 'true') {
      sessionStorage.removeItem('pageRefreshed');
      if (window.location.pathname !== '/') {
        const deviceInfo = (window as any).deviceInfo;
        if (deviceInfo?.device?.mobile || deviceInfo?.device?.tablet) {
          window.location.href = window.location.origin;
        } else {
          window.location.replace(window.location.origin);
        }
        return;
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  // Optimizaciones de rendimiento y compatibilidad multiplataforma
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Deshabilitar zoom con teclado en todos los navegadores
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
        e.preventDefault();
        return false;
      }
      
      // Deshabilitar F11 (pantalla completa) en algunos casos
      if (e.key === 'F11') {
        e.preventDefault();
        return false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Deshabilitar zoom con scroll en todos los navegadores
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        return false;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Deshabilitar pinch-to-zoom en dispositivos táctiles
      if (e.touches.length > 1) {
        e.preventDefault();
        return false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Deshabilitar pinch-to-zoom en dispositivos táctiles
      if (e.touches.length > 1) {
        e.preventDefault();
        return false;
      }
    };

    // Prevenir gestos de zoom en Safari iOS
    const handleGestureStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const handleGestureChange = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const handleGestureEnd = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Agregar event listeners con opciones optimizadas
    document.addEventListener('keydown', handleKeyDown, { passive: false });
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    // Event listeners específicos para iOS Safari
    document.addEventListener('gesturestart', handleGestureStart, { passive: false });
    document.addEventListener('gesturechange', handleGestureChange, { passive: false });
    document.addEventListener('gestureend', handleGestureEnd, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('gesturestart', handleGestureStart);
      document.removeEventListener('gesturechange', handleGestureChange);
      document.removeEventListener('gestureend', handleGestureEnd);
    };
  }, []);

  // Optimizaciones específicas para diferentes navegadores
  React.useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Optimizaciones para Safari
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      document.body.style.webkitOverflowScrolling = 'touch';
    }
    
    // Optimizaciones para Firefox
    if (userAgent.includes('firefox')) {
      document.body.style.scrollbarWidth = 'thin';
    }
    
    // Optimizaciones para Chrome/Edge
    if (userAgent.includes('chrome') || userAgent.includes('edge')) {
      document.body.style.overscrollBehavior = 'contain';
    }
    
    // Optimizaciones para dispositivos iOS
    if (/iphone|ipad|ipod/.test(userAgent)) {
      // Prevenir el rebote en iOS
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.overflow = 'hidden';
      
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
      }
    }
    
    // Optimizaciones para Android
    if (userAgent.includes('android')) {
      // Mejorar rendimiento en Android
      document.body.style.transform = 'translateZ(0)';
      document.body.style.backfaceVisibility = 'hidden';
    }
  }, []);

  // Detectar cambios de orientación y redimensionamiento
  React.useEffect(() => {
    const handleOrientationChange = () => {
      // Pequeño delay para que la orientación se complete
      setTimeout(() => {
        // Forzar recálculo de viewport
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
          const content = viewport.getAttribute('content');
          viewport.setAttribute('content', content + ', viewport-fit=cover');
        }
        
        // Notificar a los componentes sobre el cambio
        window.dispatchEvent(new CustomEvent('orientation_changed', {
          detail: {
            orientation: window.orientation,
            width: window.innerWidth,
            height: window.innerHeight
          }
        }));
      }, 100);
    };

    const handleResize = () => {
      // Actualizar información del dispositivo
      const deviceInfo = {
        isMobile: window.innerWidth <= 768,
        isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
        isDesktop: window.innerWidth > 1024,
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      (window as any).deviceInfo = { ...(window as any).deviceInfo, ...deviceInfo };
      
      // Notificar cambio de tamaño
      window.dispatchEvent(new CustomEvent('device_size_changed', {
        detail: deviceInfo
      }));
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <AdminProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 cross-platform-app">
            <Routes>
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/*" element={
                <>
                  <Header />
                  <main className="cross-platform-main">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/movies" element={<Movies />} />
                      <Route path="/tv" element={<TVShows />} />
                      <Route path="/anime" element={<Anime />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/movie/:id" element={<MovieDetail />} />
                      <Route path="/tv/:id" element={<TVDetail />} />
                      <Route path="/cart" element={<Cart />} />
                    </Routes>
                  </main>
                </>
              } />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AdminProvider>
  );
}

export default App;