import { db } from '../../../lib/firebase';
import { doc, runTransaction, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Restaurant, Review } from '../../../types';

export const submitReview = async (
  restaurantId: string, 
  ratings: { product: number; delivery: number; service: number },
  userName?: string
) => {
  try {
    const restaurantRef = doc(db, 'merchants', restaurantId);

    await runTransaction(db, async (transaction) => {
      const restaurantDoc = await transaction.get(restaurantRef);
      if (!restaurantDoc.exists()) throw new Error("Restaurante não encontrado");

      const data = restaurantDoc.data() as Restaurant;
      
      // Dados atuais (ou inicializa se não existir)
      const currentBreakdown = data.ratingBreakdown || {
        product: 0,
        delivery: 0,
        service: 0,
        count: 0
      };

      const count = currentBreakdown.count;
      const newCount = count + 1;

      // Calcular novas médias (Média Cumulativa)
      // Nova Média = ((Média Atual * Count) + Nova Nota) / (Count + 1)
      const newProductAvg = ((currentBreakdown.product * count) + ratings.product) / newCount;
      const newDeliveryAvg = ((currentBreakdown.delivery * count) + ratings.delivery) / newCount;
      const newServiceAvg = ((currentBreakdown.service * count) + ratings.service) / newCount;

      // Média Geral (para compatibilidade)
      const generalAvg = (newProductAvg + newDeliveryAvg + newServiceAvg) / 3;

      // 1. Atualizar o Restaurante
      transaction.update(restaurantRef, {
        rating: Number(generalAvg.toFixed(1)),
        ratingBreakdown: {
          product: Number(newProductAvg.toFixed(1)),
          delivery: Number(newDeliveryAvg.toFixed(1)),
          service: Number(newServiceAvg.toFixed(1)),
          count: newCount
        }
      });

      // 2. Criar o documento de Review na subcoleção (ou coleção raiz 'reviews')
      // Usaremos coleção raiz para facilitar queries globais se precisar
      const reviewRef = doc(collection(db, 'reviews'));
      const newReview: any = {
        restaurantId,
        userName: userName || 'Anônimo',
        ratings,
        createdAt: serverTimestamp()
      };
      
      transaction.set(reviewRef, newReview);
    });

    return true;
  } catch (error) {
    console.error("Erro ao enviar avaliação:", error);
    throw error;
  }
};