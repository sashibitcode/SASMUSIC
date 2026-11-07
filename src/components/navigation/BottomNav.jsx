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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#06110c]/95 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-4px_25px_rgba(0,0,0,0.85)] pb-safe transition-all"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around h-14 px-2 max-w-md mx-auto">
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
              className={`flex-1 min-h-[48px] flex flex-col items-center justify-center relative py-1 transition-transform active:scale-90 group select-none ${
                isTogether ? 'relative' : ''
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    isActive
                      ? 'text-[#A31C1B] scale-110 drop-shadow-[0_0_10px_rgba(163,28,27,0.7)]'
                      : isTogether
                      ? isInRoom
                        ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                        : 'text-emerald-400 group-hover:text-emerald-300'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {/* Together Live Dot indicator */}
                {isTogether && (
                  <span className="absolute -top-1 -right-1.5 flex h-2 w-2">
                    {isInRoom && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        isInRoom ? 'bg-[#A31C1B]' : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                      }`}
                    />
                  </span>
                )}

                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-1 bg-[#A31C1B] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-[#06110c]">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] tracking-wider font-semibold mt-1 transition-colors ${
                  isActive
                    ? 'text-white font-bold'
                    : isTogether
                    ? isInRoom
                      ? 'text-red-400 font-bold'
                      : 'text-emerald-400 font-bold'
                    : 'text-slate-400 group-hover:text-slate-300'
                }`}
              >
                {item.label}
              </span>

              {/* Active bottom glow indicator */}
              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-[#A31C1B] rounded-full shadow-[0_0_8px_rgba(163,28,27,0.9)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
