import React, { useState } from 'react';
import { ShoppingCart, ClothingItem } from '../types';
import { ShoppingBag, Trash2, ExternalLink, Plus } from 'lucide-react';

interface MultiCartProps {
  carts: ShoppingCart[];
  createCart: (name: string) => void;
  removeFromCart: (itemId: string, cartId: string) => void;
}

export const MultiCart: React.FC<MultiCartProps> = ({ carts, createCart, removeFromCart }) => {
  const [activeCartId, setActiveCartId] = useState<string>(carts[0]?.id || '');
  const [isCreating, setIsCreating] = useState(false);
  const [newCartName, setNewCartName] = useState('');

  const activeCart = carts.find(c => c.id === activeCartId);
  const subtotal = activeCart?.items.reduce((sum, item) => sum + item.price, 0) || 0;

  const handleCreate = () => {
    if (newCartName.trim()) {
        createCart(newCartName);
        setNewCartName('');
        setIsCreating(false);
    }
  };

  return (
    <div className="h-full bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col text-white">
      {/* Cart Tabs */}
      <div className="flex overflow-x-auto p-2 border-b border-neutral-700 gap-2 no-scrollbar">
        {carts.map(cart => (
            <button
                key={cart.id}
                onClick={() => setActiveCartId(cart.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-md text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 ${
                    activeCartId === cart.id
                    ? 'bg-accent text-black'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
            >
                <ShoppingBag size={12} />
                {cart.name} ({cart.items.length})
            </button>
        ))}
        <button 
            onClick={() => setIsCreating(true)}
            className="flex-shrink-0 px-3 py-2 rounded-md text-xs bg-neutral-800 text-neutral-400 hover:text-white border border-dashed border-neutral-600 hover:border-neutral-400 transition-colors"
        >
            <Plus size={14} />
        </button>
      </div>

      {isCreating && (
          <div className="p-3 bg-neutral-800 border-b border-neutral-700 flex gap-2">
              <input 
                autoFocus
                type="text" 
                value={newCartName}
                onChange={e => setNewCartName(e.target.value)}
                placeholder="Cart Name (e.g., Vacation)"
                className="flex-1 bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
              <button onClick={handleCreate} className="text-xs bg-white text-black px-3 py-1 rounded font-bold">Add</button>
              <button onClick={() => setIsCreating(false)} className="text-xs text-neutral-400 px-2">Cancel</button>
          </div>
      )}

      {/* Active Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeCart && activeCart.items.length > 0 ? (
            activeCart.items.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex gap-3 bg-neutral-800 p-3 rounded-lg border border-neutral-700 group">
                    <img src={item.imageUrl} alt={item.name} className="w-16 h-20 object-cover rounded bg-neutral-700" />
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{item.brand}</span>
                            <div className="flex justify-between items-start">
                                <h4 className="text-sm font-medium text-neutral-200 truncate pr-2">{item.name}</h4>
                                <span className="text-sm font-serif text-accent">${item.price}</span>
                            </div>
                        </div>
                        <p className="text-xs text-neutral-500 truncate mb-2">{item.category}</p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => removeFromCart(item.id, activeCartId)}
                                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                                <Trash2 size={12} /> Remove
                            </button>
                        </div>
                    </div>
                </div>
            ))
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-neutral-600">
                <ShoppingBag size={48} className="mb-4 opacity-20" />
                <p className="text-sm">This cart is empty.</p>
                <p className="text-xs mt-1">Select items from the wardrobe to add them here.</p>
            </div>
        )}
      </div>

      {/* Footer / Checkout */}
      {activeCart && activeCart.items.length > 0 && (
          <div className="p-4 bg-neutral-800 border-t border-neutral-700">
              <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-neutral-400">Subtotal</span>
                  <span className="text-xl font-serif text-white">${subtotal.toFixed(2)}</span>
              </div>
              <button className="w-full bg-white text-black py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2">
                  Checkout Now <ExternalLink size={14} />
              </button>
          </div>
      )}
    </div>
  );
};