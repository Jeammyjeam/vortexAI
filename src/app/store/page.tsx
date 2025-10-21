'use client';

import { useCollection } from '@/firebase';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/icons/logo';
import { ShoppingBag } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function StorefrontPage() {
  const { data: products, loading } = useCollection<Product>('products');
  const approvedProducts = products?.filter((p) => p.status === 'approved') || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/store" className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-headline text-lg font-bold text-primary">
              VORTEX Store
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <ShoppingBag className="h-6 w-6" />
            </Button>
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 md:px-6 lg:py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight text-foreground">
            Trending Products, Curated by AI
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Discover the hottest products across the web, identified and analyzed by VORTEX AI.
          </p>
        </div>

        {loading ? (
          <ProductGridSkeleton />
        ) : approvedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {approvedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No approved products yet. Check back soon!</p>
          </div>
        )}
      </main>
      <footer className="border-t mt-16">
        <div className="container mx-auto flex items-center justify-between px-4 py-6 md:px-6 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} VORTEX AI. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-primary">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </footer>
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
