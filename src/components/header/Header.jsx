import React from 'react';
import { Settings } from 'lucide-react';
import { Logo } from '../common/Logo';

export function Header({ onLogoClick, onOpenSettings }) {
  return (
    <header className="sticky top-0 z-20 bg-[#06110c]/85 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.7)] px-4 sm:px-6 py-3 pt-safe">
      {/* Accessible Headings for Screen Readers & SEO */}
      <h1 className="sr-only">SAS Music - Free Ad-Free Progressive Web App Music Player</h1>

      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Official Brand Logo */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-[#A31C1B]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          <Logo
            className="h-8 sm:h-9 w-auto relative z-10"
            onClick={onLogoClick}
          />
        </div>

        {/* Discreet Settings & Studio Trigger Button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full glass-card hover:border-[#A31C1B]/50 text-slate-300 hover:text-white transition-all active:scale-95 shadow-sm group select-none"
            aria-label="Settings and Studio"
          >
            <Settings className="w-4 h-4 text-slate-300 group-hover:text-white transition-transform group-hover:rotate-45" />
          </button>
        )}
      </div>
    </header>
  );
}
