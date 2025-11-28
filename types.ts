export enum AppState {
  API_CHECK = 'API_CHECK',
  UPLOAD = 'UPLOAD',
  GENERATING_AVATAR = 'GENERATING_AVATAR',
  DASHBOARD = 'DASHBOARD'
}

export enum StyleCategory {
  WORK = 'Professional & Work',
  DATE = 'Date Night & Going Out',
  CASUAL = 'Casual & Everyday'
}

export interface ClothingItem {
  id: string;
  brand: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string; // Placeholder or generated
  purchaseUrl: string;
  category: StyleCategory;
  gender: 'male' | 'female' | 'unisex';
  // New fields for real-product try-on
  referenceImageBase64?: string;
  referenceImageMimeType?: string;
}

export interface ShoppingCart {
  id: string;
  name: string;
  items: ClothingItem[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum ConsultantType {
  STYLE = 'Style Consultant',
  FIT = 'Fit Specialist'
}

export interface UserProfile {
  gender: 'male' | 'female' | 'neutral';
  styleProfile: string;
  fitNotes: string;
}