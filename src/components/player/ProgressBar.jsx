import React, { useState } from 'react';
import { formatTime } from '../../utils/formatters';

export function ProgressBar({
  currentTime = 0,
  duration = 0,
  onSeek,
  className = "",
  showTimes = true,
  thumbAlwaysVisible = false
}) {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  const activeTime = isScrubbing ? scrubValue : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, (activeTime / duration) * 100) : 0;

  const handleChange = (e) => {
    setScrubValue(Number(e.target.value));
  };

  const handleMouseDown = () => {
    setIsScrubbing(true);
    setScrubValue(currentTime);
  };

  const handleMouseUp = (e) => {
    setIsScrubbing(false);
    if (onSeek) {
      onSeek(Number(e.target.value));
    }
  };

  const handleTouchEnd = (e) => {
    setIsScrubbing(false);
    if (onSeek) {
      onSeek(Number(e.target.value));
    }
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {/* Track slider */}
      <div className="relative w-full flex items-center h-5 group cursor-pointer">
        {/* Background rail */}
        <div className="absolute w-full h-1.5 rounded-full bg-[#282f2b] overflow-hidden group-hover:h-2 transition-all">
          {/* Active progress fill */}
          <div
            className="h-full bg-gradient-to-r from-[#A31C1B] to-[#e2403f] rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Transparent Range Input Overlay */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.5}
          value={activeTime || 0}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          onChange={handleChange}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleTouchEnd}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label="Audio progress slider"
        />

        {/* Custom thumb follower */}
        <div
          className={`absolute w-3.5 h-3.5 -ml-1.5 rounded-full bg-white shadow-md shadow-[#A31C1B]/80 pointer-events-none transition-opacity ${
            thumbAlwaysVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      {/* Timestamps */}
      {showTimes && (
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 select-none px-0.5">
          <span>{formatTime(activeTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
}

