import React from 'react';
import { Restaurant } from '../../../types';
import { MapPin, Star, Clock, Info, Motorbike } from 'lucide-react';
import { useLocation } from '../../Location/context/LocationContext';

interface RestaurantHeaderProps {
  restaurant: Restaurant;
}

export const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({ restaurant }) => {
  const { location } = useLocation();

  // --- LÓGICA DE CÁLCULO DE FRETE ---
  const getDeliveryDisplay = () => {
    // 1. Fallback para lojas antigas (sem config nova)
    if (!restaurant.deliveryConfig) {
       return restaurant.deliveryPrice === 0 ? 'Grátis' : `R$ ${restaurant.deliveryPrice.toFixed(2)}`;
    }

    // 2. Configuração: Taxa Fixa (Cidade toda)
    if (restaurant.deliveryConfig.type === 'fixed') {
       const price = restaurant.deliveryConfig.fixedPrice || 0;
       return price === 0 ? 'Grátis' : `R$ ${price.toFixed(2)}`;
    }

    // 3. Configuração: Por Bairro
    if (restaurant.deliveryConfig.type === 'neighborhood') {
       // Se o cliente ainda não selecionou endereço no topo
       if (!location || !location.neighborhood) {
          return 'Definir Local';
       }

       // Busca o preço específico do bairro do cliente
       const neighborhoodPrice = restaurant.deliveryConfig.neighborhoodPrices?.[location.neighborhood];

       // Se encontrou preço para o bairro
       if (neighborhoodPrice !== undefined) {
          return neighborhoodPrice === 0 ? 'Grátis' : `R$ ${neighborhoodPrice.toFixed(2)}`;
       }

       // Se o bairro do cliente não está na lista de entrega da loja
       return 'Sob Consulta';
    }

    return 'A Combinar';
  };

  const deliveryText = getDeliveryDisplay();
  const isFree = deliveryText === 'Grátis';

  return (
    <div className="relative">
      {/* Banner / Capa */}
      <div className="h-48 w-full relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
        <img 
          src={restaurant.coverImage || restaurant.image} 
          alt={restaurant.name} 
          className="w-full h-full object-cover"
        />
        
        {/* Botão Voltar (Absolute) - Opcional se já tiver na tela pai */}
      </div>

      {/* Conteúdo Sobreposto */}
      <div className="px-4 -mt-16 relative z-20 pb-4">
        
        {/* Logo e Status */}
        <div className="flex justify-between items-end mb-3">
           <div className="bg-white p-1 rounded-2xl shadow-lg w-24 h-24 flex items-center justify-center">
              <img 
                src={restaurant.logo || restaurant.image} 
                alt="Logo" 
                className="w-full h-full object-cover rounded-xl"
              />
           </div>
           
           {/* Badges Info (Avaliação e Tempo) */}
           <div className="flex gap-2 mb-2">
              <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                 <Star size={14} className="text-yellow-400 fill-yellow-400" />
                 <span className="text-xs font-bold text-gray-800">{restaurant.rating.toFixed(1)}</span>
              </div>
              <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                 <Clock size={14} className="text-gray-500" />
                 <span className="text-xs font-bold text-gray-800">{restaurant.deliveryTime} min</span>
              </div>
           </div>
        </div>

        {/* Nome e Descrição */}
        <div>
           <h1 className="text-2xl font-bold text-gray-900 mb-1">{restaurant.name}</h1>
           <div className="flex items-center text-gray-500 text-sm mb-3">
              <span className="capitalize">{restaurant.category}</span>
              <span className="mx-2">•</span>
              <span className="truncate max-w-[200px]">{restaurant.address}</span>
           </div>
        </div>

        {/* --- O CÍRCULO AZUL (BADGE DE ENTREGA) CORRIGIDO --- */}
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-3">
           <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                 <Motorbike size={20} />
              </div>
              <div>
                 <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">Entrega</p>
                 
                 {/* Aqui está a correção: Exibe o valor calculado ou Grátis */}
                 <p className={`text-sm font-bold ${isFree ? 'text-green-600' : 'text-gray-800'}`}>
                    {deliveryText}
                 </p>
              </div>
           </div>

           {/* Se for 'Definir Local', dá uma dica visual */}
           {deliveryText === 'Definir Local' && (
             <span className="text-[10px] text-blue-400 bg-white px-2 py-1 rounded border border-blue-100">
                Selecione seu endereço
             </span>
           )}
        </div>

        {/* Status Aberto/Fechado (Opcional, se quiser mostrar aqui também) */}
        {!restaurant.isOpen && (
           <div className="mt-2 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-xs font-bold text-center">
              Fechado no momento
           </div>
        )}

      </div>
    </div>
  );
};
