
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from './use-toast';
import type { Firestore, User } from 'firebase/firestore';

export function useAuthActions() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Redirect user if already logged in
  useEffect(() => {
    if (!isUserLoading && user) {
      setIsSigningIn(false);
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const createUserDocument = async (firebaseUser: import('firebase/auth').User) => {
    if (!firestore) return;
    const userRef = doc(firestore as Firestore, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: 'viewer', // Default role for all new users
        last_login: serverTimestamp(),
        created_at: serverTimestamp(),
      });
    } else {
      await setDoc(userRef, { last_login: serverTimestamp() }, { merge: true });
    }
  };
  
  const handleSignInError = (error: any) => {
      console.error('Sign-in error', error);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || "An unknown error occurred during sign-in.",
      });
      setIsSigningIn(false);
  }

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      toast({ variant: "destructive", title: "Missing Credentials", description: "Please enter both email and password." });
      return;
    }
    setIsSigningIn(true);
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await createUserDocument(userCredential.user);
    } catch(error) {
        handleSignInError(error);
    }
  };
  
  const handleEmailSignUp = async () => {
     if (!email || !password) {
      toast({ variant: "destructive", title: "Missing Credentials", description: "Please enter both email and password." });
      return;
    }
    setIsSigningIn(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await createUserDocument(userCredential.user);
    } catch(error) {
        handleSignInError(error);
    }
  }

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await createUserDocument(result.user);
    } catch (error) {
      handleSignInError(error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error: any) {
      console.error('Sign-out error', error);
      toast({
        variant: "destructive",
        title: "Sign-out Failed",
        description: error.message || "An error occurred during sign-out.",
      });
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isSigningIn,
    handleEmailSignIn,
    handleEmailSignUp,
    handleGoogleSignIn,
    handleSignOut,
  };
}
