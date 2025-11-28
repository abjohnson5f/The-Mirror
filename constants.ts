import { ClothingItem, StyleCategory } from './types';

export const INITIAL_CARTS = [
  { id: 'cart-1', name: 'Fall Refresh', items: [] },
  { id: 'cart-2', name: 'Client Meetings', items: [] },
];

// Reliable Unsplash IDs for fashion items - Curated for "Product Photography" style
export const WARDROBE_IMAGE_MAP: Record<string, string> = {
  // --- MENSWEAR ---
  'mens_blazer_dark': 'https://images.unsplash.com/photo-1594938298603-c8148c47e356?q=80&w=800&auto=format&fit=crop', // Navy/Dark Blazer
  'mens_blazer_light': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop', // Beige/Light Blazer
  'mens_jacket_leather': 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?q=80&w=800&auto=format&fit=crop', // Leather Jacket
  'mens_jacket_casual': 'https://images.unsplash.com/photo-1559551409-dadc959f76b8?q=80&w=800&auto=format&fit=crop', // Bomber/Casual
  'mens_coat_long': 'https://images.unsplash.com/photo-1544923246-77307dd654cb?q=80&w=800&auto=format&fit=crop', // Overcoat
  'mens_shirt_white': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop', // White Tee/Shirt
  'mens_shirt_dress': 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=800&auto=format&fit=crop', // Button down
  'mens_knit_dark': 'https://images.unsplash.com/photo-1610652492500-ded49ceeb378?q=80&w=800&auto=format&fit=crop', // Dark sweater
  'mens_knit_light': 'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?q=80&w=800&auto=format&fit=crop', // Light sweater
  'mens_pants_dark': 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=800&auto=format&fit=crop', // Dark trousers
  'mens_pants_light': 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=800&auto=format&fit=crop', // Chinos
  'mens_denim_dark': 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?q=80&w=800&auto=format&fit=crop', // Dark Denim
  'mens_shoes_dress': 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?q=80&w=800&auto=format&fit=crop', // Oxford/Loafer
  'mens_shoes_boot': 'https://images.unsplash.com/photo-1638318252277-3e66df96f9a0?q=80&w=800&auto=format&fit=crop', // Chelsea Boot
  'mens_shoes_sneaker': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop', // White sneaker

  // --- WOMENSWEAR ---
  'womens_blazer_black': 'https://images.unsplash.com/photo-1584039805625-f772ef919926?q=80&w=800&auto=format&fit=crop',
  'womens_coat_trench': 'https://images.unsplash.com/photo-1552873822-793575990526?q=80&w=800&auto=format&fit=crop',
  'womens_dress_black': 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=800&auto=format&fit=crop',
  'womens_dress_casual': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop',
  'womens_top_white': 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?q=80&w=800&auto=format&fit=crop',
  'womens_knit_neutral': 'https://images.unsplash.com/photo-1603344797033-f0f4f587ab40?q=80&w=800&auto=format&fit=crop',
  'womens_pants_black': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=800&auto=format&fit=crop',
  'womens_denim_classic': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop',
  'womens_shoes_heel': 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=800&auto=format&fit=crop',
  'womens_shoes_boot': 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=800&auto=format&fit=crop',

  // --- FALLBACK ---
  'default': 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop'
};