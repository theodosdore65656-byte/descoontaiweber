import { doc, setDoc, updateDoc, increment, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

/**
 * SERVIÇO DE INTEGRAÇÃO DE ANALYTICS (DIÁRIO)
 * Grava dados dia a dia para permitir filtros de data.
 */

const getTodayStr = () => new Date().toISOString().split('T')[0]; // "2026-01-12"

// 1. Registrar Visita na Loja (Entrou na tela do restaurante)
export const logStoreVisit = async (merchantId: string) => {
  if (!merchantId) return;
  const today = getTodayStr();
  const ref = doc(db, `merchants/${merchantId}/analytics/${today}`);

  try {
    // Tenta atualizar incrementando
    await updateDoc(ref, {
      visits: increment(1)
    });
  } catch (e) {
    // Se o documento do dia não existe, cria ele
    await setDoc(ref, {
      date: today,
      visits: 1,
      productClicks: 0,
      whatsappClicks: 0,
      products: {} // Mapa de produtos
    }, { merge: true });
  }
};

// 2. Registrar Clique no Produto (Abriu o modal)
export const logProductClick = async (merchantId: string, productId: string, productName: string) => {
  if (!merchantId || !productId) return;
  const today = getTodayStr();
  const ref = doc(db, `merchants/${merchantId}/analytics/${today}`);

  try {
    await updateDoc(ref, {
      productClicks: increment(1),
      [`products.${productId}.name`]: productName, // Salva nome para exibir
      [`products.${productId}.clicks`]: increment(1)
    });
  } catch (e) {
    await setDoc(ref, {
      date: today,
      visits: 0,
      productClicks: 1,
      whatsappClicks: 0,
      products: {
          [productId]: { name: productName, clicks: 1, whatsapp: 0 }
      }
    }, { merge: true });
  }
};

// 3. Registrar Clique no WhatsApp (Tentativa de Compra)
export const logWhatsappClick = async (merchantId: string, productId: string) => {
  if (!merchantId || !productId) return;
  const today = getTodayStr();
  const ref = doc(db, `merchants/${merchantId}/analytics/${today}`);

  try {
    await updateDoc(ref, {
      whatsappClicks: increment(1),
      [`products.${productId}.whatsapp`]: increment(1)
    });
  } catch (e) {
    // Fallback se criar direto no clique do whats (raro)
    await setDoc(ref, {
      date: today,
      visits: 0,
      productClicks: 0,
      whatsappClicks: 1,
      products: {
          [productId]: { whatsapp: 1 }
      }
    }, { merge: true });
  }
};

// 4. BUSCAR DADOS (Para o Gráfico)
export const fetchAnalyticsData = async (merchantId: string, daysAgo: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysAgo);

    // Formata strings YYYY-MM-DD para query
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const q = query(
        collection(db, `merchants/${merchantId}/analytics`),
        where('date', '>=', startStr),
        where('date', '<=', endStr)
    );

    const snapshot = await getDocs(q);
    
    // Agregador de Dados
    let totalVisits = 0;
    let totalProductClicks = 0;
    let totalWhatsapp = 0;
    const productStats: Record<string, any> = {};

    snapshot.forEach(doc => {
        const data = doc.data();
        totalVisits += (data.visits || 0);
        totalProductClicks += (data.productClicks || 0);
        totalWhatsapp += (data.whatsappClicks || 0);

        // Agrega produtos
        if (data.products) {
            Object.entries(data.products).forEach(([pid, stats]: [string, any]) => {
                if (!productStats[pid]) {
                    productStats[pid] = { name: stats.name || 'Produto', clicks: 0, whatsapp: 0 };
                }
                productStats[pid].clicks += (stats.clicks || 0);
                productStats[pid].whatsapp += (stats.whatsapp || 0);
            });
        }
    });

    // Converte mapa de produtos para array ordenado
    const rankedProducts = Object.entries(productStats)
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => b.clicks - a.clicks);

    return {
        totalVisits,
        totalProductClicks,
        totalWhatsapp,
        rankedProducts
    };
};