import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Store, MapPin, Save, Edit2, Clock, Tag, AlertTriangle, Check, Link as LinkIcon, Copy, Loader2, XCircle, Search, X } from 'lucide-react';
import { Restaurant, IBGEState, IBGECity } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { CATEGORIES, IGUATU_NEIGHBORHOODS } from '../../../constants';
import { copyStoreLinkToClipboard } from '../../../features/Share/services/shareService';
import { collection, query, where, getDocs } from 'firebase/firestore'; 
import { db } from '../../../lib/firebase';
import { getStates, getCitiesByState } from '../../Location/services/ibge';

interface MerchantProfileSettingsProps {
  restaurant: Restaurant;
  onUpdate: (data: Partial<Restaurant>) => Promise<void>;
  isSaving: boolean;
}

const DAYS_OF_WEEK = [
    { key: 'Seg', label: 'Segunda' },
    { key: 'Ter', label: 'Terça' },
    { key: 'Qua', label: 'Quarta' },
    { key: 'Qui', label: 'Quinta' },
    { key: 'Sex', label: 'Sexta' },
    { key: 'Sáb', label: 'Sábado' },
    { key: 'Dom', label: 'Domingo' }
];

export const MerchantProfileSettings: React.FC<MerchantProfileSettingsProps> = ({ 
  restaurant, 
  onUpdate, 
  isSaving 
}) => {
  // --- Estados de Localização (IBGE) ---
  const [states, setStates] = useState<IBGEState[]>([]);
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  // --- Função para "Quebrar" o endereço antigo em campos separados ---
  const parseAddress = (fullAddress: string) => {
      // Tenta o formato padrão: Rua, Numero - Bairro, Cidade - UF
      // Regex: (Rua...), (Numero) - (Bairro), (Cidade) - (UF)
      try {
          if (!fullAddress) return { street: '', number: '', neighborhood: '', city: '', uf: '', reference: '' };
          
          const parts = fullAddress.split(' - ');
          if (parts.length >= 3) {
              const [streetAndNum, neighborhoodAndCity, uf] = parts;
              const [street, number] = streetAndNum.split(',').map(s => s.trim());
              const [neighborhood, city] = neighborhoodAndCity.split(',').map(s => s.trim());
              
              return {
                  street: street || '',
                  number: number || '',
                  neighborhood: neighborhood || '',
                  city: city || '',
                  uf: uf ? uf.slice(0, 2) : '',
                  reference: '' // Referencia geralmente não está salva nesse formato padrão
              };
          }
      } catch (e) {
          console.log("Erro ao parsear endereço", e);
      }
      // Fallback
      return { street: fullAddress, number: '', neighborhood: '', city: '', uf: '', reference: '' };
  };

  const initialAddress = useMemo(() => parseAddress(restaurant.address || ''), []);

  const [formData, setFormData] = useState({
    name: restaurant.name || '',
    description: restaurant.description || '',
    category: restaurant.category || '', 
    tags: restaurant.tags || [], 
    phone: restaurant.phone || restaurant.whatsappNumber || '',
    deliveryTime: restaurant.deliveryTime || '30-45',
    slug: restaurant.slug || restaurant.id,
    
    // Campos de Endereço Separados
    uf: initialAddress.uf,
    city: initialAddress.city,
    neighborhood: restaurant.addressNeighborhood || initialAddress.neighborhood,
    street: initialAddress.street,
    number: initialAddress.number,
    reference: initialAddress.reference,

    schedule: restaurant.schedule || {
        'Seg': { isOpen: true, open: '18:00', close: '23:00' },
        'Ter': { isOpen: true, open: '18:00', close: '23:00' },
        'Qua': { isOpen: true, open: '18:00', close: '23:00' },
        'Qui': { isOpen: true, open: '18:00', close: '23:00' },
        'Sex': { isOpen: true, open: '18:00', close: '23:00' },
        'Sáb': { isOpen: true, open: '18:00', close: '23:00' },
        'Dom': { isOpen: true, open: '18:00', close: '23:00' }
    }
  });

  // Estados para validação do Slug
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [slugMessage, setSlugMessage] = useState('');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [previews, setPreviews] = useState({
      logo: restaurant.image || '',
      cover: restaurant.coverImage || ''
  });

  // --- CARREGAR DADOS DO IBGE AO INICIAR ---
  useEffect(() => {
    const loadIBGE = async () => {
        setLoadingLocations(true);
        const ufs = await getStates();
        setStates(ufs);
        
        // Se já tiver UF salva, carrega as cidades
        if (formData.uf) {
            const citiesData = await getCitiesByState(formData.uf);
            setCities(citiesData);
        }
        setLoadingLocations(false);
    };
    loadIBGE();
  }, []);

  // Atualiza termo de busca da cidade se já tiver cidade salva
  useEffect(() => {
     if (formData.city && !citySearchTerm) {
         setCitySearchTerm(formData.city);
     }
  }, [formData.city]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'slug') {
        setSlugStatus('idle');
        setSlugMessage('');
    }
  };

  const handleStateChange = async (uf: string) => {
    handleChange('uf', uf);
    handleChange('city', '');
    setCitySearchTerm('');
    setLoadingLocations(true);
    const citiesData = await getCitiesByState(uf);
    setCities(citiesData);
    setLoadingLocations(false);
  };

  const filteredCities = useMemo(() => {
    if (!citySearchTerm) return cities;
    return cities.filter(c => c.nome.toLowerCase().includes(citySearchTerm.toLowerCase()));
  }, [cities, citySearchTerm]);

  const handleCitySelect = (cityName: string) => {
    handleChange('city', cityName);
    setCitySearchTerm(cityName);
    setIsCityDropdownOpen(false);
  };

  const checkSlugAvailability = async () => {
      const slugToCheck = formData.slug.trim().toLowerCase().replace(/\s+/g, '-');
      if (!slugToCheck || slugToCheck.length < 3) {
          setSlugStatus('taken');
          setSlugMessage('O link deve ter pelo menos 3 letras.');
          return;
      }
      setSlugStatus('checking');
      try {
          if (slugToCheck === restaurant.slug || slugToCheck === restaurant.id) {
              setSlugStatus('available');
              setSlugMessage('Este link é seu.');
              return;
          }
          const q = query(collection(db, 'merchants'), where('slug', '==', slugToCheck));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
              setSlugStatus('taken');
              setSlugMessage('Este link já está em uso.');
          } else {
              setSlugStatus('available');
              setSlugMessage('Link disponível!');
              handleChange('slug', slugToCheck);
          }
      } catch (error) {
          console.error("Erro ao validar slug", error);
          setSlugStatus('idle');
          setSlugMessage('Erro ao validar.');
      }
  };

  const handleCopyLink = () => {
      copyStoreLinkToClipboard(formData.slug || restaurant.id); 
      alert('Link copiado!');
  };

  const toggleTag = (tagId: string) => {
    setFormData(prev => {
        const currentTags = prev.tags || [];
        if (currentTags.includes(tagId)) {
            return { ...prev, tags: currentTags.filter(t => t !== tagId) };
        } else {
            return { ...prev, tags: [...currentTags, tagId] };
        }
    });
  };

  const handleScheduleChange = (day: string, field: string, value: any) => {
     setFormData(prev => ({
         ...prev,
         schedule: {
             ...prev.schedule,
             [day]: { ...prev.schedule[day], [field]: value }
         }
     }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
     const file = e.target.files?.[0];
     if (file) {
         const url = URL.createObjectURL(file);
         setPreviews(prev => ({ ...prev, [type]: url }));
         if (type === 'logo') onUpdate({ image: url });
         if (type === 'cover') onUpdate({ coverImage: url });
     }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (slugStatus === 'taken') {
        alert('Por favor, escolha um link válido antes de salvar.');
        return;
    }

    if (!formData.uf || !formData.city || !formData.neighborhood || !formData.street || !formData.number) {
        alert('Por favor, preencha o endereço completo.');
        return;
    }

    // MONTAGEM DO ENDEREÇO PADRÃO
    const fullAddress = `${formData.street}, ${formData.number} - ${formData.neighborhood}, ${formData.city} - ${formData.uf}${formData.reference ? ` (${formData.reference})` : ''}`;

    onUpdate({
        name: formData.name,
        description: formData.description,
        category: formData.category, 
        tags: formData.tags, 
        phone: formData.phone,
        whatsappNumber: formData.phone, // Atualiza ambos para garantir
        deliveryTime: formData.deliveryTime,
        slug: formData.slug,
        schedule: formData.schedule,
        // Atualiza Endereço Formatado e Campos Individuais se necessário (no seu caso o type Restaurant guarda o full address)
        address: fullAddress,
        addressNeighborhood: formData.neighborhood 
    });
  };

  const availableCategories = CATEGORIES.filter(c => c.id !== 'all');
  const isIguatu = formData.city === 'Iguatu' && formData.uf === 'CE';

  const inputClassName = "w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm";
  const selectClassName = "w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white text-sm appearance-none cursor-pointer";
  const iconClassName = "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Store className="text-brand-600" /> 
          Dados da Loja
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* LOGO E CAPA (MANTIDO IGUAL) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
             <div className="relative group border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center hover:border-brand-300 transition-colors">
                <div className="w-24 h-24 rounded-full bg-gray-100 mb-2 overflow-hidden relative shadow-sm">
                    {previews.logo ? <img src={previews.logo} className="w-full h-full object-cover" alt="Logo" /> : <Store className="w-10 h-10 text-gray-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                </div>
                <p className="text-xs font-bold text-gray-500 mb-2">Logo da Loja</p>
                <button type="button" onClick={() => logoInputRef.current?.click()} className="text-xs bg-white border border-gray-300 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-gray-50"><Edit2 size={12} /> Alterar</button>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'logo')}/>
             </div>
             <div className="relative group border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center hover:border-brand-300 transition-colors">
                <div className="w-full h-24 rounded-lg bg-gray-100 mb-2 overflow-hidden relative shadow-sm">
                    {previews.cover ? <img src={previews.cover} className="w-full h-full object-cover" alt="Capa" /> : <div className="w-full h-full flex items-center justify-center text-gray-300">Sem Capa</div>}
                </div>
                <p className="text-xs font-bold text-gray-500 mb-2">Capa do App</p>
                <button type="button" onClick={() => coverInputRef.current?.click()} className="text-xs bg-white border border-gray-300 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-gray-50"><Edit2 size={12} /> Alterar</button>
                <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')}/>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Estabelecimento</label>
            <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" required />
          </div>

          {/* SLUG (LINK) */}
          <div className="bg-brand-50 p-4 rounded-xl border border-brand-100">
             <div className="flex items-center justify-between mb-2">
                 <label className="block text-sm font-bold text-brand-900 flex items-center gap-1"><LinkIcon size={16} /> Link Personalizado</label>
                 <button type="button" onClick={handleCopyLink} className="text-xs text-brand-700 font-bold hover:underline flex items-center gap-1"><Copy size={12} /> Copiar Link</button>
             </div>
             <div className="flex gap-2">
                 <div className="flex-1 relative flex items-center">
                    <span className="absolute left-3 text-gray-400 text-sm select-none">descoontai.app/?s=</span>
                    <input type="text" value={formData.slug} onChange={(e) => handleChange('slug', e.target.value)} className={`w-full pl-[135px] pr-10 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${slugStatus === 'available' ? 'border-green-300 focus:ring-green-500 bg-green-50' : slugStatus === 'taken' ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-200 focus:ring-brand-500 bg-white'}`} placeholder="sua-loja" />
                    {slugStatus === 'available' && <Check size={18} className="absolute right-3 text-green-600" />}
                    {slugStatus === 'taken' && <XCircle size={18} className="absolute right-3 text-red-600" />}
                    {slugStatus === 'checking' && <Loader2 size={18} className="absolute right-3 text-brand-600 animate-spin" />}
                 </div>
                 <Button type="button" onClick={checkSlugAvailability} disabled={slugStatus === 'checking'} className="whitespace-nowrap px-4">Validar</Button>
             </div>
             {slugMessage && <p className={`text-xs mt-2 font-medium ${slugStatus === 'taken' ? 'text-red-600' : slugStatus === 'available' ? 'text-green-600' : 'text-gray-500'}`}>{slugMessage}</p>}
          </div>

          {/* CATEGORIA (MANTIDO) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria Principal</label>
            <div className="relative">
                <Tag size={16} className={iconClassName} />
                <select value={formData.category} onChange={(e) => handleChange('category', e.target.value)} className={selectClassName}>
                    <option value="" disabled>Selecione...</option>
                    {availableCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
            </div>
          </div>

          {/* TAGS (MANTIDO) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Outras Categorias (Tags)</label>
            <div className="flex flex-wrap gap-2">
                {availableCategories.map(cat => {
                    const isSelected = formData.tags.includes(cat.id);
                    if (cat.id === formData.category) return null; 
                    return (
                        <button key={cat.id} type="button" onClick={() => toggleTag(cat.id)} className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${isSelected ? 'bg-brand-600 text-white border-brand-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                            {isSelected && <Check size={12} />} {cat.name}
                        </button>
                    );
                })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta (Bio)</label>
            <textarea value={formData.description} onChange={(e) => handleChange('description', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none h-20 resize-none" placeholder="Ex: O melhor hambúrguer artesanal da cidade..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Pedidos</label>
                <input type="text" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="(00) 00000-0000" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tempo de Entrega</label>
                <div className="relative">
                    <Clock size={16} className={iconClassName} />
                    <input type="text" value={formData.deliveryTime} onChange={(e) => handleChange('deliveryTime', e.target.value)} className={inputClassName} placeholder="Ex: 30-45" />
                </div>
            </div>
          </div>

          {/* --- NOVO BLOCO DE ENDEREÇO SEGMENTADO (IGUAL AO REGISTRO) --- */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase">
                  <MapPin size={16} /> Endereço da Loja
              </h3>
              
              <div className="grid grid-cols-3 gap-4">
                 {/* ESTADO (UF) */}
                 <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">UF</label>
                    <div className="relative">
                       <select value={formData.uf} onChange={e => handleStateChange(e.target.value)} className={selectClassName} style={{ paddingLeft: '0.5rem' }} required>
                         <option value="">UF</option>
                         {states.map(state => (<option key={state.id} value={state.sigla}>{state.sigla}</option>))}
                       </select>
                    </div>
                 </div>

                 {/* CIDADE COM BUSCA */}
                 <div className="col-span-2 relative">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Cidade</label>
                    <div className="relative">
                       <Search className={iconClassName} size={16} />
                       <input 
                         type="text"
                         value={citySearchTerm}
                         onChange={(e) => {
                            setCitySearchTerm(e.target.value);
                            setIsCityDropdownOpen(true);
                            if(e.target.value === '') handleChange('city', '');
                         }}
                         onFocus={() => setIsCityDropdownOpen(true)}
                         disabled={!formData.uf}
                         placeholder={formData.uf ? "Buscar cidade..." : "Selecione UF"}
                         className={inputClassName}
                         autoComplete="off"
                       />
                       {citySearchTerm && <button type="button" onClick={() => { setCitySearchTerm(''); handleChange('city', ''); setIsCityDropdownOpen(true); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><X size={14} /></button>}
                    </div>
                    {/* LISTA FLUTUANTE DE CIDADES */}
                    {isCityDropdownOpen && formData.uf && (
                       <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                          {filteredCities.length === 0 ? <div className="p-3 text-gray-400 text-xs text-center">Nenhuma cidade</div> : filteredCities.map(city => (
                               <button key={city.id} type="button" onClick={() => handleCitySelect(city.nome)} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm border-b border-gray-50 last:border-0">{city.nome}</button>
                          ))}
                       </div>
                    )}
                    {isCityDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsCityDropdownOpen(false)} />}
                 </div>
              </div>

              {/* BAIRRO (CLICÁVEL PARA IGUATU) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Bairro</label>
                {isIguatu ? (
                    <div className="relative">
                       <MapPin className={iconClassName} size={16} />
                       <select value={formData.neighborhood} onChange={e => handleChange('neighborhood', e.target.value)} className={selectClassName} required>
                         <option value="">Selecione o bairro...</option>
                         {IGUATU_NEIGHBORHOODS.map(b => (<option key={b} value={b}>{b}</option>))}
                       </select>
                    </div>
                ) : (
                    <div className="relative">
                       <MapPin className={iconClassName} size={16} />
                       <input type="text" value={formData.neighborhood} onChange={e => handleChange('neighborhood', e.target.value)} className={inputClassName} placeholder="Bairro" required />
                    </div>
                )}
              </div>

              {/* RUA E NUMERO */}
              <div className="flex gap-4">
                 <div className="flex-[3]">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Rua</label>
                    <input type="text" value={formData.street} onChange={e => handleChange('street', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="Nome da rua" required />
                 </div>
                 <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Nº</label>
                    <input type="text" value={formData.number} onChange={e => handleChange('number', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="123" required />
                 </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Referência</label>
                  <input type="text" value={formData.reference} onChange={e => handleChange('reference', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="Ex: Próximo ao mercado..." />
              </div>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock size={18} className="text-brand-600" /> Horários de Funcionamento</h3>
              <div className="space-y-3">
                  {DAYS_OF_WEEK.map((day) => {
                      const daySchedule = formData.schedule[day.key] || { isOpen: false, open: '08:00', close: '18:00' };
                      return (
                          <div key={day.key} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-3 w-32">
                                  <label className="relative inline-flex items-center cursor-pointer">
                                      <input type="checkbox" className="sr-only peer" checked={daySchedule.isOpen} onChange={(e) => handleScheduleChange(day.key, 'isOpen', e.target.checked)} />
                                      <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                  </label>
                                  <span className={`text-sm font-bold ${daySchedule.isOpen ? 'text-gray-800' : 'text-gray-400'}`}>{day.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <input type="time" disabled={!daySchedule.isOpen} value={daySchedule.open} onChange={(e) => handleScheduleChange(day.key, 'open', e.target.value)} className="p-1 border border-gray-300 rounded text-sm disabled:opacity-50" />
                                  <span className="text-gray-400 text-xs">até</span>
                                  <input type="time" disabled={!daySchedule.isOpen} value={daySchedule.close} onChange={(e) => handleScheduleChange(day.key, 'close', e.target.value)} className="p-1 border border-gray-300 rounded text-sm disabled:opacity-50" />
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>

          <div className="pt-6">
            <Button type="submit" isLoading={isSaving} fullWidth className="flex items-center justify-center gap-2 h-12 text-base">
              <Save size={18} />
              Salvar Perfil Completo
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};