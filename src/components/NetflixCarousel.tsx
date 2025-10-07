import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NetflixCarouselProps {
  children: React.ReactNode[];
  itemsPerView?: number;
}

export function NetflixCarousel({ children, itemsPerView = 5 }: NetflixCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const itemsToShow = Math.min(itemsPerView, children.length);
  const maxIndex = Math.max(0, children.length - itemsToShow);

  useEffect(() => {
    setCanScrollLeft(currentIndex > 0);
    setCanScrollRight(currentIndex < maxIndex);
  }, [currentIndex, maxIndex]);

  const scrollLeft = () => {
    if (isTransitioning || currentIndex === 0) return;
    setIsTransitioning(true);
    setCurrentIndex(Math.max(0, currentIndex - itemsToShow));
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const scrollRight = () => {
    if (isTransitioning || currentIndex >= maxIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(Math.min(maxIndex, currentIndex + itemsToShow));
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const itemWidth = 100 / itemsToShow;
  const translateX = -(currentIndex * itemWidth);

  return (
    <div className="relative group">
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-r from-gray-50 to-transparent flex items-center justify-start pl-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <div className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all transform hover:scale-110">
            <ChevronLeft className="h-6 w-6 text-gray-900" />
          </div>
        </button>
      )}

      <div className="overflow-hidden" ref={carouselRef}>
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(${translateX}%)` }}
        >
          {children.map((child, index) => (
            <div
              key={index}
              className="flex-shrink-0 px-2"
              style={{ width: `${itemWidth}%` }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-l from-gray-50 to-transparent flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <div className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all transform hover:scale-110">
            <ChevronRight className="h-6 w-6 text-gray-900" />
          </div>
        </button>
      )}
    </div>
  );
}
