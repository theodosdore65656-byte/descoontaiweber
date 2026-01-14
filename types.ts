import { Timestamp } from 'firebase/firestore';

declare global {
  interface Window {
    OneSignalDeferred: any[];
    OneSignal: any;
  }
}

export interface AddonItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export type GroupType = 'adicional' | 'adicional_gratis' | 'acompanhamento' | 'cobertura' | 'guarnicao' | 'proteina' | 'opcao';

export interface AddonGroup {
  id: string;
  title: string; 
  type: GroupType; 
  required: boolean;
  min: number;
  max: number;
  items: AddonItem[];
}

export interface Product {
  id: string;
  restaurantId: string;
  categoryId: string;
  sectionId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  popular?: boolean;
  isActive?: boolean;
  originalPrice?: number;
  enabledGroupIds?: string[];
  analytics?: {
    cardClicks: number;
    whatsappClicks: number;
  };
}

export interface Category {
  id: string;
  name: string;
}

export interface MenuSection {
  id: string;
  name: string;
  order?: number;
}

export interface DeliveryConfig {
  type: 'fixed' | 'neighborhood';
  fixedPrice?: number;
  neighborhoodPrices?: Record<string, number>; 
}

export type DaySchedule = {
  isOpen: boolean;
  open: string;
  close: string;
};

export type WeeklySchedule = {
  [key: string]: DaySchedule;
};

export interface RatingBreakdown {
  product: number;
  delivery: number;
  service: number;
  count: number;
}

export interface Review {
  id: string;
  restaurantId: string;
  userId?: string;
  userName?: string;
  ratings: {
    product: number;
    delivery: number;
    service: number;
  };
  createdAt: any;
}

export type SubscriptionStatus = 'active' | 'overdue' | 'trial' | 'suspended';
export type PaymentMethodType = 'PIX' | 'CREDIT_CARD';

export interface Restaurant {
  id: string;
  slug?: string;
  name: string;
  rating: number;
  ratingBreakdown?: RatingBreakdown;
  deliveryTime: string;
  deliveryFee: number;
  deliveryConfig?: DeliveryConfig;
  paymentMethods?: string[];
  image: string;
  coverImage: string;
  address: string;
  addressNeighborhood?: string;
  lat: number;
  lng: number;
  whatsappNumber: string;
  instagram?: string;
  schedule?: WeeklySchedule;
  isOpen: boolean;
  isApproved?: boolean;
  hasActivePromo?: boolean;
  tags: string[];
  description?: string;
  menuSections: MenuSection[];
  addonGroups?: AddonGroup[];
  analytics?: {
    totalVisits: number;
  };
  
  subscriptionStatus?: SubscriptionStatus;
  asaasCustomerId?: string;
  nextDueDate?: any; 
  subscriptionPaymentMethod?: PaymentMethodType;
  allowCouponsOnPromo?: boolean; // Novo campo
}

export interface SelectedGrouping {
  groupId: string;
  groupTitle: string;
  items: AddonItem[];
}

export interface CartItem extends Product {
  quantity: number;
  note?: string;
  selectedGroups?: SelectedGrouping[]; 
}

export interface Story {
  id: string;
  name: string;
  image: string;
}

export type AppMessageType = 'info' | 'warning' | 'force_update';
export type AppMessageFrequency = 'once_forever' | 'once_per_day' | 'always';

export interface AppMessage {
  id: string;
  title: string;
  content: string;
  type: AppMessageType;
  frequency: AppMessageFrequency;
  isActive: boolean;
  createdAt: any;
  actionLabel?: string;
  actionLink?: string;
}

export type PromoIconType = 'love' | 'gift' | 'star' | 'rocket' | 'check' | 'warning_3d';
export type PromoFrequency = 'once' | 'daily' | 'always';

export interface PromoNotice {
  id: string;
  title: string;
  message: string;
  icon: PromoIconType;
  frequency: PromoFrequency;
  primaryButtonText: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  isActive: boolean;
  createdAt: number;
}

export interface AdBanner {
  id: string;
  image: string;
  link?: string;
  location: 'home' | 'settings';
  createdAt: number;
}

export interface AdBannerConfig {
  slideDuration: number;
}

export interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

export interface IBGECity {
  id: number;
  nome: string;
}

export interface UserLocation {
  id?: string; // ID opcional para uso no banco
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  reference?: string;
  isDefault?: boolean; // Novo campo: Principal
}