import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0 to 5
  size?: number;
  interactive?: boolean;
  onChange?: (newRating: number) => void;
  showValue?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  size = 16, 
  interactive = false, 
  onChange,
  showValue = false
}) => {
  
  // Função para lidar com clique (se interativo)
  const handleClick = (index: number, isHalf: boolean) => {
    if (!interactive || !onChange) return;
    const value = isHalf ? index + 0.5 : index + 1;
    onChange(value);
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex relative">
        {[0, 1, 2, 3, 4].map((index) => {
          const fillPercentage = Math.max(0, Math.min(100, (rating - index) * 100));
          
          return (
            <div 
              key={index} 
              className={`relative ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
              style={{ width: size, height: size, marginRight: 2 }}
            >
              {/* Estrela Base (Cinza/Vazia) */}
              <Star 
                size={size} 
                className="text-gray-200 absolute top-0 left-0" 
                fill="currentColor"
                strokeWidth={0}
              />
              
              {/* Estrela Cheia (Amarela) - Clipada */}
              <div 
                className="absolute top-0 left-0 overflow-hidden" 
                style={{ width: `${fillPercentage}%`, height: '100%' }}
              >
                <Star 
                  size={size} 
                  className="text-yellow-400" 
                  fill="currentColor" 
                  strokeWidth={0}
                />
              </div>

              {/* Click Areas (Invisible) for Interactive Mode */}
              {interactive && (
                <>
                  {/* Left Half Click */}
                  <div 
                    className="absolute top-0 left-0 w-1/2 h-full z-10"
                    onClick={() => handleClick(index, true)}
                  />
                  {/* Right Half Click */}
                  <div 
                    className="absolute top-0 right-0 w-1/2 h-full z-10"
                    onClick={() => handleClick(index, false)}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
      
      {showValue && (
        <span className="text-sm font-bold text-gray-700 ml-1 min-w-[24px]">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};