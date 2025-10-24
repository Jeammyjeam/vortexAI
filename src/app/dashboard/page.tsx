'use client';

import { useMemo, useState } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ProductCard } from '@/components/product-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Bot, Loader2 } from 'lucide-react';
import { publishSocialPosts } from '@/ai/flows/social-post-publisher';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { data: products, loading } = useCollection<Product>('products');
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);

  const handleProductUpdate = async (productId: string, updatedData: Partial<Product>) => {
    if (!firestore) return;
    const productRef = doc(firestore, 'products', productId);
    await updateDoc(productRef, updatedData);
  };

  const handlePublishPosts = async () => {
    setIsPublishing(true);
    try {
      const result = await publishSocialPosts();
      if (result.publishedPosts.length > 0) {
        toast({
          title: 'Publisher Finished',
          description: `Successfully published ${result.publishedPosts.length} posts.`,
        });
      } else {
        toast({
          title: 'Publisher Finished',
          description: 'No posts were due for publishing.',
        });
      }
    } catch (error) {
      console.error("Publishing failed:", error);
      toast({
        variant: 'destructive',
        title: 'Publishing Failed',
        description: 'Could not run the publishing flow.',
      });
    } finally {
      setIsPublishing(false);
    }
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Command Console</h1>
          <p className="text-muted-foreground">Oversee and manage AI-driven product discovery.</p>
        </div>
        <Button onClick={handlePublishPosts} disabled={isPublishing}>
          {isPublishing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Bot className="mr-2 h-4 w-4" />
          )}
          Publish Queued Posts
        </Button>
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

function ProductGrid({ products, onProductUpdate }: { products: Product[], onProductUpdate?: (productId: string, updatedData: Partial<Product>) => void; }) {
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
