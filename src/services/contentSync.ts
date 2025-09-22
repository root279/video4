import { tmdbService } from './tmdb';
import { contentFilterService } from '../services/contentFilter';
import type { Movie, TVShow } from '../types/movie';

class ContentSyncService {
  private lastDailyUpdate: Date | null = null;
  private lastWeeklyUpdate: Date | null = null;
  private lastTrendingUpdate: Date | null = null;
  private syncInProgress = false;
  private autoSyncInterval: NodeJS.Timeout | null = null;
  private trendingSyncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeAutoSync();
  }

  private initializeAutoSync() {
    // Sincronización diaria completa cada 24 horas
    this.autoSyncInterval = setInterval(() => {
      this.checkAndSyncDaily();
    }, 60 * 60 * 1000); // Verificar cada hora

    // Sincronización de trending cada 6 horas
    this.trendingSyncInterval = setInterval(() => {
      this.checkAndSyncTrending();
    }, 30 * 60 * 1000); // Verificar cada 30 minutos

    // Verificación inicial
    this.checkAndSyncDaily();
    this.checkAndSyncTrending();

    // Sincronización cuando la página vuelve a estar visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkAndSyncDaily();
        this.checkAndSyncTrending();
      }
    });

    // Sincronización cuando se detecta conexión de red
    window.addEventListener('online', () => {
      console.log('Network connection restored, syncing content...');
      this.forceRefresh();
    });
  }

  private async checkAndSyncDaily() {
    if (this.syncInProgress) return;

    const now = new Date();
    const shouldDailyUpdate = this.shouldPerformDailyUpdate(now);
    const shouldWeeklyUpdate = this.shouldPerformWeeklyUpdate(now);

    if (shouldDailyUpdate || shouldWeeklyUpdate) {
      await this.performDailySync(shouldWeeklyUpdate);
    }
  }

  private async checkAndSyncTrending() {
    if (this.syncInProgress) return;

    const now = new Date();
    const shouldTrendingUpdate = this.shouldPerformTrendingUpdate(now);

    if (shouldTrendingUpdate) {
      await this.performTrendingSync();
    }
  }

  private shouldPerformDailyUpdate(now: Date): boolean {
    if (!this.lastDailyUpdate) return true;
    
    const timeDiff = now.getTime() - this.lastDailyUpdate.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff >= 24;
  }

  private shouldPerformWeeklyUpdate(now: Date): boolean {
    if (!this.lastWeeklyUpdate) return true;
    
    const timeDiff = now.getTime() - this.lastWeeklyUpdate.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    return daysDiff >= 7;
  }

  private shouldPerformTrendingUpdate(now: Date): boolean {
    if (!this.lastTrendingUpdate) return true;
    
    const timeDiff = now.getTime() - this.lastTrendingUpdate.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    return hoursDiff >= 6; // Actualizar trending cada 6 horas
  }

  private async performDailySync(isWeeklyUpdate: boolean = false) {
    try {
      this.syncInProgress = true;
      console.log(`Performing ${isWeeklyUpdate ? 'weekly' : 'daily'} content sync...`);

      // Sincronización completa y mejorada
      await Promise.allSettled([
        this.syncTrendingContent('day'),
        this.syncTrendingContent('week'),
        this.syncPopularContent(),
        this.syncCurrentContent(),
        this.syncTopRatedContent(),
        this.syncUpcomingContent(),
        this.syncAnimeContent(),
        this.syncDocumentaryContent(),
        this.syncAnimatedContent(),
        this.syncVideosForPopularContent(),
        this.syncGenres(),
        this.syncInTheatersContent(),
        this.syncOnTVContent(),
        this.syncForRentContent()
      ]);

      const now = new Date();
      this.lastDailyUpdate = now;
      
      if (isWeeklyUpdate) {
        this.lastWeeklyUpdate = now;
      }

      console.log('Daily content sync completed successfully');
      
      // Notificar a la aplicación sobre la actualización
      window.dispatchEvent(new CustomEvent('content_updated', {
        detail: { 
          type: isWeeklyUpdate ? 'weekly' : 'daily',
          timestamp: now.toISOString()
        }
      }));
    } catch (error) {
      console.error('Error during daily content sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async performTrendingSync() {
    try {
      console.log('Performing trending content sync...');

      await Promise.allSettled([
        this.syncTrendingContent('day'),
        this.syncTrendingMovies('day'),
        this.syncTrendingTV('day'),
        this.syncCurrentTrendingContent()
      ]);

      this.lastTrendingUpdate = new Date();
      console.log('Trending content sync completed successfully');
    } catch (error) {
      console.error('Error during trending content sync:', error);
    }
  }

  // Sincronizar contenido trending actualizado
  private async syncCurrentTrendingContent() {
    try {
      const [nowPlayingMovies, airingTodayTV, onTheAirTV] = await Promise.all([
        tmdbService.getNowPlayingMovies(1),
        tmdbService.getAiringTodayTVShows(1),
        tmdbService.getOnTheAirTVShows(1)
      ]);

      localStorage.setItem('current_now_playing', JSON.stringify({
        content: nowPlayingMovies.results,
        lastUpdate: new Date().toISOString()
      }));

      localStorage.setItem('current_airing_today', JSON.stringify({
        content: airingTodayTV.results,
        lastUpdate: new Date().toISOString()
      }));

      localStorage.setItem('current_on_the_air', JSON.stringify({
        content: onTheAirTV.results,
        lastUpdate: new Date().toISOString()
      }));

      return { nowPlayingMovies: nowPlayingMovies.results, airingTodayTV: airingTodayTV.results, onTheAirTV: onTheAirTV.results };
    } catch (error) {
      console.error('Error syncing current trending content:', error);
      return { nowPlayingMovies: [], airingTodayTV: [], onTheAirTV: [] };
    }
  }

  // Sincronizar documentales
  private async syncDocumentaryContent() {
    try {
      const [documentaryMovies, documentaryTV] = await Promise.all([
        tmdbService.getDiscoverMovies({ genre: 99, sortBy: 'popularity.desc', page: 1 }), // 99 = Documentary
        tmdbService.getDiscoverTVShows({ genre: 99, sortBy: 'popularity.desc', page: 1 })
      ]);

      localStorage.setItem('documentary_movies', JSON.stringify({
        content: documentaryMovies.results,
        lastUpdate: new Date().toISOString()
      }));

      localStorage.setItem('documentary_tv', JSON.stringify({
        content: documentaryTV.results,
        lastUpdate: new Date().toISOString()
      }));

      console.log('Documentary content synced successfully');
    } catch (error) {
      console.error('Error syncing documentary content:', error);
    }
  }

  // Sincronizar contenido animado
  private async syncAnimatedContent() {
    try {
      const [animatedMovies, animatedTV] = await Promise.all([
        tmdbService.getDiscoverMovies({ genre: 16, sortBy: 'popularity.desc', page: 1 }), // 16 = Animation
        tmdbService.getDiscoverTVShows({ genre: 16, sortBy: 'popularity.desc', page: 1 })
      ]);

      localStorage.setItem('animated_movies', JSON.stringify({
        content: animatedMovies.results,
        lastUpdate: new Date().toISOString()
      }));

      localStorage.setItem('animated_tv', JSON.stringify({
        content: animatedTV.results,
        lastUpdate: new Date().toISOString()
      }));

      console.log('Animated content synced successfully');
    } catch (error) {
      console.error('Error syncing animated content:', error);
    }
  }

  // Sincronizar contenido en cines
  private async syncInTheatersContent() {
    try {
      const inTheatersMovies = await tmdbService.getNowPlayingMovies(1);

      localStorage.setItem('in_theaters_movies', JSON.stringify({
        content: inTheatersMovies.results,
        lastUpdate: new Date().toISOString()
      }));

      console.log('In theaters content synced successfully');
    } catch (error) {
      console.error('Error syncing in theaters content:', error);
    }
  }

  // Sincronizar contenido en TV
  private async syncOnTVContent() {
    try {
      const [airingTodayTV, onTheAirTV] = await Promise.all([
        tmdbService.getAiringTodayTVShows(1),
        tmdbService.getOnTheAirTVShows(1)
      ]);

      const combinedOnTV = tmdbService.removeDuplicates([
        ...airingTodayTV.results,
        ...onTheAirTV.results
      ]);

      localStorage.setItem('on_tv_content', JSON.stringify({
        content: combinedOnTV,
        lastUpdate: new Date().toISOString()
      }));

      console.log('On TV content synced successfully');
    } catch (error) {
      console.error('Error syncing on TV content:', error);
    }
  }

  // Sincronizar contenido en alquiler (simulado con popular)
  private async syncForRentContent() {
    try {
      const [rentMovies, rentTV] = await Promise.all([
        tmdbService.getPopularMovies(1),
        tmdbService.getPopularTVShows(1)
      ]);

      const combinedRent = tmdbService.removeDuplicates([
        ...rentMovies.results.slice(0, 10),
        ...rentTV.results.slice(0, 10)
      ]);

      localStorage.setItem('for_rent_content', JSON.stringify({
        content: combinedRent,
        lastUpdate: new Date().toISOString()
      }));

      console.log('For rent content synced successfully');
    } catch (error) {
      console.error('Error syncing for rent content:', error);
    }
  }

  private async syncTrendingContent(timeWindow: 'day' | 'week') {
    try {
      const response = await tmdbService.getTrendingAll(timeWindow, 1);
      const filteredContent = contentFilterService.filterContent(response.results);
      const uniqueContent = tmdbService.removeDuplicates(filteredContent);
      
      localStorage.setItem(`trending_${timeWindow}`, JSON.stringify({
        content: uniqueContent,
        lastUpdate: new Date().toISOString()
      }));
      
      return uniqueContent;
    } catch (error) {
      console.error(`Error syncing trending ${timeWindow} content:`, error);
      return [];
    }
  }

  private async syncTrendingMovies(timeWindow: 'day' | 'week') {
    try {
      const response = await tmdbService.getTrendingMovies(timeWindow, 1);
      const filteredContent = contentFilterService.filterContent(response.results);
      
      localStorage.setItem(`trending_movies_${timeWindow}`, JSON.stringify({
        content: filteredContent,
        lastUpdate: new Date().toISOString()
      }));
      
      return filteredContent;
    } catch (error) {
      console.error(`Error syncing trending movies ${timeWindow}:`, error);
      return [];
    }
  }

  private async syncTrendingTV(timeWindow: 'day' | 'week') {
    try {
      const response = await tmdbService.getTrendingTV(timeWindow, 1);
      const filteredContent = contentFilterService.filterContent(response.results);
      
      localStorage.setItem(`trending_tv_${timeWindow}`, JSON.stringify({
        content: filteredContent,
        lastUpdate: new Date().toISOString()
      }));
      
      return filteredContent;
    } catch (error) {
      console.error(`Error syncing trending TV ${timeWindow}:`, error);
      return [];
    }
  }

  private async syncPopularContent() {
    try {
      const [movies, tvShows] = await Promise.all([
        tmdbService.getPopularMovies(1),
        tmdbService.getPopularTVShows(1)
      ]);

      const filteredMovies = contentFilterService.filterContent(movies.results);
      const filteredTVShows = contentFilterService.filterContent(tvShows.results);

      localStorage.setItem('popular_movies', JSON.stringify({
        content: filteredMovies,
        lastUpdate: new Date().toISOString()
      }));

      localStorage.setItem('popular_tv', JSON.stringify({
        content: filteredTVShows,
        lastUpdate: new Date().toISOString()
      }));

      return { movies: filteredMovies, tvShows: filteredTVShows };
    } catch (error) {
      console.error('Error syncing popular content:', error);
      return { movies: [], tvShows: [] };
    }
  }

  private async syncCurrentContent() {
    try {
      const [nowPlayingMovies, airingTodayTV, onTheAirTV] = await Promise.all([
        tmdbService.getNowPlayingMovies(1),
        tmdbService.getAiringTodayTVShows(1),
        tmdbService.getOnTheAirTVShows(1)
      ]);

      localStorage.setItem('now_playing_movies', JSON.stringify({
        content: nowPlayingMovies.results,
        lastUpdate: new Date().toISOString()
      }));

      localStorage.setItem('airing_today_tv', JSON.stringify({
        content: airingTodayTV.results,
        lastUpdate: new Date().toISOString()
      }));

      localStorage.setItem('on_the_air_tv', JSON.stringify({
        content: onTheAirTV.results,
        lastUpdate: new Date().toISOString()
      }));

      return { nowPlayingMovies: nowPlayingMovies.results, airingTodayTV: airingTodayTV.results, onTheAirTV: onTheAirTV.results };
    } catch (error) {
      console.error('Error syncing current content:', error);
      return { nowPlayingMovies: [], airingTodayTV: [], onTheAirTV: [] };
    }
  }

  private async syncTopRatedContent() {
    try {
      const [topRatedMovies, topRatedTV] = await Promise.all([
        tmdbService.getTopRatedMovies(1),
        tmdbService.getTopRatedTVShows(1)
      ]);

      localStorage.setItem('top_rated_movies', JSON.stringify({
        content: topRatedMovies.results,
        lastUpdate: new Date().toISOString()
      }));

      localStorage.setItem('top_rated_tv', JSON.stringify({
        content: topRatedTV.results,
        lastUpdate: new Date().toISOString()
      }));

      console.log('Top rated content synced successfully');
    } catch (error) {
      console.error('Error syncing top rated content:', error);
    }
  }

  private async syncUpcomingContent() {
    try {
      const upcomingMovies = await tmdbService.getUpcomingMovies(1);

      localStorage.setItem('upcoming_movies', JSON.stringify({
        content: upcomingMovies.results,
        lastUpdate: new Date().toISOString()
      }));

      console.log('Upcoming content synced successfully');
    } catch (error) {
      console.error('Error syncing upcoming content:', error);
    }
  }

  private async syncAnimeContent() {
    try {
      const [popularAnime, topRatedAnime] = await Promise.all([
        tmdbService.getAnimeFromMultipleSources(1),
        tmdbService.getTopRatedAnime(1)
      ]);

      const filteredPopularAnime = contentFilterService.filterContent(popularAnime.results);
      const filteredTopRatedAnime = contentFilterService.filterContent(topRatedAnime.results);
      
      localStorage.setItem('popular_anime', JSON.stringify({
        content: filteredPopularAnime,
        lastUpdate: new Date().toISOString()
      }));

      localStorage.setItem('top_rated_anime', JSON.stringify({
        content: filteredTopRatedAnime,
        lastUpdate: new Date().toISOString()
      }));

      console.log('Anime content synced successfully');
    } catch (error) {
      console.error('Error syncing anime content:', error);
    }
  }

  private async syncGenres() {
    try {
      const [movieGenres, tvGenres] = await Promise.all([
        tmdbService.getMovieGenres(),
        tmdbService.getTVGenres()
      ]);

      localStorage.setItem('movie_genres', JSON.stringify({
        content: movieGenres.genres,
        lastUpdate: new Date().toISOString()
      }));

      localStorage.setItem('tv_genres', JSON.stringify({
        content: tvGenres.genres,
        lastUpdate: new Date().toISOString()
      }));

      console.log('Genres synced successfully');
    } catch (error) {
      console.error('Error syncing genres:', error);
    }
  }

  private async syncVideosForPopularContent() {
    try {
      // Obtener contenido popular para sincronizar videos
      const [moviesRes, tvRes, animeRes, nowPlayingRes, airingTodayRes, trendingRes] = await Promise.all([
        tmdbService.getPopularMovies(1),
        tmdbService.getPopularTVShows(1),
        tmdbService.getAnimeFromMultipleSources(1),
        tmdbService.getNowPlayingMovies(1),
        tmdbService.getAiringTodayTVShows(1),
        tmdbService.getTrendingAll('day', 1)
      ]);

      // Preparar elementos para obtener videos
      const items = [
        ...moviesRes.results.slice(0, 10).map(movie => ({ id: movie.id, type: 'movie' as const })),
        ...tvRes.results.slice(0, 10).map(tv => ({ id: tv.id, type: 'tv' as const })),
        ...animeRes.results.slice(0, 8).map(anime => ({ id: anime.id, type: 'tv' as const })),
        ...nowPlayingRes.results.slice(0, 8).map(movie => ({ id: movie.id, type: 'movie' as const })),
        ...airingTodayRes.results.slice(0, 6).map(tv => ({ id: tv.id, type: 'tv' as const })),
        ...trendingRes.results.slice(0, 12).map(item => ({ 
          id: item.id, 
          type: ('title' in item ? 'movie' : 'tv') as const 
        }))
      ];

      // Remover duplicados
      const uniqueItems = items.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id && t.type === item.type)
      );

      // Obtener videos en lotes
      try {
        const videoMap = await tmdbService.batchFetchVideos(uniqueItems);
        
        const videoData: { [key: string]: any[] } = {};
        videoMap.forEach((videos, key) => {
          videoData[key] = videos;
        });

        localStorage.setItem('content_videos', JSON.stringify({
          videos: videoData,
          lastUpdate: new Date().toISOString()
        }));

        console.log(`Videos synced for ${uniqueItems.length} unique items`);
      } catch (videoError) {
        console.warn('Some videos could not be synced:', videoError);
      }
    } catch (error) {
      console.error('Error syncing videos:', error);
    }
  }

  // Métodos públicos para componentes
  async getTrendingContent(timeWindow: 'day' | 'week'): Promise<(Movie | TVShow)[]> {
    const cached = localStorage.getItem(`trending_${timeWindow}`);
    
    if (cached) {
      try {
        const { content, lastUpdate } = JSON.parse(cached);
        const updateTime = new Date(lastUpdate);
        const now = new Date();
        const hoursDiff = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60);
        
        // Usar contenido en caché si tiene menos de 3 horas para trending
        if (hoursDiff < 3) {
          return content;
        }
      } catch (error) {
        console.error('Error parsing cached trending content:', error);
      }
    }

    // Obtener contenido fresco
    return await this.syncTrendingContent(timeWindow);
  }

  async getPopularContent(): Promise<{ movies: Movie[]; tvShows: TVShow[]; anime: TVShow[] }> {
    const [movies, tvShows, anime] = await Promise.all([
      this.getCachedOrFresh('popular_movies', () => tmdbService.getPopularMovies(1)),
      this.getCachedOrFresh('popular_tv', () => tmdbService.getPopularTVShows(1)),
      this.getCachedOrFresh('popular_anime', () => tmdbService.getAnimeFromMultipleSources(1))
    ]);

    return {
      movies: movies.results || movies,
      tvShows: tvShows.results || tvShows,
      anime: anime.results || anime
    };
  }

  // Obtener contenido específico por categoría
  async getContentByCategory(category: string): Promise<(Movie | TVShow)[]> {
    const categoryMap: { [key: string]: string } = {
      'lo_mas_popular': 'popular_movies',
      'retransmision': 'on_tv_content',
      'en_television': 'airing_today_tv',
      'en_alquiler': 'for_rent_content',
      'en_cines': 'in_theaters_movies',
      'documentales': 'documentary_movies',
      'animados': 'animated_movies'
    };

    const cacheKey = categoryMap[category];
    if (!cacheKey) return [];

    return this.getCachedOrFresh(cacheKey, () => []);
  }

  // Obtener videos en caché para contenido
  getCachedVideos(id: number, type: 'movie' | 'tv'): any[] {
    try {
      const cached = localStorage.getItem('content_videos');
      if (cached) {
        const { videos } = JSON.parse(cached);
        const key = `${type}-${id}`;
        return videos[key] || [];
      }
    } catch (error) {
      console.error('Error getting cached videos:', error);
    }
    return [];
  }

  private async getCachedOrFresh(key: string, fetchFn: () => Promise<any>) {
    const cached = localStorage.getItem(key);
    
    if (cached) {
      try {
        const { content, lastUpdate } = JSON.parse(cached);
        const updateTime = new Date(lastUpdate);
        const now = new Date();
        const hoursDiff = (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60);
        
        // Usar caché si tiene menos de 12 horas
        if (hoursDiff < 12) {
          return content;
        }
      } catch (error) {
        console.error(`Error parsing cached ${key}:`, error);
      }
    }

    // Obtener contenido fresco
    const fresh = await fetchFn();
    localStorage.setItem(key, JSON.stringify({
      content: fresh.results || fresh,
      lastUpdate: new Date().toISOString()
    }));

    return fresh.results || fresh;
  }

  // Forzar actualización completa
  async forceRefresh(): Promise<void> {
    this.lastDailyUpdate = null;
    this.lastWeeklyUpdate = null;
    this.lastTrendingUpdate = null;
    
    // Limpiar todos los cachés
    await tmdbService.forceRefreshAllContent();
    
    // Limpiar videos en caché
    localStorage.removeItem('content_videos');
    
    // Limpiar todos los cachés de contenido
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('trending') || 
          key.includes('popular') || 
          key.includes('now_playing') || 
          key.includes('airing') ||
          key.includes('documentary') ||
          key.includes('animated') ||
          key.includes('in_theaters') ||
          key.includes('on_tv') ||
          key.includes('for_rent')) {
        localStorage.removeItem(key);
      }
    });
    
    // Forzar sincronización completa inmediata
    await this.performDailySync(true);
    await this.performTrendingSync();
  }

  // Obtener estado de sincronización
  getSyncStatus(): { 
    lastDaily: Date | null; 
    lastWeekly: Date | null; 
    lastTrending: Date | null;
    inProgress: boolean;
    nextDailySync: Date | null;
    nextTrendingSync: Date | null;
  } {
    const nextDailySync = this.lastDailyUpdate 
      ? new Date(this.lastDailyUpdate.getTime() + 24 * 60 * 60 * 1000)
      : null;
    
    const nextTrendingSync = this.lastTrendingUpdate
      ? new Date(this.lastTrendingUpdate.getTime() + 6 * 60 * 60 * 1000)
      : null;

    return {
      lastDaily: this.lastDailyUpdate,
      lastWeekly: this.lastWeeklyUpdate,
      lastTrending: this.lastTrendingUpdate,
      inProgress: this.syncInProgress,
      nextDailySync,
      nextTrendingSync
    };
  }

  // Obtener estadísticas de contenido sincronizado
  getContentStats(): { [key: string]: { count: number; lastUpdate: string } } {
    const stats: { [key: string]: { count: number; lastUpdate: string } } = {};
    
    const contentKeys = [
      'trending_day', 'trending_week', 'popular_movies', 'popular_tv', 'popular_anime',
      'now_playing_movies', 'airing_today_tv', 'on_the_air_tv', 'top_rated_movies', 
      'top_rated_tv', 'upcoming_movies', 'documentary_movies', 'documentary_tv',
      'animated_movies', 'animated_tv', 'in_theaters_movies', 'on_tv_content', 'for_rent_content'
    ];

    contentKeys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const { content, lastUpdate } = JSON.parse(cached);
          stats[key] = {
            count: Array.isArray(content) ? content.length : 0,
            lastUpdate
          };
        }
      } catch (error) {
        stats[key] = { count: 0, lastUpdate: 'Error' };
      }
    });

    return stats;
  }

  // Destructor
  destroy() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }
    if (this.trendingSyncInterval) {
      clearInterval(this.trendingSyncInterval);
    }
  }
}

export const contentSyncService = new ContentSyncService();