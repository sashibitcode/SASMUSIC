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
  const { playSong, setQueue, repeatMode, setRepeatMode } = useAudio();

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

    if (repeatMode === 'one') {
      setRepeatMode('all');
    }

    // Pick first song and queue the whole category playlist
    const startIndex = 0;
    playSong(catSongs[startIndex], catSongs, startIndex);
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const visibleCategories = isExpanded ? MUSIC_CATEGORIES : MUSIC_CATEGORIES.slice(0, 6);
  const hasMore = MUSIC_CATEGORIES.length > 6;

  return (
    <section className="mb-8 sm:mb-9 space-y-5">
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
              className={`group relative overflow-hidden rounded-2xl p-4 sm:p-4.5 bg-[#171717] bg-gradient-to-br ${cat.gradient} border ${cat.borderColor} hover:border-white/20 transition-colors cursor-pointer shadow-sm flex flex-col justify-between min-h-[108px] sm:min-h-[116px]`}
            >
              {/* Cover photo background */}
              {bgCover && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none"
                  style={{ backgroundImage: `url(${bgCover})` }}
                />
              )}

              {/* Protective bottom gradient scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#06110c]/90 via-[#06110c]/25 to-transparent pointer-events-none" />

              {/* Card Header: Live Badge */}
              <div className="flex items-start justify-end relative z-10">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/50 text-slate-100 border border-white/15 backdrop-blur-md shadow-sm">
                  {count > 0 ? `${count} songs` : 'Browse'}
                </span>
              </div>

              {/* Card Footer: Title & Quick Play Button */}
              <div className="relative z-10 pt-2 flex items-end justify-between gap-2">
                <div className="min-w-0 pr-1">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                    {cat.label}
                  </h3>
                </div>

                {/* 1-Click Play Mix Button (Primary Action) */}
                {count > 0 && (
                  <button
                    onClick={(e) => handlePlayCategoryMix(e, cat.id)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white text-slate-200 hover:text-slate-900 flex items-center justify-center flex-shrink-0 transition-colors active:scale-95"
                    title={`Play ${cat.label} Mix`}
                    aria-label={`Play ${cat.label} Mix`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Section 3: Popular Artists / Singers Circular Row */}
      {topArtists.length > 0 && (
        <div className="mt-8 sm:mt-9 pt-6 sm:pt-7 border-t border-white/[0.08] space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Mic2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Popular Singers</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              {topArtists.length} artists
            </span>
          </div>

          <div className="flex items-start gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x pt-2 pb-3.5 px-1 -mx-1">
            {topArtists.map((artist) => {
              return (
                <button
                  key={artist.name}
                  onClick={() => onSelectArtist(artist.name)}
                  className="flex flex-col items-center flex-shrink-0 w-[74px] sm:w-[82px] group focus:outline-none"
                  title={`View songs by ${artist.name}`}
                >
                  <ArtistAvatar
                    artistName={artist.name}
                    size="md"
                    showRing={true}
                    className="shadow-sm"
                  />

                  <span className="text-[11px] sm:text-xs font-medium text-slate-300 group-hover:text-white mt-2 max-w-[72px] sm:max-w-[80px] truncate text-center transition-colors leading-tight">
                    {artist.name}
                  </span>
                </button>
              );
            })}
            {/* End spacer to ensure last singer is never partially clipped against screen edge */}
            <div className="w-3 sm:w-4 flex-shrink-0" aria-hidden="true" />
          </div>
        </div>
      )}
    </section>
  );
}

