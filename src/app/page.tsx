'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <section className="flex flex-col items-center justify-center text-center gap-6 py-24 px-4 md:py-32">
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter">
        Build Your Next Idea Faster
      </h1>
      <p className="max-w-xl text-lg md:text-xl text-muted-foreground">
        Create, customize, and deploy modern web applications with ease. Focus
        on your product, not the boilerplate.
      </p>
      <div className="flex gap-4">
        <Button size="lg" onClick={() => alert('Getting Started!')}>
          Get Started
        </Button>
        <Button size="lg" variant="outline" onClick={() => alert('Learning more!')}>
          Learn More
        </Button>
      </div>
    </section>
  );
}
