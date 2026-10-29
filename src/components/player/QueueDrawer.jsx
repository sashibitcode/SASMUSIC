import React, { useState } from 'react';
import {
  X,
  Play,
  Trash2,
  ArrowUp,
  ArrowDown,
  Music2,
  ListMusic,
  Check
} from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { getSongGradientStyle } from '../../utils/artGenerator';
import { VisualizerBars } from './VisualizerBars';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

function QueueItem({
  song,
  actualIndex,
  queueIndex,
  queueLength,
  onPlay,
  onReorder,
  onRemove
}) {
  const [isSwiped, setIsSwiped] = useState(false);

  // Swipe left to remove item from queue
  const swipe = useSwipeGesture({
    onSwipeLeft: () => {
      setIsSwiped(true);
      setTimeout(() => onRemove(actualIndex), 200);
    },
    threshold: 40
  });

  return (
    <div
      {...swipe}
      className={`group flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-[#222222]/70 hover:bg-[#222222] border border-[#282f2b]/80 transition-all select-none ${
        isSwiped ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      {/* Gradient icon */}
      <div
        onClick={onPlay}
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer shadow-sm relative overflow-hidden"
        style={getSongGradientStyle(song.title, song.artist)}
      >
        <Music2 className="w-4 h-4 text-white/80" />
      </div>

      {/* Info */}
      <div
        onClick={onPlay}
        className="flex-1 min-w-0 cursor-pointer"
      >
        <p className="text-xs font-semibold text-slate-100 group-hover:text-[#fca5a5] truncate transition-colors">
          {song.title}
        </p>
        <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
      </div>

      {/* Controls: Reorder Up / Down & Remove with 44px touch targets */}
      <div className="flex items-center gap-0.5 opacity-90 sm:opacity-70 group-hover:opacity-100 transition-opacity">
        {actualIndex > queueIndex + 1 && (
          <button
            onClick={() => onReorder(actualIndex, actualIndex - 1)}
            title="Move Up"
            className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center rounded-lg hover:bg-[#171717] text-slate-400 hover:text-white transition-colors active:scale-90"
            aria-label="Move track up"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}

        {actualIndex < queueLength - 1 && (
          <button
            onClick={() => onReorder(actualIndex, actualIndex + 1)}
            title="Move Down"
            className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center rounded-lg hover:bg-[#171717] text-slate-400 hover:text-white transition-colors active:scale-90"
            aria-label="Move track down"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => onRemove(actualIndex)}
          title="Remove from queue"
          className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center rounded-lg hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors active:scale-90"
          aria-label="Remove from queue"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function QueueDrawer() {
  const {
    currentSong,
    isPlaying,
    queue,
    queueIndex,
    isQueueOpen,
    setIsQueueOpen,
    playSong,
    removeFromQueue,
    reorderQueue,
    clearQueue
  } = useAudio();

  if (!isQueueOpen) return null;

  const upNextSongs = queue.slice(queueIndex + 1);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop tap to close */}
      <div
        className="absolute inset-0"
        onClick={() => setIsQueueOpen(false)}
      />

      {/* Drawer content */}
      <div className="relative z-10 w-full max-w-md h-full bg-[#171717]/95 backdrop-blur-2xl border-l border-[#282f2b] flex flex-col shadow-2xl animate-slideLeft">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#282f2b]">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-[#A31C1B]" />
            <h3 className="text-base font-bold text-white">Playback Queue</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#222222] text-slate-400 border border-white/[0.06]">
              {queue.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {upNextSongs.length > 0 && (
              <button
                onClick={clearQueue}
                title="Clear upcoming songs"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#222222] transition-colors text-xs gap-1"
                aria-label="Clear queue"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <button
              onClick={() => setIsQueueOpen(false)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#222222] transition-colors"
              aria-label="Close queue drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-safe">
          {/* Now Playing section (strictly Forest Green #06110c) */}
          {currentSong && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-[#fca5a5] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#A31C1B] animate-pulse" />
                  Now Playing
                </p>
                <span className="text-[9px] uppercase font-extrabold text-emerald-400 bg-[#06110c] px-2 py-0.5 rounded-full border border-emerald-800/60">
                  Forest Green
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#06110c] border-2 border-[#A31C1B] shadow-[0_6px_28px_rgba(6,17,12,0.95),_0_0_15px_rgba(163,28,27,0.35)] ring-1 ring-[#A31C1B]/80">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md relative overflow-hidden ring-2 ring-[#A31C1B] ring-offset-2 ring-offset-[#06110c]"
                  style={getSongGradientStyle(currentSong.title, currentSong.artist)}
                >
                  <Music2 className="w-5 h-5 text-white/90" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{currentSong.title}</p>
                  <p className="text-xs text-emerald-300 font-medium truncate">{currentSong.artist}</p>
                </div>
                <VisualizerBars isPlaying={isPlaying} />
              </div>
            </div>
          )}

          {/* Up Next Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Up Next ({upNextSongs.length})
              </p>
              {upNextSongs.length > 0 && (
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  Swipe left to remove
                </span>
              )}
            </div>

            {upNextSongs.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl bg-[#222222]/50 border border-dashed border-[#282f2b]">
                <Music2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-semibold">Queue is empty</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tap '...' next to any song to add it to the queue
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {upNextSongs.map((song, relativeIdx) => {
                  const actualIndex = queueIndex + 1 + relativeIdx;
                  return (
                    <QueueItem
                      key={`${song.id}-${actualIndex}`}
                      song={song}
                      actualIndex={actualIndex}
                      queueIndex={queueIndex}
                      queueLength={queue.length}
                      onPlay={() => playSong(song, queue)}
                      onReorder={reorderQueue}
                      onRemove={removeFromQueue}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
