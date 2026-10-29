import React from 'react';

export function Logo({
  className = "h-8 sm:h-9 w-auto",
  onClick
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 cursor-pointer select-none group"
    >
      <img
        src="/sas-music-logo.png?v=2"
        alt="SAS Music"
        className={`${className} object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_2px_14px_rgba(163,28,27,0.7)]`}
      />
    </div>
  );
}
