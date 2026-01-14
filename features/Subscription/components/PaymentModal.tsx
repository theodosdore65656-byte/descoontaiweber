import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { CreditCardForm } from './CreditCardForm';
import { PixPaymentForm } from './PixPaymentForm';
import { CreditCard, QrCode, ShieldCheck, RefreshCw, Calendar, CheckCircle2 } from 'lucide-react';
import { Restaurant } from '../../../types';
import { SUBSCRIPTION_VALUE } from '../config/asaasConfig';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
}

type PaymentMethod = 'pix' | 'credit_card';
type RecurrenceType = 'manual' | 'auto'; // Novo tipo de escolha

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, restaurant }) => {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('auto'); // Padrão: Automático (Melhor pra você)

  const handleBack = () => {
    setMethod(null);
  };

  return (
    <Modal 
       isOpen={isOpen} 
       onClose={onClose} 
       title={method ? (method === 'pix' ? 'Pagamento via PIX' : 'Pagamento via Cartão') : 'Escolha como pagar'}
    >
      <div className="pt-2">
        {!method ? (
          <div className="space-y-4">
            
            {/* 1. SELETOR DE PLANO (MENSAL vs RECORRENTE) */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
               <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Como você prefere pagar?</h3>
               
               <div className="space-y-3">
                  {/* OPÇÃO AUTOMÁTICA (RECOMENDADA) */}
                  <label 
                    className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${recurrence === 'auto' ? 'border-brand-500 bg-brand-50/50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                    onClick={() => setRecurrence('auto')}
                  >
                     <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${recurrence === 'auto' ? 'border-brand-600 bg-brand-600' : 'border-gray-300 bg-white'}`}>
                        {recurrence === 'auto' && <div className="w-2 h-2 bg-white rounded-full" />}
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-center">
                           <span className={`font-bold ${recurrence === 'auto' ? 'text-brand-900' : 'text-gray-700'}`}>Assinatura Automática</span>
                           <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">RECOMENDADO</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                           Cobrança mensal no cartão. Evite bloqueios por esquecimento. Cancele quando quiser.
                        </p>
                     </div>
                  </label>

                  {/* OPÇÃO MANUAL */}
                  <label 
                    className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${recurrence === 'manual' ? 'border-gray-600 bg-gray-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                    onClick={() => setRecurrence('manual')}
                  >
                     <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${recurrence === 'manual' ? 'border-gray-800 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                        {recurrence === 'manual' && <div className="w-2 h-2 bg-white rounded-full" />}
                     </div>
                     <div className="flex-1">
                        <span className={`font-bold ${recurrence === 'manual' ? 'text-gray-900' : 'text-gray-700'}`}>Pagamento Único (Manual)</span>
                        <p className="text-xs text-gray-500 mt-1">
                           Pague apenas este mês. Você precisará renovar manualmente no próximo vencimento.
                        </p>
                     </div>
                  </label>
               </div>
            </div>

            {/* 2. BOTÕES DE MÉTODO DE PAGAMENTO */}
            <div className="grid grid-cols-1 gap-3">
               {/* Cartão de Crédito */}
               <button 
                  onClick={() => setMethod('credit_card')}
                  className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-brand-500 hover:shadow-md transition-all group"
               >
                  <div className="flex items-center gap-3">
                     <div className="bg-brand-50 text-brand-600 p-2 rounded-lg group-hover:bg-brand-600 group-hover:text-white transition-colors">
                        <CreditCard size={24} />
                     </div>
                     <div className="text-left">
                        <span className="block font-bold text-gray-800">Cartão de Crédito</span>
                        <span className="text-xs text-gray-500">Liberação imediata</span>
                     </div>
                  </div>
                  {recurrence === 'auto' && <RefreshCw size={16} className="text-brand-500" title="Recorrente" />}
               </button>

               {/* PIX (Apenas se for Manual, ou avisa que Pix não tem recorrencia automática fácil aqui) */}
               {recurrence === 'manual' && (
                   <button 
                      onClick={() => setMethod('pix')}
                      className="flex items-center gap-3 w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-brand-500 hover:shadow-md transition-all group"
                   >
                      <div className="bg-green-50 text-green-600 p-2 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                         <QrCode size={24} />
                      </div>
                      <div className="text-left">
                         <span className="block font-bold text-gray-800">PIX</span>
                         <span className="text-xs text-gray-500">Aprova na hora</span>
                      </div>
                   </button>
               )}
            </div>

            {/* Aviso se PIX + Automático (Incompatível neste fluxo simples) */}
            {recurrence === 'auto' && (
                <div className="bg-blue-50 p-3 rounded-lg flex gap-2 items-center text-xs text-blue-700">
                    <CheckCircle2 size={16} />
                    <p>Para assinatura automática, selecione <strong>Cartão de Crédito</strong>.</p>
                </div>
            )}

            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
               <ShieldCheck size={14} />
               Ambiente Seguro • Dados Criptografados
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-4">
             <button onClick={handleBack} className="text-sm text-gray-500 hover:text-brand-600 mb-4 flex items-center gap-1">
                ← Voltar para opções
             </button>

             {method === 'credit_card' && (
                <CreditCardForm 
                   restaurantId={restaurant.id} 
                   onSuccess={onClose} 
                   isRecurrent={recurrence === 'auto'} // Passa a escolha para o form
                />
             )}

             {method === 'pix' && (
                <PixPaymentForm 
                   restaurantId={restaurant.id} 
                   onSuccess={onClose} 
                />
             )}
          </div>
        )}
      </div>
    </Modal>
  );
};