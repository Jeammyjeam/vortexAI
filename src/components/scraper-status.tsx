
'use client';

import { useDoc, useUser, useMemoFirebase } from '@/firebase';
import { doc, Firestore } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from './ui/button';
import { PlayCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';
import { SystemLog } from '@/lib/types';
import { Badge } from './ui/badge';
import { startScraper } from '@/app/actions/scrape';

export function ScraperStatus() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isStarting, startTransition] = useTransition();

    const statusDocRef = useMemoFirebase(
        () => firestore ? doc(firestore as Firestore, 'system_logs', 'scraper_status') : null,
        [firestore]
    );

    const { data: statusLog, isLoading } = useDoc<SystemLog>(statusDocRef);

    const handleStartScraper = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
            return;
        }

        startTransition(async () => {
            try {
                // Get the user's ID token to pass to the server action for verification
                const idToken = await user.getIdToken(true);
                const result = await startScraper(idToken);

                if (result.error) {
                    throw new Error(result.error);
                }
                
                toast({ title: 'Discovery Initiated', description: 'The VORTEX engine is now scanning for products.' });
            } catch (error) {
                console.error(error);
                toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Could not start scraper.' });
            }
        });
    };
    
    const lastFinish = statusLog?.last_finish?.toDate();
    const timeSinceFinish = lastFinish ? Math.round((new Date().getTime() - lastFinish.getTime()) / (1000 * 60)) : null;

    const renderStatus = () => {
        if (isLoading) {
            return <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> <span>Loading status...</span></div>;
        }
        if (statusLog?.status === 'running') {
            return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />Running</Badge>;
        }
        if (timeSinceFinish !== null) {
            return <Badge variant="outline">Last run: {timeSinceFinish} mins ago</Badge>
        }
        return <Badge variant="outline">Idle</Badge>;
    };

    return (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-card border">
            <div className="text-sm text-muted-foreground">
                {renderStatus()}
            </div>
            <Button onClick={handleStartScraper} disabled={isStarting || statusLog?.status === 'running'}>
                {isStarting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
                Start Discovery
            </Button>
        </div>
    );
}
