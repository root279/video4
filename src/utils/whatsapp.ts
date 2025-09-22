import { OrderData, CustomerInfo } from '../components/CheckoutModal';

// Detectar dispositivo y sistema operativo para optimizar WhatsApp
const getDeviceAndOSInfo = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const windowWidth = window.innerWidth;
  
  // Detectar sistema operativo
  const isAndroid = /android/.test(userAgent);
  const isIOS = /iphone|ipad|ipod/.test(userAgent) || (platform === 'macintel' && maxTouchPoints > 1);
  const isWindows = /windows/.test(userAgent) || /win32|win64/.test(platform);
  const isMacOS = /macintosh|mac os x/.test(userAgent) && !isIOS;
  const isLinux = /linux/.test(userAgent) && !isAndroid;
  
  // Detectar navegador
  const isChrome = /chrome/.test(userAgent) && !/edge|edg/.test(userAgent);
  const isFirefox = /firefox/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
  const isEdge = /edge|edg/.test(userAgent);
  const isOpera = /opera|opr/.test(userAgent);
  const isBrave = /brave/.test(userAgent);
  
  // Detectar tipo de dispositivo
  const isMobile = windowWidth <= 768 || maxTouchPoints > 0 && windowWidth <= 1024;
  const isTablet = (windowWidth > 768 && windowWidth <= 1024) || (maxTouchPoints > 0 && windowWidth > 768 && windowWidth <= 1366);
  const isDesktop = windowWidth > 1024 && maxTouchPoints === 0;
  
  // Detectar si tiene WhatsApp instalado (aproximación)
  const hasWhatsAppApp = isAndroid || isIOS;
  
  return {
    os: { isAndroid, isIOS, isWindows, isMacOS, isLinux },
    browser: { isChrome, isFirefox, isSafari, isEdge, isOpera, isBrave },
    device: { isMobile, isTablet, isDesktop },
    hasWhatsAppApp,
    touchSupport: maxTouchPoints > 0
  };
};

// Generar URL de WhatsApp optimizada para cada plataforma
const generateWhatsAppURL = (phoneNumber: string, message: string, deviceInfo: any) => {
  const encodedMessage = encodeURIComponent(message);
  const basePhone = phoneNumber.replace(/[^\d]/g, ''); // Solo números
  
  // URLs específicas por plataforma para máxima compatibilidad
  const urls = {
    // Para móviles con app de WhatsApp
    mobileApp: `whatsapp://send?phone=${basePhone}&text=${encodedMessage}`,
    
    // Para WhatsApp Web (universal)
    web: `https://web.whatsapp.com/send?phone=${basePhone}&text=${encodedMessage}`,
    
    // Para API de WhatsApp (más universal)
    api: `https://wa.me/${basePhone}?text=${encodedMessage}`,
    
    // Para dispositivos iOS específicamente
    ios: `https://wa.me/${basePhone}?text=${encodedMessage}`,
    
    // Para Android específicamente
    android: `intent://send/${basePhone}#Intent;scheme=smsto;package=com.whatsapp;S.intent.extra.TEXT=${encodedMessage};end`,
    
    // Fallback universal
    universal: `https://api.whatsapp.com/send?phone=${basePhone}&text=${encodedMessage}`
  };
  
  // Seleccionar URL apropiada basada en el dispositivo
  if (deviceInfo.device.isMobile) {
    if (deviceInfo.os.isIOS) {
      return urls.ios;
    } else if (deviceInfo.os.isAndroid) {
      return urls.api; // wa.me funciona mejor en Android
    } else {
      return urls.api;
    }
  } else if (deviceInfo.device.isTablet) {
    if (deviceInfo.os.isIOS) {
      return urls.ios;
    } else if (deviceInfo.os.isAndroid) {
      return urls.api;
    } else {
      return urls.web;
    }
  } else {
    // Desktop
    if (deviceInfo.os.isMacOS && deviceInfo.browser.isSafari) {
      return urls.api; // Safari en macOS
    } else if (deviceInfo.os.isWindows) {
      return urls.web; // WhatsApp Web para Windows
    } else if (deviceInfo.os.isLinux) {
      return urls.web; // WhatsApp Web para Linux
    } else {
      return urls.web; // Fallback a WhatsApp Web
    }
  }
};

