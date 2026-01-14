
import React, { useState } from 'react';
import { Mail, Lock, ArrowLeft, Store, Loader2, ChevronRight, X, User, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface LoginScreenProps {
  onBack?: () => void;
  onNavigateToMerchantRegistration: () => void;
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onBack, 
  onNavigateToMerchantRegistration,
  onLoginSuccess 
}) => {
  // Navigation State
  const [view, setView] = useState<'intro' | 'email_form' | 'register_form'>('intro');
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle, register, updateProfileName, resetPassword } = useAuth();
  
  // Form Data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Helper function to check roles
  const determineRole = (emailInput: string): 'user' | 'merchant' | 'admin' => {
    const cleanEmail = emailInput.trim().toLowerCase();
    
    // LISTA DE EMAILS DE ADMIN
    if (cleanEmail === 'descoontai@gmail.com' || cleanEmail === 'admin@admin.com') {
      return 'admin';
    } 
    
    if (cleanEmail.includes('loja')) {
      return 'merchant';
    }

    return 'user';
  };

  // Handlers
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await loginWithGoogle();
      onLoginSuccess();
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/unauthorized-domain') {
         setErrorMsg('Domínio não autorizado no Firebase. Adicione este URL no console do Firebase > Authentication > Settings.');
      } else {
         setErrorMsg('Erro ao conectar com Google. Tente novamente.');
      }
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      // CORREÇÃO: Usar .trim() no email para evitar erros de espaços em branco (auth/invalid-credential)
      await login(email.trim(), password);
      onLoginSuccess();
    } catch (error: any) {
      console.error("Login Error:", error.code, error.message);
      
      // Mapeamento de erros do Firebase para mensagens amigáveis
      if (
        error.code === 'auth/invalid-credential' || 
        error.code === 'auth/user-not-found' || 
        error.code === 'auth/wrong-password'
      ) {
         setErrorMsg('E-mail ou senha incorretos. Verifique ou cadastre-se.');
      } else if (error.code === 'auth/too-many-requests') {
         setErrorMsg('Muitas tentativas. Tente novamente mais tarde.');
      } else if (error.code === 'auth/unauthorized-domain') {
         setErrorMsg('Domínio não autorizado. Verifique o console do Firebase.');
      } else if (error.code === 'auth/invalid-email') {
         setErrorMsg('Formato de e-mail inválido.');
      } else {
         setErrorMsg('Erro ao fazer login. Verifique suas credenciais.');
      }
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Digite seu e-mail no campo acima para recuperar a senha.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await resetPassword(cleanEmail);
      setSuccessMsg('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setErrorMsg('E-mail não cadastrado.');
      } else {
        setErrorMsg('Erro ao enviar e-mail. Verifique o endereço.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Por favor, informe seu nome.');
      return;
    }

    setIsLoading(true);

    try {
      const cleanEmail = email.trim();
      // 1. Determina a role baseada no email (Admin, User, etc)
      const role = determineRole(cleanEmail);

      // 2. Cria o usuário no Firebase Auth
      const user = await register(cleanEmail, password);
      
      // 3. Salva os dados do usuário no Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: cleanEmail,
        role: role,
        createdAt: new Date().toISOString()
      });
      
      // 4. Atualiza o nome do perfil no Auth
      await updateProfileName(name);

      // 5. Sucesso
      onLoginSuccess();
    } catch (error: any) {
      console.error("Register Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMsg('Este e-mail já está em uso. Tente fazer login.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMsg('E-mail inválido.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setErrorMsg('Domínio não autorizado no Firebase. Configure no Console.');
      } else {
        setErrorMsg('Erro ao criar conta. Tente novamente.');
      }
      setIsLoading(false);
    }
  };

  // Imagem fornecida
  const BG_IMAGE = "https://github.com/descoontai-ops/imagenspp/blob/main/gigapixel-Gemini_Generated_Image_qcyaxmqcyaxmqcya3%20(1).png?raw=true";

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col overflow-hidden">
      
      {/* 1. Área da Imagem (Fundo) */}
      <div className="absolute inset-0 z-0">
        <img 
          src={BG_IMAGE} 
          alt="Entregador Descoontaí" 
          // AJUSTADO: object-center para centralizar, scale-110 para zoom leve, e -translate-y para subir a imagem
          className="w-full h-full object-cover object-center scale-110 -translate-y-[15%] sm:translate-y-0 sm:scale-100 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
      </div>

      {/* Botão Voltar (Apenas se onBack for fornecido - ou seja, não for fluxo inicial obrigatório) */}
      {onBack && view === 'intro' && (
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 z-10 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all shadow-lg"
        >
          <X size={24} />
        </button>
      )}

      {/* 2. Conteúdo (Bottom Sheet) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col justify-end">
        <div className="bg-white rounded-t-[32px] p-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-10 duration-500 max-h-[90vh] overflow-y-auto">
          
          {/* VIEW 1: INTRO */}
          {view === 'intro' && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-5">
                 <div className="inline-block bg-brand-50 px-3 py-1 rounded-full border border-brand-100 mb-3">
                    <span className="text-brand-600 text-[10px] font-bold uppercase tracking-wider">O app da cidade</span>
                 </div>
                 <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-2">
                   Bateu aquela <br/>
                   <span className="text-brand-600">fome de desconto?</span>
                 </h1>
                 <p className="text-gray-500 text-sm sm:text-base leading-snug">
                   Peça comida, água ou mercado com os melhores preços.
                 </p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 active:scale-[0.98] transition-all relative group"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin text-gray-400" />
                  ) : (
                    <>
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold">Continuar com Google</span>
                    </>
                  )}
                </button>

                <Button fullWidth size="lg" variant="primary" onClick={() => setView('email_form')} className="py-3.5 rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2">
                  <Mail size={18} />
                  <span>Entrar com E-mail</span>
                </Button>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                 <p className="text-gray-400 text-[10px] mb-1">Tem um negócio?</p>
                 <button onClick={onNavigateToMerchantRegistration} className="inline-flex items-center text-sm font-bold text-gray-600 hover:text-brand-600 transition-colors">
                   <Store size={16} className="mr-1.5" /> Cadastrar meu Estabelecimento <ChevronRight size={14} className="ml-0.5" />
                 </button>
              </div>
            </div>
          )}

          {/* VIEW 2: LOGIN COM E-MAIL */}
          {view === 'email_form' && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
               <div className="flex items-center gap-2 mb-4">
                 <button onClick={() => setView('intro')} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={24} /></button>
                 <h2 className="text-xl font-bold text-gray-900">Acessar com E-mail</h2>
               </div>

               {errorMsg && (
                 <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4 font-medium border border-red-100 flex items-center animate-in shake">{errorMsg}</div>
               )}
               
               {successMsg && (
                 <div className="bg-green-50 text-green-700 text-xs p-3 rounded-lg mb-4 font-medium border border-green-200 flex items-center animate-in fade-in">{successMsg}</div>
               )}

               <form onSubmit={handleEmailLogin} className="space-y-3">
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Seu E-mail</label>
                     <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="exemplo@email.com" className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent focus:bg-white focus:border-brand-500 rounded-xl text-sm outline-none transition-all placeholder:text-gray-400" />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Sua Senha</label>
                     <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="********" className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent focus:bg-white focus:border-brand-500 rounded-xl text-sm outline-none transition-all placeholder:text-gray-400" />
                     </div>
                  </div>
                  
                  {/* Link Esqueceu Senha */}
                  <div className="flex justify-end pt-1">
                    <button 
                      type="button" 
                      onClick={handleForgotPassword}
                      className="text-xs text-brand-600 font-bold hover:underline"
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>

                  <div className="pt-2">
                    <Button fullWidth size="lg" isLoading={isLoading} className="rounded-xl py-3.5 text-base font-bold shadow-xl shadow-brand-500/20">
                      Fazer Login
                    </Button>
                  </div>
               </form>
               
               <div className="mt-6 pt-4 border-t border-gray-100 text-center space-y-3">
                 <div className="text-sm text-gray-600">
                    Ainda não tem conta? <br/>
                    <button type="button" onClick={() => { setErrorMsg(''); setView('register_form'); }} className="text-brand-600 font-bold hover:underline mt-1 inline-block">Cadastre-se gratuitamente</button>
                 </div>
               </div>
            </div>
          )}

          {/* VIEW 3: CADASTRO */}
          {view === 'register_form' && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
               <div className="flex items-center gap-2 mb-4">
                 <button onClick={() => setView('email_form')} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={24} /></button>
                 <div><h2 className="text-xl font-bold text-gray-900 leading-none">Criar Conta</h2><p className="text-xs text-gray-500 mt-0.5">Preencha seus dados para começar</p></div>
               </div>
               {errorMsg && (<div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4 font-medium border border-red-100 flex items-center animate-in shake">{errorMsg}</div>)}

               <form onSubmit={handleRegister} className="space-y-3">
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Seu Nome</label>
                     <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Como quer ser chamado?" className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent focus:bg-white focus:border-brand-500 rounded-xl text-sm outline-none transition-all placeholder:text-gray-400" />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Seu E-mail</label>
                     <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="exemplo@email.com" className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent focus:bg-white focus:border-brand-500 rounded-xl text-sm outline-none transition-all placeholder:text-gray-400" />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Criar Senha</label>
                     <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent focus:bg-white focus:border-brand-500 rounded-xl text-sm outline-none transition-all placeholder:text-gray-400" />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Confirmar Senha</label>
                     <div className="relative">
                        <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repita a senha" className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent focus:bg-white focus:border-brand-500 rounded-xl text-sm outline-none transition-all placeholder:text-gray-400" />
                     </div>
                  </div>

                  <div className="pt-2">
                    <Button fullWidth size="lg" isLoading={isLoading} className="rounded-xl py-3.5 text-base font-bold shadow-xl shadow-brand-500/20 bg-green-600 hover:bg-green-700 active:bg-green-700">
                      Criar Conta Grátis
                    </Button>
                  </div>
               </form>
               <div className="mt-4 text-center"><p className="text-xs text-gray-400">Ao se cadastrar, você concorda com nossos <a href="#" className="underline">Termos de Uso</a>.</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
