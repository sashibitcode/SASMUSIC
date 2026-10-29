import React from 'react';
import { Music, Search, Folder, Heart, Upload } from 'lucide-react';

export function BottomNav({ activeTab, onTabChange, favoritesCount = 0, onUploadClick }) {
  const navItems = [
    {
      id: 'songs',
      label: 'Home',
      icon: Music
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search
    },
    {
      id: 'upload',
      label: 'Upload',
      icon: Upload,
      isAction: true
    },
    {
      id: 'playlists',
      label: 'Playlists',
      icon: Folder
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: Heart,
      badge: favoritesCount
    }
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#06110c]/95 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-4px_25px_rgba(0,0,0,0.85)] pb-safe transition-all"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around h-14 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          const handleClick = () => {
            if (item.isAction) {
              onUploadClick?.();
            } else {
              onTabChange(item.id);
            }
          };

          return (
            <button
              key={item.id}
              onClick={handleClick}
              className="flex-1 min-h-[48px] flex flex-col items-center justify-center relative py-1 transition-transform active:scale-90 group select-none"
              aria-label={item.label}
              aria-selected={isActive}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    item.isAction
                      ? 'text-[#A31C1B] group-hover:scale-110 drop-shadow-[0_0_8px_rgba(163,28,27,0.6)]'
                      : isActive
                      ? 'text-[#A31C1B] scale-110 drop-shadow-[0_0_10px_rgba(163,28,27,0.7)]'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-1 bg-[#A31C1B] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-[#06110c]">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] tracking-wider font-semibold mt-1 transition-colors ${
                  item.isAction
                    ? 'text-white/90 group-hover:text-white font-bold'
                    : isActive 
                    ? 'text-white font-bold' 
                    : 'text-slate-400 group-hover:text-slate-300'
                }`}
              >
                {item.label}
              </span>

              {/* Active bottom glow indicator */}
              {isActive && !item.isAction && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-[#A31C1B] rounded-full shadow-[0_0_8px_rgba(163,28,27,0.9)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
