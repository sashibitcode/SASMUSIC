import React from 'react';
import { Play, CheckCircle2 } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { useDrive } from '../../contexts/DriveContext';
import { isVipUnlocked, isVipFolder, getVipFolderName } from '../../utils/vipConfig';

export function VipHomeBanner() {
  const { songs } = useDrive();
  const { playSong } = useAudio();

  // If not unlocked on this device, hide completely
  if (!isVipUnlocked()) return null;

  // Filter songs belonging to the VIP folder
  const vipSongs = songs.filter((s) => s && s.id && isVipFolder(s.folderName));
  if (vipSongs.length === 0) return null;

  const handlePlayCollection = () => {
    if (vipSongs.length > 0) {
      playSong(vipSongs[0], vipSongs, 0);
    }
  };

  return (
    <div className="mb-6 sm:mb-8 rounded-2xl p-4 sm:p-4.5 bg-[#171717] border border-[#282f2b] shadow-md flex items-center justify-between gap-4">
      {/* Left: Title & Info */}
      <div className="space-y-1 min-w-0">
        <h2 className="text-base sm:text-lg font-bold text-white tracking-wide truncate">
          {getVipFolderName()}
        </h2>

        <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>{vipSongs.length} tracks • Offline ready</span>
        </p>
      </div>

      {/* Right: Clean Single Play Action */}
      <button
        onClick={handlePlayCollection}
        className="w-10 h-10 rounded-full bg-white hover:bg-slate-200 text-slate-900 flex items-center justify-center flex-shrink-0 shadow-md active:scale-95 transition-transform"
        aria-label="Play collection"
        title="Play"
      >
        <Play className="w-4 h-4 fill-current ml-0.5" />
      </button>
    </div>
  );
}

