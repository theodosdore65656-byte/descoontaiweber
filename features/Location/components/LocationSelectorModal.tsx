import React, { useState, useEffect } from 'react';
import { X, MapPin, Search } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../../Auth/context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { UserLocation, IBGEState, IBGECity } from '../../../types';
import { getStates, getCitiesByState, searchAddressByQuery, BAIRROS_IGUATU } from '../services/ibge';

export const LocationSelectorModal: React.FC = () => {
  const { isLocationModalOpen, setIsLocationModalOpen, setLocation } = useLocation();
  const { user, addAddress } = useAuth();

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [manualMode, setManualMode] = useState(false);
  
  // Dados do IBGE
  const [statesList, setStatesList] = useState<IBGEState[]>([]);
  const [citiesList, setCitiesList] = useState<IBGECity[]>([]);
  const [loadingIBGE, setLoadingIBGE] = useState(false);
  
  // Form States (SEM CEP)
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [complement, setComplement] = useState('');

  // Carregar Estados ao abrir modo manual
  useEffect(() => {
    if (manualMode) {
      getStates().then(setStatesList);
    }
  }, [manualMode]);

  // Carregar Cidades quando Estado muda
  useEffect(() => {
    if (state) {
      setLoadingIBGE(true);
      getCitiesByState(state).then(cities => {
        setCitiesList(cities);
        setLoadingIBGE(false);
      });
    } else {
      setCitiesList([]);
    }
  }, [state]);

  if (!isLocationModalOpen) return null;

  const handleSearch = async () => {
    if (query.length < 3) return;
    setIsLoading(true);
    try {
      const data = await searchAddressByQuery(query);
      setResults(data);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleConfirm = () => {
    if (!street || !number || !neighborhood || !city || !state) {
       alert("Preencha todos os campos obrigatórios");
       return;
    }

    const newLocation: UserLocation = {
       state, city, neighborhood, street, number,
       reference: complement,
       isDefault: true 
    };

    setLocation(newLocation);
    if (user) addAddress(newLocation); 

    setIsLocationModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
     setQuery(''); setResults([]); setManualMode(false);
     setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState(''); setComplement('');
  };

  const isIguatu = city === 'Iguatu';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full sm:w-[400px] sm:rounded-2xl rounded-t-[32px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-gray-800">Onde você está?</h2>
           <button onClick={() => setIsLocationModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
             <X size={20} className="text-gray-600" />
           </button>
        </div>

        {!manualMode ? (
          <div className="space-y-4">
             {/* Busca Global */}
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="Buscar rua, bairro..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-brand-500 transition-colors"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             </div>
             <Button fullWidth onClick={handleSearch} isLoading={isLoading} variant="primary">Buscar</Button>
             
             <div className="flex items-center gap-2 my-2">
                <div className="h-px bg-gray-100 flex-1"></div><span className="text-xs text-gray-400 font-medium">OU</span><div className="h-px bg-gray-100 flex-1"></div>
             </div>

             <Button fullWidth variant="secondary" className="bg-white border border-gray-200 text-gray-600" onClick={() => setManualMode(true)}>
               <MapPin size={18} className="mr-2 text-brand-500" /> Preencher Manualmente
             </Button>

             {/* Resultados */}
             {results.length > 0 && (
               <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
                 {results.map((item, idx) => (
                    <button key={idx} onClick={() => {
                         setState(item.uf);
                         setTimeout(() => setCity(item.localidade), 500);
                         setStreet(item.logradouro);
                         setNeighborhood(item.bairro);
                         setManualMode(true);
                      }} className="w-full text-left p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 flex items-start gap-3">
                       <MapPin className="text-gray-400 mt-1 shrink-0" size={16} />
                       <div>
                          <p className="text-sm font-bold text-gray-800">{item.logradouro || item.name}</p>
                          <p className="text-xs text-gray-500">{item.bairro}, {item.localidade} - {item.uf}</p>
                       </div>
                    </button>
                 ))}
               </div>
             )}
          </div>
        ) : (
          <div className="space-y-3 animate-in slide-in-from-right-4">
             
             {/* ESTADO E CIDADE */}
             <div className="flex gap-3">
                <div className="w-[80px]">
                   <label className="text-xs font-bold text-gray-500 ml-1">Estado</label>
                   <select 
                      value={state} 
                      onChange={e => { setState(e.target.value); setCity(''); }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none text-sm h-[42px]"
                   >
                      <option value="">UF</option>
                      {statesList.map(s => <option key={s.id} value={s.sigla}>{s.sigla}</option>)}
                   </select>
                </div>
                <div className="flex-1">
                   <label className="text-xs font-bold text-gray-500 ml-1">Cidade</label>
                   <select 
                      value={city} 
                      onChange={e => setCity(e.target.value)}
                      disabled={!state || loadingIBGE}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none text-sm h-[42px]"
                   >
                      <option value="">{loadingIBGE ? 'Carregando...' : 'Selecione'}</option>
                      {citiesList.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                   </select>
                </div>
             </div>

             {/* BAIRRO */}
             <div>
                <label className="text-xs font-bold text-gray-500 ml-1">Bairro</label>
                {isIguatu ? (
                  <select 
                    value={neighborhood} 
                    onChange={e => setNeighborhood(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none text-sm h-[42px]"
                  >
                    <option value="">Selecione o Bairro</option>
                    {BAIRROS_IGUATU.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                ) : (
                  <input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Bairro" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none" />
                )}
             </div>

             {/* RUA */}
             <div>
                <label className="text-xs font-bold text-gray-500 ml-1">Rua / Avenida</label>
                <input value={street} onChange={e => setStreet(e.target.value)} placeholder="Nome da rua" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none" />
             </div>

             {/* NUMERO E COMPLEMENTO */}
             <div className="flex gap-3">
                 <div className="w-[100px]">
                    <label className="text-xs font-bold text-gray-500 ml-1">Número</label>
                    <input value={number} onChange={e => setNumber(e.target.value)} placeholder="123" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none" />
                 </div>
                 <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Complemento</label>
                    <input value={complement} onChange={e => setComplement(e.target.value)} placeholder="Apto, Ref..." className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none" />
                 </div>
             </div>

             <div className="pt-2 flex gap-2">
                <Button variant="secondary" onClick={() => setManualMode(false)} className="flex-1">Voltar</Button>
                <Button onClick={handleConfirm} className="flex-[2]">Confirmar</Button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
