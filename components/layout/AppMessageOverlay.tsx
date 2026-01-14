
import React, { useEffect, useState } from 'react';
import { AppMessage } from '../../types';
import { X, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const AppMessageOverlay: React.FC = () => {
  const [activeMessage, setActiveMessage] = useState<AppMessage | null>(null);

  useEffect(() => {
    // Escuta coleção 'system_messages' em tempo real
    // Isso garante que Force Updates cheguem a todos os usuários imediatamente
    const q = query(collection(db, 'system_messages'), where('isActive', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: AppMessage[] = [];
      snapshot.forEach((doc) => {
        // Converte timestamp do Firestore para Date ou string
        const data = doc.data();
        messages.push({ 
            ...data, 
            id: doc.id,
            // Garante que createdAt seja tratado corretamente
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt) 
        } as AppMessage);
      });

      // Processa a mensagem mais relevante
      checkForMessages(messages);
    });

    return () => unsubscribe();
  }, []);

  const checkForMessages = (activeMessages: AppMessage[]) => {
    if (activeMessages.length === 0) {
        setActiveMessage(null);
        return;
    }

    // 1. Ler histórico do usuário (quais msgs ele já viu - LocalStorage)
    const historyStr = localStorage.getItem('user_message_history');
    const history: Record<string, number> = historyStr ? JSON.parse(historyStr) : {}; 

    // Ordenar: Force Update primeiro, depois por data (mais recente)
    activeMessages.sort((a, b) => {
        if (a.type === 'force_update' && b.type !== 'force_update') return -1;
        if (b.type === 'force_update' && a.type !== 'force_update') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // 2. Encontrar a primeira mensagem elegível
    const messageToShow = activeMessages.find(msg => {
      // FORCE UPDATE: Sempre mostra se estiver ativo, ignorando histórico "visto" se for 'always' ou se for crítico
      // Mas respeitamos a flag 'frequency' para UX (ex: mostrar aviso de update uma vez por dia ao invés de bloquear loop)
      // Se for "bloqueio total", o admin deve usar frequency='always'
      
      const lastSeen = history[msg.id];

      if (msg.frequency === 'always') return true;

      if (msg.frequency === 'once_forever') {
        return !lastSeen; 
      }

      if (msg.frequency === 'once_per_day') {
        if (!lastSeen) return true;
        const oneDay = 24 * 60 * 60 * 1000;
        const now = Date.now();
        return (now - lastSeen) > oneDay; 
      }

      return false;
    });

    if (messageToShow) {
      setActiveMessage(messageToShow);
    } else {
      setActiveMessage(null);
    }
  };

  const handleAction = () => {
    if (!activeMessage) return;

    // Salvar histórico
    const historyStr = localStorage.getItem('user_message_history');
    const history = historyStr ? JSON.parse(historyStr) : {};
    history[activeMessage.id] = Date.now();
    localStorage.setItem('user_message_history', JSON.stringify(history));

    if (activeMessage.type === 'force_update') {
      if (activeMessage.actionLink) {
         window.open(activeMessage.actionLink, '_blank');
      } else {
         window.location.reload();
      }
      return;
    }

    if (activeMessage.actionLink) {
      window.open(activeMessage.actionLink, '_blank');
    }
    
    setActiveMessage(null);
  };

  const handleClose = () => {
    if (!activeMessage) return;

    // Se for Force Update, NÃO deixa fechar pelo 'X' ou backdrop (apenas pelo botão de ação)
    if (activeMessage.type === 'force_update') return;

    const historyStr = localStorage.getItem('user_message_history');
    const history = historyStr ? JSON.parse(historyStr) : {};
    history[activeMessage.id] = Date.now();
    localStorage.setItem('user_message_history', JSON.stringify(history));

    setActiveMessage(null);
  };

  if (!activeMessage) return null;

  const isForceUpdate = activeMessage.type === 'force_update';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={!isForceUpdate ? handleClose : undefined} 
      />

      {/* Modal Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header Colorido */}
        <div className={`p-4 flex items-center justify-center ${
            isForceUpdate ? 'bg-red-600' : 
            activeMessage.type === 'warning' ? 'bg-yellow-500' : 'bg-brand-600'
        }`}>
            {isForceUpdate && <ShieldAlert className="text-white w-10 h-10" />}
            {activeMessage.type === 'warning' && <AlertTriangle className="text-white w-10 h-10" />}
            {activeMessage.type === 'info' && <Info className="text-white w-10 h-10" />}
        </div>

        {!isForceUpdate && (
          <button 
            onClick={handleClose}
            className="absolute top-2 right-2 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}

        <div className="p-6 text-center">
           <h2 className="text-xl font-bold text-gray-900 mb-2">
             {activeMessage.title}
           </h2>
           <p className="text-gray-600 mb-6 leading-relaxed">
             {activeMessage.content}
           </p>

           <Button 
             fullWidth 
             size="lg" 
             onClick={handleAction}
             className={isForceUpdate ? 'bg-red-600 hover:bg-red-700' : ''}
           >
             {activeMessage.actionLabel || (isForceUpdate ? 'Atualizar Agora' : 'Entendi')}
           </Button>
        </div>
      </div>
    </div>
  );
};
