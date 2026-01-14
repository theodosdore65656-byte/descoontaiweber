import React, { useEffect, useState, useMemo } from 'react';
import { RestaurantCard } from './RestaurantCard';
import { useFilter } from '../context/FilterContext';
import { useLocation } from '../../Location/context/LocationContext';
import { Store, Loader2, SearchX } from 'lucide-react';
import { Restaurant } from '../../../types';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'; 
import { db } from '../../../lib/firebase';

interface RestaurantFeedProps {
  onSelectRestaurant: (id: string) => void;
}

// --- UTILITÁRIOS DE BUSCA NATIVA ---

const normalize = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

const getLevenshteinDistance = (a: string, b: string) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= b.length; i++) { matrix[i][0] = i; }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
};

export const RestaurantFeed: React.FC<RestaurantFeedProps> = ({ onSelectRestaurant }) => {
  const { selectedCategoryId, searchQuery } = useFilter();
  const { location } = useLocation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FUNÇÃO DE VERIFICAÇÃO DE HORÁRIO EM TEMPO REAL ---
  const isRestaurantOpen = (restaurant: Restaurant): boolean => {
    // 1. Se o dono fechou manualmente no painel (Botão "Fechar Loja"), está fechado.
    if (restaurant.isOpen === false) return false;
    
    // 2. Se não tem horário configurado, mas o botão está ON, considera aberto.
    if (!restaurant.schedule) return true;

    // 3. Verifica a Agenda (Dia e Hora)
    const now = new Date();
    const dayIndex = now.getDay();
    const keysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const currentKey = keysMap[dayIndex];
    const todaySchedule = restaurant.schedule[currentKey];

    // Se não abre hoje ou o dia está marcado como fechado
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

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'merchants'), where('isApproved', '==', true));
        const querySnapshot = await getDocs(q);
        
        const fetchedRestaurants: Restaurant[] = [];
        const now = new Date(); 

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Restaurant;
          
          // --- REGRA DE OURO: O FISCAL DO CLIENTE ---
          if (data.subscriptionStatus === 'suspended') return;

          if (data.nextDueDate && data.subscriptionStatus !== 'trial') {
             let dueDate: Date;
             if (data.nextDueDate instanceof Timestamp) {
                dueDate = data.nextDueDate.toDate();
             } else if ((data.nextDueDate as any).seconds) {
                dueDate = new Date((data.nextDueDate as any).seconds * 1000);
             } else {
                dueDate = new Date(data.nextDueDate as any);
             }

             const diffTime = now.getTime() - dueDate.getTime();
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

             if (diffDays > 5) {
                return;
             }
          }

          fetchedRestaurants.push({ ...data, id: doc.id });
        });
        
        setRestaurants(fetchedRestaurants);
      } catch (error) {
        console.error("Erro ao buscar lojas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [location?.city]);

  // Lógica de Filtragem e Busca Robusta
  const filteredRestaurants = useMemo(() => {
    // Adiciona o status calculado (_isOpenCalculated) para cada restaurante
    let candidates = restaurants.map(r => ({
        ...r,
        _isOpenCalculated: isRestaurantOpen(r)
    }));

    const cleanQuery = normalize(searchQuery);
    const hasSearch = cleanQuery.length > 0;

    // 1. Filtragem Inicial (Categoria apenas)
    if (!hasSearch) {
       if (selectedCategoryId !== 'all') {
          candidates = candidates.filter(r => r.tags && r.tags.includes(selectedCategoryId));
       }
       
       // ORDENAÇÃO PRINCIPAL DA HOME:
       // 1º - Abertos (Calculado)
       // 2º - Melhor Nota Geral
       return candidates.sort((a, b) => {
           // Abertos primeiro
           if (a._isOpenCalculated && !b._isOpenCalculated) return -1;
           if (!a._isOpenCalculated && b._isOpenCalculated) return 1;
           
           // Desempate por nota (Rating Geral)
           const ratingA = a.rating || 0;
           const ratingB = b.rating || 0;
           return ratingB - ratingA;
       });
    }

    // 2. Lógica de Busca Avançada (Pontuação)
    const scored = candidates.map(r => {
       let score = 0;
       const normName = normalize(r.name);
       const normDesc = r.description ? normalize(r.description) : '';
       const normTags = r.tags ? r.tags.map(t => normalize(t)) : [];

       if (normName === cleanQuery) score += 100;
       else if (normName.startsWith(cleanQuery)) score += 80;
       else if (normName.includes(cleanQuery)) score += 60;

       if (normTags.some(t => t.includes(cleanQuery))) score += 50;

       if (normDesc.includes(cleanQuery)) score += 30;

       const queryWords = cleanQuery.split(' ').filter(w => w.length > 2);
       if (queryWords.length > 0) {
          const nameWords = normName.split(' ');
          let wordMatches = 0;
          queryWords.forEach(qw => {
             if (nameWords.some(nw => nw.includes(qw))) wordMatches++;
          });
          if (wordMatches > 0) score += (wordMatches * 20);
       }

       if (score === 0 && cleanQuery.length > 3) {
          const dist = getLevenshteinDistance(normName, cleanQuery);
          if (dist <= 2 || dist < cleanQuery.length * 0.3) {
             score += 15;
          }
          
          normTags.forEach(t => {
             const distTag = getLevenshteinDistance(t, cleanQuery);
             if (distTag <= 2) score += 15;
          });
       }

       return { ...r, _score: score };
    });

    return scored
      .filter(r => r._score > 0)
      .sort((a, b) => {
          // Mesmo na busca, prioriza os abertos
          if (a._isOpenCalculated && !b._isOpenCalculated) return -1;
          if (!a._isOpenCalculated && b._isOpenCalculated) return 1;
          
          return b._score - a._score;
      });

  }, [restaurants, searchQuery, selectedCategoryId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Loader2 size={40} className="animate-spin text-brand-600 mb-2" />
        <p className="text-sm">Buscando lojas em tempo real...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-h-[200px]">
       <h2 className="font-bold text-lg text-gray-900 mb-2">
        {searchQuery 
          ? `Resultados para "${searchQuery}"`
          : selectedCategoryId === 'all' 
            ? `Estabelecimentos em ${location?.city || 'sua região'}` 
            : 'Lojas na categoria selecionada'
        }
      </h2>

      {filteredRestaurants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200 p-6 animate-in fade-in">
          {searchQuery ? (
             <>
               <SearchX size={48} className="mb-2 text-gray-300" />
               <p className="font-medium text-center">Nenhuma loja encontrada para "{searchQuery}"</p>
               <p className="text-xs text-gray-400 mt-1 text-center">Tente buscar apenas pelo nome principal ou categoria.</p>
             </>
          ) : (
             <>
               <Store size={48} className="mb-2 text-gray-300" />
               <p className="font-medium text-center">Nenhuma loja disponível nesta categoria.</p>
               <p className="text-xs text-gray-400 mt-1 text-center">Tente outra categoria ou volte mais tarde.</p>
             </>
          )}
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-2 duration-300 space-y-3">
          {filteredRestaurants.map(restaurant => {
            // Usa o status CALCULADO para definir o visual
            const isOpenNow = restaurant._isOpenCalculated;

            // Lógica visual para fechados
            const isClosedStyle = !isOpenNow 
                ? "opacity-60 grayscale pointer-events-none select-none filter blur-[0.5px]" 
                : "";
                
            return (
              <div key={restaurant.id} className={`transition-all duration-300 ${isClosedStyle}`}>
                <RestaurantCard 
                  restaurant={restaurant} 
                  onClick={() => {
                    if (isOpenNow) {
                        onSelectRestaurant(restaurant.id);
                    }
                  }} 
                />
                {!isOpenNow && (
                    <div className="text-center text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider">
                        Fechado Agora
                    </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};