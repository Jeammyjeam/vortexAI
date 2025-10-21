'use client';

import React from 'react';
import { useCommandMenu } from '@/hooks/use-command-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Home, BarChart, Settings, Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function CommandMenu() {
  const { isOpen, setIsOpen } = useCommandMenu();
  const router = useRouter();

  const handleSelect = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };
  
  const commands = [
    { icon: Home, text: 'Dashboard', path: '/dashboard' },
    { icon: BarChart, text: 'Analytics', path: '/dashboard/analytics' },
    { icon: Settings, text: 'Settings', path: '/dashboard/settings' },
    { icon: Bot, text: 'Generate Descriptions', action: () => console.log('Trigger AI...') },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="p-0 overflow-hidden glass-card max-w-lg">
        <div className="p-4 border-b border-white/10">
            <Input 
                placeholder="Type a command or search..." 
                className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            />
        </div>
        <div className="p-2">
            <p className="px-2 py-1 text-xs text-muted-foreground">Suggestions</p>
            <ul className="space-y-1">
                {commands.map((cmd, i) => (
                    <li key={i}>
                        <button
                            onClick={() => cmd.path ? handleSelect(cmd.path) : cmd.action?.()}
                            className={cn(
                                "w-full text-left flex items-center gap-3 p-2 rounded-md",
                                "hover:bg-primary/20 transition-colors duration-200"
                            )}
                        >
                            <cmd.icon className="h-4 w-4 text-primary" />
                            <span className="font-satoshi">{cmd.text}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CommandMenu;
