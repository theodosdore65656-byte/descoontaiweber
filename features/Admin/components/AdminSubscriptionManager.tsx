import React, { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Gift, Calendar, ShieldCheck, Infinity as InfinityIcon, Loader2 } from 'lucide-react';

interface AdminSubscriptionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  merchantId: string;
  merchantName: string;
  onSuccess: () => void;
}

export const AdminSubscriptionManager: React.FC<AdminSubscriptionManagerProps> = ({
  isOpen, onClose, merchantId, merchantName, onSuccess
}) => {
  const [loading, setLoading] = useState(false);

  const grantAccess = async (months: number | 'lifetime') => {
    setLoading(true);
    try {
      let newDate = new Date();
      let label = "";

      if (months === 'lifetime') {
         // Define data para o ano 2099
         newDate.setFullYear(2099, 0, 1);
         label = "VITALÍCIO";
      } else {
         // Adiciona X meses a partir de hoje
         newDate.setMonth(newDate.getMonth() + months);
         label = `${months} MESES`;
      }

      await updateDoc(doc(db, 'merchants', merchantId), {
         subscriptionStatus: 'active', // Força status ativo
         nextDueDate: Timestamp.fromDate(newDate), // Define nova data
         isVip: months === 'lifetime' // Opcional: marca como VIP no banco
      });

      alert(`Sucesso! ${merchantName} ganhou acesso ${label} (até ${newDate.toLocaleDateString()}).`);
      onSuccess();
      onClose();

    } catch (error) {
      console.error("Erro ao dar gratuidade:", error);
      alert("Erro ao atualizar o parceiro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Gratuidade para: ${merchantName}`}>
       <div className="space-y-4 pt-2">
          <div className="bg-brand-50 p-4 rounded-xl flex gap-3 items-start">
             <Gift className="text-brand-600 shrink-0 mt-1" />
             <div>
                <p className="text-sm text-brand-800 font-bold">Presentear Parceiro</p>
                <p className="text-xs text-brand-600 mt-1">
                   Ao selecionar uma opção abaixo, o status mudará para "Ativo" e o sistema não cobrará nada até a nova data de vencimento.
                </p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <Button 
               variant="outline" 
               onClick={() => grantAccess(1)} 
               disabled={loading}
               className="flex flex-col h-auto py-4 gap-2 border-gray-200 hover:border-brand-500 hover:bg-brand-50"
             >
                <Calendar size={20} className="text-gray-500" />
                <span className="text-xs font-bold">+1 Mês Grátis</span>
             </Button>

             <Button 
               variant="outline" 
               onClick={() => grantAccess(3)} 
               disabled={loading}
               className="flex flex-col h-auto py-4 gap-2 border-gray-200 hover:border-brand-500 hover:bg-brand-50"
             >
                <Calendar size={20} className="text-gray-500" />
                <span className="text-xs font-bold">+3 Meses Grátis</span>
             </Button>

             <Button 
               variant="outline" 
               onClick={() => grantAccess(6)} 
               disabled={loading}
               className="flex flex-col h-auto py-4 gap-2 border-gray-200 hover:border-brand-500 hover:bg-brand-50"
             >
                <Calendar size={20} className="text-gray-500" />
                <span className="text-xs font-bold">+6 Meses Grátis</span>
             </Button>
             
             <Button 
               variant="outline" 
               onClick={() => grantAccess(12)} 
               disabled={loading}
               className="flex flex-col h-auto py-4 gap-2 border-gray-200 hover:border-brand-500 hover:bg-brand-50"
             >
                <ShieldCheck size={20} className="text-gray-500" />
                <span className="text-xs font-bold">+1 Ano Grátis</span>
             </Button>
          </div>

          <div className="pt-2 border-t border-gray-100">
             <Button 
               fullWidth 
               onClick={() => grantAccess('lifetime')} 
               disabled={loading}
               className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200"
             >
                {loading ? <Loader2 className="animate-spin" /> : <><InfinityIcon size={18} className="mr-2" /> Acesso Vitalício (Permanente)</>}
             </Button>
             <p className="text-[10px] text-center text-gray-400 mt-2">O acesso vitalício define o vencimento para o ano 2099.</p>
          </div>
       </div>
    </Modal>
  );
};