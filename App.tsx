import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom'; // Adicionado para segurança
import { HomeScreen } from './features/Home/screens/HomeScreen';
import { RestaurantScreen } from './features/Restaurant/screens/RestaurantScreen';
import { CartDrawer } from './features/Checkout/components/CartDrawer';
import { LocationSelectorModal } from './features/Location/components/LocationSelectorModal';
import { BottomNavigation, NavTab } from './components/layout/BottomNavigation';
import { SearchScreen } from './features/Search/screens/SearchScreen';
import { SettingsScreen } from './features/Settings/screens/SettingsScreen';
import { MerchantRegistrationScreen } from './features/Merchant/screens/MerchantRegistrationScreen';
import { MerchantDashboardScreen } from './features/Merchant/screens/MerchantDashboardScreen';
import { AdminDashboardScreen } from './features/Admin/screens/AdminDashboardScreen';
import { LoginScreen } from './features/Auth/screens/LoginScreen'; 
import { FilterProvider } from './features/Home/context/FilterContext';
import { LocationProvider, useLocation } from './features/Location/context/LocationContext';
import { AppMessageOverlay } from './components/layout/AppMessageOverlay'; 
import { GlobalPromoOverlay } from './components/layout/GlobalPromoOverlay'; 
import { AuthProvider, useAuth } from './features/Auth/context/AuthContext';
import { PWAProvider } from './features/PWA/context/PWAContext'; 
import { InstallPWAOverlay } from './features/PWA/components/InstallPWAOverlay'; 
import { SplashScreen } from './components/layout/SplashScreen'; 
import { ShopsScreen } from './features/Shops/screens/ShopsScreen';
import { CartProvider } from './features/Restaurant/hooks/useCart'; // Importante: Adicionei o CartProvider
import { conditionalPromptForPush } from './features/Notifications/services/notificationService';

// Simple View State Management
type Screen = 'login_screen' | 'main_tabs' | 'restaurant_detail' | 'merchant_registration' | 'merchant_dashboard' | 'admin_dashboard';

