import React from 'react';
import { Play, Shuffle, CheckCircle2, Sparkles } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { useDrive } from '../../contexts/DriveContext';
import { isVipUnlocked, isVipFolder, getVipFolderName } from '../../utils/vipConfig';
import { shuffleArray } from '../../utils/shuffle';

export function VipHomeBanner() {
  const { songs } = useDrive();
  const { playSong } = useAudio();

  // If not unlocked on this device, hide completely
  if (!isVipUnlocked()) return null;

  // Filter songs belonging to the VIP folder
  const vipSongs = songs.filter((s) => s && s.id && isVipFolder(s.folderName));
  if (vipSongs.length === 0) return null;

  const handlePlayAll = () => {
    if (vipSongs.length > 0) {
      playSong(vipSongs[0], vipSongs, 0);
    }
  };

  const handleShuffle = () => {
    if (vipSongs.length > 0) {
      const shuffled = shuffleArray(vipSongs, Date.now());
      playSong(shuffled[0], shuffled, 0);
    }
  };

  return (
    <div className="mb-6 sm:mb-8 rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-rose-950/50 via-[#1c1215] to-[#121614] border border-rose-500/40 shadow-[0_12px_40px_rgba(225,29,72,0.18)] animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Title & Info */}
        <div className="space-y-1 min-w-0">
          <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
            {getVipFolderName()}
          </h2>

          <p className="text-xs text-rose-200/80 flex items-center gap-1.5 pl-0.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>{vipSongs.length} tracks • Offline ready</span>
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handlePlayAll}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-600 to-[#be123c] hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs tracking-wide shadow-lg shadow-rose-900/40 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            <span>Play All</span>
          </button>

          <button
            onClick={handleShuffle}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full glass-card hover:border-rose-400/40 text-slate-200 hover:text-white font-medium text-xs transition-all active:scale-95"
            title="Shuffle collection"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>
        </div>
      </div>
    </div>
  );
}

