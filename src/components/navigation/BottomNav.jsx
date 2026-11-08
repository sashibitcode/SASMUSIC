import React from 'react';
import { Music, Search, Folder, Users, History } from 'lucide-react';

export function BottomNav({
  activeTab,
  onTabChange,
  onOpenSync,
  isInRoom = false,
  roomCode = '',
  recentsCount = 0
}) {
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
      id: 'together',
      label: isInRoom ? `#${roomCode}` : 'Together',
      icon: Users,
      isAction: true
    },
    {
      id: 'playlists',
      label: 'Playlists',
      icon: Folder
    },
    {
      id: 'recents',
      label: 'Recents',
      icon: History,
      badge: recentsCount
    }
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#06110c]/92 backdrop-blur-3xl border-t border-white/[0.08] shadow-[0_-4px_20px_rgba(0,0,0,0.65)] pb-[max(0.25rem,env(safe-area-inset-bottom,0px))] transition-all"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around h-12 px-2 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isTogether = item.id === 'together';
          const isActive = !isTogether && activeTab === item.id;

          const handleClick = () => {
            if (isTogether) {
              onOpenSync?.();
            } else {
              onTabChange(item.id);
            }
          };

          return (
            <button
              key={item.id}
              onClick={handleClick}
              className={`flex-1 min-h-[42px] flex flex-col items-center justify-center relative py-0.5 transition-transform active:scale-95 group select-none ${
                isTogether ? 'relative' : ''
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active top indicator bar */}
              {isActive && (
                <span className="absolute top-0 w-5 h-0.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
              )}

              <div className="relative">
                <Icon
                  className={`w-[18px] h-[18px] transition-all duration-200 ${
                    isActive
                      ? 'text-white scale-105 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]'
                      : isTogether
                      ? isInRoom
                        ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.7)]'
                        : 'text-emerald-400 group-hover:text-emerald-300'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {/* Together Live Dot indicator */}
                {isTogether && (
                  <span className="absolute -top-0.5 -right-1 flex h-1.5 w-1.5">
                    <span
                      className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                        isInRoom ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]' : 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]'
                      }`}
                    />
                  </span>
                )}

                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[13px] h-[13px] px-0.5 bg-rose-500 text-white text-[8.5px] font-bold rounded-full flex items-center justify-center ring-1 ring-[#06110c]">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[9.5px] tracking-tight font-medium mt-0.5 leading-none transition-colors ${
                  isActive
                    ? 'text-white font-bold'
                    : isTogether
                    ? isInRoom
                      ? 'text-emerald-400 font-bold'
                      : 'text-emerald-400 font-bold'
                    : 'text-slate-400 group-hover:text-slate-300'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
