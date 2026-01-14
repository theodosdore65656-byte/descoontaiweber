import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Sparkles, DollarSign } from 'lucide-react';
import { AddonItem } from '../../../types';
import { Button } from '../../../components/ui/Button';

interface MerchantAddonsManagerProps {
  addons: AddonItem[];
  onUpdateAddons: (newAddons: AddonItem[]) => void;
}

// Dicionário simples de correções comuns
const FOOD_CORRECTIONS: Record<string, string> = {
  'parmezao': 'Parmesão',
  'parmesao': 'Parmesão',
  'musarela': 'Mussarela',
  'mussarela': 'Mussarela',
  'calabreza': 'Calabresa',
  'bacon': 'Bacon',
  'cheedar': 'Cheddar',
  'chedar': 'Cheddar',
  'catupiri': 'Catupiry',
  'maionese': 'Maionese',
  'ketchup': 'Ketchup',
  'barbecue': 'Barbecue',
  'rucula': 'Rúcula',
  'manjericao': 'Manjericão',
  'cebola': 'Cebola',
  'ovo': 'Ovo',
  'presunto': 'Presunto'
};

export const MerchantAddonsManager: React.FC<MerchantAddonsManagerProps> = ({ addons, onUpdateAddons }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);

  // Lógica de Sugestão
  const handleNameChange = (val: string) => {
    setName(val);
    const cleanVal = val.toLowerCase().trim().replace(/[^a-z]/g, ''); // Remove acentos e chars especiais para check simples
    
    // Procura correspondência parcial ou exata nas chaves
    const foundKey = Object.keys(FOOD_CORRECTIONS).find(k => k === cleanVal);
    
    if (foundKey && FOOD_CORRECTIONS[foundKey] !== val) {
      setSuggestion(FOOD_CORRECTIONS[foundKey]);
    } else {
      setSuggestion(null);
    }
  };

  const applySuggestion = () => {
    if (suggestion) {
      setName(suggestion);
      setSuggestion(null);
    }
  };

  const handleSave = () => {
    if (!name || !price) return alert('Preencha nome e preço.');

    const priceNum = parseFloat(price.replace(',', '.'));
    if (isNaN(priceNum)) return alert('Preço inválido.');

    const newAddonList = [...addons];

    if (editingId) {
      // Editando
      const index = newAddonList.findIndex(a => a.id === editingId);
      if (index >= 0) {
        newAddonList[index] = { ...newAddonList[index], name, price: priceNum };
      }
    } else {
      // Criando
      const newAddon: AddonItem = {
        id: 'add_' + Date.now() + Math.random().toString(36).substr(2, 5),
        name,
        price: priceNum,
        available: true
      };
      newAddonList.push(newAddon);
    }

    onUpdateAddons(newAddonList);
    resetForm();
  };

  const handleEdit = (addon: AddonItem) => {
    setEditingId(addon.id);
    setName(addon.name);
    setPrice(addon.price.toFixed(2).replace('.', ','));
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Excluir este adicional? Ele será removido de todos os produtos.')) {
      const newList = addons.filter(a => a.id !== id);
      onUpdateAddons(newList);
    }
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setEditingId(null);
    setIsAdding(false);
    setSuggestion(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 text-lg">Adicionais & Complementos</h3>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus size={16} className="mr-1" /> Novo Adicional
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 animate-in slide-in-from-top-2">
          <h4 className="text-sm font-bold text-gray-700 mb-3">
            {editingId ? 'Editar Adicional' : 'Criar Novo Adicional'}
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nome do Item</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Ex: Bacon Extra"
                autoFocus
              />
              {suggestion && (
                <button 
                  type="button" 
                  onClick={applySuggestion}
                  className="mt-1 text-xs flex items-center text-brand-600 font-medium hover:text-brand-700 bg-brand-50 px-2 py-1 rounded w-fit transition-colors"
                >
                  <Sparkles size={12} className="mr-1" />
                  Você quis dizer: <strong>{suggestion}</strong>?
                </button>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Valor (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={resetForm}>Cancelar</Button>
            <Button size="sm" onClick={handleSave}>Salvar Item</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {addons.length === 0 && !isAdding && (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
            <p className="text-sm">Nenhum adicional cadastrado.</p>
            <p className="text-xs">Crie complementos (ex: Bacon, Ovo) para aumentar suas vendas.</p>
          </div>
        )}

        {addons.map(addon => (
          <div key={addon.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs">
                +
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{addon.name}</p>
                <p className="text-xs text-green-600 font-semibold">R$ {addon.price.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleEdit(addon)} 
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(addon.id)} 
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};