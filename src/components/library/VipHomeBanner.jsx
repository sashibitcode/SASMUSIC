import React from 'react';
import { Play, CheckCircle2, ChevronRight, Heart } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { useDrive } from '../../contexts/DriveContext';
import { isVipUnlocked, isVipFolder, getVipFolderName } from '../../utils/vipConfig';

export function VipHomeBanner({ onOpenCollection }) {
  const { songs } = useDrive();
  const { playSong } = useAudio();

  // If not unlocked on this device, hide completely
  if (!isVipUnlocked()) return null;

  // Filter songs belonging to the VIP folder
  const vipSongs = songs.filter((s) => s && s.id && isVipFolder(s.folderName));
  if (vipSongs.length === 0) return null;

  const handlePlayCollection = (e) => {
    if (e) e.stopPropagation();
    if (vipSongs.length > 0) {
      playSong(vipSongs[0], vipSongs, 0);
    }
  };

  return (
    <div
      onClick={onOpenCollection}
      className="group mb-6 sm:mb-8 rounded-2xl p-4 sm:p-4.5 bg-[#171717] hover:bg-[#1a1a1a] border border-[#282f2b] hover:border-[#A31C1B]/40 shadow-md flex items-center justify-between gap-4 cursor-pointer transition-all duration-200 active:scale-[0.99]"
      title="Tap to open collection"
    >
      {/* Left: Title & Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A31C1B] to-[#781211] flex items-center justify-center text-white flex-shrink-0 shadow-sm shadow-[#A31C1B]/30">
          <Heart className="w-4 h-4 fill-white" />
        </div>

        <div className="space-y-0.5 min-w-0 flex-1">
          <h2 className="text-base font-bold text-white tracking-wide truncate group-hover:text-white transition-colors">
            {getVipFolderName()}
          </h2>

          <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>{vipSongs.length} tracks • Tap to view all songs</span>
          </p>
        </div>
      </div>

      {/* Right: Clean Single Play Action & Navigation Arrow */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handlePlayCollection}
          className="w-10 h-10 rounded-full bg-white hover:bg-slate-200 text-slate-900 flex items-center justify-center shadow-md active:scale-95 transition-transform"
          aria-label="Play collection immediately"
          title="Play immediately"
        >
          <Play className="w-4 h-4 fill-current ml-0.5" />
        </button>

        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}

