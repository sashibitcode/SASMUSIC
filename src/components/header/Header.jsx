import React from 'react';
import { Settings, Users } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useSyncPlay } from '../../contexts/SyncPlayContext';

export function Header({ onLogoClick, onOpenSettings }) {
  const { isInRoom, roomCode, setIsSyncModalOpen } = useSyncPlay();

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

        {/* Right Actions: Listen Together & Settings */}
        <div className="flex items-center gap-2">
          {/* Listen Together (With Friends) Button */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className={`min-h-[38px] px-3 rounded-full flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm select-none border ${
              isInRoom
                ? 'bg-[#A31C1B]/25 border-[#A31C1B] text-white shadow-[0_0_12px_rgba(163,28,27,0.4)]'
                : 'glass-card hover:border-[#A31C1B]/50 text-slate-200 hover:text-white'
            }`}
            aria-label="Listen Together with Friends"
            title="Listen Together with Friends"
          >
            <span className="relative flex h-2 w-2">
              {isInRoom && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isInRoom ? 'bg-[#A31C1B]' : 'bg-emerald-400'}`} />
            </span>
            <Users className="w-4 h-4 text-[#fca5a5]" />
            <span className="text-xs font-semibold whitespace-nowrap">
              {isInRoom ? `Room #${roomCode}` : 'With Friends'}
            </span>
          </button>

          {/* Settings Trigger Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full glass-card hover:border-[#A31C1B]/50 text-slate-300 hover:text-white transition-all active:scale-95 shadow-sm group select-none"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-slate-300 group-hover:text-white transition-transform group-hover:rotate-45" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
