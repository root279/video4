import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Star, Calendar, MessageCircle, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { sendToWhatsApp } from '../utils/whatsapp';
import { IMAGE_BASE_URL, POSTER_SIZE } from '../config/api';

export function Cart() {
  const { state, removeItem, clearCart } = useCart();

  const handleWhatsAppSend = () => {
    if (state.items.length > 0) {
      sendToWhatsApp(state.items);
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
                      </h3>
                    </Link>
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <span className="capitalize bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                        {item.type === 'movie' ? 'Película' : 'Serie'}
                      </span>
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

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex-shrink-0 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                    title="Eliminar del carrito"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Resumen del Pedido
          </h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Total de elementos:</span>
              <span>{state.total}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Películas:</span>
              <span>{state.items.filter(item => item.type === 'movie').length}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Series/Anime:</span>
              <span>{state.items.filter(item => item.type === 'tv').length}</span>
            </div>
          </div>

          {/* WhatsApp Button */}
          <button
            onClick={handleWhatsAppSend}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Enviar Pedido por WhatsApp
          </button>
          
          <p className="text-sm text-gray-500 mt-3 text-center">
            Tu pedido será enviado al número +53 5469 0878
          </p>
        </div>
      </div>
    </div>
  );
}