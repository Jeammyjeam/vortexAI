'use client';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface CommandMenuContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggle: () => void;
}

const CommandMenuContext = createContext<CommandMenuContextType | undefined>(undefined);

export const CommandMenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useCallback(() => setIsOpen(open => !open), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [toggle]);

  return (
    <CommandMenuContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      {children}
    </CommandMenuContext.Provider>
  );
};

export const useCommandMenu = () => {
  const context = useContext(CommandMenuContext);
  if (context === undefined) {
    throw new Error('useCommandMenu must be used within a CommandMenuProvider');
  }
  return context;
};
