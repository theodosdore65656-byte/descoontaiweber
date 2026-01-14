import React from 'react';
import { CATEGORIES } from '../../../constants';
import { useFilter } from '../context/FilterContext';
import { getCategoryIcon } from '../utils/categoryIcons';

export const CategoryList: React.FC = () => {
  const { selectedCategoryId, setSelectedCategoryId } = useFilter();

  return (
    <div className="flex space-x-3 overflow-x-auto pb-4 pt-2 no-scrollbar px-4">
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;
        
        return (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`
              flex items-center space-x-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm transition-all duration-200
              ${isSelected 
                ? 'bg-brand-600 text-white border border-brand-600 shadow-md transform scale-105' 
                : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-200 hover:text-brand-600'
              }
            `}
          >
            <span className={isSelected ? 'text-white' : 'text-gray-500 group-hover:text-brand-600'}>
              {getCategoryIcon(cat.id, 16)}
            </span>
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
};
