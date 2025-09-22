import React, { useState, useEffect } from 'react';
import { X, Download, MessageCircle, Phone, BookOpen, Info, Check, DollarSign, CreditCard, Calculator, Search, Filter, SortAsc, SortDesc, Smartphone, FileText, Send, ShoppingCart, Star, Calendar, Hash, Grid, List, Eye, EyeOff, Zap, Sparkles, Heart, TrendingUp, Award, Clock, Users, Globe } from 'lucide-react';
import { useCart } from '../context/CartContext';
import type { NovelCartItem } from '../types/movie';

interface Novela {
  id: number;
  titulo: string;
  genero: string;
  capitulos: number;
  año: number;
  descripcion?: string;
  paymentType?: 'cash' | 'transfer';
}

interface NovelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinalizePedido?: (selectedNovels: NovelCartItem[]) => void;
}

type ViewMode = 'grid' | 'list';
type SortField = 'titulo' | 'año' | 'capitulos' | 'genero' | 'precio';
type SortOrder = 'asc' | 'desc';

export function NovelasModal({ isOpen, onClose, onFinalizePedido }: NovelasModalProps) {
  const { getCurrentPrices, addNovel } = useCart();
  const [selectedNovelas, setSelectedNovelas] = useState<number[]>([]);
  const [novelasWithPayment, setNovelasWithPayment] = useState<Novela[]>([]);
  const [showNovelList, setShowNovelList] = useState(true);
  
  // Enhanced search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [minChapters, setMinChapters] = useState<number | ''>('');
  const [maxChapters, setMaxChapters] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<SortField>('titulo');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [quickFilter, setQuickFilter] = useState<'all' | 'short' | 'medium' | 'long' | 'recent' | 'classic'>('all');
  
  const [adminNovels, setAdminNovels] = useState<any[]>([]);

  const currentPrices = getCurrentPrices();
  const novelPricePerChapter = currentPrices.novelPricePerChapter;
  const transferFeePercentage = currentPrices.transferFeePercentage;
  
  const phoneNumber = '+5354690878';

  // Load novels from admin config
  useEffect(() => {
    const loadNovels = () => {
      try {
        const adminConfig = localStorage.getItem('system_config');
        if (adminConfig) {
          const config = JSON.parse(adminConfig);
          if (config.novels) {
            setAdminNovels(config.novels);
          }
        }
      } catch (error) {
        console.error('Error loading novels:', error);
      }
    };

    loadNovels();

    const handleAdminStateChange = (event: CustomEvent) => {
      if (event.detail.type === 'novel_add' || 
          event.detail.type === 'novel_update' || 
          event.detail.type === 'novel_delete') {
        loadNovels();
      }
    };

    const handleAdminFullSync = (event: CustomEvent) => {
      if (event.detail.config?.novels) {
        setAdminNovels(event.detail.config.novels);
      }
    };

    window.addEventListener('admin_state_change', handleAdminStateChange as EventListener);
    window.addEventListener('admin_full_sync', handleAdminFullSync as EventListener);

    return () => {
      window.removeEventListener('admin_state_change', handleAdminStateChange as EventListener);
      window.removeEventListener('admin_full_sync', handleAdminFullSync as EventListener);
    };
  }, []);

  const defaultNovelas: Novela[] = [];

  const allNovelas = [...defaultNovelas, ...adminNovels.map(novel => ({
    id: novel.id,
    titulo: novel.titulo,
    genero: novel.genero,
    capitulos: novel.capitulos,
    año: novel.año,
    descripcion: novel.descripcion
  }))];

  // Enhanced filter functions
  const getUniqueGenres = () => [...new Set(allNovelas.map(novela => novela.genero))].sort();
  const getUniqueYears = () => [...new Set(allNovelas.map(novela => novela.año))].sort((a, b) => b - a);
  const getChapterStats = () => {
    const chapters = allNovelas.map(n => n.capitulos);
    return {
      min: Math.min(...chapters),
      max: Math.max(...chapters),
      avg: Math.round(chapters.reduce((a, b) => a + b, 0) / chapters.length)
    };
  };

  const uniqueGenres = getUniqueGenres();
  const uniqueYears = getUniqueYears();
  const chapterStats = allNovelas.length > 0 ? getChapterStats() : { min: 0, max: 0, avg: 0 };

  // Initialize novels with default payment type
  useEffect(() => {
    const novelasWithDefaultPayment = allNovelas.map(novela => ({
      ...novela,
      paymentType: 'cash' as const
    }));
    setNovelasWithPayment(novelasWithDefaultPayment);
    
    const cartItems = JSON.parse(localStorage.getItem('movieCart') || '[]');
    const novelasEnCarrito = cartItems
      .filter((item: any) => item.type === 'novel')
      .map((item: any) => item.id);
    
    if (novelasEnCarrito.length > 0) {
      setSelectedNovelas(novelasEnCarrito);
    }
  }, [adminNovels]);

  // Enhanced filter function
  const getFilteredNovelas = () => {
    let filtered = novelasWithPayment.filter(novela => {
      // Text search in title and description
      const searchText = searchTerm.toLowerCase();
      const matchesSearch = searchText === '' || 
        novela.titulo.toLowerCase().includes(searchText) ||
        (novela.descripcion && novela.descripcion.toLowerCase().includes(searchText)) ||
        novela.genero.toLowerCase().includes(searchText);
      
      // Genre filter
      const matchesGenre = selectedGenre === '' || novela.genero === selectedGenre;
      
      // Year filter
      const matchesYear = selectedYear === '' || novela.año.toString() === selectedYear;
      
      // Chapter range filter
      const matchesMinChapters = minChapters === '' || novela.capitulos >= minChapters;
      const matchesMaxChapters = maxChapters === '' || novela.capitulos <= maxChapters;
      
      // Quick filters
      let matchesQuickFilter = true;
      switch (quickFilter) {
        case 'short':
          matchesQuickFilter = novela.capitulos <= 20;
          break;
        case 'medium':
          matchesQuickFilter = novela.capitulos > 20 && novela.capitulos <= 60;
          break;
        case 'long':
          matchesQuickFilter = novela.capitulos > 60;
          break;
        case 'recent':
          matchesQuickFilter = novela.año >= 2020;
          break;
        case 'classic':
          matchesQuickFilter = novela.año < 2020;
          break;
        default:
          matchesQuickFilter = true;
      }
      
      return matchesSearch && matchesGenre && matchesYear && 
             matchesMinChapters && matchesMaxChapters && matchesQuickFilter;
    });

    // Enhanced sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'titulo':
          comparison = a.titulo.localeCompare(b.titulo);
          break;
        case 'año':
          comparison = a.año - b.año;
          break;
        case 'capitulos':
          comparison = a.capitulos - b.capitulos;
          break;
        case 'genero':
          comparison = a.genero.localeCompare(b.genero);
          break;
        case 'precio':
          const priceA = a.paymentType === 'transfer' 
            ? Math.round((a.capitulos * novelPricePerChapter) * (1 + transferFeePercentage / 100))
            : a.capitulos * novelPricePerChapter;
          const priceB = b.paymentType === 'transfer' 
            ? Math.round((b.capitulos * novelPricePerChapter) * (1 + transferFeePercentage / 100))
            : b.capitulos * novelPricePerChapter;
          comparison = priceA - priceB;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const filteredNovelas = getFilteredNovelas();

  const handleNovelToggle = (novelaId: number) => {
    setSelectedNovelas(prev => {
      if (prev.includes(novelaId)) {
        return prev.filter(id => id !== novelaId);
      } else {
        return [...prev, novelaId];
      }
    });
  };

  const handlePaymentTypeChange = (novelaId: number, paymentType: 'cash' | 'transfer') => {
    setNovelasWithPayment(prev => 
      prev.map(novela => 
        novela.id === novelaId 
          ? { ...novela, paymentType }
          : novela
      )
    );
  };

  const selectAllNovelas = () => {
    setSelectedNovelas(filteredNovelas.map(n => n.id));
  };

  const clearAllNovelas = () => {
    setSelectedNovelas([]);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedGenre('');
    setSelectedYear('');
    setMinChapters('');
    setMaxChapters('');
    setSortBy('titulo');
    setSortOrder('asc');
    setQuickFilter('all');
  };

  const applyQuickFilter = (filter: typeof quickFilter) => {
    setQuickFilter(filter);
    // Clear other filters when applying quick filter
    if (filter !== 'all') {
      setSelectedGenre('');
      setSelectedYear('');
      setMinChapters('');
      setMaxChapters('');
    }
  };

  // Calculate totals by payment type with current pricing
  const calculateTotals = () => {
    const selectedNovelasData = novelasWithPayment.filter(n => selectedNovelas.includes(n.id));
    
    const cashNovelas = selectedNovelasData.filter(n => n.paymentType === 'cash');
    const transferNovelas = selectedNovelasData.filter(n => n.paymentType === 'transfer');
    
    const cashTotal = cashNovelas.reduce((sum, n) => sum + (n.capitulos * novelPricePerChapter), 0);
    const transferBaseTotal = transferNovelas.reduce((sum, n) => sum + (n.capitulos * novelPricePerChapter), 0);
    const transferFee = Math.round(transferBaseTotal * (transferFeePercentage / 100));
    const transferTotal = transferBaseTotal + transferFee;
    
    const grandTotal = cashTotal + transferTotal;
    
    return {
      cashNovelas,
      transferNovelas,
      cashTotal,
      transferBaseTotal,
      transferFee,
      transferTotal,
      grandTotal,
      totalCapitulos: selectedNovelasData.reduce((sum, n) => sum + n.capitulos, 0)
    };
  };

  const totals = calculateTotals();

  const generateNovelListText = () => {
    let listText = "📚 CATÁLOGO DE NOVELAS DISPONIBLES\n";
    listText += "TV a la Carta - Novelas Completas\n\n";
    listText += `💰 Precio: $${novelPricePerChapter} CUP por capítulo\n`;
    listText += `💳 Recargo transferencia: ${transferFeePercentage}%\n`;
    listText += "📱 Contacto: +5354690878\n\n";
    listText += "═══════════════════════════════════\n\n";
    
    if (allNovelas.length === 0) {
      listText += "📋 No hay novelas disponibles en este momento.\n";
      listText += "Contacta con el administrador para más información.\n\n";
    } else {
      listText += "💵 PRECIOS EN EFECTIVO:\n";
      listText += "═══════════════════════════════════\n\n";
      
      allNovelas.forEach((novela, index) => {
        const baseCost = novela.capitulos * novelPricePerChapter;
        listText += `${index + 1}. ${novela.titulo}\n`;
        listText += `   📺 Género: ${novela.genero}\n`;
        listText += `   📊 Capítulos: ${novela.capitulos}\n`;
        listText += `   📅 Año: ${novela.año}\n`;
        listText += `   💰 Costo en efectivo: $${baseCost.toLocaleString()} CUP\n\n`;
      });
      
      listText += `\n🏦 PRECIOS CON TRANSFERENCIA BANCARIA (+${transferFeePercentage}%):\n`;
      listText += "═══════════════════════════════════\n\n";
      
      allNovelas.forEach((novela, index) => {
        const baseCost = novela.capitulos * novelPricePerChapter;
        const transferCost = Math.round(baseCost * (1 + transferFeePercentage / 100));
        const recargo = transferCost - baseCost;
        listText += `${index + 1}. ${novela.titulo}\n`;
        listText += `   📺 Género: ${novela.genero}\n`;
        listText += `   📊 Capítulos: ${novela.capitulos}\n`;
        listText += `   📅 Año: ${novela.año}\n`;
        listText += `   💰 Costo base: $${baseCost.toLocaleString()} CUP\n`;
        listText += `   💳 Recargo (${transferFeePercentage}%): +$${recargo.toLocaleString()} CUP\n`;
        listText += `   💰 Costo con transferencia: $${transferCost.toLocaleString()} CUP\n\n`;
      });
    }
    
    listText += `\n📅 Generado el: ${new Date().toLocaleString('es-ES')}`;
    return listText;
  };

  const downloadNovelList = () => {
    const listText = generateNovelListText();
    const blob = new Blob([listText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Catalogo_Novelas_TV_a_la_Carta.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFinalizePedido = () => {
    if (selectedNovelas.length === 0) {
      alert('Por favor selecciona al menos una novela');
      return;
    }

    const selectedNovelItems: NovelCartItem[] = novelasWithPayment
      .filter(novela => selectedNovelas.includes(novela.id))
      .map(novela => ({
        id: novela.id,
        title: novela.titulo,
        type: 'novel' as const,
        genre: novela.genero,
        chapters: novela.capitulos,
        year: novela.año,
        description: novela.descripcion,
        paymentType: novela.paymentType || 'cash',
        pricePerChapter: novelPricePerChapter,
        totalPrice: novela.paymentType === 'transfer' 
          ? Math.round((novela.capitulos * novelPricePerChapter) * (1 + transferFeePercentage / 100))
          : novela.capitulos * novelPricePerChapter
      }));

    selectedNovelItems.forEach(novel => {
      addNovel(novel);
    });

    onClose();
    
    if (onFinalizePedido) {
      onFinalizePedido(selectedNovelItems);
    }
  };

  const handleCall = () => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleWhatsApp = () => {
    const message = "📚 *Solicitar novelas*\n\n¿Hay novelas que me gustaría ver en [TV a la Carta] a continuación te comento:";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5354690878?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Get novel card color based on characteristics
  const getNovelCardStyle = (novela: Novela) => {
    const isSelected = selectedNovelas.includes(novela.id);
    const isRecent = novela.año >= 2020;
    const isLong = novela.capitulos > 60;
    const isShort = novela.capitulos <= 20;
    
    if (isSelected) {
      return 'bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 border-purple-400 shadow-xl transform scale-[1.02]';
    }
    
    if (isRecent && isLong) {
      return 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-300 hover:border-green-400';
    }
    
    if (isShort) {
      return 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-300 hover:border-blue-400';
    }
    
    if (isLong) {
      return 'bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-amber-300 hover:border-amber-400';
    }
    
    return 'bg-gradient-to-br from-gray-50 via-white to-gray-50 border-gray-300 hover:border-purple-300';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl animate-in fade-in duration-300 border-2 border-purple-200">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-indigo-500/20 animate-pulse"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl mr-4 shadow-lg border border-white/30">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">Catálogo Avanzado de Novelas</h2>
                  <div className="flex items-center space-x-4 text-sm opacity-90">
                    <span className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {allNovelas.length} novelas disponibles
                    </span>
                    <span className="flex items-center">
                      <Hash className="h-4 w-4 mr-1" />
                      {chapterStats.min}-{chapterStats.max} capítulos
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {Math.min(...uniqueYears)}-{Math.max(...uniqueYears)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110 border border-white/30"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-140px)]">
          <div className="p-6">
            {/* Enhanced Information Section */}
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl p-8 mb-8 border-2 border-purple-200 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/30 to-indigo-200/30 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl mr-4 shadow-lg">
                    <Info className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Información del Catálogo
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-purple-200 shadow-lg">
                    <div className="flex items-center mb-3">
                      <div className="bg-gradient-to-r from-blue-400 to-purple-400 p-3 rounded-xl mr-3">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{allNovelas.length}</p>
                        <p className="text-sm font-medium text-gray-600">Novelas Totales</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-green-200 shadow-lg">
                    <div className="flex items-center mb-3">
                      <div className="bg-gradient-to-r from-green-400 to-emerald-400 p-3 rounded-xl mr-3">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">${novelPricePerChapter}</p>
                        <p className="text-sm font-medium text-gray-600">CUP por capítulo</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-orange-200 shadow-lg">
                    <div className="flex items-center mb-3">
                      <div className="bg-gradient-to-r from-orange-400 to-red-400 p-3 rounded-xl mr-3">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-600">+{transferFeePercentage}%</p>
                        <p className="text-sm font-medium text-gray-600">Recargo transfer.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-indigo-200 shadow-lg">
                    <div className="flex items-center mb-3">
                      <div className="bg-gradient-to-r from-indigo-400 to-purple-400 p-3 rounded-xl mr-3">
                        <Hash className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-indigo-600">{chapterStats.avg}</p>
                        <p className="text-sm font-medium text-gray-600">Capítulos promedio</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gradient-to-r from-white to-blue-50 rounded-2xl p-6 border-2 border-blue-300 shadow-lg">
                  <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
                    <div className="text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start mb-2">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg mr-3">
                          <Smartphone className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-xl font-black text-gray-900">{phoneNumber}</p>
                      </div>
                      <p className="text-sm font-semibold text-blue-600 lg:ml-10">Contacto directo para consultas</p>
                    </div>
                    
                    <div className="flex space-x-4">
                      <button
                        onClick={handleCall}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center"
                      >
                        <Phone className="h-5 w-5 mr-2" />
                        Llamar
                      </button>
                      <button
                        onClick={handleWhatsApp}
                        className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center"
                      >
                        <Send className="h-5 w-5 mr-2" />
                        WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Catalog Options */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <button
                onClick={downloadNovelList}
                className="group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-4 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="bg-white/20 p-4 rounded-full relative z-10">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="text-left relative z-10">
                  <div className="text-xl font-bold">Descargar Catálogo Completo</div>
                  <div className="text-sm opacity-90">Lista detallada con todos los precios</div>
                </div>
              </button>
              
              <button
                onClick={() => setShowNovelList(!showNovelList)}
                className="group bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-4 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="bg-white/20 p-4 rounded-full relative z-10">
                  <Search className="h-8 w-8" />
                </div>
                <div className="text-left relative z-10">
                  <div className="text-xl font-bold">Explorar y Seleccionar</div>
                  <div className="text-sm opacity-90">Búsqueda avanzada con filtros inteligentes</div>
                </div>
              </button>
            </div>

            {/* No novels message */}
            {allNovelas.length === 0 && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-8 text-center shadow-lg">
                <BookOpen className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-yellow-800 mb-3">
                  Catálogo en Construcción
                </h3>
                <p className="text-yellow-700 text-lg">
                  Estamos preparando nuestro catálogo de novelas. Contacta con el administrador para más información.
                </p>
              </div>
            )}

            {/* Enhanced Novels Explorer */}
            {showNovelList && allNovelas.length > 0 && (
              <div className="bg-white rounded-3xl border-2 border-gray-200 overflow-hidden shadow-2xl">
                {/* Advanced Search Header */}
                <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <Search className="h-7 w-7 text-purple-600 mr-3" />
                      <h4 className="text-2xl font-bold text-purple-900">Búsqueda Avanzada de Novelas</h4>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        className="bg-white/80 hover:bg-white text-purple-600 p-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-md border border-purple-200"
                        title={`Cambiar a vista ${viewMode === 'grid' ? 'lista' : 'cuadrícula'}`}
                      >
                        {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`p-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-md border ${
                          showAdvancedFilters 
                            ? 'bg-purple-600 text-white border-purple-400' 
                            : 'bg-white/80 hover:bg-white text-purple-600 border-purple-200'
                        }`}
                        title="Filtros avanzados"
                      >
                        {showAdvancedFilters ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  
                  {/* Quick Filters */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <Zap className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="text-sm font-bold text-purple-900">Filtros Rápidos:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'all', label: 'Todas', icon: '📚', color: 'gray' },
                        { key: 'short', label: 'Cortas (≤20 cap.)', icon: '⚡', color: 'blue' },
                        { key: 'medium', label: 'Medianas (21-60 cap.)', icon: '📖', color: 'green' },
                        { key: 'long', label: 'Largas (>60 cap.)', icon: '📚', color: 'amber' },
                        { key: 'recent', label: 'Recientes (2020+)', icon: '🆕', color: 'purple' },
                        { key: 'classic', label: 'Clásicas (<2020)', icon: '⭐', color: 'indigo' }
                      ].map(filter => (
                        <button
                          key={filter.key}
                          onClick={() => applyQuickFilter(filter.key as typeof quickFilter)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 ${
                            quickFilter === filter.key
                              ? `bg-${filter.color}-500 text-white shadow-lg scale-105`
                              : `bg-${filter.color}-100 text-${filter.color}-700 hover:bg-${filter.color}-200 border border-${filter.color}-300`
                          }`}
                        >
                          <span>{filter.icon}</span>
                          <span>{filter.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main Search Bar */}
                  <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-purple-400" />
                    <input
                      type="text"
                      placeholder="Buscar por título, descripción o género..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-lg border-2 border-purple-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {/* Advanced Filters Panel */}
                  {showAdvancedFilters && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-200 shadow-lg mb-6">
                      <div className="flex items-center mb-4">
                        <Filter className="h-6 w-6 text-purple-600 mr-3" />
                        <h5 className="text-lg font-bold text-purple-900">Filtros Avanzados</h5>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            <Globe className="h-4 w-4 inline mr-1" />
                            Género
                          </label>
                          <select
                            value={selectedGenre}
                            onChange={(e) => setSelectedGenre(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm"
                          >
                            <option value="">Todos los géneros</option>
                            {uniqueGenres.map(genre => (
                              <option key={genre} value={genre}>{genre}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            Año de Estreno
                          </label>
                          <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm"
                          >
                            <option value="">Todos los años</option>
                            {uniqueYears.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            <Hash className="h-4 w-4 inline mr-1" />
                            Capítulos Mínimos
                          </label>
                          <input
                            type="number"
                            placeholder={`Min: ${chapterStats.min}`}
                            value={minChapters}
                            onChange={(e) => setMinChapters(e.target.value ? parseInt(e.target.value) : '')}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm"
                            min={chapterStats.min}
                            max={chapterStats.max}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            <Hash className="h-4 w-4 inline mr-1" />
                            Capítulos Máximos
                          </label>
                          <input
                            type="number"
                            placeholder={`Max: ${chapterStats.max}`}
                            value={maxChapters}
                            onChange={(e) => setMaxChapters(e.target.value ? parseInt(e.target.value) : '')}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm"
                            min={chapterStats.min}
                            max={chapterStats.max}
                          />
                        </div>
                      </div>
                      
                      {/* Sort Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-gray-700">Ordenar por:</span>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortField)}
                            className="px-3 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white shadow-sm"
                          >
                            <option value="titulo">📚 Título</option>
                            <option value="año">📅 Año</option>
                            <option value="capitulos">📊 Capítulos</option>
                            <option value="genero">🎭 Género</option>
                            <option value="precio">💰 Precio</option>
                          </select>
                          
                          <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl transition-all duration-300 shadow-sm border border-purple-300 hover:scale-105"
                            title={`Ordenar ${sortOrder === 'asc' ? 'descendente' : 'ascendente'}`}
                          >
                            {sortOrder === 'asc' ? <SortAsc className="h-5 w-5" /> : <SortDesc className="h-5 w-5" />}
                          </button>
                        </div>
                        
                        {(searchTerm || selectedGenre || selectedYear || minChapters !== '' || maxChapters !== '' || quickFilter !== 'all') && (
                          <button
                            onClick={clearFilters}
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-xl transition-all duration-300 font-bold text-sm hover:scale-105 shadow-sm border border-red-300"
                          >
                            <X className="h-4 w-4 inline mr-1" />
                            Limpiar Filtros
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Results Summary */}
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 border border-purple-300 shadow-lg mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-3 lg:space-y-0">
                      <div className="flex items-center space-x-4">
                        <div className="bg-purple-500 p-3 rounded-xl shadow-lg">
                          <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-purple-900">
                            {filteredNovelas.length} de {allNovelas.length} novelas
                          </p>
                          <p className="text-sm text-purple-700">
                            {selectedNovelas.length} seleccionadas • {totals.totalCapitulos} capítulos totales
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={selectAllNovelas}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 shadow-md"
                        >
                          <Check className="h-4 w-4 inline mr-1" />
                          Todas
                        </button>
                        <button
                          onClick={clearAllNovelas}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105 shadow-md"
                        >
                          <X className="h-4 w-4 inline mr-1" />
                          Ninguna
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selection Summary */}
                {selectedNovelas.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b border-gray-200">
                    <div className="flex items-center mb-4">
                      <Calculator className="h-6 w-6 text-green-600 mr-3" />
                      <h5 className="text-xl font-bold text-gray-900">Resumen de Selección</h5>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white rounded-2xl p-4 border-2 border-purple-200 text-center shadow-lg transform hover:scale-105 transition-all duration-300">
                        <div className="text-3xl font-black text-purple-600 mb-1">{selectedNovelas.length}</div>
                        <div className="text-sm text-gray-600 font-bold">Novelas</div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border-2 border-blue-200 text-center shadow-lg transform hover:scale-105 transition-all duration-300">
                        <div className="text-3xl font-black text-blue-600 mb-1">{totals.totalCapitulos}</div>
                        <div className="text-sm text-gray-600 font-bold">Capítulos</div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border-2 border-green-200 text-center shadow-lg transform hover:scale-105 transition-all duration-300">
                        <div className="text-3xl font-black text-green-600 mb-1">${totals.cashTotal.toLocaleString()}</div>
                        <div className="text-sm text-gray-600 font-bold">Efectivo</div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border-2 border-orange-200 text-center shadow-lg transform hover:scale-105 transition-all duration-300">
                        <div className="text-3xl font-black text-orange-600 mb-1">${totals.transferTotal.toLocaleString()}</div>
                        <div className="text-sm text-gray-600 font-bold">Transferencia</div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl p-6 border-2 border-green-300 shadow-lg">
                      <div className="flex flex-col lg:flex-row justify-between items-center space-y-2 lg:space-y-0">
                        <span className="text-2xl font-bold text-gray-900 flex items-center">
                          <span className="mr-2">💰</span>
                          TOTAL A PAGAR:
                        </span>
                        <span className="text-4xl font-black text-green-600">${totals.grandTotal.toLocaleString()} CUP</span>
                      </div>
                      {totals.transferFee > 0 && (
                        <div className="text-sm text-orange-600 mt-3 font-bold text-center">
                          Incluye ${totals.transferFee.toLocaleString()} CUP de recargo por transferencia ({transferFeePercentage}%)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Enhanced Novels List */}
                <div className="max-h-[500px] overflow-y-auto p-6">
                  {filteredNovelas.length > 0 ? (
                    <div className={viewMode === 'grid' 
                      ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' 
                      : 'space-y-4'
                    }>
                      {filteredNovelas.map((novela) => {
                        const isSelected = selectedNovelas.includes(novela.id);
                        const baseCost = novela.capitulos * novelPricePerChapter;
                        const transferCost = Math.round(baseCost * (1 + transferFeePercentage / 100));
                        const finalCost = novela.paymentType === 'transfer' ? transferCost : baseCost;
                        
                        // Determine novel characteristics for styling
                        const isRecent = novela.año >= 2020;
                        const isLong = novela.capitulos > 60;
                        const isShort = novela.capitulos <= 20;
                        const isExpensive = finalCost > 500;
                        
                        return (
                          <div
                            key={novela.id}
                            className={`relative rounded-3xl border-3 transition-all duration-500 transform hover:scale-[1.02] ${
                              getNovelCardStyle(novela)
                            } ${isSelected ? 'ring-4 ring-purple-300 shadow-2xl' : 'hover:shadow-xl'}`}
                          >
                            {/* Selection Indicator */}
                            {isSelected && (
                              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-full shadow-xl z-10 animate-bounce">
                                <Check className="h-6 w-6" />
                              </div>
                            )}
                            
                            {/* Novel Badges */}
                            <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                              {isRecent && (
                                <span className="bg-gradient-to-r from-green-400 to-emerald-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  NUEVA
                                </span>
                              )}
                              {isLong && (
                                <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  EXTENSA
                                </span>
                              )}
                              {isShort && (
                                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center">
                                  <Zap className="h-3 w-3 mr-1" />
                                  RÁPIDA
                                </span>
                              )}
                              {novela.capitulos > 100 && (
                                <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center">
                                  <Award className="h-3 w-3 mr-1" />
                                  ÉPICA
                                </span>
                              )}
                            </div>

                            <div className="p-6">
                              <div className="flex items-start space-x-4">
                                {/* Enhanced Checkbox */}
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleNovelToggle(novela.id)}
                                    className="sr-only"
                                  />
                                  <button
                                    onClick={() => handleNovelToggle(novela.id)}
                                    className={`w-8 h-8 rounded-xl border-3 transition-all duration-300 flex items-center justify-center ${
                                      isSelected
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-400 shadow-lg scale-110'
                                        : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                                    }`}
                                  >
                                    {isSelected && <Check className="h-5 w-5 text-white" />}
                                  </button>
                                </div>
                                
                                <div className="flex-1">
                                  {/* Enhanced Title */}
                                  <div className="mb-4">
                                    <h3 className={`text-xl font-bold mb-2 transition-all duration-300 ${
                                      isSelected 
                                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600' 
                                        : 'text-gray-900 hover:text-purple-600'
                                    }`}>
                                      {novela.titulo}
                                    </h3>
                                    
                                    {/* Enhanced Info Tags */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      <span className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-2 rounded-full text-sm font-bold border border-purple-200 shadow-sm flex items-center">
                                        <Globe className="h-4 w-4 mr-1" />
                                        {novela.genero}
                                      </span>
                                      <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-3 py-2 rounded-full text-sm font-bold border border-blue-200 shadow-sm flex items-center">
                                        <Hash className="h-4 w-4 mr-1" />
                                        {novela.capitulos} capítulos
                                      </span>
                                      <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-2 rounded-full text-sm font-bold border border-green-200 shadow-sm flex items-center">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        {novela.año}
                                      </span>
                                    </div>
                                    
                                    {/* Description */}
                                    {novela.descripcion && (
                                      <p className="text-gray-600 text-sm leading-relaxed mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                        {novela.descripcion}
                                      </p>
                                    )}
                                    
                                    {/* Enhanced Payment Type Selector */}
                                    <div className="bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-lg">
                                      <div className="flex items-center mb-3">
                                        <CreditCard className="h-5 w-5 text-gray-600 mr-2" />
                                        <span className="text-sm font-bold text-gray-800">Método de Pago:</span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        <button
                                          onClick={() => handlePaymentTypeChange(novela.id, 'cash')}
                                          className={`relative px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 border-2 ${
                                            novela.paymentType === 'cash'
                                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg border-green-400'
                                              : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-300'
                                          }`}
                                        >
                                          {novela.paymentType === 'cash' && (
                                            <div className="absolute -top-1 -right-1 bg-green-400 text-white p-1 rounded-full">
                                              <Check className="h-3 w-3" />
                                            </div>
                                          )}
                                          <DollarSign className="h-4 w-4 inline mr-2" />
                                          Efectivo
                                          <div className="text-xs mt-1 opacity-90">
                                            ${baseCost.toLocaleString()} CUP
                                          </div>
                                        </button>
                                        
                                        <button
                                          onClick={() => handlePaymentTypeChange(novela.id, 'transfer')}
                                          className={`relative px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 border-2 ${
                                            novela.paymentType === 'transfer'
                                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg border-orange-400'
                                              : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-300'
                                          }`}
                                        >
                                          {novela.paymentType === 'transfer' && (
                                            <div className="absolute -top-1 -right-1 bg-orange-400 text-white p-1 rounded-full">
                                              <Check className="h-3 w-3" />
                                            </div>
                                          )}
                                          <CreditCard className="h-4 w-4 inline mr-2" />
                                          Transfer.
                                          <div className="text-xs mt-1 opacity-90">
                                            ${transferCost.toLocaleString()} CUP
                                          </div>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Enhanced Price Display */}
                                  <div className="text-center bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-lg">
                                    <div className="mb-2">
                                      <span className="text-sm font-bold text-gray-600 block mb-1">Precio Final:</span>
                                      <div className={`text-3xl font-black ${
                                        novela.paymentType === 'cash' ? 'text-green-600' : 'text-orange-600'
                                      }`}>
                                        ${finalCost.toLocaleString()} CUP
                                      </div>
                                    </div>
                                    
                                    {novela.paymentType === 'transfer' && (
                                      <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-2 rounded-lg">
                                        <div>Base: ${baseCost.toLocaleString()} CUP</div>
                                        <div className="text-orange-600 font-bold">
                                          Recargo: +${(transferCost - baseCost).toLocaleString()} CUP
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="text-xs text-gray-500 mt-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                      ${novelPricePerChapter} CUP × {novela.capitulos} capítulos
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                        <Search className="h-16 w-16 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        No se encontraron novelas
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        No hay novelas que coincidan con los filtros seleccionados. Intenta ajustar los criterios de búsqueda.
                      </p>
                      <button
                        onClick={clearFilters}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        <X className="h-5 w-5 inline mr-2" />
                        Limpiar Todos los Filtros
                      </button>
                    </div>
                  )}
                </div>

                {/* Enhanced Footer with Finalize Button */}
                {selectedNovelas.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-t-2 border-purple-200">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                      <div className="text-center lg:text-left">
                        <p className="text-xl font-bold text-gray-900 mb-1">
                          {selectedNovelas.length} novelas seleccionadas
                        </p>
                        <p className="text-sm text-gray-600">
                          {totals.totalCapitulos} capítulos • ${totals.grandTotal.toLocaleString()} CUP total
                        </p>
                      </div>
                      <button
                        onClick={handleFinalizePedido}
                        disabled={selectedNovelas.length === 0}
                        className={`group relative overflow-hidden px-8 py-4 rounded-2xl font-bold transition-all duration-500 transform hover:scale-105 flex items-center justify-center shadow-xl ${
                          selectedNovelas.length > 0
                            ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {/* Animated background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Floating icons */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Heart className="absolute top-2 left-4 h-4 w-4 text-pink-300 animate-pulse" />
                          <Star className="absolute top-2 right-4 h-4 w-4 text-yellow-300 animate-bounce" />
                          <Sparkles className="absolute bottom-2 left-6 h-4 w-4 text-blue-300 animate-pulse delay-100" />
                          <Zap className="absolute bottom-2 right-6 h-4 w-4 text-green-300 animate-bounce delay-200" />
                        </div>
                        
                        <ShoppingCart className="h-6 w-6 mr-3 relative z-10" />
                        <span className="text-lg relative z-10">Finalizar Pedido de Novelas</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}