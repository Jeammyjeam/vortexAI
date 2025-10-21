'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
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

        <div className="flex justify-end">
          <Button className="btn-satoshi bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
