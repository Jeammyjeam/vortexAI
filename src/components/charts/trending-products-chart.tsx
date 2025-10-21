'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartTooltipContent } from '@/components/ui/chart';
import { marketTrendsData } from '@/lib/mock-data';

export function TrendingProductsChart() {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-headline">Trending Products</CardTitle>
        <CardDescription>Monthly product trend velocity</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={marketTrendsData}>
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}
              content={<ChartTooltipContent />}
              wrapperStyle={{ outline: 'none' }}
            />
            <Bar dataKey="Trending Products" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Engagement" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
