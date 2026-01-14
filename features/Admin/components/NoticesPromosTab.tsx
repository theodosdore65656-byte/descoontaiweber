
import React, { useState, useEffect } from 'react';
import { PromoNotice, PromoIconType, PromoFrequency } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { PromoModal } from '../../../components/ui/PromoModal';
import { Modal } from '../../../components/ui/Modal';
import { 
  Trash2, Edit, Plus, Megaphone, Repeat,  
  Eye, CheckCircle2, XCircle, Loader2,
  PauseCircle, PlayCircle, StopCircle, AlertTriangle
} from 'lucide-react';

// Firebase
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

const ICONS_3D: Record<PromoIconType, string> = {
  love: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Hearts.png',
  gift: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Wrapped%20Gift.png',
  star: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Star.png',
  rocket: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png',
  check: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Check%20Mark%20Button.png',
  warning_3d: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Symbols/Warning.png'
};

export const NoticesPromosTab: React.FC = () => {
  const [notices, setNotices] = useState<PromoNotice[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [icon, setIcon] = useState<PromoIconType>('love');
  const [frequency, setFrequency] = useState<PromoFrequency>('once');
  const [primaryBtn, setPrimaryBtn] = useState('Eu quero!');
  const [primaryLink, setPrimaryLink] = useState('');
  const [secondaryBtn, setSecondaryBtn] = useState('Agora não');
  const [isActive, setIsActive] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Data Firestore
  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    setLoading(true);
    try {
        const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const data: PromoNotice[] = [];
        snapshot.forEach(doc => data.push({ ...doc.data(), id: doc.id } as PromoNotice));
        setNotices(data);
    } catch (e) {
        console.error("Erro ao carregar notices", e);
    } finally {
        setLoading(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setTitle('');
    setMessage('');
    setIcon('love');
    setFrequency('once');
    setPrimaryBtn('Ver Detalhes');
    setPrimaryLink('');
    setSecondaryBtn('Agora não');
    setIsActive(true);
    setIsSubmitting(false);
  };

  const handleEdit = (notice: PromoNotice) => {
    setIsEditing(true);
    setEditId(notice.id);
    setTitle(notice.title);
    setMessage(notice.message);
    setIcon(notice.icon);
    setFrequency(notice.frequency);
    setPrimaryBtn(notice.primaryButtonText);
    setPrimaryLink(notice.primaryButtonLink || '');
    setSecondaryBtn(notice.secondaryButtonText || '');
    setIsActive(notice.isActive);
    
    const formElement = document.getElementById('promo-form-anchor');
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !message || !primaryBtn) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title,
      message,
      icon,
      frequency,
      primaryButtonText: primaryBtn,
      primaryButtonLink: primaryLink,
      secondaryButtonText: secondaryBtn,
      isActive,
      createdAt: Date.now()
    };

    try {
        if (editId) {
            await updateDoc(doc(db, 'notices', editId), payload);
            alert('Aviso atualizado com sucesso!');
        } else {
            await addDoc(collection(db, 'notices'), payload);
            alert('Novo aviso criado com sucesso!');
        }
        loadNotices(); // Reload
        resetForm();
    } catch (e) {
        console.error(e);
        alert('Erro ao salvar.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmationId) return;
    
    setIsDeleting(true);
    try {
        await deleteDoc(doc(db, 'notices', deleteConfirmationId));
        setNotices(prev => prev.filter(n => n.id !== deleteConfirmationId));
        
        // Se estava editando o item excluído, limpa o form
        if (editId === deleteConfirmationId) resetForm();
        
        setDeleteConfirmationId(null);
    } catch (e) {
        console.error(e);
        alert('Erro ao excluir. Verifique sua conexão.');
    } finally {
        setIsDeleting(false);
    }
  };

  const toggleStatus = async (id: string) => {
    const current = notices.find(n => n.id === id);
    if(!current) return;

    const newStatus = !current.isActive;

    try {
        await updateDoc(doc(db, 'notices', id), { isActive: newStatus });
        setNotices(prev => prev.map(n => n.id === id ? { ...n, isActive: newStatus } : n));
    } catch (e) {
        console.error(e);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in pb-20" id="promo-form-anchor">
      
      {/* 1. Editor Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Form */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                 {isEditing ? <Edit size={20} className="text-blue-600"/> : <Plus size={20} className="text-brand-600"/>}
                 {isEditing ? 'Editar Aviso' : 'Novo Aviso / Promo'}
              </h3>
              {isEditing && (
                <button onClick={resetForm} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-600 transition-colors">
                  Cancelar
                </button>
              )}
           </div>

           <form onSubmit={handleSubmit} className="space-y-4">
              {/* Título & Msg */}
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Título (Destaque)</label>
                 <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Ex: Pesquisa de Satisfação" required />
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem (Corpo)</label>
                 <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none h-20 resize-none" placeholder="O que você achou do nosso app?..." required />
              </div>

              {/* Icon & Frequency */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ícone 3D</label>
                    <select value={icon} onChange={e => setIcon(e.target.value as any)} className="w-full p-2.5 bg-white border rounded-lg outline-none">
                       <option value="love">🥰 Amor / Feedback</option>
                       <option value="gift">🎁 Presente / Promo</option>
                       <option value="star">⭐ Estrela / VIP</option>
                       <option value="rocket">🚀 Foguete / Novidade</option>
                       <option value="check">✅ Sucesso / Info</option>
                       <option value="warning_3d">⚠️ Atenção</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequência</label>
                    <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className="w-full p-2.5 bg-white border rounded-lg outline-none">
                       <option value="once">Uma vez apenas</option>
                       <option value="daily">Uma vez por dia</option>
                       <option value="always">Sempre (Toda vez que abrir)</option>
                    </select>
                 </div>
              </div>

              {/* Buttons Config */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Botão Principal</label>
                    <input value={primaryBtn} onChange={e => setPrimaryBtn(e.target.value)} className="w-full p-2.5 border rounded-lg outline-none" placeholder="Texto do Botão" required />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link (Opcional)</label>
                    <input value={primaryLink} onChange={e => setPrimaryLink(e.target.value)} className="w-full p-2.5 border rounded-lg outline-none" placeholder="https://..." />
                 </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Botão Secundário (Texto)</label>
                 <input value={secondaryBtn} onChange={e => setSecondaryBtn(e.target.value)} className="w-full p-2.5 border rounded-lg outline-none" placeholder="Ex: Agora não (Deixe vazio para esconder)" />
              </div>

              <div className="pt-2">
                 <Button fullWidth type="submit" isLoading={isSubmitting} className={isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-brand-600 hover:bg-brand-700'}>
                    {isEditing ? 'Salvar Alterações' : 'Criar Aviso'}
                 </Button>
              </div>
           </form>
        </div>

        {/* Live Preview */}
        <div className="flex flex-col items-center justify-center bg-gray-100 rounded-xl border border-gray-200 p-8 relative overflow-hidden">
           <div className="absolute top-4 left-4 bg-white/80 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider text-gray-500">Preview em Tempo Real</div>
           <div className="bg-black/20 w-full max-w-sm rounded-[32px] p-4 backdrop-blur-sm border border-white/10 shadow-inner">
               <PromoModal 
                  title={title || 'Título do Aviso'}
                  message={message || 'Sua mensagem aparecerá aqui com este visual moderno.'}
                  icon={icon}
                  primaryButtonText={primaryBtn || 'Botão Principal'}
                  secondaryButtonText={secondaryBtn}
                  onPrimaryClick={() => {}}
                  onClose={() => {}}
                  previewMode={true}
               />
           </div>
        </div>
      </div>

      {/* 2. List of Notices */}
      <div className="mt-8">
         <div className="flex items-center gap-2 mb-4">
            <Megaphone className="text-gray-800" size={20} />
            <h3 className="font-bold text-gray-800 text-lg">Avisos Ativos <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full ml-1">{notices.length}</span></h3>
         </div>

         {notices.length === 0 && (
            <div className="p-10 text-center text-gray-400 bg-white rounded-xl border border-dashed">
               <p>Nenhum aviso criado ainda.</p>
            </div>
         )}

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {notices.map(notice => (
               <div key={notice.id} className={`bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center relative group transition-all duration-300 ${!notice.isActive ? 'opacity-60 grayscale-[0.8] hover:grayscale-0 hover:opacity-100' : 'hover:shadow-md hover:-translate-y-1'}`}>
                  
                  <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${notice.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />

                  <div className="w-16 h-16 mb-4 mt-2 transition-transform duration-300 group-hover:scale-110">
                     <img 
                        src={ICONS_3D[notice.icon]} 
                        alt="Icon" 
                        className="w-full h-full object-contain" 
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                     />
                  </div>

                  <h4 className="font-bold text-gray-900 mb-1">{notice.title}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{notice.message}</p>
                  
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                     <span className="text-[10px] bg-gray-50 border border-gray-200 px-2 py-1 rounded flex items-center gap-1 text-gray-600">
                        <Repeat size={10} /> 
                        {notice.frequency === 'once' ? '1x (Única)' : notice.frequency === 'daily' ? 'Diária' : 'Sempre'}
                     </span>
                     <span className={`text-[10px] px-2 py-1 rounded font-bold border ${notice.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {notice.isActive ? 'ATIVO' : 'PAUSADO'}
                     </span>
                  </div>

                  <div className="flex items-center justify-center gap-3 w-full border-t border-gray-100 pt-4 mt-auto relative z-10">
                     <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleStatus(notice.id); }}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer bg-white border border-transparent hover:border-gray-200"
                        title={notice.isActive ? 'Pausar Aviso' : 'Ativar Aviso'}
                     >
                        {notice.isActive ? (
                           <StopCircle size={22} className="text-gray-400 hover:text-orange-500 pointer-events-none" />
                        ) : (
                           <PlayCircle size={22} className="text-green-500 pointer-events-none" />
                        )}
                     </button>
                     
                     <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleEdit(notice); }}
                        className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer bg-white border border-transparent hover:border-blue-100"
                        title="Editar"
                     >
                        <Edit size={22} className="pointer-events-none" />
                     </button>

                     <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmationId(notice.id); }}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer bg-white border border-transparent hover:border-red-100"
                        title="Excluir"
                     >
                        <Trash2 size={22} className="pointer-events-none" />
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Confirmation Modal */}
      <Modal 
        isOpen={!!deleteConfirmationId} 
        onClose={() => setDeleteConfirmationId(null)} 
        title="Excluir Aviso"
      >
        <div className="flex flex-col items-center justify-center pt-2 pb-2">
            <div className="bg-red-100 p-4 rounded-full mb-4">
               <AlertTriangle size={32} className="text-red-600" />
            </div>
            <p className="text-center text-gray-900 font-medium mb-1">
               Tem certeza que deseja excluir?
            </p>
            <p className="text-center text-sm text-gray-500 mb-6">
               Esta ação não poderá ser desfeita.
            </p>
            
            <div className="flex gap-3 w-full">
                <Button 
                  variant="secondary" 
                  fullWidth 
                  onClick={() => setDeleteConfirmationId(null)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button 
                  fullWidth 
                  onClick={confirmDelete}
                  isLoading={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Sim, Excluir
                </Button>
            </div>
        </div>
      </Modal>

    </div>
  );
};
