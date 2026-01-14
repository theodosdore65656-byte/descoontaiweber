
// CONFIGURAÇÃO DO ONESIGNAL
export const ONESIGNAL_APP_ID = "dcc77ccf-4bfd-4830-81fd-033fa309210e";

// ATENÇÃO: Para o Painel de Admin enviar notificações, você precisa da REST API Key.
// Pegue ela em: OneSignal Dashboard -> Settings -> Keys & IDs -> REST API Key
export const ONESIGNAL_REST_API_KEY_DEFAULT = "SUA_REST_API_KEY_AQUI"; 

/**
 * Inicializa o OneSignal
 */
export const initOneSignal = () => {
  // Verificação de segurança para evitar erro de domínio
  const hostname = window.location.hostname;
  
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        safari_web_id: "web.onesignal.auto.simulated",
        notifyButton: {
          enable: false, // Usamos botão próprio
        },
        allowLocalhostAsSecureOrigin: true,
      });
      console.log("OneSignal Initialized");
    } catch (error) {
      console.warn("OneSignal Init Failed (Check Domain Allowlist):", error);
    }
  });
};

/**
 * Retorna se o usuário está inscrito (Opted In)
 */
export const isUserSubscribed = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      // Verifica permissão nativa E status de inscrição no OneSignal
      const permission = Notification.permission === 'granted';
      // Verificação segura caso OneSignal não tenha inicializado corretamente
      const optedIn = OneSignal.User?.PushSubscription?.optedIn || false;
      resolve(permission && optedIn);
    });
  });
};

/**
 * Solicita permissão e inscrição (Forçado - via clique de botão)
 */
export const promptForPush = async () => {
  return new Promise<void>((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      // Força o aparecimento do Slidedown mesmo se o usuário já tiver dispensado antes
      await OneSignal.Slidedown.promptPush({ force: true });
      resolve();
    });
  });
};

/**
 * ESTRATÉGIA "INSTALL FIRST":
 * Só pede notificação automaticamente SE o app já estiver instalado (Standalone).
 * Se estiver no navegador, não pede nada para deixar o banner de instalação brilhar.
 */
export const conditionalPromptForPush = async () => {
  // Verifica se é Standalone (Instalado)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

  if (isStandalone) {
    console.log("App está instalado (Standalone). Verificando notificações...");
    
    // Verifica se já está inscrito para não incomodar
    const subscribed = await isUserSubscribed();
    if (!subscribed) {
       // Se instalado mas sem notificação, pede!
       // Usamos promptPush sem force, respeitando o backoff natural do OneSignal
       window.OneSignalDeferred = window.OneSignalDeferred || [];
       window.OneSignalDeferred.push(async (OneSignal: any) => {
          await OneSignal.Slidedown.promptPush();
       });
    }
  } else {
    console.log("App rodando no navegador. Notificações automáticas pausadas para priorizar instalação.");
  }
};

/**
 * Helper para obter a chave (Código ou LocalStorage)
 */
const getRestApiKey = () => {
  // 1. Tenta pegar do código hardcoded
  if (ONESIGNAL_REST_API_KEY_DEFAULT !== "SUA_REST_API_KEY_AQUI") {
    return ONESIGNAL_REST_API_KEY_DEFAULT;
  }
  // 2. Tenta pegar do LocalStorage (caso o usuário tenha inserido via prompt)
  const stored = localStorage.getItem('onesignal_rest_key');
  return stored || null;
};

/**
 * Envia notificação via API REST do OneSignal (Lado do Admin)
 */
export const sendAdminNotification = async (title: string, message: string) => {
  const apiKey = getRestApiKey();

  if (!apiKey) {
      const e: any = new Error("REST API Key não configurada.");
      e.code = "MISSING_KEY";
      throw e;
  }

  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${apiKey}`
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      included_segments: ['Total Subscriptions'], // Envia para TODOS
      headings: { en: title },
      contents: { en: message },
      url: window.location.origin // Abre o app ao clicar
    })
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', options);
    const data = await response.json();
    
    if (data.errors) {
      throw new Error(JSON.stringify(data.errors));
    }
    
    return data;
  } catch (err) {
    console.error('Erro ao enviar notificação OneSignal:', err);
    throw err;
  }
};
