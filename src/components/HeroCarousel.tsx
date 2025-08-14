import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star, Calendar, Play, Pause } from 'lucide-react';
import { IMAGE_BASE_URL, BACKDROP_SIZE } from '../config/api';
import type { Movie, TVShow } from '../types/movie';

interface HeroCarouselProps {
  items: (Movie | TVShow)[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);

  const AUTOPLAY_INTERVAL = 6000; // 6 seconds

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? items.length - 1 : prevIndex - 1
    );
    setProgress(0);
  }, [items.length, isTransitioning]);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    setProgress(0);
  }, [items.length, isTransitioning]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setProgress(0);
  }, [currentIndex, isTransitioning]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      } else if (event.key === ' ') {
        event.preventDefault();
        setIsAutoPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToPrevious, goToNext]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || items.length <= 1) return;

    const interval = setInterval(() => {
      goToNext();
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(interval);
  }, [isAutoPlaying, items.length, goToNext]);

  // Progress bar animation
  useEffect(() => {
    if (!isAutoPlaying || items.length <= 1) return;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / AUTOPLAY_INTERVAL) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        requestAnimationFrame(animate);
      }
    };

    const animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [currentIndex, isAutoPlaying, items.length]);

  // Reset transition state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];
  const title = 'title' in currentItem ? currentItem.title : currentItem.name;
  const releaseDate = 'release_date' in currentItem ? currentItem.release_date : currentItem.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';

  return (
    <div className="relative h-96 md:h-[600px] overflow-hidden group">
      {/* Background Images with Parallax Effect */}
      <div className="absolute inset-0">
        {items.map((item, index) => {
          const itemBackdrop = item.backdrop_path
            ? `${IMAGE_BASE_URL}/${BACKDROP_SIZE}${item.backdrop_path}`
            : 'https://images.unsplash.com/photo-1489599843253-c76cc4bcb8cf?w=1280&h=720&fit=crop&crop=center';
          
          const isActive = index === currentIndex;
          const isPrev = index === (currentIndex - 1 + items.length) % items.length;
          const isNext = index === (currentIndex + 1) % items.length;
          
          return (
            <div
              key={item.id}
              className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out transform ${
                isActive 
                  ? 'opacity-100 scale-100' 
                  : isPrev 
                    ? 'opacity-0 scale-105 -translate-x-full' 
                    : isNext 
                      ? 'opacity-0 scale-105 translate-x-full'
                      : 'opacity-0 scale-110'
              }`}
              style={{ backgroundImage: `url(${itemBackdrop})` }}
            />
          );
        })}
      </div>

      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/30" />

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        disabled={isTransitioning}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-md hover:bg-white/20 disabled:opacity-50 text-white p-4 rounded-full transition-all duration-300 hover:scale-110 z-20 opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <button
        onClick={goToNext}
        disabled={isTransitioning}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/10 backdrop-blur-md hover:bg-white/20 disabled:opacity-50 text-white p-4 rounded-full transition-all duration-300 hover:scale-110 z-20 opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Auto-play Control */}
      <button
        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
        className="absolute top-6 right-6 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 z-20 opacity-0 group-hover:opacity-100"
      >
        {isAutoPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>

      {/* Content with Slide Animation */}
      <div className="relative h-full flex items-end z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-12 w-full">
          <div className="max-w-3xl">
            <div className={`transform transition-all duration-700 ${
              isTransitioning ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
            }`}>
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                {title}
              </h2>
              
              <div className="flex items-center space-x-6 text-white/90 mb-6">
                <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-2" />
                  <span className="font-semibold text-lg">{currentItem.vote_average?.toFixed(1) || 'N/A'}</span>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span className="font-medium">{year}</span>
                </div>
              </div>
              
              <p className="text-white/85 text-xl leading-relaxed mb-8 line-clamp-3 max-w-2xl">
                {currentItem.overview || 'Sin descripción disponible.'}
              </p>

              <div className="flex space-x-4">
                <button className="bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-white/90 transition-all duration-300 hover:scale-105 flex items-center">
                  <Play className="h-5 w-5 mr-2" />
                  Ver Ahora
                </button>
                <button className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold hover:bg-white/30 transition-all duration-300 hover:scale-105">
                  Más Info
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`relative transition-all duration-300 ${
              index === currentIndex
                ? 'w-12 h-3'
                : 'w-3 h-3 hover:w-6'
            }`}
          >
            <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white'
                : 'bg-white/40 hover:bg-white/60'
            }`} />
            {index === currentIndex && isAutoPlaying && (
              <div 
                className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-8 right-8 bg-black/30 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium z-20">
        {currentIndex + 1} / {items.length}
      </div>
    </div>
  );
}