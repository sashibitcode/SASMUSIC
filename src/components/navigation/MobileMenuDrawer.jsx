import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Users,
  Moon,
  Clock,
  Download,
  ExternalLink,
  Sparkles,
  LogOut,
  LogIn,
  Check,
  Music2,
  Folder,
  ShieldCheck,
  Cloud,
  Upload
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { SignedIn, SignedOut, SignInButton, SignOutButton, useUser } from '@clerk/clerk-react';
import { IS_CLERK_CONFIGURED } from '../../config/clerkConfig';
import { markSignInAction } from '../auth/AuthControls';
import { useAudio } from '../../contexts/AudioContext';
import { showFloatingToast } from '../../utils/toast';

const SLEEP_TIMER_OPTIONS = [
  { label: 'Off', minutes: 0 },
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '60m', minutes: 60 }
];

export function MobileMenuDrawer({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenSync,
  onOpenUpload,
  onSelectCategory
}) {
  const { user } = useUser();
  const { isPlaying, pauseSong } = useAudio();

  // Sleep Timer local state
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Sleep timer interval countdown
  useEffect(() => {
    if (sleepTimerMinutes <= 0) {
      setRemainingSeconds(0);
      return;
    }

    setRemainingSeconds(sleepTimerMinutes * 60);

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSleepTimerMinutes(0);
          pauseSong?.();
          showFloatingToast('Sleep timer ended. Music paused 🌙', 'info');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerMinutes, pauseSong]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatRemainingTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCategoryClick = (catId) => {
    onSelectCategory?.(catId);
    onClose();
  };

  const handleSettingsClick = () => {
    onClose();
    setTimeout(() => {
      onOpenSettings?.();
    }, 150);
  };

  const handleUploadClick = () => {
    onClose();
    setTimeout(() => {
      onOpenUpload?.();
    }, 150);
  };

  const handleSyncClick = () => {
    onClose();
    setTimeout(() => {
      onOpenSync?.();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end md:hidden animate-in fade-in duration-200">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        className="relative w-[85%] max-w-sm h-full bg-[#121614]/98 backdrop-blur-2xl border-l border-white/[0.08] shadow-2xl flex flex-col z-10 overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-300"
        aria-label="Mobile Navigation Menu"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-[#06110c]/80 sticky top-0 z-10 pt-safe">
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-auto" />
            <span className="text-[10px] font-bold text-slate-300 px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10">
              Menu
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-90"
            aria-label="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account / Profile Section */}
        <div className="p-4 border-b border-white/[0.08] bg-white/[0.02]">
          {IS_CLERK_CONFIGURED ? (
            <>
              <SignedIn>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 flex-shrink-0 bg-[#06110c] shadow-md">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.fullName || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-base bg-white/10">
                        {(user?.firstName?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate">
                      {user?.fullName || user?.firstName || 'Music Lover'}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {user?.primaryEmailAddress?.emailAddress || 'Signed In'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <SignOutButton redirectUrl="/">
                    <button
                      onClick={onClose}
                      className="w-full min-h-[38px] flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all active:scale-95"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out from Account</span>
                    </button>
                  </SignOutButton>
                </div>
              </SignedIn>

              <SignedOut>
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-300">
                      <LogIn className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Sign In to Save Favorites</h4>
                    </div>
                  </div>

                  <SignInButton mode="modal">
                    <button
                      onClick={() => {
                        markSignInAction();
                        onClose();
                      }}
                      className="w-full min-h-[38px] mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-xl crimson-glow-btn text-white text-xs font-bold shadow-md transition-all active:scale-95"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In with Google</span>
                    </button>
                  </SignInButton>
                </div>
              </SignedOut>
            </>
          ) : (
            <div className="text-xs text-slate-400">
              <span>Guest Mode Active</span>
            </div>
          )}
        </div>

        {/* Main Menu Actions */}
        <div className="p-3 space-y-1">
          <p className="px-3 pb-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Quick Actions
          </p>

          {/* 1. Upload Song (Creator Studio) */}
          {onOpenUpload && (
            <button
              onClick={handleUploadClick}
              className="w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors active:scale-95 group border border-white/10 bg-white/[0.03] shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 text-slate-300 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                  <Upload className="w-4 h-4 text-slate-300" />
                </div>
                <span className="font-bold text-white">Upload Song</span>
              </div>
              <span className="text-[10px] text-slate-300 font-semibold bg-white/10 px-2 py-0.5 rounded-full border border-white/15">Admin</span>
            </button>
          )}

          {/* 2. Settings & Drive Setup */}
          <button
            onClick={handleSettingsClick}
            className="w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors active:scale-95 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 text-slate-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Settings className="w-4 h-4 text-slate-300 group-hover:rotate-45 transition-transform" />
              </div>
              <span className="font-bold">Settings</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">›</span>
          </button>

          {/* 3. Listen Together (SyncPlay) */}
          <button
            onClick={handleSyncClick}
            className="w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/[0.06] transition-colors active:scale-95 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/35 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-bold">Listen Together</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25">Live</span>
          </button>

          {/* 3. Sleep Timer */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold text-white">Sleep Timer</span>
              </div>
              {remainingSeconds > 0 && (
                <span className="text-[11px] font-mono font-bold text-white bg-white/15 border border-white/20 px-2 py-0.5 rounded-full">
                  {formatRemainingTime(remainingSeconds)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {SLEEP_TIMER_OPTIONS.map((opt) => {
                const isActive = sleepTimerMinutes === opt.minutes;
                return (
                  <button
                    key={opt.label}
                    onClick={() => {
                      setSleepTimerMinutes(opt.minutes);
                      if (opt.minutes > 0) {
                        showFloatingToast(`Sleep timer set to ${opt.label} 🌙`, 'success');
                      } else {
                        showFloatingToast('Sleep timer turned off', 'info');
                      }
                    }}
                    className={`py-1.5 rounded-lg text-[10px] font-semibold transition-all active:scale-90 ${isActive
                        ? 'bg-white text-slate-900 font-bold shadow-sm'
                        : 'bg-white/[0.05] text-slate-300 hover:bg-white/10'
                      }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Music Collections & Moods Shortcut */}
        <div className="p-3 border-t border-white/[0.08]">
          <p className="px-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Music Collections
          </p>

          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'hindi', label: 'Hindi Bollywood', emoji: '🇮🇳' },
              { id: 'bhojpuri', label: 'Bhojpuri Dhamaka', emoji: '🌾' },
              { id: 'gym', label: 'Gym & Workout', emoji: '🏋️' },
              { id: 'romantic', label: 'Love & Romantic', emoji: '💖' },
              { id: 'retro', label: '90s Retro Gold', emoji: '📻' },
              { id: 'punjabi', label: 'Punjabi Beats', emoji: '🔥' }
            ].map((col) => (
              <button
                key={col.id}
                onClick={() => handleCategoryClick(col.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] text-xs text-slate-300 hover:text-white transition-colors text-left"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 flex-shrink-0" />
                <span className="truncate text-[11px] font-medium">{col.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer / Developer Credits */}
        <div className="mt-auto p-4 border-t border-white/[0.08] bg-[#06110c]/80 space-y-2 pb-safe">
          <a
            href="https://sashibitcode.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/20 transition-all group"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                Shashikant Raj
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                @sashibitcode • Full Stack Dev
              </span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:scale-110 transition-transform" />
          </a>

          <div className="text-center text-[10px] text-slate-500 pt-1">
            <span>SAS Music PWA v1.2.0 • Ad-Free Streaming</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

