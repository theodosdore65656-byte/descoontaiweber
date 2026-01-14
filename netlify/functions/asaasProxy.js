// netlify/functions/asaasProxy.js

exports.handler = async function(event, context) {
  // 🔐 MUDANÇA 1: A chave vem do Cofre da Netlify (Variáveis de Ambiente)
  // Se você não configurar no painel da Netlify, isso vai dar erro.
  const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
  
  // 🏦 MUDANÇA 2: URL de Produção (Dinheiro Real)
  // Removemos o "sandbox" da URL
  const ASAAS_BASE_URL = "https://www.asaas.com/api/v3";

  // Configuração básica de CORS (Permite que seu site chame essa função)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
  };

  // Verifica se a chave existe antes de tentar pagar
  if (!ASAAS_API_KEY) {
    console.error("ERRO CRÍTICO: Chave ASAAS_API_KEY não encontrada nas variáveis da Netlify.");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Erro de configuração no servidor (Chave ausente)." })
    };
  }

  // Responde ao "pre-flight" do navegador
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    // 1. Descobre qual endpoint do Asaas o App quer chamar
    // Limpa os caminhos antigos para sobrar apenas o comando (ex: /payments)
    const path = event.path.replace("/api/asaas", "").replace("/.netlify/functions/asaasProxy", "");
    
    // 2. Prepara a chamada para o Asaas Real
    const url = `${ASAAS_BASE_URL}${path}`;
    
    const requestOptions = {
      method: event.httpMethod,
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY, // 🔑 O servidor insere a chave Real aqui!
        "User-Agent": "Descoontai-App-Prod"
      }
    };

    if (event.body) {
      requestOptions.body = event.body;
    }

    // 3. Chama o Asaas
    // console.log(`Proxying to Asaas PROD: ${url}`); // Descomente se precisar debugar, mas cuidado com logs em produção
    const response = await fetch(url, requestOptions);
    const data = await response.json();

    // 4. Devolve a resposta do Asaas para o seu App
    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error("Erro no Proxy:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Erro interno no servidor proxy." })
    };
  }
};