import { useEffect } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Restaurant } from '../../../types';

export const useSubscriptionAutoCheck = (restaurant: Restaurant | null) => {
  useEffect(() => {
    if (!restaurant || !restaurant.id) return;

    const checkValidity = async () => {
        // Se já estiver suspenso ou for teste, não faz nada
        if (restaurant.subscriptionStatus === 'suspended' || restaurant.subscriptionStatus === 'trial') return;

        // Se não tiver data, ignora
        if (!restaurant.nextDueDate) return;

        const now = new Date();
        
        // Conversão segura da data do Firebase
        let dueDate: Date;
        if (restaurant.nextDueDate instanceof Timestamp) {
            dueDate = restaurant.nextDueDate.toDate();
        } else if (typeof restaurant.nextDueDate === 'string') {
            dueDate = new Date(restaurant.nextDueDate);
        } else {
             try {
                dueDate = new Date((restaurant.nextDueDate as any).seconds * 1000);
             } catch(e) { return; }
        }

        // Calcula atraso em dias
        const diffTime = now.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            console.log(`[Fiscal] Atraso detectado: ${diffDays} dias`);
            try {
                // Regra 1: Atraso entre 1 e 5 dias -> OVERDUE (Aviso)
                if (diffDays <= 5) {
                    if (restaurant.subscriptionStatus !== 'overdue') {
                        await updateDoc(doc(db, 'merchants', restaurant.id), { subscriptionStatus: 'overdue' });
                        window.location.reload();
                    }
                }
                // Regra 2: Atraso maior que 5 dias -> SUSPENDED (Bloqueio)
                else {
                    if (restaurant.subscriptionStatus !== 'suspended') {
                        await updateDoc(doc(db, 'merchants', restaurant.id), { subscriptionStatus: 'suspended' });
                        window.location.reload();
                    }
                }
            } catch (error) {
                console.error("Erro no Fiscal:", error);
            }
        }
    };

    checkValidity();
  }, [restaurant]);
};