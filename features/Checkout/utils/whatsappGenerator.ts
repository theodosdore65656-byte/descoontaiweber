import { CartItem, Restaurant } from '../../../types';

interface OrderDetails {
  customerName: string;
  paymentMethod: string;
  orderType: 'delivery' | 'pickup';
  items: CartItem[];
  total: number;
  deliveryFee: number;
  address?: string;
  changeFor?: string;
  couponCode?: string;
  discountAmount?: number;
}

export const generateWhatsAppLink = (
  restaurant: Restaurant,
  details: OrderDetails
): string => {
  const { 
    customerName, 
    paymentMethod,
    orderType,
    items, 
    total, 
    deliveryFee, 
    address,
    changeFor,
    couponCode,
    discountAmount = 0
  } = details;

  const lineBreak = '%0A';
  const doubleBreak = '%0A%0A';
  const bold = (text: string) => `*${text}*`;
  const separator = `--------------------------------`;
  
  let message = `🔔 ${bold('NOVO PEDIDO CHEGANDO!')} 🔔${lineBreak}`;
  message += `via App ${bold('Descoontaí')}`;
  message += `${doubleBreak}${separator}${doubleBreak}`;

  const typeEmoji = orderType === 'delivery' ? '🛵' : '🏃';
  const typeText = orderType === 'delivery' ? 'ENTREGA (Delivery)' : 'RETIRADA (Balcão)';
  
  message += `${typeEmoji} ${bold('TIPO DO PEDIDO:')}${lineBreak}`;
  message += `👉 ${bold(typeText)}`;
  message += `${doubleBreak}${separator}${doubleBreak}`;

  message += `👤 ${bold('DADOS DO CLIENTE')}${lineBreak}`;
  message += `Nome: ${customerName}`;
  
  if (orderType === 'delivery' && address) {
    message += `${doubleBreak}📍 ${bold('ENDEREÇO DE ENTREGA:')}${lineBreak}`;
    message += `${address}`;
  } else if (orderType === 'pickup') {
    message += `${doubleBreak}📍 ${bold('RETIRADA NO LOCAL')}${lineBreak}`;
    message += `(Cliente irá buscar na loja)`;
  }

  message += `${doubleBreak}${separator}${doubleBreak}`;

  message += `📝 ${bold('RESUMO DO PEDIDO')}${doubleBreak}`;
  
  items.forEach((item, index) => {
    let addonsTotal = 0;
    if (item.selectedGroups) {
      item.selectedGroups.forEach(g => {
        g.items.forEach(i => addonsTotal += i.price);
      });
    }
    
    const itemUnitPrice = item.price + addonsTotal;
    const totalItemPrice = itemUnitPrice * item.quantity;

    message += `▪️ ${bold(`${item.quantity}x ${item.name}`)}`;
    
    if (item.selectedGroups && item.selectedGroups.length > 0) {
      item.selectedGroups.forEach(group => {
         group.items.forEach(addon => {
            message += `${lineBreak}   + ${addon.name}`;
         });
      });
    }

    if (item.note) {
      message += `${lineBreak}   ⚠️ _Obs: ${item.note}_`;
    }
    
    message += `${lineBreak}   💰 R$ ${totalItemPrice.toFixed(2)}`;

    if (index < items.length - 1) {
        message += `${doubleBreak}`; 
    }
  });

  message += `${doubleBreak}${separator}${doubleBreak}`;

  const finalTotal = total + (orderType === 'delivery' ? deliveryFee : 0);
  const subtotalOriginal = total + discountAmount;

  message += `💲 ${bold('PAGAMENTO')}${lineBreak}`;
  message += `Forma: ${paymentMethod}${lineBreak}`;
  
  if (paymentMethod === 'Dinheiro') {
    if (changeFor && changeFor.trim() !== '') {
       message += `💵 ${bold(`Troco para: R$ ${changeFor}`)}${lineBreak}`;
       const changeVal = parseFloat(changeFor.replace(',', '.').replace(/[^0-9.]/g, ''));
       if (!isNaN(changeVal) && changeVal > finalTotal) {
          const changeReturn = changeVal - finalTotal;
          message += `   👉 _(Levar R$ ${changeReturn.toFixed(2)} de troco)_`;
       }
    } else {
       message += `✅ Sem necessidade de troco`;
    }
  }

  message += `${doubleBreak}${separator}${doubleBreak}`;

  message += `📊 ${bold('VALORES FINAIS')}${lineBreak}`;
  message += `Subtotal: R$ ${subtotalOriginal.toFixed(2)}${lineBreak}`;
  
  if (couponCode && discountAmount > 0) {
    message += `🎟️ Cupom (${couponCode}): - R$ ${discountAmount.toFixed(2)}${lineBreak}`;
  }

  if (orderType === 'delivery') {
    message += `Taxa de Entrega: R$ ${deliveryFee.toFixed(2)}${doubleBreak}`;
  } else {
    message += `Taxa de Entrega: Grátis${doubleBreak}`;
  }
  
  message += `⭐️ ${bold(`TOTAL A PAGAR: R$ ${finalTotal.toFixed(2)}`)}`;
  
  message += `${doubleBreak}${separator}${lineBreak}`;
  message += `_Pedido gerado automaticamente_${lineBreak}`;
  message += `www.descoontai.app`;

  let phone = restaurant.whatsappNumber.replace(/\D/g, '');
  if (phone.length >= 10 && phone.length <= 11) {
    phone = `55${phone}`;
  }

  return `https://wa.me/${phone}?text=${message}`;
};