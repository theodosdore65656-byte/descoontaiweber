import React, { useState, useEffect, useRef } from 'react';
import { generatePixPayment, checkPixStatus } from '../services/subscriptionService';
import { Loader2, Copy, Check, QrCode } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface PixPaymentFormProps {
  restaurantId: string;
  onSuccess: () => void;
}

export const PixPaymentForm: React.FC<PixPaymentFormProps> = ({ restaurantId, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [pixData, setPixData] = useState<{payload: string, qrCodeImage: string, paymentId: string} | null>(null);
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<any>(null);

  // 1. Gera o Pix ao montar
  useEffect(() => {
    const loadPix = async () => {
        try {
            const data = await generatePixPayment(restaurantId);
            setPixData(data);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Erro ao gerar QR Code.");
        } finally {
            setLoading(false);
        }
    };
    loadPix();

    return () => stopPolling();
  }, [restaurantId]);

  // 2. Inicia Polling quando tivermos o ID do pagamento
  useEffect(() => {
    if (pixData?.paymentId) {
      startPolling(pixData.paymentId);
    }
  }, [pixData]);

  const startPolling = (paymentId: string) => {
    stopPolling(); // Garante que não tenha duplos
    intervalRef.current = setInterval(async () => {
       const paid = await checkPixStatus(paymentId, restaurantId);
       if (paid) {
         stopPolling();
         onSuccess();
       }
    }, 5000); // Checa a cada 5 segundos
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleCopy = () => {
    if (pixData) {
        navigator.clipboard.writeText(pixData.payload);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManualCheck = async () => {
      if (!pixData?.paymentId) return;

      setIsVerifying(true);
      const success = await checkPixStatus(pixData.paymentId, restaurantId);
      setIsVerifying(false);
      
      if (success) {
          onSuccess();
      } else {
          alert("Pagamento ainda não confirmado pelo banco. O sistema continua verificando automaticamente.");
      }
  };

  if (loading) {
      return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-600" size={32} /></div>;
  }

  if (error) {
      return <div className="text-red-500 text-center p-4 text-sm font-medium">{error}</div>;
  }

  if (!pixData) {
      return <div className="text-red-500 text-center p-4">Erro ao carregar dados.</div>;
  }

  return (
    <div className="flex flex-col items-center text-center space-y-6 pt-2">
       
       <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-200">
          <img src={pixData.qrCodeImage} alt="QR Code Pix" className="w-48 h-48 object-contain" />
       </div>

       <div className="w-full">
          <p className="text-sm text-gray-500 mb-2">Código Pix Copia e Cola:</p>
          <div className="flex gap-2">
             <input 
               readOnly 
               value={pixData.payload} 
               className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 text-xs text-gray-600 outline-none"
             />
             <button 
               onClick={handleCopy}
               className={`p-3 rounded-lg transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
             >
                {copied ? <Check size={20} /> : <Copy size={20} />}
             </button>
          </div>
       </div>

       <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-100 w-full animate-pulse">
          <p className="font-bold mb-1 flex items-center justify-center gap-2">
             <Loader2 size={16} className="animate-spin" /> Aguardando pagamento...
          </p>
          <p className="text-xs">
             Assim que você pagar no app do banco, esta tela atualizará automaticamente.
          </p>
       </div>

       <Button 
         fullWidth 
         size="lg" 
         onClick={handleManualCheck} 
         isLoading={isVerifying}
         className="bg-gray-100 text-gray-700 hover:bg-gray-200"
       >
          Já paguei (Verificar Agora)
       </Button>
    </div>
  );
};