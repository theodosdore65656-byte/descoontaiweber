
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Sparkles, Check, AlertTriangle, Save } from 'lucide-react';
import { AddonGroup, AddonItem, GroupType } from '../../../types';
import { Button } from '../../../components/ui/Button';

interface MerchantGroupManagerProps {
  groups: AddonGroup[];
  onUpdateGroups: (newGroups: AddonGroup[]) => void;
}

// Dicionário de Correção
const FOOD_CORRECTIONS: Record<string, string> = {
  'parmezao': 'Parmesão', 'parmesao': 'Parmesão', 'musarela': 'Mussarela', 'mussarela': 'Mussarela',
  'calabreza': 'Calabresa', 'bacon': 'Bacon', 'cheedar': 'Cheddar', 'chedar': 'Cheddar',
  'catupiri': 'Catupiry', 'maionese': 'Maionese', 'ketchup': 'Ketchup', 'barbecue': 'Barbecue',
  'rucula': 'Rúcula', 'manjericao': 'Manjericão', 'cebola': 'Cebola', 'ovo': 'Ovo', 'presunto': 'Presunto',
  'batata frita': 'Batata Frita', 'pure': 'Purê', 'frango': 'Frango', 'carne': 'Carne', 'leite ninho': 'Leite Ninho',
  'morango': 'Morango', 'nutela': 'Nutella', 'confete': 'Confete', 'pacoca': 'Paçoca', 'granola': 'Granola'
};

const GROUP_TYPES: { id: GroupType; label: string }[] = [
  { id: 'adicional', label: 'Adicionais Pagos' },
  { id: 'adicional_gratis', label: 'Adicionais Inclusos' },
  { id: 'acompanhamento', label: 'Acompanhamentos' },
  { id: 'cobertura', label: 'Coberturas' },
  { id: 'guarnicao', label: 'Guarnições' },
  { id: 'proteina', label: 'Proteínas / Carnes' },
  { id: 'opcao', label: 'Opções de Preparo' },
];

