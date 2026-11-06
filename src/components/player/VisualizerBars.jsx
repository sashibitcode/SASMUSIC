import React from 'react';

export function VisualizerBars({ isPlaying = false, className = "h-4 w-4" }) {
  return (
    <div className={`flex items-end justify-between gap-[2px] ${className}`}>
      <span
        className={`w-[3px] rounded-full bg-[#A31C1B] transition-all duration-300 ${
          isPlaying ? 'animate-equalizer-1' : 'h-[30%]'
        }`}
      />
      <span
        className={`w-[3px] rounded-full bg-[#e2403f] transition-all duration-300 ${
          isPlaying ? 'animate-equalizer-2' : 'h-[60%]'
        }`}
      />
      <span
        className={`w-[3px] rounded-full bg-[#A31C1B] transition-all duration-300 ${
          isPlaying ? 'animate-equalizer-3' : 'h-[40%]'
        }`}
      />
      <span
        className={`w-[3px] rounded-full bg-[#fca5a5] transition-all duration-300 ${
          isPlaying ? 'animate-equalizer-4' : 'h-[20%]'
        }`}
      />
    </div>
  );
}
