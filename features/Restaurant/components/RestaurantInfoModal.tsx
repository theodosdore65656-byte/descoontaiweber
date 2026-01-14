
import React from 'react';
import { Restaurant } from '../../../types';
import { Modal } from '../../../components/ui/Modal';
import { Clock, MapPin, Wallet } from 'lucide-react';
import { PAYMENT_METHODS } from '../../../constants';

interface RestaurantInfoModalProps {
  restaurant: Restaurant;
  isOpen: boolean;
  onClose: () => void;
}

export const RestaurantInfoModal: React.FC<RestaurantInfoModalProps> = ({ restaurant, isOpen, onClose }) => {
  // Use métodos do restaurante ou fallback para todos
  const availableMethods = (restaurant.paymentMethods && restaurant.paymentMethods.length > 0) 
    ? restaurant.paymentMethods 
    : PAYMENT_METHODS;

  // --- LÓGICA DE HORÁRIO ---
  const getTodayScheduleDisplay = () => {
    if (!restaurant.schedule) return "Consulte o status no topo.";

    const date = new Date();
    const dayIndex = date.getDay(); // 0 = Domingo, 1 = Segunda...
    
    // Mapeamento Index JS -> Chaves do Objeto WeeklySchedule
    const keysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    // Mapeamento Chaves -> Nome Extenso para Exibição
    const displayMap: Record<string, string> = {
      'Dom': 'Domingo',
      'Seg': 'Segunda-feira',
      'Ter': 'Terça-feira',
      'Qua': 'Quarta-feira',
      'Qui': 'Quinta-feira',
      'Sex': 'Sexta-feira',
      'Sáb': 'Sábado'
    };

    const currentKey = keysMap[dayIndex];
    const schedule = restaurant.schedule[currentKey];
    const displayName = displayMap[currentKey];

    if (!schedule) return "Horário não disponível hoje.";

    if (!schedule.isOpen) {
      return `${displayName}: Fechado`;
    }

    return `${displayName}: ${schedule.open} às ${schedule.close}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sobre a Loja">
      <div className="space-y-6">
        
        {/* Address */}
        <div className="flex items-start space-x-3">
          <MapPin className="text-gray-400 mt-1" size={20} />
          <div>
            <h4 className="font-semibold text-gray-900">Endereço</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{restaurant.address}</p>
          </div>
        </div>

        {/* Hours */}
        <div className="flex items-start space-x-3">
          <Clock className="text-gray-400 mt-1" size={20} />
          <div>
            <h4 className="font-semibold text-gray-900">Horários</h4>
            <p className="text-gray-600 text-sm font-medium">
              {getTodayScheduleDisplay()}
            </p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
               <Wallet className="text-gray-400" size={20} />
               <h4 className="font-semibold text-gray-900">Pagamento na Entrega</h4>
            </div>
            <div className="flex flex-wrap gap-2">
                {availableMethods.map((method) => (
                  <span key={method} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 font-medium border border-gray-200">
                    {method}
                  </span>
                ))}
            </div>
        </div>
      </div>
    </Modal>
  );
};
