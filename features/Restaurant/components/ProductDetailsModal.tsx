import React, { useState, useEffect } from 'react';
import { Product, AddonGroup, Restaurant, AddonItem } from '../../../types';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { QuantitySelector } from '../../../components/ui/QuantitySelector';
import { useCart } from '../hooks/useCart';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Loader2, Plus, Check, Clock } from 'lucide-react';
// IMPORTAÇÃO DO ANALYTICS
import { logWhatsappClick } from '../../Merchant/services/analyticsService';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  isStoreOpen?: boolean; // Nova prop opcional (default true se não passada)
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ 
  product, 
  isOpen, 
  onClose,
  isStoreOpen = true 
}) => {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const { addToCart } = useCart();
  
  // Data State
  const [availableGroups, setAvailableGroups] = useState<AddonGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // Selection State: groupId -> Set of itemIds
  const [selections, setSelections] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setNote('');
      setSelections({});
      loadGroups(product);
    }
  }, [isOpen, product]);

  const loadGroups = async (prod: Product) => {
    if (!prod.enabledGroupIds || prod.enabledGroupIds.length === 0) {
      setAvailableGroups([]);
      return;
    }

    setIsLoadingGroups(true);
    try {
      const docRef = doc(db, 'merchants', prod.restaurantId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Restaurant;
        const allGroups = data.addonGroups || [];
        // Filtrar apenas os grupos habilitados para este produto
        const filtered = allGroups.filter(g => prod.enabledGroupIds?.includes(g.id));
        setAvailableGroups(filtered);
      }
    } catch (e) {
      console.error("Erro ao carregar grupos", e);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handleSelection = (groupId: string, itemId: string, max: number) => {
    setSelections(prev => {
      const groupSelections = new Set(prev[groupId] || []);
      
      if (groupSelections.has(itemId)) {
        groupSelections.delete(itemId); // Desmarcar
      } else {
        // Se max for 1, troca a seleção (comportamento Radio)
        if (max === 1) {
          groupSelections.clear();
          groupSelections.add(itemId);
        } else {
          // Se ainda não atingiu o máximo, adiciona
          if (groupSelections.size < max) {
            groupSelections.add(itemId);
          } else {
            // Opcional: Feedback visual de limite atingido
            // alert(`Você só pode escolher até ${max} opções.`); 
            return prev;
          }
        }
      }

      return {
        ...prev,
        [groupId]: groupSelections
      };
    });
  };

  if (!product) return null;

  // --- Validação e Cálculos ---

  // Verifica se todos os grupos obrigatórios foram preenchidos
  const isValid = availableGroups.every(group => {
    if (group.min > 0) {
      const selectedCount = selections[group.id]?.size || 0;
      return selectedCount >= group.min;
    }
    return true;
  });

  // Calcula Preço Total
  let totalAddonsPrice = 0;
  availableGroups.forEach(group => {
    const selectedIds = selections[group.id] || new Set();
    group.items.forEach(item => {
      if (selectedIds.has(item.id)) {
        totalAddonsPrice += item.price;
      }
    });
  });

  const unitPrice = product.price + totalAddonsPrice;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    // 1. Bloqueio se a loja estiver fechada
    if (!isStoreOpen) {
      alert("O estabelecimento está fechado no momento. Confira o horário de funcionamento.");
      return;
    }

    // 2. Montar estrutura complexa para o carrinho
    const structuredSelections = availableGroups.map(group => {
      const selectedIds = selections[group.id] || new Set();
      if (selectedIds.size === 0) return null;

      const items = group.items.filter(i => selectedIds.has(i.id));
      return {
        groupId: group.id,
        groupTitle: group.title,
        items: items
      };
    }).filter(Boolean) as any[];

    // 3. Adicionar ao carrinho
    addToCart(product, quantity, note, structuredSelections); 
    
    // --- ANALYTICS: REGISTRAR CONVERSÃO (INTENÇÃO DE COMPRA) ---
    // Isso vai contar como "Clique no WhatsApp" no painel de análises
    logWhatsappClick(product.restaurantId, product.id);

    // 4. Fechar modal
    onClose();
  };

  const footer = (
    <div className="flex items-center justify-between gap-4">
      <QuantitySelector 
        quantity={quantity}
        onIncrease={() => setQuantity(q => q + 1)}
        onDecrease={() => setQuantity(q => Math.max(1, q - 1))}
      />
      <Button 
        fullWidth 
        onClick={handleAddToCart}
        // Se a loja estiver fechada, não usa o disabled padrão para permitir o clique e o alert.
        // Se a loja estiver aberta, usa isValid para desabilitar se faltar opções.
        disabled={isStoreOpen ? !isValid : false}
        className={`flex justify-between items-center ${!isStoreOpen ? 'bg-gray-400 border-gray-400 hover:bg-gray-500 cursor-not-allowed' : ''}`}
      >
        <span>
          {!isStoreOpen ? 'Loja Fechada' : (isValid ? 'Adicionar' : 'Escolha os itens')}
        </span>
        {isStoreOpen && <span>R$ {totalPrice.toFixed(2)}</span>}
      </Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product.name} footer={footer}>
      <div className="space-y-6 pb-4">
        
        {/* AVISO DE LOJA FECHADA */}
        {!isStoreOpen && (
           <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-center gap-3 text-red-800 mb-2">
              <Clock size={20} className="shrink-0" />
              <div className="text-xs">
                 <p className="font-bold">Estabelecimento Fechado</p>
                 <p>Você pode navegar, mas não conseguirá finalizar o pedido agora.</p>
              </div>
           </div>
        )}

        {/* Imagem e Descrição */}
        <div>
           <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-100 mb-3 border border-gray-100">
             <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
           </div>
           <p className="text-gray-600 leading-relaxed text-sm">
             {product.description}
           </p>
           {product.originalPrice && product.originalPrice > product.price && (
              <div className="mt-2 text-sm">
                 <span className="line-through text-gray-400 mr-2">R$ {product.originalPrice.toFixed(2)}</span>
                 <span className="font-bold text-green-600">Oferta R$ {product.price.toFixed(2)}</span>
              </div>
           )}
        </div>

        {/* LOADING STATE */}
        {isLoadingGroups && (
           <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-600" /></div>
        )}

        {/* GRUPOS DE ADICIONAIS */}
        {!isLoadingGroups && availableGroups.map(group => {
           const currentSelectedCount = selections[group.id]?.size || 0;
           const isSatisfied = group.min > 0 ? currentSelectedCount >= group.min : true;
           const reachedMax = currentSelectedCount >= group.max;

           return (
             <div key={group.id} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                {/* Header do Grupo */}
                <div className="bg-gray-100 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                   <div>
                      <h4 className="font-bold text-gray-800 text-sm">{group.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                         {group.min > 0 
                           ? `Obrigatório • Escolha de ${group.min} a ${group.max}` 
                           : `Opcional • Máximo ${group.max}`}
                      </p>
                   </div>
                   
                   {/* Badge de Status */}
                   {group.min > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${isSatisfied ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                         {isSatisfied ? 'OK' : 'Obrigatório'}
                      </span>
                   )}
                </div>

                {/* Lista de Itens */}
                <div className="divide-y divide-gray-100 bg-white">
                   {group.items.map(item => {
                      const isSelected = selections[group.id]?.has(item.id);
                      const isDisabled = !isSelected && reachedMax && group.max > 1; // Se max > 1 e atingiu limite, desabilita não selecionados. Se max=1, funciona como radio (sempre troca).

                      return (
                         <div 
                           key={item.id} 
                           onClick={() => !isDisabled && handleSelection(group.id, item.id, group.max)}
                           className={`flex justify-between items-center p-4 cursor-pointer transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                         >
                            <div className="flex-1 pr-4">
                               <p className="text-sm font-medium text-gray-800">{item.name}</p>
                               {item.price > 0 && (
                                 <p className="text-xs text-brand-600 font-semibold mt-0.5">
                                    + R$ {item.price.toFixed(2)}
                                 </p>
                               )}
                            </div>
                            
                            {/* Checkbox / Radio Visual */}
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-brand-600 border-brand-600' : 'border-gray-300 bg-white'}`}>
                               {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>
           );
        })}

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex: Tirar a cebola, ponto da carne..."
            className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-100 focus:border-brand-500 outline-none resize-none h-20 bg-white"
          />
        </div>
      </div>
    </Modal>
  );
};