const AppContent: React.FC = () => {
  const { user, userRole, isLoading: isAuthLoading, savedAddresses } = useAuth();
  const { location, setLocation, isLocationModalOpen } = useLocation();
  
  // Controle da Splash Screen
  const [showSplash, setShowSplash] = useState(true);

  // Estado inicial
  const [currentScreen, setCurrentScreen] = useState<Screen>('login_screen');
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  // Lógica de tempo mínimo da Splash Screen (3 segundos para completar a animação)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); 
    return () => clearTimeout(timer);
  }, []);

  // OneSignal & Install Strategy Logic
  useEffect(() => {
    const notificationTimer = setTimeout(() => {
       if (user && !showSplash) {
          conditionalPromptForPush();
       }
    }, 5000);

    return () => clearTimeout(notificationTimer);
  }, [user, showSplash]);

  // 1. SINCRONIZAÇÃO SILENCIOSA: Se o usuário logou e tem endereços no banco, carrega o primeiro.
  useEffect(() => {
    if (user && savedAddresses.length > 0 && !location) {
      setLocation(savedAddresses[0]);
    }
  }, [user, savedAddresses, location, setLocation]);

  // Auth & Routing Logic & DEEP LINKING
  useEffect(() => {
    if (!isAuthLoading) {
      if (user) {
        // --- USUÁRIO LOGADO (Firebase) ---
        const params = new URLSearchParams(window.location.search);
        const deepLinkStoreId = params.get('s');

        // Lógica de Redirecionamento baseada em Role
        if (userRole === 'merchant') {
            setCurrentScreen('merchant_dashboard');
        } else if (userRole === 'admin') {
            setCurrentScreen('admin_dashboard');
        } else {
            // Cliente normal
            if (deepLinkStoreId && currentScreen !== 'restaurant_detail') {
               setSelectedRestaurantId(deepLinkStoreId);
               setCurrentScreen('restaurant_detail');
            } else if (currentScreen === 'login_screen' && !deepLinkStoreId) {
               setCurrentScreen('main_tabs');
               setActiveTab('home'); 
            }
        }
        
      } else {
        // --- USUÁRIO DESLOGADO ---
        if (currentScreen !== 'merchant_registration') {
           setCurrentScreen('login_screen');
        }
      }
    }
  }, [user, userRole, isAuthLoading, currentScreen]);

  const handleRestaurantSelect = (id: string) => {
    setSelectedRestaurantId(id);
    setCurrentScreen('restaurant_detail');
  };

  const handleLoginSuccess = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('s')) return;

    if (!selectedRestaurantId) {
       setCurrentScreen('main_tabs');
       setActiveTab('home'); 
    }
  };

  // Se estiver carregando o Auth OU o tempo mínimo da splash não passou
  if (isAuthLoading || showSplash) {
    return <SplashScreen />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen onSelectRestaurant={handleRestaurantSelect} />;
      case 'search':
        return <SearchScreen onSelectRestaurant={handleRestaurantSelect} />;
      case 'shops':
        return (
          <FilterProvider>
             <ShopsScreen onSelectRestaurant={handleRestaurantSelect} />
          </FilterProvider>
        );
      case 'settings':
        return (
          <SettingsScreen 
            onNavigateToMerchantRegistration={() => setCurrentScreen('merchant_registration')}
            onNavigateToMerchantDashboard={() => setCurrentScreen('merchant_dashboard')}
            onNavigateToAdmin={() => setCurrentScreen('admin_dashboard')}
            onNavigateToLogin={() => setCurrentScreen('login_screen')}
          />
        );
      default:
        return <HomeScreen onSelectRestaurant={handleRestaurantSelect} />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden">
      
      {/* PWA Floating Notification */}
      {user && !isLocationModalOpen && currentScreen !== 'login_screen' && (
        <InstallPWAOverlay />
      )}

      {/* GLOBAL OVERLAYS */}
      <AppMessageOverlay /> 

      {/* Login Screen */}
      {currentScreen === 'login_screen' && (
        <div className="animate-in fade-in duration-300 z-50 absolute inset-0 bg-white">
          <LoginScreen 
            onBack={user ? () => setCurrentScreen('main_tabs') : undefined}
            onNavigateToMerchantRegistration={() => setCurrentScreen('merchant_registration')}
            onLoginSuccess={handleLoginSuccess}
          />
        </div>
      )}

      {/* Main Content Area */}
      {currentScreen === 'main_tabs' && user && (
        <div className="animate-in fade-in duration-300">
          {renderTabContent()}
          <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      )}
      
      {/* Detail Screens */}
      {currentScreen === 'restaurant_detail' && selectedRestaurantId && user && (
        <div className="animate-in slide-in-from-right duration-300">
          <RestaurantScreen 
            restaurantId={selectedRestaurantId} 
            onBack={() => {
              setCurrentScreen('main_tabs');
              setSelectedRestaurantId(null);
              const url = new URL(window.location.href);
              url.searchParams.delete('s');
              window.history.replaceState({}, '', url);
            }} 
          />
        </div>
      )}

      {/* Merchant Registration */}
      {currentScreen === 'merchant_registration' && (
        <div className="animate-in slide-in-from-bottom duration-300 z-50 bg-white absolute inset-0 overflow-y-auto">
          <MerchantRegistrationScreen 
            onBack={() => setCurrentScreen(user ? 'main_tabs' : 'login_screen')} 
            onSuccess={() => setCurrentScreen('merchant_dashboard')}
          />
        </div>
      )}

      {/* Merchant Dashboard */}
      {currentScreen === 'merchant_dashboard' && user && (
        <div className="animate-in fade-in duration-300 z-50 bg-gray-50 absolute inset-0 overflow-y-auto">
          <MerchantDashboardScreen onLogout={() => setCurrentScreen('login_screen')} />
        </div>
      )}

      {/* Admin Dashboard */}
      {currentScreen === 'admin_dashboard' && user && (
        <div className="animate-in fade-in duration-300 z-50 bg-gray-100 absolute inset-0 overflow-y-auto">
          <AdminDashboardScreen onBack={() => setCurrentScreen('main_tabs')} />
        </div>
      )}

      {/* User Overlays */}
      {user && (
        <>
          <CartDrawer />
          <LocationSelectorModal />
          <GlobalPromoOverlay /> 
        </>
      )}
    </div>
  );
};

// AQUI ESTAVA O ERRO NO BACKUP: FALTAVA A ESTRUTURA DE PROVEDORES
const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <LocationProvider>
          <FilterProvider>
            <CartProvider>
              <PWAProvider>
                <AppContent />
              </PWAProvider>
            </CartProvider>
          </FilterProvider>
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
