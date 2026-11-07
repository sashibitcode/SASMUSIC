import React, { useMemo } from 'react';
import { Heart, Play, Shuffle, Cloud, ArrowLeft } from 'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext';
import { useDrive } from '../../contexts/DriveContext';
import { useAudio } from '../../contexts/AudioContext';
import { SongRow } from './SongRow';

export function FavoritesView({ onClose }) {
  const { favorites, currentUser, isCloudSynced } = useLibrary();
  const { songs } = useDrive();
  const { playSong } = useAudio();

  const favSongs = useMemo(() => {
    const matched = songs.filter((s) => favorites.includes(s.id));
    const seen = new Set();
    return matched.filter((s) => {
      if (!s || !s.id || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [songs, favorites]);

  const handlePlayAll = () => {
    if (favSongs.length > 0) {
      playSong(favSongs[0], favSongs);
    }
  };

  const handleShufflePlay = () => {
    if (favSongs.length > 0) {
      const shuffled = [...favSongs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], shuffled);
    }
  };

  if (favSongs.length === 0) {
    return (
      <div className="text-center py-20 px-4 rounded-2xl bg-[#171717] border border-dashed border-[#282f2b] max-w-md mx-auto my-6">
        <div className="w-16 h-16 rounded-2xl bg-[#06110c] border border-white/10 text-rose-500 mx-auto flex items-center justify-center mb-3 shadow-lg">
          <Heart className="w-8 h-8 fill-rose-500" />
        </div>
        <h4 className="text-base font-bold text-white">No Favorite Songs Yet</h4>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Tap the heart icon on any song while listening or browsing to save it to your Favorites.
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all shadow-md active:scale-95 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Songs</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-36 md:pb-28">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-500/15 via-[#171717] to-[#171717] border border-white/10 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-500/10">
            <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Liked Songs</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">
                {favSongs.length} {favSongs.length === 1 ? 'favorite track' : 'favorite tracks'}
              </span>
              {currentUser ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full" title="Favorites synced to cloud">
                  <Cloud className="w-3 h-3 text-emerald-400" />
                  <span>Cloud Synced</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full" title="Sign in to sync your favorites across all devices">
                  <span>Local Only</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onClose && (
            <button
              onClick={onClose}
              className="min-h-[44px] flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#171717] hover:bg-[#222222] border border-[#282f2b] text-slate-200 text-xs font-semibold transition-all active:scale-95 flex-shrink-0"
              aria-label="Back to previous page"
              title="Close Favorites"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
          <button
            onClick={handleShufflePlay}
            className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl glass-card hover:border-white/20 text-slate-200 text-xs font-semibold transition-all active:scale-95"
            aria-label="Shuffle liked songs"
          >
            <Shuffle className="w-3.5 h-3.5 text-slate-300" />
            <span>Shuffle</span>
          </button>
          <button
            onClick={handlePlayAll}
            className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl crimson-glow-btn text-white text-xs font-bold shadow-md transition-all active:scale-95"
            aria-label="Play all liked songs"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Play All</span>
          </button>
        </div>
      </div>

      {/* Song Rows */}
      <div className="space-y-1.5">
        {favSongs.map((song, idx) => (
          <SongRow
            key={song.id}
            song={song}
            index={idx}
            playlist={favSongs}
          />
        ))}
      </div>
    </div>
  );
}
