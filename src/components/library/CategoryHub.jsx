import React, { useState, useMemo } from 'react';
import { Play, Sparkles, ChevronRight, ChevronUp, Mic2, Music, Shuffle } from 'lucide-react';
import { MUSIC_CATEGORIES, getCategoryCounts, extractTopArtists, isSongInCategory } from '../../utils/categoryExtractor';
import { FOLDER_COVERS } from '../../services/coverArtService';
import { ArtistAvatar } from '../common/ArtistAvatar';
import { useAudio } from '../../contexts/AudioContext';

export function CategoryHub({
  songs = [],
  drivePlaylists = [],
  onSelectCategory,
  onSelectArtist
}) {
  const { playSong, setQueue } = useAudio();

  // Compute live song counts per category
  const categoryCounts = useMemo(() => {
    return getCategoryCounts(songs);
  }, [songs]);

  // Extract top artists
  const topArtists = useMemo(() => {
    return extractTopArtists(songs).slice(0, 12);
  }, [songs]);

  // Handle direct 1-click Play Mix on a category
  const handlePlayCategoryMix = (e, categoryId) => {
    e.stopPropagation();
    const catSongs = songs.filter((s) => isSongInCategory(s, categoryId));
    if (catSongs.length === 0) return;

    // Pick a random song or first song and queue the category
    const startIndex = 0;
    playSong(catSongs[startIndex], catSongs, startIndex);
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const visibleCategories = isExpanded ? MUSIC_CATEGORIES : MUSIC_CATEGORIES.slice(0, 4);
  const hasMore = MUSIC_CATEGORIES.length > 4;

  return (
    <section className="mb-6 space-y-5 animate-in fade-in duration-200">
      {/* Section 1: Browse Categories Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Browse Categories</span>
            <span className="text-[11px] font-bold text-slate-300 bg-white/10 border border-white/15 px-2 py-0.5 rounded-full">
              Collections
            </span>
          </h2>
        </div>

        {hasMore && (
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white transition-colors px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] active:scale-95"
            aria-label={isExpanded ? 'Show Less' : 'View All'}
          >
            <span>{isExpanded ? 'Show Less' : 'View All'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        )}
      </div>

      {/* Section 2: Visual Category Cards Grid (4 upfront, expands on View All) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {visibleCategories.map((cat) => {
          const count = categoryCounts[cat.id] || 0;
          const bgCover = FOLDER_COVERS[cat.id] || FOLDER_COVERS.default;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`group relative overflow-hidden rounded-2xl p-4 sm:p-4.5 bg-gradient-to-br ${cat.gradient} border ${cat.borderColor} hover:border-white/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg hover:shadow-2xl flex flex-col justify-between min-h-[100px] sm:min-h-[110px]`}
            >
              {/* Cover image background with darkening overlay */}
              {bgCover && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-15 group-hover:opacity-25 group-hover:scale-105 transition-all duration-500 pointer-events-none"
                  style={{ backgroundImage: `url(${bgCover})` }}
                />
              )}

              {/* Top ambient highlight */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

              {/* Card Header: Live Badge */}
              <div className="flex items-start justify-end relative z-10">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 text-slate-200 border border-white/10 backdrop-blur-sm">
                  {count > 0 ? `${count} songs` : 'Browse'}
                </span>
              </div>

              {/* Card Footer: Title & Quick Play Button */}
              <div className="relative z-10 pt-2 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate group-hover:text-white transition-colors">
                    {cat.label}
                  </h3>
                </div>

                {/* 1-Click Play Mix Button (Primary Action) */}
                {count > 0 && (
                  <button
                    onClick={(e) => handlePlayCategoryMix(e, cat.id)}
                    className="w-8 h-8 rounded-full crimson-glow-btn text-white flex items-center justify-center flex-shrink-0 shadow-md transition-transform active:scale-90 group/btn"
                    title={`Play ${cat.label} Mix`}
                    aria-label={`Play ${cat.label} Mix`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5 group-hover/btn:scale-110 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Section 3: Popular Artists / Singers Circular Row */}
      {topArtists.length > 0 && (
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Mic2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Popular Singers</span>
            </h3>
            <span className="text-[10px] text-slate-400">
              {topArtists.length} artists
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 pt-1 -mx-1 px-1">
            {topArtists.map((artist) => {
              // Generate unique hue from artist name for vibrant ring
              const hash = artist.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              const hue = hash % 360;

              return (
                <button
                  key={artist.name}
                  onClick={() => onSelectArtist(artist.name)}
                  className="flex flex-col items-center flex-shrink-0 group focus:outline-none"
                  title={`View songs by ${artist.name}`}
                >
                  <ArtistAvatar
                    artistName={artist.name}
                    size="md"
                    showRing={true}
                    className="group-hover:scale-105 active:scale-95 transition-transform"
                  />

                  <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white mt-1.5 max-w-[76px] truncate text-center transition-colors">
                    {artist.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

