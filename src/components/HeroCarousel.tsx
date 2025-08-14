import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Calendar } from 'lucide-react';
import { IMAGE_BASE_URL, BACKDROP_SIZE } from '../config/api';
import type { Movie, TVShow } from '../types/movie';

interface HeroCarouselProps {
  items: (Movie | TVShow)[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? items.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [items.length]);

  useEffect(() => {
    if (!isAutoPlaying || items.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [items.length, isAutoPlaying]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];
  const title = 'title' in currentItem ? currentItem.title : currentItem.name;
  const releaseDate = 'release_date' in currentItem ? currentItem.release_date : currentItem.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
  
  const backdropUrl = currentItem.backdrop_path
    ? `${IMAGE_BASE_URL}/${BACKDROP_SIZE}${currentItem.backdrop_path}`
    : 'https://images.unsplash.com/photo-1489599843253-c76cc4bcb8cf?w=1280&h=720&fit=crop&crop=center';

  return (
    <div 
      className="relative h-96 md:h-[500px] overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background Images */}
      <div className="absolute inset-0">
        {items.map((item, index) => {
          const itemBackdrop = item.backdrop_path
            ? `${IMAGE_BASE_URL}/${BACKDROP_SIZE}${item.backdrop_path}`
            : 'https://images.unsplash.com/photo-1489599843253-c76cc4bcb8cf?w=1280&h=720&fit=crop&crop=center';
          
          return (
            <div
              key={item.id}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ backgroundImage: `url(${itemBackdrop})` }}
            />
          );
        })}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 z-10"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 z-10"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Content */}
      <div className="relative h-full flex items-end z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 transform transition-all duration-500">
              {title}
            </h2>
            
            <div className="flex items-center space-x-4 text-white/90 mb-4">
              <div className="flex items-center">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-medium">{currentItem.vote_average?.toFixed(1) || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-1" />
                <span>{year}</span>
              </div>
            </div>
            
            <p className="text-white/80 text-lg leading-relaxed mb-6 line-clamp-3">
              {currentItem.overview || 'Sin descripción disponible.'}
            </p>
          </div>
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white scale-125'
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-pink-400 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
        />
      </div>
    </div>
  );
}