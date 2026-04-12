export function generateWhatsAppLink(cook, dish, orderDetails) {
  const { type, quantity, date, time, notes } = orderDetails;

  let message = `مرحبا ${cook.name}، أريد طلب من *نَكهة* 🍲\n\n`;
  message += `🍽️ *الطبق:* ${dish.name}\n`;
  message += `🔢 *الكمية:* ${quantity}\n`;
  message += `📋 *نوع الطلب:* ${type === 'instant' ? 'فوري' : 'مسبق'}\n`;

  if (type === 'scheduled') {
    if (date) message += `📅 *التاريخ:* ${date}\n`;
    if (time) message += `⏰ *الوقت:* ${time}\n`;
  }

  if (notes) message += `📝 *ملاحظات:* ${notes}\n`;

  if (dish.price) {
    message += `\n💰 *السعر التقريبي:* ${dish.price * quantity} دج`;
  }

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cook.whatsapp}?text=${encodedMessage}`;
}