export const MerchantGroupManager: React.FC<MerchantGroupManagerProps> = ({ groups, onUpdateGroups }) => {
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Refs para Scroll Automático
  const formRef = useRef<HTMLDivElement>(null);

  // Group Form State
  const [groupType, setGroupType] = useState<GroupType>('adicional');
  const [groupMin, setGroupMin] = useState(0);
  const [groupMax, setGroupMax] = useState(1);

  // Item Form State (dentro de um grupo)
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);

  // Efeito: Rolar até o formulário quando abrir
  useEffect(() => {
    if ((isCreatingGroup || editingGroupId) && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isCreatingGroup, editingGroupId]);

  // --- Group Logic ---

  const handleStartCreateGroup = () => {
    setGroupType('adicional');
    setGroupMin(0);
    setGroupMax(1);
    setIsCreatingGroup(true);
    setEditingGroupId(null);
  };

  const handleSaveGroup = () => {
    if (groupMax < groupMin) return alert('O máximo não pode ser menor que o mínimo.');
    if (groupMax < 1) return alert('O máximo deve ser pelo menos 1.');

    const required = groupMin > 0;
    
    // O título é definido automaticamente pelo label do tipo
    const typeObj = GROUP_TYPES.find(t => t.id === groupType);
    const autoTitle = typeObj ? typeObj.label : 'Grupo';

    if (editingGroupId) {
      // Atualizar Grupo Existente
      const updated = groups.map(g => g.id === editingGroupId ? { 
        ...g, 
        title: autoTitle, 
        type: groupType, 
        min: groupMin, 
        max: groupMax,
        required
      } : g);
      onUpdateGroups(updated);
      setEditingGroupId(null);
    } else {
      // Criar Novo Grupo
      const newGroup: AddonGroup = {
        id: `grp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: autoTitle,
        type: groupType,
        min: groupMin,
        max: groupMax,
        required,
        items: []
      };
      onUpdateGroups([...groups, newGroup]);
      setIsCreatingGroup(false);
    }
  };

  const handleDeleteGroup = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    
    if (deleteConfirmId === id) {
        // Confirmação Realizada
        onUpdateGroups(groups.filter(g => g.id !== id));
        setDeleteConfirmId(null);
    } else {
        // Primeiro Clique: Pedir Confirmação
        setDeleteConfirmId(id);
        // Reseta após 4 segundos se não confirmar
        setTimeout(() => setDeleteConfirmId(prev => prev === id ? null : prev), 4000);
    }
  };

  const handleEditGroupHeader = (e: React.MouseEvent, group: AddonGroup) => {
    e.preventDefault();
    e.stopPropagation();
    
    setEditingGroupId(group.id);
    setGroupType(group.type);
    setGroupMin(group.min);
    setGroupMax(group.max);
    setIsCreatingGroup(false); 
  };

  // --- Item Logic ---

  const handleNameChange = (val: string) => {
    setNewItemName(val);
    const cleanVal = val.toLowerCase().trim().replace(/[^a-z ]/g, '');
    const foundKey = Object.keys(FOOD_CORRECTIONS).find(k => k === cleanVal);
    if (foundKey && FOOD_CORRECTIONS[foundKey] !== val) {
      setSuggestion(FOOD_CORRECTIONS[foundKey]);
    } else {
      setSuggestion(null);
    }
  };

  const applySuggestion = () => {
    if (suggestion) {
      setNewItemName(suggestion);
      setSuggestion(null);
    }
  };

  const handleAddItemToGroup = (groupId: string, groupType: GroupType) => {
    if (!newItemName) return;
    
    // Se for grátis, preço é 0. Senão, faz o parse.
    let price = 0;
    if (groupType !== 'adicional_gratis') {
        price = parseFloat(newItemPrice.replace(',', '.')) || 0;
    }
    
    const newItem: AddonItem = {
      id: `itm_${Date.now()}_${Math.random().toString(36).substr(2,4)}`,
      name: newItemName,
      price: price,
      available: true
    };

    const updatedGroups = groups.map(g => {
      if (g.id === groupId) {
        return { ...g, items: [...g.items, newItem] };
      }
      return g;
    });

    onUpdateGroups(updatedGroups);
    setNewItemName('');
    setNewItemPrice('');
    setSuggestion(null);
  };

  const handleDeleteItem = (groupId: string, itemId: string) => {
    const updatedGroups = groups.map(g => {
      if (g.id === groupId) {
        return { ...g, items: g.items.filter(i => i.id !== itemId) };
      }
      return g;
    });
    onUpdateGroups(updatedGroups);
  };

  // --- Render ---

  return (
    <div className="space-y-6">
      
      {/* Botão Novo Grupo */}
      {!isCreatingGroup && !editingGroupId && (
        <Button fullWidth onClick={handleStartCreateGroup} className="bg-gray-900 hover:bg-black text-white">
          <Plus size={18} className="mr-2" /> Criar Novo Grupo
        </Button>
      )}

      {/* Formulário de Grupo */}
      {(isCreatingGroup || editingGroupId) && (
        <div ref={formRef} className="bg-gray-800 p-5 rounded-xl border border-gray-700 animate-in slide-in-from-top-4 shadow-lg scroll-mt-20">
           <h3 className="text-white font-bold mb-4 flex items-center justify-between">
             {editingGroupId ? 'Editar Regras' : 'Novo Grupo'}
             <button onClick={() => {setIsCreatingGroup(false); setEditingGroupId(null);}} className="text-gray-400 hover:text-white"><X size={20}/></button>
           </h3>

           <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Categoria (Define o Título)</label>
                <select 
                  value={groupType} 
                  onChange={e => setGroupType(e.target.value as GroupType)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-brand-500 outline-none appearance-none font-medium"
                >
                  {GROUP_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">O nome do grupo será exatamente o selecionado acima.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mínimo (Obrigatório?)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={groupMin}
                      onChange={e => setGroupMin(parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-brand-500 outline-none"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">{groupMin > 0 ? 'Obrigatório.' : 'Opcional.'}</p>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Máximo de Itens</label>
                    <input 
                      type="number" 
                      min="1"
                      value={groupMax}
                      onChange={e => setGroupMax(parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-brand-500 outline-none"
                    />
                 </div>
              </div>

              <Button fullWidth onClick={handleSaveGroup} className="mt-2">
                 <Save size={18} className="mr-2" /> Salvar Grupo
              </Button>
           </div>
        </div>
      )}

      {/* Lista de Grupos Existentes */}
      <div className="space-y-4">
        {groups.map(group => {
          const isFreeGroup = group.type === 'adicional_gratis';
          const isConfirmingDelete = deleteConfirmId === group.id;

          return (
            <div key={group.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
               
               {/* Group Header */}
               <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                     <h4 className="font-bold text-gray-800 text-base">{group.title}</h4>
                     <div className="flex gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${isFreeGroup ? 'bg-green-100 text-green-700 border-green-200' : 'bg-brand-100 text-brand-700 border-brand-200'}`}>
                           {isFreeGroup ? 'Grátis' : 'Pago'}
                        </span>
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-medium border border-gray-300">
                          {group.min > 0 ? `Min ${group.min}` : 'Opcional'} • Max {group.max}
                        </span>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button 
                       type="button"
                       onClick={(e) => handleEditGroupHeader(e, group)} 
                       className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                       title="Editar Regras"
                     >
                       <Edit2 size={18} />
                     </button>
                     
                     <button 
                       type="button"
                       onClick={(e) => handleDeleteGroup(e, group.id)} 
                       className={`p-2 rounded-lg transition-all border flex items-center gap-1 font-bold text-xs
                         ${isConfirmingDelete 
                           ? 'bg-red-600 text-white border-red-700 w-auto px-3' 
                           : 'text-red-600 hover:bg-red-50 border-transparent hover:border-red-100'
                         }
                       `}
                       title={isConfirmingDelete ? "Clique para confirmar exclusão" : "Excluir Grupo"}
                     >
                       {isConfirmingDelete ? (
                         <>Confirmar?</>
                       ) : (
                         <Trash2 size={18} />
                       )}
                     </button>
                  </div>
               </div>

               {/* Items List inside Group */}
               <div className="p-4 bg-white">
                  
                  {/* Form to Add Item to THIS Group */}
                  <div className="flex items-end gap-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                     <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Nome do Item</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Leite Condensado"
                          value={newItemName}
                          onChange={e => handleNameChange(e.target.value)}
                          className="w-full bg-white border border-gray-300 px-2 py-1.5 rounded text-sm outline-none focus:border-brand-500 text-gray-900"
                          onKeyDown={(e) => {
                             if(e.key === 'Enter') handleAddItemToGroup(group.id, group.type);
                          }}
                        />
                        {suggestion && (
                          <div onClick={applySuggestion} className="text-xs text-brand-600 cursor-pointer mt-1 flex items-center gap-1 hover:underline">
                             <Sparkles size={10} /> Sugestão: <b>{suggestion}</b>
                          </div>
                        )}
                     </div>
                     
                     {/* Campo de Preço: Só aparece se NÃO for grupo grátis */}
                     {!isFreeGroup && (
                       <div className="w-24">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Preço</label>
                          <input 
                            type="number" 
                            placeholder="0.00"
                            value={newItemPrice}
                            onChange={e => setNewItemPrice(e.target.value)}
                            className="w-full bg-white border border-gray-300 px-2 py-1.5 rounded text-sm outline-none focus:border-brand-500 text-gray-900"
                          />
                       </div>
                     )}

                     <button 
                       type="button"
                       onClick={() => handleAddItemToGroup(group.id, group.type)}
                       className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 h-[34px] w-[34px] flex items-center justify-center shrink-0"
                     >
                       <Plus size={18} />
                     </button>
                  </div>

                  <div className="space-y-1">
                     {group.items.length === 0 && <p className="text-center text-sm text-gray-400 italic py-2">Nenhum item neste grupo.</p>}
                     
                     {group.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 group/item">
                           <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                           <div className="flex items-center gap-3">
                              {/* Só mostra preço se for maior que zero */}
                              {item.price > 0 && (
                                <span className="text-sm font-bold text-brand-600">
                                   + R$ {item.price.toFixed(2)}
                                </span>
                              )}
                              <button 
                                type="button"
                                onClick={() => handleDeleteItem(group.id, item.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                title="Excluir item"
                              >
                                 <Trash2 size={18} />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
