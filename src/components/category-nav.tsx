'use client';

import { useCollection, useMemoFirebase } from '@/firebase';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, Firestore } from 'firebase/firestore';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { LayoutGrid, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Category {
    id: string;
    name: string;
    slug: string;
}

export function CategoryNav() {
    const firestore = useFirestore();
    const router = useRouter();

    const categoriesQuery = useMemoFirebase(
        () =>
            firestore
                ? query(
                    collection(firestore as Firestore, 'categories'),
                    orderBy('name', 'asc')
                )
                : null,
        [firestore]
    );

    const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading Categories...</span>
            </div>
        );
    }
    
    return (
        <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold font-satoshi mr-2 text-muted-foreground">Browse by Category:</h3>
            <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    All
                </Link>
            </Button>
            {categories?.map(category => (
                <Button key={category.id} variant="ghost" size="sm" asChild>
                    <Link href={`/category/${category.slug}`}>
                        {category.name}
                    </Link>
                </Button>
            ))}
        </div>
    );
}
