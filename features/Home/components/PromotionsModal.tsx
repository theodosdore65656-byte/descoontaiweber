import React, { useMemo, useState, useEffect } from 'react';
import { X, Percent, ShoppingBag, Loader2 } from 'lucide-react';
import { Product, Restaurant } from '../../../types';
import { ProductDetailsModal } from '../../Restaurant/components/ProductDetailsModal';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface PromotionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string; 
  categoryId: string;   
}

export const PromotionsModal: React.FC<PromotionsModalProps> = ({ isOpen, onClose, categoryName, categoryId }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<(Product & { _merchantName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca Dados Reais do Firestore ao abrir
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Buscar produtos ativos
        const qProds = query(collection(db, 'products'), where('isActive', '==', true));
        
        // 2. Buscar lojas para exibir o nome da loja no card do produto
        const qMerchants = query(collection(db, 'merchants'));

        const [snapProds, snapMerchants] = await Promise.all([
          getDocs(qProds),
          getDocs(qMerchants)
        ]);

        const merchantMap: Record<string, Restaurant> = {};
        snapMerchants.forEach(doc => {
           merchantMap[doc.id] = doc.data() as Restaurant;
        });

        const loadedProducts: (Product & { _merchantName?: string })[] = [];

        snapProds.forEach(doc => {
           const p = doc.data() as Product;
           
           // Tratamento seguro de números
           const price = Number(p.price);
           const originalPrice = Number(p.originalPrice);

           // Filtro de Promoção (Preço Original > Preço Atual)
           if (originalPrice && originalPrice > price) {
              
              const merchant = merchantMap[p.restaurantId];
              
              // Lógica de Filtragem ESTRITA:
              // Se categoryId for 'all' (TOP Ofertas), aceita qualquer produto com desconto.
              // Se não, o produto deve ter a categoryId igual à bolinha clicada.
              const matchesCategory = 
                 categoryId === 'all' || 
                 p.categoryId === categoryId;

              if (matchesCategory) {
                 loadedProducts.push({
                    ...p,
                    price, // Garante número
                    originalPrice, // Garante número
                    id: doc.id,
                    _merchantName: merchant?.name || 'Loja Parceira'
                 });
              }
           }
        });

        // --- ORDENAÇÃO POR MAIOR DESCONTO (%) ---
        // Aqui garantimos que quem tem 50% de desconto aparece antes de quem tem 10%
        loadedProducts.sort((a, b) => {
          const priceA = Number(a.price);
          const originalA = Number(a.originalPrice) || priceA;
          const discountPctA = (originalA - priceA) / originalA;

          const priceB = Number(b.price);
          const originalB = Number(b.originalPrice) || priceB;
          const discountPctB = (originalB - priceB) / originalB;

          // Decrescente (Maior % primeiro)
          return discountPctB - discountPctA;
        });

        setProducts(loadedProducts);

      } catch (error) {
        console.error("Erro ao buscar promos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, categoryId]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-lg bg-gray-50 h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 sm:fade-in duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-brand-600 p-4 rounded-t-2xl shadow-md z-10">
             <div className="flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                   <div className="bg-white/20 p-2 rounded-full">
                     <Percent size={20} className="text-white" />
                   </div>
                   <div>
                     <h3 className="font-bold text-lg leading-none">Ofertas: {categoryName}</h3>
                     <p className="text-xs text-red-100 opacity-90">Maiores descontos primeiro!</p>
                   </div>
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <X size={20} />
                </button>
             </div>
          </div>

          {/* Lista de Produtos */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {loading ? (
               <div className="flex justify-center py-10">
                 <Loader2 className="animate-spin text-brand-600" size={32} />
               </div>
             ) : products.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                 <ShoppingBag size={48} className="opacity-50" />
                 <p className="text-center font-medium">Nenhuma promoção ativa para {categoryName} no momento.</p>
                 <button onClick={onClose} className="text-brand-600 font-bold text-sm hover:underline">Ver outras ofertas</button>
               </div>
             ) : (
               products.map((product, index) => {
                 // Cálculo seguro para exibição
                 const pPrice = Number(product.price);
                 const pOriginal = Number(product.originalPrice);
                 const discountPercent = pOriginal 
                    ? Math.round(((pOriginal - pPrice) / pOriginal) * 100) 
                    : 0;

                 return (
                   <div 
                     key={product.id}
                     onClick={() => handleProductClick(product)}
                     className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex gap-3 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                   >
                      {/* Selo de Ranking (Top 3) */}
                      {index < 3 && categoryId === 'all' && (
                        <div className="absolute top-0 left-0 bg-yellow-400 text-yellow-900 text-[9px] font-bold px-1.5 py-0.5 rounded-br-lg z-20 shadow-sm">
                           #{index + 1} MELHOR
                        </div>
                      )}

                      {/* Selo de Desconto */}
                      <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10 shadow-sm">
                        -{discountPercent}% OFF
                      </div>

                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                         <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 flex flex-col justify-center min-w-0">
                         <span className="text-[10px] text-gray-400 mb-0.5 uppercase tracking-wide font-semibold truncate pr-8">
                            {product._merchantName}
                         </span>
                         <h4 className="font-bold text-gray-900 leading-tight mb-1 truncate">{product.name}</h4>
                         <p className="text-xs text-gray-500 line-clamp-1 mb-2">{product.description}</p>
                         
                         <div className="flex items-end gap-2">
                            <span className="text-xs text-gray-400 line-through mb-0.5">R$ {pOriginal.toFixed(2)}</span>
                            <span className="text-lg font-bold text-green-600 leading-none">R$ {pPrice.toFixed(2)}</span>
                         </div>
                      </div>
                   </div>
                 );
               })
             )}
          </div>

        </div>
      </div>

      <ProductDetailsModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  );
};