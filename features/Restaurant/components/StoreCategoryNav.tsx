import React from 'react';
import { Category } from '../../../types';

interface StoreCategoryNavProps {
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export const StoreCategoryNav: React.FC<StoreCategoryNavProps> = ({ 
  categories, 
  activeCategoryId, 
  onSelectCategory 
}) => {
  return (
    <div className="sticky top-0 bg-white z-10 shadow-sm border-b border-gray-100">
      <div className="flex overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`
              px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2
              ${activeCategoryId === cat.id 
                ? 'border-brand-600 text-brand-600' 
                : 'border-transparent text-gray-500 hover:text-gray-800'
              }
            `}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};