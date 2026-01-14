/**
 * Utilitário de Compressão de Imagem
 * Reduz o tamanho do arquivo mantendo qualidade visual para web/app.
 */

export const compressImage = async (file: File | Blob, quality = 0.7, maxWidth = 1200): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // 1. Calcular novas dimensões (Mantendo proporção)
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        // 2. Criar Canvas para desenhar a imagem redimensionada
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error("Erro ao criar contexto de canvas"));
            return;
        }

        // Desenha a imagem no tamanho novo
        ctx.drawImage(img, 0, 0, width, height);

        // 3. Exportar como JPEG comprimido
        ctx.canvas.toBlob(
          (blob) => {
            if (!blob) {
                reject(new Error("Erro ao comprimir imagem"));
                return;
            }
            // Cria um novo arquivo com o blob comprimido
            const newFile = new File([blob], "compressed_image.jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          'image/jpeg',
          quality // 0.7 = 70% de qualidade (Excelente balanço)
        );
      };
      
      img.onerror = (err) => reject(err);
    };
    
    reader.onerror = (err) => reject(err);
  });
};