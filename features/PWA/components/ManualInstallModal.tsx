
import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Share, MoreVertical, PlusSquare, Download, Smartphone, AlertCircle } from 'lucide-react';
import { usePWA } from '../context/PWAContext';

interface ManualInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'ios' | 'android';
}

export const ManualInstallModal: React.FC<ManualInstallModalProps> = ({ isOpen, onClose, platform }) => {
  const { installApp } = usePWA();
  const [showManualSteps, setShowManualSteps] = useState(false);
  const [isAttempting, setIsAttempting] = useState(false);

  // Reseta o estado sempre que o modal abre
  useEffect(() => {
    if (isOpen) {
        // No iOS sempre mostra manual direto. No Android tenta esconder primeiro.
        setShowManualSteps(platform === 'ios');
        setIsAttempting(false);
    }
  }, [isOpen, platform]);

  const handleAndroidAttempt = async () => {
    setIsAttempting(true);
    // Tenta disparar o prompt nativo novamente
    const success = await installApp();
    
    if (success) {
        onClose(); // Se abriu o prompt, fecha este modal
    } else {
        // Se falhou (browser não deixou), mostra o tutorial manual
        setShowManualSteps(true);
    }
    setIsAttempting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Instalar Aplicativo">
      <div className="space-y-6 pb-4 pt-2">
        <div className="text-center px-4">
            {/* ÍCONE DO APP EM DESTAQUE */}
            <div className="w-24 h-24 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg border border-gray-100 p-2 overflow-hidden">
                <img 
                    src="https://github.com/WeberDG/descoontai/blob/main/simbolo.png?raw=true" 
                    alt="App Icon" 
                    className="w-full h-full object-contain rounded-xl" 
                />
            </div>
            
            <p className="text-gray-900 font-bold text-lg mb-2">
                {platform === 'ios' ? 'Instalar no iPhone' : 'Instalar no Android'}
            </p>
            
            <p className="text-gray-500 text-sm leading-relaxed">
                {platform === 'ios' 
                    ? "Para ter a melhor experiência e promoções exclusivas, adicione à sua tela inicial:"
                    : "Tenha acesso rápido e ofertas exclusivas instalando o App oficial."}
            </p>
        </div>

        {/* ÁREA ANDROID: BOTÃO DE AÇÃO RÁPIDA */}
        {platform === 'android' && !showManualSteps && (
            <div className="px-1 animate-in fade-in slide-in-from-bottom-4">
                <Button 
                    fullWidth 
                    size="lg" 
                    onClick={handleAndroidAttempt} 
                    isLoading={isAttempting}
                    className="bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-200 mb-3"
                >
                    <Download className="mr-2" size={20} />
                    Instalar Automaticamente
                </Button>
                <p className="text-xs text-gray-400 text-center">
                    Tocando acima, o navegador tentará iniciar a instalação.
                </p>
            </div>
        )}

        {/* ÁREA DE PASSOS MANUAIS (Fallback Android ou Padrão iOS) */}
        {showManualSteps && (
            <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-100 mx-1 animate-in fade-in slide-in-from-bottom-2">
              
              {/* Aviso extra para Android se a tentativa falhou */}
              {platform === 'android' && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded mb-2 border border-amber-100">
                      <AlertCircle size={14} />
                      <span>Instalação automática bloqueada. Siga abaixo:</span>
                  </div>
              )}

              {platform === 'ios' ? (
                <>
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0 mt-1"><Share size={20} /></div>
                    <div className="text-sm text-gray-700">
                        <p className="font-bold text-gray-900 mb-0.5">Passo 1</p>
                        Toque no botão <strong>Compartilhar</strong> na barra inferior do Safari.
                    </div>
                  </div>
                  <div className="w-full h-px bg-gray-200/70" />
                  <div className="flex items-start gap-4">
                    <div className="bg-gray-200 p-2 rounded-lg text-gray-600 shrink-0 mt-1"><PlusSquare size={20} /></div>
                    <div className="text-sm text-gray-700">
                        <p className="font-bold text-gray-900 mb-0.5">Passo 2</p>
                        Role o menu para cima e selecione <strong>Adicionar à Tela de Início</strong>.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-4">
                    <div className="bg-gray-200 p-2 rounded-lg text-gray-600 shrink-0 mt-1"><MoreVertical size={20} /></div>
                    <div className="text-sm text-gray-700">
                        <p className="font-bold text-gray-900 mb-0.5">Passo 1</p>
                        Toque no menu (3 pontinhos) no canto superior direito do seu navegador.
                    </div>
                  </div>
                  <div className="w-full h-px bg-gray-200/70" />
                  <div className="flex items-start gap-4">
                    <div className="bg-brand-100 p-2 rounded-lg text-brand-600 shrink-0 mt-1"><Download size={20} /></div>
                    <div className="text-sm text-gray-700">
                        <p className="font-bold text-gray-900 mb-0.5">Passo 2</p>
                        Selecione a opção <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.
                    </div>
                  </div>
                </>
              )}
            </div>
        )}

        {/* Footer */}
        <div className="flex justify-center">
            <button 
                onClick={onClose} 
                className="text-sm text-gray-400 font-medium hover:text-gray-600 underline"
            >
                {showManualSteps ? 'Entendi, vou fazer isso.' : 'Agora não'}
            </button>
        </div>
      </div>
    </Modal>
  );
};
