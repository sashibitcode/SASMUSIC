import React, { useState, useMemo } from 'react';
import {
  Bell,
  Play,
  Pause,
  Download,
  Check,
  Sparkles,
  ChevronLeft,
  HelpCircle,
  Smartphone,
  Music,
  Share2,
  X,
  Volume2
} from 'lucide-react';
import { useDrive } from '../../contexts/DriveContext';
import { useAudio } from '../../contexts/AudioContext';
import { isSongInCategory } from '../../utils/categoryExtractor';
import { downloadRingtoneAudio, isRingtoneSong } from '../../utils/ringtoneRegistry';

export function RingtonesView({ onClose }) {
  const { songs } = useDrive();
  const { currentSong, isPlaying, playSong, togglePlayPause, playDynamicMix } = useAudio();

  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadedIds, setDownloadedIds] = useState(new Set());
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Extract all ringtone tracks from library
  const ringtoneSongs = useMemo(() => {
    return (songs || []).filter((s) => isSongInCategory(s, 'ringtone') || isRingtoneSong(s));
  }, [songs]);

  const handlePlaySong = (song) => {
    if (currentSong?.id === song.id) {
      togglePlayPause();
    } else {
      playSong(song, ringtoneSongs);
    }
  };

  const handleDownload = async (e, song) => {
    e.stopPropagation();
    if (downloadingId === song.id) return;

    setDownloadingId(song.id);
    try {
      await downloadRingtoneAudio(song);
      setDownloadedIds((prev) => new Set([...prev, song.id]));
      setTimeout(() => {
        setDownloadedIds((prev) => {
          const next = new Set(prev);
          next.delete(song.id);
          return next;
        });
      }, 5000);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-200">
      {/* Top Navigation / Back Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="min-h-[40px] flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors active:scale-95 px-1"
        >
          <ChevronLeft className="w-4 h-4 text-slate-400" />
          <span>Back to Home</span>
        </button>
      )}

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-amber-950/40 via-[#171717] to-[#06110c] border border-amber-500/20 shadow-lg">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-500/25 to-rose-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <Bell className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 animate-bounce" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                  Phone Ringtones
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm uppercase tracking-wide">
                  Caller Tunes
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Bhakti mantras, trending reel beats & devotional songs. Ek click me download karein aur phone me ringtone set karein!
              </p>
            </div>
          </div>

          {/* Action buttons: Play All, Shuffle & Help */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => ringtoneSongs.length > 0 && playDynamicMix(ringtoneSongs)}
              disabled={ringtoneSongs.length === 0}
              className="flex-1 sm:flex-none min-h-[42px] flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play All</span>
            </button>

            <button
              onClick={() => ringtoneSongs.length > 0 && playDynamicMix(ringtoneSongs)}
              disabled={ringtoneSongs.length === 0}
              className="min-h-[42px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl glass-card hover:border-white/20 text-slate-200 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
              title="Shuffle Mix"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Shuffle</span>
            </button>

            <button
              onClick={() => setIsHelpOpen(true)}
              className="min-h-[42px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 text-xs font-semibold transition-all active:scale-95"
              title="Ringtone kaise lagayein?"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">How to Set?</span>
            </button>
          </div>
        </div>

        {/* Live track count counter badge */}
        <div className="relative z-10 mt-3 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{ringtoneSongs.length} Verified Ringtones</span>
          </div>
          <span className="text-amber-400/90 font-mono text-[10px]">
            Original High-Quality Audio
          </span>
        </div>
      </div>

      {/* Ringtones Card List */}
      <div className="space-y-2.5">
        {ringtoneSongs.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-slate-400 space-y-2">
            <Bell className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm">Ringtone songs are loading from Google Drive...</p>
          </div>
        ) : (
          ringtoneSongs.map((song, idx) => {
            const isCurrent = currentSong?.id === song.id;
            const isCurrentPlaying = isCurrent && isPlaying;
            const isDownloading = downloadingId === song.id;
            const isDownloaded = downloadedIds.has(song.id);

            return (
              <div
                key={song.id || idx}
                onClick={() => handlePlaySong(song)}
                className={`group relative rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer border ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-[#171717]/80 hover:bg-[#1f1f1f] border-white/[0.06] hover:border-white/15'
                }`}
              >
                {/* Left: Play/Pause button + Track Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Play Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySong(song);
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-90 ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    aria-label={isCurrentPlaying ? 'Pause' : 'Play'}
                  >
                    {isCurrentPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isCurrent ? 'text-amber-400 font-extrabold' : 'text-white'
                        }`}
                      >
                        {song.title}
                      </h3>

                      {song.tag && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                          {song.tag}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {song.artist || 'Unknown Artist'}
                    </p>
                  </div>
                </div>

                {/* Right: Audio Visualizer + Download Action Button */}
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  {/* Live playing wave indicator */}
                  {isCurrentPlaying && (
                    <div className="hidden sm:flex items-center gap-0.5 h-3.5">
                      <span className="w-0.5 h-full bg-amber-400 rounded-full animate-pulse" />
                      <span className="w-0.5 h-2/3 bg-amber-400 rounded-full animate-pulse delay-75" />
                      <span className="w-0.5 h-4/5 bg-amber-400 rounded-full animate-pulse delay-150" />
                    </div>
                  )}

                  {/* Download Action Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDownload(e, song)}
                    disabled={isDownloading}
                    className={`min-h-[38px] min-w-[38px] sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                      isDownloaded
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : isDownloading
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        : 'bg-white/[0.08] hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-white/10 hover:border-amber-400'
                    }`}
                    title="Download Ringtone MP3"
                    aria-label={`Download ${song.title}`}
                  >
                    {isDownloaded ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">Downloaded</span>
                      </>
                    ) : isDownloading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        <span className="hidden sm:inline">Saving...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* "How to Set as Ringtone" Help Modal */}
      {isHelpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsHelpOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#171717] border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Phone me Ringtone kaise lagayein?
                </h3>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
                <span className="font-bold text-amber-400">Step 1: Download</span>
                <p>Kissi bhi song ke aage bane <b>Download</b> button par click karein. MP3 file aapke phone ke Downloads folder me save ho jayegi.</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
                <span className="font-bold text-amber-400">Step 2: Phone Settings</span>
                <p>Apne phone ki <b>Settings</b> kholiye aur <b>Sound & Vibration</b> (ध्वनि और कंपन) par tap kijiye.</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
                <span className="font-bold text-amber-400">Step 3: Select File</span>
                <p><b>Phone Ringtone</b> par tap karein aur <b>"On this device"</b> ya <b>"Custom ringtone / Select from files"</b> chuniye.</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
                <span className="font-bold text-amber-400">Step 4: Set as Ringtone</span>
                <p>Downloaded ringtone ko select karein aur Apply kar dein. Aapki phone ringtone set ho gayi! 🎉</p>
              </div>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full min-h-[42px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md active:scale-95"
            >
              Samajh Gaya (Done)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
