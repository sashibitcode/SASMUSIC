import React from 'react';
import { History, Play, Trash2, Music } from 'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext';
import { useAudio } from '../../contexts/AudioContext';
import { SongRow } from './SongRow';

export function RecentsView() {
  const { recentlyPlayed, clearRecentlyPlayed } = useLibrary();
  const { playSong } = useAudio();

  const handlePlayAll = () => {
    if (recentlyPlayed.length > 0) {
      playSong(recentlyPlayed[0], recentlyPlayed);
    }
  };

  if (recentlyPlayed.length === 0) {
    return (
      <div className="text-center py-20 px-4 rounded-2xl bg-[#171717] border border-dashed border-[#282f2b] max-w-md mx-auto my-6">
        <div className="w-16 h-16 rounded-2xl bg-[#06110c] border border-[#A31C1B]/40 text-[#A31C1B] mx-auto flex items-center justify-center mb-3 shadow-lg">
          <History className="w-8 h-8" />
        </div>
        <h4 className="text-base font-bold text-white">No Listening History Yet</h4>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Songs you play will automatically appear here so you can easily return to them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-36 md:pb-28">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#06110c] via-[#171717] to-[#171717] border border-[#282f2b] shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#A31C1B]/20 border border-[#A31C1B]/40 text-[#fca5a5] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#A31C1B]/20">
            <History className="w-6 h-6 text-[#A31C1B]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Recently Played</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Last {recentlyPlayed.length} {recentlyPlayed.length === 1 ? 'played song' : 'played songs'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={clearRecentlyPlayed}
            className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#171717] hover:bg-[#222222] text-slate-400 hover:text-rose-400 border border-[#282f2b] transition-colors text-xs active:scale-95"
            aria-label="Clear listening history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
          <button
            onClick={handlePlayAll}
            className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-[#A31C1B] hover:bg-[#be2524] text-white text-xs font-bold shadow-md shadow-[#A31C1B]/40 transition-all active:scale-95"
            aria-label="Play all recently played"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Play All</span>
          </button>
        </div>
      </div>

      {/* Song Rows */}
      <div className="space-y-1.5">
        {recentlyPlayed.map((song, idx) => (
          <SongRow
            key={`${song.id}-${idx}`}
            song={song}
            index={idx}
            playlist={recentlyPlayed}
          />
        ))}
      </div>
    </div>
  );
}
