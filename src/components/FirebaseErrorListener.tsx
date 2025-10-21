// DO NOT MODIFY. This file is auto-generated and managed by Firebase Studio.
'use client';

import {useEffect} from 'react';

import {useToast} from '@/hooks/use-toast';
import {errorEmitter} from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

export function FirebaseErrorListener() {
  const {toast} = useToast();

  useEffect(() => {
    const unsubscribe = errorEmitter.on('permission-error', async (error) => {
      if (error instanceof FirestorePermissionError) {
        toast({
          variant: 'destructive',
          title: 'Firestore Permission Error',
          description: error.toString(),
        });
      }
    });
    return () => unsubscribe();
  }, [toast]);

  return null;
}
