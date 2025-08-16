import React, { useState, useEffect } from 'react';
import { X, Download, MessageCircle, Phone, BookOpen, Info, Check } from 'lucide-react';

interface Novela {
  id: number;
  titulo: string;
  genero: string;
  capitulos: number;
  año: number;
  descripcion?: string;
}

interface NovelasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NovelasModal({ isOpen, onClose }: NovelasModalProps) {
  const [selectedNovelas, setSelectedNovelas] = useState<number[]>([]);
  const [showContactOptions, setShowContactOptions] = useState(false);
  const [showNovelList, setShowNovelList] = useState(false);

  // Lista de novelas basada en el documento
  const novelas: Novela[] = [
    { id: 1, titulo: "Corazón Salvaje", genero: "Drama/Romance", capitulos: 185, año: 2009 },
    { id: 2, titulo: "La Usurpadora", genero: "Drama/Melodrama", capitulos: 98, año: 1998 },
    { id: 3, titulo: "María la del Barrio", genero: "Drama/Romance", capitulos: 73, año: 1995 },
    { id: 4, titulo: "Marimar", genero: "Drama/Romance", capitulos: 63, año: 1994 },
    { id: 5, titulo: "Rosalinda", genero: "Drama/Romance", capitulos: 80, año: 1999 },
    { id: 6, titulo: "La Madrastra", genero: "Drama/Suspenso", capitulos: 135, año: 2005 },
    { id: 7, titulo: "Rubí", genero: "Drama/Melodrama", capitulos: 115, año: 2004 },
    { id: 8, titulo: "Pasión de Gavilanes", genero: "Drama/Romance", capitulos: 188, año: 2003 },
    { id: 9, titulo: "Yo Soy Betty, la Fea", genero: "Comedia/Romance", capitulos: 335, año: 1999 },
    { id: 10, titulo: "El Cuerpo del Deseo", genero: "Drama/Fantasía", capitulos: 178, año: 2005 },
    { id: 11, titulo: "La Reina del Sur", genero: "Drama/Acción", capitulos: 63, año: 2011 },
    { id: 12, titulo: "Sin Senos Sí Hay Paraíso", genero: "Drama/Acción", capitulos: 91, año: 2016 },
    { id: 13, titulo: "El Señor de los Cielos", genero: "Drama/Acción", capitulos: 81, año: 2013 },
    { id: 14, titulo: "La Casa de las Flores", genero: "Comedia/Drama", capitulos: 33, año: 2018 },
    { id: 15, titulo: "Rebelde", genero: "Drama/Musical", capitulos: 440, año: 2004 },
    { id: 16, titulo: "Amigas y Rivales", genero: "Drama/Romance", capitulos: 185, año: 2001 },
    { id: 17, titulo: "Clase 406", genero: "Drama/Juvenil", capitulos: 344, año: 2002 },
    { id: 18, titulo: "Destilando Amor", genero: "Drama/Romance", capitulos: 171, año: 2007 },
    { id: 19, titulo: "Fuego en la Sangre", genero: "Drama/Romance", capitulos: 233, año: 2008 },
    { id: 20, titulo: "Teresa", genero: "Drama/Melodrama", capitulos: 152, año: 2010 },
    { id: 21, titulo: "Triunfo del Amor", genero: "Drama/Romance", capitulos: 176, año: 2010 },
    { id: 22, titulo: "Una Familia con Suerte", genero: "Comedia/Drama", capitulos: 357, año: 2011 },
    { id: 23, titulo: "Amores Verdaderos", genero: "Drama/Romance", capitulos: 181, año: 2012 },
    { id: 24, titulo: "De Que Te Quiero, Te Quiero", genero: "Comedia/Romance", capitulos: 181, año: 2013 },
    { id: 25, titulo: "Lo Que la Vida Me Robó", genero: "Drama/Romance", capitulos: 221, año: 2013 },
    { id: 26, titulo: "La Gata", genero: "Drama/Romance", capitulos: 135, año: 2014 },
    { id: 27, titulo: "Hasta el Fin del Mundo", genero: "Drama/Romance", capitulos: 177, año: 2014 },
    { id: 28, titulo: "Yo No Creo en los Hombres", genero: "Drama/Romance", capitulos: 142, año: 2014 },
    { id: 29, titulo: "La Malquerida", genero: "Drama/Romance", capitulos: 121, año: 2014 },
    { id: 30, titulo: "Antes Muerta que Lichita", genero: "Comedia/Romance", capitulos: 183, año: 2015 },
    { id: 31, titulo: "A Que No Me Dejas", genero: "Drama/Romance", capitulos: 153, año: 2015 },
    { id: 32, titulo: "Simplemente María", genero: "Drama/Romance", capitulos: 155, año: 2015 },
    { id: 33, titulo: "Tres Veces Ana", genero: "Drama/Romance", capitulos: 123, año: 2016 },
    { id: 34, titulo: "La Candidata", genero: "Drama/Político", capitulos: 60, año: 2016 },
    { id: 35, titulo: "Vino el Amor", genero: "Drama/Romance", capitulos: 143, año: 2016 },
    { id: 36, titulo: "La Doble Vida de Estela Carrillo", genero: "Drama/Musical", capitulos: 95, año: 2017 },
    { id: 37, titulo: "Mi Marido Tiene Familia", genero: "Comedia/Drama", capitulos: 175, año: 2017 },
    { id: 38, titulo: "La Piloto", genero: "Drama/Acción", capitulos: 80, año: 2017 },
    { id: 39, titulo: "Caer en Tentación", genero: "Drama/Suspenso", capitulos: 92, año: 2017 },
    { id: 40, titulo: "Por Amar Sin Ley", genero: "Drama/Romance", capitulos: 123, año: 2018 },
    { id: 41, titulo: "Amar a Muerte", genero: "Drama/Fantasía", capitulos: 190, año: 2018 },
    { id: 42, titulo: "Ringo", genero: "Drama/Musical", capitulos: 90, año: 2019 },
    { id: 43, titulo: "La Usurpadora (2019)", genero: "Drama/Melodrama", capitulos: 25, año: 2019 },
    { id: 44, titulo: "100 Días para Enamorarnos", genero: "Comedia/Romance", capitulos: 104, año: 2020 },
    { id: 45, titulo: "Te Doy la Vida", genero: "Drama/Romance", capitulos: 91, año: 2020 },
    { id: 46, titulo: "Como Tú No Hay 2", genero: "Comedia/Romance", capitulos: 120, año: 2020 },
    { id: 47, titulo: "La Desalmada", genero: "Drama/Romance", capitulos: 96, año: 2021 },
    { id: 48, titulo: "Si Nos Dejan", genero: "Drama/Romance", capitulos: 93, año: 2021 },
    { id: 49, titulo: "Vencer el Pasado", genero: "Drama/Familia", capitulos: 91, año: 2021 },
    { id: 50, titulo: "La Herencia", genero: "Drama/Romance", capitulos: 74, año: 2022 }
  ];

