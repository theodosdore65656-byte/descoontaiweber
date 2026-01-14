import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Clock, Search, Ticket, Copy, Check, Info, Loader2, Share2, Bike, ShoppingBag, Smile } from 'lucide-react'; 
import { Product, Restaurant } from '../../../types';
// Componentes
import { ProductItem } from '../components/ProductItem';
import { ProductDetailsModal } from '../components/ProductDetailsModal';
import { useCart } from '../hooks/useCart';
import { CartDrawer } from '../../Checkout/components/CartDrawer';
// IMPORTANTE: Ajuste o caminho do StarRating se necessário (assumi que está em components/ui)
import { StarRating } from '../../../components/ui/StarRating'; 

// Firebase
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'; 
import { db } from '../../../lib/firebase';
import { CATEGORIES } from '../../../constants';

interface RestaurantScreenProps {
  restaurantId: string; 
  onBack: () => void;
}

interface VisibleCoupon {
  id: string;
  code: string;
  value: number;
  type: 'percent' | 'fixed';
  minOrderValue: number;
}

export const RestaurantScreen: React.FC<RestaurantScreenProps> = ({ 
  restaurantId, 
  onBack 
}) => {
  // Dados da Loja
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hook do Carrinho (Protegido contra falhas)
  let cartData;
  try { cartData = useCart(); } catch (e) { cartData = { items: [], setIsCartOpen: () => {}, itemCount: 0, cartTotal: 0 }; }
  const { setIsCartOpen, itemCount, cartTotal } = cartData;

  // Estados de UI
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [shopCoupons, setShopCoupons] = useState<VisibleCoupon[]>([]);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // --- 1. BUSCAR DADOS (CORREÇÃO TELA BRANCA) ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Busca Restaurante pelo ID
        const docRef = doc(db, 'merchants', restaurantId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
           const restData = { id: docSnap.id, ...docSnap.data() } as Restaurant;
           setRestaurant(restData);

           // Busca Produtos
           const q = query(collection(db, 'products'), where('restaurantId', '==', restaurantId));
           const querySnapshot = await getDocs(q);
           const prods: Product[] = [];
           querySnapshot.forEach((doc) => {
              prods.push({ ...doc.data(), id: doc.id } as Product);
           });
           setProducts(prods);

           // Busca Cupons Ativos
           if (restData.hasCoupons) {
             const qCoupons = query(collection(db, 'merchants', restaurantId, 'coupons'), where('isActive', '==', true));
             const snapCoupons = await getDocs(qCoupons);
             const couponsList: VisibleCoupon[] = [];
             snapCoupons.forEach(doc => {
                couponsList.push({ id: doc.id, ...doc.data() } as VisibleCoupon);
             });
             setShopCoupons(couponsList);
           }
        }
      } catch (error) {
        console.error("Erro ao carregar loja:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (restaurantId) fetchData();
  }, [restaurantId]);

  // --- COMPARTILHAMENTO (RESTAURADO) ---
  const handleShare = async () => {
    if (!restaurant) return;
    const shareData = {
        title: restaurant.name,
        text: `Peça no ${restaurant.name} pelo Descoontaí!`,
        url: window.location.href
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copiado!');
        }
    } catch (err) { console.error(err); }
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  // --- CATEGORIAS ---
  const categories = useMemo(() => {
    const cats = new Set(restaurant?.menuSections?.map(s => s.name) || []);
    if (Array.isArray(products)) {
        products.forEach(p => { if (p.category) cats.add(p.category) });
    }
    return ['todos', ...Array.from(cats)];
  }, [restaurant, products]);

  // --- FILTROS ---
  const filteredProducts = useMemo(() => {
    let filtered = Array.isArray(products) ? products : [];
    if (activeCategory !== 'todos') {
       const section = restaurant?.menuSections?.find(s => s.name === activeCategory);
       if (section) {
          filtered = filtered.filter(p => p.sectionId === section.id);
       } else {
          filtered = filtered.filter(p => p.category === activeCategory);
       }
    }
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(lower));
    }
    return filtered;
  }, [products, activeCategory, searchTerm, restaurant]);

  // --- TEXTO DE ENTREGA ---
  const getDeliveryText = () => {
    if (!restaurant) return '';
    if (restaurant.deliveryPrice !== undefined && restaurant.deliveryPrice !== null) {
        return restaurant.deliveryPrice === 0 ? 'Grátis' : `R$ ${restaurant.deliveryPrice.toFixed(2)}`;
    }
    if (restaurant.deliveryConfig?.type === 'fixed') {
        const fixed = restaurant.deliveryConfig.fixedPrice || 0;
        return fixed === 0 ? 'Grátis' : `R$ ${fixed.toFixed(2)}`;
    }
    return 'Consultar';
  };

  if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50"><Loader2 size={48} className="text-brand-600 animate-spin mb-4" /><p className="text-gray-500">Abrindo cardápio...</p></div>;
  
  if (!restaurant) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center"><Info size={48} className="text-gray-300 mb-4" /><h2 className="text-xl font-bold text-gray-800">Loja indisponível</h2><button onClick={onBack} className="mt-4 bg-brand-600 text-white px-6 py-3 rounded-xl font-bold">Voltar</button></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative animate-in fade-in duration-300">
      
      {/* CAPA + BOTÕES */}
      <div className="relative h-48 md:h-64 bg-gray-200">
        <img 
          src={restaurant.coverImage || restaurant.image || "https://via.placeholder.com/500"} 
          className="w-full h-full object-cover"
          alt="Capa"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        {/* Voltar */}
        <button onClick={onBack} className="absolute top-4 left-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 z-10">
          <ChevronLeft size={24} />
        </button>

        {/* Compartilhar (RESTAURADO) */}
        <button onClick={handleShare} className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 z-10">
          <Share2 size={24} />
        </button>
      </div>

      {/* INFO CARD */}
      <div className="px-4 -mt-12 relative z-10 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-start mb-2">
             <h1 className="text-2xl font-bold text-gray-900 leading-tight">{restaurant.name}</h1>
             <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${restaurant.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {restaurant.isOpen ? 'Aberto' : 'Fechado'}
             </div>
          </div>

          {/* --- AVALIAÇÕES (USANDO STARRATING ORIGINAL) --- */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
             {/* Entrega */}
             <div className="flex items-center gap-2 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100 shrink-0">
                <Bike size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Entrega</span>
                <StarRating rating={restaurant.rating || 5} size={12} showValue /> 
             </div>

             {/* Produto */}
             <div className="flex items-center gap-2 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100 shrink-0">
                <ShoppingBag size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Produto</span>
                <StarRating rating={restaurant.rating || 5} size={12} showValue />
             </div>

             {/* Atendimento */}
             <div className="flex items-center gap-2 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100 shrink-0">
                <Smile size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Atend.</span>
                <StarRating rating={restaurant.rating || 5} size={12} showValue />
             </div>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 gap-4 mt-2 mb-3 border-t border-gray-50 pt-3">
             <span className="flex items-center gap-1"><Clock size={14}/> {restaurant.deliveryTime || '30-45'} min</span>
             <span className="flex items-center gap-1 text-green-600 font-medium">
                Entrega: {getDeliveryText()}
             </span>
          </div>

          {/* CUPONS */}
          {shopCoupons.length > 0 && (
             <div className="mt-2 pt-3 border-t border-dashed border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
                   <Ticket size={12} /> Cupons Disponíveis
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                   {shopCoupons.map(coupon => (
                      <button 
                        key={coupon.id}
                        onClick={() => handleCopyCoupon(coupon.code)}
                        className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-2 pr-3 min-w-fit active:scale-95 transition-transform group"
                      >
                         <div className="bg-white p-1.5 rounded border border-green-100 text-green-600 group-hover:text-green-700">
                            <Ticket size={16} />
                         </div>
                         <div className="text-left">
                            <p className="text-xs font-bold text-green-800">{coupon.code}</p>
                            <p className="text-[10px] text-green-600">
                               {coupon.type === 'percent' ? `${coupon.value}% OFF` : `R$ ${coupon.value} OFF`}
                            </p>
                         </div>
                         {copiedCoupon === coupon.code ? <Check size={14} className="text-green-600 ml-1" /> : <Copy size={14} className="text-green-400 ml-1" />}
                      </button>
                   ))}
                </div>
             </div>
          )}
        </div>
      </div>

      {/* BUSCA E CATEGORIAS */}
      <div className="sticky top-0 bg-gray-50 z-20 px-4 pb-2 pt-2 shadow-sm">
         <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar no cardápio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            />
         </div>
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map(cat => (
               <button
                 key={cat}
                 onClick={() => setActiveCategory(cat)}
                 className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors shadow-sm ${activeCategory === cat ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
               >
                 {cat.charAt(0).toUpperCase() + cat.slice(1)}
               </button>
            ))}
         </div>
      </div>

      {/* LISTA DE PRODUTOS */}
      <div className="px-4 space-y-4 pt-4">
        {filteredProducts.length > 0 ? (
           filteredProducts.map(product => (
             <ProductItem 
               key={product.id} 
               product={product} 
               onClick={() => setSelectedProduct(product)} 
             />
           ))
        ) : (
           <div className="text-center py-10 text-gray-400 flex flex-col items-center">
              <Info size={32} className="mb-2 opacity-50"/>
              <p>Nenhum produto encontrado.</p>
           </div>
        )}
      </div>

      {/* BOTÃO CARRINHO */}
      {itemCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-40 animate-in slide-in-from-bottom-4">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-brand-600 text-white p-4 rounded-xl shadow-xl flex justify-between items-center active:scale-[0.98] transition-transform"
          >
             <div className="flex items-center gap-3">
                <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">{itemCount}</div>
                <div className="text-left leading-none">
                   <p className="text-sm font-medium opacity-90">Ver Sacola</p>
                   <p className="text-xs opacity-75">R$ {cartTotal.toFixed(2)}</p>
                </div>
             </div>
             <span className="font-bold text-sm">Finalizar</span>
          </button>
        </div>
      )}

      {selectedProduct && restaurant && (
        <ProductDetailsModal 
          isOpen={!!selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          product={selectedProduct}
          availableAddons={restaurant.addonGroups || []} 
        />
      )}

      <CartDrawer />
    </div>
  );
};