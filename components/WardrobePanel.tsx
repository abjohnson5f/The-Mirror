import React, { useState } from 'react';
import { ClothingItem, StyleCategory, ShoppingCart, UserProfile } from '../types';
import { ShoppingBag, Eye, Plus, Check, Loader2, Link as LinkIcon, ArrowRight, AlertCircle } from 'lucide-react';
import { WARDROBE_IMAGE_MAP } from '../constants';
import { describeItemFromUrl } from '../services/geminiService';

interface WardrobePanelProps {
  items: ClothingItem[];
  onTryOn: (item: ClothingItem) => void;
  carts: ShoppingCart[];
  addToCart: (item: ClothingItem, cartId: string) => void;
  isGenerating: boolean;
  isLoadingItems: boolean;
  userProfile: UserProfile | null;
}

export const WardrobePanel: React.FC<WardrobePanelProps> = ({ 
  items,
  onTryOn, 
  carts, 
  addToCart,
  isGenerating,
  isLoadingItems,
  userProfile
}) => {
  const [activeCategory, setActiveCategory] = useState<StyleCategory>(StyleCategory.WORK);
  const [selectedItemForCart, setSelectedItemForCart] = useState<string | null>(null);
  const [customLink, setCustomLink] = useState('');
  const [isAnalyzingLink, setIsAnalyzingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const filteredItems = items.filter(item => {
    if (item.category !== activeCategory) return false;
    return true;
  });

  const handleLinkSubmit = async () => {
    if (!customLink.trim()) return;
    setIsAnalyzingLink(true);
    setLinkError(null);

    try {
      // 1. Analyze the link to get description and image URL (Client-side AI call)
      const { name, description, imageUrl } = await describeItemFromUrl(customLink);
      
      let refImageBase64 = undefined;
      let refImageMime = undefined;

      // 2. Fetch the image via Backend Proxy to bypass CORS
      if (imageUrl) {
        try {
            // CALLING THE NEW BACKEND API ROUTE HERE:
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
            const response = await fetch(proxyUrl);
            
            if (response.ok) {
                const data = await response.json();
                if (data.base64 && data.mimeType) {
                    refImageBase64 = data.base64;
                    refImageMime = data.mimeType;
                }
            } else {
                console.warn("Proxy failed", await response.text());
            }
        } catch (imgErr) {
            console.warn("Proxy fetch error. Falling back to text description.", imgErr);
        }
      }

      // 3. Create a temporary item
      const tempItem: ClothingItem = {
        id: `custom-${Date.now()}`,
        brand: 'Custom Link',
        name: name,
        description: description,
        price: 0,
        imageUrl: imageUrl || WARDROBE_IMAGE_MAP['default'],
        purchaseUrl: customLink,
        category: StyleCategory.CASUAL,
        gender: userProfile?.gender || 'unisex',
        referenceImageBase64: refImageBase64,
        referenceImageMimeType: refImageMime
      };

      // 4. Trigger Try On
      onTryOn(tempItem);
      setCustomLink('');
    } catch (e) {
      console.error("Failed to analyze link", e);
      setLinkError("Could not analyze this link. Try another.");
    } finally {
      setIsAnalyzingLink(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900 text-white rounded-lg border border-neutral-800 overflow-hidden">
      
      {/* Custom Link Input Area */}
      <div className="p-4 bg-neutral-800 border-b border-neutral-700">
        <label className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2 block flex items-center gap-2">
            <LinkIcon size={12} /> Paste Product Link
        </label>
        <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={customLink}
                    onChange={(e) => setCustomLink(e.target.value)}
                    placeholder="https://brand.com/product..."
                    className="flex-1 bg-neutral-900 border border-neutral-600 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                    onKeyDown={(e) => e.key === 'Enter' && handleLinkSubmit()}
                />
                <button 
                    onClick={handleLinkSubmit}
                    disabled={isAnalyzingLink || !customLink.trim() || isGenerating}
                    className="bg-white text-black px-3 rounded hover:bg-neutral-200 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                    {isAnalyzingLink ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                </button>
            </div>
            {linkError && <span className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle size={10} /> {linkError}</span>}
        </div>
        <p className="text-[10px] text-neutral-500 mt-2 leading-relaxed">
            Paste a link. We will attempt to fetch the product image for a realistic try-on. If protected, we'll generate it based on description.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-neutral-700 bg-neutral-900">
        {Object.values(StyleCategory).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeCategory === cat 
                ? 'border-accent text-white' 
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {cat.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoadingItems ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
             <Loader2 className="w-8 h-8 animate-spin text-accent" />
             <p className="text-sm text-neutral-400">Forecasting trends for your profile...</p>
          </div>
        ) : filteredItems.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-2">
                 <p className="text-sm">No items found for this category.</p>
                 <p className="text-xs">Try switching categories.</p>
             </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="group bg-neutral-800 rounded-md overflow-hidden border border-neutral-700 hover:border-neutral-500 transition-all">
              <div className="relative aspect-[3/4] overflow-hidden">
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = WARDROBE_IMAGE_MAP['default'];
                  }}
                />
                
                {/* Overlay Buttons */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                  <button 
                    onClick={() => onTryOn(item)}
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    <Eye size={14} /> Try On
                  </button>
                  
                  <div className="relative">
                    <button 
                       onClick={() => setSelectedItemForCart(selectedItemForCart === item.id ? null : item.id)}
                       className="flex items-center gap-2 bg-accent text-black px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide hover:bg-accent-hover transition-colors"
                    >
                      <Plus size={14} /> Add to Cart
                    </button>
                    
                    {/* Cart Selection Dropdown */}
                    {selectedItemForCart === item.id && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                            {carts.map(cart => (
                                <button
                                    key={cart.id}
                                    onClick={() => {
                                        addToCart(item, cart.id);
                                        setSelectedItemForCart(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-800 flex justify-between items-center"
                                >
                                    <span className="truncate">{cart.name}</span>
                                    {cart.items.find(i => i.id === item.id) && <Check size={12} className="text-accent" />}
                                </button>
                            ))}
                        </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-3">
                <div className="flex flex-col mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{item.brand}</span>
                    <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium text-neutral-200">{item.name}</h4>
                        <span className="text-sm font-serif text-accent">${item.price}</span>
                    </div>
                </div>
                <p className="text-xs text-neutral-500 line-clamp-2">{item.description}</p>
                <a href={item.purchaseUrl} target="_blank" rel="noreferrer" className="block mt-3 text-xs text-neutral-400 hover:text-white underline decoration-neutral-600 underline-offset-4">
                    Find Online
                </a>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
};