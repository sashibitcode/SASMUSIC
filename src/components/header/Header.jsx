import React from 'react';
import { Settings, Users } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useSyncPlay } from '../../contexts/SyncPlayContext';
import { AuthHeaderButton } from '../auth/AuthControls';

export function Header({ onLogoClick, onOpenSettings, onOpenMenu }) {
  const { isInRoom, roomCode, setIsSyncModalOpen } = useSyncPlay();

  const handleMenuClick = () => {
    if (onOpenMenu) {
      onOpenMenu();
    } else if (onOpenSettings) {
      onOpenSettings();
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-[#06110c]/90 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.7)] px-3 sm:px-6 py-2 sm:py-2.5 pt-safe">
      {/* Accessible Headings for Screen Readers & SEO */}
      <h1 className="sr-only">SAS Music - Free Ad-Free Progressive Web App Music Player</h1>

      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Official Brand Logo */}
        <div className="relative group flex items-center flex-shrink-0">
          <div className="absolute -inset-1 bg-[#A31C1B]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          <Logo
            className="h-7 sm:h-9 w-auto relative z-10 cursor-pointer"
            onClick={onLogoClick}
          />
        </div>

        {/* Right Actions: Listen Together, Clerk Avatar & 3-Line Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Listen Together (With Friends) Button - shown on sm+ or when actively in room */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-full ${isInRoom ? 'flex' : 'hidden sm:flex'} items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm select-none border flex-shrink-0 ${isInRoom
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
            <span className="text-xs font-semibold whitespace-nowrap hidden sm:inline">
              {isInRoom ? `Room #${roomCode}` : 'With Friends'}
            </span>
          </button>

          {/* Clerk Auth Button / Avatar (Single circular avatar, no exit button) */}
          <AuthHeaderButton />

          {/* Mobile 3-line Hamburger Menu Button - Always guaranteed visible on all phone screen sizes */}
          {(onOpenMenu || onOpenSettings) && (
            <button
              onClick={handleMenuClick}
              className="w-8.5 h-8.5 sm:w-9 sm:h-9 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-full glass-card hover:border-[#A31C1B]/50 hover:bg-white/[0.08] active:scale-95 transition-all shadow-sm group select-none relative flex-shrink-0"
              aria-label="Open Navigation Menu"
              title="Menu & Settings"
            >
              {/* Custom 3-line hamburger icon: refined sleek proportions matching user request */}
              <div className="flex flex-col justify-center items-start gap-[3px] sm:gap-[3.5px] w-4.5 sm:w-5 h-4.5 sm:h-5 pointer-events-none pl-0.5">
                <span className="h-[2px] w-3.5 bg-slate-200 group-hover:bg-[#fca5a5] rounded-full transition-all group-hover:w-5 shadow-sm" />
                <span className="h-[2px] w-4.5 sm:w-5 bg-white group-hover:bg-[#fca5a5] rounded-full transition-all shadow-sm" />
                <span className="h-[2px] w-2.5 bg-slate-200 group-hover:bg-[#fca5a5] rounded-full transition-all group-hover:w-4 shadow-sm" />
              </div>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
