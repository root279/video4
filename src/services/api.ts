// Servicio API centralizado optimizado para todos los dispositivos y navegadores
import { BASE_URL, API_OPTIONS } from '../config/api';
import { deviceDetectionService } from '../utils/deviceDetection';

export class APIService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutos para contenido regular
  private readonly FRESH_CACHE_DURATION = 15 * 60 * 1000; // 15 minutos para contenido trending
  private readonly MOBILE_CACHE_DURATION = 45 * 60 * 1000; // 45 minutos en móviles (conservar batería)
  private requestQueue: Map<string, Promise<any>> = new Map();
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;

  constructor() {
    this.setupNetworkOptimizations();
  }

  private setupNetworkOptimizations() {
    // Optimizar según el tipo de conexión
    const deviceInfo = deviceDetectionService.getDeviceInfo();
    
    // Ajustar configuraciones según el dispositivo
    if (deviceInfo.device.mobile) {
      // En móviles, usar caché más largo para conservar batería y datos
      this.CACHE_DURATION = this.MOBILE_CACHE_DURATION;
    }

    // Escuchar cambios de red
    window.addEventListener('online', () => {
      console.log('Network restored, clearing failed requests');
      this.retryAttempts.clear();
    });

    window.addEventListener('offline', () => {
      console.log('Network lost, will use cached data');
    });
  }

  async fetchWithCache<T>(endpoint: string, useCache: boolean = true): Promise<T> {
    const cacheKey = endpoint;
    const cacheDuration = this.getCacheDuration(endpoint);
    const deviceInfo = deviceDetectionService.getDeviceInfo();
    
    // Verificar si ya hay una petición en curso para evitar duplicados
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey)!;
    }
    
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      const isExpired = Date.now() - cached.timestamp > cacheDuration;
      
      if (!isExpired) {
        return cached.data;
      }
    }

    // Crear promesa de petición
    const requestPromise = this.performRequest<T>(endpoint, deviceInfo);
    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const data = await requestPromise;
      
      if (useCache) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }
      
      // Limpiar contador de reintentos en caso de éxito
      this.retryAttempts.delete(cacheKey);
      
      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      
      // Manejar errores específicos
      if (endpoint.includes('/videos')) {
        console.warn(`Returning empty videos for ${endpoint}`);
        return { results: [] } as T;
      }
      
      // Intentar usar datos en caché aunque estén expirados
      if (this.cache.has(cacheKey)) {
        console.warn(`Using expired cache for ${endpoint} due to network error`);
        return this.cache.get(cacheKey)!.data;
      }
      
      throw error;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  private async performRequest<T>(endpoint: string, deviceInfo: any): Promise<T> {
    const fullUrl = `${BASE_URL}${endpoint}`;
    const retryCount = this.retryAttempts.get(endpoint) || 0;
    
    try {
      // Configurar opciones de fetch optimizadas por dispositivo
      const fetchOptions = {
        ...API_OPTIONS,
        // Timeout más largo en móviles con conexión lenta
        signal: AbortSignal.timeout(deviceInfo.device.mobile ? 15000 : 10000)
      };

      const response = await fetch(fullUrl, fetchOptions);
      
      if (!response.ok) {
        // Manejar errores 404 específicos
        if (response.status === 404 && endpoint.includes('/videos')) {
          console.warn(`Videos not found for endpoint: ${endpoint}`);
          return { results: [] } as T;
        }
        
        if (response.status === 404 && (endpoint.includes('/movie/') || endpoint.includes('/tv/'))) {
          console.warn(`Content not found for endpoint: ${endpoint}`);
          return null as T;
        }
        
        // Manejar errores de rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, retryCount) * 1000;
          
          if (retryCount < this.maxRetries) {
            console.warn(`Rate limited, retrying after ${delay}ms`);
            this.retryAttempts.set(endpoint, retryCount + 1);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.performRequest<T>(endpoint, deviceInfo);
          }
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      // Reintentar en caso de error de red
      if (retryCount < this.maxRetries && 
          (error instanceof TypeError || error.name === 'NetworkError' || error.name === 'TimeoutError')) {
        
        const delay = Math.pow(2, retryCount) * 1000; // Backoff exponencial
        console.warn(`Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        this.retryAttempts.set(endpoint, retryCount + 1);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.performRequest<T>(endpoint, deviceInfo);
      }
      
      throw error;
    }
  }

  private getCacheDuration(endpoint: string): number {
    const deviceInfo = deviceDetectionService.getDeviceInfo();
    
    // Ajustar duración de caché según el tipo de contenido y dispositivo
    if (endpoint.includes('/trending') || 
        endpoint.includes('/now_playing') || 
        endpoint.includes('/airing_today') || 
        endpoint.includes('/on_the_air')) {
      return deviceInfo.device.mobile ? this.FRESH_CACHE_DURATION * 1.5 : this.FRESH_CACHE_DURATION;
    }
    
    if (endpoint.includes('/popular')) {
      return deviceInfo.device.mobile ? this.CACHE_DURATION * 1.5 : this.CACHE_DURATION;
    }
    
    return this.CACHE_DURATION;
  }

  // Limpiar caché con optimizaciones por dispositivo
  clearCache(): void {
    const deviceInfo = deviceDetectionService.getDeviceInfo();
    
    this.cache.clear();
    this.retryAttempts.clear();
    
    // En móviles, también limpiar localStorage para liberar espacio
    if (deviceInfo.device.mobile) {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('fresh_') || 
            key.includes('trending') || 
            key.includes('popular') || 
            key.includes('now_playing') || 
            key.includes('airing')) {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.warn(`Could not remove ${key} from localStorage:`, error);
          }
        }
      });
    }
  }

  // Precargar contenido crítico
  async preloadCriticalContent(): Promise<void> {
    const deviceInfo = deviceDetectionService.getDeviceInfo();
    
    // Solo precargar en dispositivos con buena conexión
    if (deviceInfo.network.online && 
        (deviceInfo.network.effectiveType === '4g' || deviceInfo.device.desktop)) {
      
      try {
        // Precargar contenido más importante
        await Promise.allSettled([
          this.fetchWithCache('/trending/all/day?page=1'),
          this.fetchWithCache('/movie/popular?page=1'),
          this.fetchWithCache('/tv/popular?page=1')
        ]);
        
        console.log('Critical content preloaded successfully');
      } catch (error) {
        console.warn('Could not preload critical content:', error);
      }
    }
  }

  // Estadísticas de caché
  getCacheSize(): number {
    return this.cache.size;
  }

  getCacheInfo(): { key: string; age: number; size: number }[] {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([key, { timestamp, data }]) => ({
      key,
      age: now - timestamp,
      size: JSON.stringify(data).length
    }));
  }

  // Optimizar caché según el dispositivo
  optimizeCache(): void {
    const deviceInfo = deviceDetectionService.getDeviceInfo();
    const maxCacheSize = deviceInfo.device.mobile ? 50 : deviceInfo.device.tablet ? 100 : 200;
    
    if (this.cache.size > maxCacheSize) {
      // Eliminar entradas más antiguas
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toRemove = entries.slice(0, this.cache.size - maxCacheSize);
      toRemove.forEach(([key]) => {
        this.cache.delete(key);
      });
      
      console.log(`Cache optimized: removed ${toRemove.length} old entries`);
    }
  }

  // Destructor
  destroy() {
    this.cache.clear();
    this.requestQueue.clear();
    this.retryAttempts.clear();
  }
}

export const apiService = new APIService();