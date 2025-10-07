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
      <div
        className={`group relative bg-white rounded-xl overflow-hidden transition-all duration-300 transform ${
          isHovered
            ? 'shadow-2xl scale-[1.02] -translate-y-1'
            : 'shadow-md hover:shadow-xl'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Border effect */}
        <div className={`absolute inset-0 rounded-xl border-2 transition-all duration-300 z-10 pointer-events-none ${
          isHovered ? 'border-pink-400' : 'border-transparent'
        }`} />

        {/* Status badge */}
        <div className="absolute top-2 left-2 z-20">
          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg backdrop-blur-sm ${
            novel.estado === 'transmision' ? 'bg-red-500/90' : 'bg-green-500/90'
          }`}>
            {novel.estado === 'transmision' ? '📡 EN VIVO' : '✅ COMPLETA'}
          </span>
        </div>

        {/* Country flag */}
        <div className="absolute top-2 right-2 z-20">
          <span className="bg-black/70 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-lg text-sm font-medium shadow-lg">
            {getCountryFlag(novel.pais || 'No especificado')}
          </span>
        </div>

        <div className="relative overflow-hidden aspect-[2/3]">
          <OptimizedImage
            src={getNovelImage(novel)}
            alt={novel.titulo}
            className={`w-full h-full object-cover transition-all duration-300 ${
              isHovered ? 'scale-105' : ''
            }`}
            lazy={true}
          />

          {/* Overlay gradiente mejorado */}
          <div className={`absolute inset-0 transition-all duration-300 ${
            isHovered
              ? 'bg-gradient-to-t from-black/90 via-black/40 to-transparent'
              : 'bg-gradient-to-t from-black/70 via-transparent to-transparent'
          }`} />

          {/* Título superpuesto en la imagen - estilo tvalacarta */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <h3 className={`font-bold text-white mb-2 transition-all duration-300 leading-tight ${
              isHovered ? 'text-xl' : 'text-lg'
            }`} style={{
              textShadow: '2px 2px 8px rgba(0,0,0,0.9), 0 0 15px rgba(0,0,0,0.5)',
              lineHeight: '1.2'
            }}>
              {novel.titulo}
            </h3>

            {/* Info overlay en la imagen */}
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="bg-white/90 backdrop-blur-sm text-gray-900 px-2.5 py-1 rounded-md text-xs font-bold shadow-md">
                {novel.año}
              </span>
              <span className="bg-pink-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-xs font-bold shadow-md">
                {novel.capitulos} CAP
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 relative bg-gradient-to-b from-gray-50 to-white">
          {/* Género y país */}
          <div className="flex flex-wrap gap-2 text-xs mb-3">
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full font-bold shadow-sm">
              {novel.genero}
            </span>
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-full font-bold shadow-sm">
              {getCountryFlag(novel.pais || 'No especificado')} {novel.pais || 'No especificado'}
            </span>
          </div>

          {/* Descripción corta */}
          <p className="text-gray-700 text-sm line-clamp-2 mb-4 leading-relaxed">
            {novel.descripcion || 'Sin descripción disponible'}
          </p>

          {/* Price display mejorado */}
          <div className="bg-gradient-to-br from-purple-100 via-pink-100 to-purple-100 rounded-xl p-3 mb-3 border-2 border-purple-300 shadow-sm">
            <div className="text-center">
              <div className="text-xs font-bold text-purple-700 mb-1 uppercase tracking-wide">Precio Total</div>
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                ${basePrice.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 font-medium mt-1">
                ${currentPrices.novelPricePerChapter} × {novel.capitulos} cap.
              </div>
            </div>
          </div>

          {/* Add to Cart Button - Mejorado */}
          <button
            onClick={handleCartAction}
            disabled={isAddingToCart}
            className={`w-full px-4 py-3.5 rounded-xl font-bold transition-all duration-300 transform relative overflow-hidden shadow-lg ${
              inCart
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white'
            } ${isAddingToCart ? 'scale-95' : 'hover:scale-[1.02] hover:shadow-xl'}`}
          >
            {isAddingToCart && (
              <div className="absolute inset-0 bg-white/30 animate-pulse" />
            )}

            <div className="flex items-center justify-center">
              {inCart ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  <span className="text-sm">EN EL CARRITO</span>
                  <CheckCircle className="ml-2 h-5 w-5" />
                </>
              ) : isAddingToCart ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  <span className="text-sm">AGREGANDO...</span>
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  <span className="text-sm">AGREGAR AL CARRITO</span>
                </>
              )}
            </div>
          </button>

          {/* View Details Link - Mejorado */}
          <Link
            to={`/novel/${novel.id}`}
            className="w-full mt-2 px-4 py-2.5 rounded-xl font-bold transition-all duration-300 border-2 border-gray-300 text-gray-700 hover:border-pink-400 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 hover:text-pink-600 flex items-center justify-center shadow-sm hover:shadow-md"
          >
            <Eye className="mr-2 h-4 w-4" />
            <span className="text-sm">VER DETALLES</span>
          </Link>
        </div>
        
        {/* Selection indicator */}
        {inCart && (
          <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg z-30">
            <CheckCircle className="h-4 w-4" />
          </div>
        )}
      </div>
      
      <Toast
        message={toastMessage}
        type={inCart ? "success" : "success"}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  );
}