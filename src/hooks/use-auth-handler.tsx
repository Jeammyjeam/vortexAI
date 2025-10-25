'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { useToast } from './use-toast';
import type { Firestore } from 'firebase/firestore';

export function useAuthActions() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
      setIsSigningIn(false);
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const createUserDocument = async (user: import('firebase/auth').User) => {
    const userRef = doc(firestore as Firestore, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'viewer', // Default role for new users
        last_login: serverTimestamp(),
        created_at: serverTimestamp(),
      });
    } else {
        await setDoc(userRef, { last_login: serverTimestamp() }, { merge: true });
    }
  };

  const handleEmailSignIn = () => {
    if (!email || !password) {
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "Email and password cannot be empty.",
        });
        return;
    }
    setIsSigningIn(true);
    initiateEmailSignIn(auth, email, password);
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await createUserDocument(result.user);
      // The useEffect will handle the redirect
    } catch (error: any) {
      console.error('Google sign-in error', error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "An error occurred during Google sign-in.",
      });
      setIsSigningIn(false);
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
        title: "Uh oh! Something went wrong.",
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
    handleGoogleSignIn,
    handleSignOut,
  };
}
