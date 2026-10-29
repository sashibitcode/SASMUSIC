import React from 'react';
import { Play, Pause, SkipForward, Heart, Music2, Disc } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { getSongGradientStyle } from '../../utils/artGenerator';
import { VisualizerBars } from './VisualizerBars';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

export function MiniPlayer() {
  const {
    currentSong,
    isPlaying,
    isLoadingAudio,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    setIsFullPlayerOpen
  } = useAudio();

  const { isFavorite, toggleFavorite } = useLibrary();

  // Swipe up gesture on mini player opens full-screen player
  const miniSwipe = useSwipeGesture({
    onSwipeUp: () => setIsFullPlayerOpen(true),
    threshold: 30
  });

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isFav = isFavorite(currentSong.id);

  return (
    <div
      {...miniSwipe}
      onClick={() => setIsFullPlayerOpen(true)}
      className="fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:bottom-3 left-0 right-0 z-30 px-2.5 sm:px-6 pointer-events-none transition-all select-none"
    >
      <div className="max-w-4xl mx-auto rounded-2xl bg-[#06110c] border border-[#A31C1B]/80 hover:border-[#A31C1B] shadow-[0_12px_45px_rgba(6,17,12,0.95),_0_0_20px_rgba(163,28,27,0.3)] ring-1 ring-[#A31C1B]/40 overflow-hidden pointer-events-auto cursor-pointer transition-all group">
        {/* Real-time thin progress line at the very top */}
        <div className="w-full h-1 bg-[#171717] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#A31C1B] via-[#e2403f] to-[#ffffff] transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Content row */}
        <div className="flex items-center justify-between p-2 sm:p-3 gap-2 sm:gap-3">
          {/* Left: Thumbnail & Song Info */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md relative overflow-hidden transition-transform group-hover:scale-105 ${
                isPlaying ? 'ring-2 ring-[#A31C1B] ring-offset-2 ring-offset-[#06110c] shadow-[0_0_15px_rgba(163,28,27,0.6)]' : ''
              }`}
              style={getSongGradientStyle(currentSong.title, currentSong.artist)}
            >
              <Disc
                className={`w-6 h-6 text-white/90 drop-shadow-sm ${
                  isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#fca5a5] transition-colors">
                  {currentSong.title}
                </p>
                {isPlaying && (
                  <div className="hidden sm:block flex-shrink-0 ml-1">
                    <VisualizerBars isPlaying={isPlaying} className="h-3 w-3" />
                  </div>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-300 font-medium truncate mt-0.5">
                {currentSong.artist}
              </p>
            </div>
          </div>

          {/* Right: Controls - 44px minimum touch targets */}
          <div
            className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Favorite toggle - 44x44px touch target */}
            <button
              onClick={() => toggleFavorite(currentSong.id)}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-transform active:scale-90 ${
                isFav
                  ? 'text-[#A31C1B] hover:text-[#e2403f]'
                  : 'text-slate-400 hover:text-white'
              }`}
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-[#A31C1B]' : ''}`} />
            </button>

            {/* Play / Pause button - 44x44px touch target */}
            <button
              onClick={togglePlay}
              disabled={isLoadingAudio}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full crimson-glow-btn text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoadingAudio ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-white" />
              ) : (
                <Play className="w-5 h-5 fill-white ml-0.5" />
              )}
            </button>

            {/* Next Track - 44x44px touch target */}
            <button
              onClick={nextTrack}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors active:scale-90"
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
