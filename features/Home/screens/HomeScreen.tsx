import React from 'react';
import { PromotionStories } from '../components/PromotionStories'; 
import { CategoryList } from '../components/CategoryList';
import { RestaurantFeed } from '../components/RestaurantFeed';
import { MapPin, Search, ChevronDown, X } from 'lucide-react';
import { useLocation } from '../../Location/context/LocationContext';
import { FilterProvider, useFilter } from '../context/FilterContext';
import { BannerSlider } from '../../../components/ui/BannerSlider'; 

interface HomeScreenProps {
  onSelectRestaurant: (id: string) => void;
}

const HomeContent: React.FC<HomeScreenProps> = ({ onSelectRestaurant }) => {
  const { location, setIsLocationModalOpen } = useLocation();
  const { setSearchQuery, searchQuery } = useFilter(); 

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      {/* Modern Header 2026 Style */}
      <header className="bg-gradient-to-b from-brand-600 to-brand-500 pt-safe-top px-4 pb-6 sticky top-0 z-30 shadow-lg rounded-b-[24px]">
        
        {/* Top Bar: Logo & Location */}
        <div className="flex items-center justify-between mb-5 pt-3">
          
          {/* Logo Container - Glassmorphism */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl shadow-sm">
             <img 
               src="https://raw.githubusercontent.com/descoontai-ops/imagenspp/refs/heads/main/1.png" 
               alt="Descoontaí" 
               className="h-8 w-auto object-contain" 
             />
          </div>

          {/* Location Pill */}
          <button 
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-2 bg-black/20 hover:bg-black/30 text-white px-3 py-1.5 rounded-full transition-all backdrop-blur-md border border-white/10 max-w-[60%]"
          >
            <MapPin size={14} className="text-white/90 shrink-0" />
            <div className="flex flex-col items-start leading-none overflow-hidden">
                <span className="text-[9px] uppercase tracking-wider text-white/70 font-medium mb-0.5">Entregar em</span>
                <span className="text-xs font-bold truncate w-full text-left">
                  {location ? `${location.city}` : 'Selecionar'}
                </span>
            </div>
            <ChevronDown size={14} className="text-white/70 shrink-0 ml-1" />
          </button>
        </div>
        
        {/* Search Bar - Floating Effect */}
        <div className="relative transform transition-all hover:scale-[1.01]">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-brand-500" size={20} />
          </div>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar loja ou categoria..." 
            className="w-full bg-white text-gray-900 rounded-2xl py-3.5 pl-11 pr-10 text-sm shadow-xl shadow-brand-900/10 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-white/30 transition-shadow"
          />
          {searchQuery.length > 0 && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-brand-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Conteúdo dinâmico */}
      {!isSearching && (
        <>
          <section className="mb-2 mt-2">
            <PromotionStories />
          </section>

          <section className="px-4 mb-6 mt-2">
            <BannerSlider location="home" aspectRatio="h-36" />
          </section>

          <section className="mb-4">
            <div className="flex items-center justify-between px-4 mb-3">
               <h3 className="text-sm font-bold text-gray-800">Categorias</h3>
            </div>
            <CategoryList />
          </section>
        </>
      )}

      {/* Feed de Restaurantes */}
      <section className={`px-4 ${isSearching ? 'mt-6 animate-in slide-in-from-bottom-4 duration-300' : ''}`}>
        <RestaurantFeed onSelectRestaurant={onSelectRestaurant} />
      </section>
    </div>
  );
};

export const HomeScreen: React.FC<HomeScreenProps> = (props) => {
  return (
    <FilterProvider>
      <HomeContent {...props} />
    </FilterProvider>
  );
};
