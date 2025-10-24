'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { mockProducts } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { AppConfig } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const defaultConfig: AppConfig = {
  id: 'default',
  automationIntensity: 'semi-auto',
  haramFilterEnabled: true,
  dataSources: ['shopify', 'x', 'tiktok'],
};

export default function SettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const { data: config, loading } = useDoc<AppConfig>('config/default');

  const currentConfig = config || defaultConfig;
  
  const handleConfigChange = async (key: keyof AppConfig, value: any) => {
    if (!firestore) return;
    const configRef = doc(firestore, 'config', 'default');
    setDocumentNonBlocking(configRef, { [key]: value }, { merge: true });
  };

  const handleSeedDatabase = async () => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firestore is not available.',
      });
      return;
    }

    setIsSeeding(true);
    try {
      const productsCollection = collection(firestore, 'products');
      
      mockProducts.forEach(product => {
        // We can't use the mock ID, so we let firestore generate one.
        const { id, ...productData } = product;
        addDocumentNonBlocking(productsCollection, productData);
      });

      toast({
        title: 'Database Seeding Started',
        description: `${mockProducts.length} products are being added to Firestore.`,
      });
    } catch (error) {
      console.error('Error seeding database:', error);
      toast({
        variant: 'destructive',
        title: 'Database Seeding Failed',
        description: 'Could not add products to the database.',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">System Configuration</h1>
        <p className="text-muted-foreground">Fine-tune the operational parameters of the VORTEX AI.</p>
      </div>

      {loading ? <SettingsSkeleton /> : (
        <div className="grid gap-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-headline">Automation Intensity</CardTitle>
              <CardDescription>Control the level of autonomous operation.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={currentConfig.automationIntensity}
                onValueChange={(value) => handleConfigChange('automationIntensity', value)}
                className="grid sm:grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem value="manual" id="manual" className="peer sr-only" />
                  <Label htmlFor="manual" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/50 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    Manual
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="semi-auto" id="semi-auto" className="peer sr-only" />
                  <Label htmlFor="semi-auto" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/50 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    Semi-Auto
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="full-auto" id="full-auto" className="peer sr-only" />
                  <Label htmlFor="full-auto" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/50 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    Full-Auto
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
              <Card className="glass-card">
              <CardHeader>
                  <CardTitle className="font-headline">Ethical Filters</CardTitle>
                  <CardDescription>Configure the Halal Integrity Engine.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="haram-filter">Filter Haram Products</Label>
                      <Switch
                        id="haram-filter"
                        checked={currentConfig.haramFilterEnabled}
                        onCheckedChange={(checked) => handleConfigChange('haramFilterEnabled', checked)}
                      />
                  </div>
                  <div className="flex items-center justify-between space-x-2 opacity-50">
                      <Label htmlFor="gambling-filter">Filter Gambling Content (disabled)</Label>
                      <Switch id="gambling-filter" defaultChecked disabled/>
                  </div>
                  <div className="flex items-center justify-between space-x-2 opacity-50">
                      <Label htmlFor="adult-filter">Filter Adult Content (disabled)</Label>
                      <Switch id="adult-filter" defaultChecked disabled/>
                  </div>
              </CardContent>
              </Card>

              <Card className="glass-card">
              <CardHeader>
                  <CardTitle className="font-headline">Data Sources</CardTitle>
                  <CardDescription>Manage where the AI hunts for trends.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                      <Checkbox id="source-shopify" defaultChecked />
                      <Label htmlFor="source-shopify">Shopify Marketplaces</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <Checkbox id="source-x" defaultChecked />
                      <Label htmlFor="source-x">X (Twitter)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <Checkbox id="source-tiktok" defaultChecked />
                      <Label htmlFor="source-tiktok">TikTok</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                      <Checkbox id="source-instagram" />
                      <Label htmlFor="source-instagram">Instagram</Label>
                  </div>
              </CardContent>
              </Card>
          </div>

          <Card className="glass-card border-amber-500/50">
            <CardHeader>
              <CardTitle className="font-headline text-amber-400">Developer</CardTitle>
              <CardDescription>Actions for development and testing purposes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                onClick={handleSeedDatabase}
                disabled={isSeeding}
              >
                {isSeeding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Seed Database
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Populate the Firestore database with initial mock product data. This is safe to run multiple times.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="grid gap-8">
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="glass-card">
          <CardHeader>
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </CardContent>
        </Card>
      </div>
       <Card className="glass-card">
          <CardHeader>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
    </div>
  )
}
