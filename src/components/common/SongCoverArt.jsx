import React, { useState, useEffect } from 'react';
import { Music2, Disc } from 'lucide-react';
import { fetchSongCoverArt, getCachedCoverArt } from '../../services/coverArtService';
import { getSongGradientStyle } from '../../utils/artGenerator';

export function SongCoverArt({
  song,
  size = 'md', // 'sm' (44px) | 'md' (48px) | 'lg' (64px) | 'xl' (FullPlayer 280-320px)
  isPlaying = false,
  className = '',
  highRes = false
}) {
  const title = song?.title || song?.name || '';
  const artist = song?.artist || '';

  // Check cache synchronously
  const cached = getCachedCoverArt(title, artist);
  const [coverData, setCoverData] = useState(cached);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setImageError(false);

    const activeCache = getCachedCoverArt(title, artist);
    if (activeCache) {
      setCoverData(activeCache);
      return;
    }

    fetchSongCoverArt(title, artist).then((res) => {
      if (isMounted && res) {
        setCoverData(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [title, artist]);

  const imageUrl = highRes ? coverData?.highRes : (coverData?.thumb || coverData?.highRes);
  const gradientStyle = getSongGradientStyle(title, artist);

  // Size styling map
  const sizeClasses = {
    sm: 'w-11 h-11 rounded-xl',
    md: 'w-12 h-12 rounded-xl',
    lg: 'w-16 h-16 rounded-2xl',
    xl: 'w-full h-full rounded-3xl'
  };

  const containerSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md ${containerSize} ${className}`}
      style={gradientStyle}
    >
      {/* Real Cover Image (if available and not errored) */}
      {imageUrl && !imageError && (
        <img
          src={imageUrl}
          alt={title ? `${title} cover` : 'Album artwork'}
          loading={size === 'xl' ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${size === 'xl' && isPlaying ? 'scale-[1.01] transition-transform duration-700' : ''}`}
        />
      )}

      {/* Fallback procedural gradient and icon when image is loading or unavailable */}
      {(!imageUrl || imageError || !imageLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center text-white/80 pointer-events-none">
          {size === 'xl' ? (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <Disc className={`w-16 h-16 text-white/70 mb-2 ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`} />
              <p className="text-sm font-bold text-white truncate max-w-[200px]">{title}</p>
              <p className="text-xs text-slate-300 truncate max-w-[180px]">{artist}</p>
            </div>
          ) : (
            <Music2 className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
          )}
        </div>
      )}

      {/* Subtle glossy glass reflection overlay on large artwork */}
      {size === 'xl' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
          <div className="absolute inset-0 rounded-3xl border border-white/15 pointer-events-none shadow-inner" />
        </>
      )}
    </div>
  );
}

