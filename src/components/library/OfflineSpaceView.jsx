import React, { useState, useEffect } from 'react';
import { Play, Shuffle, Globe, Lock, CheckCircle2, Wifi, WifiOff } from 'lucide-react';
import { useDrive } from '../../contexts/DriveContext';
import { useAudio } from '../../contexts/AudioContext';
import { SongRow } from './SongRow';
import { shuffleArray } from '../../utils/shuffle';

export function OfflineSpaceView() {
  const { offlineSongs = [], switchVipMode, lockPrivateSpace } = useDrive();
  const { playSong } = useAudio();
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handlePlayAll = () => {
    if (offlineSongs.length > 0) {
      playSong(offlineSongs[0], offlineSongs, 0);
    }
  };

  const handleShufflePlay = () => {
    if (offlineSongs.length > 0) {
      const shuffled = shuffleArray(offlineSongs, Date.now());
      playSong(shuffled[0], shuffled, 0);
    }
  };

  return (
    <div className="space-y-4 pb-12 select-none">
      {/* Top Banner / Mode Header */}
      <div className="rounded-2xl p-4 sm:p-5 bg-[#171717] border border-[#282f2b] shadow-md space-y-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
              For You ❤️
            </h1>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              {isOnline ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Wifi className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Online • Auto-Sync Active</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-300">
                  <WifiOff className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Offline Mode • 0 Internet Needed</span>
                </span>
              )}
              <span>•</span>
              <span>{offlineSongs.length} {offlineSongs.length === 1 ? 'song' : 'songs'} ready</span>
            </div>
          </div>

          {/* Quick Switch Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => switchVipMode('online')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-colors active:scale-95"
              title="Browse 500+ online songs"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Browse Online Songs</span>
            </button>

            <button
              onClick={lockPrivateSpace}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors active:scale-95"
              title="Lock & hide private space"
              aria-label="Lock Private Space"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        {offlineSongs.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-[#282f2b]">
            <span className="text-[11px] font-medium text-emerald-400/90 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>100% saved in phone memory</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShufflePlay}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card hover:border-white/20 text-slate-200 text-xs font-medium transition-all active:scale-95"
              >
                <Shuffle className="w-3.5 h-3.5 text-slate-300" />
                <span>Shuffle</span>
              </button>

              <button
                onClick={handlePlayAll}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl crimson-glow-btn text-white text-xs font-semibold transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play All</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Song List or Empty State */}
      {offlineSongs.length === 0 ? (
        <div className="rounded-2xl p-8 bg-[#171717] border border-[#282f2b] text-center space-y-3 my-4">
          <p className="text-sm font-bold text-white">
            Abhi koi song offline space me nahi hai
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Google Drive ke <strong>"For You ❤️"</strong> folder me songs upload karein ya online library me kisi bhi gaane par <strong>"Send to Offline Space"</strong> tap karein!
          </p>
          <button
            onClick={() => switchVipMode('online')}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-200 transition-colors active:scale-95"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Browse Online Library</span>
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {offlineSongs.map((song, index) => (
            <SongRow
              key={song.id}
              song={song}
              index={index}
              playlist={offlineSongs}
            />
          ))}
        </div>
      )}
    </div>
  );
}
