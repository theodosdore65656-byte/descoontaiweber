import React, { createContext, useContext, useState, useMemo } from 'react';
import { CartItem, Product, SelectedGrouping } from '../../../types';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Definição do tipo do Cupom para o Carrinho
interface AppliedCoupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderValue: number;
  merchantId: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number, note?: string, selectedGroups?: SelectedGrouping[]) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  
  // --- NOVOS MÉTODOS PARA CUPOM ---
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (code: string, merchantId: string) => Promise<{success: boolean, message: string}>;
  removeCoupon: () => void;
  discountAmount: number;
  totalWithDiscount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // 1. Cálculo do Subtotal (Sem desconto)
  const cartTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      let addonsPrice = 0;
      if (item.selectedGroups) {
        item.selectedGroups.forEach(group => {
          group.items.forEach(addon => {
            addonsPrice += addon.price;
          });
        });
      }
      const unitTotal = item.price + addonsPrice;
      return sum + (unitTotal * item.quantity);
    }, 0);
  }, [items]);

  // 2. Cálculo do Desconto
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    
    // Verifica se o valor mínimo ainda é válido (caso o usuário remova itens)
    if (cartTotal < appliedCoupon.minOrderValue) return 0;

    if (appliedCoupon.type === 'percent') {
      return cartTotal * (appliedCoupon.value / 100);
    } else {
      return Math.min(appliedCoupon.value, cartTotal); // Não pode dar mais desconto que o total
    }
  }, [appliedCoupon, cartTotal]);

  const totalWithDiscount = Math.max(0, cartTotal - discountAmount);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // 3. Função para Aplicar Cupom
  const applyCoupon = async (code: string, merchantId: string) => {
    try {
      const cleanCode = code.toUpperCase().trim();
      
      // Busca o cupom dentro da subcoleção do lojista específico
      const q = query(
        collection(db, 'merchants', merchantId, 'coupons'),
        where('code', '==', cleanCode),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: false, message: "Cupom inválido ou expirado." };
      }

      const couponData = querySnapshot.docs[0].data();
      const couponId = querySnapshot.docs[0].id;

      // Valida valor mínimo
      if (cartTotal < couponData.minOrderValue) {
        return { 
          success: false, 
          message: `O valor mínimo para este cupom é R$ ${couponData.minOrderValue.toFixed(2)}` 
        };
      }

      setAppliedCoupon({
        id: couponId,
        code: cleanCode,
        type: couponData.type,
        value: couponData.value,
        minOrderValue: couponData.minOrderValue,
        merchantId: merchantId
      });

      return { success: true, message: "Cupom aplicado com sucesso! 🎉" };

    } catch (error) {
      console.error("Erro ao aplicar cupom:", error);
      return { success: false, message: "Erro ao validar cupom." };
    }
  };

  const removeCoupon = () => setAppliedCoupon(null);

  const addToCart = (product: Product, quantity: number, note?: string, selectedGroups?: SelectedGrouping[]) => {
    setItems(prev => {
      const uniqueId = `${product.id}-${Date.now()}`; 
      const newItem: CartItem = {
        ...product,
        id: uniqueId, 
        quantity,
        note,
        selectedGroups: selectedGroups || []
      };
      return [...prev, newItem];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    // Se o carrinho ficar vazio, remove o cupom
    if (items.length <= 1) setAppliedCoupon(null);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      itemCount,
      isCartOpen,
      setIsCartOpen,
      appliedCoupon,
      applyCoupon,
      removeCoupon,
      discountAmount,
      totalWithDiscount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};