
import React, { useState, useEffect } from 'react';
import { Bell, Send, Trash2, Loader2, Smartphone, AlertCircle, Key, Settings } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { sendAdminNotification } from '../../Notifications/services/notificationService';

interface PushNotification {
  id: string;
  title: string;
  body: string;
  createdAt: any;
}

export const NotificationsTab: React.FC = () => {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Estados para exclusão
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'push_notifications'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data: PushNotification[] = [];
      snap.forEach(d => {
        data.push({ ...d.data(), id: d.id } as PushNotification);
      });
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Função para alterar a chave manualmente
  const handleConfigureKey = () => {
    const currentKey = localStorage.getItem('onesignal_rest_key') || '';
    const newKey = prompt(
        "🔑 Configuração OneSignal\n\nCole a 'REST API Key' correta abaixo para corrigir o erro:",
        currentKey
    );
    
    if (newKey !== null) {
        const cleanKey = newKey.trim();
        if (cleanKey.length > 5) {
            localStorage.setItem('onesignal_rest_key', cleanKey);
            alert("Chave atualizada com sucesso! Tente enviar novamente.");
        } else {
            localStorage.removeItem('onesignal_rest_key');
            alert("Chave removida/inválida.");
        }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return alert("Preencha título e mensagem");

    setIsSending(true);
    try {
      // 1. Envia via OneSignal API
      await sendAdminNotification(title, body);

      // 2. Salva no Histórico Firebase (apenas para registro)
      await addDoc(collection(db, 'push_notifications'), {
        title,
        body,
        createdAt: serverTimestamp(),
        provider: 'OneSignal'
      });

      setTitle('');
      setBody('');
      alert('Notificação enviada com sucesso para todos os usuários inscritos!');
      loadHistory();
    } catch (e: any) {
      console.error("Erro OneSignal:", e);
      
      const errorMsg = e.message || "";

      // Tratamento para chave faltando ou inválida (401/400)
      if (
          e.code === 'MISSING_KEY' || 
          errorMsg.includes('REST API Key') || 
          errorMsg.includes('401') || // Unauthorized
          errorMsg.includes('Auth')
      ) {
         if (confirm("Erro de Autenticação: A chave API parece estar incorreta ou faltando.\n\nDeseja configurar a chave correta agora?")) {
             handleConfigureKey();
         }
      } else {
         alert("Erro ao enviar: " + (e.message || "Verifique console"));
      }
    } finally {
      setIsSending(false);
    }
  };

  // Abre o modal de confirmação
  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteId(id);
  };

  // Executa a exclusão
  const confirmDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'push_notifications', deleteId));
      setNotifications(prev => prev.filter(n => n.id !== deleteId));
      setDeleteId(null);
    } catch(err: any) {
      console.error(err);
      alert("Erro ao excluir: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      
      {/* Sender Form */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
         <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Smartphone className="text-purple-600" /> Enviar Push (Via OneSignal)
             </h3>
             
             {/* BOTÃO PARA CORRIGIR A CHAVE */}
             <button 
                type="button"
                onClick={handleConfigureKey}
                className="text-xs flex items-center gap-1 text-gray-500 hover:text-purple-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-purple-200 transition-colors"
                title="Alterar API Key salva"
             >
                <Key size={14} /> Configurar Chave
             </button>
         </div>
         
         <div className="bg-purple-50 p-3 rounded-lg text-xs text-purple-800 mb-4 border border-purple-100 leading-relaxed flex gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>Esta mensagem será enviada para <strong>Todos os Usuários Inscritos</strong>. Se precisar alterar a chave de acesso, clique no botão acima.</span>
         </div>

         <form onSubmit={handleSend} className="space-y-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
               <input 
                 value={title}
                 onChange={e => setTitle(e.target.value)}
                 className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                 placeholder="Ex: 🍔 Hora do Almoço!"
                 required
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
               <textarea 
                 value={body}
                 onChange={e => setBody(e.target.value)}
                 className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none"
                 placeholder="Ex: Peça agora e ganhe entrega grátis."
                 required
               />
            </div>

            <div className="pt-2 flex gap-3">
               <Button 
                 fullWidth 
                 type="submit" 
                 isLoading={isSending}
                 className="bg-purple-600 hover:bg-purple-700 text-white"
               >
                  <Send size={18} className="mr-2" /> Enviar Notificação
               </Button>
            </div>
         </form>
      </div>

      {/* History */}
      <div>
         <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Bell size={18} /> Histórico de Envios
         </h3>

         {loading ? (
            <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-purple-600" /></div>
         ) : notifications.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed">
               <p>Nenhuma notificação enviada.</p>
            </div>
         ) : (
            <div className="space-y-3">
               {notifications.map(note => (
                  <div key={note.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-start group">
                     <div>
                        <h4 className="font-bold text-gray-900">{note.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{note.body}</p>
                        <p className="text-xs text-gray-400 mt-2">
                           Enviado em: {note.createdAt?.toDate ? note.createdAt.toDate().toLocaleString() : 'Recentemente'}
                        </p>
                     </div>
                     <button 
                       type="button"
                       onClick={(e) => handleDeleteClick(e, note.id)}
                       className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-100"
                       title="Apagar notificação"
                     >
                        <Trash2 size={20} />
                     </button>
                  </div>
               ))}
            </div>
         )}
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Notificação">
         <div className="flex flex-col items-center justify-center p-4 text-center">
             <div className="bg-red-100 p-4 rounded-full mb-3 text-red-600 animate-in zoom-in">
                <Trash2 size={32} />
             </div>
             <p className="text-gray-800 font-bold text-lg mb-1">Tem certeza?</p>
             <p className="text-gray-500 text-sm mb-6 max-w-xs">
                Isso apagará o registro do histórico administrativo.
             </p>
             
             <div className="flex gap-3 w-full">
                <Button variant="secondary" fullWidth onClick={() => setDeleteId(null)} disabled={isDeleting}>
                   Cancelar
                </Button>
                <Button fullWidth onClick={confirmDelete} isLoading={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
                   Sim, Excluir
                </Button>
             </div>
         </div>
      </Modal>

    </div>
  );
};
