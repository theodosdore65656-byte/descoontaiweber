import React, { useState } from 'react';
import { Restaurant } from '../../../types';
import { SubscriptionStatusCard } from '../components/SubscriptionStatusCard';
import { PaymentModal } from '../components/PaymentModal';
import { Button } from '../../../components/ui/Button';
import { ShieldCheck, Beaker } from 'lucide-react';
import { IS_SANDBOX } from '../config/asaasConfig'; // Usando a nova flag

interface MerchantSubscriptionScreenProps {
  restaurant: Restaurant;
}

export const MerchantSubscriptionScreen: React.FC<MerchantSubscriptionScreenProps> = ({ restaurant }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const status = restaurant.subscriptionStatus || 'trial';
  
  // Valor fixo do plano (simulado)
  const PLAN_PRICE = "R$ 49,90"; 
  
  return (
    <div className="pb-24 animate-in fade-in">
       
       <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="font-bold text-gray-800 text-lg mb-1">Financeiro & Assinatura</h2>
            <p className="text-gray-500 text-sm">Gerencie o pagamento da mensalidade do app.</p>
          </div>
          {IS_SANDBOX && (
             <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-orange-200 flex items-center gap-1 shadow-sm">
                <Beaker size={12} /> Modo Teste
             </div>
          )}
       </div>

       {/* Status Card */}
       <SubscriptionStatusCard 
          status={status} 
          nextDueDate={restaurant.nextDueDate} 
       />

       {/* Plan Info Card */}
       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
          <div className="flex justify-between items-start mb-4">
             <div>
                <h3 className="font-bold text-gray-900 text-lg">Plano Parceiro PRO</h3>
                <p className="text-sm text-gray-500">Acesso completo a todas as funcionalidades.</p>
             </div>
             <div className="bg-brand-50 text-brand-700 px-3 py-1 rounded-lg font-bold text-lg">
                {PLAN_PRICE}<span className="text-xs font-normal">/mês</span>
             </div>
          </div>

          <ul className="space-y-2 text-sm text-gray-600 mb-6">
             <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-500" /> Cardápio Digital Ilimitado</li>
             <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-500" /> Painel de Gestão</li>
             <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-500" /> Link Personalizado</li>
             <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-green-500" /> Suporte Prioritário</li>
          </ul>

          <Button 
            fullWidth 
            onClick={() => setShowPaymentModal(true)}
            variant={status === 'active' ? 'outline' : 'primary'}
            className={status === 'active' ? 'bg-white border-gray-300 text-gray-700' : ''}
          >
             {status === 'active' ? 'Gerenciar Pagamento' : 'Pagar Mensalidade Agora'}
          </Button>
          
          {IS_SANDBOX && (
             <p className="text-center text-xs text-orange-500 mt-3 font-medium bg-orange-50 p-2 rounded">
                ⚠️ Atenção: Pagamentos neste modo são fictícios. O dinheiro não será cobrado.
             </p>
          )}
       </div>

       {/* Modal de Pagamento (Passando restaurant para pegar dados) */}
       <PaymentModal 
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          restaurant={restaurant}
       />
    </div>
  );
};