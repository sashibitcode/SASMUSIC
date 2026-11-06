import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Music2,
  ChevronDown,
  X,
  Mic2,
  Folder,
  Search,
  Check
} from 'lucide-react';
import { MUSIC_CATEGORIES, extractTopArtists } from '../../utils/categoryExtractor';
import { ArtistAvatar } from '../common/ArtistAvatar';

export function CategoryPills({
  songs = [],
  drivePlaylists = [],
  activeFilter = { type: 'all', value: null },
  onSelectFilter,
  onClearFilter
}) {
  const [openDropdown, setOpenDropdown] = useState(null); // 'artists' | 'folders' | null
  const [artistSearch, setArtistSearch] = useState('');
  const containerRef = useRef(null);

  // Extract top artists from loaded library
  const topArtists = useMemo(() => {
    return extractTopArtists(songs);
  }, [songs]);

  // Filtered artists inside dropdown based on search
  const filteredArtists = useMemo(() => {
    if (!artistSearch.trim()) return topArtists;
    const q = artistSearch.toLowerCase().trim();
    return topArtists.filter((a) => a.name.toLowerCase().includes(q));
  }, [topArtists, artistSearch]);

  // Close dropdown on outside click or escape
  useEffect(() => {
    if (!openDropdown) return;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenDropdown(null);
        setArtistSearch('');
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setArtistSearch('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDropdown]);

  const toggleDropdown = (name, e) => {
    e.stopPropagation();
    setOpenDropdown((prev) => (prev === name ? null : name));
    setArtistSearch('');
  };

  const handleSelect = (filter) => {
    setOpenDropdown(null);
    setArtistSearch('');
    onSelectFilter(filter);
  };

  const isAllActive = !activeFilter || activeFilter.type === 'all' || !activeFilter.value;

  return (
    <div className="relative select-none" ref={containerRef}>
      {/* Horizontally scrolling pill rail */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5">
        {/* 'All' Reset Pill */}
        <button
          type="button"
          onClick={() => onClearFilter()}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${isAllActive
              ? 'crimson-glow-btn text-white shadow-md'
              : 'glass-card hover:border-white/20 text-slate-300 hover:text-white'
            }`}
        >
          <Music2 className="w-3.5 h-3.5" />
          <span>All Songs</span>
        </button>

        {/* Dynamic Category Pills */}
        {MUSIC_CATEGORIES.map((cat) => {
          const isActive =
            activeFilter?.type === 'category' &&
            activeFilter?.value?.toLowerCase() === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                isActive
                  ? onClearFilter()
                  : handleSelect({ type: 'category', value: cat.id })
              }
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${isActive
                  ? 'crimson-glow-btn text-white shadow-md'
                  : 'glass-card hover:border-white/20 text-slate-300 hover:text-white'
                }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.shortLabel || cat.label}</span>
              {isActive && (
                <X
                  className="w-3 h-3 ml-0.5 text-white/80 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearFilter();
                  }}
                />
              )}
            </button>
          );
        })}

        {/* 🎙️ Artists Dropdown */}
        {topArtists.length > 0 && (
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={(e) => toggleDropdown('artists', e)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${activeFilter?.type === 'artist'
                  ? 'crimson-glow-btn text-white shadow-md'
                  : 'glass-card hover:border-white/20 text-slate-300 hover:text-white'
                }`}
            >
              <Mic2 className="w-3.5 h-3.5 text-[#fca5a5]" />
              <span>
                {activeFilter?.type === 'artist' ? activeFilter.value : 'Artists'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'artists' ? 'rotate-180' : ''}`} />
            </button>

            {/* Artists Menu */}
            {openDropdown === 'artists' && (
              <div className="absolute left-0 mt-2 w-64 max-h-72 bg-[#171717] border border-[#282f2b] rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-50 p-2 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                <div className="relative mb-2 px-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={artistSearch}
                    onChange={(e) => setArtistSearch(e.target.value)}
                    placeholder="Search singers..."
                    className="w-full bg-[#121614] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#A31C1B]"
                    autoFocus
                  />
                </div>

                <div className="overflow-y-auto max-h-52 space-y-0.5 no-scrollbar">
                  {filteredArtists.map((artist) => {
                    const isSelected = activeFilter?.type === 'artist' && activeFilter?.value === artist.name;
                    return (
                      <button
                        key={artist.name}
                        onClick={() => handleSelect({ type: 'artist', value: artist.name })}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${isSelected
                            ? 'bg-[#A31C1B]/30 text-white font-semibold'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                          }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ArtistAvatar
                            artistName={artist.name}
                            size="xs"
                            showRing={false}
                          />
                          <span className="truncate">{artist.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono ml-2 flex-shrink-0">
                          {artist.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 📁 Drive Playlists / Folders Dropdown */}
        {drivePlaylists.length > 0 && (
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={(e) => toggleDropdown('folders', e)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${activeFilter?.type === 'playlist'
                  ? 'crimson-glow-btn text-white shadow-md'
                  : 'glass-card hover:border-white/20 text-slate-300 hover:text-white'
                }`}
            >
              <Folder className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {activeFilter?.type === 'playlist' ? activeFilter.value : 'Folders'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === 'folders' ? 'rotate-180' : ''}`} />
            </button>

            {/* Folders Menu */}
            {openDropdown === 'folders' && (
              <div className="absolute right-0 mt-2 w-56 bg-[#171717] border border-[#282f2b] rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-50 p-2 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                <div className="overflow-y-auto max-h-52 space-y-0.5 no-scrollbar">
                  {drivePlaylists.map((folder) => {
                    const isSelected = activeFilter?.type === 'playlist' && activeFilter?.value === folder.name;
                    return (
                      <button
                        key={folder.id}
                        onClick={() => handleSelect({ type: 'playlist', value: folder.name })}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${isSelected
                            ? 'bg-[#A31C1B]/30 text-white font-semibold'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                          }`}
                      >
                        <span className="truncate">{folder.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2">
                          {folder.songCount || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
