
import React, { useState, useEffect } from 'react';
import { usePWA } from '../context/PWAContext';
import { X, Download, Gift, ChevronRight, AlertTriangle, Smartphone } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ManualInstallModal } from './ManualInstallModal';

export const InstallPWAOverlay: React.FC = () => {
  const { isInstalled, isInstallable, isIOS, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  
  // Estado para controlar se o usuário já instalou anteriormente (Memória Local)
  const [wasPreviouslyInstalled, setWasPreviouslyInstalled] = useState(false);

  useEffect(() => {
    // Verificação de Memória Local ao carregar
    const storedStatus = localStorage.getItem('pwa_installed_status');
    if (storedStatus === 'true') {
        setWasPreviouslyInstalled(true);
    }

    // 1. Se já está rodando como App (Standalone), NÃO mostra nada
    if (isInstalled) {
        setIsVisible(false);
        return;
    }
    
    // 2. Se está no navegador, mostra o banner (Standard ou Recuperação)
    const timer = setTimeout(() => {
        setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInstalled]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleInstallClick = () => {
    // MARCAÇÃO: Salva que o usuário tentou instalar
    localStorage.setItem('pwa_installed_status', 'true');
    setWasPreviouslyInstalled(true);

    if (isIOS) {
        // No iOS, abrimos o modal explicativo
        setShowManualModal(true);
    } else {
        // No Android/Desktop, tentamos o prompt nativo
        installApp().then((success) => {
            if (!success) {
                // Fallback se o prompt nativo falhar ou não estiver disponível
                setShowManualModal(true);
            } else {
                setIsVisible(false);
            }
        });
    }
  };

  const handleOpenAppClick = () => {
      // Tenta forçar a navegação para a raiz, o que em alguns Androids
      // dispara a intent para abrir o App se estiver instalado.
      window.location.href = window.location.origin;
      // Fecha o banner momentaneamente
      setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
        {/* BANNER FIXO DE RODAPÉ */}
        <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom-full duration-500 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
          
          {/* LÓGICA DE INTERFACE: RECUPERAÇÃO vs INSTALAÇÃO */}
          {wasPreviouslyInstalled ? (
              // --- VARIAÇÃO B: RECUPERAÇÃO (Usuário já instalou antes) ---
              <div className="bg-amber-50 border-t border-amber-200 p-4 md:px-6 safe-area-bottom">
                <button 
                    onClick={handleClose}
                    className="absolute top-2 right-2 p-2 text-amber-700/50 hover:text-amber-800 rounded-full transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-4 max-w-4xl mx-auto">
                    {/* Ícone e Texto de Alerta */}
                    <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 border border-amber-200 text-amber-600 animate-pulse">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-amber-900 text-sm leading-tight uppercase tracking-wide">
                                ⚠️ USE SEMPRE O APP!
                            </h3>
                            <p className="text-xs text-amber-800 mt-0.5 font-medium leading-snug">
                                O site é limitado. Tem ofertas secretas rolando lá no App que não aparecem aqui. <span className="underline font-bold">Abra agora!</span>
                            </p>
                        </div>
                    </div>
                    
                    {/* Botão de Ação: Tentar Abrir */}
                    <div className="w-full sm:w-auto">
                        <Button 
                            size="md" 
                            fullWidth 
                            onClick={handleOpenAppClick} 
                            className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 border border-amber-400"
                        >
                            <Smartphone size={18} />
                            Abrir App
                        </Button>
                    </div>
                </div>
              </div>
          ) : (
              // --- VARIAÇÃO A: INSTALAÇÃO PADRÃO (Novo Usuário) ---
              <div className="bg-white border-t border-gray-200 p-4 md:px-6 safe-area-bottom">
                <button 
                    onClick={handleClose}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-4 max-w-4xl mx-auto">
                    {/* Ícone e Texto */}
                    <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                        <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0 border border-brand-100 text-brand-600 animate-bounce-slow">
                            <Gift size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm leading-tight">
                                Baixe o App Oficial
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5 font-medium">
                                Instale o App para liberar <span className="text-brand-600 font-bold">promoções exclusivas que só existem no App.</span>
                            </p>
                        </div>
                    </div>
                    
                    {/* Botão de Ação */}
                    <div className="w-full sm:w-auto">
                        <Button 
                            size="md" 
                            fullWidth 
                            onClick={handleInstallClick} 
                            className="bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-200 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            Instalar Agora
                            {isIOS && <ChevronRight size={16} className="opacity-70" />}
                        </Button>
                    </div>
                </div>
              </div>
          )}
        </div>

        {/* MODAL DE INSTRUÇÕES (IOS / MANUAL) */}
        <ManualInstallModal 
            isOpen={showManualModal} 
            onClose={() => setShowManualModal(false)} 
            platform={isIOS ? 'ios' : 'android'} 
        />
    </>
  );
};
