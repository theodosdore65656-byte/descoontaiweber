
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Camera, ArrowLeft, Store, Mail, Lock, Instagram, Phone,
  Loader2, Eye, EyeOff, AlertCircle, MapPin, Tag, Search, X
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../Auth/context/AuthContext';
import { IGUATU_NEIGHBORHOODS, CATEGORIES } from '../../../constants';
import { WeeklySchedule, IBGEState, IBGECity, Restaurant } from '../../../types';
import { getStates, getCitiesByState } from '../../Location/services/ibge';

// Firebase Imports
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { storage, db } from '../../../lib/firebase';

interface MerchantRegistrationScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
}

const INITIAL_SCHEDULE: WeeklySchedule = {
  'Seg': { isOpen: true, open: '18:00', close: '23:00' },
  'Ter': { isOpen: true, open: '18:00', close: '23:00' },
  'Qua': { isOpen: true, open: '18:00', close: '23:00' },
  'Qui': { isOpen: true, open: '18:00', close: '23:00' },
  'Sex': { isOpen: true, open: '18:00', close: '23:59' },
  'Sáb': { isOpen: true, open: '18:00', close: '23:59' },
  'Dom': { isOpen: true, open: '17:00', close: '23:00' },
};

export const MerchantRegistrationScreen: React.FC<MerchantRegistrationScreenProps> = ({ onBack, onSuccess }) => {
  const { register, updateProfileName } = useAuth();
  
  // --- IBGE State ---
  const [states, setStates] = useState<IBGEState[]>([]);
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // --- Form State ---
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    description: '',
    whatsapp: '',
    instagram: '',
    category: '', 
    // Address
    uf: '',
    city: '',
    neighborhood: '',
    street: '',
    number: '',
    reference: '',
    
    schedule: INITIAL_SCHEDULE
  });

  // --- CITY SEARCH STATE ---
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load States on Mount
  useEffect(() => {
    setLoadingLocations(true);
    getStates().then(data => {
      setStates(data);
      setLoadingLocations(false);
    });
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStateChange = async (uf: string) => {
    handleInputChange('uf', uf);
    handleInputChange('city', ''); // Reset city
    setCitySearchTerm(''); // Reset search text
    setLoadingLocations(true);
    const citiesData = await getCitiesByState(uf);
    setCities(citiesData);
    setLoadingLocations(false);
  };

  // Filtragem de Cidades
  const filteredCities = useMemo(() => {
    if (!citySearchTerm) return cities;
    return cities.filter(c => c.nome.toLowerCase().includes(citySearchTerm.toLowerCase()));
  }, [cities, citySearchTerm]);

  const handleCitySelect = (cityName: string) => {
    handleInputChange('city', cityName);
    setCitySearchTerm(cityName);
    setIsCityDropdownOpen(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Formato inválido. Por favor, envie apenas imagens (JPG, PNG).');
        return;
      }
      const MAX_SIZE = 3 * 1024 * 1024; // 3MB
      if (file.size > MAX_SIZE) {
        alert('A imagem é muito grande (Máximo 3MB).');
        return;
      }
      setLogoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setLogoPreview(objectUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    // Validations
    if (!formData.email || !formData.password) return setErrorMsg('Email e senha são obrigatórios.');
    if (formData.password !== formData.confirmPassword) return setErrorMsg('As senhas não coincidem.');
    if (!formData.name) return setErrorMsg('Nome do estabelecimento é obrigatório.');
    if (!formData.category) return setErrorMsg('Selecione a categoria do seu estabelecimento.');
    if (!formData.whatsapp) return setErrorMsg('WhatsApp é obrigatório para receber pedidos.');
    if (!logoFile) return setErrorMsg('A logo da loja é obrigatória.');
    
    if (!formData.uf || !formData.city || !formData.neighborhood || !formData.street || !formData.number) {
      return setErrorMsg('Por favor, preencha o endereço completo.');
    }

    setIsSubmitting(true);

    try {
        // 1. Criar Usuário no Authentication
        const userCredential = await register(formData.email, formData.password);
        const uid = userCredential.uid;
        
        await updateProfileName(formData.name);

        // 2. Upload da Logo para o Storage
        const storageRef = ref(storage, `merchants/${uid}/logo_${Date.now()}`);
        await uploadBytes(storageRef, logoFile);
        const logoUrl = await getDownloadURL(storageRef);

        // 3. Montar Objeto da Loja
        const fullAddress = `${formData.street}, ${formData.number} - ${formData.neighborhood}, ${formData.city} - ${formData.uf}`;
        
        const newMerchant: Restaurant = {
            id: uid, 
            slug: uid, // SLUG INICIAL IGUAL AO UID (Único e numérico/letras)
            name: formData.name,
            whatsappNumber: formData.whatsapp,
            instagram: formData.instagram,
            rating: 5.0, 
            deliveryTime: '30-45 min',
            deliveryFee: 0,
            address: fullAddress,
            addressNeighborhood: formData.neighborhood,
            lat: 0, 
            lng: 0,
            image: logoUrl,
            coverImage: 'https://via.placeholder.com/800x400?text=Capa+da+Loja', 
            isOpen: true,
            isApproved: false, 
            menuSections: [],
            schedule: formData.schedule,
            tags: [formData.category], 
            deliveryConfig: {
                type: 'fixed',
                fixedPrice: 0,
                neighborhoodPrices: {}
            },
            analytics: { totalVisits: 0 }
        };

        await setDoc(doc(db, 'merchants', uid), newMerchant);

        await setDoc(doc(db, 'users', uid), {
            email: formData.email,
            role: 'merchant',
            createdAt: new Date()
        });

        if (onSuccess) {
            onSuccess();
        } else {
            alert('Cadastro realizado! Aguarde a aprovação do administrador.');
            onBack();
        }

    } catch (error: any) {
        console.error("Erro no cadastro:", error);
        if (error.code === 'auth/email-already-in-use') {
            setErrorMsg('Este e-mail já está cadastrado.');
        } else {
            setErrorMsg('Ocorreu um erro ao criar a conta. Tente novamente.');
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const inputClassName = "w-full pl-10 pr-4 py-3 bg-gray-800 border border-transparent text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-gray-700 outline-none transition-colors";
  const iconClassName = "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400";
  const selectClassName = "w-full pl-10 pr-4 py-3 bg-gray-800 border border-transparent text-white rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-gray-700 outline-none appearance-none cursor-pointer";

  const isIguatu = formData.city === 'Iguatu' && formData.uf === 'CE';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-20 border-b border-gray-200 flex items-center">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="ml-2 text-lg font-bold text-gray-900">Cadastro de Parceiro</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-lg mx-auto">
        
        {errorMsg && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-2 border border-red-100 animate-in fade-in">
             <AlertCircle size={20} className="shrink-0 mt-0.5" />
             <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        {/* 1. Acesso */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Lock size={16} /> Dados de Acesso
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail className={iconClassName} size={18} />
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className={inputClassName}
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock className={iconClassName} size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  className={`${inputClassName} pr-12`}
                  placeholder="********"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha <span className="text-red-500">*</span></label>
              <div className="relative">
                <Lock className={iconClassName} size={18} />
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={e => handleInputChange('confirmPassword', e.target.value)}
                  className={`${inputClassName} pr-12`}
                  placeholder="********"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* 2. Informações Básicas */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Store size={16} /> Dados da Loja
          </h2>
          
          <div className="flex flex-col items-center mb-6">
            <div 
              className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden hover:bg-gray-50 transition-colors relative group"
              onClick={() => fileInputRef.current?.click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <Camera size={24} />
                  <span className="text-xs mt-1">Logo</span>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleLogoUpload}
            />
            <p className="text-xs text-gray-400 mt-2">Max. 3MB (Obrigatório)</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Estabelecimento <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-transparent text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Ex: Burger King"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria Principal <span className="text-red-500">*</span></label>
              <div className="relative">
                 <Tag className={iconClassName} size={18} />
                 <select 
                   value={formData.category}
                   onChange={e => handleInputChange('category', e.target.value)}
                   className={selectClassName}
                   required
                 >
                   <option value="">Selecione o tipo de loja...</option>
                   {CATEGORIES.filter(cat => cat.id !== 'all').map(cat => (
                     <option key={cat.id} value={cat.id}>{cat.name}</option>
                   ))}
                 </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea 
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-transparent text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none h-20 resize-none"
                placeholder="O melhor hambúrguer da cidade..."
              />
            </div>
          </div>
        </section>

        {/* 3. Endereço da Loja */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <MapPin size={16} /> Endereço da Loja
              </h2>
              {loadingLocations && <Loader2 size={16} className="animate-spin text-brand-600" />}
           </div>

           <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                 <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado <span className="text-red-500">*</span></label>
                    <div className="relative">
                       <select 
                         value={formData.uf} 
                         onChange={e => handleStateChange(e.target.value)}
                         className={selectClassName}
                         style={{ paddingLeft: '1rem' }}
                         required
                       >
                         <option value="">UF</option>
                         {states.map(state => (
                           <option key={state.id} value={state.sigla}>{state.sigla}</option>
                         ))}
                       </select>
                    </div>
                 </div>

                 {/* CIDADE COM BUSCA (CUSTOM DROPDOWN) */}
                 <div className="col-span-2 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade <span className="text-red-500">*</span></label>
                    <div className="relative">
                       <Search className={iconClassName} size={18} />
                       <input 
                         type="text"
                         value={citySearchTerm} // Mostra o termo ou a cidade selecionada
                         onChange={(e) => {
                            setCitySearchTerm(e.target.value);
                            setIsCityDropdownOpen(true);
                            if(e.target.value === '') handleInputChange('city', '');
                         }}
                         onFocus={() => setIsCityDropdownOpen(true)}
                         // onBlur={() => setTimeout(() => setIsCityDropdownOpen(false), 200)} // Delay p/ clique funcionar
                         disabled={!formData.uf}
                         placeholder={formData.uf ? "Digite para buscar..." : "Selecione o Estado"}
                         className={inputClassName}
                         autoComplete="off"
                       />
                       {/* Botão X para limpar */}
                       {citySearchTerm && (
                         <button 
                           type="button"
                           onClick={() => { setCitySearchTerm(''); handleInputChange('city', ''); setIsCityDropdownOpen(true); }}
                           className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                         >
                           <X size={16} />
                         </button>
                       )}
                    </div>

                    {/* LISTA FILTRADA FLUTUANTE */}
                    {isCityDropdownOpen && formData.uf && (
                       <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                          {filteredCities.length === 0 ? (
                             <div className="p-3 text-gray-500 text-sm text-center">Nenhuma cidade encontrada</div>
                          ) : (
                             filteredCities.map(city => (
                               <button
                                 key={city.id}
                                 type="button"
                                 onClick={() => handleCitySelect(city.nome)}
                                 className="w-full text-left px-4 py-3 text-white hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-0 text-sm"
                               >
                                 {city.nome}
                               </button>
                             ))
                          )}
                       </div>
                    )}
                    {/* Backdrop transparente para fechar ao clicar fora */}
                    {isCityDropdownOpen && (
                       <div className="fixed inset-0 z-40" onClick={() => setIsCityDropdownOpen(false)} />
                    )}
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bairro <span className="text-red-500">*</span></label>
                {isIguatu ? (
                    <div className="relative">
                       <MapPin className={iconClassName} size={18} />
                       <select 
                         value={formData.neighborhood}
                         onChange={e => handleInputChange('neighborhood', e.target.value)}
                         className={selectClassName}
                         required
                       >
                         <option value="">Selecione o bairro...</option>
                         {IGUATU_NEIGHBORHOODS.map(b => (
                           <option key={b} value={b}>{b}</option>
                         ))}
                       </select>
                    </div>
                ) : (
                    <div className="relative">
                       <MapPin className={iconClassName} size={18} />
                       <input 
                         type="text" 
                         value={formData.neighborhood}
                         onChange={e => handleInputChange('neighborhood', e.target.value)}
                         className={inputClassName}
                         placeholder="Ex: Centro"
                         required
                       />
                    </div>
                )}
              </div>

              <div className="flex gap-4">
                 <div className="flex-[3]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rua <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.street}
                      onChange={e => handleInputChange('street', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-transparent text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                      placeholder="Nome da rua"
                      required
                    />
                 </div>
                 <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nº <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.number}
                      onChange={e => handleInputChange('number', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-transparent text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                      placeholder="123"
                      required
                    />
                 </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referência</label>
                  <input 
                    type="text" 
                    value={formData.reference}
                    onChange={e => handleInputChange('reference', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-transparent text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="Ex: Próximo ao mercado..."
                  />
              </div>

           </div>
        </section>

        {/* 4. Contatos */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Phone size={16} /> Contatos
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp <span className="text-red-500">*</span></label>
              <div className="relative">
                 <Phone className={iconClassName} size={18} />
                 <input 
                   type="tel" 
                   value={formData.whatsapp}
                   onChange={e => handleInputChange('whatsapp', e.target.value)}
                   className={inputClassName}
                   placeholder="(XX) 99999-9999"
                   required
                 />
              </div>
              <p className="text-xs text-gray-500 mt-1">Este número receberá os pedidos dos clientes.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram <span className="text-gray-400 font-normal">(Opcional)</span></label>
              <div className="relative">
                 <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <input 
                   type="text" 
                   value={formData.instagram}
                   onChange={e => handleInputChange('instagram', e.target.value)}
                   className={inputClassName}
                   placeholder="@seurestaurante"
                 />
              </div>
            </div>
          </div>
        </section>

        <div className="pt-4 pb-10">
          <Button fullWidth size="lg" type="submit" isLoading={isSubmitting}>
            {isSubmitting ? 'Salvando dados...' : 'Finalizar Cadastro'}
          </Button>
        </div>
      </form>
    </div>
  );
};
