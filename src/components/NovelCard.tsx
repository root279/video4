import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Calendar, Plus, Check, Eye, BookOpen, Globe, Monitor, CheckCircle } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';
import { useCart } from '../context/CartContext';
import { Toast } from './Toast';
import type { NovelCartItem } from '../types/movie';

interface NovelCardProps {
  novel: {
    id: number;
    titulo: string;
    genero: string;
    capitulos: number;
    año: number;
    descripcion?: string;
    pais?: string;
    imagen?: string;
    estado?: 'transmision' | 'finalizada';
  };
}

export function NovelCard({ novel }: NovelCardProps) {
  const { addNovel, removeItem, isInCart, getCurrentPrices } = useCart();
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [isHovered, setIsHovered] = React.useState(false);
  const [isAddingToCart, setIsAddingToCart] = React.useState(false);
  
  const currentPrices = getCurrentPrices();
  const inCart = isInCart(novel.id);

  const getNovelImage = (novel: any) => {
    if (novel.imagen) {
      return novel.imagen;
    }
    // Imagen por defecto basada en el género (HD quality)
    const genreImages = {
      'Drama': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop&q=90',
      'Romance': 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&h=1200&fit=crop&q=90',
      'Acción': 'https://images.unsplash.com/photo-1489599843253-c76cc4bcb8cf?w=800&h=1200&fit=crop&q=90',
      'Comedia': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=1200&fit=crop&q=90',
      'Familia': 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=1200&fit=crop&q=90'
    };

    return genreImages[novel.genero as keyof typeof genreImages] ||
           'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=1200&fit=crop&q=90';
  };

  const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
      'Turquía': '🇹🇷',
      'Cuba': '🇨🇺',
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

  const handleCartAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAddingToCart(true);
    setTimeout(() => setIsAddingToCart(false), 1000);

    if (inCart) {
      removeItem(novel.id);
      setToastMessage(`"${novel.titulo}" retirada del carrito`);
    } else {
      const novelCartItem: NovelCartItem = {
        id: novel.id,
        title: novel.titulo,
        type: 'novel',
        genre: novel.genero,
        chapters: novel.capitulos,
        year: novel.año,
        description: novel.descripcion,
        country: novel.pais,
        status: novel.estado,
        image: novel.imagen,
        paymentType: 'cash',
        pricePerChapter: currentPrices.novelPricePerChapter,
        totalPrice: novel.capitulos * currentPrices.novelPricePerChapter
      };

      addNovel(novelCartItem);
      setToastMessage(`"${novel.titulo}" agregada al carrito`);
    }
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const basePrice = novel.capitulos * currentPrices.novelPricePerChapter;

  return (
    <>
      <Link
        to={`/novel/${novel.id}`}
        className="block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`group relative rounded-md overflow-hidden transition-all duration-300 ${
            isHovered ? 'scale-105 z-50' : ''
          }`}
        >
          {/* Main Image Container - Netflix Style */}
          <div className="relative aspect-[2/3] bg-gray-900">
            <OptimizedImage
              src={getNovelImage(novel)}
              alt={novel.titulo}
              className="w-full h-full object-cover"
              lazy={true}
            />

            {/* Dark overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

            {/* Status badge - top left */}
            <div className="absolute top-2 left-2 z-10">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                novel.estado === 'transmision' ? 'bg-red-600' : 'bg-green-600'
              }`}>
                {novel.estado === 'transmision' ? 'LIVE' : 'COMPLETA'}
              </span>
            </div>

            {/* Country flag - top right */}
            <div className="absolute top-2 right-2 z-10">
              <span className="text-lg">
                {getCountryFlag(novel.pais || 'No especificado')}
              </span>
            </div>

            {/* Title overlay at bottom - Netflix Style */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
              <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 mb-1"
                  style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                {novel.titulo}
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-gray-300">
                <span>{novel.año}</span>
                <span>•</span>
                <span>{novel.capitulos} Cap</span>
              </div>
            </div>

            {/* Hover Overlay with Actions - Netflix Style */}
            <div className={`absolute inset-0 bg-black/80 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
              <div className="flex flex-col justify-between h-full p-4">
                {/* Top section */}
                <div>
                  <h3 className="font-bold text-white text-base mb-2 line-clamp-2">
                    {novel.titulo}
                  </h3>

                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[10px] font-medium">
                      {novel.genero}
                    </span>
                    <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[10px] font-medium">
                      {novel.pais || 'Internacional'}
                    </span>
                  </div>

                  <p className="text-gray-300 text-xs line-clamp-3 mb-3">
                    {novel.descripcion || 'Sin descripción disponible'}
                  </p>
                </div>

                {/* Bottom section with price and actions */}
                <div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 mb-2">
                    <div className="text-center">
                      <div className="text-white text-lg font-bold">
                        ${basePrice.toLocaleString()}
                      </div>
                      <div className="text-gray-400 text-[10px]">
                        ${currentPrices.novelPricePerChapter} × {novel.capitulos} cap.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCartAction}
                    disabled={isAddingToCart}
                    className={`w-full py-2 rounded font-medium text-xs transition-all duration-200 ${
                      inCart
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-white hover:bg-gray-200 text-black'
                    }`}
                  >
                    {inCart ? (
                      <span className="flex items-center justify-center">
                        <Check className="mr-1 h-3 w-3" />
                        En el Carrito
                      </span>
                    ) : isAddingToCart ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-black mr-1"></div>
                        Agregando...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Plus className="mr-1 h-3 w-3" />
                        Agregar
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Selection indicator */}
            {inCart && (
              <div className="absolute top-2 right-2 bg-green-600 text-white p-1 rounded-full shadow-lg z-20">
                <CheckCircle className="h-3 w-3" />
              </div>
            )}
          </div>
        </div>
      </Link>
      
      <Toast
        message={toastMessage}
        type={inCart ? "success" : "success"}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  );
}