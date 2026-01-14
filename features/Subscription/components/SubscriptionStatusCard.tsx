
import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { SubscriptionStatus } from '../../../types';

interface SubscriptionStatusCardProps {
  status: SubscriptionStatus;
  nextDueDate?: any; // Firestore Timestamp or Date
}

export const SubscriptionStatusCard: React.FC<SubscriptionStatusCardProps> = ({ status, nextDueDate }) => {
  
  let formattedDate = 'Indefinido';
  if (nextDueDate) {
      const dateObj = nextDueDate.toDate ? nextDueDate.toDate() : new Date(nextDueDate);
      formattedDate = dateObj.toLocaleDateString('pt-BR');
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          color: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          icon: <CheckCircle2 className="text-green-600" size={24} />,
          title: 'Assinatura Ativa',
          desc: `Seu plano está em dia. Próximo vencimento: ${formattedDate}.`
        };
      case 'trial':
        return {
          color: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          icon: <Clock className="text-blue-600" size={24} />,
          title: 'Período de Teste',
          desc: `Aproveite! O teste encerra em ${formattedDate}.`
        };
      case 'overdue':
        return {
          color: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          icon: <AlertTriangle className="text-yellow-600" size={24} />,
          title: 'Pagamento Pendente',
          desc: 'Evite o bloqueio da sua loja. Regularize sua mensalidade.'
        };
      case 'suspended':
        return {
          color: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          icon: <XCircle className="text-red-600" size={24} />,
          title: 'Conta Suspensa',
          desc: 'Seu acesso ao cardápio está bloqueado. Realize o pagamento para liberar.'
        };
      default: // Fallback para status desconhecido
        return {
            color: 'bg-gray-50 border-gray-200',
            textColor: 'text-gray-800',
            icon: <Clock className="text-gray-500" size={24} />,
            title: 'Status Desconhecido',
            desc: 'Entre em contato com o suporte.'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`p-5 rounded-xl border ${config.color} flex items-start gap-4 shadow-sm mb-6`}>
       <div className="shrink-0 mt-1">
          {config.icon}
       </div>
       <div>
          <h3 className={`font-bold text-lg ${config.textColor}`}>
             {config.title}
          </h3>
          <p className={`text-sm ${config.textColor} opacity-90 mt-1 leading-relaxed`}>
             {config.desc}
          </p>
       </div>
    </div>
  );
};
