
'use client';

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DollarSign, ExternalLink } from 'lucide-react';
import type { Product } from '@/lib/types';
import placeholderImages from '@/lib/placeholder-images.json';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
  product: Product;
}

const getPlaceholderImage = (productId: string) => {
  const hash = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return placeholderImages[hash % placeholderImages.length];
};

const getStatusVariant = (status: Product['listing_status']) => {
  switch (status) {
    case 'published': return 'default';
    case 'approved': return 'secondary';
    case 'enriched': return 'secondary';
    case 'rejected':
    case 'failed_enrichment':
    case 'failed_publish':
      return 'destructive';
    default: return 'outline';
  }
};

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const placeholder = getPlaceholderImage(product.id);
  const displayImage = product.images?.[0]?.replace('gs://', 'https://storage.googleapis.com/') || placeholder.url;

  return (
    <Card 
        onClick={() => router.push(`/product/${product.id}`)}
        className="glassmorphic flex flex-col overflow-hidden group hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/10"
    >
      <CardHeader className="p-0 relative">
        <div className="aspect-[4/3] relative overflow-hidden">
          <Image
            src={displayImage}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            data-ai-hint={placeholder.aiHint}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
        <div className="absolute bottom-0 left-0 p-4">
           <CardTitle className="font-orbitron text-lg leading-tight text-white drop-shadow-md">
            {product.title}
           </CardTitle>
        </div>
         <Badge 
            variant={getStatusVariant(product.listing_status)}
            className="absolute top-2 right-2 capitalize"
        >
            {product.listing_status.replace(/_/g, ' ')}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.enriched_fields?.seo_description || product.description}
        </p>
        <div className="flex items-center justify-between gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1.5 text-primary">
                <DollarSign className="h-4 w-4" />
                <span className="font-bold">{product.price?.toFixed(2)} {product.currency}</span>
            </div>
            <a href={product.source_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-xs">
                 <ExternalLink className="h-3 w-3" />
                <span>{product.source_domain}</span>
            </a>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="outline" className="w-full">Review & Approve</Button>
      </CardFooter>
    </Card>
  );
}
