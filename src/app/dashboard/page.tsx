import { mockProducts } from '@/lib/mock-data';
import { ProductCard } from '@/components/product-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardPage() {
  const allProducts = mockProducts;
  const pendingProducts = allProducts.filter((p) => p.status === 'pending');
  const approvedProducts = allProducts.filter((p) => p.status === 'approved');
  const rejectedProducts = allProducts.filter((p) => p.status === 'rejected');

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
        <TabsContent value="pending">
          <ProductGrid products={pendingProducts} />
        </TabsContent>
        <TabsContent value="approved">
          <ProductGrid products={approvedProducts} />
        </TabsContent>
        <TabsContent value="rejected">
          <ProductGrid products={rejectedProducts} />
        </TabsContent>
        <TabsContent value="all">
          <ProductGrid products={allProducts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProductGrid({ products }: { products: typeof mockProducts }) {
  if (products.length === 0) {
    return <div className="text-center text-muted-foreground py-16">No products in this category.</div>
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
