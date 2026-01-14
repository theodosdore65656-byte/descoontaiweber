
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Store, LogOut, Loader2, Plus, Edit2, Trash2, LayoutGrid, Truck, BarChart3, UserCog, Layers, Headphones, Clock, AlertTriangle, Wallet } from 'lucide-react';
import { Product, Restaurant, MenuSection, AddonGroup } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { MerchantProductForm } from '../components/MerchantProductForm';
import { MerchantDeliverySettings } from '../components/MerchantDeliverySettings';
import { MerchantAnalyticsScreen } from './MerchantAnalyticsScreen';
import { MerchantProfileSettings } from '../components/MerchantProfileSettings';
import { MerchantGroupManager } from '../components/MerchantGroupManager';
import { MerchantSupportTab } from '../components/MerchantSupportTab';
import { MerchantSubscriptionScreen } from '../../Subscription/screens/MerchantSubscriptionScreen'; // NOVO IMPORT
import { useAuth } from '../../Auth/context/AuthContext';

// Firebase
import { doc, onSnapshot, updateDoc, collection, addDoc, deleteDoc, query, where, getDocs, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';

interface MerchantDashboardScreenProps {
  onLogout: () => void;
}

// ADICIONADO 'finance'
type MerchantTab = 'menu' | 'delivery' | 'analytics' | 'profile' | 'support' | 'finance';

export const MerchantDashboardScreen: React.FC<MerchantDashboardScreenProps> = ({ onLogout }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<MerchantTab>('menu');
  
  // Data State
  const [restaurantData, setRestaurantData] = useState<Restaurant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  
  // UI State
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [showGroupsManager, setShowGroupsManager] = useState(false); 
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modals de Exclusão
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null); 
  const [isDeleting, setIsDeleting] = useState(false);

  // Status calculado em tempo real para o Header
  const [realTimeStatus, setRealTimeStatus] = useState<{isOpen: boolean, label: string}>({ isOpen: false, label: 'Carregando...' });

  // 1. Realtime Listeners for Merchant Data & Products
  useEffect(() => {
    if (!user) return;

    setIsLoading(true);

    // A. Listen to Merchant Document
    const unsubMerchant = onSnapshot(doc(db, 'merchants', user.uid), (doc) => {
       if (doc.exists()) {
         setRestaurantData(doc.data() as Restaurant);
       } else {
         setRestaurantData(null);
       }
       setIsLoading(false);
    }, (error) => {
       console.error("Erro ao buscar loja:", error);
       setIsLoading(false);
    });

    // B. Listen to Products Collection (Query by restaurantId)
    const q = query(collection(db, 'products'), where('restaurantId', '==', user.uid));
    const unsubProducts = onSnapshot(q, (snapshot) => {
       const prods: Product[] = [];
       snapshot.forEach((doc) => {
          prods.push({ ...doc.data(), id: doc.id } as Product);
       });
       setProducts(prods);
    });

    return () => {
      unsubMerchant();
      unsubProducts();
    };
  }, [user]);

  // Lógica para calcular o status real (Header)
  useEffect(() => {
    if (!restaurantData) return;

    const calculateStatus = () => {
        // CHECK SUSPENSÃO: Se estiver suspenso, força o status fechado
        if (restaurantData.subscriptionStatus === 'suspended') {
            setRealTimeStatus({ isOpen: false, label: 'BLOQUEADO (Pagamento)' });
            return;
        }

        // 1. Se o switch manual estiver desligado
        if (!restaurantData.isOpen) {
            setRealTimeStatus({ isOpen: false, label: 'Modo Invisível (Oculto)' });
            return;
        }

        // 2. Se não tiver horários, assume aberto pelo switch
        if (!restaurantData.schedule) {
            setRealTimeStatus({ isOpen: true, label: 'Aberto agora' });
            return;
        }

        const now = new Date();
        const dayIndex = now.getDay(); 
        const keysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const currentKey = keysMap[dayIndex];
        const todaySchedule = restaurantData.schedule[currentKey];

        if (!todaySchedule || !todaySchedule.isOpen) {
            setRealTimeStatus({ isOpen: false, label: 'Fechado hoje' });
            return;
        }

        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [openH, openM] = todaySchedule.open.split(':').map(Number);
        const [closeH, closeM] = todaySchedule.close.split(':').map(Number);
        
        const openTime = openH * 60 + openM;
        let closeTime = closeH * 60 + closeM;

        if (closeTime < openTime) closeTime += 24 * 60;

        if (currentMinutes >= openTime && currentMinutes <= closeTime) {
            setRealTimeStatus({ isOpen: true, label: `Aberto até ${todaySchedule.close}` });
        } else {
            if (currentMinutes < openTime) {
                setRealTimeStatus({ isOpen: false, label: `Fechado (Abre às ${todaySchedule.open})` });
            } else {
                setRealTimeStatus({ isOpen: false, label: 'Fechado por hoje' });
            }
        }
    };

    calculateStatus();
    // Atualiza a cada minuto
    const interval = setInterval(calculateStatus, 60000);
    return () => clearInterval(interval);

  }, [restaurantData]);

  // --- Helpers ---

  // CHECK SUSPENSÃO
  const isSuspended = restaurantData?.subscriptionStatus === 'suspended';

  const checkPermission = (): boolean => {
      if (isSuspended) {
          alert("Sua conta está suspensa por falta de pagamento. Regularize na aba Financeiro para continuar editando.");
          setActiveTab('finance');
          return false;
      }
      return true;
  };

  const uploadImage = async (imageInput: string | File, pathPrefix: string = 'products'): Promise<string> => {
      if (typeof imageInput === 'string' && imageInput.startsWith('http')) {
          return imageInput;
      }
      if (typeof imageInput === 'string' && imageInput.startsWith('blob:')) {
          const response = await fetch(imageInput);
          const blob = await response.blob();
          const storageRef = ref(storage, `${pathPrefix}/${user?.uid}/${Date.now()}.jpg`);
          await uploadBytes(storageRef, blob);
          return await getDownloadURL(storageRef);
      }
      return 'https://via.placeholder.com/300';
  };

  const recalculatePromoStatus = async (userId: string) => {
    try {
        const q = query(collection(db, 'products'), where('restaurantId', '==', userId));
        const snapshot = await getDocs(q);
        
        let hasActivePromo = false;
        snapshot.forEach((doc) => {
            const p = doc.data() as Product;
            if (p.isActive !== false && p.originalPrice && p.originalPrice > p.price) {
                hasActivePromo = true;
            }
        });
        await updateDoc(doc(db, 'merchants', userId), { hasActivePromo: hasActivePromo });
    } catch (e) {
        console.error("Erro ao recalcular status de promoção:", e);
    }
  };

  const handleUpdateGroups = async (newGroups: AddonGroup[]) => {
    if(!checkPermission() || !user) return; // BLOQUEIO
    try {
      await updateDoc(doc(db, 'merchants', user.uid), {
        addonGroups: newGroups
      });
    } catch(e) {
      console.error("Erro ao atualizar grupos", e);
      alert('Erro ao salvar grupos.');
    }
  };

  const handleSaveProduct = async (productData: any) => {
    if (!checkPermission() || !restaurantData || !user) return; // BLOQUEIO
    setIsSaving(true);

    try {
        let finalSectionId = productData.sectionId;
        let updatedRestaurant = { ...restaurantData };

        if (finalSectionId && finalSectionId.startsWith('NEW:::')) {
            const newSectionName = finalSectionId.replace('NEW:::', '');
            const newSection: MenuSection = {
                id: 'sec_' + Math.random().toString(36).substr(2, 9),
                name: newSectionName,
                order: (updatedRestaurant.menuSections?.length || 0) + 1
            };
            const newSections = [...(updatedRestaurant.menuSections || []), newSection];
            await updateDoc(doc(db, 'merchants', user.uid), {
                menuSections: newSections
            });
            finalSectionId = newSection.id;
        }

        const imageUrl = await uploadImage(productData.image, 'products');

        const payload = {
            ...productData,
            image: imageUrl,
            sectionId: finalSectionId,
            restaurantId: user.uid,
            price: Number(productData.price),
            originalPrice: productData.originalPrice ? Number(productData.originalPrice) : null
        };

        if (selectedProduct) {
            await updateDoc(doc(db, 'products', selectedProduct.id), payload);
            alert('Produto atualizado!');
        } else {
            await addDoc(collection(db, 'products'), payload);
            alert('Produto criado com sucesso!');
        }

        await recalculatePromoStatus(user.uid);
        setIsEditingProduct(false);
        setSelectedProduct(null);

    } catch (error) {
        console.error("Erro ao salvar produto:", error);
        alert('Erro ao salvar produto. Tente novamente.');
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    if(checkPermission()) setProductToDelete(product);
  };

  const confirmDeleteProduct = async () => {
    if (!user || !productToDelete) return;
    setIsDeleting(true);
    try {
        await deleteDoc(doc(db, 'products', productToDelete.id));
        await recalculatePromoStatus(user.uid);
        setProductToDelete(null); 
    } catch (e) {
        console.error(e);
        alert('Erro ao excluir. Verifique sua conexão.');
    } finally {
        setIsDeleting(false);
    }
  };

  const handleDeleteSection = (sectionId: string) => {
    if(checkPermission()) setSectionToDelete(sectionId);
  };

  const confirmDeleteSection = async () => {
    if (!sectionToDelete || !restaurantData || !user) return;
    const sectionId = sectionToDelete;
    const sectionProducts = products.filter(p => p.sectionId === sectionId);
    
    setIsDeleting(true);
    try {
        if (sectionProducts.length > 0) {
           const deletePromises = sectionProducts.map(p => deleteDoc(doc(db, 'products', p.id)));
           await Promise.all(deletePromises);
        }
        const updatedSections = restaurantData.menuSections.filter(s => s.id !== sectionId);
        await updateDoc(doc(db, 'merchants', user.uid), {
            menuSections: updatedSections
        });
        setSectionToDelete(null);
        setIsEditingProduct(false);
        setSelectedProduct(null);
        if (sectionProducts.length > 0) {
           recalculatePromoStatus(user.uid);
        }
    } catch (error) {
        console.error("Erro ao excluir seção:", error);
        alert("Ocorreu um erro ao excluir a seção. Tente novamente.");
    } finally {
        setIsDeleting(false);
    }
  };

  const handleUpdateDelivery = async (newConfig: any) => {
     if(checkPermission() && restaurantData && user) {
        try {
            await updateDoc(doc(db, 'merchants', user.uid), { deliveryConfig: newConfig });
            alert('Configurações de entrega salvas.');
        } catch (e) { console.error(e); alert('Erro ao salvar entrega.'); }
     }
  };

  const handleUpdateProfile = async (newData: Partial<Restaurant>) => {
     if(checkPermission() && restaurantData && user) {
        setIsSaving(true);
        try {
            if (newData.coverImage && newData.coverImage.startsWith('blob:')) {
               newData.coverImage = await uploadImage(newData.coverImage, 'covers');
            }
            if (newData.image && newData.image.startsWith('blob:')) {
               newData.image = await uploadImage(newData.image, 'logos');
            }
            await updateDoc(doc(db, 'merchants', user.uid), newData);
            alert('Perfil da loja atualizado com sucesso!');
        } catch (e) { console.error(e); alert('Erro ao atualizar perfil.'); } finally { setIsSaving(false); }
     }
  }

  const organizedMenu = useMemo(() => {
    if (!restaurantData) return null;
    const sections = restaurantData.menuSections || [];
    const grouped = sections.map(section => ({
      ...section,
      products: products.filter(p => p.sectionId === section.id)
    }));
    const orphans = products.filter(p => !sections.find(s => s.id === p.sectionId));
    return { grouped, orphans };
  }, [restaurantData, products]);


  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-brand-600" size={32} /></div>;

  if (!restaurantData) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
             <Store size={48} className="text-gray-300 mb-4" />
             <h2 className="text-xl font-bold text-gray-800">Loja não encontrada</h2>
             <p className="text-gray-500 mb-6">Entre em contato com o suporte.</p>
             <Button onClick={() => { logout(); onLogout(); }}>Sair</Button>
          </div>
      );
  }

  // --- Render Functions ---

  const renderMenuTab = () => (
    <>
      {/* BANNER DE BLOQUEIO SE SUSPENSO */}
      {isSuspended && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6 flex items-start gap-3 animate-pulse">
             <AlertTriangle className="text-red-600 shrink-0 mt-1" />
             <div>
                <h3 className="font-bold text-red-800">Assinatura Suspensa</h3>
                <p className="text-sm text-red-700 mt-1">
                   Sua loja está bloqueada para receber pedidos e edições. 
                   Acesse a aba <strong>Financeiro</strong> para regularizar.
                </p>
                <button 
                   onClick={() => setActiveTab('finance')}
                   className="mt-3 text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold"
                >
                   Regularizar Agora
                </button>
             </div>
          </div>
      )}

      {!isEditingProduct && !showGroupsManager ? (
          <div className={`animate-in fade-in slide-in-from-bottom-2 ${isSuspended ? 'opacity-50 pointer-events-none' : ''}`}>
            
            <div className="flex flex-col gap-3 mb-6">
                <div className="flex justify-between items-center">
                   <h2 className="font-bold text-gray-800 text-lg">Seu Cardápio</h2>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => { setSelectedProduct(null); setIsEditingProduct(true); }}>
                        <Plus size={16} className="mr-1" /> Novo Produto
                    </Button>
                    <Button size="sm" variant="secondary" className="flex-1 bg-white border border-gray-200" onClick={() => setShowGroupsManager(true)}>
                        <Layers size={16} className="mr-1 text-purple-600" /> Adicionais
                    </Button>
                </div>
            </div>
            
            <div className="space-y-6 pb-24">
              {organizedMenu?.grouped.length === 0 && organizedMenu?.orphans.length === 0 ? (
                 <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed">
                    <p>Você ainda não tem itens no cardápio.</p>
                 </div>
              ) : (
                organizedMenu?.grouped.map(section => (
                    <div key={section.id}>
                      <div className="flex items-center justify-between mb-2 ml-1">
                          <h3 className="font-bold text-gray-600 uppercase text-xs tracking-wider">
                            {section.name}
                          </h3>
                      </div>
                      <div className="space-y-2">
                        {section.products.map(p => (
                            <div key={p.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex gap-3 items-center">
                              <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
                                  <img src={p.image} className="w-full h-full object-cover" alt={p.name} loading="lazy" />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-sm text-gray-900 truncate">{p.name}</h3>
                                  <p className="text-sm font-bold text-brand-600">R$ {p.price.toFixed(2)}</p>
                              </div>
                              <div className="flex flex-col gap-2 pl-2">
                                  <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); setIsEditingProduct(true); }} className="p-2 text-gray-400 hover:text-brand-600"><Edit2 size={18}/></button>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteClick(p); }} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18}/></button>
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        ) : showGroupsManager ? (
          <div className="pb-20 animate-in slide-in-from-right-4">
             <div className="mb-4"><Button variant="ghost" onClick={() => setShowGroupsManager(false)} className="pl-0 text-gray-500">← Voltar</Button></div>
             <MerchantGroupManager groups={restaurantData.addonGroups || []} onUpdateGroups={handleUpdateGroups} />
          </div>
        ) : (
          <div className="pb-20 animate-in slide-in-from-right-4">
              <MerchantProductForm 
                initialData={selectedProduct}
                sections={restaurantData.menuSections || []}
                availableAddons={restaurantData.addonGroups || []}
                onSave={handleSaveProduct}
                onCancel={() => { setIsEditingProduct(false); setSelectedProduct(null); }}
                onDeleteSection={handleDeleteSection}
                isSaving={isSaving}
                defaultCategory={restaurantData.tags?.[0]} 
              />
          </div>
        )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 py-3 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md overflow-hidden relative border border-gray-100">
                 {restaurantData.image ? <img src={restaurantData.image} alt="Logo" className="w-full h-full object-cover" /> : <Store size={20} />}
             </div>
             <div>
                 <h1 className="font-bold text-gray-900 leading-tight">{restaurantData.name}</h1>
                 <div className="flex items-center gap-2 mt-0.5">
                     <span className={`w-2 h-2 rounded-full ${realTimeStatus.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                     <p className={`text-xs font-medium ${realTimeStatus.isOpen ? 'text-green-700' : 'text-gray-500'}`}>{realTimeStatus.label}</p>
                 </div>
             </div>
         </div>
         <button onClick={() => { logout(); onLogout(); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><LogOut size={20} /></button>
      </header>

      <main className="flex-1 p-4 overflow-y-auto overscroll-contain touch-pan-y">
         {activeTab === 'menu' && renderMenuTab()}
         {activeTab === 'delivery' && <div className="animate-in fade-in pb-20"><MerchantDeliverySettings config={restaurantData.deliveryConfig || { type: 'fixed', fixedPrice: 0 }} onUpdate={handleUpdateDelivery} /></div>}
         {activeTab === 'analytics' && <div className="animate-in fade-in pb-20"><MerchantAnalyticsScreen totalVisits={restaurantData.analytics?.totalVisits || 0} products={products} /></div>}
         {activeTab === 'profile' && <div className="animate-in fade-in pb-20"><MerchantProfileSettings restaurant={restaurantData} onUpdate={handleUpdateProfile} isSaving={isSaving} /></div>}
         {activeTab === 'support' && <MerchantSupportTab restaurantName={restaurantData.name} />}
         {/* NOVA ABA FINANCEIRA */}
         {activeTab === 'finance' && <MerchantSubscriptionScreen restaurant={restaurantData} />}
      </main>

      {/* Bottom Nav com 6 itens agora (scrollável se precisar em telas muito pequenas) */}
      <div className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-30 pb-safe">
          <div className="flex justify-between items-center h-16 max-w-md mx-auto px-2 overflow-x-auto no-scrollbar">
              <NavButton active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} icon={LayoutGrid} label="Menu" />
              <NavButton active={activeTab === 'delivery'} onClick={() => setActiveTab('delivery')} icon={Truck} label="Entrega" />
              <NavButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={BarChart3} label="Dados" />
              <NavButton active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} icon={Wallet} label="Financeiro" />
              <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={UserCog} label="Perfil" />
              <NavButton active={activeTab === 'support'} onClick={() => setActiveTab('support')} icon={Headphones} label="Ajuda" />
          </div>
      </div>

      {/* Modal Delete Product */}
      <Modal isOpen={!!productToDelete} onClose={() => setProductToDelete(null)} title="Excluir Produto">
        <div className="space-y-6 pt-2">
            <div className="flex flex-col items-center text-center">
                <div className="bg-red-50 p-4 rounded-full mb-3"><Trash2 size={32} className="text-red-500" /></div>
                <p className="text-gray-600 text-base">Tem certeza que deseja excluir <strong>{productToDelete?.name}</strong>?</p>
            </div>
            <div className="flex gap-3 justify-end pt-2">
                <Button variant="secondary" onClick={() => setProductToDelete(null)} disabled={isDeleting}>Cancelar</Button>
                <Button onClick={confirmDeleteProduct} isLoading={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">Sim, Excluir</Button>
            </div>
        </div>
      </Modal>

      {/* Modal Delete Section */}
      <Modal isOpen={!!sectionToDelete} onClose={() => setSectionToDelete(null)} title="Excluir Seção">
        <div className="space-y-6 pt-2">
            <div className="flex flex-col items-center text-center">
                <div className="bg-red-50 p-4 rounded-full mb-3"><AlertTriangle size={32} className="text-red-500" /></div>
                <p className="text-gray-800 font-bold text-lg mb-2">Excluir Seção?</p>
                <p className="text-gray-600 text-sm">Todos os produtos desta seção serão apagados permanentemente.</p>
            </div>
            <div className="flex gap-3 justify-end pt-2">
                <Button variant="secondary" onClick={() => setSectionToDelete(null)} disabled={isDeleting}>Cancelar</Button>
                <Button onClick={confirmDeleteSection} isLoading={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">Sim, Excluir Tudo</Button>
            </div>
        </div>
      </Modal>

    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string }> = ({ active, onClick, icon: Icon, label }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center min-w-[60px] h-full space-y-1 transition-colors ${active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        <span className="text-[9px] font-medium">{label}</span>
    </button>
);
