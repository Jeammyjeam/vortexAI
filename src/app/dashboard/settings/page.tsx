'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { mockProducts } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

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
      const batch = writeBatch(firestore);
      const productsCollection = collection(firestore, 'products');
      
      mockProducts.forEach(product => {
        // We can't use the mock ID, so we let firestore generate one.
        const { id, ...productData } = product;
        const newProductRef = doc(productsCollection);
        batch.set(newProductRef, productData);
      });

      await batch.commit();

      toast({
        title: 'Database Seeded',
        description: `${mockProducts.length} products have been added to Firestore.`,
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

      <div className="grid gap-8">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-headline">Automation Intensity</CardTitle>
            <CardDescription>Control the level of autonomous operation.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup defaultValue="semi-auto" className="grid sm:grid-cols-3 gap-4">
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
                    <Switch id="haram-filter" defaultChecked />
                </div>
                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="gambling-filter">Filter Gambling Content</Label>
                    <Switch id="gambling-filter" defaultChecked />
                </div>
                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="adult-filter">Filter Adult Content</Label>
                    <Switch id="adult-filter" defaultChecked />
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

        <div className="flex justify-end">
          <Button className="btn-satoshi bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
