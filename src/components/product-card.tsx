
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, X, Sparkles, MoreVertical, Loader2, Send, CalendarClock } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';

import type { Product, ProductStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { AutoScheduleDialog } from '@/components/auto-schedule-dialog';
import { autoSchedulePosts } from '@/ai/flows/auto-schedule-posts';
import { enrichProduct } from '@/lib/product-actions';
import { format } from 'date-fns';


interface ProductCardProps {
  product: Product;
  onProductUpdate?: (productId: string, updatedProduct: Partial<Product>) => void;
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

export function ProductCard({ product, onProductUpdate }: ProductCardProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isEnriching, setIsEnriching] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  
  const statusInfo = statusConfig[product.status];
  
  const handleApprove = () => {
    onProductUpdate?.(product.id, { status: 'approved' });
  };
  
  const handleReject = () => {
    onProductUpdate?.(product.id, { status: 'rejected' });
  };

  const handleManualEnrich = async () => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Enrichment Failed',
        description: 'Firestore is not available.',
      });
      return;
    }
    setIsEnriching(true);
    try {
      await enrichProduct(firestore, product);
      toast({
        title: 'Enrichment Successful',
        description: `AI content for '${product.name}' has been saved.`,
      });
    } catch (error) {
      console.error('Enrichment failed:', error);
      toast({
        variant: 'destructive',
        title: 'Enrichment Failed',
        description: 'Could not generate and save AI content for this product.',
      });
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSchedulePosts = async (platforms: ('X' | 'Instagram' | 'TikTok')[]) => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Scheduling Failed',
        description: 'Firestore is not available.',
      });
      return;
    }

    try {
      const result = await autoSchedulePosts({
        productName: product.name,
        productDescription: product.seo?.description || `Check out this great product: ${product.name}`,
        targetPlatforms: platforms,
      });

      const productRef = doc(firestore, 'products', product.id);
      await updateDoc(productRef, {
        socialPosts: result.scheduledPosts,
      });

      toast({
        title: 'Posts Scheduled Successfully',
        description: `${result.scheduledPosts.length} posts have been generated and saved.`,
      });

    } catch (error) {
      console.error('Failed to schedule posts:', error);
      toast({
        variant: 'destructive',
        title: 'Scheduling Failed',
        description: 'Could not schedule posts for this product.',
      });
    }
  };

  return (
    <TooltipProvider>
    <Card className="glass-card overflow-hidden group transition-all duration-300 hover:border-primary/50 hover:shadow-primary/10 hover:shadow-2xl flex flex-col">
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
            {onProductUpdate && <Badge variant={statusInfo.variant} className={cn('backdrop-blur-sm', statusInfo.className)}>{statusInfo.label}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="font-headline text-lg leading-tight mb-2 truncate" title={product.seo?.title || product.name}>
          {product.seo?.title || product.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground truncate" title={product.complianceReasoning ?? undefined}>
          {product.complianceReasoning}
        </p>
        <div className="flex justify-between items-center text-muted-foreground text-sm mt-2">
          <span>{product.category}</span>
          <span className="font-satoshi font-bold text-base text-foreground">${product.price.toLocaleString()}</span>
        </div>
      </CardContent>
      
      {product.socialPosts && product.socialPosts.length > 0 && (
        <div className="px-4 pb-2 text-xs text-muted-foreground">
          {product.socialPosts.map((post, index) => (
             <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 mt-1">
                  <CalendarClock className="h-3 w-3 text-accent" />
                  <span>Scheduled for {post.platform} on {format(new Date(post.scheduledTime), 'MMM d, HH:mm')}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-xs glass-card">
                <p className="font-bold">{post.platform} Post:</p>
                <p className="whitespace-pre-wrap">{post.postContent}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}

      {onProductUpdate && (
        <CardFooter className="p-4 pt-2 flex gap-2 justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            className="hover:bg-primary/20 hover:text-primary"
            onClick={handleManualEnrich}
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
               <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsScheduleDialogOpen(true)}>
                <Send className="mr-2 h-4 w-4" />
                Auto-Schedule Posts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      )}
    </Card>
    {onProductUpdate && (
        <AutoScheduleDialog 
            isOpen={isScheduleDialogOpen}
            onOpenChange={setIsScheduleDialogOpen}
            product={product}
            onSchedule={handleSchedulePosts}
        />
    )}
    </TooltipProvider>
  );
}
