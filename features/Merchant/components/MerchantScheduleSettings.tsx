import React, { useState, useEffect } from 'react';
import { WeeklySchedule, DaySchedule } from '../../../types';

interface MerchantScheduleSettingsProps {
  schedule: WeeklySchedule;
  onUpdate: (newSchedule: WeeklySchedule) => void;
}

const DAYS_ORDER = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const DEFAULT_DAY: DaySchedule = {
  isOpen: true,
  open: '18:00',
  close: '23:00'
};

const MerchantScheduleSettingsComponent: React.FC<MerchantScheduleSettingsProps> = ({ schedule, onUpdate }) => {
  const [localSchedule, setLocalSchedule] = useState<WeeklySchedule>(schedule);

  useEffect(() => {
    setLocalSchedule(schedule);
  }, [schedule]);

  const handleChange = (day: string, field: keyof DaySchedule, value: any) => {
    const updatedSchedule = {
      ...localSchedule,
      [day]: {
        ...localSchedule[day],
        [field]: value
      }
    };
    setLocalSchedule(updatedSchedule);
    onUpdate(updatedSchedule);
  };

  const copyToAllDays = (sourceDay: string) => {
    if(confirm(`Copiar horários de ${sourceDay} para todos os outros dias?`)) {
        const source = localSchedule[sourceDay];
        const newSchedule: WeeklySchedule = {};
        DAYS_ORDER.forEach(d => {
            newSchedule[d] = { ...source };
        });
        setLocalSchedule(newSchedule);
        onUpdate(newSchedule);
    }
  };

  return (
    <div className="space-y-4">
       <div className="grid gap-3">
          {DAYS_ORDER.map((day) => {
             const dayConfig = localSchedule[day] || DEFAULT_DAY;
             
             return (
               <div key={day} className={`p-3 rounded-lg border flex flex-col sm:flex-row items-center gap-3 transition-colors ${dayConfig.isOpen ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                  
                  {/* Toggle Day */}
                  <div className="flex items-center gap-3 w-full sm:w-24">
                     <button
                       type="button"
                       onClick={() => handleChange(day, 'isOpen', !dayConfig.isOpen)}
                       className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${dayConfig.isOpen ? 'bg-green-500' : 'bg-gray-300'}`}
                     >
                       <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${dayConfig.isOpen ? 'left-5' : 'left-1'}`} />
                     </button>
                     <span className={`font-bold ${dayConfig.isOpen ? 'text-gray-900' : 'text-gray-400'}`}>{day}</span>
                  </div>

                  {/* Time Inputs */}
                  {dayConfig.isOpen ? (
                      <div className="flex items-center gap-2 flex-1 w-full justify-center sm:justify-start">
                          <div className="relative">
                            <input 
                                type="time" 
                                value={dayConfig.open}
                                onChange={(e) => handleChange(day, 'open', e.target.value)}
                                className="bg-gray-800 border border-transparent rounded-lg px-3 py-2 text-sm text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
                                style={{ colorScheme: 'dark' }} 
                            />
                          </div>
                          <span className="text-gray-400 text-xs font-medium">até</span>
                          <div className="relative">
                            <input 
                                type="time" 
                                value={dayConfig.close}
                                onChange={(e) => handleChange(day, 'close', e.target.value)}
                                className="bg-gray-800 border border-transparent rounded-lg px-3 py-2 text-sm text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
                                style={{ colorScheme: 'dark' }}
                            />
                          </div>
                      </div>
                  ) : (
                      <div className="flex-1 text-sm text-gray-400 italic text-center sm:text-left">
                          Fechado
                      </div>
                  )}

                  {/* Action */}
                  {dayConfig.isOpen && (
                      <button 
                        type="button" 
                        onClick={() => copyToAllDays(day)}
                        className="text-xs text-brand-600 hover:text-brand-800 hover:bg-brand-50 px-3 py-1.5 rounded-full font-medium transition-colors border border-transparent hover:border-brand-100"
                        title="Aplicar este horário para todos os dias"
                      >
                        Copiar p/ todos
                      </button>
                  )}
               </div>
             );
          })}
       </div>
    </div>
  );
};

export const MerchantScheduleSettings = React.memo(MerchantScheduleSettingsComponent);