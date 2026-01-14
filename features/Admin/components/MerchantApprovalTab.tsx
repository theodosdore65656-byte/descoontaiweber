import React, { useEffect, useState } from 'react';
import { Restaurant } from '../../../types';
import { 
  Loader2, Check, X, Shield, ShieldAlert, MapPin, 
  Search, Store, AlertTriangle, Wallet, Gift 
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { AdminSubscriptionManager } from './AdminSubscriptionManager'; // Importa o novo componente

// Firebase
import { collection, getDocs, doc, updateDoc, query } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase'; 

type TabStatus = 'pending' | 'active' | 'rejected';

export const MerchantApprovalTab: React.FC = () => {
  const [merchants, setMerchants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeTab, setActiveTab] = useState<TabStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal de Gratuidade
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [selectedMerchantForGift, setSelectedMerchantForGift] = useState<{id: string, name: string} | null>(null);
  
  // Estados de Processamento e Erro
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Load Data from Firestore
  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    setLoading(true);
    setActionError(null);
    try {
        const q = query(collection(db, 'merchants'));
        const snapshot = await getDocs(q);
        const data: Restaurant[] = [];
        snapshot.forEach((doc) => {
            const m = doc.data() as Restaurant;
            data.push({ ...m, id: doc.id });
        });
        setMerchants(data);
    } catch (error: any) {
        console.error("Erro ao buscar lojas:", error);
        setActionError(`Erro ao carregar lista: ${error.message}`);
    } finally {
        setLoading(false);
    }
  };

  // --- Actions ---

  const handleApprove = async (merchant: Restaurant) => {
    if (merchant.subscriptionStatus !== 'active' && merchant.subscriptionStatus !== 'trial') {
        const confirm = window.confirm(`ATENÇÃO: Este estabelecimento NÃO PAGOU.\nDeseja aprovar mesmo assim?`);
        if (!confirm) return;
    }

    if (!auth.currentUser) {
        setActionError("Você parece estar desconectado.");
        return;
    }

    setProcessingId(merchant.id);
    setActionError(null); 
    await updateMerchantStatus(merchant.id, true);
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    setActionError(null);
    await updateMerchantStatus(id, false);
    setProcessingId(null);
  };

  const updateMerchantStatus = async (id: string, newApprovalStatus: boolean) => {
    try {
        const docRef = doc(db, 'merchants', id);
        const updateData: any = { isApproved: newApprovalStatus };

        if (!newApprovalStatus) {
            updateData.subscriptionStatus = 'suspended';
        }

        await updateDoc(docRef, updateData);

        setMerchants(prev => prev.map(m => m.id === id ? { 
            ...m, 
            isApproved: newApprovalStatus,
            subscriptionStatus: !newApprovalStatus ? 'suspended' : m.subscriptionStatus
        } : m));
        
    } catch (e: any) {
        console.error("ERRO NO UPDATE:", e);
        setActionError(`Erro ao salvar: ${e.message}`);
    }
  };

  // Abre o modal de presente
  const openGiftModal = (m: Restaurant) => {
      setSelectedMerchantForGift({ id: m.id, name: m.name });
      setGiftModalOpen(true);
  };

  // --- Helper: Status Financeiro Badge ---
  const renderFinanceBadge = (m: Restaurant) => {
     const status = m.subscriptionStatus || 'pending';
     
     // Verifica se é VIP (Data muito longe, ex: > 2090)
     let isVip = false;
     if (m.nextDueDate) {
         try {
             // Lógica segura para ler data
             let date;
             if ((m.nextDueDate as any).toDate) date = (m.nextDueDate as any).toDate();
             else if ((m.nextDueDate as any).seconds) date = new Date((m.nextDueDate as any).seconds * 1000);
             else date = new Date(m.nextDueDate as any);
             
             if (date.getFullYear() > 2090) isVip = true;
         } catch(e) {}
     }

     if (isVip) {
         return (
             <div className="flex flex-col items-end">
                <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                   <Gift size={10} /> VIP (GRÁTIS)
                </span>
             </div>
         );
     }
     
     switch(status) {
        case 'active':
           return (
             <div className="flex flex-col items-end">
                <span className="bg-green-100 text-green-800 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                   <Check size={10} strokeWidth={3} /> PAGO
                </span>
             </div>
           );
        case 'trial':
            return (
              <div className="flex flex-col items-end">
                 <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded">
                    EM TESTE
                 </span>
              </div>
            );
        case 'suspended':
        case 'overdue':
             return (
               <div className="flex flex-col items-end">
                  <span className="bg-red-100 text-red-800 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                     <AlertTriangle size={10} /> INADIMPLENTE
                  </span>
               </div>
             );
        default:
             return (
               <div className="flex flex-col items-end">
                  <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                     <Wallet size={10} /> AGUARDANDO
                  </span>
               </div>
             );
     }
  };

  const filteredMerchants = merchants.filter(m => {
    let statusMatch = false;
    if (activeTab === 'pending') statusMatch = !m.isApproved;
    if (activeTab === 'active') statusMatch = !!m.isApproved;
    const searchMatch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (m.whatsappNumber && m.whatsappNumber.includes(searchQuery));
    return statusMatch && searchMatch;
  });

  const pendingCount = merchants.filter(m => !m.isApproved).length;
  const activeCount = merchants.filter(m => m.isApproved).length;

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
         <div>
            <h2 className="text-xl font-bold text-gray-800">Parceiros & Aprovação</h2>
            <p className="text-sm text-gray-500">Gerencie quem pode vender no aplicativo.</p>
         </div>
         
         <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
            />
         </div>
      </div>

      {/* ERROR BOX */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2">
            <AlertTriangle className="text-red-600 shrink-0 mt-0.5" />
            <div>
                <h4 className="font-bold text-red-800 text-sm">Falha na Ação</h4>
                <p className="text-sm text-red-700 mt-1">{actionError}</p>
            </div>
            <button onClick={() => setActionError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={18} /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto no-scrollbar">
         <button 
           onClick={() => setActiveTab('pending')}
           className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'pending' ? 'border-yellow-500 text-yellow-700 bg-yellow-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
         >
           <ShieldAlert size={16} /> Pendentes <span className="bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded-full text-[10px]">{pendingCount}</span>
         </button>

         <button 
           onClick={() => setActiveTab('active')}
           className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'active' ? 'border-green-600 text-green-700 bg-green-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
         >
           <Shield size={16} /> Ativos <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-[10px]">{activeCount}</span>
         </button>
      </div>

      {/* List Content */}
      <div className="space-y-3 min-h-[300px]">
        {filteredMerchants.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed">
            <Store size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Nenhum parceiro encontrado.</p>
          </div>
        ) : (
          filteredMerchants.map(m => (
            <div key={m.id} className={`bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center transition-all ${!m.isApproved ? 'border-l-4 border-l-yellow-400' : 'border-l-4 border-l-green-500'}`}>
               
               {/* Image & Basic Info */}
               <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                    <img src={m.image} className="w-full h-full object-cover" alt={m.name} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                       {m.name}
                       {m.isVip && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">VIP</span>}
                    </h4>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin size={12} /> {m.addressNeighborhood || 'Bairro N/A'}
                    </p>
                  </div>
               </div>

               {/* FINANCE STATUS BADGE */}
               <div className="md:px-6 py-2 md:py-0 w-full md:w-auto flex justify-start md:justify-end border-t md:border-t-0 border-dashed border-gray-200 mt-2 md:mt-0">
                  {renderFinanceBadge(m)}
               </div>

               {/* Actions */}
               <div className="flex gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 mt-2 md:mt-0 flex-wrap">
                  
                  {/* BOTÃO DE PRESENTE (GRATUIDADE) */}
                  <Button 
                    size="sm"
                    variant="secondary"
                    className="bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-100"
                    onClick={() => openGiftModal(m)}
                    title="Dar gratuidade/VIP"
                  >
                     <Gift size={16} />
                  </Button>

                  {!m.isApproved ? (
                    <>
                      <Button 
                        size="sm"
                        variant={m.subscriptionStatus === 'active' ? 'primary' : 'outline'}
                        className={`flex-1 md:flex-none shadow-md ${m.subscriptionStatus === 'active' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`} 
                        onClick={() => handleApprove(m)}
                        disabled={processingId === m.id}
                      >
                        {processingId === m.id ? <Loader2 className="animate-spin" size={16} /> : <><Check size={16} className="mr-1" /> Aprovar</>}
                      </Button>
                      
                      <Button 
                        size="sm"
                        variant="outline" 
                        className="text-red-600 hover:bg-red-50" 
                        onClick={() => handleReject(m.id)}
                        disabled={processingId === m.id}
                      >
                         <X size={16} />
                      </Button>
                    </>
                  ) : (
                    <Button 
                      size="sm"
                      variant="outline" 
                      className="border-red-200 text-red-600 hover:bg-red-50" 
                      onClick={() => handleReject(m.id)}
                      disabled={processingId === m.id}
                    >
                       <X size={16} className="mr-1" /> Suspender
                    </Button>
                  )}
               </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE GRATUIDADE */}
      {selectedMerchantForGift && (
         <AdminSubscriptionManager 
            isOpen={giftModalOpen}
            onClose={() => setGiftModalOpen(false)}
            merchantId={selectedMerchantForGift.id}
            merchantName={selectedMerchantForGift.name}
            onSuccess={loadMerchants} // Recarrega a lista após dar o presente
         />
      )}

    </div>
  );
};