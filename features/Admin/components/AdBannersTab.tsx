
import React, { useState, useEffect, useRef } from 'react';
import { AdBanner, AdBannerConfig } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Trash2, Upload, Link as LinkIcon, Clock, Image as ImageIcon, LayoutTemplate, Settings, ExternalLink, Loader2, Save } from 'lucide-react';

export const AdBannersTab: React.FC = () => {
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [config, setConfig] = useState<AdBannerConfig>({ slideDuration: 5 });
  const [loading, setLoading] = useState(true);

  // Form State
  const [location, setLocation] = useState<'home' | 'settings'>('home');
  const [link, setLink] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Config State
  const [tempDuration, setTempDuration] = useState(5);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedBanners = localStorage.getItem('app_ad_banners');
    const storedConfig = localStorage.getItem('app_ad_config');

    if (storedBanners) setBanners(JSON.parse(storedBanners));
    if (storedConfig) {
      const cfg = JSON.parse(storedConfig);
      setConfig(cfg);
      setTempDuration(cfg.slideDuration);
    }
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Validação de Tipo
      if (!file.type.startsWith('image/')) {
        alert('Formato inválido. Envie apenas imagens.');
        return;
      }

      // 2. Validação de Tamanho (3MB) - Crucial para LocalStorage
      const MAX_SIZE = 3 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        alert(
          'A imagem é muito grande (Máx 3MB) e não pode ser salva.\n\n' +
          'Por favor, comprima aqui: https://www.iloveimg.com/pt/comprimir-imagem'
        );
        return;
      }

      // Convert to Base64 to persist in LocalStorage
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview) return alert('Selecione uma imagem.');

    setIsSubmitting(true);

    const newBanner: AdBanner = {
      id: Math.random().toString(36).substr(2, 9),
      image: imagePreview,
      link: link.trim() || undefined,
      location,
      createdAt: Date.now()
    };

    const updatedBanners = [newBanner, ...banners]; // Add to top
    setBanners(updatedBanners);
    localStorage.setItem('app_ad_banners', JSON.stringify(updatedBanners));

    // Reset Form
    setImagePreview(null);
    setLink('');
    setIsSubmitting(false);
    alert('Banner adicionado com sucesso!');
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este banner?')) {
      const updated = banners.filter(b => b.id !== id);
      setBanners(updated);
      localStorage.setItem('app_ad_banners', JSON.stringify(updated));
    }
  };

  const handleConfigUpdate = () => {
    const newConfig = { slideDuration: tempDuration };
    setConfig(newConfig);
    localStorage.setItem('app_ad_config', JSON.stringify(newConfig));
    alert('Tempo de transição atualizado!');
  };

  const homeBanners = banners.filter(b => b.location === 'home');
  const settingsBanners = banners.filter(b => b.location === 'settings');

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      
      {/* 1. Header & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Upload Form */}
         <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
               <Upload size={20} className="text-brand-600" /> Adicionar Novo Banner
            </h3>
            
            <form onSubmit={handleAddBanner} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Location Select */}
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Onde vai aparecer?</label>
                     <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => setLocation('home')}
                          className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${location === 'home' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                           <LayoutTemplate size={16} /> Home (Topo)
                        </button>
                        <button 
                          type="button"
                          onClick={() => setLocation('settings')}
                          className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${location === 'settings' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                           <Settings size={16} /> Configs (Anúncio)
                        </button>
                     </div>
                  </div>

                  {/* Link Input */}
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Link de Redirecionamento (Opcional)</label>
                     <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                          type="text" 
                          value={link}
                          onChange={e => setLink(e.target.value)}
                          placeholder="https://site.com ou vacap"
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                        />
                     </div>
                  </div>
               </div>

               {/* Image Input */}
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Banner</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden group bg-gray-50"
                  >
                     {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                     ) : (
                        <div className="flex flex-col items-center text-gray-400">
                           <ImageIcon size={32} className="mb-2" />
                           <span className="text-sm">Clique para fazer upload</span>
                           <span className="text-xs opacity-70 mt-1">Recomendado: 800x350px (JPG/PNG)</span>
                        </div>
                     )}
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-bold text-sm">Alterar Imagem</span>
                     </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  <p className="text-xs text-gray-400 mt-1 text-center">Máximo 3MB. Utilize o iloveimg.com se precisar comprimir.</p>
               </div>

               <div className="pt-2">
                  <Button fullWidth disabled={isSubmitting} isLoading={isSubmitting} type="submit">
                     {isSubmitting ? 'Salvando...' : 'Publicar Banner'}
                  </Button>
               </div>
            </form>
         </div>

         {/* Settings Panel */}
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
               <Settings size={20} className="text-gray-600" /> Configurações
            </h3>
            
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                     <Clock size={16} /> Tempo por Slide (Segundos)
                  </label>
                  <div className="flex gap-2">
                     <input 
                        type="number" 
                        min="2" 
                        max="30"
                        value={tempDuration}
                        onChange={e => setTempDuration(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                     />
                     <button 
                       onClick={handleConfigUpdate}
                       className="bg-gray-900 text-white px-4 rounded-lg hover:bg-black transition-colors"
                     >
                       <Save size={18} />
                     </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Tempo que cada banner fica visível antes de passar para o próximo.</p>
               </div>
            </div>
         </div>
      </div>

      {/* 2. Banner Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         
         {/* Home Banners List */}
         <div>
            <div className="flex items-center justify-between mb-3 px-1">
               <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <LayoutTemplate size={18} /> Banners da Home
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">{homeBanners.length}</span>
               </h3>
            </div>
            
            <div className="space-y-3">
               {homeBanners.length === 0 && <p className="text-sm text-gray-400 italic">Nenhum banner ativo na Home.</p>}
               {homeBanners.map(banner => (
                  <BannerListItem key={banner.id} banner={banner} onDelete={handleDelete} />
               ))}
            </div>
         </div>

         {/* Settings Banners List */}
         <div>
            <div className="flex items-center justify-between mb-3 px-1">
               <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Settings size={18} /> Banners de Configurações
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">{settingsBanners.length}</span>
               </h3>
            </div>

            <div className="space-y-3">
               {settingsBanners.length === 0 && <p className="text-sm text-gray-400 italic">Nenhum banner ativo nas Configurações.</p>}
               {settingsBanners.map(banner => (
                  <BannerListItem key={banner.id} banner={banner} onDelete={handleDelete} />
               ))}
            </div>
         </div>

      </div>

    </div>
  );
};

// Helper Component for List Item
const BannerListItem: React.FC<{ banner: AdBanner; onDelete: (id: string) => void }> = ({ banner, onDelete }) => (
   <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex gap-3 items-center group hover:border-brand-200 transition-colors">
      <div className="w-24 h-14 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
         <img src={banner.image} alt="Banner" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
         <p className="text-xs text-gray-400 font-mono mb-0.5">ID: {banner.id}</p>
         {banner.link ? (
            <a href={banner.link} target="_blank" rel="noreferrer" className="text-sm text-brand-600 hover:underline flex items-center gap-1 truncate">
               <ExternalLink size={12} /> {banner.link}
            </a>
         ) : (
            <span className="text-sm text-gray-500 italic">Sem link</span>
         )}
      </div>
      <button 
         onClick={() => onDelete(banner.id)}
         className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
         title="Excluir Banner"
      >
         <Trash2 size={18} />
      </button>
   </div>
);
