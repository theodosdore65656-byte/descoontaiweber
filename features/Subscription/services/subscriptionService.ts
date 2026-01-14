import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { ASAAS_BASE_URL, SUBSCRIPTION_VALUE, ASAAS_HEADERS } from '../config/asaasConfig';

/**
 * SERVIÇO DE PAGAMENTO HÍBRIDO (MANUAL OU ASSINATURA)
 * Usa o Proxy do Netlify para segurança.
 */

interface CardHolderData {
  number: string;
  holder: string;
  expiry: string;
  cvv: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  postalCode: string;
  addressNumber: string;
}

// Helper para chamadas API via Proxy
const apiCall = async (endpoint: string, method: string, body?: any) => {
    const response = await fetch(`${ASAAS_BASE_URL}${endpoint}`, {
        method,
        headers: ASAAS_HEADERS,
        body: body ? JSON.stringify(body) : undefined
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.errors?.[0]?.description || data.error || "Erro na comunicação com Asaas");
    }
    return data;
};

// Cálculo de Data Inteligente (Acumula dias se já tiver pago)
const calculateNewDueDate = async (restaurantId: string): Promise<Date> => {
    const docRef = doc(db, 'merchants', restaurantId);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    
    const now = new Date();
    let baseDate = now;

    if (data?.nextDueDate) {
        let currentDue: Date;
        if (data.nextDueDate instanceof Timestamp) {
            currentDue = data.nextDueDate.toDate();
        } else if (typeof data.nextDueDate === 'string') {
            currentDue = new Date(data.nextDueDate);
        } else if ((data.nextDueDate as any).seconds) {
            currentDue = new Date((data.nextDueDate as any).seconds * 1000);
        } else {
            currentDue = now;
        }

        if (currentDue > now) {
            baseDate = currentDue;
        }
    }

    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + 30);
    return newDate;
};

// 1. Busca ou Cria Cliente
export const getOrCreateAsaasCustomer = async (restaurantId: string, tempData?: any): Promise<string> => {
  try {
    const docRef = doc(db, 'merchants', restaurantId);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    
    if (data?.asaasCustomerId) return data.asaasCustomerId;

    const rawCpf = tempData?.cpfCnpj || data?.cpfCnpj || "00000000000";
    const payload = {
      name: tempData?.name || data?.name,
      email: tempData?.email || data?.email || "financeiro@descoontai.com",
      cpfCnpj: rawCpf.replace(/\D/g, ''),
      mobilePhone: (tempData?.phone || data?.whatsappNumber || "").replace(/\D/g, ''),
      externalReference: restaurantId,
      notificationDisabled: true,
    };

    const json = await apiCall('/customers', 'POST', payload);
    
    if (json.id) {
      await updateDoc(docRef, { asaasCustomerId: json.id });
      return json.id;
    }
    throw new Error("Falha ao criar cliente Asaas.");
  } catch (error: any) {
    console.error(error);
    throw new Error(error.message || "Erro ao cadastrar cliente.");
  }
};

// 2. PIX (Sempre Manual)
export const generatePixPayment = async (restaurantId: string) => {
  try {
    const customerId = await getOrCreateAsaasCustomer(restaurantId);
    
    const payload = {
      customer: customerId,
      billingType: "PIX",
      value: SUBSCRIPTION_VALUE,
      dueDate: new Date().toISOString().split('T')[0],
      description: "Mensalidade App (PIX)",
      externalReference: `pix_${restaurantId}_${Date.now()}`
    };

    const charge = await apiCall('/payments', 'POST', payload);
    const qrCode = await apiCall(`/payments/${charge.id}/pixQrCode`, 'GET');

    return {
      success: true,
      payload: qrCode.payload,
      qrCodeImage: `data:image/png;base64,${qrCode.encodedImage}`,
      paymentId: charge.id
    };
  } catch (error: any) {
    throw error;
  }
};

// 3. CARTÃO (Manual OU Assinatura)
export const processCreditCardPayment = async (
    restaurantId: string, 
    cardData: CardHolderData,
    isRecurrent: boolean // NOVA OPÇÃO
) => {
  try {
    const customerId = await getOrCreateAsaasCustomer(restaurantId, {
      name: cardData.holder,
      email: cardData.email,
      cpfCnpj: cardData.cpfCnpj,
      phone: cardData.phone
    });

    const [expMonth, expYear] = cardData.expiry.split('/');
    
    const commonCreditCardInfo = {
        holderName: cardData.holder,
        number: cardData.number.replace(/\s/g, ''),
        expiryMonth: expMonth,
        expiryYear: expYear.length === 2 ? `20${expYear}` : expYear,
        ccv: cardData.cvv
    };
    
    const commonHolderInfo = {
        name: cardData.holder,
        email: cardData.email,
        cpfCnpj: cardData.cpfCnpj.replace(/\D/g, ''),
        postalCode: cardData.postalCode.replace(/\D/g, ''),
        addressNumber: cardData.addressNumber || "0",
        phone: cardData.phone.replace(/\D/g, '')
    };

    let resultId = "";

    if (isRecurrent) {
        // --- CRIA ASSINATURA (RECORRENTE) ---
        const subPayload = {
            customer: customerId,
            billingType: "CREDIT_CARD",
            value: SUBSCRIPTION_VALUE,
            nextDueDate: new Date().toISOString().split('T')[0], // Começa hoje
            cycle: "MONTHLY",
            description: "Assinatura Descoontaí PRO",
            externalReference: `sub_${restaurantId}`,
            creditCard: commonCreditCardInfo,
            creditCardHolderInfo: commonHolderInfo
        };
        
        const subJson = await apiCall('/subscriptions', 'POST', subPayload);
        resultId = subJson.id;
    } else {
        // --- CRIA PAGAMENTO ÚNICO (MANUAL) ---
        const payPayload = {
            customer: customerId,
            billingType: "CREDIT_CARD",
            value: SUBSCRIPTION_VALUE,
            dueDate: new Date().toISOString().split('T')[0],
            description: "Mensalidade Avulsa",
            creditCard: commonCreditCardInfo,
            creditCardHolderInfo: commonHolderInfo
        };

        const payJson = await apiCall('/payments', 'POST', payPayload);
        resultId = payJson.id;
    }

    // Atualiza Firebase
    const newDueDate = await calculateNewDueDate(restaurantId);
    await updateDoc(doc(db, 'merchants', restaurantId), {
        subscriptionStatus: 'active',
        nextDueDate: newDueDate,
        subscriptionPaymentMethod: 'CREDIT_CARD',
        isRecurrent: isRecurrent, // Salva se é assinatura
        lastPaymentId: resultId
    });

    return { success: true, paymentId: resultId };

  } catch (error: any) {
    throw error;
  }
};

// 4. Checa Status
export const checkPixStatus = async (paymentId: string, restaurantId: string) => {
    try {
        const json = await apiCall(`/payments/${paymentId}`, 'GET');
        if (json.status === 'RECEIVED' || json.status === 'CONFIRMED') {
            const newDueDate = await calculateNewDueDate(restaurantId);
            await updateDoc(doc(db, 'merchants', restaurantId), {
                subscriptionStatus: 'active',
                nextDueDate: newDueDate,
                subscriptionPaymentMethod: 'PIX'
            });
            return true;
        }
        return false;
    } catch (e) { return false; }
};