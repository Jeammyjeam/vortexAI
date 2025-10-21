
'use client';

import { TrendingProductsChart } from '@/components/charts/trending-products-chart';
import { EngagementHeatmap } from '@/components/charts/engagement-heatmap';
import { useCollection } from '@/firebase';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsPage() {
  const { data: products, loading } = useCollection<Product>('products');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">Sentient Analytics</h1>
        <p className="text-muted-foreground">Visualizing market trends and viral velocity.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <TrendingProductsChart products={products || []} />
        )}
        <EngagementHeatmap />
      </div>

      {/* More analytics components can be added here */}
    </div>
  );
}
