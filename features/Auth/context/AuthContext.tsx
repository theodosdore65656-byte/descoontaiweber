import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserLocation } from '../../../types';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  createUserWithEmailAndPassword,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../../lib/firebase';

type UserRole = 'guest' | 'user' | 'merchant' | 'admin';

interface AuthContextType {
  user: User | null;
  userRole: UserRole;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>; 
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  updatePassword: (currentPass: string, newPass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  savedAddresses: UserLocation[];
  addAddress: (address: UserLocation) => void;
  updateAddress: (index: number, address: UserLocation) => void;
  removeAddress: (index: number) => void;
  setDefaultAddress: (index: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [isLoading, setIsLoading] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<UserLocation[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true);
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserRole(userData.role as UserRole);
            if (userData.addresses) setSavedAddresses(userData.addresses);
          } else {
            setUserRole('user');
            try {
               await setDoc(doc(db, 'users', currentUser.uid), {
                 email: currentUser.email,
                 role: 'user',
                 createdAt: new Date().toISOString()
               }, { merge: true });
            } catch (e) { console.error(e); }
          }
        } catch (error) { console.error(error); setUserRole('user'); }
      } else {
        setUser(null);
        setUserRole('guest');
        setSavedAddresses([]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password?: string) => {
    if (!password) throw new Error("Login requer senha.");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const register = async (email: string, password: string): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  const logout = async () => {
    await signOut(auth);
    setSavedAddresses([]);
  };

  const updateProfileName = async (name: string) => {
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
        setUser({ ...auth.currentUser, displayName: name });
    }
  };

  const updatePassword = async (currentPass: string, newPass: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) throw new Error("Usuário não autenticado.");
    const credential = EmailAuthProvider.credential(currentUser.email, currentPass);
    await reauthenticateWithCredential(currentUser, credential);
    await firebaseUpdatePassword(currentUser, newPass);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // --- LÓGICA DE ENDEREÇOS APRIMORADA ---
  
  const saveAddressesToStorage = async (addrs: UserLocation[]) => {
      setSavedAddresses(addrs);
      // Também atualiza o localStorage para backup rápido
      localStorage.setItem('user_addresses_cache', JSON.stringify(addrs));
      
      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid), { addresses: addrs }, { merge: true });
        } catch (e) { console.error("Erro ao salvar no Firebase:", e); }
      }
  };

  const addAddress = (address: UserLocation) => {
      // Verifica se já existe (para evitar duplicados)
      const existingIndex = savedAddresses.findIndex(a => 
        a.street === address.street && a.number === address.number
      );
      
      let newAddrList = [...savedAddresses];
      
      // Se já existe, remove o antigo para botar o novo
      if (existingIndex >= 0) newAddrList.splice(existingIndex, 1);
      
      // Lógica de "Forçar Padrão":
      // Se for o primeiro endereço da lista OU se o novo endereço veio marcado como isDefault
      const isFirst = newAddrList.length === 0;
      const shouldBeDefault = isFirst || address.isDefault;

      if (shouldBeDefault) {
         // Marca todos os outros como false
         newAddrList = newAddrList.map(a => ({ ...a, isDefault: false }));
         address.isDefault = true;
      }

      // Adiciona no topo
      newAddrList = [address, ...newAddrList];
      saveAddressesToStorage(newAddrList);
  };

  const updateAddress = (index: number, address: UserLocation) => {
      const newAddrList = [...savedAddresses];
      if (index >= 0 && index < newAddrList.length) {
          if (address.isDefault) {
             // Se editou para ser padrão, desmarca os outros
             newAddrList.forEach(a => a.isDefault = false);
          }
          newAddrList[index] = address;
          saveAddressesToStorage(newAddrList);
      }
  };

  const removeAddress = (index: number) => {
      const newAddr = [...savedAddresses];
      newAddr.splice(index, 1);
      saveAddressesToStorage(newAddr);
  };

  const setDefaultAddress = (index: number) => {
      let newAddr = [...savedAddresses];
      
      // 1. Desmarca todos
      newAddr = newAddr.map(a => ({ ...a, isDefault: false }));
      
      // 2. Marca o escolhido
      if (newAddr[index]) {
        newAddr[index].isDefault = true;
        
        // Opcional: Move para o topo da lista
        const item = newAddr[index];
        newAddr.splice(index, 1);
        newAddr.unshift(item);
      }

      saveAddressesToStorage(newAddr);
  };

  return (
    <AuthContext.Provider value={{ 
        user, userRole, isLoading, login, loginWithGoogle, register, logout,
        updateProfileName, updatePassword, resetPassword, savedAddresses, 
        addAddress, updateAddress, removeAddress, setDefaultAddress
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
