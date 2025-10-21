import { TrendingProductsChart } from '@/components/charts/trending-products-chart';
import { EngagementHeatmap } from '@/components/charts/engagement-heatmap';

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">Sentient Analytics</h1>
        <p className="text-muted-foreground">Visualizing market trends and viral velocity.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TrendingProductsChart />
        <EngagementHeatmap />
      </div>

      {/* More analytics components can be added here */}
    </div>
  );
}
