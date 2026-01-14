import React from 'react';
import { CreditCard, Banknote, QrCode, CheckSquare, Square } from 'lucide-react';
import { AVAILABLE_PAYMENT_METHODS } from '../../../constants';

interface MerchantPaymentSettingsProps {
  selectedMethods: string[];
  onUpdate: (methods: string[]) => void;
}

// Ícones mapeados para os métodos conhecidos
const METHOD_ICONS: Record<string, React.ElementType> = {
  'PIX': QrCode,
  'Dinheiro': Banknote,
  'Cartão de Crédito': CreditCard,
  'Cartão de Débito': CreditCard
};

const MerchantPaymentSettingsComponent: React.FC<MerchantPaymentSettingsProps> = ({ selectedMethods = [], onUpdate }) => {
  
  const toggleMethod = (method: string) => {
    let newMethods = [...selectedMethods];
    if (newMethods.includes(method)) {
      newMethods = newMethods.filter(m => m !== method);
    } else {
      newMethods.push(method);
    }
    onUpdate(newMethods);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {AVAILABLE_PAYMENT_METHODS.map((method) => {
        const isSelected = selectedMethods.includes(method);
        const Icon = METHOD_ICONS[method] || CreditCard;

        return (
          <div 
            key={method}
            onClick={() => toggleMethod(method)}
            className={`
              flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200
              ${isSelected 
                ? 'bg-brand-50 border-brand-500 shadow-sm' 
                : 'bg-white border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-white text-brand-600' : 'bg-gray-100 text-gray-500'}`}>
                <Icon size={20} />
              </div>
              <span className={`font-semibold ${isSelected ? 'text-brand-900' : 'text-gray-600'}`}>
                {method}
              </span>
            </div>

            <div className={`text-brand-600 transition-transform ${isSelected ? 'scale-100' : 'scale-90 opacity-50'}`}>
              {isSelected ? <CheckSquare size={24} className="fill-brand-600 text-white" /> : <Square size={24} className="text-gray-300" />}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Memoização para evitar re-renders desnecessários quando o componente pai atualizar outros estados
export const MerchantPaymentSettings = React.memo(MerchantPaymentSettingsComponent);