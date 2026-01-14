
import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { StarRating } from '../../../components/ui/StarRating';
import { ShoppingBag, Truck, MessageCircle, CheckCircle2, Loader2, Heart } from 'lucide-react';
import { submitReview } from '../services/reviewService';
import { useAuth } from '../../Auth/context/AuthContext';

interface OrderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmit?: () => void; // NOVO PROP: Ação ao finalizar com sucesso
  restaurantId: string;
  restaurantName: string;
}

export const OrderReviewModal: React.FC<OrderReviewModalProps> = ({ 
  isOpen, 
  onClose, 
  onReviewSubmit,
  restaurantId, 
  restaurantName 
}) => {
  const { user } = useAuth();
  
  const [ratings, setRatings] = useState({
    product: 0,
    delivery: 0,
    service: 0
  });

  const [step, setStep] = useState<'rating' | 'success'>('rating');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (ratings.product === 0 || ratings.delivery === 0 || ratings.service === 0) {
      alert("Por favor, selecione uma nota para todos os critérios.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReview(restaurantId, ratings, user?.displayName || 'Cliente');
      setStep('success');
      
      // Fecha automaticamente após 3 segundos de sucesso
      setTimeout(() => {
        if (onReviewSubmit) {
          onReviewSubmit(); // Chama a função que limpa e fecha tudo
        } else {
          onClose(); // Fallback
        }
        
        // Reseta estado após fechar
        setTimeout(() => {
          setStep('rating');
          setRatings({ product: 0, delivery: 0, service: 0 });
        }, 500);
      }, 2500);

    } catch (error) {
      alert("Erro ao enviar avaliação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingRow = ({ 
    label, 
    icon: Icon, 
    value, 
    field 
  }: { 
    label: string, 
    icon: any, 
    value: number, 
    field: 'product' | 'delivery' | 'service' 
  }) => (
    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm text-brand-600">
          <Icon size={16} />
        </div>
        <span className="font-semibold text-gray-700 text-sm">{label}</span>
      </div>
      <div className="flex justify-center py-1">
        <StarRating 
          rating={value} 
          size={32} 
          interactive={true} 
          onChange={(val) => setRatings(prev => ({ ...prev, [field]: val }))}
        />
      </div>
      <p className="text-center text-xs font-bold text-gray-500 mt-1 h-4">
        {value > 0 ? value.toFixed(1) : '-'}
      </p>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={step === 'rating' ? "Avalie seu Pedido" : ""}>
      
      {step === 'success' ? (
        <div className="flex flex-col items-center justify-center py-8 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 shadow-lg shadow-green-200">
             <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Obrigado!</h2>
          <p className="text-gray-500 text-center max-w-xs">
            Sua avaliação ajuda <strong>{restaurantName}</strong> a melhorar cada vez mais.
          </p>
          <div className="mt-6 animate-pulse">
            <Heart size={24} className="text-red-500 fill-red-500" />
          </div>
        </div>
      ) : (
        <div className="space-y-6 pb-2">
          <div className="text-center px-4">
             <p className="text-sm text-gray-600">
               Como foi sua experiência com <strong>{restaurantName}</strong>?
             </p>
          </div>

          <div className="space-y-3">
             <RatingRow 
               label="Item / Produto" 
               icon={ShoppingBag} 
               value={ratings.product} 
               field="product"
             />
             <RatingRow 
               label="Entrega" 
               icon={Truck} 
               value={ratings.delivery} 
               field="delivery"
             />
             <RatingRow 
               label="Atendimento" 
               icon={MessageCircle} 
               value={ratings.service} 
               field="service"
             />
          </div>

          <div className="pt-2">
            <Button fullWidth onClick={handleSubmit} isLoading={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
            <button 
              onClick={onClose} 
              className="w-full text-center text-gray-400 text-sm mt-3 hover:text-gray-600 font-medium"
            >
              Avaliar depois
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
