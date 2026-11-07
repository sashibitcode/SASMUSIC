import React from 'react';
import { ArrowLeft, Play, Shuffle, Music2, Sparkles, Folder } from 'lucide-react';
import { MUSIC_CATEGORIES } from '../../utils/categoryExtractor';
import { getFolderCoverArt } from '../../services/coverArtService';
import { ArtistAvatar } from '../common/ArtistAvatar';
import { getArtistPhoto } from '../../services/artistPhotoService';
import { useAudio } from '../../contexts/AudioContext';

export function CategoryBanner({
  activeFilter = { type: 'all', value: null },
  songCount = 0,
  onClearFilter,
  onPlayAll,
  onShuffle
}) {
  const { playSong } = useAudio();

  if (!activeFilter || activeFilter.type === 'all' || !activeFilter.value) {
    return null;
  }

  const { type, value } = activeFilter;

  // Resolve category metadata
  let title = value;
  let subtitle = `${songCount} track${songCount === 1 ? '' : 's'}`;
  let emoji = '🎵';
  let gradient = 'from-[#A31C1B]/30 via-[#1c1212] to-[#121614]';
  let badgeText = 'Collection';
  let bgImage = getFolderCoverArt(value);

  if (type === 'category' || type === 'genre') {
    const cat = MUSIC_CATEGORIES.find((c) => c.id === value.toLowerCase());
    if (cat) {
      title = cat.label;
      emoji = cat.emoji;
      subtitle = `${songCount} track${songCount === 1 ? '' : 's'} • ${cat.desc}`;
      gradient = cat.gradient;
      badgeText = cat.badge || 'Category';
    }
  } else if (type === 'artist') {
    title = value;
    emoji = '🎙️';
    subtitle = `${songCount} track${songCount === 1 ? '' : 's'} by ${value}`;
    gradient = 'from-indigo-600/30 via-[#181528] to-[#121614]';
    badgeText = 'Artist';
    bgImage = getArtistPhoto(value) || bgImage;
  } else if (type === 'playlist') {
    title = value;
    emoji = '📁';
    subtitle = `${songCount} track${songCount === 1 ? '' : 's'} in Drive playlist`;
    gradient = 'from-emerald-600/25 via-[#0e2417] to-[#121614]';
    badgeText = 'Drive Folder';
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 mb-4 bg-gradient-to-br ${gradient} border border-white/15 shadow-2xl animate-in fade-in zoom-in-95 duration-200`}>
      {/* Cover image background with clear visibility */}
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 pointer-events-none"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}

      {/* Protective gradient scrim for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#06110c]/80 via-transparent to-transparent pointer-events-none" />

      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Back to All Songs */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <button
          onClick={onClearFilter}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card hover:border-[#A31C1B]/50 text-xs font-semibold text-slate-200 hover:text-white transition-all active:scale-95 group shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform group-hover:-translate-x-0.5" />
          <span>All Songs</span>
        </button>

        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10">
          {badgeText}
        </span>
      </div>

      {/* Main Banner Info */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {type === 'artist' ? (
              <ArtistAvatar
                artistName={value}
                size="lg"
                showRing={true}
                className="shadow-2xl flex-shrink-0"
              />
            ) : (
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Music2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                {title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-1 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Play All & Shuffle */}
        {songCount > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0 pt-1 sm:pt-0">
            <button
              onClick={onPlayAll}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-full crimson-glow-btn text-white text-xs font-bold transition-all active:scale-95 shadow-lg shadow-[#A31C1B]/40"
              title="Play All Songs in Collection"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play All</span>
            </button>

            <button
              onClick={onShuffle}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full glass-card hover:border-white/20 text-slate-200 hover:text-white text-xs font-semibold transition-all active:scale-95 shadow-sm"
              title="Shuffle Collection"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Shuffle</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