// Función mejorada para abrir WhatsApp con máxima compatibilidad
const openWhatsAppWithFallback = (phoneNumber: string, message: string) => {
  const deviceInfo = getDeviceAndOSInfo();
  const primaryUrl = generateWhatsAppURL(phoneNumber, message, deviceInfo);
  const fallbackUrl = `https://wa.me/${phoneNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
  
  console.log('Device Info:', deviceInfo);
  console.log('Primary URL:', primaryUrl);
  
  // Función para intentar abrir WhatsApp
  const attemptOpen = (url: string, fallback?: string) => {
    try {
      if (deviceInfo.device.isMobile || deviceInfo.device.isTablet) {
        // En móviles y tablets, intentar abrir en la misma ventana primero
        const link = document.createElement('a');
        link.href = url;
        link.target = '_self';
        link.rel = 'noopener noreferrer';
        
        // Intentar click programático
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Fallback después de un breve delay
        if (fallback) {
          setTimeout(() => {
            window.open(fallback, '_blank', 'noopener,noreferrer');
          }, 1500);
        }
      } else {
        // En desktop, abrir en nueva pestaña
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer,width=1024,height=768');
        
        // Verificar si se abrió correctamente
        if (!newWindow || newWindow.closed) {
          if (fallback) {
            setTimeout(() => {
              window.open(fallback, '_blank', 'noopener,noreferrer');
            }, 500);
          }
        }
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      if (fallback) {
        window.open(fallback, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Intentar abrir con URL primaria y fallback
  attemptOpen(primaryUrl, fallbackUrl);
  
  // Fallback adicional para casos extremos
  setTimeout(() => {
    // Si nada funcionó, mostrar instrucciones al usuario
    const shouldShowInstructions = !document.hidden; // Si la página sigue visible
    
    if (shouldShowInstructions) {
      console.log('Showing WhatsApp instructions as final fallback');
      // Aquí podrías mostrar un modal con instrucciones manuales
    }
  }, 3000);
};

export function sendOrderToWhatsApp(orderData: OrderData): void {
  const { 
    orderId, 
    customerInfo, 
    deliveryZone, 
    deliveryCost, 
    items, 
    subtotal, 
    transferFee, 
    total,
    cashTotal = 0,
    transferTotal = 0,
    pickupLocation = false,
    showLocationMap = false
  } = orderData;

  // Obtener información del dispositivo para personalizar el mensaje
  const deviceInfo = getDeviceAndOSInfo();

  // Obtener el porcentaje de transferencia actual del contexto admin
  const getTransferFeePercentage = () => {
    try {
      const adminState = localStorage.getItem('admin_system_state');
      if (adminState) {
        const state = JSON.parse(adminState);
        return state.prices?.transferFeePercentage || 10;
      }
    } catch (error) {
      console.warn('No se pudo obtener el porcentaje de transferencia del admin:', error);
    }
    return 10;
  };

  // Obtener precios actuales del contexto admin
  const getCurrentPrices = () => {
    try {
      const adminState = localStorage.getItem('admin_system_state');
      if (adminState) {
        const state = JSON.parse(adminState);
        return {
          moviePrice: state.prices?.moviePrice || 80,
          seriesPrice: state.prices?.seriesPrice || 300,
          novelPricePerChapter: state.prices?.novelPricePerChapter || 5,
          transferFeePercentage: state.prices?.transferFeePercentage || 10
        };
      }
    } catch (error) {
      console.warn('No se pudieron obtener los precios del admin:', error);
    }
    return {
      moviePrice: 80,
      seriesPrice: 300,
      novelPricePerChapter: 5,
      transferFeePercentage: 10
    };
  };

  const currentPrices = getCurrentPrices();
  const transferFeePercentage = currentPrices.transferFeePercentage;
  
  // Formatear lista de productos con desglose detallado
  const itemsList = items
    .map(item => {
      const seasonInfo = item.type === 'tv' && item.selectedSeasons && item.selectedSeasons.length > 0 
        ? `\n  📺 Temporadas: ${item.selectedSeasons.sort((a, b) => a - b).join(', ')}` 
        : '';
      
      const extendedSeriesInfo = item.type === 'tv' && item.episodeCount && item.episodeCount > 50
        ? `\n  📊 Serie extensa: ${item.episodeCount} episodios totales`
        : '';
      
      const novelInfo = item.type === 'novel' 
        ? `\n  📚 Capítulos: ${item.chapters}\n  📖 Género: ${item.genre}` 
        : '';
      
      const itemType = item.type === 'movie' ? 'Película' : item.type === 'tv' ? 'Serie' : 'Novela';
      
      let basePrice: number;
      if (item.type === 'novel') {
        basePrice = item.chapters * currentPrices.novelPricePerChapter;
      } else if (item.type === 'movie') {
        basePrice = currentPrices.moviePrice;
      } else {
        basePrice = (item.selectedSeasons?.length || 1) * currentPrices.seriesPrice;
      }
      
      const finalPrice = item.paymentType === 'transfer' ? Math.round(basePrice * (1 + transferFeePercentage / 100)) : basePrice;
      const paymentTypeText = item.paymentType === 'transfer' ? `Transferencia (+${transferFeePercentage}%)` : 'Efectivo';
      const emoji = item.type === 'movie' ? '🎬' : item.type === 'tv' ? '📺' : '📚';
      
      let itemText = `${emoji} *${item.title}*${seasonInfo}${extendedSeriesInfo}${novelInfo}\n`;
      itemText += `  📋 Tipo: ${itemType}\n`;
      
      if (item.type === 'tv' && item.episodeCount && item.episodeCount > 50) {
        itemText += `  📊 Serie extensa: ${item.episodeCount} episodios (precio estándar $${currentPrices.seriesPrice} CUP/temporada)\n`;
      }
      
      itemText += `  💳 Método de pago: ${paymentTypeText}\n`;
      
      if (item.paymentType === 'transfer') {
        const recargo = finalPrice - basePrice;
        itemText += `  💰 Precio base: $${basePrice.toLocaleString()} CUP\n`;
        itemText += `  💳 Recargo transferencia (${transferFeePercentage}%): +$${recargo.toLocaleString()} CUP\n`;
        itemText += `  💰 Precio final: $${finalPrice.toLocaleString()} CUP`;
      } else {
        itemText += `  💰 Precio: $${finalPrice.toLocaleString()} CUP`;
      }
      
      return itemText;
    })
    .join('\n\n');

  // Construir mensaje completo con información del dispositivo
  let message = `🎬 *NUEVO PEDIDO - TV A LA CARTA*\n\n`;
  message += `📋 *ID de Orden:* ${orderId}\n\n`;
  
  message += `👤 *DATOS DEL CLIENTE:*\n`;
  message += `• Nombre: ${customerInfo.fullName}\n`;
  message += `• Teléfono: ${customerInfo.phone}\n`;
  if (!pickupLocation && customerInfo.address) {
    message += `• Dirección: ${customerInfo.address}\n`;
  }
  message += `\n`;
  
  message += `🎯 *PRODUCTOS SOLICITADOS:*\n${itemsList}\n\n`;
  
  // Desglosar por tipo de pago
  const cashItems = items.filter(item => item.paymentType === 'cash');
  const transferItems = items.filter(item => item.paymentType === 'transfer');
  
  message += `📊 *DESGLOSE DETALLADO POR MÉTODO DE PAGO:*\n`;
  
  if (cashItems.length > 0) {
    message += `💵 *PAGO EN EFECTIVO:*\n`;
    cashItems.forEach(item => {
      let basePrice: number;
      if (item.type === 'novel') {
        basePrice = item.chapters * currentPrices.novelPricePerChapter;
      } else if (item.type === 'movie') {
        basePrice = currentPrices.moviePrice;
      } else {
        basePrice = (item.selectedSeasons?.length || 1) * currentPrices.seriesPrice;
      }
      const emoji = item.type === 'movie' ? '🎬' : item.type === 'tv' ? '📺' : '📚';
      message += `  ${emoji} ${item.title}: $${basePrice.toLocaleString()} CUP\n`;
    });
    message += `  💰 *Subtotal Efectivo: $${cashTotal.toLocaleString()} CUP*\n\n`;
  }
  
  if (transferItems.length > 0) {
    message += `🏦 *PAGO POR TRANSFERENCIA BANCARIA (+${transferFeePercentage}%):*\n`;
    transferItems.forEach(item => {
      let basePrice: number;
      if (item.type === 'novel') {
        basePrice = item.chapters * currentPrices.novelPricePerChapter;
      } else if (item.type === 'movie') {
        basePrice = currentPrices.moviePrice;
      } else {
        basePrice = (item.selectedSeasons?.length || 1) * currentPrices.seriesPrice;
      }
      const finalPrice = Math.round(basePrice * (1 + transferFeePercentage / 100));
      const recargo = finalPrice - basePrice;
      const emoji = item.type === 'movie' ? '🎬' : item.type === 'tv' ? '📺' : '📚';
      message += `  ${emoji} ${item.title}:\n`;
      message += `    💰 Base: $${basePrice.toLocaleString()} CUP\n`;
      message += `    💳 Recargo (${transferFeePercentage}%): +$${recargo.toLocaleString()} CUP\n`;
      message += `    💰 Total: $${finalPrice.toLocaleString()} CUP\n`;
    });
    message += `  💰 *Subtotal Transferencia: $${transferTotal.toLocaleString()} CUP*\n\n`;
  }
  
  message += `📋 *RESUMEN FINAL DE PAGOS:*\n`;
  if (cashTotal > 0) {
    message += `• Efectivo: $${cashTotal.toLocaleString()} CUP (${cashItems.length} elementos)\n`;
  }
  if (transferTotal > 0) {
    message += `• Transferencia: $${transferTotal.toLocaleString()} CUP (${transferItems.length} elementos)\n`;
  }
  message += `• *Subtotal Contenido: $${subtotal.toLocaleString()} CUP*\n`;
  
  if (transferFee > 0) {
    message += `• Recargo transferencia (${transferFeePercentage}%): +$${transferFee.toLocaleString()} CUP\n`;
  }
  
  // Información de entrega
  message += `\n📍 *INFORMACIÓN DE ENTREGA:*\n`;
  if (pickupLocation) {
    message += `🏪 *RECOGIDA EN EL LOCAL:*\n`;
    message += `• Ubicación: TV a la Carta\n`;
    message += `• Dirección: Reparto Nuevo Vista Alegre, Santiago de Cuba\n`;
    message += `• Costo: GRATIS\n`;
    
    if (showLocationMap) {
      message += `• 📍 Coordenadas GPS: 20.039585, -75.849663\n`;
      message += `• 🗺️ Google Maps: https://www.google.com/maps/place/20%C2%B002'22.5%22N+75%C2%B050'58.8%22W/@20.0394604,-75.8495414,180m/data=!3m1!1e3!4m4!3m3!8m2!3d20.039585!4d-75.849663?entry=ttu&g_ep=EgoyMDI1MDczMC4wIKXMDSoASAFQAw%3D%3D\n`;
    }
  } else {
    message += `🚚 *ENTREGA A DOMICILIO:*\n`;
    message += `• Zona: ${deliveryZone.replace(' > ', ' → ')}\n`;
    if (customerInfo.address) {
      message += `• Dirección: ${customerInfo.address}\n`;
    }
    message += `• Costo de entrega: $${deliveryCost.toLocaleString()} CUP\n`;
  }
  
  message += `\n🎯 *TOTAL FINAL: $${total.toLocaleString()} CUP*\n\n`;
  
  message += `📊 *ESTADÍSTICAS DEL PEDIDO:*\n`;
  message += `• Total de elementos: ${items.length}\n`;
  message += `• Películas: ${items.filter(item => item.type === 'movie').length}\n`;
  message += `• Series: ${items.filter(item => item.type === 'tv').length}\n`;
  message += `• Novelas: ${items.filter(item => item.type === 'novel').length}\n`;
  if (cashItems.length > 0) {
    message += `• Pago en efectivo: ${cashItems.length} elementos\n`;
  }
  if (transferItems.length > 0) {
    message += `• Pago por transferencia: ${transferItems.length} elementos\n`;
  }
  message += `• Tipo de entrega: ${pickupLocation ? 'Recogida en local' : 'Entrega a domicilio'}\n\n`;
  
  message += `💼 *CONFIGURACIÓN DE PRECIOS APLICADA:*\n`;
  message += `• Películas: $${currentPrices.moviePrice.toLocaleString()} CUP\n`;
  message += `• Series: $${currentPrices.seriesPrice.toLocaleString()} CUP por temporada\n`;
  message += `• Novelas: $${currentPrices.novelPricePerChapter.toLocaleString()} CUP por capítulo\n`;
  message += `• Recargo transferencia: ${transferFeePercentage}%\n\n`;
  
  // Información técnica del dispositivo (útil para soporte)
  message += `📱 *INFORMACIÓN TÉCNICA:*\n`;
  message += `• Dispositivo: ${deviceInfo.device.isMobile ? 'Móvil' : deviceInfo.device.isTablet ? 'Tablet' : 'Escritorio'}\n`;
  message += `• Sistema: ${
    deviceInfo.os.isAndroid ? 'Android' :
    deviceInfo.os.isIOS ? 'iOS' :
    deviceInfo.os.isWindows ? 'Windows' :
    deviceInfo.os.isMacOS ? 'macOS' :
    deviceInfo.os.isLinux ? 'Linux' : 'Otro'
  }\n`;
  message += `• Navegador: ${
    deviceInfo.browser.isChrome ? 'Chrome' :
    deviceInfo.browser.isFirefox ? 'Firefox' :
    deviceInfo.browser.isSafari ? 'Safari' :
    deviceInfo.browser.isEdge ? 'Edge' :
    deviceInfo.browser.isOpera ? 'Opera' :
    deviceInfo.browser.isBrave ? 'Brave' : 'Otro'
  }\n`;
  message += `• Pantalla: ${window.screen.width}x${window.screen.height}\n`;
  message += `• Táctil: ${deviceInfo.touchSupport ? 'Sí' : 'No'}\n\n`;
  
  message += `📱 *Enviado desde:* TV a la Carta App (Multiplataforma)\n`;
  message += `⏰ *Fecha y hora:* ${new Date().toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  })}\n`;
  message += `🌟 *¡Gracias por elegir TV a la Carta!*`;
  
  const phoneNumber = '5354690878';
  
  // Usar la función mejorada de WhatsApp
  openWhatsAppWithFallback(phoneNumber, message);
}