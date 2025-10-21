// DO NOT MODIFY. This file is auto-generated and managed by Firebase Studio.
'use client';
import {useEffect, useState, useRef} from 'react';
import {
  collection,
  query,
  onSnapshot,
  Query,
  DocumentData,
  doc,
  updateDoc,
} from 'firebase/firestore';

import {useFirestore} from '@/firebase';
import {errorEmitter} from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';
import type { Product } from '@/lib/types';
import { enrichProduct } from '@/lib/product-actions';


export function useCollection<T extends {id: string, status: string}>(path: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const processedIds = useRef(new Set<string>());

  const pathRef = useRef(path);
  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  useEffect(() => {
    if (!firestore) return;

    const coll = collection(firestore, pathRef.current);
    const unsubscribe = onSnapshot(
      coll,
      (snapshot) => {
        const newData = snapshot.docs.map((doc) => ({...doc.data(), id: doc.id})) as T[];
        setData(newData);
        setLoading(false);

        // --- Autonomous Enrichment ---
        if (path === 'products') {
          const productsToProcess = (newData as unknown as Product[]).filter(p => 
            p.status === 'pending' && 
            !processedIds.current.has(p.id) && 
            p.isHalalCompliant === null
          );

          if (productsToProcess.length > 0) {
            console.log(`[VORTEX AI] Detected ${productsToProcess.length} new products to process.`);
            productsToProcess.forEach(product => {
              processedIds.current.add(product.id);
              console.log(`[VORTEX AI] Auto-enriching product: ${product.name}`);
              enrichProduct(firestore, product).catch(err => {
                console.error(`[VORTEX AI] Failed to auto-enrich product ${product.id}:`, err);
                // If it fails, remove from processed so it can be retried on next snapshot
                processedIds.current.delete(product.id);
              });
            });
          }
        }
        // --- End Autonomous Enrichment ---
      },
      (error) => {
        console.error(error);
        const permissionError = new FirestorePermissionError({
          path: pathRef.current,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path]);

  return {data, loading};
}
