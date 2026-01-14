import { Category } from './types';

export const IGUATU_NEIGHBORHOODS = [
  "Aeroporto",
  "Altiplano I",
  "Altiplano II",
  "Alto do Jucá",
  "Alvorada",
  "Areias I",
  "Areias II",
  "Barreiras",
  "Barro Alto",
  "Baú",
  "Brasília",
  "Bugi",
  "Cajazeiras",
  "Cajueiro",
  "Centro",
  "Chapadinha",
  "Cocobó",
  "Cohab I",
  "Cohab II",
  "Cohab III",
  "Distrito de Alencar",
  "Esplanada I",
  "Esplanada II",
  "Esplendor",
  "Filadélfia",
  "Flores",
  "Fomento",
  "Gadelha",
  "Industrial",
  "Jardim Oásis",
  "João Paulo II",
  "Lagoa Park",
  "Lagoa Seca (Bairro Urbano)",
  "Mirante",
  "Mirante 2",
  "Novo Iguatu",
  "Novo Oriente",
  "Paraná",
  "Parque Dois Irmãos",
  "Parque e Jardins",
  "Penha",
  "Planalto",
  "Pôr do Sol",
  "Pôr do Sol II",
  "Prado",
  "Premier",
  "Riacho Vermelho",
  "Royal Ville",
  "Santo Antônio",
  "Sete de Setembro",
  "Suassurana",
  "Tabuleiro",
  "Varjota",
  "Veneza",
  "Verde Park",
  "Vila Centenário",
  "Vila Cidão",
  "Vila Coqueiros",
  "Vila Jardim",
  "Vila Moura",
  "Vila Neuma",
  "Vila Operária"
].sort();

// Lista completa de métodos disponíveis para o lojista selecionar
export const AVAILABLE_PAYMENT_METHODS = [
  'PIX',
  'Dinheiro',
  'Cartão de Crédito',
  'Cartão de Débito'
];

// Mantido para compatibilidade, mas o App deve preferir usar a config do restaurante
export const PAYMENT_METHODS = AVAILABLE_PAYMENT_METHODS;

// Categorias GERAIS do App (Filtros da Home e Cadastro de Loja)
export const CATEGORIES: Category[] = [
  { id: 'all', name: 'Todos' },
  { id: 'pizzaria', name: 'Pizzaria' },
  { id: 'hamburgueria', name: 'Hambúrgueria' },
  { id: 'salgaderia', name: 'Salgaderia' },
  { id: 'pastelaria', name: 'Pastelaria' },
  { id: 'sushi', name: 'Sushis' },
  { id: 'acai', name: 'Açaí' },
  { id: 'sorvete', name: 'Sorvetes' },
  { id: 'espetinho', name: 'Espetinhos' },
  { id: 'agua', name: 'Depósitos de Água' },
  { id: 'mercantil', name: 'Mercantil' },
  { id: 'doces', name: 'Doces e Bolos' },
  { id: 'marmitaria', name: 'Marmitarias' },
  { id: 'churrascaria', name: 'Churrascaria' },
  { id: 'farmacia', name: 'Farmácia' },
];

// NOVA LISTA: Categorias Específicas para Busca de Produto / Promoções (Stories)
// IDs mantidos compatíveis com o sistema, Nomes atualizados conforme solicitação.
export const PRODUCT_SEARCH_CATEGORIES = [
  { id: 'hamburgueria', name: 'Burger' },
  { id: 'pizzaria', name: 'Pizza' },
  { id: 'pastelaria', name: 'Pastel' },
  { id: 'sushi', name: 'Sushi' },
  { id: 'salgaderia', name: 'Salgado' },
  { id: 'acai', name: 'Açaí' },
  { id: 'sorvete', name: 'Sorvete' },
  { id: 'marmitaria', name: 'Marmitas' },
  { id: 'doces', name: 'Doces bolos' },
  { id: 'espetinho', name: 'Espetinho' },
  { id: 'farmacia', name: 'Farmácia' },
  { id: 'mercantil', name: 'Mercantil' },
  { id: 'agua', name: 'Depósito de Água' }
];