import React, { useEffect, useState } from 'react';
import { WeeklySchedule } from '../../../types';

interface RestaurantStatusBadgeProps {
  schedule?: WeeklySchedule;
  isManuallyOpen: boolean;
  className?: string;
}

export const RestaurantStatusBadge: React.FC<RestaurantStatusBadgeProps> = ({ 
  schedule, 
  isManuallyOpen,
  className = ''
}) => {
  const [isOpenNow, setIsOpenNow] = useState(isManuallyOpen);
  const [statusText, setStatusText] = useState(isManuallyOpen ? 'Aberto' : 'Fechado');

  useEffect(() => {
    // Se não tiver agendamento detalhado, usa o switch manual
    if (!schedule) {
      setIsOpenNow(isManuallyOpen);
      setStatusText(isManuallyOpen ? 'Aberto' : 'Fechado');
      return;
    }

    const now = new Date();
    const dayIndex = now.getDay(); // 0 = Dom, 1 = Seg...
    
    const keysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const currentKey = keysMap[dayIndex];
    const todaySchedule = schedule[currentKey];

    // Se o dia estiver marcado como fechado no agendamento
    if (!todaySchedule || !todaySchedule.isOpen) {
      setIsOpenNow(false);
      setStatusText('Fechado');
      return;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [openHour, openMinute] = todaySchedule.open.split(':').map(Number);
    const [closeHour, closeMinute] = todaySchedule.close.split(':').map(Number);
    
    const openTimeMinutes = openHour * 60 + openMinute;
    let closeTimeMinutes = closeHour * 60 + closeMinute;

    if (closeTimeMinutes < openTimeMinutes) {
        closeTimeMinutes += 24 * 60; // Tratamento para madrugada
    }
    
    // Se o master switch (isManuallyOpen) estiver false, ganha de tudo
    if (!isManuallyOpen) {
       setIsOpenNow(false);
       setStatusText('Fechado temporariamente');
       return;
    }

    if (currentMinutes >= openTimeMinutes && currentMinutes <= closeTimeMinutes) {
      setIsOpenNow(true);
      // Formata a hora de fechamento para ficar bonitinho (ex: 22:00)
      setStatusText(`Aberto até ${todaySchedule.close}`);
    } else {
      setIsOpenNow(false);
      setStatusText('Fechado agora');
    }

  }, [schedule, isManuallyOpen]);

  return (
    <div 
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm border
        backdrop-blur-md transition-all duration-300
        ${isOpenNow 
          ? 'bg-white/95 border-green-100 text-gray-800' 
          : 'bg-white/95 border-gray-100 text-gray-500'
        }
        ${className}
      `}
    >
      {/* Indicador Pulsante */}
      <span className="relative flex h-2.5 w-2.5">
        {isOpenNow && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOpenNow ? 'bg-green-500' : 'bg-gray-400'}`}></span>
      </span>

      {/* Texto */}
      <span className="text-[11px] font-bold uppercase tracking-wide leading-none pt-[1px]">
        {statusText}
      </span>
    </div>
  );
};