  const phoneNumber = '+5354690878';

  const handleNovelToggle = (novelaId: number) => {
    setSelectedNovelas(prev => {
      if (prev.includes(novelaId)) {
        return prev.filter(id => id !== novelaId);
      } else {
        return [...prev, novelaId];
      }
    });
  };

  const selectAllNovelas = () => {
    setSelectedNovelas(novelas.map(n => n.id));
  };

  const clearAllNovelas = () => {
    setSelectedNovelas([]);
  };

  const generateNovelListText = () => {
    let listText = "📚 CATÁLOGO DE NOVELAS DISPONIBLES\n";
    listText += "TV a la Carta - Novelas Completas\n\n";
    listText += "💰 Precio: $5 CUP por capítulo\n";
    listText += "📱 Contacto: +5354690878\n\n";
    listText += "═══════════════════════════════════\n\n";
    
    novelas.forEach((novela, index) => {
      listText += `${index + 1}. ${novela.titulo}\n`;
      listText += `   📺 Género: ${novela.genero}\n`;
      listText += `   📊 Capítulos: ${novela.capitulos}\n`;
      listText += `   📅 Año: ${novela.año}\n`;
      listText += `   💰 Costo total: $${(novela.capitulos * 5).toLocaleString()} CUP\n\n`;
    });
    
    listText += "═══════════════════════════════════\n";
    listText += "📞 Para encargar, contacta al +5354690878\n";
    listText += "🌟 ¡Disfruta de las mejores novelas!\n";
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

  const sendSelectedNovelas = () => {
    if (selectedNovelas.length === 0) {
      alert('Por favor selecciona al menos una novela');
      return;
    }

    const selectedNovelasData = novelas.filter(n => selectedNovelas.includes(n.id));
    let message = "Estoy interesado en el catálogo de novelas\nQuiero encargar las siguientes novelas:\n\n";
    
    selectedNovelasData.forEach((novela, index) => {
      message += `${index + 1}. ${novela.titulo}\n`;
      message += `   📺 Género: ${novela.genero}\n`;
      message += `   📊 Capítulos: ${novela.capitulos}\n`;
      message += `   💰 Costo: $${(novela.capitulos * 5).toLocaleString()} CUP\n\n`;
    });

    const totalCapitulos = selectedNovelasData.reduce((sum, n) => sum + n.capitulos, 0);
    const totalCosto = totalCapitulos * 5;
    
    message += `📊 RESUMEN:\n`;
    message += `• Total de novelas: ${selectedNovelasData.length}\n`;
    message += `• Total de capítulos: ${totalCapitulos}\n`;
    message += `• Costo total: $${totalCosto.toLocaleString()} CUP\n\n`;
    message += `📱 Enviado desde TV a la Carta`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5354690878?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCall = () => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleWhatsApp = () => {
    const message = "Estoy interesado en el catálogo de novelas\nQuiero encargar la siguiente novela:\n\n";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5354690878?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl animate-in fade-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 p-3 rounded-xl mr-4 shadow-lg">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Catálogo de Novelas</h2>
                <p className="text-sm sm:text-base opacity-90">Novelas completas disponibles</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="p-4 sm:p-6">
            {/* Información Principal */}
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 mb-6 border-2 border-pink-200">
              <div className="flex items-center mb-4">
                <div className="bg-pink-100 p-3 rounded-xl mr-4">
                  <Info className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-bold text-pink-900">Información Importante</h3>
              </div>
              
              <div className="space-y-4 text-pink-800">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📚</span>
                  <p className="font-semibold">Las novelas se encargan completas</p>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">💰</span>
                  <p className="font-semibold">Costo: $5 CUP por cada capítulo</p>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📱</span>
                  <p className="font-semibold">Para más información, contacta al número:</p>
                </div>
              </div>

              {/* Número de contacto */}
              <div className="mt-6 bg-white rounded-xl p-4 border border-pink-300">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                  <div className="text-center sm:text-left">
                    <p className="text-lg font-bold text-gray-900">{phoneNumber}</p>
                    <p className="text-sm text-gray-600">Contacto directo</p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCall}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Llamar
                    </button>
                    <button
                      onClick={handleWhatsApp}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Opciones del catálogo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                onClick={downloadNovelList}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center"
              >
                <Download className="h-6 w-6 mr-3" />
                <div className="text-left">
                  <div className="text-lg">Descargar Catálogo</div>
                  <div className="text-sm opacity-90">Lista completa de novelas</div>
                </div>
              </button>
              
              <button
                onClick={() => setShowNovelList(!showNovelList)}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center"
              >
                <BookOpen className="h-6 w-6 mr-3" />
                <div className="text-left">
                  <div className="text-lg">Ver y Seleccionar</div>
                  <div className="text-sm opacity-90">Elegir novelas específicas</div>
                </div>
              </button>
            </div>

            {/* Lista de novelas */}
            {showNovelList && (
              <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                    <h4 className="text-lg font-bold text-gray-900">
                      Seleccionar Novelas ({selectedNovelas.length} seleccionadas)
                    </h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={selectAllNovelas}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Todas
                      </button>
                      <button
                        onClick={clearAllNovelas}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Ninguna
                      </button>
                    </div>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto p-4">
                  <div className="grid grid-cols-1 gap-3">
                    {novelas.map((novela) => (
                      <label
                        key={novela.id}
                        className="flex items-center p-4 hover:bg-purple-50 rounded-xl cursor-pointer transition-colors border border-gray-100 hover:border-purple-200"
                      >
                        <input
                          type="checkbox"
                          checked={selectedNovelas.includes(novela.id)}
                          onChange={() => handleNovelToggle(novela.id)}
                          className="mr-4 h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 mb-1">{novela.titulo}</p>
                              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                  {novela.genero}
                                </span>
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  {novela.capitulos} capítulos
                                </span>
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  {novela.año}
                                </span>
                              </div>
                            </div>
                            <div className="text-right mt-2 sm:mt-0 sm:ml-4">
                              <p className="font-bold text-green-600">
                                ${(novela.capitulos * 5).toLocaleString()} CUP
                              </p>
                              <p className="text-xs text-gray-500">
                                $5 CUP × {novela.capitulos} cap.
                              </p>
                            </div>
                          </div>
                        </div>
                        {selectedNovelas.includes(novela.id) && (
                          <Check className="h-5 w-5 text-purple-600 ml-2" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {selectedNovelas.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                      <div className="text-center sm:text-left">
                        <p className="font-semibold text-gray-900">
                          {selectedNovelas.length} novelas seleccionadas
                        </p>
                        <p className="text-sm text-gray-600">
                          Total: ${novelas
                            .filter(n => selectedNovelas.includes(n.id))
                            .reduce((sum, n) => sum + (n.capitulos * 5), 0)
                            .toLocaleString()} CUP
                        </p>
                      </div>
                      <button
                        onClick={sendSelectedNovelas}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Enviar por WhatsApp
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