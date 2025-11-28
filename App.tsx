'use client';

import React, { useState, useEffect } from 'react';
import { AppState, ShoppingCart, ClothingItem, ConsultantType, UserProfile } from './types';
import { INITIAL_CARTS } from './constants';
import { generateAvatarVideo, generateTryOnImage, analyzeUserProfile, fetchTrendingWardrobe } from './services/geminiService';
import { AvatarStage } from './components/AvatarStage';
import { ConsultantChat } from './components/ConsultantChat';
import { WardrobePanel } from './components/WardrobePanel';
import { MultiCart } from './components/MultiCart';
import { Upload, AlertCircle, Sparkles, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.API_CHECK);
  const [avatarVideoUrl, setAvatarVideoUrl] = useState<string | null>(null);
  const [currentTryOnImage, setCurrentTryOnImage] = useState<string | null>(null);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [uploadedImageMimeType, setUploadedImageMimeType] = useState<string>('image/jpeg');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // User Profile from AI Analysis
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Dynamic Wardrobe
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [isLoadingWardrobe, setIsLoadingWardrobe] = useState(false);

  // Shopping Cart State
  const [carts, setCarts] = useState<ShoppingCart[]>(INITIAL_CARTS);
  
  // Consultant State
  const [consultantType, setConsultantType] = useState<ConsultantType>(ConsultantType.STYLE);

  // Check for API Key on mount
  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
          setAppState(AppState.UPLOAD);
        } else {
          setAppState(AppState.API_CHECK);
        }
      } catch (e) {
        console.error("API check failed", e);
        setAppState(AppState.API_CHECK);
      }
    };
    checkKey();
  }, []);

  const handleApiKeySelection = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // Assume success based on guidelines
        setAppState(AppState.UPLOAD);
      }
    } catch (e) {
      setError("Failed to select API key. Please try again.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract proper mime type from data URL: "data:image/png;base64,..."
      const [header, base64Data] = result.split(',');
      const mimeType = header.split(':')[1].split(';')[0];

      setUploadedImageBase64(base64Data);
      setUploadedImageMimeType(mimeType);
      
      startInitialization(base64Data, mimeType);
    };
    reader.readAsDataURL(file);
  };

  const startInitialization = async (base64: string, mimeType: string) => {
    setAppState(AppState.GENERATING_AVATAR);
    setIsLoading(true);
    setLoadingMessage("Analyzing your style & creating 360° avatar...");
    setError(null);

    // 1. Analyze Profile first to get Gender/Style for Wardrobe
    let profile: UserProfile = { gender: 'neutral', styleProfile: 'Contemporary', fitNotes: 'Standard' };
    
    try {
      profile = await analyzeUserProfile(base64, mimeType);
      console.log("User Profile Detected:", profile);
      setUserProfile(profile);
    } catch (e) {
      console.warn("Analysis failed, defaulting", e);
    }

    // 2. Parallel: Generate Video & Fetch Trending Wardrobe
    try {
      setIsLoadingWardrobe(true);
      
      const [videoUrlResult, wardrobeResult] = await Promise.allSettled([
        generateAvatarVideo(base64, mimeType),
        fetchTrendingWardrobe(profile)
      ]);

      if (wardrobeResult.status === 'fulfilled') {
        setWardrobeItems(wardrobeResult.value);
      }
      setIsLoadingWardrobe(false);

      if (videoUrlResult.status === 'fulfilled') {
        setAvatarVideoUrl(videoUrlResult.value);
      } else {
        throw new Error(videoUrlResult.reason?.message || "Video generation failed");
      }

      setAppState(AppState.DASHBOARD);
    } catch (err: any) {
      console.error(err);
      setError(`Video generation unavailable (${err.message}). Switching to static mode.`);
      setAppState(AppState.DASHBOARD);
      setIsLoadingWardrobe(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryOn = async (item: ClothingItem) => {
    if (!uploadedImageBase64) return;
    
    setIsLoading(true);
    setLoadingMessage(`Trying on ${item.brand} ${item.name}...`);
    
    try {
      // Pass the product image if available, otherwise just description
      const productImageData = (item.referenceImageBase64 && item.referenceImageMimeType)
        ? { data: item.referenceImageBase64, mimeType: item.referenceImageMimeType }
        : undefined;

      const imageUrl = await generateTryOnImage(
        uploadedImageBase64, 
        uploadedImageMimeType,
        `${item.brand} ${item.name}, ${item.description}`,
        productImageData
      );
      setCurrentTryOnImage(imageUrl);
    } catch (err) {
      console.error(err);
      setError("Failed to try on item. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCart = (name: string) => {
    const newCart: ShoppingCart = {
        id: `cart-${Date.now()}`,
        name,
        items: []
    };
    setCarts([...carts, newCart]);
  };

  const handleAddToCart = (item: ClothingItem, cartId: string) => {
    setCarts(carts.map(cart => {
        if (cart.id === cartId) {
            return { ...cart, items: [...cart.items, item] };
        }
        return cart;
    }));
  };

  const handleRemoveFromCart = (itemId: string, cartId: string) => {
    setCarts(carts.map(cart => {
        if (cart.id === cartId) {
            const index = cart.items.findIndex(i => i.id === itemId);
            if (index > -1) {
                const newItems = [...cart.items];
                newItems.splice(index, 1);
                return { ...cart, items: newItems };
            }
        }
        return cart;
    }));
  };

  // Render Logic
  if (appState === AppState.API_CHECK) {
    return (
      <div className="h-[100dvh] bg-black text-white flex flex-col items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <h1 className="text-4xl font-serif text-accent">Curated.</h1>
          <p className="text-neutral-400">Please connect your Google Cloud Project to access the Stylist Suite.</p>
          <button 
            onClick={handleApiKeySelection}
            className="bg-white text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors"
          >
            Connect API Key
          </button>
          <p className="text-xs text-neutral-600 mt-4">
             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-neutral-400">Billing Information</a>
          </p>
        </div>
      </div>
    );
  }

  if (appState === AppState.UPLOAD || appState === AppState.GENERATING_AVATAR) {
    return (
      <div className="h-[100dvh] bg-neutral-950 text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Decorative BG */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent rounded-full blur-[128px]" />
        </div>

        <div className="z-10 max-w-lg w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-serif text-white tracking-tight">The Mirror</h1>
            <p className="text-neutral-400 text-lg">Upload a full-body photo to enter your virtual fitting room.</p>
          </div>

          {appState === AppState.GENERATING_AVATAR ? (
             <div className="flex flex-col items-center space-y-4 py-12">
                <div className="relative w-24 h-24">
                   <div className="absolute inset-0 border-4 border-neutral-800 rounded-full"></div>
                   <div className="absolute inset-0 border-t-4 border-accent rounded-full animate-spin"></div>
                </div>
                <p className="text-accent animate-pulse font-medium">{loadingMessage}</p>
             </div>
          ) : (
            <div className="border-2 border-dashed border-neutral-700 rounded-2xl p-12 hover:border-accent hover:bg-neutral-900/50 transition-all group cursor-pointer relative">
               <input 
                 type="file" 
                 accept="image/*" 
                 onChange={handleFileUpload}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               />
               <Upload className="w-16 h-16 mx-auto text-neutral-600 group-hover:text-accent mb-4 transition-colors" />
               <p className="font-medium text-neutral-300">Drag & Drop or Click to Upload</p>
               <p className="text-sm text-neutral-500 mt-2">Best results with neutral background & good lighting.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-black text-white flex flex-col overflow-hidden font-sans">
      {/* Navbar */}
      <header className="h-16 flex-shrink-0 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-900/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <span className="font-serif text-black font-bold text-lg">C</span>
            </div>
            <span className="font-serif text-xl tracking-wide">CURATED</span>
            {userProfile && (
                <span className="ml-4 text-xs bg-neutral-800 px-2 py-1 rounded text-neutral-400 border border-neutral-700 hidden sm:inline-block">
                    {userProfile.gender === 'male' ? 'MENSWEAR' : userProfile.gender === 'female' ? 'WOMENSWEAR' : 'UNISEX'} MODE
                </span>
            )}
        </div>
        <div className="flex gap-4">
             <button onClick={() => setAppState(AppState.UPLOAD)} className="text-sm text-neutral-400 hover:text-white flex items-center gap-2">
                <LogOut size={16} /> Reset Session
             </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left: Wardrobe & Cart (Collapsible or Scrollable) */}
        <div className="w-1/4 min-w-[320px] max-w-md border-r border-neutral-800 flex flex-col bg-neutral-900 overflow-hidden">
           <div className="flex-1 p-4 pb-2 min-h-0">
              <WardrobePanel 
                items={wardrobeItems}
                carts={carts} 
                addToCart={handleAddToCart} 
                onTryOn={handleTryOn} 
                isGenerating={isLoading}
                isLoadingItems={isLoadingWardrobe}
                userProfile={userProfile}
              />
           </div>
           <div className="h-1/3 p-4 pt-0 min-h-0">
              <MultiCart 
                carts={carts} 
                createCart={handleCreateCart} 
                removeFromCart={handleRemoveFromCart}
              />
           </div>
        </div>

        {/* Center: Avatar Stage */}
        <div className="flex-1 p-6 flex flex-col relative bg-neutral-950 min-h-0">
           <AvatarStage 
             videoUrl={avatarVideoUrl}
             currentImageUrl={currentTryOnImage}
             isLoading={isLoading}
             loadingMessage={loadingMessage}
           />
           {/* Quick Actions overlay could go here */}
           {error && (
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-red-900/90 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm shadow-lg border border-red-700 z-50">
               <AlertCircle size={16} />
               {error}
               <button onClick={() => setError(null)} className="ml-2 hover:text-red-200">✕</button>
             </div>
           )}
        </div>

        {/* Right: Consultant Chat */}
        <div className="w-80 border-l border-neutral-800 bg-neutral-900 flex flex-col min-h-0">
            <ConsultantChat 
               consultantType={consultantType}
               setConsultantType={setConsultantType}
               userProfile={userProfile}
            />
        </div>

      </main>
    </div>
  );
};

export default App;