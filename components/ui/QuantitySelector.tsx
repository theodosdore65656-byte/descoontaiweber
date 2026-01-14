import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  size?: 'sm' | 'md';
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({ 
  quantity, 
  onIncrease, 
  onDecrease,
  size = 'md' 
}) => {
  const iconSize = size === 'sm' ? 14 : 18;
  const btnClass = size === 'sm' ? 'p-1' : 'p-2';
  const textClass = size === 'sm' ? 'text-sm w-6' : 'text-base w-8';

  return (
    <div className="flex items-center border border-gray-200 rounded-lg">
      <button 
        onClick={onDecrease}
        disabled={quantity <= 1}
        className={`${btnClass} text-brand-600 hover:bg-brand-50 disabled:opacity-30 disabled:hover:bg-transparent rounded-l-lg transition-colors`}
      >
        <Minus size={iconSize} />
      </button>
      
      <span className={`${textClass} font-semibold text-center text-gray-900`}>
        {quantity}
      </span>
      
      <button 
        onClick={onIncrease}
        className={`${btnClass} text-brand-600 hover:bg-brand-50 rounded-r-lg transition-colors`}
      >
        <Plus size={iconSize} />
      </button>
    </div>
  );
};
