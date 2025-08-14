import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Star, Calendar, MessageCircle, ArrowLeft, Edit3, Tv } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { sendToWhatsApp } from '../utils/whatsapp';
import { IMAGE_BASE_URL, POSTER_SIZE } from '../config/api';

export function Cart() {
  const { state, removeItem, clearCart } = useCart();

  const handleWhatsAppSend = () => {
    if (state.items.length > 0) {
      // Formatear items para WhatsApp incluyendo temporadas seleccionadas
      const formattedItems = state.items.map(item => ({
        ...item,
        title: item.type === 'tv' && item.selectedSeasons && item.selectedSeasons.length > 0
          ? `${item.title} (Temporadas: ${item.selectedSeasons.sort((a, b) => a - b).join(', ')})`
          : item.title
      }));
      sendToWhatsApp(formattedItems);
    }
  };

  const getItemUrl = (item: any) => {
    return `/${item.type}/${item.id}`;
  };

  const getItemYear = (item: any) => {
    const date = item.release_date || item.first_air_date;
    return date ? new Date(date).getFullYear() : 'N/A';
  };

  const getPosterUrl = (posterPath: string | null) => {
    return posterPath
      ? `${IMAGE_BASE_URL}/${POSTER_SIZE}${posterPath}`
      : 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500&h=750&fit=crop&crop=center';
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ShoppingCart className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tu carrito está vacío</h2>
          <p className="text-gray-600 mb-8">
            Explora nuestro catálogo y agrega películas, series o anime a tu carrito.
          </p>
          <div className="space-y-3">
            <Link
              to="/movies"
              className="block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Explorar Películas
            </Link>
            <Link
              to="/tv"
              className="block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Ver Series
            </Link>
            <Link
              to="/anime"
              className="block bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Descubrir Anime
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <ShoppingCart className="mr-3 h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Mi Carrito</h1>
          </div>
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-800 flex items-center font-medium"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Seguir explorando
          </Link>
        </div>

        {/* Cart Items */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Elementos ({state.total})
              </h2>
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
              >
                Vaciar carrito
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {state.items.map((item) => (
              <div key={`${item.type}-${item.id}`} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  {/* Poster */}
                  <Link to={getItemUrl(item)} className="flex-shrink-0">
                    <img
                      src={getPosterUrl(item.poster_path)}
                      alt={item.title}
                      className="w-16 h-24 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    />
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={getItemUrl(item)}
                      className="block hover:text-blue-600 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {item.title}
                        {item.type === 'tv' && item.selectedSeasons && item.selectedSeasons.length > 0 && (
                          <span className="text-sm font-normal text-purple-600 ml-2">
                            (Temporadas: {item.selectedSeasons.sort((a, b) => a - b).join(', ')})
                          </span>
                        )}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span className="capitalize bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                        {item.type === 'movie' ? 'Película' : 'Serie'}
                      </span>
                      {item.type === 'tv' && item.selectedSeasons && item.selectedSeasons.length > 0 && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium flex items-center">
                          <Tv className="h-3 w-3 mr-1" />
                          {item.selectedSeasons.length} temp.
                        </span>
                      )}
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{getItemYear(item)}</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                        <span>{item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    {item.type === 'tv' && (
                      <Link
                        to={getItemUrl(item)}
                        className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-full transition-colors"
                        title="Editar temporadas"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>
                    )}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                      title="Eliminar del carrito"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold flex items-center">
                <div className="bg-white/20 p-2 rounded-lg mr-3">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                Resumen del Pedido
              </h3>
              <div className="text-right">
                <div className="text-3xl font-bold">{state.total}</div>
                <div className="text-sm opacity-90">elementos</div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Películas</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {state.items.filter(item => item.type === 'movie').length}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <span className="text-2xl">🎬</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">Series/Anime</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {state.items.filter(item => item.type === 'tv').length}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <span className="text-2xl">📺</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Estadísticas del Pedido</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Promedio de calificación:</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-medium">
                      {state.items.length > 0 
                        ? (state.items.reduce((acc, item) => acc + item.vote_average, 0) / state.items.length).toFixed(1)
                        : '0.0'
                      }
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Contenido más reciente:</span>
                  <span className="font-medium">
                    {state.items.length > 0 
                      ? Math.max(...state.items.map(item => {
                          const date = item.release_date || item.first_air_date;
                          return date ? new Date(date).getFullYear() : 0;
                        }))
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* WhatsApp Button */}
            <button
              onClick={handleWhatsAppSend}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center transform hover:scale-105 hover:shadow-lg"
            >
              <MessageCircle className="mr-3 h-6 w-6" />
              Enviar Pedido por WhatsApp
            </button>
            
            <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100">
              <p className="text-sm text-green-700 text-center flex items-center justify-center">
                <span className="mr-2">📱</span>
                Tu pedido será enviado al número +53 5469 0878
              </p>
              {state.items.some(item => item.type === 'tv' && item.selectedSeasons) && (
                <p className="text-xs text-green-600 text-center mt-2">
                  * Las temporadas seleccionadas se incluirán en el mensaje
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}