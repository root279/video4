export function sendToWhatsApp(cartItems: any[]) {
  const phoneNumber = '5354690878';
  
  let message = '🎬 *Pedido de Películas y Series*\n\n';
  
  cartItems.forEach((item, index) => {
    const year = item.release_date || item.first_air_date;
    const displayYear = year ? new Date(year).getFullYear() : 'N/A';
    const rating = item.vote_average ? `⭐ ${item.vote_average.toFixed(1)}` : '';
    const type = item.type === 'movie' ? '🎬' : '📺';
    
    message += `${index + 1}. ${type} *${item.title}*\n`;
    message += `   Año: ${displayYear}\n`;
    if (rating) message += `   ${rating}\n`;
    message += '\n';
  });
  
  message += `📦 *Total de elementos:* ${cartItems.length}\n\n`;
  message += '¡Gracias por tu pedido! 🙏';
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  
  window.open(whatsappURL, '_blank');
}