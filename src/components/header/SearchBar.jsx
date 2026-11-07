import React from 'react';
import { Search, X, ArrowUpDown, Shuffle, ChevronDown } from 'lucide-react';

export function SearchBar({
  inputRef,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange
}) {
  return (
    <div className="flex items-center gap-2 w-full">
      {/* Search Input Field - Glass Capsule with Crimson Focus */}
      <div className="relative flex-1 min-w-0 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A31C1B] transition-colors pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search songs, artists..."
          aria-label="Search songs, artists, and playlists"
          className="w-full pl-9 pr-9 h-8.5 sm:h-9 min-h-[34px] sm:min-h-[36px] text-xs sm:text-sm rounded-xl glass-panel text-white placeholder-slate-500 focus:outline-none focus:border-[#A31C1B] focus:ring-2 focus:ring-[#A31C1B]/30 transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[30px] min-h-[30px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors active:scale-90"
            aria-label="Clear search query"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Compact Sort / Shuffle Dropdown */}
      {onSortChange && (
        <div className="relative flex-shrink-0 flex items-center">
          <div className="relative flex items-center gap-1.5 px-2.5 h-8.5 sm:h-9 min-h-[34px] sm:min-h-[36px] rounded-xl glass-panel border border-white/10 hover:border-[#A31C1B]/50 transition-colors shadow-sm cursor-pointer group">
            {sortBy === 'shuffle' ? (
              <Shuffle className="w-3.5 h-3.5 text-[#A31C1B] flex-shrink-0 group-hover:rotate-12 transition-transform" />
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-[#A31C1B] flex-shrink-0" />
            )}
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="Sort or shuffle songs"
              className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer pr-4 appearance-none"
            >
              <option value="shuffle" className="bg-[#171717] text-white">Shuffle</option>
              <option value="newest" className="bg-[#171717] text-white">Newest</option>
              <option value="oldest" className="bg-[#171717] text-white">Oldest</option>
              <option value="title-asc" className="bg-[#171717] text-white">Title (A-Z)</option>
              <option value="artist-asc" className="bg-[#171717] text-white">Artist (A-Z)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none group-hover:text-white transition-colors" />
          </div>
        </div>
      )}
    </div>
  );
}
