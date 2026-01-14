import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDqM5SctrCUVVR4X5p-LntzcuCxXtxUKJY",
  authDomain: "descoontai-a546a.firebaseapp.com",
  projectId: "descoontai-a546a",
  storageBucket:  "descoontai-a546a. firebasestorage.app",
  messagingSenderId: "963476566342",
  appId: "1:963476566342:web:c3833bd3d85ea3a341b547"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
