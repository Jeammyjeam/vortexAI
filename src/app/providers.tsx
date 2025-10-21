'use client';

import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { CommandMenuProvider } from '@/hooks/use-command-menu';

export function Providers({ 
  children,
}: { 
  children: React.ReactNode,
}) {
  return (
    <FirebaseClientProvider>
      <CommandMenuProvider>
        {children}
        <Toaster />
      </CommandMenuProvider>
    </FirebaseClientProvider>
  );
}
