'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, X, Sparkles, MoreVertical, Loader2 } from 'lucide-react';

import type { Product, ProductStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { generateProductDescriptions } from '@/ai/flows/generate-product-descriptions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';


interface ProductCardProps {
  product: Product;
  onStatusChange?: (productId: string, newStatus: ProductStatus) => void;
}

const statusConfig: Record<ProductStatus, {
  label: string;
  className: string;
  variant: 'default' | 'secondary' | 'destructive';
}> = {
  approved: { label: 'Approved', className: 'bg-green-500/20 text-green-400 border-green-500/30', variant: 'default' },
  pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', variant: 'secondary' },
  rejected: { label: 'Rejected', className: 'bg-red-500/20 text-red-400 border-red-500/30', variant: 'destructive' },
};

export function ProductCard({ product, onStatusChange }: ProductCardProps) {
  const { toast } = useToast();
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichedContent, setEnrichedContent] = useState<any>(null);

  const statusInfo = statusConfig[product.status];
  
  const handleApprove = () => {
    onStatusChange?.(product.id, 'approved');
  };
  
  const handleReject = () => {
    onStatusChange?.(product.id, 'rejected');
  };

  const handleEnrich = async () => {
    setIsEnriching(true);
    try {
      const result = await generateProductDescriptions({
        title: product.name,
        category: product.category,
        keywords: product.imageHint, // Using image hint as a starting point
        targetAudience: 'Online shoppers, tech enthusiasts', // Example target audience
      });
      setEnrichedContent(result);
    } catch (error) {
      console.error('Enrichment failed:', error);
      toast({
        variant: 'destructive',
        title: 'Enrichment Failed',
        description: 'Could not generate AI content for this product.',
      });
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <>
    <Card className="glass-card overflow-hidden group transition-all duration-300 hover:border-primary/50 hover:shadow-primary/10 hover:shadow-2xl">
      <CardHeader className="p-0 relative">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={600}
          height={400}
          data-ai-hint={product.imageHint}
          className="object-cover aspect-video transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3 flex gap-2">
            {onStatusChange && <Badge variant={statusInfo.variant} className={cn('backdrop-blur-sm', statusInfo.className)}>{statusInfo.label}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="font-headline text-lg leading-tight mb-2 truncate" title={product.name}>
          {product.name}
        </CardTitle>
        <div className="flex justify-between items-center text-muted-foreground text-sm">
          <span>{product.category}</span>
          <span className="font-satoshi font-bold text-base text-foreground">${product.price.toLocaleString()}</span>
        </div>
      </CardContent>
      {onStatusChange && (
        <CardFooter className="p-4 pt-0 flex gap-2 justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            className="hover:bg-primary/20 hover:text-primary"
            onClick={handleEnrich}
            disabled={isEnriching}
          >
            {isEnriching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Enrich
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card">
              <DropdownMenuItem
                onClick={handleApprove}
                className="text-green-400 focus:bg-green-500/20 focus:text-green-300"
              >
                <Check className="mr-2 h-4 w-4" /> Approve
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleReject}
                className="text-red-400 focus:bg-red-500/20 focus:text-red-300"
              >
                <X className="mr-2 h-4 w-4" /> Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      )}
    </Card>

    {enrichedContent && (
        <AlertDialog open={!!enrichedContent} onOpenChange={() => setEnrichedContent(null)}>
            <AlertDialogContent className="glass-card">
                <AlertDialogHeader>
                    <AlertDialogTitle className="font-headline">AI Enrichment Complete</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4 pt-4">
                        <div>
                            <h3 className="font-bold text-foreground">SEO Title</h3>
                            <p>{enrichedContent.seoTitle}</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">Meta Description</h3>
                            <p>{enrichedContent.metaDescription}</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">Caption</h3>
                            <p>{enrichedContent.caption}</p>
                        </div>
                         <div>
                            <h3 className="font-bold text-foreground">Ranked Keywords</h3>
                            <p>{enrichedContent.rankedKeywords}</p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setEnrichedContent(null)} className="btn-satoshi">
                        Close
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )}
    </>
  );
}
