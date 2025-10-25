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
import { ScraperStatus } from '@/components/scraper-status';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const productsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(
            collection(firestore as Firestore, 'products'),
            orderBy('created_at', 'desc')
          )
        : null,
    [firestore, user]
  );

  const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto py-12 px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <h1 className="text-4xl font-bold font-orbitron">Command Console</h1>
          <ScraperStatus />
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
            <p className="text-sm text-muted-foreground/50 mt-2">The grid is empty. Click "Start Discovery" to begin scanning for products.</p>
          </div>
        )}
      </main>
    </div>
  );
}
