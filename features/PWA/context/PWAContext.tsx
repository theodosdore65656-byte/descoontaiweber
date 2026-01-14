
import React, { createContext, useContext, useState, useEffect } from 'react';

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  installApp: () => Promise<boolean>;
  supportsPWA: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [supportsPWA, setSupportsPWA] = useState(true);

  useEffect(() => {
    // 1. Detectar iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // 2. Verificar se já está instalado (Standalone mode)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsInstalled(isInStandaloneMode);

    // 3. Capturar evento de instalação nativa (Android/Desktop)
    const handler = (e: Event) => {
      // Impede o mini-infobar padrão do Chrome (queremos controlar quando aparece)
      e.preventDefault();
      console.log('PWA: Evento beforeinstallprompt capturado!');
      // Salva o evento para disparar quando o usuário clicar no botão
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detecta quando o app foi instalado com sucesso
    window.addEventListener('appinstalled', () => {
      console.log('PWA: App instalado com sucesso');
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    // Lógica para Android / Desktop (Chrome/Edge)
    if (deferredPrompt) {
      try {
        // Dispara o prompt nativo que foi capturado
        await deferredPrompt.prompt();
        
        // Espera a escolha do usuário
        const choiceResult = await deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA: Usuário aceitou a instalação');
        } else {
          console.log('PWA: Usuário recusou a instalação');
        }
        
        // O evento não pode ser usado duas vezes
        setDeferredPrompt(null);
        return true; // Sucesso ao abrir o prompt
      } catch (error) {
        console.error("PWA: Erro ao tentar instalar", error);
        return false;
      }
    } else {
        // Fallback: Se o botão for clicado mas o evento não estiver pronto
        console.log('PWA: Instalação automática não disponível no momento.');
        return false; // Falha (deve acionar instrução manual)
    }
  };

  // No Android, isInstallable é true SÓ se tivermos o evento nativo capturado.
  // No iOS, isInstallable é true sempre que não estiver instalado, pois a "instalação" é manual.
  const isInstallable = isIOS ? !isInstalled : !!deferredPrompt;

  return (
    <PWAContext.Provider value={{ isInstallable, isInstalled, isIOS, installApp, supportsPWA }}>
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};
