'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ThumbsDown, ThumbsUp, Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

interface ProductStatusUpdaterProps {
  productId: string;
  currentStatus: string;
}

export function ProductStatusUpdater({ productId, currentStatus }: ProductStatusUpdaterProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<'approving' | 'rejecting' | null>(null);

  const handleUpdateStatus = async (newStatus: 'approved' | 'rejected') => {
    if (isPending || !user) {
        toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'You must be logged in to perform this action.',
        });
        return;
    }

    setAction(newStatus === 'approved' ? 'approving' : 'rejecting');

    startTransition(async () => {
      try {
        const idToken = await user.getIdToken();

        const response = await fetch(`/api/products/${productId}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update status.');
        }

        toast({
          title: 'Status Updated!',
          description: `Product has been ${newStatus}.`,
        });

        // Refresh the page to show the latest status
        router.refresh();

      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: error instanceof Error ? error.message : 'Could not update product status.',
        });
      } finally {
        setAction(null);
      }
    });
  };
  
  const isProcessing = isPending || currentStatus === 'approved' || currentStatus === 'published' || currentStatus === 'rejected';

  return (
    <div className="flex gap-4">
      <Button
        size="lg"
        onClick={() => handleUpdateStatus('approved')}
        disabled={isProcessing || action === 'rejecting'}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {action === 'approving' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
        Approve
      </Button>
      <Button
        size="lg"
        variant="destructive"
        onClick={() => handleUpdateStatus('rejected')}
        disabled={isProcessing || action === 'approving'}
      >
        {action === 'rejecting' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsDown className="mr-2 h-4 w-4" />}
        Reject
      </Button>
    </div>
  );
}
