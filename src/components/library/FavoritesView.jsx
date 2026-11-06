import React, { useMemo } from 'react';
import { Heart, Play, Shuffle } from 'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext';
import { useDrive } from '../../contexts/DriveContext';
import { useAudio } from '../../contexts/AudioContext';
import { SongRow } from './SongRow';

export function FavoritesView() {
  const { favorites } = useLibrary();
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
        <div className="w-16 h-16 rounded-2xl bg-[#06110c] border border-[#A31C1B]/40 text-[#A31C1B] mx-auto flex items-center justify-center mb-3 shadow-lg">
          <Heart className="w-8 h-8 fill-[#A31C1B]" />
        </div>
        <h4 className="text-base font-bold text-white">No Favorite Songs Yet</h4>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Tap the heart icon on any song while listening or browsing to save it to your Favorites.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-36 md:pb-28">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#A31C1B]/35 via-[#171717] to-[#171717] border border-[#A31C1B]/40 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#A31C1B]/20 border border-[#A31C1B]/40 text-[#fca5a5] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#A31C1B]/20">
            <Heart className="w-6 h-6 fill-[#A31C1B] text-[#A31C1B]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Liked Songs</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {favSongs.length} {favSongs.length === 1 ? 'favorite track' : 'favorite tracks'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleShufflePlay}
            className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#171717] hover:bg-[#222222] border border-[#282f2b] text-slate-200 text-xs font-semibold transition-all active:scale-95"
            aria-label="Shuffle liked songs"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#A31C1B]" />
            <span>Shuffle</span>
          </button>
          <button
            onClick={handlePlayAll}
            className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-[#A31C1B] hover:bg-[#be2524] text-white text-xs font-bold shadow-md shadow-[#A31C1B]/40 transition-all active:scale-95"
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
