
import React, { useEffect, useState } from 'react';
import { 
  Loader2, TrendingUp, MousePointerClick, MessageCircle, 
  ShoppingBag, Store, ArrowUpRight, Search, Eye, Filter, X 
} from 'lucide-react';
import { Restaurant, Product } from '../../../types';
import { MerchantAnalyticsScreen } from '../../Merchant/screens/MerchantAnalyticsScreen'; // Reusing the component

// Extendendo o tipo para incluir produtos para o relatório
interface RestaurantWithAnalytics extends Restaurant {
  derivedProducts: Product[];
  totalInteractions: number;
  conversionRate: number;
}

export const GlobalAnalyticsTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [allRestaurants, setAllRestaurants] = useState<RestaurantWithAnalytics[]>([]);
  const [globalStats, setGlobalStats] = useState({
    totalVisits: 0,
    totalCardClicks: 0,
    totalWhatsappClicks: 0,
    avgConversion: 0
  });

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantWithAnalytics | null>(null);

  useEffect(() => {
    loadGlobalData();
  }, []);

  const loadGlobalData = async () => {
    setLoading(true);
    
    // Simulating API Latency
    await new Promise(resolve => setTimeout(resolve, 500));

    // 1. Load Data from Storage
    const storedMerchants = localStorage.getItem('db_merchants');
    const storedProducts = localStorage.getItem('db_products');
    
    const merchants: Restaurant[] = storedMerchants ? JSON.parse(storedMerchants) : [];
    const products: Product[] = storedProducts ? JSON.parse(storedProducts) : [];

    // 2. Process Data
    const processedList: RestaurantWithAnalytics[] = merchants.map(r => {
      // Find products for this merchant
      const rProducts = products.filter(p => p.restaurantId === r.id);

      const visits = r.analytics?.totalVisits || 0;
      const cardClicks = rProducts.reduce((acc, p) => acc + (p.analytics?.cardClicks || 0), 0);
      const whatsClicks = rProducts.reduce((acc, p) => acc + (p.analytics?.whatsappClicks || 0), 0);
      
      const interactions = cardClicks + whatsClicks;
      const conversion = cardClicks > 0 ? (whatsClicks / cardClicks) * 100 : 0;

      return {
        ...r,
        analytics: { ...r.analytics, totalVisits: visits },
        derivedProducts: rProducts,
        totalInteractions: interactions,
        conversionRate: conversion
      };
    });

    // 3. Calculate Global Totals
    const totalVisits = processedList.reduce((acc, r) => acc + (r.analytics?.totalVisits || 0), 0);
    const totalCard = processedList.reduce((acc, r) => acc + r.derivedProducts.reduce((sub, p) => sub + (p.analytics?.cardClicks || 0), 0), 0);
    const totalWhats = processedList.reduce((acc, r) => acc + r.derivedProducts.reduce((sub, p) => sub + (p.analytics?.whatsappClicks || 0), 0), 0);
    const avgConv = processedList.length > 0 
      ? processedList.reduce((acc, r) => acc + r.conversionRate, 0) / processedList.length 
      : 0;

    setAllRestaurants(processedList);
    setGlobalStats({
      totalVisits,
      totalCardClicks: totalCard,
      totalWhatsappClicks: totalWhats,
      avgConversion: avgConv
    });
    
    setLoading(false);
  };

  const filteredRestaurants = allRestaurants.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.id && r.id.includes(searchQuery))
  );

  // Sorting: Highest Sales Leads first
  const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    const leadsA = a.derivedProducts.reduce((acc, p) => acc + (p.analytics?.whatsappClicks || 0), 0);
    const leadsB = b.derivedProducts.reduce((acc, p) => acc + (p.analytics?.whatsappClicks || 0), 0);
    return leadsB - leadsA;
  });

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-600" size={32} /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
       
       {/* 1. Executive Dashboard Cards */}
       <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Total Views */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                   <Eye size={18} className="text-blue-500" />
                   <span className="text-xs font-bold uppercase tracking-wider">Tráfego Total</span>
                </div>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-3xl font-extrabold text-gray-900">{globalStats.totalVisits.toLocaleString()}</h3>
                </div>
                <p className="text-xs text-gray-400 mt-1">Visitas únicas em lojas</p>
             </div>
          </div>

          {/* Interest (Card Clicks) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                   <MousePointerClick size={18} className="text-purple-500" />
                   <span className="text-xs font-bold uppercase tracking-wider">Interesse (Cliques)</span>
                </div>
                <h3 className="text-3xl font-extrabold text-gray-900">{globalStats.totalCardClicks.toLocaleString()}</h3>
                <p className="text-xs text-gray-400 mt-1">Produtos visualizados</p>
             </div>
          </div>

          {/* Conversion (WhatsApp) */}
          <div className="bg-gradient-to-br from-brand-600 to-brand-700 p-5 rounded-2xl border border-brand-500 shadow-lg relative overflow-hidden text-white">
             <div className="absolute -right-6 -bottom-6 bg-white/10 w-32 h-32 rounded-full blur-2xl"></div>
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 text-white/80">
                   <MessageCircle size={18} />
                   <span className="text-xs font-bold uppercase tracking-wider">Leads de Venda</span>
                </div>
                <div className="flex items-baseline gap-2">
                   <h3 className="text-3xl font-extrabold text-white">{globalStats.totalWhatsappClicks.toLocaleString()}</h3>
                   <span className="text-xs font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">
                     {globalStats.avgConversion.toFixed(1)}% Conv.
                   </span>
                </div>
                <p className="text-xs text-white/70 mt-1">Intenções de compra (WhatsApp)</p>
             </div>
          </div>
       </section>

       {/* 2. Merchants Performance Table */}
       <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <h3 className="font-bold text-gray-800 text-lg">Desempenho por Loja</h3>
                <p className="text-sm text-gray-500">Ranking baseado em leads gerados.</p>
             </div>
             
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar loja..." 
                  className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none w-full md:w-64"
                />
             </div>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs tracking-wider">
                   <tr>
                      <th className="px-6 py-4">Estabelecimento</th>
                      <th className="px-6 py-4 text-center">Visitas</th>
                      <th className="px-6 py-4 text-center">Visualizações</th>
                      <th className="px-6 py-4 text-center">Leads (Zap)</th>
                      <th className="px-6 py-4 text-center">Conv. %</th>
                      <th className="px-6 py-4 text-right">Ação</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {sortedRestaurants.map((r, idx) => {
                     const totalLeads = r.derivedProducts.reduce((acc, p) => acc + (p.analytics?.whatsappClicks || 0), 0);
                     const totalClicks = r.derivedProducts.reduce((acc, p) => acc + (p.analytics?.cardClicks || 0), 0);
                     
                     return (
                       <tr key={r.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <span className="text-gray-400 font-mono text-xs w-4">#{idx + 1}</span>
                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                   <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                   <p className="font-bold text-gray-900">{r.name}</p>
                                   <p className="text-xs text-gray-500 flex items-center gap-1">
                                      <span className={`w-1.5 h-1.5 rounded-full ${r.isOpen ? 'bg-green-500' : 'bg-red-400'}`}></span>
                                      {r.isOpen ? 'Aberto' : 'Fechado'}
                                   </p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-center text-gray-600 font-medium">{r.analytics?.totalVisits || 0}</td>
                          <td className="px-6 py-4 text-center text-gray-600">{totalClicks}</td>
                          <td className="px-6 py-4 text-center">
                             <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold text-xs">
                                {totalLeads}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <div className="flex items-center justify-center gap-2">
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(100, r.conversionRate)}%` }}></div>
                                </div>
                                <span className="text-xs text-gray-500">{r.conversionRate.toFixed(1)}%</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button 
                               onClick={() => setSelectedRestaurant(r)}
                               className="text-brand-600 hover:text-brand-800 font-bold text-xs flex items-center justify-end gap-1 hover:underline"
                             >
                                Ver Detalhes <ArrowUpRight size={14} />
                             </button>
                          </td>
                       </tr>
                     );
                   })}
                </tbody>
             </table>
          </div>
          
          {sortedRestaurants.length === 0 && (
             <div className="p-8 text-center text-gray-400">
                <Store size={48} className="mx-auto mb-2 opacity-20" />
                <p>Nenhuma loja encontrada.</p>
             </div>
          )}
       </section>

       {/* 3. Detailed Modal (Reusing Merchant Analytics Logic) */}
       {selectedRestaurant && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedRestaurant(null)} />
            
            <div className="bg-gray-50 w-full max-w-4xl h-full max-h-[90vh] rounded-2xl shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-200">
               
               {/* Modal Header */}
               <div className="bg-white p-4 rounded-t-2xl border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                        <img src={selectedRestaurant.image} alt="Logo" className="w-full h-full object-cover" />
                     </div>
                     <div>
                        <h2 className="font-bold text-lg text-gray-900 leading-none">{selectedRestaurant.name}</h2>
                        <p className="text-xs text-gray-500 mt-1">Visualização de Administrador</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setSelectedRestaurant(null)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
               </div>

               {/* Modal Body: Reuse Merchant Analytics Component */}
               <div className="flex-1 overflow-y-auto p-4 md:p-6">
                  <MerchantAnalyticsScreen 
                     totalVisits={selectedRestaurant.analytics?.totalVisits || 0}
                     products={selectedRestaurant.derivedProducts}
                  />
               </div>

               {/* Modal Footer */}
               <div className="bg-white p-4 rounded-b-2xl border-t border-gray-200 text-center text-xs text-gray-400">
                  Dados sincronizados em tempo real.
               </div>
            </div>
         </div>
       )}

    </div>
  );
};
