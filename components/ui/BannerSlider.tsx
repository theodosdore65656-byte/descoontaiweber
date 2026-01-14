
import React, { useState, useEffect } from 'react';
import { AdBanner, AdBannerConfig } from '../../types';
import { ExternalLink, Loader2 } from 'lucide-react';

interface BannerSliderProps {
  location: 'home' | 'settings';
  aspectRatio?: string; // Class name for aspect ratio (e.g., 'aspect-[2/1]', 'h-36')
}

export const BannerSlider: React.FC<BannerSliderProps> = ({ location, aspectRatio = 'h-36' }) => {
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [config, setConfig] = useState<AdBannerConfig>({ slideDuration: 5 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load Banners
  useEffect(() => {
    const load = () => {
      try {
        const storedBanners = localStorage.getItem('app_ad_banners');
        const storedConfig = localStorage.getItem('app_ad_config');
        
        if (storedBanners) {
          const all: AdBanner[] = JSON.parse(storedBanners);
          // Filter by location and Sort by newest
          const filtered = all
            .filter(b => b.location === location)
            .sort((a, b) => b.createdAt - a.createdAt);
          setBanners(filtered);
        }

        if (storedConfig) {
          setConfig(JSON.parse(storedConfig));
        }
      } catch (e) {
        console.error("Erro ao carregar banners", e);
      } finally {
        setLoading(false);
      }
    };
    load();
    
    // Listen to storage events (simple way to update if admin changes in another tab, 
    // though in SPA navigation it updates on mount)
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, [location]);

  // Auto Slide Logic
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, config.slideDuration * 1000);

    return () => clearInterval(interval);
  }, [banners.length, config.slideDuration]);

  const handleBannerClick = (banner: AdBanner) => {
    if (banner.link) {
      window.open(banner.link, '_blank');
    }
  };

  if (loading) return (
    <div className={`w-full ${aspectRatio} bg-gray-200 animate-pulse rounded-xl flex items-center justify-center`}>
       <Loader2 className="animate-spin text-gray-400" />
    </div>
  );

  // Fallback se não houver banners configurados (Mostra um padrão)
  if (banners.length === 0) {
     const fallbackImage = location === 'home' 
        ? "https://picsum.photos/800/350?random=food_banner_default"
        : "https://picsum.photos/800/350?random=ads_banner_settings_default";
     
     return (
       <div className={`w-full ${aspectRatio} rounded-xl overflow-hidden shadow-sm relative bg-gray-200 group`}>
           <img 
             src={fallbackImage}
             alt="Banner Padrão" 
             className="w-full h-full object-cover"
           />
           {/* Publicidade Label */}
           <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-white/90 font-medium uppercase tracking-wider border border-white/10">
             Publicidade
           </div>
       </div>
     );
  }

  return (
    <div className={`w-full ${aspectRatio} rounded-xl overflow-hidden shadow-sm relative bg-gray-100 group`}>
       {banners.map((banner, index) => (
         <div 
           key={banner.id}
           onClick={() => handleBannerClick(banner)}
           className={`
             absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out cursor-pointer
             ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}
           `}
         >
            <img 
              src={banner.image} 
              alt="Banner Publicidade" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
            
            {banner.link && (
               <div className="absolute bottom-2 right-2 bg-white/20 backdrop-blur-md p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink size={14} />
               </div>
            )}
         </div>
       ))}

       {/* Indicators (Dots) */}
       {banners.length > 1 && (
         <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
         </div>
       )}
       
       {/* Label */}
       <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-white/90 font-medium uppercase tracking-wider border border-white/10 z-20 pointer-events-none">
          Publicidade
       </div>
    </div>
  );
};
