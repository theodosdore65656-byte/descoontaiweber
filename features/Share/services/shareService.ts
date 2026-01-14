
import { Restaurant } from '../../../types';

/**
 * Gera o link direto para o estabelecimento.
 * Usa a query string 's' (store) para identificar a loja.
 * Prioriza o slug se disponível, caso contrário usa o ID.
 */
export const generateStoreLink = (restaurantIdentifier: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/?s=${restaurantIdentifier}`;
};

/**
 * Tenta usar o compartilhamento nativo do dispositivo (Mobile).
 * Se não suportado, copia para a área de transferência.
 */
export const shareStoreLink = async (restaurant: Restaurant): Promise<boolean> => {
  // Usa o slug preferencialmente, fallback para o ID
  const identifier = restaurant.slug || restaurant.id;
  const url = generateStoreLink(identifier);
  const text = `Peça agora no ${restaurant.name} pelo app Descoontaí!`;

  // 1. Tentar API Nativa de Compartilhamento (Mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title: restaurant.name,
        text: text,
        url: url,
      });
      return true;
    } catch (error) {
      console.warn('Erro ao compartilhar ou cancelado pelo usuário', error);
      // Se der erro ou usuário cancelar, não faz fallback para clipboard
      // pois geralmente o usuário cancelou intencionalmente.
      return false;
    }
  }

  // 2. Fallback: Copiar para Área de Transferência (Desktop)
  try {
    await navigator.clipboard.writeText(url);
    alert('Link da loja copiado para a área de transferência!');
    return true;
  } catch (err) {
    console.error('Falha ao copiar link', err);
    prompt('Copie o link abaixo:', url); // Fallback final
    return false;
  }
};

/**
 * Apenas copia o link para o clipboard (Para uso no painel do merchant)
 */
export const copyStoreLinkToClipboard = async (restaurantIdentifier: string): Promise<void> => {
  const url = generateStoreLink(restaurantIdentifier);
  try {
    await navigator.clipboard.writeText(url);
  } catch (err) {
    // Fallback antigo para browsers legacy
    const textArea = document.createElement("textarea");
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
};
