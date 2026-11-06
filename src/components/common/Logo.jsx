import React from 'react';

export function Logo({
  className = "h-8 sm:h-9 w-auto",
  onClick
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="SAS Music Home"
      className="flex items-center gap-2 cursor-pointer select-none group border-none bg-transparent p-0 text-left focus:outline-none"
    >
      <picture className="flex items-center">
        <source srcset="/sas-music-logo.webp" type="image/webp" />
        <img
          src="/sas-music-logo.png"
          alt="SAS Music"
          width="180"
          height="32"
          fetchpriority="high"
          decoding="async"
          className={`${className} object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_2px_14px_rgba(163,28,27,0.7)]`}
        />
      </picture>
    </button>
  );
}
