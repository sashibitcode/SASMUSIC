import React, { useRef, useEffect, useMemo } from 'react';
import { Search, X, SearchX, Music2, ArrowUpDown } from 'lucide-react';
import { SongRow } from './SongRow';
import { useDebounce } from '../../hooks/useDebounce';

export function SearchView({
  songs = [],
  searchQuery = '',
  onSearchChange,
  sortBy = 'newest',
  onSortChange
}) {
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(searchQuery, 150);

  // Auto-focus search input when search view mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Filter and sort songs
  const filteredSongs = useMemo(() => {
    const seenIds = new Set();
    const unique = [];

    for (const song of songs) {
      if (!song || !song.id) continue;
      if (seenIds.has(song.id)) continue;
      seenIds.add(song.id);
      unique.push(song);
    }

    let result = unique;

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      result = result.filter(
        (song) =>
          (song.title && song.title.toLowerCase().includes(q)) ||
          (song.artist && song.artist.toLowerCase().includes(q)) ||
          (song.folderName && song.folderName.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'title-asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'artist-asc') {
        return (a.artist || '').localeCompare(b.artist || '');
      }
      if (sortBy === 'oldest') {
        return new Date(a.modifiedTime || 0) - new Date(b.modifiedTime || 0);
      }
      return new Date(b.modifiedTime || 0) - new Date(a.modifiedTime || 0);
    });

    return result;
  }, [songs, searchQuery, sortBy]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Search Header Bar with Input and Sort */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 my-2">
        {/* Search Input Field */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A31C1B] transition-colors pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search songs, artists, folders..."
            className="w-full pl-10 pr-11 h-11 min-h-[44px] text-xs sm:text-sm rounded-xl glass-panel text-white placeholder-slate-500 focus:outline-none focus:border-[#A31C1B] focus:ring-2 focus:ring-[#A31C1B]/30 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors active:scale-90"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort selector dropdown */}
        <div className="flex items-center gap-1.5 px-3 h-11 min-h-[44px] rounded-xl glass-panel text-slate-300 text-xs shadow-sm hover:border-[#A31C1B]/40 transition-colors self-end sm:self-auto flex-shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#A31C1B]" />
          <span className="text-slate-400 hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
          >
            <option value="newest" className="bg-[#171717] text-white">Newest Added</option>
            <option value="oldest" className="bg-[#171717] text-white">Oldest</option>
            <option value="title-asc" className="bg-[#171717] text-white">Title (A-Z)</option>
            <option value="artist-asc" className="bg-[#171717] text-white">Artist (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      {searchQuery.trim() === '' ? (
        <div className="space-y-6">
          {/* Friendly prompt card */}
          <div className="p-6 rounded-2xl glass-card text-center border border-white/[0.06] my-4">
            <div className="w-12 h-12 rounded-full bg-[#A31C1B]/15 border border-[#A31C1B]/30 flex items-center justify-center mx-auto mb-3 text-[#A31C1B]">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Search SAS Music</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Find any track in your Google Drive library by typing the song title or artist name above.
            </p>
          </div>

          {/* Quick browse all songs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#282f2b]">
              <span className="text-xs font-semibold text-slate-400">
                Browse All Tracks ({songs.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {filteredSongs.slice(0, 30).map((song, index) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={index}
                  playlist={filteredSongs}
                />
              ))}
            </div>
          </div>
        </div>
      ) : filteredSongs.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#282f2b]">
            <span className="text-xs font-semibold text-slate-400">
              {filteredSongs.length} {filteredSongs.length === 1 ? 'result' : 'results'} found
            </span>
          </div>
          <div className="space-y-1.5">
            {filteredSongs.map((song, index) => (
              <SongRow
                key={song.id}
                song={song}
                index={index}
                playlist={filteredSongs}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Empty search results state */
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl glass-card text-center my-6 space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#1c1414] border border-[#A31C1B]/30 flex items-center justify-center text-[#A31C1B]">
            <SearchX className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No songs found</h3>
            <p className="text-xs text-slate-400 mt-1">
              No matching tracks found for &ldquo;<span className="text-slate-200 font-medium">{searchQuery}</span>&rdquo;
            </p>
          </div>
          <button
            onClick={() => onSearchChange('')}
            className="px-4 py-2 rounded-xl glass-card hover:border-[#A31C1B]/50 text-xs font-semibold text-slate-200 transition-colors"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
}
