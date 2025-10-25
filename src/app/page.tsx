'use client';

import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Hello World</h1>
      <Button onClick={() => alert('Button clicked!')}>Click Me</Button>
    </main>
  );
}
