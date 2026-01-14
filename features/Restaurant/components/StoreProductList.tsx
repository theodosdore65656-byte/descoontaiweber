import React from 'react';
import { Product } from '../../../types';
import { ProductItem } from './ProductItem';
import { ShoppingBag } from 'lucide-react';

interface StoreProductListProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

export const StoreProductList: React.FC<StoreProductListProps> = ({ products, onProductClick }) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white">
        <ShoppingBag size={48} className="mb-2 opacity-50" />
        <p className="text-sm font-medium">Nenhum produto nesta categoria.</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[300px]">
      {products.map(product => (
        <ProductItem 
          key={product.id} 
          product={product} 
          onClick={() => onProductClick(product)}
        />
      ))}
    </div>
  );
};