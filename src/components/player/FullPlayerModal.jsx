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
  Volume2,
  Download,
  CheckCircle2
} from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { useDrive } from '../../contexts/DriveContext';
import { getSongGradientStyle, getSongPalette } from '../../utils/artGenerator';
import { ProgressBar } from './ProgressBar';
import { VolumeSlider } from './VolumeSlider';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { useSyncPlay } from '../../contexts/SyncPlayContext';
import { SyncStatusBadge } from '../syncplay/SyncStatusBadge';
import { SongCoverArt } from '../common/SongCoverArt';

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
  const { isVipUnlocked, isSongInOffline, saveSongToOffline, removeSongFromOffline } = useDrive();

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
  const inOffline = isVipUnlocked && isSongInOffline && currentSong ? isSongInOffline(currentSong.id) : false;
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

        <div className="text-center px-2 min-w-0 flex flex-col items-center">
          <SyncStatusBadge className="mb-0.5" />
          <p className="text-xs font-medium text-slate-300 truncate max-w-[200px] sm:max-w-xs">
            {isLoadingAudio ? 'Buffering...' : (currentSong.folderName || 'SAS Music')}
          </p>
        </div>

        <button
          onClick={() => setIsQueueOpen(true)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-slate-300 hover:text-white hover:bg-[#222222] transition-colors active:scale-90"
          aria-label="Open queue"
        >
          <ListMusic className="w-5 h-5 text-slate-300" />
        </button>
      </header>

      {/* Center Artwork Container (Responsive scaling down to 320px screens) */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-2 relative z-10 max-w-md mx-auto w-full">
        {/* Large Album Art with swipe left/right support */}
        <div
          {...artSwipe}
          className="relative w-[min(72vw,18.5rem)] h-[min(72vw,18.5rem)] sm:w-80 sm:h-80 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden flex items-center justify-center border border-white/10 group cursor-pointer"
        >
          <SongCoverArt
            song={currentSong}
            size="xl"
            highRes={true}
            isPlaying={isPlaying}
          />
        </div>

        {/* Title, Artist & Favorite */}
        <div className="w-full mt-6 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2
              title={currentSong.title}
              className="text-lg sm:text-xl font-bold text-white line-clamp-2 leading-snug sm:leading-tight break-words tracking-tight"
            >
              {currentSong.title}
            </h2>
            <p
              title={currentSong.artist}
              className="text-xs sm:text-sm text-slate-300 font-medium truncate mt-1"
            >
              {currentSong.artist}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {isVipUnlocked && (
              <button
                onClick={() => {
                  if (inOffline) {
                    removeSongFromOffline(currentSong.id);
                  } else {
                    saveSongToOffline(currentSong);
                  }
                }}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-transform active:scale-90 ${
                  inOffline ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
                aria-label={inOffline ? 'In Offline Space' : 'Send to Offline Space'}
                title={inOffline ? 'In Offline Space (Tap to remove)' : 'Send to Offline Space'}
              >
                {inOffline ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </button>
            )}

            <button
              onClick={() => toggleFavorite(currentSong.id)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-transform active:scale-90"
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-6 h-6 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
            </button>
          </div>
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
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Toggle shuffle"
          >
            <Shuffle className="w-5 h-5" />
            {shuffleMode && (
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
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

          {/* Big Play / Pause Button (Primary Action) */}
          <button
            onClick={togglePlay}
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
                ? 'text-white'
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
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
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
