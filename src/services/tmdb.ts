import { BASE_URL, API_OPTIONS } from '../config/api';
import { apiService } from './api';
import { contentFilterService } from './contentFilter';
import type { Movie, TVShow, MovieDetails, TVShowDetails, Video, APIResponse, Genre, Cast, CastMember } from '../types/movie';

class TMDBService {
  private readonly FRESH_CONTENT_CACHE_DURATION = 15 * 60 * 1000; // 15 minutos para contenido fresco
  private readonly DETAILS_CACHE_DURATION = 60 * 60 * 1000; // 1 hora para detalles
  private readonly DAILY_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas
  private readonly TRENDING_REFRESH_INTERVAL = 6 * 60 * 60 * 1000; // 6 horas para trending
  
  private lastDailySync: Date | null = null;
  private autoSyncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeAutoSync();
  }

  // Inicializar sincronización automática diaria
  private initializeAutoSync() {
    // Verificar y sincronizar cada hora
    this.autoSyncInterval = setInterval(() => {
      this.checkAndPerformAutoSync();
    }, 60 * 60 * 1000); // 1 hora

    // Sincronización inicial
    this.checkAndPerformAutoSync();

    // Sincronización cuando la página vuelve a estar visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkAndPerformAutoSync();
      }
    });
  }

  private async checkAndPerformAutoSync() {
    const now = new Date();
    const shouldSync = !this.lastDailySync || 
                     (now.getTime() - this.lastDailySync.getTime()) > this.DAILY_REFRESH_INTERVAL;

    if (shouldSync) {
      console.log('Performing automatic daily content sync...');
      await this.performDailyContentSync();
      this.lastDailySync = now;
    }
  }

  // Sincronización diaria completa de todo el contenido
  private async performDailyContentSync() {
    try {
      console.log('Starting comprehensive daily content sync...');
      
      // Limpiar cachés antiguos
      this.clearExpiredCaches();
      
      // Sincronizar todo el contenido en paralelo
      await Promise.allSettled([
        // Contenido trending (actualización más frecuente)
        this.syncTrendingContent(),
        
        // Contenido popular
        this.syncPopularContent(),
        
        // Contenido actual (en cartelera/al aire)
        this.syncCurrentContent(),
        
        // Contenido mejor valorado
        this.syncTopRatedContent(),
        
        // Próximos estrenos
        this.syncUpcomingContent(),
        
        // Anime específico
        this.syncAnimeContent(),
        
        // Videos y trailers
        this.syncVideosForAllContent(),
        
        // Géneros
        this.syncGenres()
      ]);
      
      console.log('Daily content sync completed successfully');
    } catch (error) {
      console.error('Error during daily content sync:', error);
    }
  }

  // Sincronizar contenido trending con actualización frecuente
  private async syncTrendingContent() {
    try {
      const [trendingDay, trendingWeek, trendingMovies, trendingTV] = await Promise.all([
        this.getTrendingAll('day', 1),
        this.getTrendingAll('week', 1),
        this.getTrendingMovies('day', 1),
        this.getTrendingTV('day', 1)
      ]);

      // Almacenar con timestamp para verificación de frescura
      const timestamp = Date.now();
      localStorage.setItem('trending_all_day', JSON.stringify({ data: trendingDay, timestamp }));
      localStorage.setItem('trending_all_week', JSON.stringify({ data: trendingWeek, timestamp }));
      localStorage.setItem('trending_movies_day', JSON.stringify({ data: trendingMovies, timestamp }));
      localStorage.setItem('trending_tv_day', JSON.stringify({ data: trendingTV, timestamp }));
      
      console.log('Trending content synced successfully');
    } catch (error) {
      console.error('Error syncing trending content:', error);
    }
  }

  // Sincronizar contenido popular
  private async syncPopularContent() {
    try {
      const [popularMovies, popularTV, popularAnime] = await Promise.all([
        this.getPopularMovies(1),
        this.getPopularTVShows(1),
        this.getAnimeFromMultipleSources(1)
      ]);

      const timestamp = Date.now();
      localStorage.setItem('popular_movies', JSON.stringify({ data: popularMovies, timestamp }));
      localStorage.setItem('popular_tv', JSON.stringify({ data: popularTV, timestamp }));
      localStorage.setItem('popular_anime', JSON.stringify({ data: popularAnime, timestamp }));
      
      console.log('Popular content synced successfully');
    } catch (error) {
      console.error('Error syncing popular content:', error);
    }
  }

  // Sincronizar contenido actual (en cartelera/al aire)
  private async syncCurrentContent() {
    try {
      const [nowPlayingMovies, airingTodayTV, onTheAirTV] = await Promise.all([
        this.getNowPlayingMovies(1),
        this.getAiringTodayTVShows(1),
        this.getOnTheAirTVShows(1)
      ]);

      const timestamp = Date.now();
      localStorage.setItem('now_playing_movies', JSON.stringify({ data: nowPlayingMovies, timestamp }));
      localStorage.setItem('airing_today_tv', JSON.stringify({ data: airingTodayTV, timestamp }));
      localStorage.setItem('on_the_air_tv', JSON.stringify({ data: onTheAirTV, timestamp }));
      
      console.log('Current content synced successfully');
    } catch (error) {
      console.error('Error syncing current content:', error);
    }
  }

  // Sincronizar contenido mejor valorado
  private async syncTopRatedContent() {
    try {
      const [topRatedMovies, topRatedTV, topRatedAnime] = await Promise.all([
        this.getTopRatedMovies(1),
        this.getTopRatedTVShows(1),
        this.getTopRatedAnime(1)
      ]);

      const timestamp = Date.now();
      localStorage.setItem('top_rated_movies', JSON.stringify({ data: topRatedMovies, timestamp }));
      localStorage.setItem('top_rated_tv', JSON.stringify({ data: topRatedTV, timestamp }));
      localStorage.setItem('top_rated_anime', JSON.stringify({ data: topRatedAnime, timestamp }));
      
      console.log('Top rated content synced successfully');
    } catch (error) {
      console.error('Error syncing top rated content:', error);
    }
  }

  // Sincronizar próximos estrenos
  private async syncUpcomingContent() {
    try {
      const upcomingMovies = await this.getUpcomingMovies(1);
      
      const timestamp = Date.now();
      localStorage.setItem('upcoming_movies', JSON.stringify({ data: upcomingMovies, timestamp }));
      
      console.log('Upcoming content synced successfully');
    } catch (error) {
      console.error('Error syncing upcoming content:', error);
    }
  }

  // Sincronizar contenido de anime
  private async syncAnimeContent() {
    try {
      const [popularAnime, topRatedAnime, airingAnime] = await Promise.all([
        this.getAnimeFromMultipleSources(1),
        this.getTopRatedAnime(1),
        this.getDiscoverTVShows({ country: 'JP', genre: 16, sortBy: 'popularity.desc', page: 1 })
      ]);

      const timestamp = Date.now();
      localStorage.setItem('anime_popular', JSON.stringify({ data: popularAnime, timestamp }));
      localStorage.setItem('anime_top_rated', JSON.stringify({ data: topRatedAnime, timestamp }));
      localStorage.setItem('anime_airing', JSON.stringify({ data: airingAnime, timestamp }));
      
      console.log('Anime content synced successfully');
    } catch (error) {
      console.error('Error syncing anime content:', error);
    }
  }

  // Sincronizar videos y trailers para todo el contenido
  private async syncVideosForAllContent() {
    try {
      // Obtener IDs de todo el contenido popular para sincronizar videos
      const contentSources = [
        'popular_movies', 'popular_tv', 'popular_anime',
        'trending_all_day', 'trending_all_week',
        'now_playing_movies', 'airing_today_tv', 'on_the_air_tv',
        'top_rated_movies', 'top_rated_tv', 'upcoming_movies'
      ];

      const allContentIds: { id: number; type: 'movie' | 'tv' }[] = [];

      contentSources.forEach(source => {
        try {
          const cached = localStorage.getItem(source);
          if (cached) {
            const { data } = JSON.parse(cached);
            const results = data.results || data;
            
            results.forEach((item: any) => {
              const type = source.includes('movie') || source.includes('trending') && 'title' in item ? 'movie' : 'tv';
              allContentIds.push({ id: item.id, type });
            });
          }
        } catch (error) {
          console.warn(`Error processing ${source} for video sync:`, error);
        }
      });

      // Remover duplicados
      const uniqueContentIds = allContentIds.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id && t.type === item.type)
      );

      // Sincronizar videos en lotes para evitar sobrecarga
      const batchSize = 20;
      const batches = [];
      for (let i = 0; i < uniqueContentIds.length; i += batchSize) {
        batches.push(uniqueContentIds.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        await this.batchFetchVideos(batch);
        // Pequeña pausa entre lotes para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`Videos synced for ${uniqueContentIds.length} items`);
    } catch (error) {
      console.error('Error syncing videos:', error);
    }
  }

  // Sincronizar géneros
  private async syncGenres() {
    try {
      const [movieGenres, tvGenres] = await Promise.all([
        this.getMovieGenres(),
        this.getTVGenres()
      ]);

      const timestamp = Date.now();
      localStorage.setItem('movie_genres', JSON.stringify({ data: movieGenres, timestamp }));
      localStorage.setItem('tv_genres', JSON.stringify({ data: tvGenres, timestamp }));
      
      console.log('Genres synced successfully');
    } catch (error) {
      console.error('Error syncing genres:', error);
    }
  }

  // Limpiar cachés expirados
  private clearExpiredCaches() {
    const now = Date.now();
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith('fresh_') || key.includes('trending') || key.includes('popular')) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            const age = now - timestamp;
            
            // Limpiar cachés de más de 24 horas
            if (age > this.DAILY_REFRESH_INTERVAL) {
              localStorage.removeItem(key);
              console.log(`Cleared expired cache: ${key}`);
            }
          }
        } catch (error) {
          // Si hay error parseando, eliminar el cache corrupto
          localStorage.removeItem(key);
        }
      }
    });
  }

  private async fetchData<T>(endpoint: string, useCache: boolean = true): Promise<T> {
    // Para contenido fresco, usar caché más corto
    if (endpoint.includes('/popular') || endpoint.includes('/trending') || endpoint.includes('/now_playing')) {
      return this.fetchWithFreshCache<T>(endpoint, useCache);
    }
    return apiService.fetchWithCache<T>(endpoint, useCache);
  }

  private async fetchWithFreshCache<T>(endpoint: string, useCache: boolean = true): Promise<T> {
    const cacheKey = `fresh_${endpoint}`;
    
    if (useCache) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          const isExpired = Date.now() - timestamp > this.FRESH_CONTENT_CACHE_DURATION;
          
          if (!isExpired) {
            return data;
          }
        } catch (error) {
          localStorage.removeItem(cacheKey);
        }
      }
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, API_OPTIONS);
      
      if (!response.ok) {
        if (response.status === 404 && endpoint.includes('/videos')) {
          console.warn(`Videos not found for endpoint: ${endpoint}`);
          return { results: [] } as T;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (useCache) {
        localStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      }
      
      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      
      if (endpoint.includes('/videos')) {
        return { results: [] } as T;
      }
      
      // Intentar devolver datos en caché aunque estén expirados
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data } = JSON.parse(cached);
          console.warn(`Using expired cache for ${endpoint}`);
          return data;
        } catch (parseError) {
          localStorage.removeItem(cacheKey);
        }
      }
      
      throw error;
    }
  }

  // Obtener videos con fallback mejorado
  private async getVideosWithFallback(endpoint: string): Promise<{ results: Video[] }> {
    try {
      // Intentar español primero
      try {
        const spanishVideos = await this.fetchData<{ results: Video[] }>(`${endpoint}?language=es-ES`);
        
        if (spanishVideos.results && spanishVideos.results.length > 0) {
          const spanishTrailers = spanishVideos.results.filter(
            video => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
          );
          
          if (spanishTrailers.length === 0) {
            try {
              const englishVideos = await this.fetchData<{ results: Video[] }>(`${endpoint}?language=en-US`);
              const englishTrailers = englishVideos.results.filter(
                video => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
              );
              
              return {
                results: [...spanishVideos.results, ...englishTrailers]
              };
            } catch (englishError) {
              return spanishVideos;
            }
          }
          
          return spanishVideos;
        }
      } catch (spanishError) {
        console.warn('Spanish videos not available, trying English');
      }
      
      // Fallback a inglés
      try {
        const englishVideos = await this.fetchData<{ results: Video[] }>(`${endpoint}?language=en-US`);
        return englishVideos;
      } catch (englishError) {
        console.warn('English videos not available either');
        return { results: [] };
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      return { results: [] };
    }
  }

  // Movies - Métodos mejorados con sincronización automática
  async getPopularMovies(page: number = 1): Promise<APIResponse<Movie>> {
    const [spanishResults, englishResults, nowPlayingResults] = await Promise.all([
      this.fetchData(`/movie/popular?language=es-ES&page=${page}&region=ES`, page === 1),
      this.fetchData(`/movie/popular?language=en-US&page=${page}&region=US`, page === 1),
      this.fetchData(`/movie/now_playing?language=es-ES&page=${page}&region=ES`, page === 1)
    ]);
    
    const combinedResults = [
      ...spanishResults.results,
      ...englishResults.results.filter(movie => 
        !spanishResults.results.some(spanishMovie => spanishMovie.id === movie.id)
      ),
      ...nowPlayingResults.results.filter(movie => 
        !spanishResults.results.some(spanishMovie => spanishMovie.id === movie.id) &&
        !englishResults.results.some(englishMovie => englishMovie.id === movie.id)
      )
    ];
    
    return {
      ...spanishResults,
      results: contentFilterService.filterContent(this.removeDuplicates(combinedResults))
    };
  }

  async getTopRatedMovies(page: number = 1): Promise<APIResponse<Movie>> {
    const [spanishResults, englishResults] = await Promise.all([
      this.fetchData(`/movie/top_rated?language=es-ES&page=${page}&region=ES`, page === 1),
      this.fetchData(`/movie/top_rated?language=en-US&page=${page}&region=US`, page === 1)
    ]);
    
    const combinedResults = [
      ...spanishResults.results,
      ...englishResults.results.filter(movie => 
        !spanishResults.results.some(spanishMovie => spanishMovie.id === movie.id)
      )
    ];
    
    return {
      ...spanishResults,
      results: contentFilterService.filterContent(this.removeDuplicates(combinedResults))
    };
  }

  async getUpcomingMovies(page: number = 1): Promise<APIResponse<Movie>> {
    const [spanishResults, englishResults, nowPlayingResults] = await Promise.all([
      this.fetchData(`/movie/upcoming?language=es-ES&page=${page}&region=ES`, page === 1),
      this.fetchData(`/movie/upcoming?language=en-US&page=${page}&region=US`, page === 1),
      this.fetchData(`/movie/now_playing?language=es-ES&page=${page}&region=ES`, page === 1)
    ]);
    
    const combinedResults = [
      ...spanishResults.results,
      ...englishResults.results.filter(movie => 
        !spanishResults.results.some(spanishMovie => spanishMovie.id === movie.id)
      ),
      ...nowPlayingResults.results.filter(movie => 
        !spanishResults.results.some(spanishMovie => spanishMovie.id === movie.id) &&
        !englishResults.results.some(englishMovie => englishMovie.id === movie.id)
      )
    ];
    
    return {
      ...spanishResults,
      results: contentFilterService.filterContent(this.removeDuplicates(combinedResults))
    };
  }

  async getNowPlayingMovies(page: number = 1): Promise<APIResponse<Movie>> {
    const [spanishResults, englishResults] = await Promise.all([
      this.fetchData(`/movie/now_playing?language=es-ES&page=${page}&region=ES`, page === 1),
      this.fetchData(`/movie/now_playing?language=en-US&page=${page}&region=US`, page === 1)
    ]);
    
    const combinedResults = [
      ...spanishResults.results,
      ...englishResults.results.filter(movie => 
        !spanishResults.results.some(spanishMovie => spanishMovie.id === movie.id)
      )
    ];
    
    return {
      ...spanishResults,
      results: contentFilterService.filterContent(this.removeDuplicates(combinedResults))
    };
  }

  async searchMovies(query: string, page: number = 1): Promise<APIResponse<Movie>> {
    const encodedQuery = encodeURIComponent(query);
    const [spanishResults, englishResults] = await Promise.all([
      this.fetchData(`/search/movie?query=${encodedQuery}&language=es-ES&page=${page}&include_adult=false`),
      this.fetchData(`/search/movie?query=${encodedQuery}&language=en-US&page=${page}&include_adult=false`)
    ]);
    
    const combinedResults = [
      ...spanishResults.results,
      ...englishResults.results.filter(movie => 
        !spanishResults.results.some(spanishMovie => spanishMovie.id === movie.id)
      )
    ];
    
    return {
      ...spanishResults,
      results: contentFilterService.filterContent(this.removeDuplicates(combinedResults))
    };
  }

  async getMovieDetails(id: number): Promise<MovieDetails | null> {
    try {
      const spanishDetails = await this.fetchData<MovieDetails | null>(`/movie/${id}?language=es-ES&append_to_response=credits,videos,images`, true);
      if (spanishDetails) {
        return spanishDetails;
      }
    } catch (error) {
      console.warn(`Spanish details not available for movie ${id}, trying English`);
    }
    
    const englishDetails = await this.fetchData<MovieDetails | null>(`/movie/${id}?language=en-US&append_to_response=credits,videos,images`, true);
    if (englishDetails) {
      return englishDetails;
    }
    
    return null;
  }

  async getMovieVideos(id: number): Promise<{ results: Video[] }> {
    return this.getVideosWithFallback(`/movie/${id}/videos`);
  }

  async getMovieCredits(id: number): Promise<Cast> {
    const credits = await this.fetchData<Cast | null>(`/movie/${id}/credits?language=es-ES`, true);
    return credits || { cast: [], crew: [] };
  }

  // TV Shows - Métodos mejorados
  async getPopularTVShows(page: number = 1): Promise<APIResponse<TVShow>> {
    const [spanishResults, englishResults, airingTodayResults] = await Promise.all([
      this.fetchData(`/tv/popular?language=es-ES&page=${page}&region=ES`, page === 1),
      this.fetchData(`/tv/popular?language=en-US&page=${page}&region=US`, page === 1),
      this.fetchData(`/tv/airing_today?language=es-ES&page=${page}&region=ES`, page === 1)
    ]);
    
    const combinedResults = [
      ...spanishResults.results,
      ...englishResults.results.filter(show => 
        !spanishResults.results.some(spanishShow => spanishShow.id === show.id)
      ),
      ...airingTodayResults.results.filter(show => 
        !spanishResults.results.some(spanishShow => spanishShow.id === show.id) &&
        !englishResults.results.some(englishShow => englishShow.id === show.id)
      )
    ];
    
    return {
      ...spanishResults,
      results: contentFilterService.filterContent(this.removeDuplicates(combinedResults))
    };
  }

  async getTopRatedTVShows(page: number = 1): Promise<APIResponse<TVShow>> {
    const [spanishResults, englishResults] = await Promise.all([
      this.fetchData(`/tv/top_rated?language=es-ES&page=${page}&region=ES`, page === 1),
      this.fetchData(`/tv/top_rated?language=en-US&page=${page}&region=US`, page === 1)
    ]);
    
    const combinedResults = [
      ...spanishResults.results,
      ...englishResults.results.filter(show => 
        !spanishResults.results.some(spanishShow => spanishShow.id === show.id)
      )
    ];
    
    return {
      ...spanishResults,
      results: contentFilterService.filterContent(this.removeDuplicates(combinedResults))
    };
  }

  async getAiringTodayTVShows(page: number = 1): Promise<APIResponse<TVShow>> {
    const [spanishResults, englishResults] = await Promise.all([
      this.fetchData(`/tv/airing_today?language=es-ES&page=${page}&region=ES`, page === 1),
      this.fetchData(`/tv/airing_today?language=en-US&page=${page}&region=US`, page === 1)
    ]);
    
    const combinedResults = [
      ...spanishResults.results,
      ...englishResults.results.filter(show => 
        !spanishResults.results.some(spanishShow => spanishShow.id === show.id)
      )
    ];
    
    return {
      ...spanishResults,
      results: contentFilterService.filterContent(this.removeDuplicates(combinedResults))
    };
  }

  async getOnTheAirTVShows(page: number = 1): Promise<APIResponse<TVShow>> {
    const [spanishResults, englishResults] = await Promise.all([
      this.fetchData(`/tv/on_the_air?language=es-ES&page=${page}&region=ES`, page === 1),
      this.fetchData(`/tv/on_the_air?language=en-US&page=${page}&region=US`, page === 1)
    ]);
    
    const combinedResults = [
      ...spanishResults.results,
      ...englishResults.results.filter(show => 
        !spanishResults.results.some(spanishShow => spanishShow.id === show.id)
      )
    ];
    
    return {
      ...spanishResults,
      results: contentFilterService.filterContent(this.removeDuplicates(combinedResults))
    };
  }

  async searchTVShows(query: string, page: number = 1): Promise<APIResponse<TVShow>> {
    const encodedQuery = encodeURIComponent(query);
    const [spanishResults, englishResults] = await Promise.all([
      this.fetchData(`/search/tv?query=${encodedQuery}&language=es-ES&page=${page}&include_adult=false`),
      this.fetchData(`/search/tv?query=${encodedQuery}&language=en-US&page=${page}&include_adult=false`)
    ]);
    
    const combinedResults = [
      ...spanishResults.results,
      ...englishResults.results.filter(show => 
        !spanishResults.results.some(spanishShow => spanishShow.id === show.id)
      )
    ];
    
    return {
      ...spanishResults,
      results: contentFilterService.filterContent(this.removeDuplicates(combinedResults))
    };
  }

  async getTVShowDetails(id: number): Promise<TVShowDetails | null> {
    try {
      const spanishDetails = await this.fetchData<TVShowDetails | null>(`/tv/${id}?language=es-ES&append_to_response=credits,videos,images`, true);
      if (spanishDetails) {
        return spanishDetails;
      }
    } catch (error) {
      console.warn(`Spanish details not available for TV show ${id}, trying English`);
    }
    
    const englishDetails = await this.fetchData<TVShowDetails | null>(`/tv/${id}?language=en-US&append_to_response=credits,videos,images`, true);
    if (englishDetails) {
      return englishDetails;
    }
    
    return null;
  }

  async getTVShowVideos(id: number): Promise<{ results: Video[] }> {
    return this.getVideosWithFallback(`/tv/${id}/videos`);
  }

  async getTVShowCredits(id: number): Promise<Cast> {
    const credits = await this.fetchData<Cast | null>(`/tv/${id}/credits?language=es-ES`, true);
    return credits || { cast: [], crew: [] };
  }

  // Anime - Métodos mejorados con múltiples fuentes
  async getPopularAnime(page: number = 1): Promise<APIResponse<TVShow>> {
    return this.fetchData(`/discover/tv?with_origin_country=JP&with_genres=16&language=es-ES&page=${page}&sort_by=popularity.desc&include_adult=false`, page === 1);
  }

  async getTopRatedAnime(page: number = 1): Promise<APIResponse<TVShow>> {
    return this.fetchData(`/discover/tv?with_origin_country=JP&with_genres=16&language=es-ES&page=${page}&sort_by=vote_average.desc&vote_count.gte=100&include_adult=false`, page === 1);
  }

  async searchAnime(query: string, page: number = 1): Promise<APIResponse<TVShow>> {
    const encodedQuery = encodeURIComponent(query);
    return this.fetchData(`/search/tv?query=${encodedQuery}&language=es-ES&page=${page}&with_genres=16&with_origin_country=JP`);
  }

  async getAnimeFromMultipleSources(page: number = 1): Promise<APIResponse<TVShow>> {
    try {
      const [japaneseAnime, animationGenre, koreanAnimation, chineseAnimation] = await Promise.all([
        this.fetchData<APIResponse<TVShow>>(`/discover/tv?with_origin_country=JP&with_genres=16&language=es-ES&page=${page}&sort_by=popularity.desc&include_adult=false`, page === 1),
        this.fetchData<APIResponse<TVShow>>(`/discover/tv?with_genres=16&language=es-ES&page=${page}&sort_by=popularity.desc&include_adult=false`, page === 1),
        this.fetchData<APIResponse<TVShow>>(`/discover/tv?with_origin_country=KR&with_genres=16&language=es-ES&page=${page}&sort_by=popularity.desc&include_adult=false`, page === 1),
        this.fetchData<APIResponse<TVShow>>(`/discover/tv?with_origin_country=CN&with_genres=16&language=es-ES&page=${page}&sort_by=popularity.desc&include_adult=false`, page === 1)
      ]);

      const combinedResults = [
        ...japaneseAnime.results,
        ...animationGenre.results.filter(item => 
          !japaneseAnime.results.some(jp => jp.id === item.id)
        ),
        ...koreanAnimation.results.filter(item => 
          !japaneseAnime.results.some(jp => jp.id === item.id) &&
          !animationGenre.results.some(an => an.id === item.id)
        ),
        ...chineseAnimation.results.filter(item => 
          !japaneseAnime.results.some(jp => jp.id === item.id) &&
          !animationGenre.results.some(an => an.id === item.id) &&
          !koreanAnimation.results.some(kr => kr.id === item.id)
        )
      ];

      return {
        ...japaneseAnime,
        results: contentFilterService.filterContent(this.removeDuplicates(combinedResults))
      };
    } catch (error) {
      console.error('Error fetching anime from multiple sources:', error);
      return this.getPopularAnime(page);
    }
  }

  // Géneros
  async getMovieGenres(): Promise<{ genres: Genre[] }> {
    return this.fetchData('/genre/movie/list?language=es-ES', true);
  }

  async getTVGenres(): Promise<{ genres: Genre[] }> {
    return this.fetchData('/genre/tv/list?language=es-ES', true);
  }

  // Búsqueda múltiple mejorada
  async searchMulti(query: string, page: number = 1): Promise<APIResponse<Movie | TVShow>> {
    const encodedQuery = encodeURIComponent(query);
    const [spanishResults, englishResults, personResults] = await Promise.all([
      this.fetchData(`/search/multi?query=${encodedQuery}&language=es-ES&page=${page}&include_adult=false`),
      this.fetchData(`/search/multi?query=${encodedQuery}&language=en-US&page=${page}&include_adult=false`),
      this.fetchData(`/search/person?query=${encodedQuery}&language=es-ES&page=${page}&include_adult=false`)
    ]);
    
    let personContent: (Movie | TVShow)[] = [];
    if (personResults.results.length > 0) {
      personContent = personResults.results.flatMap(person => 
        person.known_for || []
      );
    }
    
    const combinedResults = [
      ...spanishResults.results,
      ...englishResults.results.filter(item => 
        !spanishResults.results.some(spanishItem => spanishItem.id === item.id)
      ),
      ...personContent.filter(item => 
        !spanishResults.results.some(spanishItem => spanishItem.id === item.id) &&
        !englishResults.results.some(englishItem => englishItem.id === item.id)
      )
    ];
    
    return {
      ...spanishResults,
      results: contentFilterService.filterContent(this.removeDuplicates(combinedResults))
    };
  }

  // Contenido trending con sincronización en tiempo real
  async getTrendingAll(timeWindow: 'day' | 'week' = 'day', page: number = 1): Promise<APIResponse<Movie | TVShow>> {
    const [globalTrending, spanishTrending, usTrending] = await Promise.all([
      this.fetchData(`/trending/all/${timeWindow}?page=${page}`, page === 1),
      this.fetchData(`/trending/all/${timeWindow}?language=es-ES&page=${page}&region=ES`, page === 1),
      this.fetchData(`/trending/all/${timeWindow}?language=en-US&page=${page}&region=US`, page === 1)
    ]);
    
    const combinedResults = [
      ...globalTrending.results,
      ...spanishTrending.results.filter(item => 
        !globalTrending.results.some(globalItem => globalItem.id === item.id)
      ),
      ...usTrending.results.filter(item => 
        !globalTrending.results.some(globalItem => globalItem.id === item.id) &&
        !spanishTrending.results.some(spanishItem => spanishItem.id === item.id)
      )
    ];
    
    return {
      ...globalTrending,
      results: contentFilterService.filterContent(this.removeDuplicates(combinedResults))
    };
  }

  async getTrendingMovies(timeWindow: 'day' | 'week' = 'day', page: number = 1): Promise<APIResponse<Movie>> {
    const response = await this.fetchData<APIResponse<Movie>>(`/trending/movie/${timeWindow}?language=es-ES&page=${page}`, page === 1);
    return {
      ...response,
      results: contentFilterService.filterContent(response.results)
    };
  }

  async getTrendingTV(timeWindow: 'day' | 'week' = 'day', page: number = 1): Promise<APIResponse<TVShow>> {
    const response = await this.fetchData<APIResponse<TVShow>>(`/trending/tv/${timeWindow}?language=es-ES&page=${page}`, page === 1);
    return {
      ...response,
      results: contentFilterService.filterContent(response.results)
    };
  }

  // Descubrimiento mejorado de contenido
  async getDiscoverMovies(params: {
    genre?: number;
    year?: number;
    sortBy?: string;
    page?: number;
  } = {}): Promise<APIResponse<Movie>> {
    const { genre, year, sortBy = 'popularity.desc', page = 1 } = params;
    let endpoint = `/discover/movie?language=es-ES&page=${page}&sort_by=${sortBy}&include_adult=false`;
    
    if (genre) endpoint += `&with_genres=${genre}`;
    if (year) endpoint += `&year=${year}`;
    
    const response = await this.fetchData<APIResponse<Movie>>(endpoint);
    return {
      ...response,
      results: contentFilterService.filterContent(response.results)
    };
  }

  async getDiscoverTVShows(params: {
    genre?: number;
    year?: number;
    sortBy?: string;
    page?: number;
    country?: string;
  } = {}): Promise<APIResponse<TVShow>> {
    const { genre, year, sortBy = 'popularity.desc', page = 1, country } = params;
    let endpoint = `/discover/tv?language=es-ES&page=${page}&sort_by=${sortBy}&include_adult=false`;
    
    if (genre) endpoint += `&with_genres=${genre}`;
    if (year) endpoint += `&first_air_date_year=${year}`;
    if (country) endpoint += `&with_origin_country=${country}`;
    
    const response = await this.fetchData<APIResponse<TVShow>>(endpoint);
    return {
      ...response,
      results: contentFilterService.filterContent(response.results)
    };
  }

  // Utilidades
  removeDuplicates<T extends { id: number }>(items: T[]): T[] {
    const seen = new Set<number>();
    return items.filter(item => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }

  // Contenido hero con sincronización diaria
  async getHeroContent(): Promise<(Movie | TVShow)[]> {
    try {
      const [trendingDay, trendingWeek, popularMovies, popularTV, nowPlayingMovies, airingTodayTV] = await Promise.all([
        this.getTrendingAll('day', 1),
        this.getTrendingAll('week', 1),
        this.getPopularMovies(1),
        this.getPopularTVShows(1),
        this.getNowPlayingMovies(1),
        this.getAiringTodayTVShows(1)
      ]);

      const combinedItems = [
        ...trendingDay.results.slice(0, 6),
        ...trendingWeek.results.slice(0, 4),
        ...nowPlayingMovies.results.slice(0, 3),
        ...airingTodayTV.results.slice(0, 3),
        ...popularMovies.results.slice(0, 2),
        ...popularTV.results.slice(0, 2)
      ];

      return contentFilterService.filterContent(this.removeDuplicates(combinedItems)).slice(0, 12);
    } catch (error) {
      console.error('Error fetching hero content:', error);
      return [];
    }
  }

  // Búsqueda de personas mejorada
  async searchPeople(query: string, page: number = 1): Promise<any> {
    const encodedQuery = encodeURIComponent(query);
    return this.fetchData(`/search/person?query=${encodedQuery}&language=es-ES&page=${page}&include_adult=false`);
  }

  async getPersonDetails(id: number): Promise<any> {
    try {
      const [personDetails, movieCredits, tvCredits] = await Promise.all([
        this.fetchData(`/person/${id}?language=es-ES`),
        this.fetchData(`/person/${id}/movie_credits?language=es-ES`),
        this.fetchData(`/person/${id}/tv_credits?language=es-ES`)
      ]);
      
      return {
        ...personDetails,
        movie_credits: movieCredits,
        tv_credits: tvCredits
      };
    } catch (error) {
      console.error(`Error fetching person details for ${id}:`, error);
      throw error;
    }
  }

  // Forzar actualización completa
  async forceRefreshAllContent(): Promise<void> {
    this.clearCache();
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('fresh_') || key.includes('trending') || key.includes('popular')) {
        localStorage.removeItem(key);
      }
    });
    
    // Resetear timestamp de sincronización
    this.lastDailySync = null;
    
    // Forzar sincronización inmediata
    await this.performDailyContentSync();
    
    console.log('All content caches cleared and refreshed');
  }

  // Obtener videos en lotes
  async batchFetchVideos(items: { id: number; type: 'movie' | 'tv' }[]): Promise<Map<string, Video[]>> {
    const videoMap = new Map<string, Video[]>();
    
    try {
      const videoPromises = items.map(async (item) => {
        const key = `${item.type}-${item.id}`;
        try {
          const videos = item.type === 'movie' 
            ? await this.getMovieVideos(item.id)
            : await this.getTVShowVideos(item.id);
          
          const trailers = videos.results.filter(
            video => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
          );
          
          return { key, videos: trailers };
        } catch (error) {
          console.warn(`No videos available for ${key}`);
          return { key, videos: [] };
        }
      });

      const results = await Promise.allSettled(videoPromises);
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { key, videos } = result.value;
          videoMap.set(key, videos);
        }
      });
    } catch (error) {
      console.error('Error in batch fetch videos:', error);
    }
    
    return videoMap;
  }

  // Limpiar caché
  clearCache(): void {
    apiService.clearCache();
  }

  // Estadísticas de caché
  getCacheStats(): { size: number; items: { key: string; age: number }[] } {
    return {
      size: apiService.getCacheSize(),
      items: apiService.getCacheInfo()
    };
  }

  // Sincronización completa de todo el contenido
  async syncAllContent(): Promise<{
    movies: Movie[];
    tvShows: TVShow[];
    anime: TVShow[];
    trending: (Movie | TVShow)[];
  }> {
    try {
      const [
        popularMovies,
        topRatedMovies,
        upcomingMovies,
        nowPlayingMovies,
        popularTV,
        topRatedTV,
        airingTodayTV,
        onTheAirTV,
        popularAnime,
        topRatedAnime,
        trendingDay,
        trendingWeek
      ] = await Promise.all([
        this.getPopularMovies(1),
        this.getTopRatedMovies(1),
        this.getUpcomingMovies(1),
        this.getNowPlayingMovies(1),
        this.getPopularTVShows(1),
        this.getTopRatedTVShows(1),
        this.getAiringTodayTVShows(1),
        this.getOnTheAirTVShows(1),
        this.getAnimeFromMultipleSources(1),
        this.getTopRatedAnime(1),
        this.getTrendingAll('day', 1),
        this.getTrendingAll('week', 1)
      ]);

      const movies = this.removeDuplicates([
        ...popularMovies.results,
        ...topRatedMovies.results,
        ...upcomingMovies.results,
        ...nowPlayingMovies.results
      ]);

      const tvShows = this.removeDuplicates([
        ...popularTV.results,
        ...topRatedTV.results,
        ...airingTodayTV.results,
        ...onTheAirTV.results
      ]);

      const anime = this.removeDuplicates([
        ...popularAnime.results,
        ...topRatedAnime.results
      ]);

      const trending = this.removeDuplicates([
        ...trendingDay.results,
        ...trendingWeek.results
      ]);

      return { movies, tvShows, anime, trending };
    } catch (error) {
      console.error('Error syncing all content:', error);
      return { movies: [], tvShows: [], anime: [], trending: [] };
    }
  }

  // Destructor para limpiar intervalos
  destroy() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }
  }
}

export const tmdbService = new TMDBService();