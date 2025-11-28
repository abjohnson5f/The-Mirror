import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

interface AvatarStageProps {
  videoUrl: string | null;
  currentImageUrl: string | null;
  isLoading: boolean;
  loadingMessage?: string;
}

export const AvatarStage: React.FC<AvatarStageProps> = ({ 
  videoUrl, 
  currentImageUrl, 
  isLoading, 
  loadingMessage 
}) => {
  
  // Luxury Walk-in Closet / Wardrobe background
  const fittingRoomBg = "https://images.unsplash.com/photo-1551488852-081bd4c4a6e4?q=80&w=1800&auto=format&fit=crop";

  return (
    <div className="relative w-full h-full bg-neutral-900 overflow-hidden flex items-center justify-center rounded-lg shadow-2xl border border-neutral-800">
      
      {/* 1. Base Layer: The Fitting Room Environment */}
      <div className="absolute inset-0 z-0 opacity-50">
        <img 
          src={fittingRoomBg} 
          alt="Fitting Room Background" 
          className="w-full h-full object-cover grayscale-[30%] brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      </div>

      {/* 2. Ambient Blur Layer (If content exists, adds immersion) */}
      {(currentImageUrl || videoUrl) && (
        <div className="absolute inset-0 z-0 opacity-20 blur-3xl scale-110 pointer-events-none mix-blend-overlay">
          {currentImageUrl ? (
            <img 
              src={currentImageUrl} 
              alt="Ambient" 
              className="w-full h-full object-cover"
            />
          ) : (
            <video 
              src={videoUrl || ''} 
              autoPlay 
              loop 
              muted 
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}

      {/* 3. Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-accent mb-4" />
          <p className="text-lg font-light tracking-wide">{loadingMessage || "Curating your look..."}</p>
          <p className="text-sm text-neutral-400 mt-2">This may take a moment for high-fidelity rendering.</p>
        </div>
      )}

      {/* 4. Main Content - Strictly contained */}
      <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden p-4">
        {currentImageUrl ? (
          // Static Image (Try-on result)
          <img 
            src={currentImageUrl} 
            alt="Virtual Try-On" 
            className="w-full h-full object-contain drop-shadow-2xl max-h-full max-w-full"
          />
        ) : videoUrl ? (
          // Video Loop (Veo Base)
          <video 
            src={videoUrl} 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-contain drop-shadow-2xl rounded-lg max-h-full max-w-full"
          />
        ) : (
          <div className="text-neutral-400 font-serif italic bg-black/50 px-6 py-3 rounded-full backdrop-blur-md border border-white/10">
            Step into the mirror to begin.
          </div>
        )}
      </div>

      {/* Badge */}
      <div className="absolute top-4 left-4 z-20 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-lg">
        <span className="text-xs uppercase tracking-widest text-white flex items-center gap-2">
          {currentImageUrl ? (
            <><RefreshCw className="w-3 h-3 text-accent" /> Generated Look</>
          ) : (
            <><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live 360 View</>
          )}
        </span>
      </div>
    </div>
  );
};