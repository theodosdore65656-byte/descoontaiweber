import React, { useState, useEffect, useMemo } from 'react';
import { X, Trash2, ShoppingBag, AlertCircle, User, Loader2, Ticket, Tag, AlertTriangle, MapPin, ExternalLink, Star } from 'lucide-react'; 
import { useCart } from '../../Restaurant/hooks/useCart';
import { Button } from '../../../components/ui/Button';
import { QuantitySelector } from '../../../components/ui/QuantitySelector';
import { generateWhatsAppLink } from '../utils/whatsappGenerator';
import { PAYMENT_METHODS } from '../../../constants';
import { useLocation } from '../../Location/context/LocationContext';
import { useAuth } from '../../Auth/context/AuthContext';
import { AddressManagerModal } from '../../Settings/components/AddressManagerModal';
import { Restaurant, UserLocation } from '../../../types';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'; // Adicionado query/where/getDocs
import { db } from '../../../lib/firebase';
import { OrderReviewModal } from '../../Reviews/components/OrderReviewModal';

interface DrawerContainerProps {
  children: React.ReactNode;
  onClose: () => void;
}

const DrawerContainer: React.FC<DrawerContainerProps> = ({ children, onClose }) => (
  <div className="fixed inset-0 z-[60] flex justify-end">
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {children}
    </div>
  </div>
);

