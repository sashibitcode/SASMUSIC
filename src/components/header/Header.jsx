import React from 'react';
import { Logo } from '../common/Logo';

export function Header({ onOpenConfig }) {
  return (
    <header className="sticky top-0 z-20 bg-[#06110c]/85 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.7)] px-4 sm:px-6 py-3 pt-safe">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Official Brand Logo */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-[#A31C1B]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          <Logo
            className="h-8 sm:h-9 w-auto relative z-10"
            onClick={onOpenConfig}
          />
        </div>
      </div>
    </header>
  );
}
