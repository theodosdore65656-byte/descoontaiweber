
import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Check, Info, HelpCircle, AlertTriangle, Trash2, Eye, EyeOff, Layers } from 'lucide-react';
import { Product, MenuSection, AddonGroup } from '../../../types';
import { CATEGORIES, PRODUCT_SEARCH_CATEGORIES } from '../../../constants';
import { Button } from '../../../components/ui/Button';

interface MerchantProductFormProps {
  initialData?: Product | null;
  sections: MenuSection[];
  availableAddons?: AddonGroup[]; // Recebe a lista de GRUPOS
  onSave: (product: Omit<Product, 'id'> | Product) => void;
  onCancel: () => void;
  onDeleteSection: (sectionId: string) => void;
  isSaving?: boolean;
  defaultCategory?: string; 
}

const PREDEFINED_SECTIONS = [
  "Sanduíches", "Sucos", "Refrigerantes", "Guarnições", "Sushi", "Carnes",
  "Espetos", "Porções", "Pastel", "Pizzas", "Pizzas Doces", "Hambúrguer Gourmet",
  "Bebidas", "Sobremesas", "Açaí", "Combos"
];

const MerchantProductFormComponent: React.FC<MerchantProductFormProps> = ({ 
  initialData, 
  sections, 
  availableAddons = [],
  onSave, 
  onCancel, 
  onDeleteSection, 
  isSaving = false,
  defaultCategory = '' 
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  
  const [sectionSelection, setSectionSelection] = useState<string>(
    initialData?.sectionId 
      ? initialData.sectionId 
      : (sections.length > 0 ? sections[0].id : '')
  );
  
  const [customSectionName, setCustomSectionName] = useState('');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  const [categoryId, setCategoryId] = useState(
    initialData?.categoryId || defaultCategory || PRODUCT_SEARCH_CATEGORIES[0].id
  ); 
  
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image || null);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  
  const [hasDiscount, setHasDiscount] = useState(!!initialData?.originalPrice);
  const [originalPrice, setOriginalPrice] = useState(initialData?.originalPrice?.toString() || '');
  const [showDiscountWarning, setShowDiscountWarning] = useState(false);

  // Group Selection
  const [enabledGroupIds, setEnabledGroupIds] = useState<string[]>(initialData?.enabledGroupIds || []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sectionSelection === '__NEW_CUSTOM__') {
      setIsCreatingCustom(true);
      setCustomSectionName('');
    } else if (sectionSelection.startsWith('__PREDEF__')) {
      setIsCreatingCustom(false); 
    } else {
      setIsCreatingCustom(false);
    }
  }, [sectionSelection]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Validação de Tipo
      if (!file.type.startsWith('image/')) {
        alert('Formato inválido. Por favor, envie apenas imagens (JPG, PNG).');
        return;
      }

      // 2. Validação de Tamanho (3MB)
      const MAX_SIZE = 3 * 1024 * 1024; 
      if (file.size > MAX_SIZE) {
        alert(
          'A imagem é muito grande (Máximo 3MB).\n\n' +
          'Para evitar sobrecarregar o app, diminua o tamanho aqui:\n' +
          'https://www.iloveimg.com/pt/comprimir-imagem'
        );
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const toggleGroup = (id: string) => {
    setEnabledGroupIds(prev => 
      prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !price) {
      alert('Preencha os campos obrigatórios (Nome e Preço)');
      return;
    }

    if (sectionSelection === '__NEW_CUSTOM__' && !customSectionName.trim()) {
       alert('Por favor, digite o nome da nova área do cardápio.');
       return;
    } else if (!sectionSelection) {
       alert('Selecione onde este produto vai aparecer no cardápio.');
       return;
    }

    let finalSectionId = sectionSelection;
    if (sectionSelection === '__NEW_CUSTOM__') {
      finalSectionId = `NEW:::${customSectionName.trim()}`;
    } else if (sectionSelection.startsWith('__PREDEF__')) {
      finalSectionId = `NEW:::${sectionSelection.replace('__PREDEF__', '')}`;
    }

    // CORREÇÃO: Usar /seed/ para garantir imagem fixa. ?random= muda a imagem a cada request.
    const randomSeed = Math.random().toString(36).substring(2, 10);
    const defaultImage = `https://picsum.photos/seed/${randomSeed}/300/300`;

    const payload: any = {
      name,
      description,
      categoryId, 
      sectionId: finalSectionId,  
      price: parseFloat(price.replace(',', '.')),
      image: imagePreview || defaultImage,
      isActive,
      enabledGroupIds: enabledGroupIds, // Salva os GRUPOS selecionados
      ...(initialData ? { id: initialData.id } : {})
    };

    if (hasDiscount && originalPrice) {
      payload.originalPrice = parseFloat(originalPrice.replace(',', '.'));
    } else {
      payload.originalPrice = undefined;
    }

    onSave(payload);
  };

  const availableSuggestions = PREDEFINED_SECTIONS.filter(
    sug => !sections.some(sec => sec.name.toLowerCase() === sug.toLowerCase())
  );

  const whiteInputClass = "w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none";
  const isExistingSectionSelected = !isCreatingCustom && !sectionSelection.startsWith('__PREDEF__') && sectionSelection !== '';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
      
      {/* Warning Overlay */}
      {showDiscountWarning && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm shadow-2xl relative">
             <button onClick={() => setShowDiscountWarning(false)} className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600"><X size={20} /></button>
             <div className="flex flex-col items-center text-center">
               <div className="bg-yellow-100 p-3 rounded-full mb-3"><AlertTriangle size={32} className="text-yellow-600" /></div>
               <h3 className="text-lg font-bold text-gray-900 mb-2">Destaque sua Promoção!</h3>
               <p className="text-sm text-gray-600 mb-4">Ao ativar este desconto, seu produto ganhará destaque na página principal!</p>
               <Button fullWidth onClick={() => setShowDiscountWarning(false)}>Entendi</Button>
             </div>
          </div>
        </div>
      )}

      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-gray-800">{initialData ? 'Editar Produto' : 'Novo Produto'}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        
        {/* Image Upload */}
        <div className="flex justify-center">
          <div 
            className="w-full h-40 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden group"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <><Camera size={32} className="text-gray-400 mb-2" /><span className="text-sm text-gray-500">Toque para adicionar foto</span></>
            )}
             <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white font-bold">Alterar Foto</span>
              </div>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>

        {/* Basic Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className={whiteInputClass} placeholder="Ex: X-Tudo Completo" />
        </div>

        {/* Section Selector */}
        <div className="bg-brand-50/50 p-4 rounded-lg border border-brand-100">
          <label className="block text-sm font-bold text-gray-900 mb-1">Seção do Cardápio *</label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <select value={sectionSelection} onChange={e => setSectionSelection(e.target.value)} className={`${whiteInputClass} flex-1`}>
                <option value="" disabled>Selecione ou crie...</option>
                <option value="__NEW_CUSTOM__" className="font-bold text-brand-600">+ ✨ Criar Área (Escrever nome)</option>
                {sections.length > 0 && (
                  <optgroup label="Suas Áreas Atuais">
                    {sections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
                  </optgroup>
                )}
                {availableSuggestions.length > 0 && (
                  <optgroup label="Sugestões Populares">
                    {availableSuggestions.map(sug => <option key={sug} value={`__PREDEF__${sug}`}>{sug}</option>)}
                  </optgroup>
                )}
              </select>
              {isExistingSectionSelected && (
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteSection(sectionSelection);
                  }}
                  className="bg-red-100 hover:bg-red-200 text-red-600 p-3 rounded-lg border border-red-200 flex-shrink-0 transition-all active:scale-95 active:bg-red-300"
                  title="Excluir esta seção do cardápio"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
            {isCreatingCustom && (
              <div className="animate-in fade-in slide-in-from-top-2 flex gap-2 items-center">
                <input type="text" value={customSectionName} onChange={e => setCustomSectionName(e.target.value)} placeholder="Nome da nova área" className={`${whiteInputClass} border-brand-300 bg-white ring-2 ring-brand-100 flex-1`} autoFocus />
                <div className="bg-green-100 text-green-700 p-2 rounded-lg border border-green-200"><Check size={20} /></div>
              </div>
            )}
          </div>
        </div>

        {/* Global Category Selector - USANDO A NOVA LISTA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo do Produto (Para Busca/Promo)</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={whiteInputClass}>
            {PRODUCT_SEARCH_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <p className="text-xs text-gray-500 mt-1">Este item aparecerá nas bolinhas de stories se tiver desconto.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className={`${whiteInputClass} h-20 resize-none`} placeholder="Ingredientes, tamanho..." />
        </div>

        {/* Pricing */}
        <div className="p-3 bg-gray-50 rounded-lg space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700">Precificação</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center text-xs cursor-pointer text-brand-600 font-bold">
                <input type="checkbox" checked={hasDiscount} onChange={e => { setHasDiscount(e.target.checked); if (e.target.checked) setShowDiscountWarning(true); }} className="mr-1 accent-brand-600 w-4 h-4" />
                Ativar Desconto
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            {hasDiscount && (
              <div className="flex-1 animate-in fade-in slide-in-from-right-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">De (Preço Original)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <input type="number" step="0.01" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="0,00" />
                </div>
              </div>
            )}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">{hasDiscount ? 'Por (Preço Final)' : 'Preço de Venda'}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 font-bold">R$</span>
                <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-brand-200 bg-white rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-bold text-brand-700" placeholder="0,00" />
              </div>
            </div>
          </div>
        </div>

        {/* ADDON GROUPS SELECTION - ATUALIZADO */}
        {availableAddons.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Layers size={16} className="text-brand-600"/> Personalização (Complementos)
            </h4>
            <p className="text-xs text-gray-500 mb-3">Selecione quais grupos de opções aparecem neste produto.</p>
            
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {availableAddons.map(group => (
                <label key={group.id} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${enabledGroupIds.includes(group.id) ? 'bg-brand-50 border-brand-200' : 'bg-white border-gray-200 hover:bg-gray-100'}`}>
                  <input 
                    type="checkbox"
                    checked={enabledGroupIds.includes(group.id)}
                    onChange={() => toggleGroup(group.id)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 mr-3"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{group.title}</p>
                    <div className="flex gap-2 text-[10px] text-gray-500">
                       <span className="bg-gray-100 px-1.5 py-0.5 rounded">{group.type}</span>
                       <span>{group.min > 0 ? `Obrigatório (Min ${group.min})` : 'Opcional'}</span>
                       <span>Max {group.max}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Availability Toggle */}
        <div className={`flex items-center justify-between p-4 border rounded-xl transition-colors cursor-pointer ${isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`} onClick={() => setIsActive(!isActive)}>
          <div className="flex flex-col">
             <div className="flex items-center gap-2 mb-0.5">
                {isActive ? <Eye size={18} className="text-green-600" /> : <EyeOff size={18} className="text-gray-400" />}
                <span className={`text-sm font-bold ${isActive ? 'text-green-800' : 'text-gray-500'}`}>{isActive ? 'Produto Ativo' : 'Produto Oculto'}</span>
             </div>
             <p className="text-xs text-gray-500">{isActive ? 'Visível no cardápio.' : 'Invisível para clientes.'}</p>
          </div>
          <div className={`w-14 h-8 rounded-full transition-colors relative flex items-center shadow-inner ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
            <div className={`absolute w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ease-spring ${isActive ? 'translate-x-7' : 'translate-x-1'}`} />
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <Button type="button" variant="secondary" fullWidth onClick={onCancel}>Cancelar</Button>
          <Button type="submit" fullWidth isLoading={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Produto'}</Button>
        </div>

      </form>
    </div>
  );
};

export const MerchantProductForm = React.memo(MerchantProductFormComponent);
