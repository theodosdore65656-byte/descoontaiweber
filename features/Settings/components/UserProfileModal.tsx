import React, { useState, useEffect } from 'react';
import { User, Lock, Mail, Loader2, AlertCircle, KeyRound, Camera } from 'lucide-react'; 
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../Auth/context/AuthContext';

// --- IMPORTAÇÕES PARA FOTO ---
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { storage } from '../../../lib/firebase';
import { compressImage } from '../../../utils/imageCompression'; // O nosso compressor

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfileName, updatePassword, resetPassword } = useAuth();
  
  const [name, setName] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  
  // Estado da Foto
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Estados de Senha
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Carrega dados quando abre
  useEffect(() => {
    if (isOpen && user) {
      setName(user.displayName || user.email?.split('@')[0] || '');
      setPhotoPreview(user.photoURL); // Carrega foto atual se tiver
      setMsg(null);
      setActiveTab('info');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setImageFile(null);
    }
  }, [isOpen, user]);

  // Quando o usuário escolhe uma foto no celular/pc
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPhotoPreview(URL.createObjectURL(file)); // Mostra preview na hora
    }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setMsg(null);

    try {
      // 1. SE TIVER FOTO NOVA -> COMPRIME E SOBE
      if (imageFile) {
         try {
            // Comprime para 500px (tamanho bom para perfil)
            const compressedFile = await compressImage(imageFile, 0.7, 500);
            
            // Salva no caminho: users/ID_DO_USUARIO/profile.jpg
            const storageRef = ref(storage, `users/${user.uid}/profile_${Date.now()}.jpg`);
            await uploadBytes(storageRef, compressedFile);
            const newPhotoURL = await getDownloadURL(storageRef);

            // Atualiza o perfil do usuário com a URL da foto
            await updateProfile(user, { photoURL: newPhotoURL });
            
         } catch (uploadErr) {
            console.error(uploadErr);
            throw new Error('Erro ao enviar a foto.');
         }
      }

      // 2. ATUALIZA O NOME
      if (name !== user.displayName) {
          await updateProfileName(name);
      }

      setMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Erro ao salvar alterações.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
        setMsg({ type: 'error', text: 'A nova senha e a confirmação não coincidem.' });
        return;
    }
    if (newPass.length < 6) {
        setMsg({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres.' });
        return;
    }

    setIsLoading(true);
    setMsg(null);
    try {
        await updatePassword(currentPass, newPass);
        setMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
    } catch (err) {
        setMsg({ type: 'error', text: 'Senha atual incorreta.' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
      if (!user?.email) {
          setMsg({ type: 'error', text: 'E-mail não disponível.' });
          return;
      }
      setIsLoading(true);
      try {
          await resetPassword(user.email);
          setMsg({ type: 'success', text: `Link enviado para ${user.email}` });
      } catch (e) {
          setMsg({ type: 'error', text: 'Erro ao enviar e-mail.' });
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Meus Dados">
       <div className="space-y-6 min-h-[400px]">
          
          {/* Abas */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
             <button 
               onClick={() => { setActiveTab('info'); setMsg(null); }}
               className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'info' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
             >
               Perfil
             </button>
             <button 
               onClick={() => { setActiveTab('password'); setMsg(null); }}
               className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'password' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
             >
               Segurança
             </button>
          </div>

          {/* Mensagem de Feedback */}
          {msg && (
             <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <AlertCircle size={16} /> {msg.text}
             </div>
          )}

          {activeTab === 'info' && (
             <form onSubmit={handleUpdateInfo} className="space-y-6 animate-in fade-in slide-in-from-left-4">
                
                {/* --- CAMPO DE FOTO (NOVO) --- */}
                <div className="flex flex-col items-center gap-2">
                   <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                         {photoPreview ? (
                           <img src={photoPreview} alt="Perfil" className="w-full h-full object-cover" />
                         ) : (
                           // Se não tem foto, mostra ícone ou iniciais
                           <span className="text-3xl font-bold text-gray-400">
                             {name?.charAt(0).toUpperCase() || <User size={32} />}
                           </span>
                         )}
                      </div>
                      
                      {/* Botão Flutuante de Câmera */}
                      <label className="absolute bottom-0 right-0 bg-brand-600 text-white p-2 rounded-full cursor-pointer hover:bg-brand-700 transition-colors shadow-sm active:scale-95">
                         <Camera size={16} />
                         <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                   </div>
                   <p className="text-xs text-gray-400">Toque na câmera para adicionar foto</p>
                </div>

                <div className="space-y-4">
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                       <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                             type="email" 
                             value={user?.email || ''} 
                             disabled 
                             className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-transparent rounded-lg text-gray-500 cursor-not-allowed"
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
                       <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                             type="text" 
                             value={name} 
                             onChange={e => setName(e.target.value)}
                             className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                             placeholder="Seu nome completo"
                          />
                       </div>
                    </div>
                </div>

                <div className="pt-2">
                  <Button fullWidth isLoading={isLoading} type="submit">
                    Salvar Alterações
                  </Button>
                </div>
             </form>
          )}

          {activeTab === 'password' && (
             <form onSubmit={handleChangePassword} className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
                   <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                         type="password" 
                         value={currentPass} 
                         onChange={e => setCurrentPass(e.target.value)}
                         className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                         placeholder="Digite sua senha atual"
                      />
                   </div>
                   <button type="button" onClick={handleForgotPassword} className="text-xs text-brand-600 font-medium mt-1 hover:underline">
                      Esqueceu sua senha?
                   </button>
                </div>

                <hr className="border-gray-100" />

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                   <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                         type="password" 
                         value={newPass} 
                         onChange={e => setNewPass(e.target.value)}
                         className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                         placeholder="Mínimo 6 caracteres"
                      />
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                   <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                         type="password" 
                         value={confirmPass} 
                         onChange={e => setConfirmPass(e.target.value)}
                         className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                         placeholder="Repita a nova senha"
                      />
                   </div>
                </div>

                <div className="pt-4">
                  <Button fullWidth isLoading={isLoading} type="submit" variant="secondary" className="bg-gray-800 text-white hover:bg-black">
                    Atualizar Senha
                  </Button>
                </div>
             </form>
          )}

       </div>
    </Modal>
  );
};