
import React from 'react';
import { MapPin, Info } from 'lucide-react';

interface StoreFooterActionsProps {
  address: string;
  lat: number;
  lng: number;
  onInfoClick: () => void;
}

export const StoreFooterActions: React.FC<StoreFooterActionsProps> = ({ 
  address, 
  lat, 
  lng,
  onInfoClick
}) => {
  
  const handleOpenLocation = () => {
    // Try to open in Google Maps App or Browser
    const query = lat && lng ? `${lat},${lng}` : encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-4 z-40 flex flex-col gap-3">
      {/* Botão Flutuante de Localização - Estilo Vermelho da Marca */}
      <button 
        onClick={handleOpenLocation}
        className="w-12 h-12 bg-brand-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-brand-700 transition-all active:scale-95"
        title="Ver localização"
      >
        <MapPin size={24} />
      </button>

      {/* Botão Flutuante de Informações (Abaixo da localização) */}
      <button 
        onClick={onInfoClick}
        className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-gray-700 hover:text-brand-600 transition-all active:scale-95"
        title="Mais informações"
      >
        <Info size={24} />
      </button>
    </div>
  );
};
