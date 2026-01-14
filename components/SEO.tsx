import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = "Peça delivery online de forma rápida e prática!", 
  image, 
  url 
}) => {
  // Configura o título da aba do navegador
  const siteTitle = `${title} | Descoontaí`;
  
  // Imagem Padrão: Se a loja não tiver foto, usa essa genérica.
  // DICA: No futuro, troque esse link por um link da sua logo oficial hospedada.
  const metaImage = image || 'https://firebasestorage.googleapis.com/v0/b/descoontaiapp.appspot.com/o/app_icon.png?alt=media'; 
  
  const metaUrl = url || window.location.href;

  return (
    <Helmet>
      {/* 1. Título da Aba e Descrição Google */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />

      {/* 2. Configuração para WhatsApp / Facebook (Open Graph) */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={metaImage} />
      
      {/* Tenta forçar imagem grande no WhatsApp */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* 3. Configuração para Twitter (X) */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
};