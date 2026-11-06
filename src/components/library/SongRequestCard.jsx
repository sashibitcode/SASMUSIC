import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  Music,
  AlertCircle,
  Loader2,
  Lock,
  LogIn,
  ShieldCheck
} from 'lucide-react';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { showFloatingToast } from '../../utils/toast';

export function SongRequestCard({ searchQuery = '', onClearSearch }) {
  const { user, isSignedIn } = useUser();
  const [songTitle, setSongTitle] = useState(searchQuery);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds

  // Keep input synced if searchQuery changes
  useEffect(() => {
    if (searchQuery && !isSuccess) {
      setSongTitle(searchQuery);
    }
  }, [searchQuery, isSuccess]);

  // 10-Minute live timer after request is sent
  useEffect(() => {
    let timer;
    if (isSuccess && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSuccess, countdown]);

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!isSignedIn) {
      setErrorMessage('Please sign in to submit a song request');
      return;
    }

    if (!songTitle || !songTitle.trim()) {
      setErrorMessage('Please enter the song title');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/request-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songName: songTitle.trim(),
          userName: user?.fullName || user?.firstName || 'Verified User',
          userEmail: user?.primaryEmailAddress?.emailAddress || ''
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit song request');
      }

      setIsSuccess(true);
      showFloatingToast('Song request sent! We will add it soon ⚡', 'success');
    } catch (err) {
      setErrorMessage(err.message || 'Server error. Please try again shortly.');
      showFloatingToast(err.message || 'Request failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto my-6 rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#1c1212]/95 via-[#141a16]/95 to-[#0b140f]/95 border border-[#A31C1B]/40 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-left relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Background ambient crimson glow */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#A31C1B]/15 rounded-full blur-3xl pointer-events-none" />

      {isSuccess ? (
        /* Success Confirmation View */
        <div className="text-center py-4 space-y-3 relative z-10 animate-in fade-in duration-300">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Request Received! 🎉
            </h4>
            <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
              We've received your request for <span className="text-[#fca5a5] font-semibold font-mono">"{songTitle}"</span>. Enjoy it soon!
            </p>
          </div>

          {/* 10-Min Live Countdown Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/40 border border-[#A31C1B]/35 shadow-inner">
            <Clock className="w-4 h-4 text-[#fca5a5] animate-pulse" />
            <span className="text-xs font-semibold text-slate-200">
              Expected addition in:{' '}
              <span className="font-mono font-bold text-[#fca5a5]">
                ~{formatCountdown(countdown)}
              </span>
            </span>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setIsSuccess(false);
                setSongTitle('');
                setCountdown(600);
                onClearSearch?.();
              }}
              className="px-4 py-2 rounded-xl glass-card hover:border-[#A31C1B]/40 text-xs font-medium text-slate-300 hover:text-white transition-all active:scale-95"
            >
              Search another song
            </button>
          </div>
        </div>
      ) : !isSignedIn ? (
        /* Gated Authentication View (Guests cannot send without login) */
        <div className="space-y-4 relative z-10">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#A31C1B]/20 border border-[#A31C1B]/35 text-[#fca5a5] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Music className="w-5 h-5 text-[#fca5a5]" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Missing Your Favourite Song?
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  Send a request and enjoy it soon!
                </p>
              </div>
            </div>

            <span className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#A31C1B]/20 text-[#fca5a5] border border-[#A31C1B]/40 shadow-sm flex items-center gap-1 whitespace-nowrap">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Within 10 Mins ⚡</span>
            </span>
          </div>

          {/* Searched Song Name Preview */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#fca5a5] flex-shrink-0">
              <Music className="w-4 h-4 text-[#fca5a5]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Requested Track:</span>
              <span className="text-xs sm:text-sm font-bold text-white truncate block">
                "{songTitle || searchQuery}"
              </span>
            </div>
          </div>

          {/* Anti-Spam Login Wall */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#171212] to-[#0c1611] border border-[#A31C1B]/30 space-y-3 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#A31C1B]/20 border border-[#A31C1B]/40 flex items-center justify-center text-[#fca5a5]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-bold text-white">
                Sign In to Request This Song
              </h5>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                Sign in with Google in 1 click to send your song request directly to the library.
              </p>
            </div>

            <SignInButton mode="modal">
              <button
                type="button"
                className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl crimson-glow-btn text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#A31C1B]/30 transition-all active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Request Now</span>
              </button>
            </SignInButton>
          </div>
        </div>
      ) : (
        /* Logged-In Verified Form View */
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#A31C1B]/20 border border-[#A31C1B]/35 text-[#fca5a5] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Music className="w-5 h-5 text-[#fca5a5]" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Missing Your Favourite Song?
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  Send a request and enjoy it soon!
                </p>
              </div>
            </div>

            <span className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#A31C1B]/20 text-[#fca5a5] border border-[#A31C1B]/40 shadow-sm flex items-center gap-1 whitespace-nowrap">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Within 10 Mins ⚡</span>
            </span>
          </div>

          {/* Verified User Identity Chip */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-[#A31C1B] text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                {(user?.firstName?.[0] || 'U').toUpperCase()}
              </div>
              <span className="text-slate-200 truncate font-medium">
                {user?.fullName || user?.firstName}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex-shrink-0">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified Account</span>
            </span>
          </div>

          {/* Song Title Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-300">
              Song Title / Artist / Movie:
            </label>
            <div className="relative">
              <input
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="e.g. Chaleya - Jawan, Kesariya, Pawan Singh..."
                className="w-full bg-[#06110c]/80 border border-white/15 focus:border-[#A31C1B] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-1 focus:ring-[#A31C1B]/50"
                maxLength={120}
                required
              />
            </div>
          </div>

          {/* Error notice if any */}
          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/25 px-3 py-2 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Request Now Button */}
          <button
            type="submit"
            disabled={isSubmitting || !songTitle.trim()}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl crimson-glow-btn text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#A31C1B]/25 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Request...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Request Now</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
