import React from 'react';
import { Search, X } from 'lucide-react';
import { CategoryList } from '../../Home/components/CategoryList';
import { FilterProvider, useFilter } from '../../Home/context/FilterContext';
import { RestaurantFeed } from '../../Home/components/RestaurantFeed';

// Corrected: Prop now correctly accepts the restaurant ID string
const SearchScreenContent: React.FC<{ onSelectRestaurant: (id: string) => void }> = ({ onSelectRestaurant }) => {
  const { setSearchQuery, searchQuery } = useFilter();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <h1 className="font-bold text-xl mb-4 text-gray-900">Buscar</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Item ou loja" 
            className="w-full bg-gray-100 text-gray-900 rounded-lg py-3 pl-10 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
          />
          {searchQuery.length > 0 && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-brand-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="py-4">
        <h2 className="px-4 text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Categorias</h2>
        <CategoryList />
      </div>

      <div className="px-4 mt-2">
        <RestaurantFeed onSelectRestaurant={onSelectRestaurant} />
      </div>
    </div>
  );
};

// Corrected: Prop now correctly accepts the restaurant ID string
export const SearchScreen: React.FC<{ onSelectRestaurant: (id: string) => void }> = (props) => {
  return (
    <FilterProvider>
      <SearchScreenContent {...props} />
    </FilterProvider>
  );
};