
import React, { useState, useEffect } from 'react';
import { AppMessage, AppMessageFrequency, AppMessageType } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Trash2, Zap, Loader2, Edit, XCircle, CheckCircle, ShieldAlert, Info, AlertTriangle, RefreshCw } from 'lucide-react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export const AppMessagesTab: React.FC = () => {
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AppMessageType>('info');
  const [frequency, setFrequency] = useState<AppMessageFrequency>('once_forever');
  const [actionLabel, setActionLabel] = useState('');
  const [actionLink, setActionLink] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load from Firestore
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
        const q = query(collection(db, 'system_messages'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const data: AppMessage[] = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            data.push({ 
                ...d, 
                id: doc.id,
                // Handle timestamp conversion
                createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date() 
            } as AppMessage);
        });
        setMessages(data);
    } catch (e) {
        console.error("Erro ao carregar mensagens", e);
    } finally {
        setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setActionLabel('');
    setActionLink('');
    setType('info');
    setFrequency('once_forever');
    setIsActive(true);
    setIsSubmitting(false);
  };

  const handleStartEdit = (msg: AppMessage) => {
    setEditingId(msg.id);
    setTitle(msg.title);
    setContent(msg.content);
    setType(msg.type);
    setFrequency(msg.frequency);
    setActionLabel(msg.actionLabel || '');
    setActionLink(msg.actionLink || '');
    setIsActive(msg.isActive);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setIsSubmitting(true);
    
    const payload = {
        title,
        content,
        type,
        frequency,
        actionLabel,
        actionLink,
        isActive: editingId ? isActive : true, // Se criando, true por padrão
        createdAt: editingId ? undefined : serverTimestamp() // Só define data na criação
    };

    // Remove undefined values
    if (!payload.createdAt) delete payload.createdAt;

    try {
        if (editingId) {
            await updateDoc(doc(db, 'system_messages', editingId), payload);
            alert('Mensagem atualizada com sucesso!');
        } else {
            await addDoc(collection(db, 'system_messages'), payload);
            alert('Nova mensagem publicada!');
        }
        loadMessages();
        resetForm();
    } catch (e) {
        console.error(e);
        alert('Erro ao salvar mensagem.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja EXCLUIR permanentemente esta mensagem?')) {
      try {
          await deleteDoc(doc(db, 'system_messages', id));
          setMessages(prev => prev.filter(m => m.id !== id));
          if (editingId === id) resetForm();
      } catch (e) {
          console.error(e);
          alert('Erro ao excluir.');
      }
    }
  };

  const toggleActiveInList = async (id: string, currentStatus: boolean) => {
    try {
        await updateDoc(doc(db, 'system_messages', id), { isActive: !currentStatus });
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isActive: !currentStatus } : m));
    } catch (e) {
        console.error(e);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-brand-600" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      
      {/* --- FORMULÁRIO (Criação / Edição) --- */}
      <div className={`p-6 rounded-xl border shadow-sm transition-colors ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center mb-4">
            <h3 className={`font-bold text-lg flex items-center gap-2 ${editingId ? 'text-blue-800' : 'text-gray-800'}`}>
              {editingId ? (
                <><Edit size={20} /> Editando Mensagem</>
              ) : (
                <><Zap className="text-brand-600" size={20} /> Nova Mensagem / Force Update</>
              )}
            </h3>
            
            {editingId && (
              <button 
                onClick={resetForm}
                className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-300 shadow-sm"
              >
                <XCircle size={14} /> Cancelar Edição
              </button>
            )}
        </div>

        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
           {/* Título & Conteúdo */}
           <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Título da Mensagem *</label>
                <input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 transition-shadow" 
                  required 
                  placeholder="Ex: Manutenção Programada" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Conteúdo da Mensagem *</label>
                <textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 h-24 resize-none transition-shadow" 
                  required 
                  placeholder="Ex: Estamos melhorando nossos servidores para te atender melhor..." 
                />
              </div>
           </div>
           
           {/* Configurações */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/50 p-4 rounded-lg border border-gray-200/50">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Alerta</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="info">ℹ️ Informativo (Azul)</option>
                  <option value="warning">⚠️ Alerta (Amarelo)</option>
                  <option value="force_update">⛔ Force Update (Bloqueia App)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {type === 'force_update' ? 'Usuário NÃO consegue fechar o popup.' : 'Popup comum com botão de fechar.'}
                </p>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequência de Exibição</label>
                <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="once_forever">Uma vez (Nunca mais vê)</option>
                  <option value="once_per_day">Uma vez por dia (A cada 24h)</option>
                  <option value="always">Sempre (Toda vez que abrir o app)</option>
                </select>
             </div>
           </div>

           {/* Botão de Ação */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texto do Botão (Opcional)</label>
                <input value={actionLabel} onChange={e => setActionLabel(e.target.value)} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg outline-none" placeholder="Ex: Atualizar Agora" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link do Botão (Opcional)</label>
                <input value={actionLink} onChange={e => setActionLink(e.target.value)} className="w-full p-2.5 bg-white border border-gray-300 rounded-lg outline-none" placeholder="https://play.google.com/..." />
              </div>
           </div>

           <div className="pt-2">
             <Button fullWidth isLoading={isSubmitting} className={editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-brand-600 hover:bg-brand-700'}>
                {editingId ? <><CheckCircle size={18} className="mr-2"/> Salvar Alterações</> : 'Publicar Mensagem'}
             </Button>
           </div>
        </form>
      </div>

      {/* --- LISTA DE MENSAGENS --- */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-lg">Mensagens Ativas & Histórico</h3>
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">{messages.length} mensagens</span>
        </div>

        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
               <Info size={40} className="mx-auto mb-2 opacity-30" />
               <p>Nenhuma mensagem configurada.</p>
            </div>
          )}
          
          {messages.map(msg => {
            const isEditingThis = editingId === msg.id;

            return (
              <div 
                key={msg.id} 
                className={`
                  p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row gap-4 items-start relative overflow-hidden
                  ${isEditingThis ? 'ring-2 ring-blue-400 bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:shadow-md'}
                  ${!msg.isActive && !isEditingThis ? 'opacity-60 bg-gray-50' : ''}
                `}
              >
                 {/* Borda lateral colorida baseada no tipo */}
                 <div className={`absolute left-0 top-0 bottom-0 w-1.5 
                    ${msg.type === 'force_update' ? 'bg-red-500' : msg.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}
                 `} />

                 <div className="flex-1 pl-2">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                       {/* BADGES */}
                       {msg.type === 'force_update' && (
                         <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-red-200">
                            <ShieldAlert size={12} /> FORCE UPDATE
                         </span>
                       )}
                       {msg.type === 'warning' && (
                         <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-yellow-200">
                            <AlertTriangle size={12} /> ALERTA
                         </span>
                       )}
                       {msg.type === 'info' && (
                         <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-blue-200">
                            <Info size={12} /> INFO
                         </span>
                       )}

                       {/* Frequência Badge */}
                       <span className="bg-gray-100 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded border border-gray-200 flex items-center gap-1">
                          <RefreshCw size={10} />
                          {msg.frequency === 'once_forever' ? 'Uma vez' : msg.frequency === 'once_per_day' ? 'Diário' : 'Sempre'}
                       </span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-base">{msg.title}</h4>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{msg.content}</p>

                    {(msg.actionLabel || msg.actionLink) && (
                       <div className="mt-3 text-xs bg-gray-50 p-2 rounded border border-gray-100 inline-block max-w-full truncate text-gray-500">
                          <strong>Botão:</strong> {msg.actionLabel || 'Padrão'} {msg.actionLink && `-> ${msg.actionLink}`}
                       </div>
                    )}
                 </div>

                 {/* Ações */}
                 <div className="flex items-center gap-2 w-full sm:w-auto self-start sm:self-center border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0 mt-2 sm:mt-0">
                    
                    <button 
                      onClick={() => toggleActiveInList(msg.id, msg.isActive)} 
                      className={`flex-1 sm:flex-none text-xs px-3 py-2 rounded-lg font-bold border transition-colors ${msg.isActive ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100' : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50'}`}
                    >
                      {msg.isActive ? 'Ativo' : 'Inativo'}
                    </button>

                    <button 
                      onClick={() => handleStartEdit(msg)} 
                      className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                      title="Editar Mensagem"
                    >
                      <Edit size={18} />
                    </button>

                    <button 
                      onClick={() => handleDelete(msg.id)} 
                      className="p-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                      title="Excluir Mensagem"
                    >
                      <Trash2 size={18} />
                    </button>
                 </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
