import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { FirebaseClientProvider } from '@/firebase';
import { Inter, Orbitron } from 'next/font/google';

// Using a variable font for Satoshi
const satoshi = {
  fontFamily: 'Satoshi',
  src: 'url("/fonts/Satoshi-Variable.woff2") format("woff2")',
  fontWeight: '300 900',
  fontStyle: 'normal',
  fontDisplay: 'swap',
};


const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
});

export const metadata: Metadata = {
  title: 'VORTEX AI GRID',
  description: 'Autonomous Trend Extraction and E-Commerce Fusion',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          @font-face {
            font-family: 'Satoshi';
            src: url('/fonts/Satoshi-Variable.woff2') format('woff2');
            font-weight: 300 900;
            font-display: swap;
            font-style: normal;
          }
        `}} />
      </head>
      <body className={cn('font-inter antialiased min-h-screen bg-background flex flex-col', inter.variable, orbitron.variable)}>
        <FirebaseClientProvider>
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
