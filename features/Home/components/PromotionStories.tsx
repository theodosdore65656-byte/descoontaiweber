import React, { useState, useEffect } from 'react';
import { StoryCircle } from './StoryCircle';
import { PromotionsModal } from './PromotionsModal';
import { Story, Product, Restaurant } from '../../../types';
import { Flame, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

// Mapeamento de Imagens e Nomes para as categorias DOS STORIES
// IDs mantidos para compatibilidade, Nomes ajustados conforme pedido.
const CATEGORY_CONFIG: Record<string, { name: string, image: string }> = {
  'hamburgueria': { 
    name: 'Burger', 
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&h=150&fit=crop&q=80' 
  },
  'pizzaria': { 
    name: 'Pizza', 
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150&h=150&fit=crop&q=80' 
  },
  'pastelaria': { 
    name: 'Pastel', 
    image: 'https://plus.unsplash.com/premium_photo-1673809798606-f76f70932dc9?w=150&h=150&fit=crop&q=80' 
  },
  'sushi': { 
    name: 'Sushi', 
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=150&h=150&fit=crop&q=80' 
  },
  'salgaderia': {
    name: 'Salgado',
    image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=150&h=150&fit=crop&q=80'
  },
  'acai': { 
    name: 'Açaí', 
    image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=150&h=150&fit=crop&q=80' 
  },
  'sorvete': { 
    name: 'Sorvete', 
    image: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=150&h=150&fit=crop&q=80' 
  },
  'marmitaria': {
    name: 'Marmitas',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&h=150&fit=crop&q=80'
  },
  'doces': { 
    name: 'Doces bolos', 
    image: 'https://images.unsplash.com/photo-1551024601-5637ade98569?w=150&h=150&fit=crop&q=80' 
  },
  'espetinho': { 
    name: 'Espetinho', 
    image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=150&h=150&fit=crop&q=80' 
  },
  'farmacia': {
    name: 'Farmácia',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=150&h=150&fit=crop&q=80'
  },
  'mercantil': {
    name: 'Mercantil',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&h=150&fit=crop&q=80'
  },
  'agua': {
    name: 'Depósito de água',
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=150&h=150&fit=crop&q=80'
  }
};

export const PromotionStories: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<{id: string, name: string} | null>(null);
  const [activeStories, setActiveStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivePromotions = async () => {
      try {
        // 1. Buscar Produtos e Lojas em paralelo para filtrar por horário
        const [productsSnapshot, merchantsSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'products'), where('isActive', '==', true))),
          getDocs(collection(db, 'merchants'))
        ]);
        
        // Criar mapa de Merchants para acesso rápido
        const merchantsMap: Record<string, Restaurant> = {};
        merchantsSnapshot.forEach(doc => {
           merchantsMap[doc.id] = doc.data() as Restaurant;
        });

        // Função auxiliar para checar se a loja está aberta AGORA
        const isRestaurantOpen = (restaurant: Restaurant): boolean => {
            // 1. Switch manual
            if (!restaurant.isOpen) return false;
            
            // 2. Sem horário definido = considera aberto (se switch estiver on)
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

            if (closeTime < openTime) closeTime += 24 * 60;

            return currentMinutes >= openTime && currentMinutes <= closeTime;
        };

        const activeCategoryIds = new Set<string>();
        let hasAnyPromo = false;

        productsSnapshot.forEach((doc) => {
          const product = doc.data() as Product;
          const merchant = merchantsMap[product.restaurantId];

          // REGRA DE OURO: Só conta a promoção se a loja estiver ABERTA
          if (merchant && isRestaurantOpen(merchant)) {
              // Verificar se tem desconto REAL (Original > Preço Atual)
              if (product.originalPrice && product.originalPrice > product.price) {
                if (product.categoryId) {
                  activeCategoryIds.add(product.categoryId);
                  hasAnyPromo = true;
                }
              }
          }
        });

        // 3. Montar lista de Stories baseado nas categorias encontradas
        const stories: Story[] = [];

        // Se houver qualquer promoção, adiciona a bolinha "TOP Ofertas" primeiro
        if (hasAnyPromo) {
          stories.push({
            id: 'all',
            name: 'TOP Ofertas',
            image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=150&h=150&fit=crop&q=80'
          });
        }

        // Adiciona as categorias específicas encontradas nos produtos
        activeCategoryIds.forEach((catId) => {
           const config = CATEGORY_CONFIG[catId];
           if (config) {
             stories.push({
               id: catId,
               name: config.name,
               image: config.image
             });
           }
        });

        setActiveStories(stories);

      } catch (error) {
        console.error("Erro ao carregar promoções:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivePromotions();
    
    // Atualiza a cada 5 minutos para refletir mudanças de horário (abertura/fechamento)
    const interval = setInterval(fetchActivePromotions, 5 * 60 * 1000);
    return () => clearInterval(interval);

  }, []);

  if (loading) {
    return (
      <div className="bg-white pt-4 pb-4 border-b border-gray-100 shadow-sm min-h-[120px] flex items-center justify-center">
         <Loader2 className="animate-spin text-gray-300" size={24} />
      </div>
    );
  }

  // Se não tiver nenhuma promoção ativa, esconde a seção inteira
  if (activeStories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white pt-4 pb-4 border-b border-gray-100 shadow-sm animate-in slide-in-from-top-2">
      
      {/* Indicador Visual */}
      <div className="px-4 mb-3 flex items-center gap-1.5">
        <Flame size={16} className="text-red-500 fill-red-500 animate-pulse" />
        <h2 className="text-xs font-bold text-red-600 uppercase tracking-wider">
          Plantão de Promoções
        </h2>
      </div>

      <div className="flex space-x-4 overflow-x-auto px-4 pb-2 no-scrollbar">
        {activeStories.map(story => (
          <StoryCircle 
            key={story.id} 
            story={story} 
            onClick={() => setSelectedCategory({ id: story.id, name: story.name })}
          />
        ))}
      </div>

      <PromotionsModal 
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        categoryName={selectedCategory?.name || ''}
        categoryId={selectedCategory?.id || 'all'}
      />
    </div>
  );
};