import React from 'react';
import {
  ChevronLeft,
  Play,
  Shuffle,
  Heart,
  CheckCircle2,
  Music2
} from 'lucide-react';
import { useDrive } from '../../contexts/DriveContext';
import { useAudio } from '../../contexts/AudioContext';
import { isVipFolder, getVipFolderName } from '../../utils/vipConfig';
import { SongRow } from './SongRow';

export function VipCollectionView({ onClose }) {
  const { songs } = useDrive();
  const { playSong } = useAudio();

  // Filter songs belonging to the VIP / For You folder
  const vipSongs = React.useMemo(() => {
    return (songs || []).filter((s) => s && s.id && isVipFolder(s.folderName));
  }, [songs]);

  const handlePlayAll = () => {
    if (vipSongs.length > 0) {
      playSong(vipSongs[0], vipSongs, 0);
    }
  };

  const handleShuffle = () => {
    if (vipSongs.length > 0) {
      const shuffled = [...vipSongs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], shuffled, 0);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 pb-8">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors py-2 px-3.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 active:scale-95 shadow-sm"
          aria-label="Back to Home"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <span className="text-[11px] font-medium text-slate-400 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]">
          Private Collection
        </span>
      </div>

      {/* Warm Personal Welcome Header Card */}
      <div className="relative rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-[#1c1314] via-[#141715] to-[#0e1210] border border-[#A31C1B]/30 shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-[#A31C1B]/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#A31C1B] to-[#781211] flex items-center justify-center text-white shadow-lg shadow-[#A31C1B]/25 flex-shrink-0">
              <Heart className="w-6 h-6 sm:w-7 sm:h-7 fill-white" />
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>{getVipFolderName()}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                Welcome to your special place. Handpicked songs chosen just for you — listen online or offline anytime.
              </p>
            </div>
          </div>

          {/* Status & Quick Action Controls */}
          <div className="pt-2 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>{vipSongs.length} {vipSongs.length === 1 ? 'song' : 'songs'} ready</span>
            </div>

            {vipSongs.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShuffle}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 text-xs font-semibold transition-all active:scale-95"
                >
                  <Shuffle className="w-3.5 h-3.5 text-slate-300" />
                  <span>Shuffle</span>
                </button>

                <button
                  onClick={handlePlayAll}
                  className="flex items-center gap-1.5 px-4 py-1.5 sm:py-2 rounded-xl crimson-glow-btn text-white text-xs font-semibold shadow-md transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Play All</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Song List Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <span>All Songs in Collection</span>
            <span className="text-[11px] font-semibold text-slate-400 bg-white/[0.06] px-2 py-0.5 rounded-full">
              {vipSongs.length}
            </span>
          </h2>
          <span className="text-[11px] text-slate-400">Tap any song to play</span>
        </div>

        {vipSongs.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-[#171717]/80 border border-dashed border-[#282f2b]">
            <Music2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">No Songs Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Your Google Drive folder "{getVipFolderName()}" has no audio files yet. Upload some songs to start listening!
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {vipSongs.map((song, index) => (
              <SongRow
                key={song.id}
                song={song}
                index={index}
                playlist={vipSongs}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

