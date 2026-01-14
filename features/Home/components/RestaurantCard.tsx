import React from 'react';
import { Star, Clock } from 'lucide-react';
import { Restaurant } from '../../../types';
// IMPORTANTE: Adicionei o hook de localização para saber onde o usuário mora
import { useLocation } from '../../Location/context/LocationContext';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: () => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onClick }) => {
  const { location } = useLocation();

  // --- LÓGICA DE CÁLCULO INTELIGENTE (IGUAL AO CABEÇALHO DA LOJA) ---
  const getDeliveryInfo = () => {
    // 1. Verifica se a loja tem a configuração nova
    if (restaurant.deliveryConfig) {
        
        // Caso 1: Taxa Fixa para a cidade toda
        if (restaurant.deliveryConfig.type === 'fixed') {
            const price = restaurant.deliveryConfig.fixedPrice || 0;
            return { 
                text: price === 0 ? 'Grátis' : `R$ ${price.toFixed(2)}`, 
                isFree: price === 0 
            };
        }

        // Caso 2: Por Bairro (Iguatu)
        if (restaurant.deliveryConfig.type === 'neighborhood') {
            // Se o usuário ainda não escolheu endereço no topo
            if (!location || !location.neighborhood) {
                return { text: 'Ver Taxa', isFree: false };
            }

            // Busca o preço do bairro do usuário
            const price = restaurant.deliveryConfig.neighborhoodPrices?.[location.neighborhood];
            
            // Se encontrou preço para o bairro
            if (price !== undefined) {
                return { 
                    text: price === 0 ? 'Grátis' : `R$ ${price.toFixed(2)}`, 
                    isFree: price === 0 
                };
            }
            
            // Se o bairro não está na lista da loja
            return { text: 'A Consultar', isFree: false };
        }
    }

    // 2. Fallback (Compatibilidade com lojas antigas)
    // Tenta usar deliveryFee ou deliveryPrice, o que existir
    const legacyPrice = restaurant.deliveryFee ?? restaurant.deliveryPrice ?? 0;
    return { 
        text: legacyPrice === 0 ? 'Grátis' : `R$ ${legacyPrice.toFixed(2)}`, 
        isFree: legacyPrice === 0 
    };
  };

  const { text, isFree } = getDeliveryInfo();

  return (
    <div 
      onClick={onClick}
      className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-3 active:scale-[0.98] transition-transform cursor-pointer"
    >
      {/* Imagem (Logo) */}
      <div className="w-20 h-20 shrink-0 rounded-xl bg-gray-100 overflow-hidden relative border border-gray-100">
        <img 
          src={restaurant.image} 
          alt={restaurant.name} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Badge de Promoção */}
        {restaurant.hasActivePromo && (
           <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-[9px] font-bold text-center py-0.5">
             OFERTA
           </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-start gap-2">
           <h3 className="font-bold text-gray-900 text-sm truncate">{restaurant.name}</h3>
           
           {/* Nota */}
           <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded-md border border-yellow-100 shrink-0">
              <Star size={10} className="fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-bold text-yellow-700">
                {restaurant.rating ? restaurant.rating.toFixed(1) : 'New'}
              </span>
           </div>
        </div>

        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
          {restaurant.tags?.slice(0, 3).join(' • ') || restaurant.category}
        </p>
        
        <div className="flex items-center gap-3 mt-2">
           <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={12} />
              <span>{restaurant.deliveryTime} min</span>
           </div>
           
           {/* CORREÇÃO APLICADA AQUI: Exibe o valor calculado dinamicamente */}
           <div className={`text-xs font-bold ${isFree ? 'text-green-600' : 'text-gray-600'}`}>
              {isFree ? 'Entrega Grátis' : text}
           </div>
        </div>
      </div>
    </div>
  );
};
