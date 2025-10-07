import React, { useState } from 'react';
import { Menu, X, Flame, Clapperboard, Monitor, Sparkles, Radio, CheckCircle2 } from 'lucide-react';

export function FloatingNav() {
  const [isOpen, setIsOpen] = useState(false);

  const sections = [
    { id: 'trending', label: 'Tendencias', icon: Flame, color: 'red' },
    { id: 'novels-live', label: 'Novelas en Vivo', icon: Radio, color: 'red' },
    { id: 'novels-finished', label: 'Novelas Completas', icon: CheckCircle2, color: 'green' },
    { id: 'movies', label: 'Películas', icon: Clapperboard, color: 'blue' },
    { id: 'tv-shows', label: 'Series', icon: Monitor, color: 'purple' },
    { id: 'anime', label: 'Anime', icon: Sparkles, color: 'pink' },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      red: 'text-red-600 bg-red-50 hover:bg-red-100',
      green: 'text-green-600 bg-green-50 hover:bg-green-100',
      blue: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
      purple: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
      pink: 'text-pink-600 bg-pink-50 hover:bg-pink-100',
    };
    return colors[color] || 'text-gray-600 bg-gray-50 hover:bg-gray-100';
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl p-4 w-64 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">Ir a sección</h3>
            <div className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${getColorClasses(section.color)}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium text-sm">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
