import React, { useState, useMemo } from 'react';
import { Play, Pause, ChevronRight, ChevronUp } from 'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext';
import { useAudio } from '../../contexts/AudioContext';
import { SongCoverArt } from '../common/SongCoverArt';
import { VisualizerBars } from '../player/VisualizerBars';

export function RecommendedSection({ songs = [] }) {
  const { getRegularSongs } = useLibrary();
  const { currentSong, isPlaying, playSong, togglePlay } = useAudio();
  const [isExpanded, setIsExpanded] = useState(false);

  // Compute regular songs, supplementing with library tracks if fewer than 4 exist yet
  const regularSongs = useMemo(() => {
    if (!songs || songs.length === 0) return [];
    const userRegulars = typeof getRegularSongs === 'function' ? getRegularSongs(songs, 12) : [];

    if (userRegulars.length >= 4) {
      return userRegulars;
    }

    // Fill up to 12 with popular songs from the library so 4 are ALWAYS visible upfront
    const existingIds = new Set(userRegulars.map((s) => s.id));
    const fillers = songs.filter((s) => s && s.id && !existingIds.has(s.id)).slice(0, 12 - userRegulars.length);
    return [...userRegulars, ...fillers].slice(0, 12);
  }, [getRegularSongs, songs]);

  if (!regularSongs || regularSongs.length === 0) {
    return null;
  }

  // Show 4 songs up front, or up to 12 when expanded
  const visibleSongs = isExpanded ? regularSongs : regularSongs.slice(0, 4);
  const hasMore = regularSongs.length > 4;

  const handleSongClick = (song, index) => {
    if (currentSong && currentSong.id === song.id) {
      togglePlay();
    } else {
      playSong(song, regularSongs, index);
    }
  };

  const handlePlayAll = () => {
    if (regularSongs.length > 0) {
      playSong(regularSongs[0], regularSongs, 0);
    }
  };

  return (
    <section className="mb-6 space-y-3 animate-in fade-in duration-300">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Recommended</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#A31C1B]" />
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Play All Button */}
          <button
            onClick={handlePlayAll}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#A31C1B] hover:bg-[#851615] px-3 py-1 rounded-full shadow-sm active:scale-95 transition-all"
            title="Play All Recommended Songs"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Play All</span>
          </button>

          {/* View All / Show Less Toggle */}
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
      </div>

      {/* Responsive Grid: 2 columns on mobile, 4 columns on large screens */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {visibleSongs.map((song, index) => {
          const isCurrent = currentSong && currentSong.id === song.id;
          const isThisPlaying = isCurrent && isPlaying;

          return (
            <div
              key={song.id}
              onClick={() => handleSongClick(song, index)}
              className={`group flex items-center justify-between p-2 rounded-2xl transition-all duration-200 cursor-pointer shadow-sm min-h-[58px] sm:min-h-[64px] ${
                isCurrent
                  ? 'bg-[#A31C1B]/15 border border-[#A31C1B]/50 shadow-[#A31C1B]/10'
                  : 'bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/20'
              }`}
              title={`Play ${song.title || song.name}`}
            >
              {/* Left: Cover Art + Title/Artist */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1.5">
                <div className="relative flex-shrink-0">
                  <SongCoverArt
                    song={song}
                    size="sm"
                    isPlaying={isThisPlaying}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl shadow-md"
                  />
                  {isThisPlaying && (
                    <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                      <VisualizerBars isPlaying={true} count={3} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3
                    title={song.title || song.name}
                    className={`text-xs sm:text-sm font-bold line-clamp-2 leading-snug break-words ${
                      isCurrent ? 'text-[#fca5a5]' : 'text-white group-hover:text-[#fca5a5]'
                    } transition-colors`}
                  >
                    {song.title || song.name}
                  </h3>
                  <p
                    title={song.artist || 'Unknown Artist'}
                    className="text-[10px] sm:text-[11px] text-slate-400 truncate mt-1 font-medium"
                  >
                    {song.artist || 'Unknown Artist'}
                  </p>
                </div>
              </div>

              {/* Right: Quick Play / Pause Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSongClick(song, index);
                }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md transition-transform active:scale-90 ${
                  isThisPlaying
                    ? 'bg-[#A31C1B] text-white'
                    : 'bg-[#A31C1B] hover:bg-[#851615] text-white opacity-90 group-hover:opacity-100 group-hover:scale-105'
                }`}
                aria-label={isThisPlaying ? 'Pause' : 'Play'}
              >
                {isThisPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
