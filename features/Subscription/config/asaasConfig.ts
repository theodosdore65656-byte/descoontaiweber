// CONFIGURAÇÃO SEGURA DO ASAAS 🔒

// Mantemos apontando para o Proxy.
// O Proxy vai ler a variável de ambiente, então aqui fica seguro.
export const ASAAS_BASE_URL = '/.netlify/functions/asaasProxy'; 

// DEIXE VAZIO! A chave real está na Netlify, o Proxy vai injetar ela.
export const ASAAS_API_KEY = ''; 

export const ASAAS_HEADERS = {
  'Content-Type': 'application/json',
};

export const SUBSCRIPTION_VALUE = 49.90;
export const IS_SANDBOX = false; // Produção!