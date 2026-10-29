import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Heart,
  MoreVertical,
  Plus,
  ListPlus,
  Music2,
  Folder,
  Disc
} from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { getSongGradientStyle } from '../../utils/artGenerator';
import { VisualizerBars } from '../player/VisualizerBars';
import { formatFileSize } from '../../utils/formatters';

export function SongRow({ song, index, playlist = null }) {
  const { currentSong, isPlaying, playSong, togglePlay, addToQueue, playNextInQueue } = useAudio();
  const { isFavorite, toggleFavorite, localPlaylists, addSongToPlaylist } = useLibrary();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPlaylistsSubmenu, setShowPlaylistsSubmenu] = useState(false);
  const menuRef = useRef(null);

  const isCurrent = currentSong && currentSong.id === song.id;
  const isFav = isFavorite(song.id);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
        setShowPlaylistsSubmenu(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handlePlayClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, playlist);
    }
  };

  return (
    <div
      onClick={handlePlayClick}
      className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-2xl transition-all duration-200 cursor-pointer border ${
        isCurrent
          ? 'bg-[#06110c] border-[#A31C1B] shadow-[0_6px_28px_rgba(6,17,12,0.95),_0_0_15px_rgba(163,28,27,0.35)] ring-1 ring-[#A31C1B]/80'
          : 'glass-card hover:translate-x-0.5'
      }`}
    >
      {/* Left: Thumbnail & Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Track Index or Visualizer */}
        <span className="w-5 text-center text-xs font-semibold text-slate-500 group-hover:text-slate-300 hidden sm:block">
          {isCurrent ? (
            <VisualizerBars isPlaying={isPlaying} className="h-3 w-3 mx-auto" />
          ) : (
            index !== undefined ? index + 1 : <Music2 className="w-3.5 h-3.5 mx-auto" />
          )}
        </span>

        {/* Dynamic Gradient Art */}
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden group-hover:shadow-md transition-shadow ${
            isCurrent ? 'ring-2 ring-[#A31C1B] ring-offset-2 ring-offset-[#06110c]' : ''
          }`}
          style={getSongGradientStyle(song.title, song.artist)}
        >
          {isCurrent && isPlaying ? (
            <Disc className="w-5 h-5 text-white animate-[spin_4s_linear_infinite]" />
          ) : (
            <Music2 className="w-5 h-5 text-white/90" />
          )}

          {/* Hover play icon overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            {isCurrent && isPlaying ? (
              <Pause className="w-4 h-4 text-white fill-white" />
            ) : (
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Title and Artist */}
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2">
            <p
              className={`text-xs sm:text-sm font-bold truncate transition-colors ${
                isCurrent ? 'text-white' : 'text-slate-100 group-hover:text-white'
              }`}
            >
              {song.title}
            </p>
            {isCurrent && (
              <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold bg-[#A31C1B] text-white px-2 py-0.5 rounded-full shadow-sm flex-shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full bg-white ${isPlaying ? 'animate-pulse' : ''}`} />
                {isPlaying ? 'Playing' : 'Paused'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`text-[11px] truncate ${
                isCurrent ? 'text-emerald-300 font-medium' : 'text-slate-400'
              }`}
            >
              {song.artist}
            </span>
            {song.folderName && song.folderName !== 'Main Folder' && song.folderName !== 'Main Drive' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#fca5a5] bg-[#06110c] px-1.5 py-0.2 rounded border border-[#A31C1B]/40">
                <Music2 className="w-2.5 h-2.5 text-[#A31C1B]" />
                {song.folderName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div
        className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Favorite Heart - 44x44px touch target */}
        <button
          onClick={() => toggleFavorite(song.id)}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-transform active:scale-90 ${
            isFav
              ? 'text-[#A31C1B] hover:text-[#e2403f]'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-[#A31C1B]' : ''}`} />
        </button>

        {/* More Options Context Menu - 44x44px touch target */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-[#222222] transition-colors active:scale-90"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-[#171717] border border-[#282f2b] shadow-2xl py-1.5 z-40 text-xs">
              <button
                onClick={() => {
                  addToQueue(song);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-200 hover:bg-[#222222] hover:text-white text-left transition-colors"
              >
                <Plus className="w-4 h-4 text-[#A31C1B]" />
                <span>Add to Queue</span>
              </button>

              <button
                onClick={() => {
                  playNextInQueue(song);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-200 hover:bg-[#222222] hover:text-white text-left transition-colors"
              >
                <ListPlus className="w-4 h-4 text-[#A31C1B]" />
                <span>Play Next</span>
              </button>

              {/* Add to Playlist sub-options */}
              {localPlaylists.length > 0 && (
                <div className="border-t border-[#282f2b] mt-1 pt-1">
                  <p className="px-3.5 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Add to Playlist:
                  </p>
                  {localPlaylists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => {
                        addSongToPlaylist(pl.id, song.id);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-1.5 text-slate-300 hover:bg-[#222222] hover:text-[#fca5a5] text-left truncate"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A31C1B]" />
                      <span className="truncate">{pl.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

