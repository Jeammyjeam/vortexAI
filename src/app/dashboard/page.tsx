'use client';

import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { collection, query, orderBy, Firestore } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { ProductCard } from '@/components/product-card';
import { Product } from '@/lib/types';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  // 1. Redirect unauthenticated users immediately.
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // 2. Only create the query if the user is authenticated.
  const productsQuery = useMemoFirebase(
    () =>
      firestore && user // <-- Ensure user exists before creating the query
        ? query(
            collection(firestore as Firestore, 'products'),
            orderBy('created_at', 'desc')
          )
        : null, // <-- Return null if not ready
    [firestore, user] // <-- Add user as a dependency
  );

  const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

  // 3. Handle all loading states cleanly.
  if (isUserLoading || areProductsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-foreground font-orbitron">Loading Command Console...</div>
      </div>
    );
  }

  // If the effect above hasn't redirected yet, we might still not have a user.
  // This prevents a flash of the "empty" state before redirection.
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto py-12 px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold font-orbitron">Command Console</h1>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-lg border border-dashed border-secondary">
            <p className="text-muted-foreground font-inter">No product listings found.</p>
            <p className="text-sm text-muted-foreground/50 mt-2 font-satoshi">The grid is empty. The scraper may be running or no products have been discovered yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
