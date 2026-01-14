import React, { useState, useEffect } from 'react';
import { Truck, Map, Info, CheckCircle2, Save } from 'lucide-react';
import { DeliveryConfig } from '../../../types';
import { IGUATU_NEIGHBORHOODS } from '../../../constants';
import { Button } from '../../../components/ui/Button';

interface MerchantDeliverySettingsProps {
  config: DeliveryConfig;
  onUpdate: (newConfig: DeliveryConfig) => void;
}

export const MerchantDeliverySettings: React.FC<MerchantDeliverySettingsProps> = ({ config, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'fixed' | 'neighborhood'>(config.type);
  
  const [fixedPriceStr, setFixedPriceStr] = useState<string>(
    config.fixedPrice ? config.fixedPrice.toFixed(2).replace('.', ',') : ''
  );
  
  const [pricesStr, setPricesStr] = useState<Record<string, string>>({});
  const [bulkPriceStr, setBulkPriceStr] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const initialPrices: Record<string, string> = {};
    IGUATU_NEIGHBORHOODS.forEach(bairro => {
      const val = config.neighborhoodPrices?.[bairro];
      initialPrices[bairro] = val !== undefined ? val.toFixed(2).replace('.', ',') : '';
    });
    setPricesStr(initialPrices);
  }, [config]);

  const handlePriceChange = (bairro: string, value: string) => {
    const cleanValue = value.replace(/[^0-9.,]/g, '');
    setPricesStr(prev => ({
      ...prev,
      [bairro]: cleanValue
    }));
  };

  const applyBulkPrice = () => {
    if (!bulkPriceStr) return;
    const cleanBulk = bulkPriceStr.replace(/[^0-9.,]/g, '');
    const newPrices = { ...pricesStr };
    IGUATU_NEIGHBORHOODS.forEach(bairro => {
      newPrices[bairro] = cleanBulk;
    });
    setPricesStr(newPrices);
  };

  const handleSave = () => {
    setIsSaving(true);

    const fixedPriceNum = parseFloat(fixedPriceStr.replace(',', '.')) || 0;
    const neighborhoodPricesNum: Record<string, number> = {};
    
    Object.keys(pricesStr).forEach(bairro => {
      const valStr = pricesStr[bairro];
      if (valStr && valStr.trim() !== '') {
        const valNum = parseFloat(valStr.replace(',', '.'));
        if (!isNaN(valNum)) {
          neighborhoodPricesNum[bairro] = valNum;
        }
      }
    });

    const newConfig: DeliveryConfig = {
      type: activeTab,
      fixedPrice: fixedPriceNum,
      neighborhoodPrices: neighborhoodPricesNum
    };
    
    setTimeout(() => {
      onUpdate(newConfig);
      setIsSaving(false);
      alert('Configurações de entrega atualizadas com sucesso!');
    }, 800);
  };

  // Classe utilitária para inputs escuros
  const DARK_INPUT_CLASS = "w-full pl-10 pr-4 py-3 bg-gray-800 border border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-white placeholder-gray-500";
  const DARK_INPUT_SMALL = "w-full pl-7 pr-3 py-1.5 bg-gray-800 border border-transparent rounded text-sm focus:ring-2 focus:ring-brand-500 outline-none text-right font-medium text-white placeholder-gray-500";

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-blue-800 text-sm border border-blue-100">
        <Info className="shrink-0" size={20} />
        <div>
          <p className="font-bold mb-1">Como funciona a cobrança?</p>
          <p>Defina se você cobra um valor único para toda a cidade ou valores diferentes para cada bairro. Isso será calculado automaticamente no carrinho do cliente.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('fixed')}
          className={`pb-3 px-4 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'fixed' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Truck size={18} /> Taxa Fixa
        </button>
        <button 
          onClick={() => setActiveTab('neighborhood')}
          className={`pb-3 px-4 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'neighborhood' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Map size={18} /> Por Bairro (Iguatu)
        </button>
      </div>

      {/* Conteúdo: Taxa Fixa */}
      {activeTab === 'fixed' && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 animate-in fade-in shadow-sm">
           <label className="block text-sm font-bold text-gray-700 mb-2">Valor da Entrega (Toda a Cidade)</label>
           <div className="relative max-w-xs">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
              <input 
                type="text"
                inputMode="decimal"
                value={fixedPriceStr}
                onChange={(e) => setFixedPriceStr(e.target.value.replace(/[^0-9.,]/g, ''))}
                className={DARK_INPUT_CLASS}
                placeholder="0,00"
              />
           </div>
           <p className="text-xs text-gray-500 mt-2">Este valor será cobrado independente do endereço do cliente.</p>
        </div>
      )}

      {/* Conteúdo: Por Bairro */}
      {activeTab === 'neighborhood' && (
        <div className="space-y-4 animate-in fade-in">
          
          {/* Ação em Massa */}
          <div className="bg-gray-50 p-4 rounded-xl flex flex-col sm:flex-row items-end gap-3 border border-gray-200 shadow-inner">
             <div className="flex-1 w-full">
               <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Aplicar valor padrão a todos</label>
               <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">R$</span>
                  <input 
                    type="text"
                    inputMode="decimal"
                    value={bulkPriceStr}
                    onChange={(e) => setBulkPriceStr(e.target.value.replace(/[^0-9.,]/g, ''))}
                    className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-transparent rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium text-white placeholder-gray-500"
                    placeholder="0,00"
                  />
               </div>
             </div>
             <Button variant="secondary" size="sm" onClick={applyBulkPrice} className="bg-white border border-gray-300 shadow-sm hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200">
               Aplicar a Todos
             </Button>
          </div>

          {/* Lista de Bairros */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
             <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
                {IGUATU_NEIGHBORHOODS.map(bairro => (
                  <div key={bairro} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors group">
                     <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{bairro}</span>
                     <div className="relative w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">R$</span>
                        <input 
                          type="text"
                          inputMode="decimal"
                          value={pricesStr[bairro] || ''}
                          onChange={(e) => handlePriceChange(bairro, e.target.value)}
                          className={DARK_INPUT_SMALL}
                          placeholder="--"
                        />
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Footer Fixo de Ação */}
      <div className="pt-4 border-t border-gray-100 sticky bottom-0 bg-white pb-safe">
        <Button fullWidth size="lg" onClick={handleSave} isLoading={isSaving}>
           {!isSaving && <Save size={18} className="mr-2" />}
           {isSaving ? 'Salvando...' : 'Salvar Configuração de Entrega'}
        </Button>
      </div>
    </div>
  );
};