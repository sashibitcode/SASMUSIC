import React from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

export function VolumeSlider({ volume = 0.8, isMuted = false, onVolumeChange, onToggleMute, className = "" }) {
  const effectiveVolume = isMuted ? 0 : volume;

  let Icon = Volume2;
  if (effectiveVolume === 0 || isMuted) {
    Icon = VolumeX;
  } else if (effectiveVolume < 0.5) {
    Icon = Volume1;
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <button
        onClick={onToggleMute}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#222222] transition-colors"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        <Icon className="w-4 h-4" />
      </button>

      <div className="relative flex items-center w-24 h-4 group cursor-pointer">
        <div className="absolute w-full h-1 rounded-full bg-[#282f2b] overflow-hidden group-hover:h-1.5 transition-all">
          <div
            className="h-full bg-[#A31C1B] group-hover:bg-[#e2403f] transition-all rounded-full"
            style={{ width: `${effectiveVolume * 100}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={effectiveVolume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Volume slider"
        />
      </div>
    </div>
  );
}

