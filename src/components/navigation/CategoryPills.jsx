import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Flame,
  Sparkles,
  History,
  Music2,
  ChevronDown,
  X,
  Heart,
  PartyPopper,
  Frown,
  Radio,
  Folder,
  Mic2,
  Check,
  Search
} from 'lucide-react';
import { extractTopArtists, DEFAULT_TOP_ARTISTS } from '../../utils/categoryExtractor';

export function CategoryPills({
  songs = [],
  drivePlaylists = [],
  activeFilter = { type: 'all', value: null },
  onSelectFilter,
  onClearFilter
}) {
  const [openDropdown, setOpenDropdown] = useState(null); // 'genres' | 'playlists' | 'artists' | null
  const [artistSearch, setArtistSearch] = useState('');
  const containerRef = useRef(null);

  // Extract top artists from loaded library with guaranteed defaults
  const topArtists = useMemo(() => {
    const list = extractTopArtists(songs);
    return list.length > 0 ? list : DEFAULT_TOP_ARTISTS;
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

  const isAllActive = activeFilter.type === 'all';
  const isTrendingActive = activeFilter.type === 'trending';
  const isNewActive = activeFilter.type === 'new';
  const isOldActive = activeFilter.type === 'old';
  const isGenreActive = activeFilter.type === 'genre';
  const isPlaylistActive = activeFilter.type === 'playlist';
  const isArtistActive = activeFilter.type === 'artist';

  const genresList = [
    { id: 'love', label: 'Love & Romantic', icon: Heart, count: songs.filter(s => (s.folderName || '').includes('Love') || /love|ishq|dil|pyar/i.test(s.title)).length },
    { id: 'dance', label: 'Dance & Party', icon: PartyPopper, count: songs.filter(s => (s.folderName || '').includes('DANCE') || /dance|party|mashup|remix/i.test(s.title)).length },
    { id: 'sad', label: 'Sad & Emotional', icon: Frown, count: songs.filter(s => (s.folderName || '').includes('Sad') || /sad|dard|aawaara/i.test(s.title)).length },
    { id: 'bhojpuri', label: 'Bhojpuri Dhamaka', icon: Radio, count: songs.filter(s => (s.folderName || '').includes('Bhojpuri') || /bhojpuri|pawan|khesari/i.test(`${s.title} ${s.name}`)).length },
  ];

  return (
    <div className="relative select-none" ref={containerRef}>
      {/* 1. Horizontally scrolling pill rail (Overflow X only) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5">
        {/* 'All' Reset Pill */}
        <button
          type="button"
          onClick={() => onClearFilter()}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
            isAllActive
              ? 'crimson-glow-btn text-white shadow-md'
              : 'glass-card hover:border-white/20 text-slate-300 hover:text-white'
          }`}
        >
          <Music2 className="w-3.5 h-3.5" />
          <span>All</span>
        </button>

        {/* 🔥 Trending Songs */}
        <button
          type="button"
          onClick={() =>
            isTrendingActive
              ? onClearFilter()
              : handleSelect({ type: 'trending', value: 'trending' })
          }
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
            isTrendingActive
              ? 'crimson-glow-btn text-white shadow-md'
              : 'glass-card hover:border-white/20 text-slate-300 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>Trending Songs</span>
          {isTrendingActive && (
            <X className="w-3 h-3 ml-0.5 hover:text-slate-200" onClick={(e) => { e.stopPropagation(); onClearFilter(); }} />
          )}
        </button>

        {/* New Songs */}
        <button
          type="button"
          onClick={() =>
            isNewActive
              ? onClearFilter()
              : handleSelect({ type: 'new', value: 'new' })
          }
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
            isNewActive
              ? 'crimson-glow-btn text-white shadow-md'
              : 'glass-card hover:border-white/20 text-slate-300 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>New Songs</span>
          {isNewActive && (
            <X className="w-3 h-3 ml-0.5 hover:text-slate-200" onClick={(e) => { e.stopPropagation(); onClearFilter(); }} />
          )}
        </button>

        {/* Old Songs */}
        <button
          type="button"
          onClick={() =>
            isOldActive
              ? onClearFilter()
              : handleSelect({ type: 'old', value: 'old' })
          }
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
            isOldActive
              ? 'crimson-glow-btn text-white shadow-md'
              : 'glass-card hover:border-white/20 text-slate-300 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5 text-amber-300" />
          <span>Old Songs</span>
          {isOldActive && (
            <X className="w-3 h-3 ml-0.5 hover:text-slate-200" onClick={(e) => { e.stopPropagation(); onClearFilter(); }} />
          )}
        </button>

        {/* Moods & Genres ∨ */}
        <button
          type="button"
          onClick={(e) => toggleDropdown('genres', e)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
            isGenreActive
              ? 'crimson-glow-btn text-white shadow-md'
              : 'glass-card hover:border-white/20 text-slate-300 hover:text-white'
          }`}
        >
          <span>
            {isGenreActive
              ? `Genre: ${genresList.find(g => g.id === activeFilter.value)?.label || activeFilter.value}`
              : 'Moods & Genres'}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'genres' ? 'rotate-180' : ''}`} />
        </button>

        {/* Top Playlist ∨ */}
        <button
          type="button"
          onClick={(e) => toggleDropdown('playlists', e)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
            isPlaylistActive
              ? 'crimson-glow-btn text-white shadow-md'
              : 'glass-card hover:border-white/20 text-slate-300 hover:text-white'
          }`}
        >
          <Folder className="w-3.5 h-3.5 text-[#A31C1B]" />
          <span>
            {isPlaylistActive ? `Playlist: ${activeFilter.value}` : 'Top Playlist'}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'playlists' ? 'rotate-180' : ''}`} />
        </button>

        {/* Top Artist ∨ */}
        <button
          type="button"
          onClick={(e) => toggleDropdown('artists', e)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
            isArtistActive
              ? 'crimson-glow-btn text-white shadow-md'
              : 'glass-card hover:border-white/20 text-slate-300 hover:text-white'
          }`}
        >
          <Mic2 className="w-3.5 h-3.5 text-[#A31C1B]" />
          <span>
            {isArtistActive ? `Singer: ${activeFilter.value}` : 'Top Artist'}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'artists' ? 'rotate-180' : ''}`} />
        </button>

        {/* Clear Filter Pill (Shown if any filter is active) */}
        {!isAllActive && (
          <button
            type="button"
            onClick={() => onClearFilter()}
            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-rose-300 hover:text-white hover:bg-rose-950/40 border border-rose-900/40 transition-colors"
            title="Reset all filters"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 2. Floating Dropdown Popover Menus (OUTSIDE THE OVERFLOW-X CONTAINER!) */}

      {/* A. Genres Dropdown Menu */}
      {openDropdown === 'genres' && (
        <div className="absolute left-2 sm:left-48 top-full mt-2 w-72 max-w-[calc(100vw-20px)] rounded-2xl bg-[#171717] border border-[#282f2b] shadow-[0_20px_50px_rgba(0,0,0,0.95)] py-2 z-50 text-xs backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-[#282f2b] mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Moods & Genres
            </p>
            <button
              onClick={() => setOpenDropdown(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {genresList.map((genre) => {
            const Icon = genre.icon;
            const isSelected = isGenreActive && activeFilter.value === genre.id;
            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => handleSelect({ type: 'genre', value: genre.id })}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-slate-200 hover:bg-[#222222] hover:text-white text-left transition-colors font-medium"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-[#A31C1B]" />
                  <span>{genre.label}</span>
                </div>
                {isSelected ? (
                  <Check className="w-4 h-4 text-[#A31C1B]" />
                ) : (
                  genre.count > 0 && (
                    <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded-full bg-black/40">
                      {genre.count}
                    </span>
                  )
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* B. Playlists Dropdown Menu */}
      {openDropdown === 'playlists' && (
        <div className="absolute left-2 sm:left-72 top-full mt-2 w-72 max-w-[calc(100vw-20px)] rounded-2xl bg-[#171717] border border-[#282f2b] shadow-[0_20px_50px_rgba(0,0,0,0.95)] py-2 z-50 text-xs backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-[#282f2b] mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Drive Playlists & Folders
            </p>
            <button
              onClick={() => setOpenDropdown(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {drivePlaylists.length > 0 ? (
            drivePlaylists.map((folder) => {
              const isSelected = isPlaylistActive && activeFilter.value === folder.name;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => handleSelect({ type: 'playlist', value: folder.name })}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-slate-200 hover:bg-[#222222] hover:text-white text-left transition-colors font-medium"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <Folder className="w-4 h-4 text-[#A31C1B] flex-shrink-0" />
                    <span className="truncate">{folder.name}</span>
                  </div>
                  {isSelected ? (
                    <Check className="w-4 h-4 text-[#A31C1B] flex-shrink-0" />
                  ) : (
                    folder.songCount !== undefined && (
                      <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded-full bg-black/40 flex-shrink-0">
                        {folder.songCount} {folder.songCount === 1 ? 'song' : 'songs'}
                      </span>
                    )
                  )}
                </button>
              );
            })
          ) : (
            <p className="px-3.5 py-3 text-slate-400 italic">No playlists found</p>
          )}
        </div>
      )}

      {/* C. Top Artists Dropdown Menu (WITH SINGER LIST & SEARCH) */}
      {openDropdown === 'artists' && (
        <div className="absolute right-1 sm:right-auto sm:left-64 top-full mt-2 w-80 max-w-[calc(100vw-16px)] rounded-2xl bg-[#171717] border border-[#282f2b] shadow-[0_20px_60px_rgba(0,0,0,0.95)] p-2.5 z-50 text-xs backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#282f2b] mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <Mic2 className="w-3.5 h-3.5 text-[#A31C1B]" />
              <span className="font-bold text-slate-200 text-xs">
                Top Singers ({topArtists.length})
              </span>
            </div>
            <button
              onClick={() => {
                setOpenDropdown(null);
                setArtistSearch('');
              }}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick singer search input inside dropdown */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={artistSearch}
              onChange={(e) => setArtistSearch(e.target.value)}
              placeholder="Filter singers..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-[#0e1411] border border-[#282f2b] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#A31C1B]"
            />
            {artistSearch && (
              <button
                onClick={() => setArtistSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Scrollable list of singers */}
          <div className="max-h-72 overflow-y-auto no-scrollbar space-y-0.5">
            {filteredArtists.length > 0 ? (
              filteredArtists.map((artist) => {
                const isSelected = isArtistActive && activeFilter.value === artist.name;
                return (
                  <button
                    key={artist.name}
                    type="button"
                    onClick={() => handleSelect({ type: 'artist', value: artist.name })}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors font-medium ${
                      isSelected
                        ? 'bg-[#A31C1B] text-white'
                        : 'text-slate-200 hover:bg-[#222222] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#A31C1B]/20 text-[#fca5a5]'
                      }`}>
                        {artist.name.charAt(0)}
                      </div>
                      <span className="truncate">{artist.name}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-black/30 text-white' : 'bg-black/40 text-slate-400'
                      }`}>
                        {artist.count} {artist.count === 1 ? 'song' : 'songs'}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="py-4 text-center text-slate-400 italic">No singers match &ldquo;{artistSearch}&rdquo;</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
