
import React, { useEffect, useState } from 'react';
import { PromoNotice } from '../../types';
import { PromoModal } from '../ui/PromoModal';
import { useLocation } from '../../features/Location/context/LocationContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const GlobalPromoOverlay: React.FC = () => {
  const [activePromo, setActivePromo] = useState<PromoNotice | null>(null);
  const { isAddressComplete } = useLocation();

  useEffect(() => {
    // Escuta em tempo real a coleção 'notices' onde isActive == true
    const q = query(collection(db, 'notices'), where('isActive', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeNotices: PromoNotice[] = [];
      snapshot.forEach((doc) => {
        activeNotices.push({ ...doc.data(), id: doc.id } as PromoNotice);
      });

      // Processa os avisos encontrados
      checkPromos(activeNotices);
    }, (error) => {
      console.error("Erro ao buscar avisos:", error);
    });

    return () => unsubscribe();
  }, []);

  const checkPromos = (activeNotices: PromoNotice[]) => {
    if (activeNotices.length === 0) return;

    // 2. Load User History (o que o usuário já viu)
    const historyStr = localStorage.getItem('user_promo_history');
    const history: Record<string, number> = historyStr ? JSON.parse(historyStr) : {};

    // 3. Find Candidate
    // Prioridade para os mais novos (criados por último)
    // Ordenar por createdAt desc (caso não venha ordenado)
    activeNotices.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const candidate = activeNotices.find(n => {
       const lastSeen = history[n.id];

       if (n.frequency === 'always') return true;
       
       if (n.frequency === 'once') {
          return !lastSeen; // Show only if never seen
       }

       if (n.frequency === 'daily') {
          if (!lastSeen) return true;
          const oneDay = 24 * 60 * 60 * 1000;
          return (Date.now() - lastSeen) > oneDay; // Show if > 24h
       }

       return false;
    });

    if (candidate) {
       // Pequeno delay para UX (não pular na cara imediatamente ao carregar o app)
       setTimeout(() => setActivePromo(candidate), 2000);
    }
  };

  const handleClose = () => {
    if (!activePromo) return;

    // Save History
    const historyStr = localStorage.getItem('user_promo_history');
    const history = historyStr ? JSON.parse(historyStr) : {};
    history[activePromo.id] = Date.now();
    localStorage.setItem('user_promo_history', JSON.stringify(history));

    setActivePromo(null);
  };

  const handlePrimary = () => {
    if (activePromo?.primaryButtonLink) {
       window.open(activePromo.primaryButtonLink, '_blank');
    }
    handleClose();
  };

  if (!activePromo) return null;

  return (
    <PromoModal 
      title={activePromo.title}
      message={activePromo.message}
      icon={activePromo.icon}
      primaryButtonText={activePromo.primaryButtonText}
      secondaryButtonText={activePromo.secondaryButtonText}
      onPrimaryClick={handlePrimary}
      onSecondaryClick={handleClose}
      onClose={handleClose}
    />
  );
};
