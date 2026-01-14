
import React, { useState } from 'react';
import { 
  ShieldCheck, LogOut, ArrowLeft, Users, BarChart3, 
  AlertTriangle, Settings, Menu, ImageIcon, Megaphone, Bell
} from 'lucide-react';
import { useAuth } from '../../Auth/context/AuthContext';
import { MerchantApprovalTab } from '../components/MerchantApprovalTab';
import { GlobalAnalyticsTab } from '../components/GlobalAnalyticsTab';
import { AppMessagesTab } from '../components/AppMessagesTab';
import { AdBannersTab } from '../components/AdBannersTab';
import { NoticesPromosTab } from '../components/NoticesPromosTab';
import { NotificationsTab } from '../components/NotificationsTab'; // NOVO IMPORT

interface AdminDashboardScreenProps {
  onBack: () => void;
}

type AdminTab = 'merchants' | 'analytics' | 'messages' | 'banners' | 'promos' | 'notifications';

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onBack }) => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('merchants');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="bg-brand-600 p-1.5 rounded-lg"><ShieldCheck size={20} /></div>
             <div>
               <h1 className="font-bold text-lg leading-none">Admin</h1>
               <p className="text-xs text-gray-400">Descoontaí</p>
             </div>
           </div>
           <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400"><ArrowLeft /></button>
        </div>

        <nav className="p-4 space-y-2">
          <button 
            onClick={() => { setActiveTab('merchants'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'merchants' ? 'bg-brand-600 text-white font-bold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Users size={20} /> Parceiros & Aprovação
          </button>
          
          <button 
            onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'analytics' ? 'bg-brand-600 text-white font-bold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <BarChart3 size={20} /> Estatísticas Globais
          </button>

          <button 
            onClick={() => { setActiveTab('notifications'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'notifications' ? 'bg-brand-600 text-white font-bold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Bell size={20} /> Notificações (Push)
          </button>

          <button 
            onClick={() => { setActiveTab('promos'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'promos' ? 'bg-brand-600 text-white font-bold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Megaphone size={20} /> Avisos & Promos
          </button>

          <button 
            onClick={() => { setActiveTab('banners'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'banners' ? 'bg-brand-600 text-white font-bold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <ImageIcon size={20} /> Banners Publicidade
          </button>

          <button 
            onClick={() => { setActiveTab('messages'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'messages' ? 'bg-brand-600 text-white font-bold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <AlertTriangle size={20} /> Sistema & Force Update
          </button>
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
           <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-sm">
                 AD
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium truncate">{user?.email}</p>
                 <p className="text-xs text-green-400">Online</p>
              </div>
           </div>
           <button 
             onClick={logout}
             className="w-full flex items-center gap-2 justify-center p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-sm"
           >
             <LogOut size={16} /> Sair do Painel
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative">
        {/* Mobile Header */}
        <div className="md:hidden bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
           <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-600"><Menu /></button>
             <h2 className="font-bold text-gray-800">
               {activeTab === 'merchants' && 'Aprovação de Parceiros'}
               {activeTab === 'analytics' && 'Estatísticas'}
               {activeTab === 'messages' && 'Sistema & Msgs'}
               {activeTab === 'banners' && 'Publicidade (Banners)'}
               {activeTab === 'promos' && 'Avisos de Marketing'}
               {activeTab === 'notifications' && 'Push Notifications'}
             </h2>
           </div>
        </div>

        <div className="p-4 md:p-8 max-w-6xl mx-auto">
           {activeTab === 'merchants' && <MerchantApprovalTab />}
           {activeTab === 'analytics' && <GlobalAnalyticsTab />}
           {activeTab === 'messages' && <AppMessagesTab />}
           {activeTab === 'banners' && <AdBannersTab />}
           {activeTab === 'promos' && <NoticesPromosTab />}
           {activeTab === 'notifications' && <NotificationsTab />}
        </div>
      </main>

    </div>
  );
};
