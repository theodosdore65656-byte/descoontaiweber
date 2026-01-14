
import React from 'react';
import { 
  Pizza, 
  Sandwich, 
  UtensilsCrossed, 
  Fish, 
  IceCream2, 
  ShoppingBag, 
  Droplets, 
  Store, 
  CakeSlice, 
  Utensils, 
  Flame, 
  Pill,
  LayoutGrid,
  Croissant,
  Coffee,
  Grape
} from 'lucide-react';

export const getCategoryIcon = (id: string, size: number = 20) => {
  switch (id) {
    case 'all': return <LayoutGrid size={size} />;
    case 'pizzaria': return <Pizza size={size} />;
    case 'hamburgueria': return <Sandwich size={size} />;
    case 'salgaderia': return <Croissant size={size} />;
    case 'pastelaria': return <Store size={size} />; // Placeholder
    case 'sushi': return <Fish size={size} />;
    case 'acai': return <Grape size={size} />; // Alterado para Grape (representando a fruta)
    case 'sorvete': return <IceCream2 size={size} />;
    case 'espetinho': return <UtensilsCrossed size={size} />;
    case 'agua': return <Droplets size={size} />;
    case 'mercantil': return <ShoppingBag size={size} />;
    case 'doces': return <CakeSlice size={size} />;
    case 'marmitaria': return <Utensils size={size} />;
    case 'churrascaria': return <Flame size={size} />;
    case 'farmacia': return <Pill size={size} />;
    default: return <Utensils size={size} />;
  }
};
