// DO NOT MODIFY. This file is auto-generated and managed by Firebase Studio.
'use client';
import {useEffect, useState} from 'react';
import {Auth, onAuthStateChanged, User, signInAnonymously} from 'firebase/auth';

import {useAuth} from '@/firebase';

export const useUser = () => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      return;
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          setUser(user);
          setLoading(false);
        } else {
          // If no user, sign in anonymously. This is non-blocking.
          signInAnonymously(auth).catch((error) => {
             console.error("Anonymous sign-in failed:", error);
             setLoading(false);
          });
        }
      },
      (error) => {
        console.error("Auth state change error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  return {user, loading};
};
