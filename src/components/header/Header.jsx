import React from 'react';
import { Heart } from 'lucide-react';
import { Logo } from '../common/Logo';
import { AuthHeaderButton } from '../auth/AuthControls';

export function Header({
  onLogoClick,
  onOpenSettings,
  onOpenMenu,
  onOpenFavorites,
  isFavoritesActive = false,
  favoritesCount = 0
}) {

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

        {/* Right Actions: Favorites, Clerk Avatar & 3-Line Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Favorites Button in Header (Heart icon with count badge & toggle close support) */}
          <button
            onClick={onOpenFavorites}
            className={`w-8.5 h-8.5 sm:w-9 sm:h-9 min-w-[34px] min-h-[34px] flex items-center justify-center rounded-full active:scale-95 transition-all shadow-sm group select-none relative flex-shrink-0 border ${
              isFavoritesActive
                ? 'bg-[#A31C1B]/30 border-[#A31C1B] text-white shadow-[0_0_12px_rgba(163,28,27,0.5)] ring-1 ring-[#A31C1B]/60'
                : 'glass-card hover:border-[#A31C1B]/50 hover:bg-white/[0.08] text-slate-200'
            }`}
            aria-label={isFavoritesActive ? 'Close Favorites and return' : 'View Favorites'}
            aria-pressed={isFavoritesActive}
            title={isFavoritesActive ? 'Close Favorites' : 'Favorites'}
          >
            <Heart
              className={`w-4 h-4 transition-all ${
                isFavoritesActive
                  ? 'text-rose-400 fill-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                  : 'text-rose-400 group-hover:scale-110 group-hover:text-rose-300 fill-rose-500/20'
              }`}
            />
            {favoritesCount > 0 && (
              <span className={`absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-[#06110c] ${
                isFavoritesActive ? 'bg-rose-500' : 'bg-[#A31C1B]'
              }`}>
                {favoritesCount > 99 ? '99+' : favoritesCount}
              </span>
            )}
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
