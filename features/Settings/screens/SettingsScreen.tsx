import React, { useState, useEffect } from 'react';
import { User, Bell, MapPin, HelpCircle, LogOut, ChevronRight, Store, LayoutDashboard, Loader2, ShieldCheck, ShoppingBag, Download, Check, BellRing, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../Auth/context/AuthContext';
import { UserProfileModal } from '../components/UserProfileModal';
import { AddressManagerModal } from '../components/AddressManagerModal';
import { TermsModal } from '../components/TermsModal';
import { BannerSlider } from '../../../components/ui/BannerSlider'; 
import { usePWA } from '../../PWA/context/PWAContext'; 
import { ManualInstallModal } from '../../PWA/components/ManualInstallModal'; 
import { isUserSubscribed, promptForPush } from '../../Notifications/services/notificationService';

interface SettingsScreenProps {
  onNavigateToMerchantRegistration?: () => void;
  onNavigateToMerchantDashboard?: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToLogin?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  onNavigateToMerchantRegistration,
  onNavigateToMerchantDashboard,
  onNavigateToAdmin,
  onNavigateToLogin
}) => {
  // 1. ADICIONEI O 'refreshUser' AQUI NA LISTA 👇
  const { user, userRole, isLoading: isAuthLoading, logout, refreshUser } = useAuth();
  const { isInstallable, isInstalled, installApp, isIOS, supportsPWA } = usePWA();
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [installPlatform, setInstallPlatform] = useState<'ios' | 'android'>('android');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
     checkSubscription();
     window.OneSignalDeferred = window.OneSignalDeferred || [];
     window.OneSignalDeferred.push((OneSignal: any) => {
        OneSignal.User.PushSubscription.addEventListener("change", checkSubscription);
     });

     const onFocus = () => {
        checkSubscription();
     };
     window.addEventListener('focus', onFocus);

     return () => {
        window.removeEventListener('focus', onFocus);
     };
  }, []);

  const checkSubscription = async () => {
    const status = await isUserSubscribed();
    setIsSubscribed(status);
  };

  const handleMyDataClick = () => {
    if (user) setShowProfileModal(true);
  };

  const handleAddressClick = () => {
    if (user) setShowAddressModal(true);
  };

  const handleNotificationClick = async () => {
    if (Notification.permission === 'denied') {
        alert("As notificações estão bloqueadas no seu navegador.\n\nPara ativar, acesse as configurações do site no seu navegador e permita as notificações.");
        return;
    }

    if (isSubscribed) {
       alert("As notificações já estão ativadas! 🎉\nVocê receberá ofertas em tempo real.");
    } else {
       await promptForPush();
       setTimeout(checkSubscription, 1000);
    }
  };

  const handleInstallClick = async () => {
    if (isIOS) {
        setInstallPlatform('ios');
        setShowInstallModal(true);
        return;
    } 
    const success = await installApp();
    if (!success) {
        setInstallPlatform('android');
        setShowInstallModal(true);
    }
  };

  const getNotificationLabel = () => {
     return isSubscribed ? 'Notificações Ativadas' : 'Ativar Notificações';
  };

  const getNotificationIconColor = () => {
     return isSubscribed ? 'text-green-600' : 'text-gray-600';
  };

  const getMenuItems = () => {
    const items = [];

    if (userRole === 'merchant') {
       items.push(
         { 
           icon: isSubscribed ? BellRing : Bell, 
           label: getNotificationLabel(), 
           action: handleNotificationClick,
           iconColor: getNotificationIconColor()
         },
         { icon: HelpCircle, label: 'Ajuda', action: () => {} },
         { icon: FileText, label: 'Termos de Uso', action: () => setShowTermsModal(true) }
       );
    } else {
       items.push({ 
        icon: User, 
        label: 'Meus Dados', 
        action: handleMyDataClick,
      });

      items.push({ 
        icon: MapPin, 
        label: 'Endereços', 
        action: handleAddressClick,
      });

      items.push(
        { 
           icon: isSubscribed ? BellRing : Bell, 
           label: getNotificationLabel(), 
           action: handleNotificationClick,
           iconColor: getNotificationIconColor()
        },
        { icon: HelpCircle, label: 'Ajuda', action: () => {} },
        { icon: FileText, label: 'Termos de Uso', action: () => setShowTermsModal(true) }
      );
    }

    return items;
  };

  const menuItems = getMenuItems();

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-brand-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-100 flex items-center space-x-4">
        
        {/* ÁREA DA FOTO DO PERFIL AJUSTADA */}
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 overflow-hidden shadow-inner border border-gray-100">
          {userRole === 'merchant' ? (
             <div className="bg-brand-600 w-full h-full flex items-center justify-center text-white">
                <Store size={32} />
             </div>
          ) : (
             user ? (
               /* Se o usuário tem fotoURL, exibe a imagem. Senão, exibe iniciais. */
               user.photoURL ? (
                 <img 
                   key={user.photoURL} 
                   src={user.photoURL} 
                   alt="Perfil" 
                   className="w-full h-full object-cover animate-in fade-in duration-500" 
                 />
               ) : (
                 <div className="bg-brand-100 text-brand-600 w-full h-full flex items-center justify-center font-bold text-2xl uppercase">
                   {user.displayName?.charAt(0) || user.email?.charAt(0)}
                 </div>
               )
             ) : (
               <User size={32} />
             )
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {user ? (user.displayName || user.email?.split('@')[0]) : 'Usuário'}
          </h1>
          <p className="text-sm text-gray-500 truncate">
            {userRole === 'merchant' ? 'Conta Parceiro' : userRole === 'admin' ? 'Super Admin' : 'Conta Pessoal'}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {userRole === 'merchant' && (
          <div 
            onClick={onNavigateToMerchantDashboard}
            className="bg-gray-900 p-5 rounded-xl shadow-lg border border-gray-700 text-white relative overflow-hidden group cursor-pointer"
          >
             <div className="relative z-10 flex justify-between items-center">
               <div>
                  <div className="bg-brand-600 w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2">Área do Parceiro</div>
                  <h3 className="font-bold text-xl mb-1 flex items-center gap-2">
                     Meu Painel
                  </h3>
                  <p className="text-gray-400 text-xs max-w-[200px]">Gerencie produtos, horários e veja suas métricas.</p>
               </div>
               <div className="bg-white/10 p-3 rounded-full group-hover:bg-brand-600 transition-colors">
                 <LayoutDashboard className="text-white" size={24} />
               </div>
             </div>
             <div className="absolute -right-6 -bottom-8 w-32 h-32 bg-brand-600/20 rounded-full blur-2xl"></div>
          </div>
        )}

        {userRole === 'admin' && (
           <button 
             onClick={onNavigateToAdmin}
             className="w-full bg-black text-white p-5 rounded-xl shadow-lg flex items-center justify-between group hover:bg-gray-900 transition-all mb-4"
           >
              <div className="flex items-center gap-3">
                 <ShieldCheck className="text-green-400" size={24} />
                 <div className="text-left">
                    <h3 className="font-bold">Painel do Administrador</h3>
                    <p className="text-xs text-gray-400">Gerenciar App e Parceiros</p>
                 </div>
              </div>
              <ChevronRight className="text-gray-500 group-hover:text-white" />
           </button>
        )}

        {userRole !== 'merchant' && userRole !== 'admin' && (
           <div className="w-full h-32">
              <BannerSlider location="settings" aspectRatio="h-32" />
           </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {menuItems.map((item, index) => (
            <button 
              key={index}
              onClick={item.action}
              className={`w-full flex items-center justify-between p-4 transition-colors border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer`}
            >
              <div className="flex items-center space-x-3 text-gray-700">
                <item.icon size={20} className={item.iconColor || 'text-gray-600'} />
                <span className={`font-medium ${item.iconColor === 'text-green-600' ? 'text-green-700' : ''}`}>{item.label}</span>
              </div>
              {item.label === 'Notificações Ativadas' ? (
                 <Check size={16} className="text-green-600" />
              ) : (
                 <ChevronRight size={16} className="text-gray-300" />
              )}
            </button>
          ))}
          
          {supportsPWA && (
            <button 
                onClick={!isInstalled ? handleInstallClick : undefined}
                disabled={isInstalled}
                className={`w-full flex items-center justify-between p-4 transition-colors border-t border-gray-100
                    ${isInstalled ? 'bg-green-50 cursor-default' : 'bg-brand-50 hover:bg-brand-100 cursor-pointer'}
                `}
            >
                <div className="flex items-center space-x-3">
                    {isInstalled ? <Check size={20} className="text-green-600" /> : <Download size={20} className="text-brand-600" />}
                    <div className="text-left">
                        <span className={`font-medium ${isInstalled ? 'text-green-800' : 'text-brand-700'}`}>
                            {isInstalled ? 'App Instalado' : 'Instalar App'}
                        </span>
                        {!isInstalled && <p className="text-[10px] text-brand-600/70">Acesso rápido e offline</p>}
                    </div>
                </div>
                {!isInstalled && <ChevronRight size={16} className="text-brand-300" />}
            </button>
          )}
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 p-4 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
        >
          <LogOut size={20} />
          <span>Sair do App</span>
        </button>

        <div className="text-center pt-4 text-xs text-gray-400">
          <p>Versão 1.3.0 (PWA)</p>
          <p>Descoontaí © 2026</p>
        </div>
      </div>

      {/* 2. ATUALIZEI O ONCLOSE AQUI EMBAIXO 👇 */}
      <UserProfileModal 
        isOpen={showProfileModal} 
        onClose={() => {
           setShowProfileModal(false);
           if(refreshUser) refreshUser(); // Força a atualização da foto
        }} 
      />
      <AddressManagerModal isOpen={showAddressModal} onClose={() => setShowAddressModal(false)} />
      <ManualInstallModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} platform={installPlatform} />
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />

    </div>
  );
};