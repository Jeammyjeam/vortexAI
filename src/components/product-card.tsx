'use client';

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle, DollarSign, Tag, XCircle } from 'lucide-react';
import type { ProductListing } from '@/lib/types';
import placeholderImages from '@/lib/placeholder-images.json';

interface ProductCardProps {
  product: ProductListing;
}

const getPlaceholderImage = (productId: string) => {
  const hash = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return placeholderImages[hash % placeholderImages.length];
};

export function ProductCard({ product }: ProductCardProps) {
    const placeholder = getPlaceholderImage(product.id);
  return (
    <Card className="glassmorphic flex flex-col overflow-hidden group hover:border-primary/50 transition-colors duration-300">
      <CardHeader className="p-0 relative">
        <div className="aspect-[4/3] relative overflow-hidden">
          <Image
            src={product.imageUrl || placeholder.url}
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
            variant={product.halalStatus === 'compliant' ? 'default' : 'destructive'}
            className="absolute top-4 right-4"
        >
            {product.halalStatus === 'compliant' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
            {product.halalStatus}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <p className="text-sm text-muted-foreground font-inter line-clamp-3">
          {product.description}
        </p>
        <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1.5 text-primary">
                <DollarSign className="h-4 w-4" />
                <span className="font-bold font-satoshi">{product.price.toFixed(2)} {product.currency}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span className="font-satoshi">{product.category}</span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="outline" className="w-full font-satoshi">View Details</Button>
      </CardFooter>
    </Card>
  );
}
