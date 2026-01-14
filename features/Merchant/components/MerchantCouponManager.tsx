import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Ticket, Percent, Calendar, DollarSign, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../Auth/context/AuthContext';
import { db } from '../../../lib/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, updateDoc } from 'firebase/firestore';
import { Restaurant } from '../../../types';

interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderValue: number;
  isActive: boolean;
  createdAt: any;
}

// Interface atualizada para receber dados da loja
interface MerchantCouponManagerProps {
  restaurant?: Restaurant;
  onUpdateRestaurant?: (data: Partial<Restaurant>) => Promise<void>;
}

export const MerchantCouponManager: React.FC<MerchantCouponManagerProps> = ({ restaurant, onUpdateRestaurant }) => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  
  // Loading state para o switch de promoção
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'merchants', user.uid, 'coupons'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedCoupons: Coupon[] = [];
      snapshot.forEach((doc) => {
        loadedCoupons.push({ id: doc.id, ...doc.data() } as Coupon);
      });
      setCoupons(loadedCoupons);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsCreating(true);

    try {
      await addDoc(collection(db, 'merchants', user.uid, 'coupons'), {
        code: code.toUpperCase().trim(),
        type,
        value: Number(value),
        minOrderValue: Number(minOrder) || 0,
        isActive: true,
        createdAt: new Date()
      });
      setCode('');
      setValue('');
      setMinOrder('');
      alert('Cupom criado com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao criar cupom.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Excluir este cupom?')) return;
    try {
      await deleteDoc(doc(db, 'merchants', user.uid, 'coupons', id));
    } catch (e) {
      console.error(e);
    }
  };

  const togglePromoSettings = async (checked: boolean) => {
      if(!onUpdateRestaurant) return;
      setIsUpdatingSettings(true);
      await onUpdateRestaurant({ allowCouponsOnPromo: checked });
      setIsUpdatingSettings(false);
  }

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="text-center mb-6">
        <div className="bg-brand-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-brand-600">
          <Ticket size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Gerenciar Cupons</h2>
        <p className="text-gray-500">Crie códigos de desconto para seus clientes.</p>
      </div>

      {/* --- NOVA ÁREA: CONFIGURAÇÕES GERAIS DE CUPOM (SWITCH DE PROMOÇÃO) --- */}
      {restaurant && onUpdateRestaurant && (
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 shadow-sm animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg text-orange-600 shadow-sm border border-orange-100">
                        <Percent size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">Cupons em Promoções</h3>
                        <p className="text-xs text-gray-600 max-w-[250px] leading-tight mt-0.5">
                           Permitir uso de cupom mesmo se houver itens em oferta na sacola?
                        </p>
                    </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={restaurant.allowCouponsOnPromo || false}
                        onChange={(e) => togglePromoSettings(e.target.checked)}
                        disabled={isUpdatingSettings}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
            </div>
        </div>
      )}

      {/* Formulário de Criação */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Plus size={18} className="text-brand-600" /> Novo Cupom</h3>
        <form onSubmit={handleCreateCoupon} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Código</label>
               <input 
                 required
                 value={code}
                 onChange={(e) => setCode(e.target.value)}
                 placeholder="Ex: PROMO10" 
                 className="w-full p-2 border border-gray-200 rounded-lg uppercase font-bold focus:ring-2 focus:ring-brand-500 outline-none"
               />
             </div>
             <div>
               <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tipo</label>
               <div className="flex bg-gray-100 p-1 rounded-lg">
                 <button type="button" onClick={() => setType('percent')} className={`flex-1 text-xs py-1.5 rounded-md font-bold transition-all ${type === 'percent' ? 'bg-white shadow text-brand-600' : 'text-gray-500'}`}>% Porcentagem</button>
                 <button type="button" onClick={() => setType('fixed')} className={`flex-1 text-xs py-1.5 rounded-md font-bold transition-all ${type === 'fixed' ? 'bg-white shadow text-brand-600' : 'text-gray-500'}`}>R$ Fixo</button>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Valor do Desconto</label>
               <div className="relative">
                 {type === 'fixed' && <DollarSign size={14} className="absolute left-3 top-3 text-gray-400" />}
                 {type === 'percent' && <Percent size={14} className="absolute left-3 top-3 text-gray-400" />}
                 <input 
                   required
                   type="number"
                   value={value}
                   onChange={(e) => setValue(e.target.value)}
                   placeholder="Ex: 10" 
                   className="w-full pl-8 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                 />
               </div>
             </div>
             <div>
               <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Pedido Mínimo (Opcional)</label>
               <div className="relative">
                 <span className="absolute left-3 top-2.5 text-gray-400 text-xs">R$</span>
                 <input 
                   type="number"
                   value={minOrder}
                   onChange={(e) => setMinOrder(e.target.value)}
                   placeholder="0.00" 
                   className="w-full pl-8 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                 />
               </div>
             </div>
          </div>

          <Button type="submit" isLoading={isCreating} fullWidth className="mt-2">Criar Cupom</Button>
        </form>
      </div>

      {/* Lista de Cupons */}
      <div className="space-y-3">
        {coupons.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
            <Ticket size={32} className="mx-auto mb-2 opacity-50" />
            <p>Nenhum cupom ativo.</p>
          </div>
        ) : (
          coupons.map(coupon => (
            <div key={coupon.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg text-gray-900">{coupon.code}</span>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{coupon.type === 'percent' ? 'Porcentagem' : 'Fixo'}</span>
                 </div>
                 <p className="text-sm text-gray-600">
                    Desconto de <strong className="text-brand-600">{coupon.type === 'percent' ? `${coupon.value}%` : `R$ ${coupon.value.toFixed(2)}`}</strong>
                    {coupon.minOrderValue > 0 && ` em pedidos acima de R$ ${coupon.minOrderValue.toFixed(2)}`}
                 </p>
              </div>
              <button onClick={() => handleDelete(coupon.id)} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors">
                 <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};