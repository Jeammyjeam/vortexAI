// DO NOT MODIFY. This file is auto-generated and managed by Firebase Studio.
'use client';
import {useEffect, useState, useRef} from 'react';
import {doc, onSnapshot} from 'firebase/firestore';

import {useFirestore} from '@/firebase';
import {errorEmitter} from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

export function useDoc<T extends {id: string}>(path: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const pathRef = useRef(path);
  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  useEffect(() => {
    if (!firestore) return;

    const docRef = doc(firestore, pathRef.current);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setData({ ...snapshot.data(), id: snapshot.id } as T);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        const permissionError = new FirestorePermissionError({
          path: pathRef.current,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore]);

  return {data, loading};
}
