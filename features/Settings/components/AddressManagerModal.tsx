import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../Auth/context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { UserLocation, IBGEState, IBGECity } from '../../../types';
import { getStates, getCitiesByState, BAIRROS_IGUATU } from '../../Location/services/ibge';

interface AddressManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddressManagerModal: React.FC<AddressManagerModalProps> = ({ isOpen, onClose }) => {
  const { savedAddresses, addAddress, removeAddress, setDefaultAddress } = useAuth();
  
  const [isAdding, setIsAdding] = useState(false);

  // Form States (SEM CEP)
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [complement, setComplement] = useState('');

  // IBGE Data
  const [statesList, setStatesList] = useState<IBGEState[]>([]);
  const [citiesList, setCitiesList] = useState<IBGECity[]>([]);
  const [loadingIBGE, setLoadingIBGE] = useState(false);

  useEffect(() => {
    if (isAdding) {
      getStates().then(setStatesList);
    }
  }, [isAdding]);

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

  const handleSave = () => {
    if (!street || !number || !neighborhood || !city || !state) {
      alert("Preencha os campos obrigatórios.");
      return;
    }

    const newAddr: UserLocation = {
      state, city, neighborhood, street, number,
      reference: complement,
      isDefault: savedAddresses.length === 0 
    };

    addAddress(newAddr);
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setStreet(''); setNumber(''); setNeighborhood(''); setCity(''); setState(''); setComplement('');
  };

  if (!isOpen) return null;

  const isIguatu = city === 'Iguatu';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-bold text-gray-800">Meus Endereços</h2>
           <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
        </div>

        {!isAdding ? (
          <div className="space-y-4">
             {savedAddresses.length === 0 ? (
               <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                 <MapPin size={40} className="mx-auto mb-2 opacity-50" />
                 <p>Nenhum endereço salvo.</p>
               </div>
             ) : (
               <div className="space-y-3">
                 {savedAddresses.map((addr, idx) => (
                   <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 ${addr.isDefault ? 'border-brand-500 bg-brand-50' : 'border-gray-100 bg-white'}`}>
                      <div className="mt-1">
                        {addr.isDefault ? <CheckCircle2 className="text-brand-600" size={20} /> : <MapPin className="text-gray-400" size={20} />}
                      </div>
                      <div className="flex-1">
                         <p className="font-bold text-gray-800 text-sm">{addr.street}, {addr.number}</p>
                         <p className="text-xs text-gray-500">{addr.neighborhood}, {addr.city}-{addr.state}</p>
                         {!addr.isDefault && (
                           <button onClick={() => setDefaultAddress(idx)} className="text-xs text-brand-600 font-bold mt-2 hover:underline">
                             Definir como Principal
                           </button>
                         )}
                      </div>
                      <button onClick={() => removeAddress(idx)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                   </div>
                 ))}
               </div>
             )}

             <Button fullWidth onClick={() => setIsAdding(true)} className="mt-4">
               <Plus size={18} className="mr-2" /> Adicionar Novo Endereço
             </Button>
          </div>
        ) : (
          <div className="space-y-3 animate-in slide-in-from-right-4">
             
             {/* ESTADO E CIDADE */}
             <div className="flex gap-3">
                <div className="w-[80px]">
                   <label className="text-xs font-bold text-gray-500 ml-1">Estado</label>
                   <select value={state} onChange={e => { setState(e.target.value); setCity(''); }} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none text-sm h-[42px]">
                      <option value="">UF</option>
                      {statesList.map(s => <option key={s.id} value={s.sigla}>{s.sigla}</option>)}
                   </select>
                </div>
                <div className="flex-1">
                   <label className="text-xs font-bold text-gray-500 ml-1">Cidade</label>
                   <select value={city} onChange={e => setCity(e.target.value)} disabled={!state || loadingIBGE} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none text-sm h-[42px]">
                      <option value="">{loadingIBGE ? 'Carregando...' : 'Selecione'}</option>
                      {citiesList.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                   </select>
                </div>
             </div>

             {/* BAIRRO */}
             <div>
                <label className="text-xs font-bold text-gray-500 ml-1">Bairro</label>
                {isIguatu ? (
                  <select value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none text-sm h-[42px]">
                    <option value="">Selecione o Bairro</option>
                    {BAIRROS_IGUATU.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                ) : (
                  <input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Bairro" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none" />
                )}
             </div>

             {/* RUA */}
             <div>
                <label className="text-xs font-bold text-gray-500 ml-1">Rua</label>
                <input value={street} onChange={e => setStreet(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none" />
             </div>

             <div className="flex gap-3">
                 <div className="w-[100px]">
                    <label className="text-xs font-bold text-gray-500 ml-1">Número</label>
                    <input value={number} onChange={e => setNumber(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none" />
                 </div>
                 <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Complemento</label>
                    <input value={complement} onChange={e => setComplement(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none" />
                 </div>
             </div>

             <div className="pt-2 flex gap-2">
                <Button variant="secondary" onClick={() => setIsAdding(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handleSave} className="flex-[2]">Salvar Endereço</Button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
