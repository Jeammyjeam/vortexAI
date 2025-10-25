// Using a server component to fetch data initially
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/server';
import { Product, Category } from '@/lib/types';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/product-card';
import { Type } from 'lucide-react';

async function getCategoryAndProducts(slug: string): Promise<{ category: Category | null, products: Product[] }> {
    try {
        const categoryRef = doc(db, 'categories', slug);
        const categorySnap = await getDoc(categoryRef);

        if (!categorySnap.exists()) {
            return { category: null, products: [] };
        }

        const category = { id: categorySnap.id, ...categorySnap.data() } as Category;

        const q = query(
            collection(db, 'products'),
            where('category_slug', '==', slug),
            orderBy('created_at', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const products = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                created_at: data.created_at?.toDate() || new Date(),
                updated_at: data.updated_at?.toDate() || new Date(),
            } as Product;
        });

        return { category, products };

    } catch (error) {
        console.error("Error fetching category and products:", error);
        return { category: null, products: [] };
    }
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
    const { category, products } = await getCategoryAndProducts(params.slug);

    if (!category) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="container mx-auto py-12 px-4 md:px-6">
                <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
                    <h1 className="text-4xl font-bold font-orbitron flex items-center gap-3">
                        <Type className="h-8 w-8 text-primary" />
                        {category.name}
                    </h1>
                </div>

                {products && products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-card rounded-lg border border-dashed border-secondary">
                        <p className="text-muted-foreground">No products found in this category.</p>
                        <p className="text-sm text-muted-foreground/50 mt-2">The scraper may be running or no products have been discovered for this category yet.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
