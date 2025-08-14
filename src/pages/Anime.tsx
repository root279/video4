import React, { useState, useEffect } from 'react';
import { tmdbService } from '../services/tmdb';
import { MovieCard } from '../components/MovieCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import type { TVShow } from '../types/movie';

export function Anime() {
  const [animeList, setAnimeList] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchAnime = async (pageNum: number, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      
      const response = await tmdbService.getPopularAnime(pageNum);

      if (append) {
        setAnimeList(prev => [...prev, ...response.results]);
      } else {
        setAnimeList(response.results);
      }
      
      setHasMore(pageNum < response.total_pages);
    } catch (err) {
      setError('Error al cargar el anime. Por favor, intenta de nuevo.');
      console.error('Error fetching anime:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnime(1, false);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAnime(nextPage, true);
  };

  if (loading && animeList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && animeList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <span className="mr-3 text-4xl">🎌</span>
            <h1 className="text-3xl font-bold text-gray-900">Anime Popular</h1>
          </div>
          <p className="text-gray-600">
            Descubre los mejores animes japoneses más populares y mejor valorados.
          </p>
        </div>

        {/* Anime Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
          {animeList.map((anime) => (
            <MovieCard key={anime.id} item={anime} type="tv" />
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Cargando...' : 'Cargar más anime'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}