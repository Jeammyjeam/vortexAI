
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AutoSchedulePostsInput } from '@/ai/flows/auto-schedule-posts';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';

interface AutoScheduleDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product;
  onSchedule: (platforms: ('X' | 'Instagram' | 'TikTok')[]) => Promise<void>;
}

const platforms: AutoSchedulePostsInput['targetPlatforms'] = ['X', 'Instagram', 'TikTok'];

export function AutoScheduleDialog({ isOpen, onOpenChange, product, onSchedule }: AutoScheduleDialogProps) {
  const { toast } = useToast();
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<AutoSchedulePostsInput['targetPlatforms']>(['X']);

  const handlePlatformChange = (platform: 'X' | 'Instagram' | 'TikTok', checked: boolean) => {
    setSelectedPlatforms(prev => 
      checked ? [...prev, platform] : prev.filter(p => p !== platform)
    );
  };

  const handleSchedule = async () => {
    if (selectedPlatforms.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No platforms selected',
        description: 'Please select at least one platform to post to.',
      });
      return;
    }
    
    setIsScheduling(true);
    try {
      await onSchedule(selectedPlatforms);
      onOpenChange(false);
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>Auto-Schedule Social Media Posts</DialogTitle>
          <DialogDescription>
            Generate and schedule posts for '{product.name}' on your selected platforms.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <p className="font-medium">Select Platforms:</p>
            <div className="grid grid-cols-3 gap-4">
            {platforms.map(platform => (
                <div key={platform}>
                    <Checkbox
                        id={`platform-${platform}`}
                        checked={selectedPlatforms.includes(platform)}
                        onCheckedChange={(checked) => handlePlatformChange(platform, !!checked)}
                        className="peer sr-only"
                    />
                    <Label
                        htmlFor={`platform-${platform}`}
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/50 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                        {platform}
                    </Label>
                </div>
            ))}
            </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isScheduling}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={isScheduling}>
            {isScheduling ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Schedule Posts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
