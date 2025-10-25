'use client';

import { Bot } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { useUser } from '@/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthActions } from '@/hooks/use-auth-handler';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, isUserLoading } = useUser();
  const { handleSignOut } = useAuthActions();
  const router = useRouter();

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const names = name.split(' ');
      if (names.length > 1) {
        return names[0][0] + names[1][0];
      }
      return names[0][0];
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b border-white/5 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <Link href="/" className="flex items-center justify-center gap-2 group" prefetch={false}>
        <Bot className="h-6 w-6 text-primary group-hover:animate-pulse" />
        <span className="font-orbitron font-bold text-lg">VORTEX</span>
      </Link>
      <nav className="ml-auto flex items-center gap-4 sm:gap-6">
        {isUserLoading ? (
          <div className="h-9 w-24 animate-pulse rounded-md bg-secondary" />
        ) : user ? (
          <>
            <Button variant="ghost" onClick={() => router.push('/dashboard')} className="font-satoshi">Dashboard</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-transparent group-hover:border-primary transition-colors">
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                    <AvatarFallback className="bg-secondary text-muted-foreground">{getInitials(user.displayName, user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 glassmorphic" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none font-satoshi">{user.displayName || 'Operator'}</p>
                    <p className="text-xs leading-none text-muted-foreground font-satoshi">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="font-satoshi">Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button variant="outline" onClick={() => router.push('/login')} className="font-satoshi">
            Operator Login
          </Button>
        )}
      </nav>
    </header>
  );
}
