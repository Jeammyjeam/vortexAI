'use client';

import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { collection, query, orderBy, Firestore } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { ProductCard } from '@/components/product-card';
import { Product } from '@/lib/types';
import { CategoryNav } from '@/components/category-nav';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  // 1. Redirect unauthenticated users
  useEffect(() => {
    // Wait until the initial user loading is complete
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // 2. Memoize the Firestore query
  const productsQuery = useMemoFirebase(
    () =>
      firestore && user // Only create query if firestore is initialized and user is logged in
        ? query(
            collection(firestore as Firestore, 'products'),
            orderBy('created_at', 'desc')
          )
        : null, // Return null if not ready, the hook will wait
    [firestore, user]
  );

  // 3. Subscribe to the real-time collection data
  const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

  // 4. Show a loading state until authentication and initial data load are complete
  // This prevents content flashes and ensures we have a user before rendering the main view
  if (isUserLoading || (user && areProductsLoading)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4 text-foreground font-orbitron">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p>Loading Command Console...</p>
        </div>
      </div>
    );
  }

  // If loading is finished and there's still no user, don't render anything
  // The useEffect above will handle the redirect.
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto py-12 px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold font-orbitron">Command Console</h1>
        </div>
        
        <div className="mb-8">
            <CategoryNav />
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-lg border border-dashed border-secondary">
            <p className="text-muted-foreground">No product listings found.</p>
            <p className="text-sm text-muted-foreground/50 mt-2">The grid is empty. The scraper may be running or no products have been discovered yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
