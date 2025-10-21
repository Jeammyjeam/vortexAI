
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartTooltipContent } from '@/components/ui/chart';
import type { Product } from '@/lib/types';

interface TrendingProductsChartProps {
  products: Product[];
}

export function TrendingProductsChart({ products }: TrendingProductsChartProps) {
  const chartData = products
    .filter(p => p.status === 'approved')
    .sort((a, b) => b.viralVelocity - a.viralVelocity)
    .slice(0, 10);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-headline">Trending Products</CardTitle>
        <CardDescription>Viral velocity of top approved products</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Viral Velocity', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' } }}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}
              content={<ChartTooltipContent 
                formatter={(value, name) => {
                  if (name === 'viralVelocity') {
                    return [value, 'Viral Velocity'];
                  }
                  return [value, name];
                }}
              />}
              wrapperStyle={{ outline: 'none' }}
            />
            <Bar dataKey="viralVelocity" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Viral Velocity" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
