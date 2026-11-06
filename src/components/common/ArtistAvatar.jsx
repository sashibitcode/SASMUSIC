import React, { useState, useEffect } from 'react';
import { Mic2 } from 'lucide-react';
import { getArtistPhoto, fetchArtistPhoto, getArtistSlug, CDN_ARTIST_PHOTOS } from '../../services/artistPhotoService';

const SIZES = {
  xs: 'w-7 h-7 text-[10px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-14 h-14 sm:w-16 sm:h-16 text-sm sm:text-base',
  lg: 'w-20 h-20 text-lg',
  xl: 'w-28 h-28 text-2xl'
};

export function ArtistAvatar({
  artistName = '',
  size = 'md',
  showRing = true,
  className = ''
}) {
  const [photoUrl, setPhotoUrl] = useState(() => getArtistPhoto(artistName));
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const initial = getArtistPhoto(artistName);
    setPhotoUrl(initial);
    setHasError(false);
    setIsLoaded(false);

    if (!initial) {
      fetchArtistPhoto(artistName).then((url) => {
        if (isCurrent && url) {
          setPhotoUrl(url);
        }
      });
    }

    return () => {
      isCurrent = false;
    };
  }, [artistName]);

  const sizeClass = SIZES[size] || SIZES.md;

  // Generate deterministic gradient hue for fallback avatar
  const hash = (artistName || 'A').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  const initials = (artistName || 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const handleImageError = () => {
    // If local path failed, try CDN
    const slug = getArtistSlug(artistName);
    if (CDN_ARTIST_PHOTOS[slug] && photoUrl !== CDN_ARTIST_PHOTOS[slug]) {
      setPhotoUrl(CDN_ARTIST_PHOTOS[slug]);
    } else {
      setHasError(true);
    }
  };

  return (
    <div
      className={`relative rounded-full flex-shrink-0 select-none overflow-hidden ${sizeClass} ${
        showRing
          ? 'p-0.5 border border-white/10 group-hover:border-[#A31C1B] group-hover:shadow-[0_0_15px_rgba(163,28,27,0.5)] transition-all duration-300'
          : ''
      } ${className}`}
      style={
        showRing
          ? { background: `linear-gradient(135deg, hsl(${hue}, 60%, 25%), #06110c)` }
          : undefined
      }
    >
      <div className="w-full h-full rounded-full overflow-hidden bg-[#121614] relative flex items-center justify-center">
        {photoUrl && !hasError ? (
          <img
            src={photoUrl}
            alt={artistName}
            onLoad={() => setIsLoaded(true)}
            onError={handleImageError}
            loading="lazy"
            className={`w-full h-full object-cover rounded-full transition-all duration-300 group-hover:scale-110 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : null}

        {/* Fallback initial avatar while loading or if no photo */}
        {(!photoUrl || hasError || !isLoaded) && (
          <div
            className="absolute inset-0 flex items-center justify-center font-extrabold text-white"
            style={{
              background: `linear-gradient(135deg, hsl(${hue}, 50%, 20%), #121614)`
            }}
          >
            {initials}
          </div>
        )}
      </div>
    </div>
  );
}

