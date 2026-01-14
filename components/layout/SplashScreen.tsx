
import React, { useEffect, useState } from 'react';

export const SplashScreen: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Cronograma da animação
    const timer1 = setTimeout(() => setStep(1), 100);   // Entra o Símbolo
    const timer2 = setTimeout(() => setStep(2), 2000);  // Transforma em Logo (início da transição)
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-[#D90F20] flex items-center justify-center overflow-hidden">
      <style>{`
        @keyframes pop-in {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(10deg); opacity: 1; }
          80% { transform: scale(0.9); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes spin-out {
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }
        @keyframes zoom-in-logo {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .animate-pop-in {
          animation: pop-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-spin-out {
          animation: spin-out 0.6s ease-in-out forwards;
        }
        .animate-zoom-in-logo {
          animation: zoom-in-logo 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      <div className="relative flex items-center justify-center w-full h-full">
        
        {/* FASE 1: SÍMBOLO (Entra, flutua, depois sai girando) */}
        <div className={`
            absolute inset-0 flex items-center justify-center transition-all
            ${step === 1 ? 'opacity-100' : step === 2 ? 'opacity-0 pointer-events-none' : 'opacity-0'}
        `}>
           <img 
             src="https://github.com/WeberDG/descoontai/blob/main/simbolosemfundo.png?raw=true" 
             className={`
               w-32 h-32 object-contain drop-shadow-2xl
               ${step === 1 ? 'animate-pop-in' : ''} 
               ${step === 2 ? 'animate-spin-out' : ''}
             `}
             style={step === 1 ? { animation: 'pop-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, float 3s ease-in-out infinite 0.8s' } : {}}
             alt="Símbolo"
           />
        </div>

        {/* FASE 2: LOGOTIPO COMPLETO (Entra com zoom quando o símbolo some) */}
        <div className={`
            absolute inset-0 flex items-center justify-center transition-all
            ${step === 2 ? 'opacity-100' : 'opacity-0'}
        `}>
           <img 
             src="https://github.com/WeberDG/descoontai/blob/main/logosemfundo.png?raw=true" 
             className={`
               w-64 h-auto object-contain drop-shadow-2xl
               ${step === 2 ? 'animate-zoom-in-logo' : ''}
             `}
             alt="Descoontaí"
           />
        </div>

      </div>
    </div>
  );
};
