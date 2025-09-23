import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, TrendingUp, Star, Monitor, Filter, Calendar, Clock, Flame, Library, Play, Clapperboard, Sparkles } from 'lucide-react';
import { tmdbService } from '../services/tmdb';
import { useCart } from '../context/CartContext';
import { useAdmin } from '../context/AdminContext';
import { MovieCard } from '../components/MovieCard';
import { NovelCard } from '../components/NovelCard';
import { HeroCarousel } from '../components/HeroCarousel';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { NovelasModal } from '../components/NovelasModal';
import type { Movie, TVShow } from '../types/movie';

type TrendingTimeWindow = 'day' | 'week';

export function Home() {
  const { state: adminState, addNotification } = useAdmin();
  const { getCurrentPrices } = useCart();
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<TVShow[]>([]);
  const [popularAnime, setPopularAnime] = useState<TVShow[]>([]);
  const [trendingContent, setTrendingContent] = useState<(Movie | TVShow)[]>([]);
  const [novelsInTransmission, setNovelsInTransmission] = useState<any[]>([]);
  const [novelsFinished, setNovelsFinished] = useState<any[]>([]);
  const [heroItems, setHeroItems] = useState<(Movie | TVShow)[]>([]);
  const [trendingTimeWindow, setTrendingTimeWindow] = useState<TrendingTimeWindow>('day');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showNovelasModal, setShowNovelasModal] = useState(false);

  const currentPrices = getCurrentPrices();
  const timeWindowLabels = {
    day: 'Hoy + Novelas en Transmisión',
    week: 'Esta Semana + Novelas Finalizadas'
  };

  // Sincronizar novelas con el panel de administración
  const syncNovelsFromAdmin = () => {
    const novels = adminState.novels || [];
    
    // Separar novelas por estado
    const inTransmission = novels.filter(novel => novel.estado === 'transmision');
    const finished = novels.filter(novel => novel.estado === 'finalizada');
    
    setNovelsInTransmission(inTransmission);
    setNovelsFinished(finished);
  };

  // Escuchar cambios del panel de administración
  useEffect(() => {
    const handleAdminStateChange = (event: CustomEvent) => {
      if (event.detail.type === 'novel_add' || 
          event.detail.type === 'novel_update' || 
          event.detail.type === 'novel_delete') {
        syncNovelsFromAdmin();
      }
    };

    const handleAdminFullSync = (event: CustomEvent) => {
      if (event.detail.config?.novels) {
        syncNovelsFromAdmin();
      }
    };

    window.addEventListener('admin_state_change', handleAdminStateChange as EventListener);
    window.addEventListener('admin_full_sync', handleAdminFullSync as EventListener);

    // Sincronización inicial
    syncNovelsFromAdmin();

    return () => {
      window.removeEventListener('admin_state_change', handleAdminStateChange as EventListener);
      window.removeEventListener('admin_full_sync', handleAdminFullSync as EventListener);
    };
  }, [adminState.novels]);

  const fetchTrendingContent = async (timeWindow: TrendingTimeWindow) => {
    try {
      const response = await tmdbService.getTrendingAll(timeWindow, 1);
      const uniqueContent = tmdbService.removeDuplicates(response.results);
      setTrendingContent(uniqueContent.slice(0, 12));
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching trending content:', err);
    }
  };

  const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
      'Turquía': '🇹🇷',
      'México': '🇲🇽',
      'Brasil': '🇧🇷',
      'Colombia': '🇨🇴',
      'Argentina': '🇦🇷',
      'España': '🇪🇸',
      'Estados Unidos': '🇺🇸',
      'Corea del Sur': '🇰🇷',
      'India': '🇮🇳',
      'Reino Unido': '🇬🇧',
      'Francia': '🇫🇷',
      'Italia': '🇮🇹',
      'Alemania': '🇩🇪',
      'Japón': '🇯🇵',
      'China': '🇨🇳',
      'Rusia': '🇷🇺'
    };
    return flags[country] || '🌍';
  };

  const fetchAllContent = async () => {
    try {
      setLoading(true);
      
      // Get hero content first (no duplicates)
      const heroContent = await tmdbService.getHeroContent();
      setHeroItems(heroContent);
      
      // Get trending content
      const trendingResponse = await tmdbService.getTrendingAll(trendingTimeWindow, 1);
      const uniqueTrending = tmdbService.removeDuplicates(trendingResponse.results);
      setTrendingContent(uniqueTrending.slice(0, 12));
      
      // Get other content, excluding items already in hero and trending
      const usedIds = new Set([
        ...heroContent.map(item => item.id),
        ...uniqueTrending.slice(0, 12).map(item => item.id)
      ]);
      
      // Get comprehensive content including current releases
      const [moviesRes, tvRes, animeRes, nowPlayingRes, airingTodayRes] = await Promise.all([
        tmdbService.getPopularMovies(1),
        tmdbService.getPopularTVShows(1),
        tmdbService.getAnimeFromMultipleSources(1),
        tmdbService.getNowPlayingMovies(1),
        tmdbService.getAiringTodayTVShows(1)
      ]);

      // Combine and filter out duplicates, prioritizing current content
      const allMovies = [
        ...nowPlayingRes.results,
        ...moviesRes.results.filter(movie => !nowPlayingRes.results.some(np => np.id === movie.id))
      ];
      const allTVShows = [
        ...airingTodayRes.results,
        ...tvRes.results.filter(show => !airingTodayRes.results.some(at => at.id === show.id))
      ];
      
      const filteredMovies = allMovies.filter(movie => !usedIds.has(movie.id)).slice(0, 8);
      const filteredTVShows = allTVShows.filter(show => !usedIds.has(show.id)).slice(0, 8);
      const filteredAnime = animeRes.results.filter(anime => !usedIds.has(anime.id)).slice(0, 8);

      setPopularMovies(filteredMovies);
      setPopularTVShows(filteredTVShows);
      setPopularAnime(filteredAnime);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Error al cargar el contenido. Por favor, intenta de nuevo.');
      console.error('Error fetching home data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllContent();
  }, []);

  useEffect(() => {
    fetchTrendingContent(trendingTimeWindow);
  }, [trendingTimeWindow]);

  // Auto-refresh content daily and weekly
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Set initial timeout for midnight
    const midnightTimeout = setTimeout(() => {
      fetchAllContent();
      
      // Then set daily interval
      const dailyInterval = setInterval(() => {
        fetchAllContent();
      }, 24 * 60 * 60 * 1000); // 24 hours
      
      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);

    // Weekly refresh on Sundays
    const weeklyInterval = setInterval(() => {
      const currentDay = new Date().getDay();
      if (currentDay === 0) { // Sunday
        fetchAllContent();
      }
    }, 24 * 60 * 60 * 1000); // Check daily for Sunday

    return () => {
      clearTimeout(midnightTimeout);
      clearInterval(weeklyInterval);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Carousel */}
      <HeroCarousel items={heroItems} />
      
      {/* Call to Action Section */}
      <section className="bg-gradient-to-r from-blue-900 via-purple-900 to-pink-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Descubre el Mundo del
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-400">
              {' '}Entretenimiento
            </span>
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Explora miles de películas, animes, series ilimitadas y mucho más. Encuentra tus favoritos y agrégalos a tu carrito.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/movies"
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center"
            >
              <Clapperboard className="mr-2 h-5 w-5" />
              Explorar Películas
            </Link>
            <Link
              to="/tv"
              className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center"
            >
              <Monitor className="mr-2 h-5 w-5" />
              Ver Series
            </Link>
            <button
              onClick={() => setShowNovelasModal(true)}
              className="bg-pink-600 hover:bg-pink-700 px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center"
            >
              <Library className="mr-2 h-5 w-5" />
              Catálogo de Novelas
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Trending Content */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Flame className="mr-2 h-6 w-6 text-red-500" />
              En Tendencia
            </h2>
            
            {/* Trending Filter */}
            <div className="flex items-center space-x-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
              <Filter className="h-4 w-4 text-gray-500 ml-2" />
              <span className="text-sm font-medium text-gray-700 px-2">Período:</span>
              {Object.entries(timeWindowLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTrendingTimeWindow(key as TrendingTimeWindow)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 flex items-center ${
                    trendingTimeWindow === key
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md transform scale-105'
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  {key === 'day' ? <Calendar className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Movies and TV Shows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {trendingContent.map((item) => {
              const itemType = 'title' in item ? 'movie' : 'tv';
              return (
                <MovieCard key={`trending-${itemType}-${item.id}`} item={item} type={itemType} />
              );
            })}
          </div>
        </section>

        {/* Novelas en Transmisión - Solo cuando timeWindow es 'day' */}
        {trendingTimeWindow === 'day' && novelsInTransmission.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="bg-gradient-to-r from-red-500 to-pink-500 p-2 rounded-xl mr-3 shadow-lg">
                  <span className="text-white text-lg">📡</span>
                </div>
                Novelas en Transmisión
              </h2>
              <button
                onClick={() => setShowNovelasModal(true)}
                className="text-red-600 hover:text-red-800 flex items-center font-medium"
              >
                Ver catálogo completo
                <ChevronRight className="ml-1 h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {novelsInTransmission.map((novel) => (
                <NovelCard key={`novel-transmission-${novel.id}`} novel={novel} />
              ))}
            </div>
            
            <div className="text-center mt-8">
              <button
                onClick={() => setShowNovelasModal(true)}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center mx-auto"
              >
                <Library className="mr-2 h-5 w-5" />
                Ver Todas las Novelas en Transmisión
              </button>
              <p className="text-sm text-gray-600 mt-3 max-w-md mx-auto">
                {novelsInTransmission.length} novelas actualmente en transmisión
              </p>
              <div className="mt-4 text-xs text-gray-500 bg-red-50 rounded-lg p-3 max-w-lg mx-auto border border-red-200">
                <span className="font-medium">📡 En Vivo:</span> Estas novelas se están transmitiendo actualmente. 
                Precio: ${currentPrices.novelPricePerChapter} CUP por capítulo.
              </div>
            </div>
          </section>
        )}

        {/* Novelas Finalizadas - Solo cuando timeWindow es 'week' */}
        {trendingTimeWindow === 'week' && novelsFinished.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-xl mr-3 shadow-lg">
                  <span className="text-white text-lg">✅</span>
                </div>
                Novelas Finalizadas
              </h2>
              <button
                onClick={() => setShowNovelasModal(true)}
                className="text-green-600 hover:text-green-800 flex items-center font-medium"
              >
                Ver catálogo completo
                <ChevronRight className="ml-1 h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {novelsFinished.map((novel) => (
                <NovelCard key={`novel-finished-${novel.id}`} novel={novel} />
              ))}
            </div>
            
            <div className="text-center mt-8">
              <button
                onClick={() => setShowNovelasModal(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 flex items-center mx-auto"
              >
                <Library className="mr-2 h-5 w-5" />
                Ver Todas las Novelas Finalizadas
              </button>
              <p className="text-sm text-gray-600 mt-3 max-w-md mx-auto">
                {novelsFinished.length} novelas finalizadas disponibles
              </p>
              <div className="mt-4 text-xs text-gray-500 bg-green-50 rounded-lg p-3 max-w-lg mx-auto border border-green-200">
                <span className="font-medium">✅ Completas:</span> Estas novelas están finalizadas y disponibles completas. 
                Precio: ${currentPrices.novelPricePerChapter} CUP por capítulo.
              </div>
            </div>
          </section>
        )}

        {/* Popular Movies */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Clapperboard className="mr-2 h-6 w-6 text-blue-500" />
              Películas Destacadas
            </h2>
            <Link
              to="/movies"
              className="text-blue-600 hover:text-blue-800 flex items-center font-medium"
            >
              Ver todas
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {popularMovies.map((movie) => (
              <MovieCard key={movie.id} item={movie} type="movie" />
            ))}
          </div>
        </section>

        {/* Popular TV Shows */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Monitor className="mr-2 h-6 w-6 text-purple-500" />
              Series Destacadas
            </h2>
            <Link
              to="/tv"
              className="text-blue-600 hover:text-blue-800 flex items-center font-medium"
            >
              Ver todas
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {popularTVShows.map((show) => (
              <MovieCard key={show.id} item={show} type="tv" />
            ))}
          </div>
        </section>

        {/* Popular Anime */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Sparkles className="mr-2 h-6 w-6 text-pink-500" />
              Anime Destacado
            </h2>
            <Link
              to="/anime"
              className="text-blue-600 hover:text-blue-800 flex items-center font-medium"
            >
              Ver todos
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {popularAnime.map((anime) => (
              <MovieCard key={anime.id} item={anime} type="tv" />
            ))}
          </div>
        </section>

        {/* Last Update Info (Hidden from users) */}
        <div className="hidden">
          <p>Última actualización: {lastUpdate.toLocaleString()}</p>
        </div>
      </div>
      
      {/* Modal de Novelas */}
      <NovelasModal 
        isOpen={showNovelasModal} 
        onClose={() => setShowNovelasModal(false)} 
      />
    </div>
  );
}