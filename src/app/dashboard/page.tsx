'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ProductCard } from '@/components/product-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data: products, loading } = useCollection<Product>('products');
  const firestore = useFirestore();

  const handleProductUpdate = async (productId: string, updatedProduct: Partial<Product>) => {
    if (!firestore) return;
    const productRef = doc(firestore, 'products', productId);
    await updateDoc(productRef, updatedProduct);
  };
  
  const { pendingProducts, approvedProducts, rejectedProducts, allProducts } = useMemo(() => {
    const all = products || [];
    return {
      allProducts: all,
      pendingProducts: all.filter((p) => p.status === 'pending'),
      approvedProducts: all.filter((p) => p.status === 'approved'),
      rejectedProducts: all.filter((p) => p.status === 'rejected'),
    };
  }, [products]);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">Command Console</h1>
        <p className="text-muted-foreground">Oversee and manage AI-driven product discovery.</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-card/60 backdrop-blur-xl border border-white/10">
          <TabsTrigger value="pending" className="font-satoshi">Pending ({pendingProducts.length})</TabsTrigger>
          <TabsTrigger value="approved" className="font-satoshi">Approved ({approvedProducts.length})</TabsTrigger>
          <TabsTrigger value="rejected" className="font-satoshi">Rejected ({rejectedProducts.length})</TabsTrigger>
          <TabsTrigger value="all" className="font-satoshi">All ({allProducts.length})</TabsTrigger>
        </TabsList>

        {loading ? (
          <ProductGridSkeleton />
        ) : (
          <>
            <TabsContent value="pending">
              <ProductGrid products={pendingProducts} onProductUpdate={handleProductUpdate} />
            </TabsContent>
            <TabsContent value="approved">
              <ProductGrid products={approvedProducts} onProductUpdate={handleProductUpdate} />
            </TabsContent>
            <TabsContent value="rejected">
              <ProductGrid products={rejectedProducts} onProductUpdate={handleProductUpdate} />
            </TabsContent>
            <TabsContent value="all">
              <ProductGrid products={allProducts} onProductUpdate={handleProductUpdate} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function ProductGrid({ products, onProductUpdate }: { products: Product[], onProductUpdate: (productId: string, updatedProduct: Partial<Product>) => void }) {
  if (products.length === 0) {
    return <div className="text-center text-muted-foreground py-16">No products in this category.</div>
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onProductUpdate={onProductUpdate} />
      ))}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-[225px] w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
