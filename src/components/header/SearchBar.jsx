import React from 'react';
import { Search, X, ArrowUpDown } from 'lucide-react';

export function SearchBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  totalCount = 0
}) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 my-3">
      {/* Search Input Field - Glass Capsule with Crimson Focus */}
      <div className="relative flex-1 group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#A31C1B] transition-colors pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by song title or artist..."
          className="w-full pl-10 pr-11 h-11 min-h-[44px] text-xs sm:text-sm rounded-xl glass-panel text-white placeholder-slate-500 focus:outline-none focus:border-[#A31C1B] focus:ring-2 focus:ring-[#A31C1B]/30 transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors active:scale-90"
            aria-label="Clear search query"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sort selection dropdown */}
      <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
        <div className="flex items-center gap-1.5 px-3 h-11 min-h-[44px] rounded-xl glass-panel text-slate-300 text-xs shadow-sm hover:border-[#A31C1B]/40 transition-colors">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#A31C1B]" />
          <span className="text-slate-400 hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
          >
            <option value="newest" className="bg-[#171717] text-white">Newest Added</option>
            <option value="oldest" className="bg-[#171717] text-white">Oldest</option>
            <option value="title-asc" className="bg-[#171717] text-white">Song Title (A-Z)</option>
            <option value="artist-asc" className="bg-[#171717] text-white">Artist (A-Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