export const CartDrawer: React.FC = () => {
  const { 
    items, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, 
    cartTotal, clearCart, appliedCoupon, applyCoupon, removeCoupon, 
    discountAmount, totalWithDiscount 
  } = useCart();

  const { location, isAddressComplete, setLocation } = useLocation();
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [changeAmount, setChangeAmount] = useState(''); 
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [activeRestaurant, setActiveRestaurant] = useState<Restaurant | null>(null);
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAddressManager, setShowAddressManager] = useState(false);

  // Endereço Principal (buscado do firebase)
  const [principalAddress, setPrincipalAddress] = useState<UserLocation | null>(null);

  const [couponInput, setCouponInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  useEffect(() => {
    if (user?.displayName && !customerName) setCustomerName(user.displayName);
  }, [user]);

  // Busca dados do restaurante
  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (isCartOpen && items.length > 0) {
        const currentRestaurantId = items[0].restaurantId;
        if (activeRestaurant?.id === currentRestaurantId) return;
        setIsLoadingRestaurant(true);
        try {
          const docSnap = await getDoc(doc(db, 'merchants', currentRestaurantId));
          if (docSnap.exists()) setActiveRestaurant(docSnap.data() as Restaurant);
        } catch (error) { console.error(error); } finally { setIsLoadingRestaurant(false); }
      }
    };
    fetchRestaurantData();
  }, [isCartOpen, items]);

  // --- BUSCA ENDEREÇO PRINCIPAL ---
  useEffect(() => {
    const fetchPrincipalAddress = async () => {
        if (!user) return;
        try {
            // Busca endereços onde isDefault == true
            const q = query(collection(db, 'users', user.uid, 'addresses'), where('isDefault', '==', true));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const defaultAddr = snapshot.docs[0].data() as UserLocation;
                setPrincipalAddress(defaultAddr);
                // Opcional: Atualiza o contexto global se estiver vazio
                if (!location) setLocation(defaultAddr);
            }
        } catch (e) {
            console.error("Erro ao buscar endereço principal", e);
        }
    };

    if (isCartOpen) {
        fetchPrincipalAddress();
    }
  }, [isCartOpen, user]);

  const isCouponBlocked = useMemo(() => {
    if (!activeRestaurant) return false;
    const hasPromoItems = items.some(item => item.originalPrice && item.originalPrice > item.price);
    if (hasPromoItems && !activeRestaurant.allowCouponsOnPromo) return true;
    return false;
  }, [items, activeRestaurant]);

  useEffect(() => {
     if (isCouponBlocked && appliedCoupon) {
        removeCoupon();
        setCouponMsg({ type: 'error', text: 'Cupom removido: itens em oferta no carrinho.' });
     }
  }, [isCouponBlocked, appliedCoupon, removeCoupon]);

  const handleApplyCoupon = async () => {
    if (!couponInput || !activeRestaurant) return;
    setIsApplying(true);
    setCouponMsg(null);
    const result = await applyCoupon(couponInput, activeRestaurant.id);
    if (result.success) {
      setCouponMsg({ type: 'success', text: result.message });
      setCouponInput('');
    } else {
      setCouponMsg({ type: 'error', text: result.message });
    }
    setIsApplying(false);
  };

  if (!isCartOpen) return null;
  if (isLoadingRestaurant) return <DrawerContainer onClose={() => setIsCartOpen(false)}><div className="flex flex-col items-center justify-center h-full text-brand-600"><Loader2 size={48} className="animate-spin" /></div></DrawerContainer>;
  if (items.length === 0) return <DrawerContainer onClose={() => setIsCartOpen(false)}><div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4"><ShoppingBag size={48} /><p>Sua sacola está vazia</p><Button onClick={() => setIsCartOpen(false)}>Voltar</Button></div></DrawerContainer>;
  if (!activeRestaurant) return <DrawerContainer onClose={() => setIsCartOpen(false)}><div className="flex flex-col items-center justify-center h-full p-6 text-center"><AlertCircle size={48} className="text-red-500 mb-4" /><p>Loja não encontrada.</p></div></DrawerContainer>;

  let effectiveDeliveryFee = orderType === 'delivery' ? (activeRestaurant.deliveryConfig?.fixedPrice || 0) : 0;
  
  // Endereço final a ser usado (Prioridade: Principal > Localização Atual)
  const finalDeliveryAddress = principalAddress || location;
  const isDeliveryWithoutAddress = orderType === 'delivery' && !finalDeliveryAddress;

  const handleCheckout = () => {
    if (isDeliveryWithoutAddress) return alert('Cadastre um endereço principal.');
    if (customerName.trim() === '' || paymentMethod === '') return alert('Preencha os dados.');

    // Formata o endereço completo com referência
    const addressStr = finalDeliveryAddress 
        ? `${finalDeliveryAddress.street}, ${finalDeliveryAddress.number} - ${finalDeliveryAddress.neighborhood} (${finalDeliveryAddress.city})${finalDeliveryAddress.reference ? ` \nRef: ${finalDeliveryAddress.reference}` : ''}`
        : '';
    
    const link = generateWhatsAppLink(activeRestaurant, {
      customerName,
      paymentMethod,
      orderType,
      items,
      total: totalWithDiscount,
      deliveryFee: effectiveDeliveryFee,
      address: addressStr,
      changeFor: paymentMethod === 'Dinheiro' ? changeAmount : undefined,
      couponCode: appliedCoupon?.code,
      discountAmount: discountAmount
    });
    
    window.open(link, '_blank');
    setShowReviewModal(true);
  };

  const openMap = () => {
    if (activeRestaurant.address) {
      const query = encodeURIComponent(activeRestaurant.address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  return (
    <>
      <DrawerContainer onClose={() => setIsCartOpen(false)}>
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white z-10">
            <div className="flex items-center gap-2">
               <div className="w-10 h-10"><img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shopping%20Bags.png" className="w-full h-full object-contain" alt="Sacola" /></div>
               <div><h2 className="text-lg font-bold text-gray-900 leading-none">Sua Sacola</h2><p className="text-xs text-gray-500 mt-0.5">{activeRestaurant.name}</p></div>
            </div>
            <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-400"><X size={24} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden border bg-gray-50 relative">
                     <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                     {item.originalPrice && item.originalPrice > item.price && (
                        <div className="absolute top-0 left-0 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg">OFERTA</div>
                     )}
                  </div>
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex justify-between items-start mb-1"><h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4><button onClick={() => removeFromCart(item.id)} className="text-gray-400"><Trash2 size={16} /></button></div>
                    <div className="mt-auto flex items-center justify-between">
                       <div className="flex flex-col">
                          {item.originalPrice && item.originalPrice > item.price && <span className="text-[10px] text-gray-400 line-through">R$ {item.originalPrice.toFixed(2)}</span>}
                          <span className="font-bold text-brand-600 text-sm">R$ {item.price.toFixed(2)}</span>
                       </div>
                       <QuantitySelector size="sm" quantity={item.quantity} onIncrease={() => updateQuantity(item.id, 1)} onDecrease={() => updateQuantity(item.id, -1)} />
                    </div>
                  </div>
                </div>
              ))}

              <div className="space-y-3">
                  <div className="bg-gray-100 p-1 rounded-xl flex">
                    <button onClick={() => setOrderType('delivery')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${orderType === 'delivery' ? 'bg-brand-600 text-white shadow-md' : 'text-gray-500'}`}>Entrega</button>
                    <button onClick={() => setOrderType('pickup')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${orderType === 'pickup' ? 'bg-brand-600 text-white shadow-md' : 'text-gray-500'}`}>Retirada</button>
                  </div>

                  {orderType === 'pickup' && (
                      <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl animate-in fade-in slide-in-from-top-1">
                          <div className="flex items-start gap-3">
                              <div className="bg-blue-100 p-2 rounded-full shrink-0"><MapPin size={18} className="text-blue-600" /></div>
                              <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-blue-900">Endereço de Retirada</h4>
                                  <p className="text-xs text-blue-700 mt-1 mb-2 line-clamp-2">{activeRestaurant.address || 'Endereço não disponível'}</p>
                                  <button onClick={openMap} className="text-xs font-bold bg-white text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-50 transition-colors"><ExternalLink size={12} /> Ver no Mapa</button>
                              </div>
                          </div>
                      </div>
                  )}

                  {orderType === 'delivery' && (
                      <div className={`p-3 rounded-xl animate-in fade-in slide-in-from-top-1 border ${finalDeliveryAddress ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full shrink-0 ${finalDeliveryAddress ? 'bg-green-100' : 'bg-red-100'}`}>
                                  <MapPin size={18} className={finalDeliveryAddress ? 'text-green-600' : 'text-red-500'} />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                     <h4 className={`text-sm font-bold ${finalDeliveryAddress ? 'text-green-900' : 'text-red-900'}`}>
                                         {finalDeliveryAddress ? 'Entregar em:' : 'Endereço não encontrado'}
                                     </h4>
                                     {finalDeliveryAddress?.isDefault && (
                                         <span className="text-[9px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                                             <Star size={8} className="fill-green-800" /> Principal
                                         </span>
                                     )}
                                  </div>
                                  
                                  {finalDeliveryAddress ? (
                                      <>
                                        <p className="text-xs text-green-800 mt-1">
                                            {finalDeliveryAddress.street}, {finalDeliveryAddress.number}
                                        </p>
                                        <p className="text-xs text-green-700">
                                            {finalDeliveryAddress.neighborhood} - {finalDeliveryAddress.city}
                                        </p>
                                        {finalDeliveryAddress.reference && (
                                            <p className="text-[10px] text-green-600 mt-1 italic">
                                                Ref: {finalDeliveryAddress.reference}
                                            </p>
                                        )}
                                      </>
                                  ) : (
                                      <div className="mt-2">
                                          <p className="text-xs text-red-700 mb-2">Você precisa ter um endereço principal cadastrado.</p>
                                          <Button size="sm" variant="secondary" onClick={() => setShowAddressManager(true)} className="w-full h-8 text-xs bg-white">
                                              Cadastrar Endereço
                                          </Button>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              <div className={`bg-white border rounded-xl p-4 shadow-sm transition-colors ${isCouponBlocked ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-2"><Ticket size={14} /> Cupom de Desconto</label>
                {isCouponBlocked ? (
                   <div className="flex items-start gap-3"><AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} /><p className="text-xs text-orange-700 font-medium">Este estabelecimento não permite o uso de cupons quando há <strong>itens em oferta</strong> na sacola.</p></div>
                ) : appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg animate-in zoom-in-95">
                    <div className="flex items-center gap-2"><Tag size={16} className="text-green-600" /><span className="font-bold text-green-700">{appliedCoupon.code}</span><span className="text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded">ATIVO</span></div>
                    <button onClick={removeCoupon} className="text-xs text-red-500 font-bold hover:underline">Remover</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Ex: PROMO10" className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none uppercase font-bold" />
                      <Button size="sm" onClick={handleApplyCoupon} isLoading={isApplying} disabled={!couponInput}>Aplicar</Button>
                    </div>
                    {couponMsg && <p className={`text-[10px] font-bold ${couponMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{couponMsg.text}</p>}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-sm uppercase flex items-center gap-2"><User size={16} /> Dados e Pagamento</h3>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Seu Nome" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  <option value="" disabled>Forma de Pagamento...</option>
                  {(activeRestaurant.paymentMethods || PAYMENT_METHODS).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {paymentMethod === 'Dinheiro' && <input type="text" value={changeAmount} onChange={(e) => setChangeAmount(e.target.value)} placeholder="Troco para quanto?" className="w-full px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg text-sm" />}
              </div>
          </div>

          <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>R$ {cartTotal.toFixed(2)}</span></div>
              {discountAmount > 0 && <div className="flex justify-between text-sm text-green-600 font-bold"><span>Desconto ({appliedCoupon?.code})</span><span>- R$ {discountAmount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-sm text-gray-500"><span>Entrega</span><span>{effectiveDeliveryFee === 0 ? 'Grátis' : `R$ ${effectiveDeliveryFee.toFixed(2)}`}</span></div>
              <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-200 mt-2">
                <span className="font-bold text-lg">Total</span>
                <span className="font-extrabold text-xl text-brand-600">R$ {(totalWithDiscount + effectiveDeliveryFee).toFixed(2)}</span>
              </div>
            </div>
            <Button fullWidth size="lg" onClick={handleCheckout} disabled={isDeliveryWithoutAddress || customerName === '' || paymentMethod === ''} className="bg-green-600 shadow-lg h-14 rounded-xl">Finalizar no WhatsApp</Button>
          </div>
      </DrawerContainer>
      <AddressManagerModal isOpen={showAddressManager} onClose={() => setShowAddressManager(false)} />
      {activeRestaurant && <OrderReviewModal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} onReviewSubmit={() => { clearCart(); setIsCartOpen(false); }} restaurantId={activeRestaurant.id} restaurantName={activeRestaurant.name} />}
    </>
  );
};