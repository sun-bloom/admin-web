// src/lib/firebase.ts
// Admin Dashboard — Firebase Authentication Client Module

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB0Fz9JvR_1QlW-KIiNCBaUA7ftgs4r3Ow',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sunbloom-a5e7b.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sunbloom-a5e7b',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sunbloom-a5e7b.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '539317473477',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:539317473477:web:a49e5a323f4bc382b020ac',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-XWGQPGRT6P',
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  login_hint: 'sunbloomadornwork@gmail.com',
  prompt: 'select_account',
});

export async function adminLoginWithEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function adminLoginWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function adminLogout(): Promise<void> {
  await signOut(auth);
  localStorage.removeItem('admin_token');
}

export async function getAdminIdToken(): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return await currentUser.getIdToken();
}

export function subscribeToAdminAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
