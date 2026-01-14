import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../../../constants';

export const MenuTabs: React.FC = () => {
  const [activeId, setActiveId] = useState(CATEGORIES[0].id);

  // In a real app, use Intersection Observer to update activeId on scroll
  
  return (
    <div className="sticky top-0 bg-white z-10 shadow-sm">
      <div className="flex overflow-x-auto no-scrollbar border-b border-gray-100">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveId(cat.id)}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeId === cat.id 
                ? 'border-brand-600 text-brand-600' 
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};
