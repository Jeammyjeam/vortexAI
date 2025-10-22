
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
  writeBatch,
  getDoc,
} from 'firebase/firestore';

import {useFirestore} from '@/firebase';
import {errorEmitter} from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';
import type { Product, AppConfig } from '@/lib/types';
import { enrichProduct } from '@/lib/product-actions';
import { autoSchedulePosts } from '@/ai/flows/auto-schedule-posts';
import { engagementHeatmapData } from '@/lib/mock-data';


export function useCollection<T extends {id: string}>(path: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const previousData = useRef<T[]>([]);
  const processedEnrichmentIds = useRef(new Set<string>());
  const processedSchedulingIds = useRef(new Set<string>());

  const pathRef = useRef(path);
  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  useEffect(() => {
    if (!firestore) return;

    const coll = collection(firestore, pathRef.current);
    const q = query(coll);

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const newData = snapshot.docs.map((doc) => ({...doc.data(), id: doc.id})) as T[];
        setData(newData);
        setLoading(false);

        // --- Autonomous Logic ---
        if (path === 'products') {
          const configRef = doc(firestore, 'config', 'default');
          const configSnap = await getDoc(configRef);
          const config = configSnap.data() as AppConfig | undefined;

          // Do not run autonomous logic if disabled
          if (!config || config.automationIntensity !== 'full-auto') {
            previousData.current = newData;
            return;
          }

          const products = newData as unknown as Product[];
          const prevProducts = previousData.current as unknown as Product[];

          // --- Autonomous Enrichment ---
          const productsToEnrich = products.filter(p => 
            p.status === 'pending' && 
            !processedEnrichmentIds.current.has(p.id) && 
            p.isHalalCompliant === null
          );

          if (productsToEnrich.length > 0) {
            console.log(`[VORTEX AI] Detected ${productsToEnrich.length} new products to process for enrichment.`);
            productsToEnrich.forEach(product => {
              processedEnrichmentIds.current.add(product.id);
              console.log(`[VORTEX AI] Auto-enriching product: ${product.name}`);
              enrichProduct(firestore, product, { haramFilterEnabled: config.haramFilterEnabled }).catch(err => {
                console.error(`[VORTEX AI] Failed to auto-enrich product ${product.id}:`, err);
                processedEnrichmentIds.current.delete(product.id);
              });
            });
          }

          // --- Autonomous Scheduling ---
          const newlyApprovedProducts = products.filter(p => {
            if (p.status !== 'approved' || processedSchedulingIds.current.has(p.id)) {
              return false;
            }
            const prevProduct = prevProducts.find(prev => prev.id === p.id);
            return !prevProduct || (prevProduct.status !== 'approved');
          });

          if (newlyApprovedProducts.length > 0) {
            console.log(`[VORTEX AI] Detected ${newlyApprovedProducts.length} newly approved products for scheduling.`);
            newlyApprovedProducts.forEach(product => {
              processedSchedulingIds.current.add(product.id);
              console.log(`[VORTEX AI] Auto-scheduling posts for product: ${product.name}`);
              
              autoSchedulePosts({
                productId: product.id,
                productName: product.name,
                productDescription: product.seo?.description || `Check out this great product: ${product.name}`,
                targetPlatforms: ['X', 'Instagram', 'TikTok'],
                engagementAnalytics: JSON.stringify(engagementHeatmapData),
              }).then(async (result) => {
                if (!firestore) return;
                const batch = writeBatch(firestore);
                const postsCollection = collection(firestore, 'social_posts');
                result.scheduledPosts.forEach(post => {
                  const newPostRef = doc(postsCollection);
                  batch.set(newPostRef, post);
                });
                await batch.commit();

                console.log(`[VORTEX AI] Successfully scheduled posts for ${product.name}`);
              }).catch(err => {
                console.error(`[VORTEX AI] Failed to auto-schedule posts for product ${product.id}:`, err);
                processedSchedulingIds.current.delete(product.id);
              });
            });
          }
        }
        previousData.current = newData;
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
