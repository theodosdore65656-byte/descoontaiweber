
import React from 'react';
import { X } from 'lucide-react';
import { PromoIconType } from '../../types';

interface PromoModalProps {
  title: string;
  message: string;
  icon: PromoIconType;
  primaryButtonText: string;
  secondaryButtonText?: string;
  onPrimaryClick: () => void;
  onSecondaryClick?: () => void;
  onClose: () => void;
  previewMode?: boolean; // Se true, não usa fixed/z-index global
}

// Mapas de Imagens 3D (URLs corrigidas e estáveis)
const ICONS_3D: Record<PromoIconType, string> = {
  love: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Hearts.png',
  // URL do Gift atualizada para uma fonte estável (Activities folder ou CDN alternativo)
  gift: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Wrapped%20Gift.png',
  star: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Star.png',
  rocket: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png',
  check: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Check%20Mark%20Button.png',
  warning_3d: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Warning.png'
};

export const PromoModal: React.FC<PromoModalProps> = ({
  title,
  message,
  icon,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryClick,
  onSecondaryClick,
  onClose,
  previewMode = false
}) => {
  
  // Fallback para ícone se a URL falhar (opcional, mas boa prática)
  const iconSrc = ICONS_3D[icon] || ICONS_3D['love'];

  const content = (
    <div className={`bg-white rounded-[32px] w-full max-w-sm p-6 relative shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300 ${previewMode ? '' : 'mx-4'}`}>
      
      {/* Close Button (Easy to find) */}
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-20"
        aria-label="Fechar"
      >
        <X size={24} />
      </button>

      {/* 3D Icon Area */}
      <div className="mb-4 mt-2 h-24 w-24 flex items-center justify-center pointer-events-none select-none">
         <img 
           src={iconSrc} 
           alt="Icon" 
           className="w-full h-full object-contain drop-shadow-lg"
           onError={(e) => {
             // Fallback visual silencioso se a imagem quebrar
             (e.target as HTMLImageElement).style.opacity = '0.5';
           }}
         />
      </div>

      {/* Content */}
      <h2 className="text-xl font-extrabold text-brand-600 mb-3 leading-tight">
        {title}
      </h2>
      
      <p className="text-gray-500 mb-8 leading-relaxed text-sm">
        {message}
      </p>

      {/* Buttons */}
      <div className="w-full space-y-3">
        <button
          onClick={(e) => { e.stopPropagation(); onPrimaryClick(); }}
          className="w-full bg-brand-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-brand-200 hover:bg-brand-700 active:scale-[0.98] transition-all"
        >
          {primaryButtonText}
        </button>

        {secondaryButtonText && (
          <button
            onClick={(e) => { e.stopPropagation(); onSecondaryClick ? onSecondaryClick() : onClose(); }}
            className="w-full text-brand-600 font-bold py-2 rounded-xl hover:bg-brand-50 transition-colors text-sm"
          >
            {secondaryButtonText}
          </button>
        )}
      </div>
    </div>
  );

  if (previewMode) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      {content}
    </div>
  );
};
