'use client';

import { useUser, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { collection, query, orderBy, Firestore } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { ProductCard } from '@/components/product-card';
import { ProductListing } from '@/lib/types';

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
      firestore
        ? query(
            collection(firestore as Firestore, 'productListings'),
            orderBy('extractedDate', 'desc')
          )
        : null,
    [firestore]
  );

  const { data: products, isLoading } = useCollection<ProductListing>(productsQuery);

  if (isUserLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-foreground">Loading Dashboard...</div>
      </div>
    );
  }

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
          <div className="text-center py-20 bg-card rounded-lg border border-dashed border-cyber-gray">
            <p className="text-muted-foreground font-inter">No product listings found.</p>
            <p className="text-sm text-muted-foreground/50 mt-2 font-satoshi">The grid is empty. Start a new extraction to populate products.</p>
          </div>
        )}
      </main>
    </div>
  );
}
