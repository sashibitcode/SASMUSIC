import React from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  Disc,
  Volume2
} from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { getSongGradientStyle, getSongPalette } from '../../utils/artGenerator';
import { ProgressBar } from './ProgressBar';
import { VolumeSlider } from './VolumeSlider';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

export function FullPlayerModal() {
  const {
    currentSong,
    isPlaying,
    isLoadingAudio,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    shuffleMode,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    isFullPlayerOpen,
    setIsFullPlayerOpen,
    setIsQueueOpen
  } = useAudio();

  const { isFavorite, toggleFavorite } = useLibrary();

  // Bottom sheet swipe down gesture to close
  const sheetSwipe = useSwipeGesture({
    onSwipeDown: () => setIsFullPlayerOpen(false),
    threshold: 60
  });

  // Album art swipe gesture: left -> next track, right -> previous track
  const artSwipe = useSwipeGesture({
    onSwipeLeft: nextTrack,
    onSwipeRight: previousTrack,
    threshold: 45
  });

  if (!isFullPlayerOpen || !currentSong) return null;

  const isFav = isFavorite(currentSong.id);
  const palette = getSongPalette(currentSong.title, currentSong.artist);

  return (
    <div
      {...sheetSwipe}
      className="fixed inset-0 z-50 flex flex-col bg-[#06110c]/98 backdrop-blur-2xl animate-slideUp text-white overflow-hidden pb-safe select-none"
    >
      {/* Top drag handle indicator for native bottom sheet feel */}
      <div className="w-full flex items-center justify-center pt-2.5 pb-1">
        <div className="w-12 h-1.5 rounded-full bg-white/25 active:bg-white/40 transition-colors cursor-grab" />
      </div>

      {/* Dynamic ambient background glow matching Forest Green & Crimson */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] rounded-full blur-[140px] opacity-35 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, #A31C1B 0%, #06110c 70%)`
        }}
      />

      {/* Top Bar with 44px minimum touch targets */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-2">
        <button
          onClick={() => setIsFullPlayerOpen(false)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-slate-300 hover:text-white hover:bg-[#222222] transition-colors active:scale-90"
          aria-label="Collapse player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center px-2 min-w-0">
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#fca5a5]">
            Playing from
          </p>
          <p className="text-xs font-semibold text-slate-300 truncate max-w-[180px] sm:max-w-xs">
            {currentSong.folderName || 'SAS Music'}
          </p>
        </div>

        <button
          onClick={() => setIsQueueOpen(true)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-slate-300 hover:text-white hover:bg-[#222222] transition-colors active:scale-90"
          aria-label="Open queue"
        >
          <ListMusic className="w-5 h-5 text-[#fca5a5]" />
        </button>
      </header>

      {/* Center Artwork Container (Responsive scaling down to 320px screens) */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-2 relative z-10 max-w-md mx-auto w-full">
        {/* Large Album Art with swipe left/right support */}
        <div
          {...artSwipe}
          className="relative w-[min(68vw,17.5rem)] h-[min(68vw,17.5rem)] sm:w-72 sm:h-72 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden flex items-center justify-center border border-[#282f2b] group cursor-pointer"
          style={getSongGradientStyle(currentSong.title, currentSong.artist)}
        >
          {/* Subtle Vinyl Grooves */}
          <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
            <div className="w-[85%] h-[85%] rounded-full border border-white/20" />
            <div className="w-[70%] h-[70%] rounded-full border border-white/25 absolute" />
            <div className="w-[50%] h-[50%] rounded-full border border-white/30 absolute" />
          </div>

          {/* Center Spinning Disc Badge with official SAS Music logo */}
          <div
            className={`w-28 h-28 sm:w-34 sm:h-34 rounded-full bg-[#171717] border-2 border-[#A31C1B] p-3 flex items-center justify-center shadow-[0_0_35px_rgba(163,28,27,0.65)] ring-4 ring-[#A31C1B]/30 ring-offset-4 ring-offset-black ${
              isPlaying ? 'animate-[spin_12s_linear_infinite]' : ''
            }`}
          >
            <img
              src="/sas-music-logo.png?v=2"
              alt="SAS Music"
              className="w-22 sm:w-26 h-auto object-contain drop-shadow-[0_2px_12px_rgba(163,28,27,0.9)]"
            />
          </div>
        </div>

        {/* Title, Artist & Favorite */}
        <div className="w-full mt-6 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-black text-white truncate tracking-tight">
              {currentSong.title}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-300 font-semibold truncate mt-0.5">
              {currentSong.artist}
            </p>
          </div>

          <button
            onClick={() => toggleFavorite(currentSong.id)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-transform active:scale-90"
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-6 h-6 ${isFav ? 'fill-[#A31C1B] text-[#A31C1B]' : 'text-slate-400'}`} />
          </button>
        </div>

        {/* Seek Bar Component */}
        <div className="w-full mt-4">
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={seek}
            isLoadingAudio={isLoadingAudio}
          />
        </div>

        {/* Main Controls - 44px+ Minimum Touch Bounding Box */}
        <div className="w-full mt-3 flex items-center justify-between px-1">
          {/* Shuffle Button */}
          <button
            onClick={toggleShuffle}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all relative ${
              shuffleMode
                ? 'text-[#A31C1B]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Toggle shuffle"
          >
            <Shuffle className="w-5 h-5" />
            {shuffleMode && (
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#A31C1B]" />
            )}
          </button>

          {/* Previous Track */}
          <button
            onClick={previousTrack}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full text-slate-200 hover:text-white hover:bg-[#222222] transition-transform active:scale-90"
            aria-label="Previous track"
          >
            <SkipBack className="w-6 h-6 fill-slate-200" />
          </button>

          {/* Big Play / Pause Button */}
          <button
            onClick={togglePlay}
            disabled={isLoadingAudio}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-full crimson-glow-btn text-white flex items-center justify-center shadow-[0_0_35px_rgba(163,28,27,0.85)] transition-transform active:scale-95"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoadingAudio ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ml-1" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={nextTrack}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full text-slate-200 hover:text-white hover:bg-[#222222] transition-transform active:scale-90"
            aria-label="Next track"
          >
            <SkipForward className="w-6 h-6 fill-slate-200" />
          </button>

          {/* Repeat Button */}
          <button
            onClick={toggleRepeat}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all relative ${
              repeatMode !== 'off'
                ? 'text-[#A31C1B]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Toggle repeat"
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
            {repeatMode !== 'off' && (
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#A31C1B]" />
            )}
          </button>
        </div>

        {/* Volume Controls (Desktop & Tablet) */}
        <div className="w-full mt-4 hidden sm:flex items-center justify-center">
          <VolumeSlider
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={setVolume}
            onToggleMute={toggleMute}
          />
        </div>
      </div>
    </div>
  );
}
