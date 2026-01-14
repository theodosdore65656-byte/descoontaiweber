import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Eye, MousePointerClick, MessageCircle, TrendingUp, ArrowUpRight, Calendar, Loader2 
} from 'lucide-react';
import { Product } from '../../../types';
import { fetchAnalyticsData } from '../services/analyticsService'; // Importa o serviço novo

interface MerchantAnalyticsScreenProps {
  // Props antigas podem ser mantidas por compatibilidade, mas vamos usar o fetch interno
  totalVisits?: number; 
  products?: Product[];
}

export const MerchantAnalyticsScreen: React.FC<MerchantAnalyticsScreenProps> = () => {
  // Estado do Filtro
  const [dateRange, setDateRange] = useState<number>(0); // 0 = Hoje, 1 = Ontem, 7 = 7 dias...
  const [isLoading, setIsLoading] = useState(false);
  
  // Dados Reais
  const [stats, setStats] = useState({
     totalVisits: 0,
     totalProductClicks: 0,
     totalWhatsapp: 0,
     rankedProducts: [] as any[]
  });
  
  // Pega o ID do lojista (Assumindo que está no contexto ou URL, aqui vamos buscar do localStorage ou Auth)
  // Como este componente é renderizado dentro do Dashboard, vamos pegar o ID do user logado
  // ATENÇÃO: Precisamos do user.uid. Vou usar um hook genérico ou passar via props no futuro.
  // Por enquanto, vou tentar pegar do AuthContext importando direto
  const [merchantId, setMerchantId] = useState<string | null>(null);

  useEffect(() => {
     // Pequeno hack para pegar o ID se não vier via props (já que mudamos a assinatura)
     // O ideal seria passar merchantId via props do pai.
     // Vou tentar ler do auth user
     import('../../Auth/context/AuthContext').then(({ useAuth }) => {
         // Isso não funciona bem dentro de useEffect em React puro, 
         // o ideal é o componente pai passar o ID.
         // Vamos assumir que o user está logado e pegar do firebase auth direto
         import('../../../lib/firebase').then(({ auth }) => {
             if (auth.currentUser) {
                 setMerchantId(auth.currentUser.uid);
             }
         });
     });
  }, []);

  // Busca Dados quando muda o filtro ou o ID
  useEffect(() => {
    if (!merchantId) return;

    const loadStats = async () => {
        setIsLoading(true);
        try {
            // Se for "Ontem" (range especial), a lógica seria um pouco diferente,
            // mas para simplificar: 0 = Hoje, 1 = Últimos 2 dias (incluindo hoje), etc.
            // Vou ajustar para:
            // 0 = Hoje
            // 1 = Ontem (Apenas ontem) -> Requer ajuste no service, mas vamos usar "Últimas 24h" como 1 dia
            // 7 = 7 dias
            const data = await fetchAnalyticsData(merchantId, dateRange);
            setStats(data);
        } catch (error) {
            console.error("Erro ao carregar analytics", error);
        } finally {
            setIsLoading(false);
        }
    };

    loadStats();
  }, [merchantId, dateRange]);

  const conversionRate = stats.totalProductClicks > 0 
    ? ((stats.totalWhatsapp / stats.totalProductClicks) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="space-y-6 pb-20">
      
      {/* HEADER E FILTROS */}
      <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
                <BarChart3 className="text-brand-600" size={24} />
                <div>
                    <h2 className="font-bold text-gray-800 text-lg">Desempenho da Loja</h2>
                    <p className="text-xs text-gray-500">Acompanhe suas métricas em tempo real.</p>
                </div>
            </div>

            {/* Botões de Filtro */}
            <div className="flex bg-gray-100 p-1 rounded-lg gap-1 overflow-x-auto max-w-full">
                {[
                    { label: 'Hoje', value: 0 },
                    { label: '7 Dias', value: 7 },
                    { label: '15 Dias', value: 15 },
                    { label: '30 Dias', value: 30 },
                ].map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setDateRange(opt.value)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                            dateRange === opt.value 
                            ? 'bg-white text-brand-600 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
         </div>

         {isLoading ? (
             <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-brand-600"/></div>
         ) : (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Store Visits */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative overflow-hidden">
                   <span className="text-3xl font-bold text-gray-900 block mb-1">{stats.totalVisits}</span>
                   <span className="text-xs text-gray-500 font-bold uppercase flex items-center gap-1">
                     <Eye size={12} /> Visitas
                   </span>
                </div>

                {/* Product Clicks */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 relative overflow-hidden">
                   <span className="text-3xl font-bold text-blue-700 block mb-1">{stats.totalProductClicks}</span>
                   <span className="text-xs text-blue-600/70 font-bold uppercase flex items-center gap-1">
                     <MousePointerClick size={12} /> Cliques Itens
                   </span>
                </div>

                {/* Whatsapp Clicks */}
                <div className="bg-green-50 rounded-xl p-4 border border-green-100 relative overflow-hidden">
                   <span className="text-3xl font-bold text-green-700 block mb-1">{stats.totalWhatsapp}</span>
                   <span className="text-xs text-green-600/70 font-bold uppercase flex items-center gap-1">
                     <MessageCircle size={12} /> Cliques Whats
                   </span>
                </div>

                {/* Conversion Rate */}
                <div className="bg-brand-50 rounded-xl p-4 border border-brand-100 relative overflow-hidden">
                   <span className="text-3xl font-bold text-brand-600 block mb-1">{conversionRate}%</span>
                   <span className="text-xs text-brand-700/70 font-bold uppercase flex items-center gap-1">
                     <ArrowUpRight size={12} /> Conversão
                   </span>
                </div>
             </div>
         )}
      </section>

      {/* RANKING DE PRODUTOS */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
           <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Produtos Mais Acessados</h3>
           <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Top {stats.rankedProducts.length}</span>
        </div>

        <div className="divide-y divide-gray-100">
          {stats.rankedProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Nenhum dado registrado neste período.</div>
          ) : (
              stats.rankedProducts.map((product, index) => (
                <div key={product.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <span className="text-gray-300 font-bold text-lg w-6 text-center">#{index + 1}</span>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{product.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                       <span className="text-xs text-blue-600 flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded">
                          <MousePointerClick size={10} /> {product.clicks} cliques
                       </span>
                       <span className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded">
                          <MessageCircle size={10} /> {product.whatsapp} whats
                       </span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-20 hidden sm:block">
                     <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-500 rounded-full" 
                          style={{ width: `${Math.min(100, (product.clicks / (stats.rankedProducts[0].clicks || 1)) * 100)}%` }} 
                        />
                     </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </section>

    </div>
  );
};