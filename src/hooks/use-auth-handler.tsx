'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { useToast } from './use-toast';

export function useAuthActions() {
  const auth = useAuth();
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
      await signInWithPopup(auth, provider);
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
