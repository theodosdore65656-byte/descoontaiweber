import React from 'react';
import { Product } from '../../../types';
import { Plus, Tag } from 'lucide-react';

interface ProductItemProps {
  product: Product;
  onClick: () => void;
}

export const ProductItem: React.FC<ProductItemProps> = ({ product, onClick }) => {
  // Verifica se existe desconto válido (Preço original maior que preço atual)
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div 
      onClick={onClick}
      className="flex p-4 border-b border-gray-100 bg-white hover:bg-gray-50 cursor-pointer group transition-colors"
    >
      <div className="flex-1 pr-3 flex flex-col justify-center">
        <h3 className="font-medium text-gray-900 mb-1 leading-snug">{product.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-2 leading-relaxed">{product.description}</p>
        
        {/* Lógica de Preço */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasDiscount ? (
            <>
              <span className="text-xs text-gray-400 line-through">
                R$ {product.originalPrice?.toFixed(2)}
              </span>
              <div className="flex items-center gap-1">
                 <span className="font-bold text-green-600 text-base">
                   R$ {product.price.toFixed(2)}
                 </span>
                 <div className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Tag size={10} />
                    Oferta
                 </div>
              </div>
            </>
          ) : (
            <span className="font-semibold text-gray-900 text-base">
              R$ {product.price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
      
      <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        {/* Badge na Imagem também se tiver desconto */}
        {hasDiscount && (
           <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg shadow-sm">
             %
           </div>
        )}
      </div>
    </div>
  );
};