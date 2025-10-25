'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowRight, Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern bg-center [mask-image:linear-gradient(to_bottom,white_30%,transparent_100%)]"></div>
       <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background"></div>
      
      <section className="relative z-10 flex flex-col items-center justify-center text-center gap-6 py-24 px-4 md:py-32">
        <div className="inline-block bg-primary/10 text-primary px-4 py-1 rounded-full text-sm mb-4 border border-primary/30">
          Powered by Sentient Analytics
        </div>
        <h1 className="text-4xl md:text-7xl font-bold font-orbitron tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
          VORTEX AI GRID
        </h1>
        <p className="max-w-2xl text-lg md:text-xl text-muted-foreground">
          Autonomous trend extraction and e-commerce fusion. The system sweeps the internet, refines data with cognitive AI, and deploys market-ready assets.
        </p>
        <div className="flex gap-4 mt-6">
          <Button size="lg" onClick={() => router.push('/dashboard')} className="group">
            Access Command Console <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => alert('Learning more!')}>
            <Zap className="h-4 w-4 mr-2" />
            Live Demo
          </Button>
        </div>
      </section>
    </div>
  );
}
