import React from 'react';
import {
  Music,
  Search,
  Folder,
  Heart,
  History,
  FolderOpen,
  Sparkles,
  Download,
  Settings,
  Radio
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useDrive } from '../../contexts/DriveContext';
import { useSyncPlay } from '../../contexts/SyncPlayContext';

export function DesktopSidebar({
  activeTab,
  onTabChange,
  favoritesCount = 0,
  recentsCount = 0,
  onOpenSettings,
  onSelectFolder
}) {
  const { drivePlaylists } = useDrive();
  const { isInRoom, roomCode, setIsSyncModalOpen } = useSyncPlay();

  const primaryLinks = [
    { id: 'songs', label: 'All Songs', icon: Music },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'playlists', label: 'Playlists', icon: Folder, count: drivePlaylists.length },
    { id: 'favorites', label: 'Favorites', icon: Heart, count: favoritesCount },
    { id: 'recents', label: 'Recently Played', icon: History, count: recentsCount }
  ];

  return (
    <aside
      className="hidden md:flex flex-col w-64 lg:w-72 h-full bg-[#171717]/95 backdrop-blur-2xl border-r border-white/[0.08] p-5 select-none flex-shrink-0"
      aria-label="Desktop Sidebar Navigation"
    >
      {/* Brand Logo */}
      <div className="mb-6 px-1">
        <Logo
          className="h-9 w-auto cursor-pointer"
          onClick={() => onTabChange('songs')}
        />
      </div>

      {/* SyncPlay Live Card */}
      <div className="mb-4">
        <button
          onClick={() => setIsSyncModalOpen(true)}
          className={`w-full min-h-[46px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            isInRoom
              ? 'bg-[#A31C1B]/25 border-[#A31C1B] text-white shadow-[0_0_15px_rgba(163,28,27,0.4)]'
              : 'glass-card hover:border-[#A31C1B]/50 text-slate-200 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-[#fca5a5]" />
            <span className="tracking-wide">SyncPlay</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
            isInRoom ? 'bg-[#A31C1B] text-white animate-pulse' : 'bg-black/40 text-emerald-400'
          }`}>
            {isInRoom ? `Room #${roomCode}` : 'LIVE'}
          </span>
        </button>
      </div>

      {/* Primary Navigation Links */}
      <nav className="space-y-1 mb-6">
        <p className="px-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
          Menu
        </p>
        {primaryLinks.map((link) => {
          const Icon = link.icon;
          const isActive = activeTab === link.id;

          return (
            <button
              key={link.id}
              onClick={() => onTabChange(link.id)}
              className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'crimson-glow-btn text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                <span className="tracking-wide">{link.label}</span>
              </div>

              {link.count !== undefined && link.count > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-black/30 text-white'
                      : 'bg-black/40 text-slate-400'
                  }`}
                >
                  {link.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Featured Playlists Section */}
      {drivePlaylists.length > 0 && (
        <div className="flex-1 overflow-y-auto no-scrollbar pt-2 border-t border-white/[0.08]">
          <p className="px-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
            <span>Playlists</span>
            <span className="text-emerald-400 text-[9px] font-medium lowercase">{drivePlaylists.length}</span>
          </p>
          <div className="space-y-1">
            {drivePlaylists.map((folder) => (
              <button
                key={folder.id}
                onClick={() => {
                  onTabChange('playlists');
                  onSelectFolder?.(folder.name);
                }}
                className="w-full min-h-[40px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] transition-colors truncate text-left"
              >
                <Music className="w-3.5 h-3.5 text-[#A31C1B] flex-shrink-0" />
                <span className="truncate">{folder.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Footer Info & Settings */}
      <div className="pt-3 border-t border-white/[0.08] mt-auto space-y-1">
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="w-full min-h-[40px] flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all group select-none"
          >
            <Settings className="w-4 h-4 text-slate-400 group-hover:text-white transition-transform group-hover:rotate-45" />
            <span>Settings</span>
          </button>
        )}

        <a
          href="https://sashibitcode.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2.5 rounded-xl bg-[#06110c]/80 border border-white/[0.08] hover:border-[#A31C1B]/50 transition-all group cursor-pointer shadow-sm"
          title="Shashikant Raj - Data Analyst & Full Stack Developer"
        >
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
              Shashikant Raj
            </span>
            <span className="text-[10px] text-[#fca5a5] font-mono">
              @sashibitcode • Developer
            </span>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-[#A31C1B] group-hover:scale-110 transition-transform" />
        </a>
      </div>
    </aside>
  );
}

