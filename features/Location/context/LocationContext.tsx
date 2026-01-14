import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserLocation } from '../../../types';
// Importamos o AuthContext para fazer a ponte
import { useAuth } from '../../Auth/context/AuthContext';

interface LocationContextType {
  location: UserLocation | null;
  setLocation: (location: UserLocation) => void;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (isOpen: boolean) => void;
  isAddressComplete: boolean;
  addressToEdit: UserLocation | null;
  editingAddressIndex: number | null;
  setAddressToEdit: (address: UserLocation | null, index: number | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pega os dados do usuário
  const { user, savedAddresses } = useAuth();

  const [location, setLocationState] = useState<UserLocation | null>(() => {
    try {
      const stored = localStorage.getItem('user_current_location');
      return stored ? JSON.parse(stored) : null;
    } catch (e) { return null; }
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [addressToEdit, setAddressToEditState] = useState<UserLocation | null>(null);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);

  // --- SINCRONIZAÇÃO MÁGICA ---
  // Sempre que o usuário logar ou a lista de endereços mudar (via Configurações ou Add),
  // atualiza o "Local Atual" para ser o endereço Padrão.
  useEffect(() => {
    if (user && savedAddresses.length > 0) {
      // Tenta achar o marcado como padrão, senão pega o primeiro
      const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
      
      // Só atualiza se for diferente para evitar loop
      if (!location || 
          location.street !== defaultAddr.street || 
          location.number !== defaultAddr.number) {
         setLocationState(defaultAddr);
         localStorage.setItem('user_current_location', JSON.stringify(defaultAddr));
      }
    }
  }, [user, savedAddresses]); // Monitora essas variáveis

  const isAddressComplete = !!(
    location && location.state && location.city && 
    location.neighborhood && location.street && location.number
  );

  const setLocation = (loc: UserLocation) => {
    setLocationState(loc);
    localStorage.setItem('user_current_location', JSON.stringify(loc));
  };

  const setAddressToEdit = (address: UserLocation | null, index: number | null) => {
    setAddressToEditState(address);
    setEditingAddressIndex(index);
  };

  return (
    <LocationContext.Provider value={{
      location, setLocation,
      isLocationModalOpen, setIsLocationModalOpen,
      isAddressComplete,
      addressToEdit, editingAddressIndex, setAddressToEdit
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within a LocationProvider');
  return context;
};
