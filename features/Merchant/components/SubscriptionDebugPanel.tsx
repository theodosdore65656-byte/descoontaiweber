import React, { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Button } from '../../../components/ui/Button';
import { AlertTriangle, Clock, ShieldCheck, RefreshCw } from 'lucide-react';

interface SubscriptionDebugPanelProps {
  restaurantId: string;
  currentStatus?: string;
}

export const SubscriptionDebugPanel: React.FC<SubscriptionDebugPanelProps> = ({ restaurantId, currentStatus }) => {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (type: 'active' | 'overdue' | 'suspended' | 'trial', daysAgo: number = 0) => {
    if (!restaurantId) return;
    setLoading(true);

    try {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo); // Subtrai dias para simular passado

        const payload: any = {
            subscriptionStatus: type,
            // Salva como Timestamp do Firebase para garantir compatibilidade
            nextDueDate: Timestamp.fromDate(date) 
        };
        
        await updateDoc(doc(db, 'merchants', restaurantId), payload);
        alert(`Simulação aplicada: ${type.toUpperCase()} (Data: ${date.toLocaleDateString()})`);
        
        // Força recarregamento para ver efeito imediato
        window.location.reload(); 

    } catch (error) {
        console.error("Erro ao simular:", error);
        alert("Erro ao atualizar Firebase.");
    } finally {
        setLoading(false);
    }
  };

  if (process.env.NODE_ENV === 'production') {
      return null; // Não mostra em produção, só em desenvolvimento (localhost)
  }

  return (
    <div className="bg-gray-800 text-white p-4 rounded-xl mb-6 border border-gray-600 shadow-2xl">
       <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-600">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <h3 className="font-bold text-sm uppercase tracking-wider">Painel de Teste (Debug)</h3>
          <span className="ml-auto text-xs bg-gray-700 px-2 py-0.5 rounded">Status Atual: {currentStatus}</span>
       </div>
       
       <p className="text-xs text-gray-400 mb-3">
          Use estes botões para forçar o status da assinatura e ver como o app reage.
       </p>

       <div className="grid grid-cols-2 gap-2">
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700 text-white border-none text-xs"
            onClick={() => updateStatus('active', -30)} // Vence daqui 30 dias (Negativo = Futuro)
            disabled={loading}
          >
             <ShieldCheck size={14} className="mr-1" /> Ficar Ativo (Pago)
          </Button>

          <Button 
            size="sm" 
            className="bg-orange-600 hover:bg-orange-700 text-white border-none text-xs"
            onClick={() => updateStatus('active', 3)} // Venceu há 3 dias (mas ainda está 'active' no banco, o sistema que vai mudar para overdue)
            disabled={loading}
          >
             <Clock size={14} className="mr-1" /> Simular Atraso (3 dias)
          </Button>

          <Button 
            size="sm" 
            className="bg-red-600 hover:bg-red-700 text-white border-none text-xs"
            onClick={() => updateStatus('suspended', 10)} // Venceu há 10 dias
            disabled={loading}
          >
             <AlertTriangle size={14} className="mr-1" /> Simular Bloqueio (10 dias)
          </Button>

          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white border-none text-xs"
            onClick={() => updateStatus('trial', -7)} // Trial de 7 dias
            disabled={loading}
          >
             Resetar para Trial
          </Button>
       </div>
    </div>
  );
};