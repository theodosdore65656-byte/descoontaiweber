import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'; 
import { db } from '../../../lib/firebase';
import { Restaurant } from '../../../types';
import { RestaurantCard } from '../../Home/components/RestaurantCard';
import { Loader2, Star, Truck, ShoppingBag, MessageCircle, Store } from 'lucide-react';
import { useLocation } from '../../Location/context/LocationContext';

interface ShopsScreenProps {
  onSelectRestaurant: (id: string) => void;
}

type SortCriteria = 'general' | 'delivery' | 'service' | 'product';

export const ShopsScreen: React.FC<ShopsScreenProps> = ({ onSelectRestaurant }) => {
  const [merchants, setMerchants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSort, setActiveSort] = useState<SortCriteria>('general');
  const { location } = useLocation();

  useEffect(() => {
    const fetchMerchants = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'merchants'), where('isApproved', '==', true));
        const snapshot = await getDocs(q);
        const data: Restaurant[] = [];
        const now = new Date();

        snapshot.forEach((doc) => {
          const merchantData = doc.data() as Restaurant;
          
          // --- REGRA DE OURO: O FISCAL DO CLIENTE ---
          
          // 1. Bloqueio por status explícito
          if (merchantData.subscriptionStatus === 'suspended') return;

          // 2. Bloqueio por cálculo de data
          if (merchantData.nextDueDate && merchantData.subscriptionStatus !== 'trial') {
             let dueDate: Date;
             
             if (merchantData.nextDueDate instanceof Timestamp) {
                dueDate = merchantData.nextDueDate.toDate();
             } else if ((merchantData.nextDueDate as any).seconds) {
                dueDate = new Date((merchantData.nextDueDate as any).seconds * 1000);
             } else {
                dueDate = new Date(merchantData.nextDueDate as any);
             }

             const diffTime = now.getTime() - dueDate.getTime();
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

             if (diffDays > 5) {
                return;
             }
          }

          data.push({ ...merchantData, id: doc.id });
        });
        setMerchants(data);
      } catch (error) {
        console.error("Erro ao buscar lojas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, []);

  const isRestaurantOpen = (restaurant: Restaurant): boolean => {
    // Verifica flag manual
    if (!restaurant.isOpen) return false;
    
    // Se não tem agenda, assume aberto se a flag estiver true
    if (!restaurant.schedule) return true;

    const now = new Date();
    const dayIndex = now.getDay();
    const keysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const currentKey = keysMap[dayIndex];
    const todaySchedule = restaurant.schedule[currentKey];

    if (!todaySchedule || !todaySchedule.isOpen) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = todaySchedule.open.split(':').map(Number);
    const [closeH, closeM] = todaySchedule.close.split(':').map(Number);
    
    const openTime = openH * 60 + openM;
    let closeTime = closeH * 60 + closeM;

    // Ajuste para horários que viram o dia (Ex: 18:00 as 02:00)
    if (closeTime < openTime) closeTime += 24 * 60;

    return currentMinutes >= openTime && currentMinutes <= closeTime;
  };

  const sortedMerchants = useMemo(() => {
    // Mapeia adicionando o status calculado de aberto/fechado
    const mapped = merchants.map(m => ({
      ...m,
      _isOpen: isRestaurantOpen(m)
    }));

    return mapped.sort((a, b) => {
      // 1º CRITÉRIO: STATUS (Aberto > Fechado)
      if (a._isOpen && !b._isOpen) return -1;
      if (!a._isOpen && b._isOpen) return 1;

      // 2º CRITÉRIO: PONTUAÇÃO (Maior > Menor)
      let scoreA = 0;
      let scoreB = 0;

      const breakdownA = a.ratingBreakdown || { product: 5, delivery: 5, service: 5 };
      const breakdownB = b.ratingBreakdown || { product: 5, delivery: 5, service: 5 };

      switch (activeSort) {
        case 'delivery':
          scoreA = breakdownA.delivery;
          scoreB = breakdownB.delivery;
          break;
        case 'service':
          scoreA = breakdownA.service;
          scoreB = breakdownB.service;
          break;
        case 'product':
          scoreA = breakdownA.product;
          scoreB = breakdownB.product;
          break;
        default: // 'general'
          // Usa a nota geral (rating) como critério principal
          scoreA = a.rating || 5;
          scoreB = b.rating || 5;
      }

      return scoreB - scoreA;
    });
  }, [merchants, activeSort]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-brand-600 mb-2" size={32} />
        <p className="text-gray-400 text-sm">Carregando lojas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Fixo */}
      <div className="bg-white sticky top-0 z-10 shadow-sm pt-safe-top">
         <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
               <Store className="text-brand-600" /> Todos os estabelecimentos
            </h1>
            <p className="text-xs text-gray-500 mt-1">
               Aqui você pode bisbilhotar tudo sobre os estabelecimentos! 👀
            </p>
         </div>

         {/* Filtros de Qualidade */}
         <div className="flex px-4 pb-4 gap-2 overflow-x-auto no-scrollbar">
            <button 
               onClick={() => setActiveSort('general')}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap
               ${activeSort === 'general' ? 'bg-brand-600 text-white border-brand-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
            >
               <Star size={12} className={activeSort === 'general' ? 'fill-white' : ''} /> Geral
            </button>

            <button 
               onClick={() => setActiveSort('delivery')}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap
               ${activeSort === 'delivery' ? 'bg-brand-600 text-white border-brand-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
            >
               <Truck size={12} /> Melhor Entrega
            </button>

            <button 
               onClick={() => setActiveSort('product')}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap
               ${activeSort === 'product' ? 'bg-brand-600 text-white border-brand-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
            >
               <ShoppingBag size={12} /> Melhor Produto
            </button>

            <button 
               onClick={() => setActiveSort('service')}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap
               ${activeSort === 'service' ? 'bg-brand-600 text-white border-brand-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
            >
               <MessageCircle size={12} /> Melhor Atend.
            </button>
         </div>
      </div>

      {/* Lista de Lojas */}
      <div className="px-4 mt-4 space-y-4">
         {sortedMerchants.map((merchant) => (
            <div 
               key={merchant.id} 
               className={`transition-all duration-500 ${!merchant._isOpen ? 'grayscale opacity-60 pointer-events-none select-none filter blur-[0.5px]' : ''}`}
            >
               {/* Label Visual para Fechados */}
               {!merchant._isOpen && (
                  <div className="mb-1 ml-1 text-center">
                     <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded uppercase tracking-wide">
                        Fechado Agora
                     </span>
                  </div>
               )}
               
               <RestaurantCard 
                  restaurant={merchant} 
                  onClick={() => {
                      if (merchant._isOpen) {
                          onSelectRestaurant(merchant.id);
                      }
                  }} 
               />
            </div>
         ))}

         {sortedMerchants.length === 0 && (
            <div className="text-center py-10 text-gray-400">
               <p>Nenhuma loja encontrada.</p>
            </div>
         )}
      </div>
    </div>
  );
};