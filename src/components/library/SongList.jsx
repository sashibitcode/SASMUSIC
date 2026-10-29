import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Play, Shuffle, Music, SearchX, RotateCw, ArrowUpDown } from 'lucide-react';
import { SongRow } from './SongRow';
import { useAudio } from '../../contexts/AudioContext';
import { useDrive } from '../../contexts/DriveContext';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

const INITIAL_BATCH_SIZE = 35;
const BATCH_INCREMENT = 30;

export function SongList({ songs = [], searchQuery = '', sortBy = 'newest', onSortChange }) {
  const { playSong } = useAudio();
  const { refreshLibrary } = useDrive();

  // Lazy windowing state for 500+ songs
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const sentinelRef = useRef(null);
  const containerRef = useRef(null);

  // Pull-to-refresh hook
  const {
    pullDistance,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = usePullToRefresh({
    onRefresh: refreshLibrary,
    threshold: 65
  });

  // Filter and sort songs (strictly deduplicated)
  const filteredSongs = useMemo(() => {
    // Strict deduplication by ID and normalized title
    const seenIds = new Set();
    const seenTitles = new Set();
    const unique = [];

    for (const song of songs) {
      if (!song || !song.id) continue;
      if (seenIds.has(song.id)) continue;

      const norm = (song.title || song.name || '')
        .toLowerCase()
        .replace(/\(256k\)|\(320k\)|\(128k\)/gi, '')
        .replace(/[^a-z0-9]/gi, '');

      if (norm.length > 3 && seenTitles.has(norm)) {
        continue; // duplicate song!
      }

      seenIds.add(song.id);
      if (norm.length > 3) seenTitles.add(norm);
      unique.push(song);
    }

    let result = unique;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (song) =>
          (song.title && song.title.toLowerCase().includes(q)) ||
          (song.artist && song.artist.toLowerCase().includes(q))
      );
    }

    // Sort
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
      // default: newest
      return new Date(b.modifiedTime || 0) - new Date(a.modifiedTime || 0);
    });

    return result;
  }, [songs, searchQuery, sortBy]);

  // Reset visibleCount when search or sort changes
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH_SIZE);
  }, [searchQuery, sortBy]);

  // Sentinel IntersectionObserver: loads more songs as user scrolls down
  useEffect(() => {
    if (visibleCount >= filteredSongs.length) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_INCREMENT, filteredSongs.length));
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, filteredSongs.length]);

  const handlePlayAll = () => {
    if (filteredSongs.length > 0) {
      playSong(filteredSongs[0], filteredSongs);
    }
  };

  const handleShufflePlay = () => {
    if (filteredSongs.length > 0) {
      const shuffled = [...filteredSongs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], shuffled);
    }
  };

  if (filteredSongs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#171717] border border-[#282f2b] flex items-center justify-center text-slate-500 mb-3 shadow-lg">
          <SearchX className="w-8 h-8 text-[#A31C1B]" />
        </div>
        <h4 className="text-base font-bold text-white">No songs found</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          {searchQuery
            ? `No songs matched "${searchQuery}". Try searching with another song title or artist.`
            : 'No audio tracks found in this folder.'}
        </p>
      </div>
    );
  }

  // Sliced songs for maximum 60fps performance on 500+ tracks
  const displayedSongs = filteredSongs.slice(0, visibleCount);

  return (
    <div
      ref={containerRef}
      onTouchStart={(e) => handleTouchStart(e, containerRef.current)}
      onTouchMove={(e) => handleTouchMove(e, containerRef.current)}
      onTouchEnd={handleTouchEnd}
      className="space-y-3 pb-36 md:pb-28 relative touch-pan-y"
    >
      {/* Pull to refresh visual indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all duration-150 py-2"
          style={{ height: `${isRefreshing ? 50 : Math.min(pullDistance, 70)}px` }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#171717] border border-[#A31C1B]/50 shadow-md text-xs text-white">
            <RotateCw
              className={`w-3.5 h-3.5 text-[#A31C1B] ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              style={{
                transform: !isRefreshing ? `rotate(${pullDistance * 4}deg)` : undefined
              }}
            />
            <span className="text-[11px] font-semibold text-slate-300">
              {isRefreshing
                ? 'Syncing library...'
                : pullDistance >= 65
                ? 'Release to refresh'
                : 'Pull down to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between pb-2 border-b border-[#282f2b] gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs font-semibold text-slate-400">
            {filteredSongs.length} {filteredSongs.length === 1 ? 'song' : 'songs'}
          </span>

          {onSortChange && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg glass-card text-slate-300 text-[11px] shadow-sm hover:border-[#A31C1B]/40 transition-colors">
              <ArrowUpDown className="w-3 h-3 text-[#A31C1B]" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-[11px]"
                aria-label="Sort songs"
              >
                <option value="newest" className="bg-[#171717] text-white">Newest</option>
                <option value="oldest" className="bg-[#171717] text-white">Oldest</option>
                <option value="title-asc" className="bg-[#171717] text-white">Title (A-Z)</option>
                <option value="artist-asc" className="bg-[#171717] text-white">Artist (A-Z)</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShufflePlay}
            className="min-h-[40px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass-card hover:border-[#A31C1B]/50 text-slate-200 text-xs font-semibold transition-all active:scale-95 shadow-sm"
            aria-label="Shuffle play all songs"
          >
            <Shuffle className="w-4 h-4 text-[#A31C1B]" />
            <span>Shuffle</span>
          </button>

          <button
            onClick={handlePlayAll}
            className="min-h-[40px] flex items-center gap-1.5 px-4 py-1.5 rounded-xl crimson-glow-btn text-white text-xs font-bold tracking-wide transition-all active:scale-95"
            aria-label="Play all songs in order"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Play All</span>
          </button>
        </div>
      </div>

      {/* Song Rows (Progressive Windowed Rendering) */}
      <div className="space-y-1.5">
        {displayedSongs.map((song, index) => (
          <SongRow
            key={song.id}
            song={song}
            index={index}
            playlist={filteredSongs}
          />
        ))}
      </div>

      {/* Sentinel element to trigger lazy loading of next batch */}
      {visibleCount < filteredSongs.length && (
        <div
          ref={sentinelRef}
          className="h-14 flex items-center justify-center text-xs text-slate-500 py-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-[#A31C1B]/40 border-t-[#A31C1B] rounded-full animate-spin" />
            <span>Loading more tracks ({visibleCount} of {filteredSongs.length})...</span>
          </div>
        </div>
      )}
    </div>
  );
}
